"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenu } from "@/hooks/use-app";
import { menuToNavSections, navSections, type NavItem } from "./nav-config";

function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  return (item.match ?? []).some((p) => pathname.startsWith(p));
}

export function Sidebar({
  collapsed,
  onOpenSettings,
}: {
  collapsed: boolean;
  onOpenSettings: () => void;
}) {
  const pathname = usePathname();
  const { data: menu } = useMenu();
  // Menu vem do backend; enquanto carrega, usa o estático (evita a sidebar piscar vazia).
  const sections = menu ? menuToNavSections(menu) : navSections;

  return (
    <aside
      className={cn(
        "flex flex-shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-[.22s] ease-[cubic-bezier(.4,0,.2,1)]",
        collapsed ? "w-[78px]" : "w-[264px]",
      )}
    >
      {/* Marca — troque pelo logo do projeto (public/brand/). */}
      <div
        className={cn(
          "flex h-[68px] flex-shrink-0 items-center px-[22px]",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-accent text-[14px] font-extrabold text-white">
            A
          </div>
          {!collapsed && (
            <span className="truncate text-[15px] font-extrabold tracking-tight text-content">
              App Template
            </span>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-[3px] overflow-y-auto overflow-x-hidden px-3.5 py-1.5">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-2.5 pb-1.5 pt-3.5 text-[11px] font-bold uppercase tracking-[.07em] text-content-3">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-accent-soft text-accent-text shadow-[inset_3px_0_0_var(--accent)]"
                      : "text-content-2 hover:bg-surface-3 hover:text-content",
                  )}
                >
                  <Icon className="h-[19px] w-[19px] flex-shrink-0" strokeWidth={2} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Rodapé: acesso às configurações. Com autenticação, é aqui que entra o card do usuário. */}
      <div className="flex-shrink-0 border-t border-border px-3.5 pb-3.5 pt-2.5">
        <button
          onClick={onOpenSettings}
          title="Configurações"
          className={cn(
            "flex h-[42px] w-full items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-content-2 transition-colors duration-150 hover:bg-surface-3 hover:text-content",
            collapsed && "justify-center px-0",
          )}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
          {!collapsed && <span className="truncate">Configurações</span>}
        </button>
      </div>
    </aside>
  );
}
