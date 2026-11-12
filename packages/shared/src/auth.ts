import { z } from "zod";

/**
 * Contrato de autenticação do cliente — **fonte única** dos tipos de auth.
 *
 * O backend valida a entrada com os schemas de request; o frontend valida a
 * resposta da API/BFF com `SessionResponseSchema`. Nenhum DTO de auth deve ser
 * duplicado em `apps/server` ou `apps/web`.
 *
 * Email é sempre normalizado (`trim().toLowerCase()`) na entrada e o sign-up
 * exige aceite explícito dos termos (`termsAccepted: true`). Ver ADR-001 e
 * TechSpec MP-002 ("Core Interfaces").
 */

const NormalizedEmailSchema = z.string().trim().toLowerCase().email();

export const SignUpRequestSchema = z.object({
  fullName: z.string().trim().min(1),
  email: NormalizedEmailSchema,
  password: z.string().min(8),
  newsletterOptIn: z.boolean(),
  termsAccepted: z.literal(true),
});
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;

export const SignInRequestSchema = z.object({
  email: NormalizedEmailSchema,
  password: z.string().min(1),
  keepSignedIn: z.boolean(),
});
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

export const RequestPasswordResetSchema = z.object({
  email: NormalizedEmailSchema,
});
export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>;

export const CompletePasswordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});
export type CompletePasswordReset = z.infer<
  typeof CompletePasswordResetSchema
>;

export const SessionCustomerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  firstName: z.string(),
  email: z.string().email(),
});
export type SessionCustomer = z.infer<typeof SessionCustomerSchema>;

export const SessionResponseSchema = z.object({
  customer: SessionCustomerSchema.nullable(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
