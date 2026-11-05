"use client";

import { Combobox } from "./combobox";

export type BooleanSelectProps = {
  value: boolean | null | undefined;
  onChange: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Seletor booleano padrão (Sim/Não) — substitui checkboxes em campos "ativo/inativo",
 * "tem/não tem", "sim/não". Sempre dentro de um `<Field label=...>`, igual aos demais campos.
 * Ver docs/padroes/ui-web.md (§ primitivos). Não há estado vazio: `null`/`undefined` → "Não"
 * (comporta-se como booleano: SIM == true, NÃO == false).
 *
 * Usa o `Combobox` sem busca — o `<select>` nativo abria o menu do sistema.
 */
const OPTIONS = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

export function BooleanSelect({
  value,
  onChange,
  className,
  disabled,
}: BooleanSelectProps) {
  return (
    <Combobox
      searchable={false}
      options={OPTIONS}
      value={value === true ? "sim" : "nao"}
      onValueChange={(v) => onChange(v === "sim")}
      className={className}
      disabled={disabled}
    />
  );
}
