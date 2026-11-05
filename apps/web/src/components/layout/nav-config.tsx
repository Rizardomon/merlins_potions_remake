import {
  LayoutDashboard,
  Contact,
  Building2,
  CalendarDays,
  Circle,
  FolderKanban,
  Gift,
  Receipt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Menu } from "@app/shared";

/**
 * Navegação da sidebar/topbar.
 *
 * A fonte real do menu é o backend (`GET /api/menu`, hook `useMenu`). Este arquivo faz
 * a ponte: converte o menu (onde o ícone é uma **string**) nas seções que a sidebar
 * renderiza (onde o ícone é um **componente**), e guarda o menu estático de fallback
 * usado enquanto a requisição não responde — sem ele a sidebar piscaria vazia a cada
 * carga.
 *
 * Mantenha o fallback em sincronia com o seed de `apps/server/src/modules/menu/`.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Prefixos que também marcam este item como ativo (ex.: rota de detalhe). */
  match?: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Menu de fallback, exibido enquanto `/api/menu` não responde. */
export const navSections: NavSection[] = [
  {
    label: "Geral",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Cadastros",
    items: [{ label: "Papéis", href: "/roles", icon: Contact }],
  },
];

/** Título/subtítulo da topbar por rota, quando o menu ainda não chegou. */
export const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral da aplicação" },
  "/roles": { title: "Papéis", subtitle: "Cadastro de papéis" },
};

/**
 * Mapa nome (lucide) → componente, para resolver o `icon` (string) vindo do backend.
 * Ícones novos precisam ser registrados aqui: o import estático mantém o bundle enxuto,
 * ao custo de exigir esta linha a mais.
 */
const iconByName: Record<string, LucideIcon> = {
  LayoutDashboard,
  Contact,
  Building2,
  CalendarDays,
  FolderKanban,
  Gift,
  Receipt,
  ShieldCheck,
  Users,
};

/** Resolve o nome do ícone do menu; usa um fallback neutro se desconhecido. */
export function resolveIcon(name: string): LucideIcon {
  return iconByName[name] ?? Circle;
}

/** Converte o menu do backend (icon = string) nas seções da sidebar (icon = componente). */
export function menuToNavSections(menu: Menu): NavSection[] {
  return menu.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      label: item.label,
      href: item.route,
      icon: resolveIcon(item.icon),
      match: item.match ?? undefined,
    })),
  }));
}

/**
 * Título/subtítulo da topbar para a rota atual, preferindo o que veio do backend.
 *
 * Casa pelo prefixo mais longo para que rotas de detalhe (`/roles/123`) herdem o
 * cabeçalho da listagem em vez de caírem no genérico.
 */
export function metaForPath(
  pathname: string,
  menu?: Menu,
): { title: string; subtitle: string } {
  const items = (menu ?? []).flatMap((section) => section.items);
  const fromMenu = items
    .filter((item) => pathname.startsWith(item.route))
    .sort((a, b) => b.route.length - a.route.length)[0];

  if (fromMenu) {
    return { title: fromMenu.title ?? fromMenu.label, subtitle: fromMenu.subtitle ?? "" };
  }

  const key = Object.keys(pageMeta)
    .filter((p) => pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return key ? pageMeta[key] : { title: "App Template", subtitle: "" };
}
