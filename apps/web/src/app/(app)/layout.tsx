import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Layout das telas internas. O grupo de rotas `(app)` não aparece na URL — serve só
 * para aplicar esta moldura a todas as telas de dentro.
 *
 * O template não tem autenticação: este é o ponto onde um guard server-side entraria
 * (checar a sessão e redirecionar para /login antes de renderizar). Ver
 * `docs/padroes/auth.md`.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
