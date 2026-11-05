import { z } from "zod";

/**
 * Validação/tipagem das variáveis de ambiente do backend.
 * Usada pelo ConfigModule (`validate`) — falha o boot se algo obrigatório faltar.
 *
 * Os defaults existem para o `dev` rodar sem `.env`. Ao adicionar uma env de produção
 * com segredo, replique aqui o padrão do `superRefine`: reprovar o valor de dev quando
 * `NODE_ENV=production`, para o server não subir silenciosamente com credencial pública.
 */
const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3011),
  WEB_ORIGIN: z.string().url().default("http://localhost:3010"),

  /**
   * Conexão do Postgres. **Opcional no template**: os repositories de exemplo são
   * em memória, então o app sobe sem banco. Ao ligar a persistência (ver
   * `modules/_example/`), troque para `z.string().url()` — obrigatória — e importe o
   * `DatabaseModule` no `app.module.ts`.
   */
  DATABASE_URL: z.string().url().optional(),

  // Swagger em /api/docs. Sem valor explícito: ligado fora de produção, desligado em produção.
  SWAGGER_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

function isLocalhost(url: string): boolean {
  const { hostname } = new URL(url);
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  // Cair no default de localhost em produção não quebra o boot, mas quebra o runtime
  // (o CORS barra o web).
  if (isLocalhost(env.WEB_ORIGIN)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["WEB_ORIGIN"],
      message: "aponta para localhost em produção",
    });
  }
});

export type Env = z.infer<typeof envSchema> & { SWAGGER_ENABLED: boolean };

export function validateEnv(config: Record<string, unknown>): Env {
  const env = envSchema.parse(config);
  return {
    ...env,
    SWAGGER_ENABLED: env.SWAGGER_ENABLED ?? env.NODE_ENV !== "production",
  };
}
