import { Injectable } from "@nestjs/common";
import type { Menu, MenuSection } from "@app/shared";
import { MenuRepository, type MenuItemRow } from "./menu.repository";

/**
 * Monta o menu de navegação: agrupa as linhas planas do repository em seções,
 * preservando a ordem já resolvida na origem.
 *
 * É aqui que entraria a filtragem por permissão do usuário, se o projeto derivado
 * adicionar autenticação — o contrato com o front não muda.
 */
@Injectable()
export class MenuService {
  constructor(private readonly repository: MenuRepository) {}

  async getMenu(): Promise<Menu> {
    const rows = await this.repository.findActive();

    const sections: MenuSection[] = [];
    for (const row of rows) {
      let section = sections.find((s) => s.label === row.section);
      if (!section) {
        section = { label: row.section, items: [] };
        sections.push(section);
      }
      section.items.push(this.toItem(row));
    }
    return sections;
  }

  private toItem(row: MenuItemRow) {
    return {
      name: row.name,
      label: row.label,
      route: row.route,
      icon: row.icon,
      title: row.title,
      subtitle: row.subtitle,
      match: row.match,
    };
  }
}
