import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBaseUrl, listPotions } from "./product-repository";

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

afterEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe("getBaseUrl()", () => {
  it("returns http://localhost:3010 when NEXT_PUBLIC_APP_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getBaseUrl()).toBe("http://localhost:3010");
  });

  it("returns NEXT_PUBLIC_APP_URL when defined", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://merlins.example.com";
    expect(getBaseUrl()).toBe("https://merlins.example.com");
  });
});

describe("listPotions()", () => {
  it("calls fetch with absolute URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [VALID_POTION],
    });
    vi.stubGlobal("fetch", mockFetch);

    await listPotions();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/products",
      expect.any(Object),
    );
  });

  it("URL does not start with / (never relative)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => [],
    });
    vi.stubGlobal("fetch", mockFetch);

    await listPotions();

    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl.startsWith("/")).toBe(false);
    expect(calledUrl.startsWith("http")).toBe(true);
  });

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

  it("returns [] when json() throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("parse error");
        },
      }),
    );

    const result = await listPotions();
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();
  });
});
