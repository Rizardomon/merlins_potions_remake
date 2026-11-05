import { MenuSchema, type Menu } from "@app/shared";

/** Data-access do menu de navegação (alimenta a sidebar e os títulos da topbar). */
export const menuApi = {
  async getMenu(): Promise<Menu> {
    const res = await fetch("/api/menu", { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar o menu (${res.status})`);
    return MenuSchema.parse(await res.json());
  },
};
