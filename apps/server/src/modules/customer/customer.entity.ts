import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditColumns } from "../../database/audit";

/**
 * Tabela `customer` — conta de cliente da loja (MP-002 / ADR-004).
 *
 * `email` é sempre armazenado em lowercase (normalizado no service) e protegido por
 * constraint unique. `failedSignInCount`/`lockoutUntil` persistem o lockout de sign-in
 * para contas existentes (TechSpec "Data Models").
 */
export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  newsletterOptIn: boolean("newsletter_opt_in").notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull(),
  failedSignInCount: integer("failed_sign_in_count").notNull().default(0),
  lockoutUntil: timestamp("lockout_until", { withTimezone: true }),
  ...auditColumns(),
});

export type CustomerRow = typeof customer.$inferSelect;
export type CustomerInsert = typeof customer.$inferInsert;
