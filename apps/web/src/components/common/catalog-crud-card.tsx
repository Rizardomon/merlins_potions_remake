"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { DataTableCard, type DataColumn } from "@/components/common/data-table-card";
import { DescriptionFormModal } from "@/components/common/description-form-modal";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { Page } from "@merlins-potions-remake/shared";

/** Item de catálogo (papel, tipo de despesa, …). `code` só existe em quem o expõe (`showCode`). */
export type CatalogItem = { id: string; code?: number; name: string };

type Mutation = {
  mutate: (arg: never, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  isError: boolean;
  reset: () => void;
};

/**
 * Tela pronta de catálogo simples (id + descrição): lista paginada + Cadastrar/Editar
 * (modal de descrição) + remover com confirmação. Recebe os hooks do domínio e não sabe
 * nada sobre ele — `/roles` é o exemplo de uso.
 *
 * Todo catálogo desta forma deve reusar este componente em vez de remontar a tabela;
 * telas com campos além da descrição usam o `DataTableCard` direto. Ver
 * `docs/padroes/ui-web.md`.
 *
 * A coluna "Código" é opcional (`showCode`), para catálogos cujo backend gera um número
 * de exibição além do id.
 */
export function CatalogCrudCard({
  title,
  addLabel,
  addTitle,
  editTitle,
  removeTitle = "Remover registro",
  showCode = false,
  useData,
  useCreate,
  useUpdate,
  useDelete,
}: {
  title: string;
  addLabel: string;
  addTitle: string;
  editTitle: string;
  removeTitle?: string;
  /** Exibe a coluna "Código" (gerada pelo backend). Catálogos sem código omitem. */
  showCode?: boolean;
  useData: (search: string, page: number) => { data?: Page<CatalogItem>; isLoading: boolean };
  useCreate: () => Mutation;
  useUpdate: () => Mutation;
  useDelete: () => Mutation;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | undefined>();
  const [removing, setRemoving] = useState<CatalogItem | undefined>();

  const create = useCreate();
  const update = useUpdate();
  const remove = useDelete();
  const submitting = create.isPending || update.isPending;

  const openNew = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const submit = (name: string) => {
    const onSuccess = () => setModalOpen(false);
    if (editing) {
      update.mutate({ id: editing.id, input: { name } } as never, { onSuccess });
    } else {
      create.mutate({ name } as never, { onSuccess });
    }
  };

  // `reset()`: a mutation é reusada entre as linhas — sem isso o diálogo abriria exibindo o erro
  // da remoção anterior.
  const onDelete = (item: CatalogItem) => {
    remove.reset();
    setRemoving(item);
  };

  const confirmRemove = () => {
    if (!removing) return;
    remove.mutate(removing.id as never, { onSuccess: () => setRemoving(undefined) });
  };

  const columns: DataColumn<CatalogItem>[] = [
    ...(showCode
      ? [
          {
            header: "Código",
            cell: (i: CatalogItem) => i.code,
            headClassName: "w-28",
            cellClassName: "font-mono text-content-2",
          },
        ]
      : []),
    { header: "Descrição", cell: (i) => i.name, cellClassName: "font-semibold" },
    {
      header: "Ações",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      cell: (i) => (
        <div className="flex justify-end gap-2">
          <IconButton title="Editar" className="h-8 w-8" onClick={() => openEdit(i)}>
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton tone="red" title="Remover" className="h-8 w-8" onClick={() => onDelete(i)}>
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {addLabel}
        </Button>
      </div>

      <DataTableCard<CatalogItem>
        title={title}
        columns={columns}
        useData={useData}
        rowKey={(i) => i.id}
        emptyText="Nenhum registro encontrado."
      />

      <DescriptionFormModal
        open={modalOpen}
        title={editing ? editTitle : addTitle}
        label="Descrição"
        initialValue={editing?.name}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={!!removing}
        title={removeTitle}
        pending={remove.isPending}
        error={remove.isError}
        onCancel={() => setRemoving(undefined)}
        onConfirm={confirmRemove}
      >
        <p>
          Remover <strong className="text-content">{removing?.name}</strong>?
        </p>
      </ConfirmDialog>
    </div>
  );
}
