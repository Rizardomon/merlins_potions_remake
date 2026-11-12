import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditColumns } from "../../database/audit";
import { customer } from "./customer.entity";

/**
 * Tabela `session` — sessão opaca de cliente (MP-002 / ADR-005).
 *
 * Apenas o hash SHA-256 do token é persistido (`tokenHash`); o token em claro nunca
 * entra no banco nem em logs. `expiresAt` é sempre criação + 30 dias.
 */
export const session = pgTable("session", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...auditColumns(),
});

export type SessionRow = typeof session.$inferSelect;
export type SessionInsert = typeof session.$inferInsert;
