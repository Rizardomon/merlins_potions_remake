import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { DRIZZLE, type Database } from "./database.module";

/**
 * Integração real com Postgres. Opt-in via `TEST_DATABASE_URL` para o `pnpm test`
 * continuar rodando sem banco; em CI/dev, suba o serviço `postgres` do
 * `deploy/docker-compose.yml` (profile `dev-db`) e exporte a URL:
 *
 *   TEST_DATABASE_URL=postgres://app:app@localhost:5432/app \
 *     pnpm --filter @merlins-potions-remake/server test:integration
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;
const originalDatabaseUrl = process.env.DATABASE_URL;

integration("DatabaseModule (integration)", () => {
  afterAll(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("boots the Nest app and resolves DRIZZLE against Postgres", async () => {
    process.env.DATABASE_URL = testDatabaseUrl;

    const { AppModule } = await import("../app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const db = moduleRef.get<Database>(DRIZZLE);

    try {
      const result = await db.execute<{ ok: number }>(sql`select 1 as ok`);

      expect(result.rows[0]).toMatchObject({ ok: 1 });
    } finally {
      await moduleRef.close();
      await db.$client.end();
    }
  });
});
