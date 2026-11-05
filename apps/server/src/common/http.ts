import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import type { z } from "zod";

/**
 * Identificação do autor da operação, gravada em `created_by`/`updated_by`.
 *
 * O template **não tem autenticação** (ver `docs/padroes/auth.md`): não há usuário na
 * requisição, então todo mundo é `system`. Ao plugar um guard de SSO, esta é a única
 * função a mudar — passe a ler o subject do token (`req.user.sub`) e os controllers
 * continuam iguais.
 */
export function actorOf(_req: Request): string {
  return "system";
}

/** Valida o corpo com o Zod do contrato, traduzindo erro para 400. */
export function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.issues);
  }
  return result.data;
}
