import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditColumns } from "../../database/audit";
import { customer } from "./customer.entity";

/**
 * Tabela `password_reset_token` — token de reset de senha (MP-002 / ADR-005).
 *
 * Assim como a sessão, só o hash SHA-256 do token é persistido. `usedAt` marca o uso
 * (token single-use) e `expiresAt` é criação + 30 minutos.
 */
export const passwordResetToken = pgTable("password_reset_token", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ...auditColumns(),
});

export type PasswordResetTokenRow = typeof passwordResetToken.$inferSelect;
export type PasswordResetTokenInsert = typeof passwordResetToken.$inferInsert;
