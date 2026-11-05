"use client";

import { CatalogCrudCard } from "@/components/common/catalog-crud-card";
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "@/hooks/use-app";

/**
 * CRUD de Papéis — a tela de exemplo do template.
 *
 * Toda a mecânica (busca, paginação, modal de cadastro/edição, confirmação de remoção)
 * vem do `CatalogCrudCard`; a tela só liga os hooks do domínio. Catálogos simples
 * (id + descrição) devem reusar esse componente em vez de reimplementar a tabela.
 */
export default function RolesPage() {
  return (
    <CatalogCrudCard
      title="Papéis cadastrados"
      addLabel="Cadastrar Papel"
      addTitle="Cadastrar Papel"
      editTitle="Editar Papel"
      removeTitle="Remover papel"
      useData={useRoles}
      useCreate={useCreateRole}
      useUpdate={useUpdateRole}
      useDelete={useDeleteRole}
    />
  );
}
