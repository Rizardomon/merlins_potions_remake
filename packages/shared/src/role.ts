import { z } from "zod";

/**
 * Contrato do catálogo de Papéis (`role`) — domínio de exemplo do template.
 *
 * Este arquivo é a **fonte única** dos tipos/DTOs do domínio: o backend valida a
 * entrada com ele e o frontend valida a resposta com ele. Não existe DTO duplicado
 * dentro do módulo Nest. Ver `docs/padroes/backend-modulo.md`.
 */
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
});
export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = RoleSchema.omit({ id: true });
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = CreateRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;

export const RoleListSchema = z.array(RoleSchema);
export type RoleList = z.infer<typeof RoleListSchema>;
