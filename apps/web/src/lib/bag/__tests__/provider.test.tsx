import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installLocalStorageMock } from "@/test/local-storage-mock";
import { BagProvider, useBag } from "../provider";
import type { Potion } from "@merlins-potions-remake/shared";
import type { ReactNode } from "react";

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

const STORAGE_KEY = "mp.bag.v1";

let lsMock: ReturnType<typeof installLocalStorageMock>;

beforeEach(() => {
  lsMock = installLocalStorageMock();
});

afterEach(() => {
  lsMock.clear();
});

function wrapper(catalog: Potion[]) {
  return ({ children }: { children: ReactNode }) => (
    <BagProvider catalog={catalog}>{children}</BagProvider>
  );
}

describe("BagProvider / useBag", () => {
  it("throws when used outside BagProvider", () => {
    expect(() => renderHook(() => useBag())).toThrow(
      "useBag must be used inside BagProvider"
    );
  });

  it("starts with empty bag and hydrated=false before effect runs", () => {
    const { result } = renderHook(() => useBag(), { wrapper: wrapper([P1]) });
    // Before useEffect fires, state is still initial (hydrated=false)
    expect(result.current.state.lines).toHaveLength(0);
  });

  it("hydrates with empty lines when storage is empty", async () => {
    const { result } = renderHook(() => useBag(), { wrapper: wrapper([P1]) });
    await act(async () => {});
    expect(result.current.state.hydrated).toBe(true);
    expect(result.current.state.lines).toHaveLength(0);
  });

  it("hydrates from localStorage cross-referencing catalog", async () => {
    lsMock.setItem(
      STORAGE_KEY,
      JSON.stringify([{ productId: P1.id, quantity: 2 }])
    );
    const { result } = renderHook(() => useBag(), { wrapper: wrapper([P1, P2]) });
    await act(async () => {});
    expect(result.current.state.hydrated).toBe(true);
    expect(result.current.state.lines).toHaveLength(1);
    expect(result.current.state.lines[0].product.id).toBe(P1.id);
    expect(result.current.state.lines[0].quantity).toBe(2);
  });

  it("discards invalid storage and hydrates with empty bag", async () => {
    lsMock.setItem(STORAGE_KEY, "corrupted{{data");
    const { result } = renderHook(() => useBag(), { wrapper: wrapper([P1]) });
    await act(async () => {});
    expect(result.current.state.lines).toHaveLength(0);
    expect(result.current.state.hydrated).toBe(true);
  });

  it("exposes correct derived selectors after adding items", async () => {
    const { result } = renderHook(() => useBag(), { wrapper: wrapper([P1, P2]) });
    await act(async () => {});
    act(() => {
      result.current.dispatch({ type: "add", payload: { product: P1, quantity: 2 } });
    });
    expect(result.current.itemCount).toBe(2);
    expect(result.current.subtotalCents).toBe(3000); // 1500 * 2
    expect(result.current.freeShippingRemainingCents).toBe(2000); // 5000 - 3000
  });

  it("persists state to localStorage after hydration", async () => {
    const { result } = renderHook(() => useBag(), { wrapper: wrapper([P1]) });
    await act(async () => {});
    act(() => {
      result.current.dispatch({ type: "add", payload: { product: P1 } });
    });
    const stored = JSON.parse(lsMock.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toEqual([{ productId: P1.id, quantity: 1 }]);
  });
});
