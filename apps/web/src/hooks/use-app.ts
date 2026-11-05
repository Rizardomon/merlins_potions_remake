"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRoleInput, UpdateRoleInput } from "@merlins-potions-remake/shared";
import { menuApi } from "@/lib/api/menu-repository";
import { roleApi } from "@/lib/api/role-repository";

/**
 * Hooks de dados (TanStack Query sobre os repositories de `lib/api/`).
 *
 * As telas dependem **apenas** destes hooks — nunca de `fetch` nem do repository direto.
 * Cada domínio novo acrescenta aqui sua chave em `queryKeys` e seus hooks de query e
 * mutation. Ver `docs/padroes/nova-tela.md`.
 */

export const queryKeys = {
  menu: ["menu"] as const,
  roles: (search: string, page: number) => ["roles", { search, page }] as const,
};

/** Menu de navegação. `staleTime` alto: muda raramente e é lido em toda navegação. */
export function useMenu() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: () => menuApi.getMenu(),
    staleTime: 5 * 60_000,
  });
}

export function useRoles(search = "", page = 1) {
  return useQuery({
    queryKey: queryKeys.roles(search, page),
    queryFn: () => roleApi.listRoles({ search, page }),
  });
}

/** Universo de papéis (sem paginar) — para selects. */
export function useAllRoles() {
  return useQuery({
    queryKey: ["roles", "all"] as const,
    queryFn: () => roleApi.listAllRoles(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Invalida TODAS as listas de papéis após uma mutação — a chave `["roles", …]` cobre
 * cada combinação de busca/página em cache, que de outro modo continuariam obsoletas.
 */
function useInvalidateRoles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["roles"] });
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => roleApi.createRole(input),
    onSuccess: invalidate,
  });
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      roleApi.updateRole(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (id: string) => roleApi.deleteRole(id),
    onSuccess: invalidate,
  });
}
