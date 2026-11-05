"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** Segmented control (track neutro, opção ativa âmbar com texto branco). */
export function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-input bg-surface-3 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "rounded-[7px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none",
              active
                ? "bg-accent text-white shadow-[0_1px_3px_rgba(221,126,3,.4)]"
                : "text-content-2 hover:text-content",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
