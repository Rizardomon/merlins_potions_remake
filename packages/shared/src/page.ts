import { z } from "zod";

/**
 * Envelope de paginação usado por toda listagem do template.
 *
 * É uma fábrica porque o Zod precisa do schema do item para inferir o tipo:
 * `PageSchema(RoleSchema)` produz o contrato de uma página de papéis.
 */
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Parâmetros de listagem aceitos pelos endpoints paginados. */
export const PageQuerySchema = z.object({
  search: z.string().default(""),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(12),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;
