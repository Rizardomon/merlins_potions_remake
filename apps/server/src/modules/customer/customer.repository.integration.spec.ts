import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../database/database.module";
import * as entities from "../../database/entities";
import { DrizzleCustomerRepository, type CreateCustomerInput } from "./customer.repository";

/**
 * Integração do repository Drizzle com Postgres. Opt-in via `TEST_DATABASE_URL`, no mesmo
 * padrão da migration (um database descartável por execução):
 *
 *   TEST_DATABASE_URL=postgres://app:app@localhost:55432/app \
 *     pnpm --filter @merlins-potions-remake/server test:integration
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

const migrationsFolder = join(__dirname, "..", "..", "database", "migrations");

integration("DrizzleCustomerRepository (integration)", () => {
  let adminPool: Pool | undefined;
  let pool: Pool | undefined;
  let databaseName: string | undefined;
  let repository: DrizzleCustomerRepository;

  const seedCustomer = (email: string, fullName = "Merlin Ambrosius"): Promise<entities.CustomerRow> =>
    repository.create({
      fullName,
      email,
      passwordHash: "$argon2id$fake-hash",
      newsletterOptIn: true,
      termsAcceptedAt: new Date("2026-11-12T00:00:00Z"),
    } satisfies CreateCustomerInput);

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: testDatabaseUrl });

    databaseName = `mp002_repo_${Date.now()}_${randomBytes(4).toString("hex")}`;
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);

    const url = new URL(testDatabaseUrl!);
    url.pathname = `/${databaseName}`;
    pool = new Pool({ connectionString: url.toString() });
    const db = drizzle(pool, { schema: entities }) as Database;

    await migrate(db, { migrationsFolder });
    repository = new DrizzleCustomerRepository(db);
  }, 60_000);

  afterAll(async () => {
    await pool?.end();

    if (adminPool && databaseName) {
      await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    }

    await adminPool?.end();
  }, 60_000);

  it("persiste customer, encontra por email e atualiza lockout/contador", async () => {
    const created = await seedCustomer("merlin@example.com");
    const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);

    await expect(repository.findByEmail("merlin@example.com")).resolves.toMatchObject({
      id: created.id,
      fullName: "Merlin Ambrosius",
      failedSignInCount: 0,
      lockoutUntil: null,
    });

    const updated = await repository.update(created.id, {
      failedSignInCount: 5,
      lockoutUntil,
    });

    expect(updated).toMatchObject({ failedSignInCount: 5, lockoutUntil });

    const reloaded = await repository.findByEmail("merlin@example.com");
    expect(reloaded?.failedSignInCount).toBe(5);
    expect(reloaded?.lockoutUntil?.getTime()).toBe(lockoutUntil.getTime());
  });

  it("levanta erro de unicidade ao criar customer com email duplicado", async () => {
    await seedCustomer("nimue@example.com", "Nimue");

    await expect(seedCustomer("nimue@example.com", "Outra Nimue")).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("percorre o ciclo de sessão: create → findByTokenHash → delete", async () => {
    const customer = await seedCustomer("session@example.com");
    const session = await repository.createSession({
      customerId: customer.id,
      tokenHash: "session-token-hash",
      expiresAt: new Date("2026-12-12T00:00:00Z"),
    });

    await expect(repository.findSessionByTokenHash("session-token-hash")).resolves.toMatchObject({
      id: session.id,
      customerId: customer.id,
    });

    await repository.deleteSessionByTokenHash("session-token-hash");

    await expect(repository.findSessionByTokenHash("session-token-hash")).resolves.toBeNull();
  });

  it("deleteAllSessionsForCustomer revoga todas as sessões da conta", async () => {
    const customer = await seedCustomer("revoke@example.com");
    const other = await seedCustomer("keep@example.com");

    for (const tokenHash of ["revoke-1", "revoke-2"]) {
      await repository.createSession({
        customerId: customer.id,
        tokenHash,
        expiresAt: new Date("2026-12-12T00:00:00Z"),
      });
    }
    await repository.createSession({
      customerId: other.id,
      tokenHash: "keep-1",
      expiresAt: new Date("2026-12-12T00:00:00Z"),
    });

    await repository.deleteAllSessionsForCustomer(customer.id);

    await expect(repository.findSessionByTokenHash("revoke-1")).resolves.toBeNull();
    await expect(repository.findSessionByTokenHash("revoke-2")).resolves.toBeNull();
    await expect(repository.findSessionByTokenHash("keep-1")).resolves.not.toBeNull();
  });

  it("percorre o ciclo de reset token: create → find → markUsed", async () => {
    const customer = await seedCustomer("reset@example.com");
    const token = await repository.createPasswordResetToken({
      customerId: customer.id,
      tokenHash: "reset-token-hash",
      expiresAt: new Date("2026-11-12T00:30:00Z"),
    });

    await expect(
      repository.findPasswordResetTokenByTokenHash("reset-token-hash"),
    ).resolves.toMatchObject({
      id: token.id,
      customerId: customer.id,
      usedAt: null,
    });

    const usedAt = new Date("2026-11-12T00:10:00Z");
    const used = await repository.markPasswordResetTokenUsed(token.id, usedAt);

    expect(used?.usedAt?.getTime()).toBe(usedAt.getTime());
    await expect(
      repository.findPasswordResetTokenByTokenHash("reset-token-hash"),
    ).resolves.toMatchObject({ usedAt });
  });
});
