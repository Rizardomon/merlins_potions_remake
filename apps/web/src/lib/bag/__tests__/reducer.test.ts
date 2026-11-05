import { describe, expect, it } from "vitest";
import { bagReducer, initialState } from "../reducer";
import type { BagAction } from "../types";
import type { Potion } from "@merlins-potions-remake/shared";

const makePotion = (overrides: Partial<Potion> = {}): Potion => ({
  id: "00000000-0000-0000-0000-000000000001",
  number: 1,
  name: "Test Potion",
  priceCents: 1000,
  tint: "#ff0000",
  effect: "Some effect",
  ingredients: ["ingredient"],
  image: "potion.png",
  ...overrides,
});

const P1 = makePotion({ id: "00000000-0000-0000-0000-000000000001" });
const P2 = makePotion({ id: "00000000-0000-0000-0000-000000000002", number: 2, priceCents: 2000 });

function dispatch(state = initialState, action: BagAction) {
  return bagReducer(state, action);
}

describe("bagReducer — initial state", () => {
  it("starts with empty lines and hydrated=false", () => {
    expect(initialState.lines).toHaveLength(0);
    expect(initialState.hydrated).toBe(false);
  });
});

describe("bagReducer — add", () => {
  it("creates a new line with quantity 1 (quick-add)", () => {
    const next = dispatch(initialState, { type: "add", payload: { product: P1 } });
    expect(next.lines).toHaveLength(1);
    expect(next.lines[0].quantity).toBe(1);
  });

  it("creates a new line with given quantity", () => {
    const next = dispatch(initialState, { type: "add", payload: { product: P1, quantity: 3 } });
    expect(next.lines[0].quantity).toBe(3);
  });

  it("sums quantity on existing line", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1, quantity: 5 } });
    state = dispatch(state, { type: "add", payload: { product: P1, quantity: 3 } });
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(8);
  });

  it("clamps sum to 20 when adding to existing line", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1, quantity: 18 } });
    state = dispatch(state, { type: "add", payload: { product: P1, quantity: 5 } });
    expect(state.lines[0].quantity).toBe(20);
  });

  it("clamps single add above 20 to 20", () => {
    const next = dispatch(initialState, { type: "add", payload: { product: P1, quantity: 25 } });
    expect(next.lines[0].quantity).toBe(20);
  });
});

describe("bagReducer — setQuantity", () => {
  it("updates quantity on existing line", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "setQuantity", payload: { productId: P1.id, quantity: 5 } });
    expect(state.lines[0].quantity).toBe(5);
  });

  it("clamps to 20 when quantity is 21", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "setQuantity", payload: { productId: P1.id, quantity: 21 } });
    expect(state.lines[0].quantity).toBe(20);
  });

  it("removes the line when quantity is 0", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "setQuantity", payload: { productId: P1.id, quantity: 0 } });
    expect(state.lines).toHaveLength(0);
  });

  it("removes the line when quantity is negative", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "setQuantity", payload: { productId: P1.id, quantity: -1 } });
    expect(state.lines).toHaveLength(0);
  });

  it("clamps to 1 when quantity is below 1 but above 0 (not applicable — <=0 removes)", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "setQuantity", payload: { productId: P1.id, quantity: 1 } });
    expect(state.lines[0].quantity).toBe(1);
  });
});

describe("bagReducer — remove", () => {
  it("removes the target line", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "add", payload: { product: P2 } });
    state = dispatch(state, { type: "remove", payload: { productId: P1.id } });
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].product.id).toBe(P2.id);
  });

  it("is a no-op for unknown productId", () => {
    const state = dispatch(initialState, { type: "remove", payload: { productId: "unknown" } });
    expect(state.lines).toHaveLength(0);
  });
});

describe("bagReducer — clear", () => {
  it("empties all lines", () => {
    let state = dispatch(initialState, { type: "add", payload: { product: P1 } });
    state = dispatch(state, { type: "add", payload: { product: P2 } });
    state = dispatch(state, { type: "clear" });
    expect(state.lines).toHaveLength(0);
  });
});

describe("bagReducer — hydrate", () => {
  it("restores lines and sets hydrated=true", () => {
    const lines = [
      { product: P1, quantity: 2 },
      { product: P2, quantity: 1 },
    ];
    const next = dispatch(initialState, { type: "hydrate", payload: { lines } });
    expect(next.lines).toHaveLength(2);
    expect(next.hydrated).toBe(true);
  });

  it("restores from empty list", () => {
    const next = dispatch(initialState, { type: "hydrate", payload: { lines: [] } });
    expect(next.lines).toHaveLength(0);
    expect(next.hydrated).toBe(true);
  });
});
