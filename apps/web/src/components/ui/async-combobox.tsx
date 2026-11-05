"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComboboxOption } from "./combobox";

/**
 * Single-select com busca **no servidor** (typeahead). Não pré-carrega a lista — chama
 * `loadOptions(query)` (debounced) a cada digitação. Usado quando a base é grande/cresce
 * (ex.: seleção de cliente numa base grande). Ver docs/padroes/ui-web.md (§2).
 *
 * **Teclado**: mesmo comportamento do `Combobox` — ↓/↑ navegam o resultado da busca,
 * Enter escolhe a opção ativa, Esc fecha; com a lista fechada, ↓/Enter abrem.
 */
export function AsyncCombobox({
  value,
  selectedLabel,
  onChange,
  loadOptions,
  placeholder = "Selecione",
  className,
}: {
  value: string;
  selectedLabel: string;
  onChange: (value: string, label: string) => void;
  loadOptions: (query: string) => Promise<ComboboxOption[]>;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Busca debounced no servidor; ignora resultados obsoletos.
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (!term) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let active = true;
    const t = setTimeout(() => {
      loadOptions(term)
        .then((res) => active && setOptions(res))
        .catch(() => active && setOptions([]))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, open, loadOptions]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(-1);
  };

  const pick = (option: ComboboxOption) => {
    onChange(option.value, option.label);
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
      if (!options.length) return;
      const down = e.key === "ArrowDown";
      setActive((i) =>
        i < 0
          ? down
            ? 0
            : options.length - 1
          : (i + (down ? 1 : -1) + options.length) % options.length,
      );
      return;
    }
    if (e.key === "Enter" && options[active]) {
      e.preventDefault();
      pick(options[active]);
    }
  };

  return (
    <div ref={ref} className={cn("relative", className)} onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // Mesmo contraste do `Input`.
          "flex h-11 w-full items-center justify-between rounded-input border bg-surface px-3.5 text-left text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none",
          open ? "border-accent shadow-ring" : "border-border-strong",
          value ? "text-content" : "text-content-3",
        )}
      >
        <span className="truncate">{value ? selectedLabel : placeholder}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-content-3" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full animate-pop overflow-hidden rounded-input border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-content-3" strokeWidth={2} />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1); // resultado vai mudar: a próxima ↓ recomeça na 1ª opção
              }}
              placeholder="Buscar..."
              className="h-10 w-full bg-transparent text-sm text-content placeholder:text-content-3 focus:outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-content-3" strokeWidth={2} />}
          </div>
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {options.length ? (
              options.map((o, i) => (
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
              <li className="px-3.5 py-3 text-sm text-content-3">
                {query.trim() ? (loading ? "Buscando…" : "Nenhum resultado.") : "Digite para buscar."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
