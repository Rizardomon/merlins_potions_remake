import { Injectable } from "@nestjs/common";

/**
 * Linha do menu (`menu_item`) — **mocada em memória**.
 *
 * A navegação é dado, não código: o front consome `GET /api/menu` e monta a sidebar a
 * partir daí (ver `docs/padroes/ui-web.md`). Para adicionar uma tela ao menu do seu
 * projeto, acrescente uma linha aqui.
 *
 * Ao ligar a persistência, esta lista vira uma tabela e os métodos abaixo viram queries
 * Drizzle — o service e o controller não mudam.
 */
export interface MenuItemRow {
  /** Código único do item (slug singular, inglês). */
  name: string;
  /** Texto exibido no menu (PT). */
  label: string;
  /** Rota/URL do item. */
  route: string;
  /** Nome do ícone lucide (PascalCase) — resolvido para componente no front. */
  icon: string;
  /** Rótulo da seção/agrupador do menu. */
  section: string;
  /** Ordem da seção no menu. */
  sectionOrder: number;
  /** Ordem do item dentro da seção. */
  itemOrder: number;
  /** Título da topbar (null = usa o `label`). */
  title: string | null;
  /** Subtítulo da topbar. */
  subtitle: string | null;
  /** Prefixos extras que também marcam o item ativo (ex.: rotas de detalhe). */
  match: string[] | null;
  /** Exibe/oculta o item no menu. */
  active: boolean;
}

@Injectable()
export class MenuRepository {
  private readonly rows: MenuItemRow[] = [
    {
      name: "dashboard",
      label: "Dashboard",
      route: "/dashboard",
      icon: "LayoutDashboard",
      section: "Geral",
      sectionOrder: 1,
      itemOrder: 1,
      title: "Dashboard",
      subtitle: "Visão geral da aplicação",
      match: null,
      active: true,
    },
    {
      name: "role",
      label: "Papéis",
      route: "/roles",
      icon: "Contact",
      section: "Cadastros",
      sectionOrder: 2,
      itemOrder: 1,
      title: "Papéis",
      subtitle: "Cadastro de papéis",
      match: null,
      active: true,
    },
  ];

  /** Itens visíveis do menu, já na ordem de exibição. */
  async findActive(): Promise<MenuItemRow[]> {
    return this.rows
      .filter((row) => row.active)
      .sort(
        (a, b) => a.sectionOrder - b.sectionOrder || a.itemOrder - b.itemOrder,
      );
  }
}
