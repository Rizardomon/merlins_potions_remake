import { randomBytes } from "node:crypto";
import { join } from "node:path";
import {
  type INestApplicationContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { SignInRequest, SignUpRequest } from "@merlins-potions-remake/shared";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../database/database.module";
import * as entities from "../../database/entities";
import {
  CUSTOMER_REPOSITORY,
  DrizzleCustomerRepository,
} from "./customer.repository";
import { CustomerService } from "./customer.service";

/**
 * Durabilidade exigida pelo PRD: conta criada por um processo/módulo continua autenticável
 * depois que o módulo é recriado contra o mesmo banco. Opt-in via `TEST_DATABASE_URL`, no
 * mesmo padrão dos demais testes de integração:
 *
 *   TEST_DATABASE_URL=postgres://app:app@localhost:55432/app \
 *     pnpm --filter @merlins-potions-remake/server test:integration
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

const migrationsFolder = join(__dirname, "..", "..", "database", "migrations");

const signUpInput: SignUpRequest = {
  fullName: "Merlin Ambrosius",
  email: "durable@example.com",
  password: "correct horse battery",
  newsletterOptIn: true,
  termsAccepted: true,
};

const signInInput: SignInRequest = {
  email: signUpInput.email,
  password: signUpInput.password,
  keepSignedIn: true,
};

integration("CustomerService durability (integration)", () => {
  let adminPool: Pool | undefined;
  let pool: Pool | undefined;
  let databaseName: string | undefined;
  let database: Database;

  async function createModule(): Promise<INestApplicationContext> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: new DrizzleCustomerRepository(database),
        },
      ],
    }).compile();

    return moduleRef;
  }

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: testDatabaseUrl });

    databaseName = `mp002_service_${Date.now()}_${randomBytes(4).toString("hex")}`;
    await adminPool.query(`CREATE DATABASE "${databaseName}"`);

    const url = new URL(testDatabaseUrl!);
    url.pathname = `/${databaseName}`;
    pool = new Pool({ connectionString: url.toString() });
    database = drizzle(pool, { schema: entities }) as Database;

    await migrate(database, { migrationsFolder });
  }, 60_000);

  afterAll(async () => {
    await pool?.end();

    if (adminPool && databaseName) {
      await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    }

    await adminPool?.end();
  }, 60_000);

  it("conta criada continua autenticável após recriar o módulo contra o mesmo banco", async () => {
    const firstModule = await createModule();
    const firstService = firstModule.get(CustomerService);
    const created = await firstService.signUp(signUpInput);
    await firstModule.close();

    const secondModule = await createModule();
    const secondService = secondModule.get(CustomerService);

    // A sessão criada antes da recriação continua válida no mesmo banco.
    await expect(
      secondService.resolveSession(created.sessionToken),
    ).resolves.toEqual(created.customer);

    const signedIn = await secondService.signIn(signInInput);

    expect(signedIn.customer).toEqual(created.customer);
    await expect(secondService.resolveSession(signedIn.sessionToken)).resolves.toEqual(
      created.customer,
    );
    await expect(
      secondService.signIn({ ...signInInput, password: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await secondModule.close();
  }, 60_000);
});
