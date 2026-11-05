"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

/**
 * Single-select do design. Fecha ao clicar fora.
 *
 * `searchable={false}` esconde o campo de busca e mantém o resto do layout — é o substituto do
 * `<select>` nativo, cujo dropdown era o do sistema operacional.
 *
 * **Teclado**: ↓/↑ navegam a lista filtrada (a primeira ↓ vai para a 1ª opção, e a
 * navegação circula), Enter escolhe a opção ativa, Esc fecha; com a lista fechada, ↓/Enter abrem.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione",
  className,
  searchable = true,
  disabled = false,
}: {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1); // opção navegada por teclado (-1 = nenhuma)
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered =
    searchable && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(-1);
  };

  const pick = (option: ComboboxOption) => {
    onValueChange(option.value);
    close();
  };

  // Mantém a opção ativa visível quando a lista tem scroll.
  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!filtered.length) return;
      const down = e.key === "ArrowDown";
      setActive((i) =>
        i < 0
          ? down
            ? 0
            : filtered.length - 1
          : (i + (down ? 1 : -1) + filtered.length) % filtered.length,
      );
      return;
    }
    if (e.key === "Enter" && filtered[active]) {
      e.preventDefault();
      pick(filtered[active]);
    }
  };

  return (
    <div ref={ref} className={cn("relative", className)} onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // Mesmo contraste do `Input`: habilitado com fundo branco e borda firme;
          // desabilitado no cinza, com texto apagado.
          "flex h-11 w-full items-center justify-between rounded-input border bg-surface px-3.5 text-left text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none",
          "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-3 disabled:text-content-3",
          open ? "border-accent shadow-ring" : "border-border-strong",
          selected ? "text-content" : "text-content-3",
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-content-3" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full animate-pop overflow-hidden rounded-input border border-border bg-surface shadow-lg">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 flex-shrink-0 text-content-3" strokeWidth={2} />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(-1); // a lista mudou: a próxima ↓ recomeça na 1ª opção
                }}
                placeholder="Buscar..."
                className="h-10 w-full bg-transparent text-sm text-content placeholder:text-content-3 focus:outline-none"
              />
            </div>
          )}
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {filtered.length ? (
              filtered.map((o, i) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "w-full px-3.5 py-2 text-left text-sm transition-colors hover:bg-surface-2",
                      i === active && "bg-surface-2",
                      o.value === value ? "font-semibold text-accent-text" : "text-content",
                    )}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3.5 py-3 text-sm text-content-3">Nenhum resultado.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
