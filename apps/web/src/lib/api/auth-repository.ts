import { z } from "zod";
import {
  SignUpRequestSchema,
  SignInRequestSchema,
  RequestPasswordResetSchema,
  CompletePasswordResetSchema,
  SessionResponseSchema,
  SessionCustomerSchema,
} from "@merlins-potions-remake/shared";
import type {
  SignUpRequest,
  SignInRequest,
  RequestPasswordReset,
  CompletePasswordReset,
  SessionResponse,
  SessionCustomer,
} from "@merlins-potions-remake/shared";

/**
 * Camada de dados do front para auth: fetch ao BFF com validação Zod.
 * O BFF é o único dono do cookie `mp_session` — o repositório nunca acessa cookie direto.
 */

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3010";
}

export type AuthError = {
  status: number;
  message: string;
};

// Resposta de sign-up/sign-in: { customer, sessionToken, expiresAt }
const AuthSessionSchema = z.object({
  customer: SessionCustomerSchema,
  sessionToken: z.string().min(1),
  expiresAt: z.string(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

function mapStatusToMessage(status: number): string {
  switch (status) {
    case 401:
      return "Email or password is incorrect.";
    case 409:
      return "An account with this email already exists.";
    case 429:
      return "Too many attempts. Try again in 15 minutes.";
    case 410:
      return "Password reset link has expired or has already been used.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function handleResponse<T>(res: Response, schema: z.ZodSchema): Promise<T> {
  if (!res.ok) {
    throw {
      status: res.status,
      message: mapStatusToMessage(res.status),
    } as AuthError;
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw {
      status: 500,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    console.error("[auth-repository] Zod validation failed:", result.error);
    throw {
      status: 500,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }

  return result.data as T;
}

export async function signUp(input: SignUpRequest): Promise<AuthSession> {
  try {
    const validated = SignUpRequestSchema.parse(input);
    const res = await fetch(`${getBaseUrl()}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    return await handleResponse<AuthSession>(res, AuthSessionSchema);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error as AuthError;
    }
    throw {
      status: 0,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }
}

export async function signIn(input: SignInRequest): Promise<AuthSession> {
  try {
    const validated = SignInRequestSchema.parse(input);
    const res = await fetch(`${getBaseUrl()}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    return await handleResponse<AuthSession>(res, AuthSessionSchema);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error as AuthError;
    }
    throw {
      status: 0,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }
}

export async function signOut(): Promise<void> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/auth/sign-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw {
        status: res.status,
        message: mapStatusToMessage(res.status),
      } as AuthError;
    }
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error as AuthError;
    }
    throw {
      status: 0,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }
}

export async function getSession(): Promise<SessionResponse> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/auth/session`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw {
        status: res.status,
        message: mapStatusToMessage(res.status),
      } as AuthError;
    }

    return await handleResponse<SessionResponse>(res, SessionResponseSchema);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error as AuthError;
    }
    throw {
      status: 0,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }
}

export async function requestPasswordReset(
  input: RequestPasswordReset
): Promise<void> {
  try {
    const validated = RequestPasswordResetSchema.parse(input);
    const res = await fetch(`${getBaseUrl()}/api/auth/password-resets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      throw {
        status: res.status,
        message: mapStatusToMessage(res.status),
      } as AuthError;
    }
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error as AuthError;
    }
    throw {
      status: 0,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }
}

export async function completePasswordReset(
  input: CompletePasswordReset
): Promise<void> {
  try {
    const validated = CompletePasswordResetSchema.parse(input);
    const res = await fetch(`${getBaseUrl()}/api/auth/password-resets/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      throw {
        status: res.status,
        message: mapStatusToMessage(res.status),
      } as AuthError;
    }
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error as AuthError;
    }
    throw {
      status: 0,
      message: "Something went wrong. Please try again.",
    } as AuthError;
  }
}
