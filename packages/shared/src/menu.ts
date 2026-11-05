import { z } from "zod";

/**
 * Contrato do menu de navegação (sidebar + topbar).
 *
 * O menu é servido pelo backend (`GET /api/menu`) em vez de ficar cravado no front:
 * assim a navegação é dado, não código, e um projeto derivado deste template pode
 * passar a resolvê-la por usuário/permissão sem mexer no `apps/web`.
 *
 * Convenção dos identificadores:
 * - `name`  = slug único em inglês, no **singular** — ex.: `role`.
 * - `route` = mesmo slug, **plural** e com `/` — ex.: `/roles`.
 * - `label` = texto exibido na tela (PT) — ex.: `Papéis`.
 */
export const MenuItemSchema = z.object({
  /** Código único do item (slug singular, inglês). */
  name: z.string().min(1).max(120),
  /** Texto exibido no menu (PT). */
  label: z.string().min(1).max(120),
  /** Rota/URL do item (única). */
  route: z.string().min(1).max(200),
  /** Nome do ícone lucide (PascalCase), resolvido para componente no front. */
  icon: z.string().min(1).max(60),
  /** Título da topbar (default = label quando ausente). */
  title: z.string().max(120).nullable(),
  /** Subtítulo da topbar. */
  subtitle: z.string().max(200).nullable(),
  /** Prefixos extras que também marcam o item ativo (ex.: rotas de detalhe). */
  match: z.array(z.string()).nullable(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

/** Seção (agrupador) do menu, já ordenada pelo backend. */
export const MenuSectionSchema = z.object({
  label: z.string().min(1).max(60),
  items: z.array(MenuItemSchema),
});
export type MenuSection = z.infer<typeof MenuSectionSchema>;

export const MenuSchema = z.array(MenuSectionSchema);
export type Menu = z.infer<typeof MenuSchema>;
