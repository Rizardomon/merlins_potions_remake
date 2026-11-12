import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useSession,
  useSignIn,
  useSignUp,
  useSignOut,
  useRequestPasswordReset,
  useCompletePasswordReset,
  authQueryKeys,
} from "./use-auth";
import * as authRepository from "@/lib/api/auth-repository";
import type { SessionCustomer } from "@merlins-potions-remake/shared";

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

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useSession()", () => {
  it("fetches session on render", async () => {
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValue({ customer: VALID_CUSTOMER });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ customer: VALID_CUSTOMER });
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("returns null customer when not authenticated", async () => {
    vi.spyOn(authRepository, "getSession").mockResolvedValue({
      customer: null,
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ customer: null });
  });

  it("handles error from repository", async () => {
    const error = { status: 500, message: "Something went wrong" };
    vi.spyOn(authRepository, "getSession").mockRejectedValue(error);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useSignIn()", () => {
  it("calls signIn and returns session", async () => {
    const mockSignIn = vi
      .spyOn(authRepository, "signIn")
      .mockResolvedValue(VALID_AUTH_SESSION);
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValue({ customer: VALID_CUSTOMER });

    const { result } = renderHook(() => useSignIn(), { wrapper });

    act(() => {
      result.current.mutate({
        email: "test@example.com",
        password: "password123",
        keepSignedIn: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(VALID_AUTH_SESSION);
    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it("invalidates session query on success", async () => {
    vi.spyOn(authRepository, "signIn").mockResolvedValue(VALID_AUTH_SESSION);
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValue({ customer: VALID_CUSTOMER });

    const { result: sessionResult } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(sessionResult.current.isSuccess).toBe(true);
    });

    const { result: signInResult } = renderHook(() => useSignIn(), { wrapper });

    act(() => {
      signInResult.current.mutate({
        email: "test@example.com",
        password: "password123",
        keepSignedIn: false,
      });
    });

    await waitFor(() => {
      expect(signInResult.current.isSuccess).toBe(true);
    });

    // Session query should be refetched after sign-in
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it("handles error from signIn", async () => {
    const error = { status: 401, message: "Email or password is incorrect." };
    vi.spyOn(authRepository, "signIn").mockRejectedValue(error);

    const { result } = renderHook(() => useSignIn(), { wrapper });

    act(() => {
      result.current.mutate({
        email: "test@example.com",
        password: "wrong",
        keepSignedIn: false,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useSignUp()", () => {
  it("calls signUp and returns session", async () => {
    const mockSignUp = vi
      .spyOn(authRepository, "signUp")
      .mockResolvedValue(VALID_AUTH_SESSION);
    vi.spyOn(authRepository, "getSession").mockResolvedValue({
      customer: VALID_CUSTOMER,
    });

    const { result } = renderHook(() => useSignUp(), { wrapper });

    act(() => {
      result.current.mutate({
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
        newsletterOptIn: false,
        termsAccepted: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(VALID_AUTH_SESSION);
    expect(mockSignUp).toHaveBeenCalledOnce();
  });

  it("invalidates session query on success", async () => {
    vi.spyOn(authRepository, "signUp").mockResolvedValue(VALID_AUTH_SESSION);
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValue({ customer: VALID_CUSTOMER });

    const { result: sessionResult } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(sessionResult.current.isSuccess).toBe(true);
    });

    const { result: signUpResult } = renderHook(() => useSignUp(), { wrapper });

    act(() => {
      signUpResult.current.mutate({
        fullName: "New User",
        email: "new@example.com",
        password: "password123",
        newsletterOptIn: true,
        termsAccepted: true,
      });
    });

    await waitFor(() => {
      expect(signUpResult.current.isSuccess).toBe(true);
    });

    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it("handles error from signUp (409 duplicate email)", async () => {
    const error = {
      status: 409,
      message: "An account with this email already exists.",
    };
    vi.spyOn(authRepository, "signUp").mockRejectedValue(error);

    const { result } = renderHook(() => useSignUp(), { wrapper });

    act(() => {
      result.current.mutate({
        fullName: "Test User",
        email: "existing@example.com",
        password: "password123",
        newsletterOptIn: false,
        termsAccepted: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useSignOut()", () => {
  it("calls signOut", async () => {
    const mockSignOut = vi
      .spyOn(authRepository, "signOut")
      .mockResolvedValue(undefined);
    vi.spyOn(authRepository, "getSession").mockResolvedValue({
      customer: null,
    });

    const { result } = renderHook(() => useSignOut(), { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("invalidates session query on success", async () => {
    vi.spyOn(authRepository, "signOut").mockResolvedValue(undefined);
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValueOnce({ customer: VALID_CUSTOMER })
      .mockResolvedValueOnce({ customer: null });

    const { result: sessionResult } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(sessionResult.current.isSuccess).toBe(true);
    });

    expect(sessionResult.current.data?.customer).toBeTruthy();

    const { result: signOutResult } = renderHook(() => useSignOut(), { wrapper });

    act(() => {
      signOutResult.current.mutate();
    });

    await waitFor(() => {
      expect(signOutResult.current.isSuccess).toBe(true);
    });

    // Session query should be refetched and now return null
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it("handles error from signOut", async () => {
    const error = { status: 500, message: "Something went wrong." };
    vi.spyOn(authRepository, "signOut").mockRejectedValue(error);

    const { result } = renderHook(() => useSignOut(), { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useRequestPasswordReset()", () => {
  it("calls requestPasswordReset", async () => {
    const mockRequest = vi
      .spyOn(authRepository, "requestPasswordReset")
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useRequestPasswordReset(), { wrapper });

    act(() => {
      result.current.mutate({ email: "test@example.com" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRequest).toHaveBeenCalledOnce();
  });

  it("does not invalidate session query", async () => {
    vi.spyOn(authRepository, "requestPasswordReset").mockResolvedValue(
      undefined
    );
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValue({ customer: VALID_CUSTOMER });

    const { result: sessionResult } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(sessionResult.current.isSuccess).toBe(true);
    });

    const { result } = renderHook(() => useRequestPasswordReset(), { wrapper });

    act(() => {
      result.current.mutate({ email: "test@example.com" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Session query should NOT be refetched
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
});

describe("useCompletePasswordReset()", () => {
  it("calls completePasswordReset", async () => {
    const mockComplete = vi
      .spyOn(authRepository, "completePasswordReset")
      .mockResolvedValue(undefined);
    vi.spyOn(authRepository, "getSession").mockResolvedValue({
      customer: null,
    });

    const { result } = renderHook(() => useCompletePasswordReset(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        token: "reset-token",
        password: "newpassword123",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockComplete).toHaveBeenCalledOnce();
  });

  it("invalidates session query on success", async () => {
    vi.spyOn(authRepository, "completePasswordReset").mockResolvedValue(
      undefined
    );
    const mockGetSession = vi
      .spyOn(authRepository, "getSession")
      .mockResolvedValueOnce({ customer: VALID_CUSTOMER })
      .mockResolvedValueOnce({ customer: null });

    const { result: sessionResult } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(sessionResult.current.isSuccess).toBe(true);
    });

    const { result } = renderHook(() => useCompletePasswordReset(), { wrapper });

    act(() => {
      result.current.mutate({
        token: "reset-token",
        password: "newpassword123",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Session query should be refetched after reset completes
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it("handles error from completePasswordReset (410 expired token)", async () => {
    const error = {
      status: 410,
      message: "Password reset link has expired or has already been used.",
    };
    vi.spyOn(authRepository, "completePasswordReset").mockRejectedValue(error);

    const { result } = renderHook(() => useCompletePasswordReset(), { wrapper });

    act(() => {
      result.current.mutate({
        token: "expired-token",
        password: "newpassword123",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("authQueryKeys", () => {
  it("exports correct query key structure", () => {
    expect(authQueryKeys.session).toEqual(["session"]);
  });
});
