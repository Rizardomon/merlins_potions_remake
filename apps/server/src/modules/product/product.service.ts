import { Injectable, NotFoundException } from "@nestjs/common";
import type { Potion } from "@merlins-potions-remake/shared";
import { ProductRepository, type PotionRow } from "./product.repository";

@Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  private toDto(row: PotionRow): Potion {
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      priceCents: row.priceCents,
      tint: row.tint,
      effect: row.effect,
      ingredients: row.ingredients,
      image: row.image,
    };
  }

  async list(): Promise<Potion[]> {
    const rows = await this.repository.findAll();
    return rows.map((row) => this.toDto(row));
  }

  async getById(id: string): Promise<Potion> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException("Potion not found");
    return this.toDto(row);
  }
}
