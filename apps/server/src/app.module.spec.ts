import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DRIZZLE } from "./database/database.module";

const originalDatabaseUrl = process.env.DATABASE_URL;

describe("AppModule", () => {
  beforeAll(() => {
    // O pool só conecta na primeira query; aqui basta uma URL válida para o boot.
    process.env.DATABASE_URL = "postgres://app:app@localhost:5432/app";
  });

  afterAll(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("compiles and provides the DRIZZLE token", async () => {
    const { AppModule } = await import("./app.module");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(DRIZZLE)).toBeDefined();

    await moduleRef.close();
  });
});
