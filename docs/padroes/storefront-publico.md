# Padrão — Storefront público (`apps/web`)

> **Baseado em:** [ADR-004](../../.kproc/issues/MP-001/adrs/adr-004.md) (storefront na
> raiz, remoção do shell admin) e [ADR-005](../../.kproc/issues/MP-001/adrs/adr-005.md)
> (tokens/fontes do design, light-only).

## Contexto

O storefront é o site inteiro — não há área admin paralela. O layout é incompatível com
`AppShell`/`Sidebar`: usa announcement bar + header horizontal + navegação de categorias.
Componentes de layout da loja são específicos do storefront e não compartilhados com
nenhuma área autenticada.

## Quando aplicar

Sempre que criar ou modificar uma tela visível ao usuário final (vitrine, detalhe, sacola,
newsletter, footer) ou o layout que envolve essas telas.

## Estrutura de arquivos

```
apps/web/src/
  app/
    (storefront)/           ← route group sem AppShell
      layout.tsx            ← announcement bar + header + nav + slots
      page.tsx              ← página principal do catálogo
      <segmento>/
        page.tsx
  components/
    storefront/             ← componentes exclusivos da loja
      announcement-bar.tsx
      header.tsx
      category-nav.tsx
      footer.tsx
      ...
```

- O grupo `(storefront)` **não usa** `AppShell`, `Sidebar` nem `Topbar`.
- Componentes reutilizáveis entre qualquer tela continuam em `components/ui/` e
  `components/common/`.
- Componentes exclusivos da loja ficam em `components/storefront/`.

## Layout próprio (`(storefront)/layout.tsx`)

O layout envolve todas as páginas do storefront e deve compor, na ordem:

1. **Announcement bar** — faixa topo, mensagem promocional ou shipping.
2. **Header** — logo, busca global, ícone de sign in, ícone da sacola com contagem.
3. **Navegação de categorias** — lista horizontal; aba ativa visível; abas inativas com
   badge "Soon", não clicáveis.
4. **`{children}`** — conteúdo da página.
5. **Footer** — links e newsletter block.

```tsx
// (storefront)/layout.tsx  — esqueleto mínimo
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Header } from "@/components/storefront/header";
import { CategoryNav } from "@/components/storefront/category-nav";
import { Footer } from "@/components/storefront/footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <CategoryNav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

## Tema e tokens

- Todos os valores visuais vêm de tokens CSS definidos em `globals.css` (ver
  [ui-web.md](ui-web.md)) e mapeados em `tailwind.config.ts`. **Nunca hardcode hex.**
- Light-only: não existe suporte a dark mode no storefront (ADR-005).
- Fontes carregadas via `next/font` em `layout.tsx` raiz para evitar FOUT.

## Seções de página

Cada página do storefront é montada como composição de **seções** (blocos
auto-suficientes):

```
page.tsx
  └─ <CatalogSection />       ← lista de cards, busca, sort
  └─ <NewsletterSection />    ← formulário de email
```

Cada seção é um componente em `components/storefront/`. Não coloque lógica de dados
diretamente na página — delegue ao hook correspondente.

## Regras

- Segmentos de rota em inglês, kebab-case (ex.: `/potions`, `/potion/[id]`).
- Textos visíveis ao usuário em inglês — **exceção pontual aprovada para MP-001**
  (ver `CLAUDE.md §Exceção UI inglês / US$`).
- Nenhum `fetch` direto em componentes de tela; use hooks de `src/hooks/`.
- Drawers (detalhe, sacola) seguem o [padrão de drawer](drawer.md).
- Estado da sacola segue o [padrão de client-state persistido](client-state-persistido.md).

## Definition of Done

- [ ] Route group `(storefront)` com `layout.tsx` próprio existe.
- [ ] Announcement bar, header, nav de categorias e footer compostos no layout.
- [ ] Nenhum componente do `AppShell`/`Sidebar`/`Topbar` é importado.
- [ ] Apenas tokens/utilitários Tailwind; sem hex hardcoded.
- [ ] `pnpm typecheck` sem erros.
- [ ] Walkthrough manual: Tab em ordem lógica; foco visível; contraste WCAG AA.
