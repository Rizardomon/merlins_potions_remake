import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { customer } from "./customer.entity";

/**
 * Integração real da migration com Postgres. Opt-in via `TEST_DATABASE_URL`, igual ao
 * teste de conexão do `DatabaseModule`:
 *
 *   TEST_DATABASE_URL=postgres://app:app@localhost:55432/app \
 *     pnpm --filter @merlins-potions-remake/server test:integration
 *
 * A migration referencia `public.customer` nas FKs, então o isolamento é por DATABASE:
 * um banco descartável é criado, as migrations são aplicadas nele e ele é removido no
 * fim. O usuário da URL precisa de permissão de CREATEDB (o `app` do compose é superuser).
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

const migrationsFolder = join(__dirname, "..", "..", "database", "migrations");

integration("customer migration (integration)", () => {
  let adminPool: Pool | undefined;
  let pool: Pool | undefined;
  let db: NodePgDatabase;
  let databaseName: string | undefined;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: testDatabaseUrl });

    databaseName = `mp002_test_${Date.now()}_${randomBytes(4).toString("hex")}`;
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);

    const url = new URL(testDatabaseUrl!);
    url.pathname = `/${databaseName}`;
    pool = new Pool({ connectionString: url.toString() });
    db = drizzle(pool);

    await migrate(db, { migrationsFolder });
  }, 60_000);

  afterAll(async () => {
    await pool?.end();

    if (adminPool && databaseName) {
      await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    }

    await adminPool?.end();
  }, 60_000);

  it("creates the three tables with their unique indexes on a clean database", async () => {
    const tables = await db.execute<{ table_name: string }>(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('customer', 'session', 'password_reset_token')
      order by table_name
    `);

    expect(tables.rows.map((row) => row.table_name)).toEqual([
      "customer",
      "password_reset_token",
      "session",
    ]);

    const uniqueColumns = await db.execute<{ table_name: string; column_name: string }>(sql`
      select t.relname as table_name, a.attname as column_name
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      join unnest(c.conkey) as key(attnum) on true
      join pg_attribute a on a.attrelid = t.oid and a.attnum = key.attnum
      where c.contype = 'u'
        and n.nspname = 'public'
        and t.relname in ('customer', 'session', 'password_reset_token')
      order by t.relname, a.attname
    `);

    expect(uniqueColumns.rows).toEqual([
      { table_name: "customer", column_name: "email" },
      { table_name: "password_reset_token", column_name: "token_hash" },
      { table_name: "session", column_name: "token_hash" },
    ]);
  });

  it("creates the customer foreign keys on session and password_reset_token", async () => {
    const foreignKeys = await db.execute<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      delete_rule: string;
    }>(sql`
      select
        tc.table_name,
        kcu.column_name,
        ccu.table_name as foreign_table_name,
        rc.delete_rule
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on kcu.constraint_name = tc.constraint_name
        and kcu.constraint_schema = tc.constraint_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
        and ccu.constraint_schema = tc.constraint_schema
      join information_schema.referential_constraints rc
        on rc.constraint_name = tc.constraint_name
        and rc.constraint_schema = tc.constraint_schema
      where tc.constraint_type = 'FOREIGN KEY'
        and tc.table_schema = 'public'
        and tc.table_name in ('session', 'password_reset_token')
      order by tc.table_name
    `);

    expect(foreignKeys.rows).toEqual([
      {
        table_name: "password_reset_token",
        column_name: "customer_id",
        foreign_table_name: "customer",
        delete_rule: "CASCADE",
      },
      {
        table_name: "session",
        column_name: "customer_id",
        foreign_table_name: "customer",
        delete_rule: "CASCADE",
      },
    ]);
  });

  it("applies database defaults when inserting a customer", async () => {
    const [row] = await db
      .insert(customer)
      .values({
        fullName: "Merlin Ambrosius",
        email: "merlin@example.com",
        passwordHash: "$argon2id$fake-hash",
        newsletterOptIn: true,
        termsAcceptedAt: new Date("2026-11-12T00:00:00Z"),
      })
      .returning();

    expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(row.failedSignInCount).toBe(0);
    expect(row.lockoutUntil).toBeNull();
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a second customer with the same email", async () => {
    const values = {
      fullName: "Nimue",
      email: "merlin@example.com",
      passwordHash: "$argon2id$other-hash",
      newsletterOptIn: false,
      termsAcceptedAt: new Date("2026-11-12T00:00:00Z"),
    };

    await expect(db.insert(customer).values(values)).rejects.toMatchObject({
      code: "23505",
    });

    const result = await db.execute<{ count: string }>(sql`
      select count(*)::text as count from customer where email = 'merlin@example.com'
    `);
    expect(result.rows[0]?.count).toBe("1");
  });
});
