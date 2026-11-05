"use client";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

/** Abas com underline âmbar (estilo do handoff). */
export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 border-b border-border", className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "-mb-px px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none",
              active
                ? "text-accent-text shadow-[inset_0_-2px_0_var(--accent)]"
                : "text-content-2 hover:text-content",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
