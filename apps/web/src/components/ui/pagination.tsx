"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Paginação compacta com elipses (1 2 3 … N). */
export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const pages = pageRange(page, pageCount);

  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-input px-2 text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="flex items-center gap-1.5">
      <button
        className={cn(btn, "text-content-2 hover:bg-surface-3")}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-content-3">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              btn,
              p === page
                ? "bg-accent-soft text-accent-text"
                : "text-content-2 hover:bg-surface-3",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        className={cn(btn, "text-content-2 hover:bg-surface-3")}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function pageRange(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const result: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) result.push("…");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < count - 1) result.push("…");
  result.push(count);
  return result;
}
