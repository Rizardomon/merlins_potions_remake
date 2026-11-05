import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateRoleInput, Role, UpdateRoleInput } from "@app/shared";
import { RoleRepository, type RoleRow } from "./role.repository";

/**
 * Regras do catálogo de papéis e tradução linha (repository) ⇄ DTO (contrato Zod).
 * Nunca acessa a origem dos dados diretamente — só o repository.
 */
@Injectable()
export class RoleService {
  constructor(private readonly repository: RoleRepository) {}

  private toDto(row: RoleRow): Role {
    return { id: row.id, name: row.name };
  }

  async findAll(): Promise<Role[]> {
    const rows = await this.repository.findAll();
    return rows.map((row) => this.toDto(row));
  }

  async findOne(id: string): Promise<Role> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException("Papel não encontrado");
    return this.toDto(row);
  }

  async create(input: CreateRoleInput, actor: string): Promise<Role> {
    if (await this.repository.findByName(input.name)) {
      throw new ConflictException("Papel já cadastrado");
    }
    const row = await this.repository.create({
      name: input.name,
      createdBy: actor,
      updatedBy: actor,
    });
    return this.toDto(row);
  }

  async update(id: string, input: UpdateRoleInput, actor: string): Promise<Role> {
    await this.findOne(id);
    if (input.name) {
      const byName = await this.repository.findByName(input.name);
      if (byName && byName.id !== id) {
        throw new ConflictException("Já existe outro papel com esse nome");
      }
    }
    const row = await this.repository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      updatedBy: actor,
    });
    if (!row) throw new NotFoundException("Papel não encontrado");
    return this.toDto(row);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
