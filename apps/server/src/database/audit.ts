import { timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Colunas de auditoria obrigatórias em TODA tabela (ver docs/padroes/backend-modulo.md):
 * created_at, updated_at, created_by, updated_by. `created_by`/`updated_by` guardam o
 * subject do Keycloak (texto). Fábrica (retorna colunas novas a cada chamada) para poder
 * ser espalhada com `...auditColumns()` em cada `pgTable` sem compartilhar instâncias.
 */
export const auditColumns = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
});
