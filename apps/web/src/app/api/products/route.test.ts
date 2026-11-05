import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/bff", () => ({
  proxyToApi: vi.fn(),
}));

describe("GET /api/products", () => {
  it("forwards response from proxyToApi /products", async () => {
    const { proxyToApi } = await import("@/lib/bff");
    const mockFn = vi.mocked(proxyToApi);
    const mockResponse = NextResponse.json([{ id: "1" }], { status: 200 });
    mockFn.mockResolvedValueOnce(mockResponse);

    const { GET } = await import("./route");
    const res = await GET();

    expect(res).toBe(mockResponse);
    expect(mockFn).toHaveBeenCalledWith("/products");
  });
});
