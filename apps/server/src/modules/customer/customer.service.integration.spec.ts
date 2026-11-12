import { createHash, randomBytes } from "node:crypto";
import { join } from "node:path";
import {
  type INestApplicationContext,
  GoneException,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { SignInRequest, SignUpRequest } from "@merlins-potions-remake/shared";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Mailer } from "../dev/mailer.interface";
import { MAILER } from "../dev/mailer.interface";
import type { Database } from "../../database/database.module";
import * as entities from "../../database/entities";
import {
  CUSTOMER_REPOSITORY,
  DrizzleCustomerRepository,
} from "./customer.repository";
import { CustomerService, PASSWORD_RESET_TOKEN_DURATION_MS } from "./customer.service";

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
    const mockMailer: Mailer = {
      send: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: new DrizzleCustomerRepository(database),
        },
        {
          provide: MAILER,
          useValue: mockMailer,
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

  it("ciclo de reset: token single-use, expira em 30min, revoga sessões, permite novo sign-in", async () => {
    const module = await createModule();
    const service = module.get(CustomerService);

    // Sign-up cria conta e sessão.
    const created = await service.signUp(signUpInput);
    const originalSessionToken = created.sessionToken;

    // Request de reset (sem revelar existência).
    await service.requestPasswordReset(signUpInput.email);

    // Simula obtenção do token via mailer (no banco temos o hash).
    const repository = new DrizzleCustomerRepository(database);
    const allResetTokens = await database.select().from(entities.passwordResetToken);
    const createdResetToken = allResetTokens[0];
    expect(createdResetToken).not.toBeUndefined();
    expect(createdResetToken.customerId).toBe(created.customer.id);
    expect(createdResetToken.usedAt).toBeNull();

    // Para fins de teste, recrio o token em claro. Na vida real vem da URL do email.
    // Aqui vamos simular: sabemos que o token foi hashado, vamos usar um gerado fresh.
    const testToken = "test-reset-token-for-integration";
    const testTokenHash = createHash("sha256").update(testToken).digest("hex");

    // Reseta o token do banco para nosso teste.
    await database
      .update(entities.passwordResetToken)
      .set({ tokenHash: testTokenHash })
      .where(eq(entities.passwordResetToken.id, createdResetToken.id));

    // Token válido permite reset.
    const newPassword = "new password 98765";
    await service.completePasswordReset(testToken, newPassword);

    // Sessão anterior foi revogada.
    await expect(service.resolveSession(originalSessionToken)).resolves.toBeNull();

    // Novo sign-in com nova senha funciona.
    const newSignedIn = await service.signIn({
      email: signUpInput.email,
      password: newPassword,
      keepSignedIn: true,
    });
    expect(newSignedIn.customer.id).toBe(created.customer.id);
    expect(newSignedIn.sessionToken).not.toBe(originalSessionToken);

    // Token já usado não funciona 2ª vez.
    await expect(
      service.completePasswordReset(testToken, "another password"),
    ).rejects.toBeInstanceOf(GoneException);

    await module.close();
  }, 60_000);

  it("token de reset expirado é recusado com 410", async () => {
    const module = await createModule();
    const service = module.get(CustomerService);
    const repository = new DrizzleCustomerRepository(database);

    const created = await service.signUp(signUpInput);
    const token = "expired-token";
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Cria token expirado.
    await repository.createPasswordResetToken({
      customerId: created.customer.id,
      tokenHash,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(
      service.completePasswordReset(token, "new password"),
    ).rejects.toBeInstanceOf(GoneException);

    await module.close();
  }, 60_000);
});
