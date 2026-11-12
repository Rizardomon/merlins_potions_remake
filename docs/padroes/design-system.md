# Design system — Merlin's Potions (storefront)

**Fonte da verdade visual:** artefato de design
<https://claude.ai/artifact/We6wujKZfwLs7UbAsy25xR> (projeto "Merlins Potions Design System").

- Páginas: `project/Style Guide.dc.html` (guia de estilo) e `project/Merlins Potions.dc.html`
  (mock do site). Imagens de produto em `project/images/products/`.
- Ler com a ferramenta `Artifact` (`action: "read"`, `path: "project/Style Guide.dc.html"`).
  **Não** usar WebFetch/curl no link.
- Este arquivo é um espelho dos tokens (snapshot de 2026-11-12). Em caso de divergência, o
  artefato manda — atualize este arquivo e `apps/web/src/app/globals.css`.
- Implementação: tokens viram CSS custom properties em `globals.css`, mapeadas no Tailwind
  (ver [ui-web.md](ui-web.md) §1). Não hardcodar hex em componentes.

## Princípios

1. **Boticário moderno** — serifa clássica para nomes/títulos; grotesca limpa na interface.
   O mágico fica no tom, não em ornamentos.
2. **O frasco é o herói** — cada poção tem campo de cor próprio (tinta); interface neutra.
3. **Uma ação por vez** — um único botão violeta (primário) por tela.

## Cores

| Token | Hex | Uso |
|---|---|---|
| Ink | `#1F1A26` | texto, botões escuros |
| Ink 2 | `#4A4352` | texto secundário |
| Muted | `#6E6676` | labels, metadados |
| Line | `#E3DDD3` | bordas, divisores |
| Parchment | `#F5F2EC` | fundo da página |
| Vellum | `#FBF9F5` | superfícies, drawers |
| Violet | `#4B2E83` | ação principal, links |
| Violet Deep | `#3B2268` | hover / pressed |
| Violet Mist | `#D9C7F2` | destaque sobre Ink |

**Tintas de poção (fundo do produto):** Aging `#E9E1F1` · Bulgeye `#DDEBD9` · Dragon
`#E6E2F3` · Love `#F3DEDC` · Polyjuice `#E2EDD8` · Sleeping `#DCE6F2`.
Nova tinta: ≈ `oklch(0.92 0.035 <matiz do líquido>)`. Texto sobre tinta: sempre Ink ou Ink 2.

## Tipografia

| Família | Uso |
|---|---|
| Instrument Serif (400, itálico) | display, títulos, nomes de produto; itálico violeta para ênfase |
| Hanken Grotesk (400/500/600) | interface e corpo |
| JetBrains Mono (400/500) | preços, quantidades, labels caixa-alta (`letter-spacing: .08em`) |

Escala (size/line-height): Display 88/0.95 · H1 48/1.0 · H2 34/1.1 · H3 28/1.1 ·
Body L 17/1.55 · Body 15/1.5 · Small 13/1.45 · Label 12 mono uppercase.

## Espaço e forma

- Espaçamento base 4: 4, 8, 12, 16, 24, 32, 48, 64, 88.
- Gap de grid 24 · padding de seção 56–88 · container máx. 1280 com margem 32.
- Raios: 14 thumb · 20 card · 28 bloco · 999 pill (ações, inputs, chips).
- Sombras: card hover `0 18px 40px -20px rgba(31,26,38,.35)`; drawer
  `-24px 0 60px -20px rgba(31,26,38,.3)`.

## Componentes

- **Botões (pill):** Primário 52px, Violet, texto Vellum, 600 — uma vez por tela (Add to bag,
  Checkout). Escuro 36–46px, Ink → hover Violet. Contorno: borda Ink, fundo transparente.
  Texto: sublinhado, Ink 2. Alvo mínimo 44px no mobile.
- **Busca:** pill 46px, fundo Parchment, borda Line, ícone lupa Muted.
- **Filtros/chips:** 40px pill; ativo = Ink com texto Parchment; inativo = borda Line.
- **Stepper de quantidade:** pill 52px, borda Line, número em mono.
- **Badge contador:** 30px, Ink, mono 13.
- **Card de produto:** fundo = tinta da poção, raio 20, aspect 4/3 da imagem, "No. 0X" mono
  no canto, nome em serif 28, preço mono 15/500, sombra `drop-shadow` no frasco.
- **Barra de frete grátis:** 6px, trilho Line, preenchimento Violet — presente em todo drawer
  de sacola.
- **Toast:** pill Ink, texto Parchment, ação em Violet Mist 600; some em 2,6s.

## Padrões e voz

- **Detalhe em drawer** (não modal): imagem na tinta, efeito, ingredientes em tags, barra fixa
  com quantidade + ação; fecha com Esc, clique fora ou × (ver [drawer.md](drawer.md)).
- **Responsivo:** grid auto-fill (mín. 260px), header quebra em linhas, nav com rolagem
  horizontal, drawers 100% no mobile.
- **Voz (UI em inglês, ver MP-001):** direta e calorosa, pitada de magia no fim — nunca no
  meio da instrução. Ex.: "Your bag is empty — the cauldron awaits."
