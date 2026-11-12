import { randomBytes } from "node:crypto";
import { join } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, it, expect } from "vitest";
import supertest from "supertest";
import type { Database } from "../../database/database.module";
import * as entities from "../../database/entities";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;
const migrationsFolder = join(__dirname, "..", "..", "database", "migrations");

integration("DevModule (integration)", () => {
  let app: INestApplication;
  let adminPool: Pool | undefined;
  let pool: Pool | undefined;
  let databaseName: string | undefined;

  beforeAll(async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      adminPool = new Pool({ connectionString: testDatabaseUrl });

      databaseName = `mp002_dev_${Date.now()}_${randomBytes(4).toString("hex")}`;
      await adminPool.query(`CREATE DATABASE "${databaseName}"`);

      const url = new URL(testDatabaseUrl!);
      url.pathname = `/${databaseName}`;
      const testDbUrl = url.toString();
      process.env.DATABASE_URL = testDbUrl;
      process.env.NODE_ENV = "development";

      pool = new Pool({ connectionString: testDbUrl });
      const db = drizzle(pool, { schema: entities }) as Database;
      await migrate(db, { migrationsFolder });

      const { ConfModule } = await import("../../conf/config.module");
      const { DatabaseModule } = await import("../../database/database.module");
      const { CustomerModule } = await import("../customer/customer.module");
      const { AppModule } = await import("../../app.module");

      const mockConfigService = {
        get: (key: string) => {
          if (key === "DATABASE_URL") return testDbUrl;
          return undefined;
        },
        getOrThrow: (key: string) => {
          if (key === "DATABASE_URL") return testDbUrl;
          throw new Error(`Missing env var: ${key}`);
        },
      };

      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      app = moduleRef.createNestApplication();
      app.setGlobalPrefix("api");
      await app.init();
    } finally {
      process.env.DATABASE_URL = originalDbUrl;
      process.env.NODE_ENV = originalNodeEnv;
    }
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await pool?.end();

    if (adminPool && databaseName) {
      await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    }

    await adminPool?.end();
  }, 60_000);

  describe("GET /api/dev/mailbox/:email (dev environment)", () => {
    it("retorna 404 para email sem mensagem", async () => {
      await supertest(app.getHttpServer())
        .get("/api/dev/mailbox/nonexistent@example.com")
        .expect(404);
    });

    it("retorna 200 com a mensagem após reset request", async () => {
      const email = "user@example.com";

      // Request password reset (which triggers DevMailer.send)
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({ email })
        .expect(202);

      // Mailbox should now have the message
      const res = await supertest(app.getHttpServer())
        .get(`/api/dev/mailbox/${email}`)
        .expect(200);

      expect(res.body).toHaveProperty("to", email);
      expect(res.body).toHaveProperty("subject");
      expect(res.body).toHaveProperty("body");
      expect(res.body).toHaveProperty("resetUrl");
    });

    it("inclui URL de reset na mensagem recuperada", async () => {
      const email = "reset@example.com";

      // Create account first
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Test User",
          email,
          password: "password123456",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      // Request password reset
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({ email })
        .expect(202);

      // Check mailbox
      const res = await supertest(app.getHttpServer())
        .get(`/api/dev/mailbox/${email}`)
        .expect(200);

      expect(res.body.resetUrl).toBeTruthy();
      expect(res.body.resetUrl).toContain("/reset-password/");
    });

    it("retorna a última mensagem quando múltiplas foram enviadas", async () => {
      const email = "multiple@example.com";

      // Create account
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Multiple Resets",
          email,
          password: "password123456",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      // Request password reset twice
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({ email })
        .expect(202);

      const firstMessage = await supertest(app.getHttpServer())
        .get(`/api/dev/mailbox/${email}`)
        .expect(200);

      // Second request
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({ email })
        .expect(202);

      const secondMessage = await supertest(app.getHttpServer())
        .get(`/api/dev/mailbox/${email}`)
        .expect(200);

      // Both should have resetUrl but they should be different tokens
      expect(firstMessage.body.resetUrl).not.toBe(secondMessage.body.resetUrl);
    });

    it("iso lates mensagens por email", async () => {
      const email1 = "alice@example.com";
      const email2 = "bob@example.com";

      // Create both accounts
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Alice",
          email: email1,
          password: "password123456",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Bob",
          email: email2,
          password: "password123456",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      // Request resets
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({ email: email1 })
        .expect(202);

      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({ email: email2 })
        .expect(202);

      // Check both
      const aliceMessage = await supertest(app.getHttpServer())
        .get(`/api/dev/mailbox/${email1}`)
        .expect(200);

      const bobMessage = await supertest(app.getHttpServer())
        .get(`/api/dev/mailbox/${email2}`)
        .expect(200);

      expect(aliceMessage.body.to).toBe(email1);
      expect(bobMessage.body.to).toBe(email2);
      expect(aliceMessage.body.resetUrl).not.toBe(bobMessage.body.resetUrl);
    });
  });
});
