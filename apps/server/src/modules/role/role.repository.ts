import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

/**
 * Linha da tabela `role`.
 *
 * No template esta forma é declarada à mão porque não há banco. Com Drizzle ligado, ela
 * passa a ser inferida da entity (`typeof role.$inferSelect`) — ver `modules/_example/`.
 */
export interface RoleRow {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type RoleInsert = Omit<RoleRow, "id" | "createdAt" | "updatedAt"> &
  Partial<Pick<RoleRow, "id" | "createdAt" | "updatedAt">>;

/**
 * Acesso ao catálogo de papéis (`role`) — **mocado em memória**.
 *
 * Esta é a única camada que conhece a origem dos dados. O service e o controller não
 * mudam quando a origem muda: para trocar por Postgres, injete o token `DRIZZLE` e
 * reimplemente os métodos abaixo com as queries do Drizzle (o corpo comentado em
 * `modules/_example/example.repository.ts` mostra exatamente isso).
 *
 * O estado vive no processo: reiniciar o server volta ao seed inicial.
 */
@Injectable()
export class RoleRepository {
  private readonly rows: RoleRow[] = [
    this.seed("Desenvolvedor"),
    this.seed("Analista de Negócio"),
    this.seed("Gerente de Projeto"),
    this.seed("Arquiteto de Software"),
    this.seed("QA"),
  ];

  private seed(name: string): RoleRow {
    const now = new Date();
    return {
      id: randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
      createdBy: "seed",
      updatedBy: "seed",
    };
  }

  async findAll(): Promise<RoleRow[]> {
    return [...this.rows].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  async findById(id: string): Promise<RoleRow | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async findByName(name: string): Promise<RoleRow | null> {
    const target = name.trim().toLowerCase();
    return this.rows.find((row) => row.name.toLowerCase() === target) ?? null;
  }

  async create(values: RoleInsert): Promise<RoleRow> {
    const now = new Date();
    const row: RoleRow = {
      id: randomUUID(),
      name: values.name,
      createdAt: now,
      updatedAt: now,
      createdBy: values.createdBy ?? null,
      updatedBy: values.updatedBy ?? null,
    };
    this.rows.push(row);
    return row;
  }

  async update(id: string, values: Partial<RoleInsert>): Promise<RoleRow | null> {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    if (values.name !== undefined) row.name = values.name;
    if (values.updatedBy !== undefined) row.updatedBy = values.updatedBy;
    row.updatedAt = new Date();
    return row;
  }

  async remove(id: string): Promise<RoleRow | null> {
    const index = this.rows.findIndex((row) => row.id === id);
    if (index < 0) return null;
    return this.rows.splice(index, 1)[0];
  }
}
