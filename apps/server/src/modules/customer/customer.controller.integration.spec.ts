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

integration("CustomerController HTTP (integration)", () => {
  let app: INestApplication;
  let adminPool: Pool | undefined;
  let pool: Pool | undefined;
  let databaseName: string | undefined;

  beforeAll(async () => {
    const originalDbUrl = process.env.DATABASE_URL;

    try {
      adminPool = new Pool({ connectionString: testDatabaseUrl });

      databaseName = `mp002_http_${Date.now()}_${randomBytes(4).toString("hex")}`;
      await adminPool.query(`CREATE DATABASE "${databaseName}"`);

      const url = new URL(testDatabaseUrl!);
      url.pathname = `/${databaseName}`;
      const testDbUrl = url.toString();
      process.env.DATABASE_URL = testDbUrl;

      pool = new Pool({ connectionString: testDbUrl });
      const db = drizzle(pool, { schema: entities }) as Database;
      await migrate(db, { migrationsFolder });

      // Dynamic imports to avoid ConfModule validation at parse time
      const { ConfModule } = await import("../../conf/config.module");
      const { DatabaseModule } = await import("../../database/database.module");
      const { CustomerModule } = await import("./customer.module");

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
        imports: [ConfModule, DatabaseModule, CustomerModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      app = moduleRef.createNestApplication();
      app.setGlobalPrefix("api");
      await app.init();
    } finally {
      process.env.DATABASE_URL = originalDbUrl;
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

  describe("POST /api/auth/sign-up", () => {
    it("returns 201 with session on valid input", async () => {
      const res = await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "John Doe",
          email: "john@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty("customer");
      expect(res.body).toHaveProperty("sessionToken");
      expect(res.body).toHaveProperty("expiresAt");
      expect(res.body.customer.email).toBe("john@example.com");
    });

    it("returns 400 with missing required fields", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "John Doe",
          email: "john2@example.com",
          // missing password, etc.
        })
        .expect(400);
    });

    it("returns 400 with invalid email format", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "John Doe",
          email: "not-an-email",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(400);
    });

    it("returns 400 when password is too short", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "John Doe",
          email: "john3@example.com",
          password: "short",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(400);
    });

    it("returns 400 when termsAccepted is false", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "John Doe",
          email: "john4@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: false,
        })
        .expect(400);
    });

    it("returns 409 when email already exists", async () => {
      const email = "duplicate@example.com";

      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "First User",
          email,
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Second User",
          email,
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(409);
    });
  });

  describe("POST /api/auth/sign-in", () => {
    beforeAll(async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Test User",
          email: "test@example.com",
          password: "correctpassword",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);
    });

    it("returns 200 with session on valid credentials", async () => {
      const res = await supertest(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({
          email: "test@example.com",
          password: "correctpassword",
          keepSignedIn: false,
        })
        .expect(200);

      expect(res.body).toHaveProperty("customer");
      expect(res.body).toHaveProperty("sessionToken");
      expect(res.body.customer.email).toBe("test@example.com");
    });

    it("returns 401 with incorrect password", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
          keepSignedIn: false,
        })
        .expect(401);
    });

    it("returns 401 with nonexistent email", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
          keepSignedIn: false,
        })
        .expect(401);
    });

    it("returns 429 after 5 failed sign-in attempts", async () => {
      const email = "lockout@example.com";

      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Lockout User",
          email,
          password: "correctpassword",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      for (let i = 0; i < 5; i++) {
        await supertest(app.getHttpServer())
          .post("/api/auth/sign-in")
          .send({
            email,
            password: "wrongpassword",
            keepSignedIn: false,
          })
          .expect(i < 4 ? 401 : 429);
      }
    });

    it("returns 400 with invalid email format", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({
          email: "not-an-email",
          password: "password123",
          keepSignedIn: false,
        })
        .expect(400);
    });
  });

  describe("GET /api/auth/session", () => {
    let validSessionToken: string;

    beforeAll(async () => {
      const signUpRes = await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Session Test User",
          email: "session-test@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      validSessionToken = signUpRes.body.sessionToken;
    });

    it("returns 200 with customer data using valid Bearer token", async () => {
      const res = await supertest(app.getHttpServer())
        .get("/api/auth/session")
        .set("Authorization", `Bearer ${validSessionToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("customer");
      expect(res.body.customer.email).toBe("session-test@example.com");
    });

    it("returns 200 with null customer when no token provided", async () => {
      const res = await supertest(app.getHttpServer())
        .get("/api/auth/session")
        .expect(200);

      expect(res.body).toHaveProperty("customer");
      expect(res.body.customer).toBeNull();
    });

    it("returns 200 with null customer for invalid token", async () => {
      const res = await supertest(app.getHttpServer())
        .get("/api/auth/session")
        .set("Authorization", "Bearer invalid-token-xyz")
        .expect(200);

      expect(res.body.customer).toBeNull();
    });
  });

  describe("POST /api/auth/sign-out", () => {
    let validSessionToken: string;

    beforeAll(async () => {
      const signUpRes = await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Sign Out Test",
          email: "signout-test@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      validSessionToken = signUpRes.body.sessionToken;
    });

    it("returns 204 with valid Bearer token", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-out")
        .set("Authorization", `Bearer ${validSessionToken}`)
        .expect(204);
    });

    it("returns 204 idempotent (can sign out twice)", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-out")
        .set("Authorization", `Bearer ${validSessionToken}`)
        .expect(204);

      await supertest(app.getHttpServer())
        .post("/api/auth/sign-out")
        .set("Authorization", `Bearer ${validSessionToken}`)
        .expect(204);
    });

    it("returns 204 even without Authorization header", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-out")
        .expect(204);
    });
  });

  describe("POST /api/auth/password-resets", () => {
    beforeAll(async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Reset Test User",
          email: "reset-test@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);
    });

    it("returns 202 for existing email", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({
          email: "reset-test@example.com",
        })
        .expect(202);
    });

    it("returns 202 for nonexistent email (doesn't reveal existence)", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({
          email: "nonexistent-for-reset@example.com",
        })
        .expect(202);
    });

    it("returns 400 with invalid email format", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets")
        .send({
          email: "not-an-email",
        })
        .expect(400);
    });
  });

  describe("POST /api/auth/password-resets/complete", () => {
    let resetToken: string;

    beforeAll(async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Complete Reset User",
          email: "complete-reset@example.com",
          password: "oldpassword123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      // Request a password reset (token is captured by the mock mailer in the service)
      // For this integration test, we'd need access to the database to grab a valid token
      // Skipping the full flow for now as it requires more setup
    });

    it("returns 400 with invalid token format", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets/complete")
        .send({
          token: "",
          password: "newpassword123",
        })
        .expect(400);
    });

    it("returns 400 with password too short", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets/complete")
        .send({
          token: "some-valid-token-format",
          password: "short",
        })
        .expect(400);
    });

    it("returns 410 for invalid/expired token", async () => {
      await supertest(app.getHttpServer())
        .post("/api/auth/password-resets/complete")
        .send({
          token: "invalid-token-that-never-existed",
          password: "newpassword123",
        })
        .expect(410);
    });
  });

  describe("Full authentication flow", () => {
    it("signs up → gets session → signs out → session is invalid", async () => {
      const signUpRes = await supertest(app.getHttpServer())
        .post("/api/auth/sign-up")
        .send({
          fullName: "Flow Test User",
          email: "flow-test@example.com",
          password: "password123",
          newsletterOptIn: false,
          termsAccepted: true,
        })
        .expect(201);

      const sessionToken = signUpRes.body.sessionToken;

      const getSessionRes = await supertest(app.getHttpServer())
        .get("/api/auth/session")
        .set("Authorization", `Bearer ${sessionToken}`)
        .expect(200);

      expect(getSessionRes.body.customer.email).toBe("flow-test@example.com");

      await supertest(app.getHttpServer())
        .post("/api/auth/sign-out")
        .set("Authorization", `Bearer ${sessionToken}`)
        .expect(204);

      const afterSignOutRes = await supertest(app.getHttpServer())
        .get("/api/auth/session")
        .set("Authorization", `Bearer ${sessionToken}`)
        .expect(200);

      expect(afterSignOutRes.body.customer).toBeNull();
    });
  });
});
