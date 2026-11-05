/**
 * REFERÊNCIA — repository Drizzle de um domínio (`<domain>.repository.ts`).
 *
 * Comentado de propósito (o template não tem banco). Compare com
 * `modules/role/role.repository.ts`: a **assinatura dos métodos é a mesma**, só o corpo
 * muda. É esse o ponto do padrão — trocar mock por Postgres não toca no service nem no
 * controller.
 *
 * O repository é a ÚNICA camada que injeta o token `DRIZZLE`.
 */

// import { Inject, Injectable } from "@nestjs/common";
// import { asc, eq } from "drizzle-orm";
// import { DRIZZLE, type Database } from "../../database/database.module";
// import { example, type ExampleInsert, type ExampleRow } from "./example.entity";
//
// @Injectable()
// export class ExampleRepository {
//   constructor(@Inject(DRIZZLE) private readonly db: Database) {}
//
//   findAll(): Promise<ExampleRow[]> {
//     return this.db.select().from(example).orderBy(asc(example.name));
//   }
//
//   async findById(id: string): Promise<ExampleRow | null> {
//     const [row] = await this.db.select().from(example).where(eq(example.id, id));
//     return row ?? null;
//   }
//
//   /** Consulta específica do domínio: sustenta o 409 de unicidade no service. */
//   async findByName(name: string): Promise<ExampleRow | null> {
//     const [row] = await this.db.select().from(example).where(eq(example.name, name));
//     return row ?? null;
//   }
//
//   async create(values: ExampleInsert): Promise<ExampleRow> {
//     const [row] = await this.db.insert(example).values(values).returning();
//     return row;
//   }
//
//   async update(id: string, values: Partial<ExampleInsert>): Promise<ExampleRow | null> {
//     const [row] = await this.db
//       .update(example)
//       .set(values)
//       .where(eq(example.id, id))
//       .returning();
//     return row ?? null;
//   }
//
//   async remove(id: string): Promise<ExampleRow | null> {
//     const [row] = await this.db.delete(example).where(eq(example.id, id)).returning();
//     return row ?? null;
//   }
// }

export {};
