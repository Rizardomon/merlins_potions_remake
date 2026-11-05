import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Config do drizzle-kit (ferramenta de build, fora do Nest — lê process.env via dotenv).
 * Schema versionado via `generate`/`migrate` (ver docs/padroes/migrations.md); `push` só em dev.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/entities.ts",
  out: "./src/database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
