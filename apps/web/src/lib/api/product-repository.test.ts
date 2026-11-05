import { describe, it, expect, vi, beforeEach } from "vitest";
import { listPotions } from "./product-repository";

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

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("listPotions()", () => {
  it("returns PotionList on valid response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [VALID_POTION],
      }),
    );

    const result = await listPotions();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Healing Potion");
  });

  it("returns [] and logs error on Zod validation failure", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ invalid: true }],
      }),
    );

    const result = await listPotions();
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it("returns [] when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => [],
      }),
    );

    const result = await listPotions();
    expect(result).toEqual([]);
  });

  it("returns [] and logs error when json() throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error("parse error"); },
      }),
    );

    const result = await listPotions();
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();
  });
});
