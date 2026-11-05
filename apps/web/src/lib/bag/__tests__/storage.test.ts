import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installLocalStorageMock } from "@/test/local-storage-mock";
import { loadFromStorage, rehydrateLines, saveToStorage } from "../storage";
import type { BagLine } from "../types";
import type { Potion } from "@merlins-potions-remake/shared";

const STORAGE_KEY = "mp.bag.v1";

const makePotion = (id: string, priceCents = 1000): Potion => ({
  id,
  number: 1,
  name: "Potion",
  priceCents,
  tint: "#000",
  effect: "effect",
  ingredients: ["x"],
  image: "img.png",
});

const P1 = makePotion("00000000-0000-0000-0000-000000000001", 1500);
const P2 = makePotion("00000000-0000-0000-0000-000000000002", 2500);

let lsMock: ReturnType<typeof installLocalStorageMock>;

beforeEach(() => {
  lsMock = installLocalStorageMock();
});

afterEach(() => {
  lsMock.clear();
});

describe("saveToStorage / loadFromStorage — round trip", () => {
  it("persists lines and reloads them", () => {
    const lines: BagLine[] = [
      { product: P1, quantity: 2 },
      { product: P2, quantity: 1 },
    ];
    saveToStorage(lines);

    const loaded = loadFromStorage();
    expect(loaded).toEqual([
      { productId: P1.id, quantity: 2 },
      { productId: P2.id, quantity: 1 },
    ]);
  });

  it("returns null when storage is empty", () => {
    expect(loadFromStorage()).toBeNull();
  });
});

describe("loadFromStorage — validation", () => {
  it("discards invalid JSON without throwing", () => {
    lsMock.setItem(STORAGE_KEY, "not-json{{");
    expect(loadFromStorage()).toBeNull();
    expect(lsMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it("discards data that fails Zod schema", () => {
    lsMock.setItem(STORAGE_KEY, JSON.stringify([{ productId: "not-a-uuid", quantity: 1 }]));
    expect(loadFromStorage()).toBeNull();
    expect(lsMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it("discards data with quantity out of range", () => {
    lsMock.setItem(
      STORAGE_KEY,
      JSON.stringify([{ productId: P1.id, quantity: 25 }])
    );
    expect(loadFromStorage()).toBeNull();
  });

  it("discards non-array data", () => {
    lsMock.setItem(STORAGE_KEY, JSON.stringify({ productId: P1.id, quantity: 1 }));
    expect(loadFromStorage()).toBeNull();
  });
});

describe("rehydrateLines", () => {
  it("maps persisted entries to full BagLine objects", () => {
    const persisted = [
      { productId: P1.id, quantity: 2 },
      { productId: P2.id, quantity: 1 },
    ];
    const lines = rehydrateLines(persisted, [P1, P2]);
    expect(lines).toHaveLength(2);
    expect(lines[0].product.id).toBe(P1.id);
    expect(lines[0].quantity).toBe(2);
    expect(lines[1].product.id).toBe(P2.id);
  });

  it("skips entries whose productId is not in catalog", () => {
    const persisted = [
      { productId: P1.id, quantity: 2 },
      { productId: "00000000-0000-0000-0000-000000000099", quantity: 1 },
    ];
    const lines = rehydrateLines(persisted, [P1]);
    expect(lines).toHaveLength(1);
    expect(lines[0].product.id).toBe(P1.id);
  });
});
