import { describe, expect, it } from "vitest";
import { PotionListSchema, PotionSchema } from "./product";
import { PotionSchema as PotionSchemaBarrel } from "../src/index";

const validPotion = {
  id: "00000000-0000-0000-0000-000000000001",
  number: 1,
  name: "Aging Potion",
  priceCents: 1500,
  tint: "#c8a96e",
  effect: "Ages the drinker by several decades.",
  ingredients: ["Newt spleen", "Horklump juice"],
  image: "/products/aging-potion.png",
};

describe("PotionSchema", () => {
  it("aceita uma poção válida completa", () => {
    expect(() => PotionSchema.parse(validPotion)).not.toThrow();
    const result = PotionSchema.parse(validPotion);
    expect(result.name).toBe("Aging Potion");
  });

  it("rejeita priceCents negativo", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, priceCents: -1 }),
    ).toThrow();
  });

  it("rejeita priceCents zero", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, priceCents: 0 }),
    ).toThrow();
  });

  it("rejeita priceCents não-inteiro", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, priceCents: 15.5 }),
    ).toThrow();
  });

  it("rejeita number abaixo de 1", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, number: 0 }),
    ).toThrow();
  });

  it("rejeita number acima de 6", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, number: 7 }),
    ).toThrow();
  });

  it("rejeita number não-inteiro", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, number: 1.5 }),
    ).toThrow();
  });

  it("rejeita ingredients vazio", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, ingredients: [] }),
    ).toThrow();
  });

  it("rejeita ingredients com string vazia", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, ingredients: [""] }),
    ).toThrow();
  });

  it("aceita number 6 (limite superior)", () => {
    expect(() =>
      PotionSchema.parse({ ...validPotion, number: 6 }),
    ).not.toThrow();
  });
});

describe("PotionListSchema", () => {
  it("aceita array de poções válidas", () => {
    expect(() => PotionListSchema.parse([validPotion])).not.toThrow();
  });

  it("aceita array vazio", () => {
    expect(() => PotionListSchema.parse([])).not.toThrow();
  });

  it("rejeita array com item inválido", () => {
    expect(() =>
      PotionListSchema.parse([{ ...validPotion, priceCents: -1 }]),
    ).toThrow();
  });
});

describe("barrel import", () => {
  it("PotionSchema resolve via index.ts", () => {
    expect(PotionSchemaBarrel).toBeDefined();
    expect(() => PotionSchemaBarrel.parse(validPotion)).not.toThrow();
  });
});
