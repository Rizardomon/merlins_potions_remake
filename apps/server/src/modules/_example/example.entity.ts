/**
 * REFERÊNCIA — entity Drizzle de um domínio (`<domain>.entity.ts`).
 *
 * Está inteiramente comentada de propósito: o template não tem banco. Copie o conteúdo
 * para `modules/<domain>/<domain>.entity.ts`, troque `example` pelo nome do seu domínio
 * e reexporte o arquivo em `src/database/entities.ts`. Ver o README desta pasta.
 */

// import { sql } from "drizzle-orm";
// import { boolean, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
// import { auditColumns } from "../../database/audit";
//
// /**
//  * Tabela `example` — catálogo de exemplo.
//  *
//  * Convenções: nome da tabela no SINGULAR; coluna em snake_case e propriedade em
//  * camelCase (o mapeamento é explícito, primeiro argumento de cada coluna); PK uuid
//  * gerada pelo banco; auditoria obrigatória via `...auditColumns()`.
//  */
// export const example = pgTable("example", {
//   id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
//   name: varchar("name", { length: 120 }).notNull().unique(),
//   description: varchar("description", { length: 400 }),
//   active: boolean("active").notNull().default(true),
//   ...auditColumns(),
// });
//
// /** Tipos inferidos do schema — use-os no repository em vez de declarar a linha à mão. */
// export type ExampleRow = typeof example.$inferSelect;
// export type ExampleInsert = typeof example.$inferInsert;

export {};
