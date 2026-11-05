"use client";

import type { ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmação de ação destrutiva → mutation. Substitui o `window.confirm()` nativo, que destoa
 * das telas e não tem onde exibir o erro da mutation (ver `ui-web.md` §ação de linha e
 * `docs/padroes/salvar-direto.md`).
 *
 * Controlado por `open`: quem chama guarda o item em remoção e fecha no `onSuccess`.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Remover",
  pendingLabel = "Removendo…",
  errorLabel = "Falha ao remover.",
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  errorLabel?: string;
  pending?: boolean;
  error?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} className="max-w-[440px]">
      <div className="px-6 py-5 text-[14px] text-content-2">{children}</div>
      <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        {error && <span className="mr-auto text-[13px] text-red">{errorLabel}</span>}
        <Button variant="secondary" disabled={pending} onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" disabled={pending} onClick={onConfirm}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
