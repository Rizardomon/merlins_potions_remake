import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Estado vazio. `dashed` para a borda tracejada (ex.: "Cargo atual"). */
export function EmptyState({
  icon,
  title,
  description,
  dashed,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-card px-6 py-10 text-center",
        dashed && "border-2 border-dashed border-border",
        className,
      )}
    >
      {icon && <div className="text-content-3">{icon}</div>}
      <p className="text-sm font-semibold text-content-2">{title}</p>
      {description && <p className="text-[13px] text-content-3">{description}</p>}
    </div>
  );
}
