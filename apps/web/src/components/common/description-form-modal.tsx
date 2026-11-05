"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Modal com um único campo de texto (Descrição/Nome). */
export function DescriptionFormModal({
  open,
  title,
  label = "Descrição",
  initialValue,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  label?: string;
  initialValue?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(initialValue ?? "");
  }, [open, initialValue]);

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="px-6 py-5">
        <Field label={label} required>
          <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </Field>
      </div>
      <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          disabled={!value.trim() || submitting}
          onClick={() => onSubmit(value.trim())}
        >
          {submitting ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Dialog>
  );
}
