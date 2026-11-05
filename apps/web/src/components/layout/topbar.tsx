"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { useMenu } from "@/hooks/use-app";
import { metaForPath } from "./nav-config";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const { data: menu } = useMenu();
  const meta = metaForPath(pathname, menu);

  return (
    <header className="flex h-[68px] flex-shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      <button
        onClick={onToggleSidebar}
        aria-label="Alternar menu"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-input text-content-2 transition-colors hover:bg-surface-3 hover:text-content"
      >
        <PanelLeft className="h-[19px] w-[19px]" strokeWidth={2} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[16px] font-bold leading-tight text-content">
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className="truncate text-[12.5px] text-content-3">{meta.subtitle}</p>
        )}
      </div>
    </header>
  );
}
