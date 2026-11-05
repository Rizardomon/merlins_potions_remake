import { type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Label uppercase + campo. `required` mostra asterisco vermelho; `hint` mostra ícone de ajuda. */
export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.06em] text-content-3">
        {required && <span className="text-red">*</span>}
        {label}
        {hint && (
          <HelpCircle
            className="h-3.5 w-3.5 text-content-3"
            strokeWidth={2}
            aria-label={hint}
          >
            <title>{hint}</title>
          </HelpCircle>
        )}
      </span>
      {children}
    </label>
  );
}
