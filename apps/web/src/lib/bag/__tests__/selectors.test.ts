import { describe, expect, it } from "vitest";
import {
  selectFreeShippingRemainingCents,
  selectItemCount,
  selectSubtotalCents,
} from "../selectors";
import type { BagState } from "../types";
import type { Potion } from "@merlins-potions-remake/shared";

const makePotion = (id: string, priceCents: number): Potion => ({
  id,
  number: 1,
  name: "Potion",
  priceCents,
  tint: "#000",
  effect: "effect",
  ingredients: ["x"],
  image: "img.png",
});

const P1 = makePotion("00000000-0000-0000-0000-000000000001", 1000); // $10
const P2 = makePotion("00000000-0000-0000-0000-000000000002", 2000); // $20

function state(lines: BagState["lines"]): BagState {
  return { lines, hydrated: true };
}

describe("selectItemCount", () => {
  it("returns 0 for empty bag", () => {
    expect(selectItemCount(state([]))).toBe(0);
  });

  it("sums quantities across multiple lines", () => {
    const s = state([
      { product: P1, quantity: 2 },
      { product: P2, quantity: 3 },
    ]);
    expect(selectItemCount(s)).toBe(5);
  });
});

describe("selectSubtotalCents", () => {
  it("returns 0 for empty bag", () => {
    expect(selectSubtotalCents(state([]))).toBe(0);
  });

  it("computes priceCents × quantity per line and sums", () => {
    const s = state([
      { product: P1, quantity: 2 }, // 2000
      { product: P2, quantity: 1 }, // 2000
    ]);
    expect(selectSubtotalCents(s)).toBe(4000);
  });
});

describe("selectFreeShippingRemainingCents", () => {
  it("returns 5000 (full threshold) for empty bag", () => {
    expect(selectFreeShippingRemainingCents(state([]))).toBe(5000);
  });

  it("returns positive value below threshold", () => {
    const s = state([{ product: P1, quantity: 1 }]); // $10 → needs $40 more
    expect(selectFreeShippingRemainingCents(s)).toBe(4000);
  });

  it("returns 0 when subtotal equals threshold (5000 cents)", () => {
    const p = makePotion("00000000-0000-0000-0000-000000000003", 5000);
    const s = state([{ product: p, quantity: 1 }]);
    expect(selectFreeShippingRemainingCents(s)).toBe(0);
  });

  it("returns 0 when subtotal exceeds threshold", () => {
    const p = makePotion("00000000-0000-0000-0000-000000000004", 6000);
    const s = state([{ product: p, quantity: 1 }]);
    expect(selectFreeShippingRemainingCents(s)).toBe(0);
  });
});
