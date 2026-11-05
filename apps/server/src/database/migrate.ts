/**
 * Runner de migrations (ferramenta de ops, fora do Nest — roda como script standalone).
 *
 * Aplica as migrations versionadas geradas por `drizzle-kit generate` usando o migrator
 * nativo do drizzle-orm (dependência de produção). NÃO usa `drizzle-kit` (devDependency,
 * ausente na imagem de runtime após `pnpm --prod deploy`).
 *
 * Uso: `pnpm db:migrate` (equivale a `node dist/database/migrate.js`). Os .sql são copiados
 * para o dist pelos assets do nest-cli, então ficam ao lado deste arquivo em `./migrations`.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "node:path";
import { Pool } from "pg";

// Em dev, carrega o .env; em produção as envs vêm do container e o dotenv não está instalado.
try {
  require("dotenv/config");
} catch {
  /* dotenv ausente em produção — envs já vêm do ambiente */
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  const migrationsFolder = join(__dirname, "migrations");

  console.log(`[migrate] aplicando migrations de ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("[migrate] concluído");

  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] falhou:", err);
  process.exit(1);
});
