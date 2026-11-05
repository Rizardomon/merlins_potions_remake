"use client";

import { Input, type InputProps } from "@/components/ui/input";
import { formatBRL } from "@/lib/utils";

/** Campo monetário (BRL). Digita-se em centavos; exibe "R$ 0,00". */
export function MoneyInput({
  value,
  onChange,
  ...props
}: Omit<InputProps, "value" | "onChange"> & {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Input
      {...props}
      mono
      inputMode="numeric"
      value={formatBRL(value)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onChange(digits ? Number(digits) / 100 : 0);
      }}
    />
  );
}
