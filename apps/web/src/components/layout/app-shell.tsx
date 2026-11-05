"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { SettingsModal } from "./settings-modal";

/** Chave do estado colapsado da sidebar em localStorage. */
const COLLAPSE_KEY = "app-sidebar-collapsed";

/**
 * Moldura de todas as telas internas: sidebar + topbar + área de conteúdo.
 *
 * O estado colapsado só é lido no `useEffect` (e não na inicialização do `useState`)
 * porque `localStorage` não existe no render do servidor — ler ali quebraria a
 * hidratação.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage indisponível — mantém o padrão expandido */
    }
  }, []);

  const toggleSidebar = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-content">
      <Sidebar collapsed={collapsed} onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-content animate-fade-up p-[26px]">{children}</div>
        </main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
