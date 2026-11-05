import { NotFoundException } from "@nestjs/common";
import { PotionSchema } from "@merlins-potions-remake/shared";
import { describe, expect, it, beforeEach } from "vitest";
import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";

describe("ProductService", () => {
  let service: ProductService;
  let repository: ProductRepository;

  beforeEach(() => {
    repository = new ProductRepository();
    service = new ProductService(repository);
  });

  it("list() retorna as seis poções em ordem featured (number 1..6)", async () => {
    const potions = await service.list();
    expect(potions).toHaveLength(6);
    expect(potions.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("list() retorna Aging Potion como primeira", async () => {
    const potions = await service.list();
    expect(potions[0].name).toBe("Aging Potion");
  });

  it("getById(id) retorna a poção correta", async () => {
    const all = await service.list();
    const target = all[2];
    const result = await service.getById(target.id);
    expect(result).toEqual(target);
  });

  it('getById("inexistente") lança NotFoundException', async () => {
    await expect(service.getById("00000000-0000-0000-0000-000000000000")).rejects.toThrow(NotFoundException);
  });

  it("cada row semeada satisfaz PotionSchema.parse", async () => {
    const potions = await service.list();
    for (const potion of potions) {
      expect(() => PotionSchema.parse(potion)).not.toThrow();
    }
  });

  it("lista contém as seis poções do design", async () => {
    const potions = await service.list();
    const names = potions.map((p) => p.name);
    expect(names).toContain("Aging Potion");
    expect(names).toContain("Bulgeye Potion");
    expect(names).toContain("Dragon Tonic");
    expect(names).toContain("Love Potion");
    expect(names).toContain("Polyjuice Potion");
    expect(names).toContain("Sleeping Draught");
  });
});
