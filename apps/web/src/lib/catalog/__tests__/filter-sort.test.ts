import { describe, it, expect } from "vitest";
import { filterPotions, sortPotions } from "../filter-sort";
import type { Potion } from "@merlins-potions-remake/shared";

const p = (overrides: Partial<Potion> & { id: string; number: number }): Potion => ({
  name: "Test Potion",
  priceCents: 1000,
  tint: "#aaa",
  effect: "Does something",
  ingredients: ["water"],
  image: "test.png",
  ...overrides,
});

const potions: Potion[] = [
  p({ id: "1", number: 1, name: "Love Potion", priceCents: 500, ingredients: ["rose", "honey"] }),
  p({ id: "2", number: 2, name: "Sleeping Draught", priceCents: 300, ingredients: ["valerian", "lavender"] }),
  p({ id: "3", number: 3, name: "Dragon Tonic", priceCents: 800, ingredients: ["dragon scale", "fire moss"] }),
  p({ id: "4", number: 4, name: "Polyjuice Potion", priceCents: 1200, ingredients: ["lacewing flies", "fluxweed"] }),
  p({ id: "5", number: 5, name: "Aging Potion", priceCents: 400, ingredients: ["fairy dust", "time moss"] }),
  p({ id: "6", number: 6, name: "Bulgeye Potion", priceCents: 600, ingredients: ["dried nettles", "wormwood"] }),
];

describe("filterPotions", () => {
  it("retorna todas quando query vazia", () => {
    expect(filterPotions(potions, "")).toHaveLength(6);
  });

  it("filtra por nome parcial case-insensitive", () => {
    const result = filterPotions(potions, "love");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Love Potion");
  });

  it("filtra por nome em uppercase", () => {
    const result = filterPotions(potions, "DRAGON");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Dragon Tonic");
  });

  it("filtra por ingrediente case-insensitive", () => {
    const result = filterPotions(potions, "lavender");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Sleeping Draught");
  });

  it("filtra por ingrediente parcial", () => {
    const result = filterPotions(potions, "dragon");
    // Matches "Dragon Tonic" (name) and "dragon scale" (ingredient of Dragon Tonic)
    expect(result).toHaveLength(1);
  });

  it("retorna lista vazia quando sem match", () => {
    const result = filterPotions(potions, "unicorn");
    expect(result).toHaveLength(0);
  });

  it("ignora espaços ao redor da query", () => {
    const result = filterPotions(potions, "  honey  ");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Love Potion");
  });
});

describe("sortPotions", () => {
  it("featured mantém ordem por number 1..6", () => {
    const shuffled = [...potions].reverse();
    const result = sortPotions(shuffled, "featured");
    expect(result.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("asc ordena por priceCents crescente", () => {
    const result = sortPotions(potions, "asc");
    const prices = result.map((p) => p.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("desc ordena por priceCents decrescente", () => {
    const result = sortPotions(potions, "desc");
    const prices = result.map((p) => p.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("não muta o array original", () => {
    const original = [...potions];
    sortPotions(potions, "desc");
    expect(potions.map((p) => p.number)).toEqual(original.map((p) => p.number));
  });
});
