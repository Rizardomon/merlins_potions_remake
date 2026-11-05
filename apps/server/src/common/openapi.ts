import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Converte um schema Zod (fonte única do contrato) em um schema OpenAPI inline,
 * para uso nos decorators @ApiBody/@ApiResponse. Mantém o `@portal/shared` como
 * única fonte de verdade — o Swagger apenas reflete o Zod.
 */
export function toOpenApi(schema: z.ZodTypeAny): SchemaObject {
  const { $schema, ...rest } = zodToJsonSchema(schema as never, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  return rest as SchemaObject;
}

/** Envelope de array para respostas de lista. */
export function toOpenApiArray(schema: z.ZodTypeAny): SchemaObject {
  return { type: "array", items: toOpenApi(schema) };
}
