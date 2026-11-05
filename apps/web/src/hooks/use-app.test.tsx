import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { usePotions, queryKeys } from "./use-app";

const VALID_POTION = {
  id: "00000000-0000-0000-0000-000000000001",
  number: 1,
  name: "Healing Potion",
  priceCents: 1500,
  tint: "#ff0000",
  effect: "Restores 50 HP",
  ingredients: ["herb", "water"],
  image: "/potions/1.png",
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("queryKeys", () => {
  it("potions key is stable and unique", () => {
    expect(queryKeys.potions).toEqual(["potions"]);
    expect(queryKeys.potions).toBe(queryKeys.potions);
  });
});

describe("usePotions()", () => {
  it("delivers data from repository", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [VALID_POTION],
      }),
    );

    const { result } = renderHook(() => usePotions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe("Healing Potion");
  });

  it("delivers empty array on validation failure without throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ bad: "data" }],
      }),
    );

    const { result } = renderHook(() => usePotions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
