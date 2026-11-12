import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as authRepository from "./auth-repository";
import type {
  SessionCustomer,
} from "@merlins-potions-remake/shared";

const VALID_CUSTOMER: SessionCustomer = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  fullName: "Test User",
  firstName: "Test",
  email: "test@example.com",
};

const VALID_AUTH_SESSION = {
  customer: VALID_CUSTOMER,
  sessionToken: "opaque-token-xyz",
  expiresAt: "2026-12-13T10:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe("auth-repository: mapStatusToMessage", () => {
  it("maps 401 to 'Email or password is incorrect.'", async () => {
    // Test via signIn error handling (401 is thrown)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    await expect(authRepository.signIn({
      email: "test@example.com",
      password: "password123",
      keepSignedIn: false,
    })).rejects.toMatchObject({
      status: 401,
      message: "Email or password is incorrect.",
    });
  });

  it("maps 409 to 'An account with this email already exists.'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
      }),
    );

    try {
      await authRepository.signUp({
        fullName: "Test User",
        email: "existing@example.com",
        password: "password123",
        newsletterOptIn: false,
        termsAccepted: true,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 409,
        message: "An account with this email already exists.",
      });
    }
  });

  it("maps 429 to 'Too many attempts. Try again in 15 minutes.'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    );

    try {
      await authRepository.signIn({
        email: "test@example.com",
        password: "wrong",
        keepSignedIn: false,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 429,
        message: "Too many attempts. Try again in 15 minutes.",
      });
    }
  });

  it("maps 410 to 'Password reset link has expired or has already been used.'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
      }),
    );

    try {
      await authRepository.completePasswordReset({
        token: "expired-token",
        password: "newpassword123",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 410,
        message: "Password reset link has expired or has already been used.",
      });
    }
  });

  it("maps unknown status to 'Something went wrong. Please try again.'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    try {
      await authRepository.signIn({
        email: "test@example.com",
        password: "password123",
        keepSignedIn: false,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        message: "Something went wrong. Please try again.",
      });
    }
  });
});

describe("signUp()", () => {
  it("calls fetch with correct endpoint", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => VALID_AUTH_SESSION,
    });
    vi.stubGlobal("fetch", mockFetch);

    await authRepository.signUp({
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
      newsletterOptIn: false,
      termsAccepted: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/auth/sign-up",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("returns AuthSession on valid response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => VALID_AUTH_SESSION,
      }),
    );

    const result = await authRepository.signUp({
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
      newsletterOptIn: false,
      termsAccepted: true,
    });

    expect(result).toEqual(VALID_AUTH_SESSION);
    expect(result.customer.email).toBe("test@example.com");
  });

  it("throws AuthError on invalid response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: true }),
      }),
    );

    try {
      await authRepository.signUp({
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
        newsletterOptIn: false,
        termsAccepted: true,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        message: "Something went wrong. Please try again.",
      });
      expect(errorSpy).toHaveBeenCalled();
    }
  });
});

describe("signIn()", () => {
  it("calls fetch with correct endpoint", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => VALID_AUTH_SESSION,
    });
    vi.stubGlobal("fetch", mockFetch);

    await authRepository.signIn({
      email: "test@example.com",
      password: "password123",
      keepSignedIn: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/auth/sign-in",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("returns AuthSession on valid response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => VALID_AUTH_SESSION,
      }),
    );

    const result = await authRepository.signIn({
      email: "test@example.com",
      password: "password123",
      keepSignedIn: false,
    });

    expect(result).toEqual(VALID_AUTH_SESSION);
  });

  it("throws 401 AuthError on incorrect credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    try {
      await authRepository.signIn({
        email: "test@example.com",
        password: "wrongpassword",
        keepSignedIn: false,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 401,
        message: "Email or password is incorrect.",
      });
    }
  });

  it("throws 429 AuthError on lockout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    );

    try {
      await authRepository.signIn({
        email: "test@example.com",
        password: "password123",
        keepSignedIn: false,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 429,
        message: "Too many attempts. Try again in 15 minutes.",
      });
    }
  });
});

describe("signOut()", () => {
  it("calls fetch with correct endpoint", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    await authRepository.signOut();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/auth/sign-out",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("resolves on successful sign-out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    const result = await authRepository.signOut();
    expect(result).toBeUndefined();
  });

  it("throws AuthError on failed sign-out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    try {
      await authRepository.signOut();
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        message: "Something went wrong. Please try again.",
      });
    }
  });
});

describe("getSession()", () => {
  it("calls fetch with correct endpoint", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ customer: VALID_CUSTOMER }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await authRepository.getSession();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/auth/session",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("returns SessionResponse with customer on valid response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ customer: VALID_CUSTOMER }),
      }),
    );

    const result = await authRepository.getSession();
    expect(result).toEqual({ customer: VALID_CUSTOMER });
  });

  it("returns SessionResponse with null customer when not authenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ customer: null }),
      }),
    );

    const result = await authRepository.getSession();
    expect(result).toEqual({ customer: null });
  });

  it("throws AuthError on invalid response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: true }),
      }),
    );

    try {
      await authRepository.getSession();
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        message: "Something went wrong. Please try again.",
      });
      expect(errorSpy).toHaveBeenCalled();
    }
  });
});

describe("requestPasswordReset()", () => {
  it("calls fetch with correct endpoint", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    await authRepository.requestPasswordReset({
      email: "test@example.com",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/auth/password-resets",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("resolves on successful request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    const result = await authRepository.requestPasswordReset({
      email: "test@example.com",
    });
    expect(result).toBeUndefined();
  });

  it("throws AuthError on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    try {
      await authRepository.requestPasswordReset({
        email: "test@example.com",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        message: "Something went wrong. Please try again.",
      });
    }
  });
});

describe("completePasswordReset()", () => {
  it("calls fetch with correct endpoint", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://test-host:9000";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    await authRepository.completePasswordReset({
      token: "reset-token",
      password: "newpassword123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test-host:9000/api/auth/password-resets/complete",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("resolves on successful reset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    const result = await authRepository.completePasswordReset({
      token: "reset-token",
      password: "newpassword123",
    });
    expect(result).toBeUndefined();
  });

  it("throws 410 AuthError when token is expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
      }),
    );

    try {
      await authRepository.completePasswordReset({
        token: "expired-token",
        password: "newpassword123",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 410,
        message: "Password reset link has expired or has already been used.",
      });
    }
  });
});

describe("network errors", () => {
  it("throws generic error when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    try {
      await authRepository.signIn({
        email: "test@example.com",
        password: "password123",
        keepSignedIn: false,
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 0,
        message: "Something went wrong. Please try again.",
      });
    }
  });

  it("throws generic error when json() throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("parse error");
        },
      }),
    );

    try {
      await authRepository.getSession();
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        message: "Something went wrong. Please try again.",
      });
    }
  });
});
