import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse, NextRequest } from "next/server";

// Mock cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
}));

vi.mock("@/lib/bff", () => ({
  proxyToApi: vi.fn(),
  proxyToApiWithAuth: vi.fn(),
  getSessionToken: vi.fn(),
}));

// Helper to extract Set-Cookie headers
function getSetCookieHeaders(response: NextResponse): string[] {
  return response.headers.getSetCookie();
}

describe("Auth BFF Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/sign-up", () => {
    it("sets mp_session cookie with Max-Age=30d on success", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const sessionToken = "test-session-token";
      const mockApiResponse = NextResponse.json(
        { customer: { id: "1" }, sessionToken, expiresAt: "2026-12-12" },
        { status: 201 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-up/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-up", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test User",
          email: "test@example.com",
          password: "password123",
          newsletterOptIn: true,
          termsAccepted: true,
        }),
      });

      const res = await POST(req);

      expect(mockFn).toHaveBeenCalledWith("/auth/sign-up", {
        method: "POST",
        body: expect.objectContaining({ fullName: "Test User" }),
      });

      const setCookie = res.headers.getSetCookie();
      expect(setCookie.length).toBeGreaterThan(0);
      expect(setCookie[0]).toContain("mp_session=test-session-token");
      expect(setCookie[0]).toContain("HttpOnly");
      expect(setCookie[0]).toMatch(/SameSite=Lax/i);
      expect(setCookie[0]).toContain("Path=/");
      expect(setCookie[0]).toContain("Max-Age=2592000"); // 30 days in seconds
    });

    it("returns error from proxyToApi on failure", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-up/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-up", {
        method: "POST",
        body: JSON.stringify({ email: "existing@example.com" }),
      });

      const res = await POST(req);

      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/auth/sign-in", () => {
    it("sets mp_session with Max-Age when keepSignedIn=true", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const sessionToken = "test-session-token";
      const mockApiResponse = NextResponse.json(
        { customer: { id: "1" }, sessionToken, expiresAt: "2026-12-12" },
        { status: 200 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-in/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          keepSignedIn: true,
        }),
      });

      const res = await POST(req);

      const setCookie = res.headers.getSetCookie();
      expect(setCookie.length).toBeGreaterThan(0);
      expect(setCookie[0]).toContain("Max-Age=2592000"); // 30 days
    });

    it("sets session cookie when keepSignedIn=false", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const sessionToken = "test-session-token";
      const mockApiResponse = NextResponse.json(
        { customer: { id: "1" }, sessionToken, expiresAt: "2026-12-12" },
        { status: 200 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-in/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          keepSignedIn: false,
        }),
      });

      const res = await POST(req);

      const setCookie = res.headers.getSetCookie();
      expect(setCookie.length).toBeGreaterThan(0);
      expect(setCookie[0]).not.toContain("Max-Age"); // Session cookie, no Max-Age
      expect(setCookie[0]).toContain("HttpOnly");
      expect(setCookie[0]).toMatch(/SameSite=Lax/i);
    });

    it("returns error on invalid credentials", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-in/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrong",
          keepSignedIn: false,
        }),
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
      const setCookieError = res.headers.getSetCookie();
      expect(setCookieError.filter(c => c.includes("mp_session")).length).toBe(0);
    });

    it("returns 429 on lockout", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = NextResponse.json(
        { error: "Too many attempts" },
        { status: 429 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-in/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          keepSignedIn: false,
        }),
      });

      const res = await POST(req);

      expect(res.status).toBe(429);
      const setCookieError = res.headers.getSetCookie();
      expect(setCookieError.filter(c => c.includes("mp_session")).length).toBe(0);
    });
  });

  describe("POST /api/auth/sign-out", () => {
    it("clears mp_session cookie on success", async () => {
      const { proxyToApiWithAuth } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApiWithAuth);

      const mockApiResponse = new NextResponse(null, { status: 204 });
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-out/route");
      const res = await POST();

      expect(mockFn).toHaveBeenCalledWith("/auth/sign-out", { method: "POST" });
      const setCookie = res.headers.getSetCookie();
      expect(setCookie.length).toBeGreaterThan(0);
      expect(setCookie[0]).toContain("mp_session=");
      // Check for cookie deletion via Expires or Max-Age=0
      expect(setCookie[0]).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    });

    it("does not clear cookie if API returns error", async () => {
      const { proxyToApiWithAuth } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApiWithAuth);

      const mockApiResponse = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../sign-out/route");
      const res = await POST();

      expect(res.status).toBe(401);
      const setCookieError = res.headers.getSetCookie();
      expect(setCookieError.filter(c => c.includes("mp_session")).length).toBe(0);
    });
  });

  describe("GET /api/auth/session", () => {
    it("returns customer from API with Bearer token", async () => {
      const { proxyToApiWithAuth } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApiWithAuth);

      const mockApiResponse = NextResponse.json(
        {
          customer: {
            id: "1",
            fullName: "Test User",
            firstName: "Test",
            email: "test@example.com",
          },
        },
        { status: 200 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { GET } = await import("../session/route");
      const res = await GET();

      expect(mockFn).toHaveBeenCalledWith("/auth/session");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customer).toEqual(
        expect.objectContaining({ id: "1", email: "test@example.com" }),
      );
    });

    it("returns null customer when not authenticated", async () => {
      const { proxyToApiWithAuth } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApiWithAuth);

      const mockApiResponse = NextResponse.json(
        { customer: null },
        { status: 200 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { GET } = await import("../session/route");
      const res = await GET();

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customer).toBeNull();
    });
  });

  describe("POST /api/auth/password-resets", () => {
    it("proxies password reset request", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = new NextResponse(null, { status: 202 });
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../password-resets/route");
      const req = new NextRequest(
        "http://localhost:3000/api/auth/password-resets",
        {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );

      const res = await POST(req);

      expect(mockFn).toHaveBeenCalledWith("/auth/password-resets", {
        method: "POST",
        body: { email: "test@example.com" },
      });
      expect(res.status).toBe(202);
    });

    it("returns 202 for non-existent email (no enumeration)", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = new NextResponse(null, { status: 202 });
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../password-resets/route");
      const req = new NextRequest(
        "http://localhost:3000/api/auth/password-resets",
        {
          method: "POST",
          body: JSON.stringify({ email: "nonexistent@example.com" }),
        },
      );

      const res = await POST(req);

      expect(res.status).toBe(202);
    });
  });

  describe("POST /api/auth/password-resets/complete", () => {
    it("clears mp_session cookie and does NOT create session on success", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = new NextResponse(null, { status: 204 });
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../password-resets/complete/route");
      const req = new NextRequest(
        "http://localhost:3000/api/auth/password-resets/complete",
        {
          method: "POST",
          body: JSON.stringify({
            token: "reset-token",
            password: "newpassword123",
          }),
        },
      );

      const res = await POST(req);

      expect(mockFn).toHaveBeenCalledWith("/auth/password-resets/complete", {
        method: "POST",
        body: { token: "reset-token", password: "newpassword123" },
      });
      expect(res.status).toBe(204);

      // Verify cookie was deleted (no sessionToken set, only deleted)
      const setCookie = res.headers.getSetCookie();
      const hasDelete = setCookie.some((c) => /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c));
      expect(hasDelete).toBe(true);
    });

    it("returns 410 for expired/used token", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      const mockApiResponse = NextResponse.json(
        { error: "Token expired or already used" },
        { status: 410 },
      );
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../password-resets/complete/route");
      const req = new NextRequest(
        "http://localhost:3000/api/auth/password-resets/complete",
        {
          method: "POST",
          body: JSON.stringify({
            token: "expired-token",
            password: "newpassword123",
          }),
        },
      );

      const res = await POST(req);

      expect(res.status).toBe(410);
    });

    it("clears cookie on API success (revokes all sessions)", async () => {
      const { proxyToApi } = await import("@/lib/bff");
      const mockFn = vi.mocked(proxyToApi);

      // API returns 204 (no body) after revoking all sessions
      const mockApiResponse = new NextResponse(null, { status: 204 });
      mockFn.mockResolvedValueOnce(mockApiResponse);

      const { POST } = await import("../password-resets/complete/route");
      const req = new NextRequest(
        "http://localhost:3000/api/auth/password-resets/complete",
        {
          method: "POST",
          body: JSON.stringify({
            token: "valid-token",
            password: "newpassword123",
          }),
        },
      );

      const res = await POST(req);

      expect(res.status).toBe(204);
      // Verify cookie deletion happened
      const setCookie = res.headers.getSetCookie();
      const deleteMarker = setCookie.filter((c) => /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c));
      expect(deleteMarker.length).toBeGreaterThan(0);
    });
  });
});
