import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { validateEnv } from "./configuration";

const validDatabaseUrl = "postgres://app:app@localhost:5432/app";

function issueFor(error: unknown, field: string) {
  expect(error).toBeInstanceOf(ZodError);
  return (error as ZodError).issues.find((issue) => issue.path.join(".") === field);
}

describe("validateEnv", () => {
  it("fails with a clear message when DATABASE_URL is missing", () => {
    try {
      validateEnv({ NODE_ENV: "test" });
      expect.fail("validateEnv should have thrown without DATABASE_URL");
    } catch (error) {
      expect(issueFor(error, "DATABASE_URL")?.message).toContain(
        "DATABASE_URL é obrigatória",
      );
    }
  });

  it("rejects a malformed DATABASE_URL", () => {
    try {
      validateEnv({ NODE_ENV: "test", DATABASE_URL: "not-a-url" });
      expect.fail("validateEnv should have thrown for an invalid DATABASE_URL");
    } catch (error) {
      expect(issueFor(error, "DATABASE_URL")?.message).toContain(
        "URL de conexão Postgres válida",
      );
    }
  });

  it("rejects a non-Postgres DATABASE_URL", () => {
    try {
      validateEnv({ NODE_ENV: "test", DATABASE_URL: "https://example.com/db" });
      expect.fail("validateEnv should have thrown for a non-Postgres scheme");
    } catch (error) {
      expect(issueFor(error, "DATABASE_URL")?.message).toContain("postgres://");
    }
  });

  it("accepts a valid DATABASE_URL", () => {
    const env = validateEnv({ NODE_ENV: "test", DATABASE_URL: validDatabaseUrl });

    expect(env.DATABASE_URL).toBe(validDatabaseUrl);
  });

  it("enables Swagger outside production by default", () => {
    const env = validateEnv({ NODE_ENV: "development", DATABASE_URL: validDatabaseUrl });

    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it("honours an explicit SWAGGER_ENABLED value", () => {
    const env = validateEnv({
      NODE_ENV: "test",
      DATABASE_URL: validDatabaseUrl,
      SWAGGER_ENABLED: "false",
    });

    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it("rejects localhost WEB_ORIGIN in production", () => {
    try {
      validateEnv({
        NODE_ENV: "production",
        DATABASE_URL: validDatabaseUrl,
        WEB_ORIGIN: "http://localhost:3010",
      });
      expect.fail("validateEnv should have rejected localhost in production");
    } catch (error) {
      expect(issueFor(error, "WEB_ORIGIN")?.message).toContain("localhost");
    }
  });
});
