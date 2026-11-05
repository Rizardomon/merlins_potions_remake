import {
  RoleListSchema,
  RoleSchema,
  type CreateRoleInput,
  type Page,
  type Role,
  type UpdateRoleInput,
} from "@app/shared";

/**
 * Data-access do catálogo de papéis: fala com o BFF (`/api/roles`), valida a resposta
 * com o contrato Zod do `@app/shared` e devolve dados já tipados.
 *
 * As telas nunca chamam `fetch` direto — elas consomem os hooks de `hooks/use-app.ts`,
 * que por sua vez consomem este repository. Assim a origem dos dados é um detalhe
 * trocável. Ver `docs/padroes/ui-web.md` e `docs/padroes/nova-tela.md`.
 *
 * Busca e paginação são client-side porque o backend devolve a lista completa; um
 * domínio com volume maior deve paginar no servidor e este arquivo passa a repassar os
 * parâmetros na query string.
 */

async function fetchAll(): Promise<Role[]> {
  const res = await fetch("/api/roles", { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao carregar papéis (${res.status})`);
  return RoleListSchema.parse(await res.json());
}

function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

/** Extrai a mensagem de erro da API (o Nest devolve `message`), com fallback pelo status. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return (data && (data.message || data.error)) ?? `${fallback} (${res.status})`;
}

export const roleApi = {
  /** Universo de papéis (sem paginar) — para selects. */
  listAllRoles(): Promise<Role[]> {
    return fetchAll();
  },

  async listRoles({
    search = "",
    page = 1,
    pageSize = 12,
  }: { search?: string; page?: number; pageSize?: number } = {}): Promise<Page<Role>> {
    const all = await fetchAll();
    const q = search.trim().toLowerCase();
    const filtered = q ? all.filter((r) => r.name.toLowerCase().includes(q)) : all;
    return paginate(filtered, page, pageSize);
  },

  async createRole(input: CreateRoleInput): Promise<Role> {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await errorMessage(res, "Falha ao criar papel"));
    return RoleSchema.parse(await res.json());
  },

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    const res = await fetch(`/api/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await errorMessage(res, "Falha ao atualizar papel"));
    return RoleSchema.parse(await res.json());
  },

  async deleteRole(id: string): Promise<void> {
    const res = await fetch(`/api/roles/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await errorMessage(res, "Falha ao remover papel"));
  },
};
