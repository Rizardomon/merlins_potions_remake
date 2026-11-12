import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as entities from "./entities";

/** Token de injeção do cliente Drizzle. */
export const DRIZZLE = Symbol("DRIZZLE");

/** Tipo do banco injetado (Drizzle tipado pelo schema completo + pool do `pg`). */
export type Database = NodePgDatabase<typeof entities> & { $client: Pool };

/**
 * Provê o cliente Drizzle globalmente. A conexão é construída a partir do ConfigService
 * (DATABASE_URL obrigatória). Só o repository deve injetar o DRIZZLE.
 *
 * Está importado no `app.module.ts` desde MP-002 (ADR-004): o app não sobe sem
 * `DATABASE_URL`. O pool do `pg` conecta na primeira query, não na criação.
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
