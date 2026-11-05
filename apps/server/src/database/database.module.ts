import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as entities from "./entities";

/** Token de injeção do cliente Drizzle. */
export const DRIZZLE = Symbol("DRIZZLE");

/** Tipo do banco injetado (Drizzle tipado pelo schema completo). */
export type Database = NodePgDatabase<typeof entities>;

/**
 * Provê o cliente Drizzle globalmente. A conexão é construída de forma assíncrona
 * a partir do ConfigService (DATABASE_URL). Só o repository deve injetar o DRIZZLE.
 *
 * **Não está importado no `app.module.ts`**: os repositories do template são em memória,
 * então o app sobe sem Postgres. Ao ligar a persistência, adicione-o aos `imports` do
 * módulo raiz e siga `modules/_example/README.md`.
 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const pool = new Pool({
          connectionString: config.getOrThrow<string>("DATABASE_URL"),
        });
        return drizzle(pool, { schema: entities });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
