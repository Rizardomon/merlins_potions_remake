# Padrão — Componente Drawer (`apps/web`)

> **Baseado em:** [ADR-004](../../.kproc/issues/MP-001/adrs/adr-004.md) (layout do
> storefront) e [ADR-006](../../.kproc/issues/MP-001/adrs/adr-006.md) (teclado/a11y por
> walkthrough manual).

## Contexto

Um drawer é um painel lateral que desliza sobre a página atual, escurecendo o fundo
(backdrop). É diferente de um modal centrado: ocupa toda a altura da viewport e abre da
direita (padrão). É usado para detalhe de produto e para a sacola de compras do
storefront.

## Quando aplicar

Sempre que um fluxo lateral precisar aparecer **sobre** o conteúdo da página sem navegar
para uma nova rota: detalhe de item, sacola, filtros avançados.

## Estrutura de arquivos

```
apps/web/src/components/storefront/
  detail-drawer.tsx   ← DrawerBase + conteúdo de detalhe
  bag-drawer.tsx      ← DrawerBase + conteúdo da sacola
  drawer-base.tsx     ← primitivo reutilizável (painel + backdrop)
```

`DrawerBase` é o primitivo; os drawers concretos compõem sobre ele.

## Interface do `DrawerBase`

```tsx
interface DrawerBaseProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  "aria-label": string; // descreve o drawer para leitores de tela
}
```

## Comportamento obrigatório

| Requisito | Implementação |
|-----------|---------------|
| Abrir | Estado booleano `open` controlado pelo pai; drawer não gerencia sua própria abertura |
| Fechar por botão | Botão "×" / "Close" visível no topo do drawer chama `onClose` |
| Fechar por backdrop | Clique no backdrop (fora do painel) chama `onClose` |
| Fechar por Escape | Listener `keydown` ativo apenas quando `open === true`; chama `onClose` |
| Foco ao abrir | `useEffect` move o foco para o primeiro elemento focável dentro do drawer |
| Foco ao fechar | Foco retorna ao elemento que disparou a abertura (guardar ref do gatilho) |
| Scroll do body | `overflow: hidden` no body enquanto `open`; removido no fechamento |
| Backdrop | `<div>` cobrindo a viewport com `pointer-events-auto`; recebe `onClick` |

## Estrutura DOM / ARIA

```tsx
<div role="dialog" aria-modal="true" aria-label={props["aria-label"]}>
  <div /* backdrop */ onClick={onClose} />
  <div /* painel */ >
    <button onClick={onClose} aria-label="Close">×</button>
    {children}
  </div>
</div>
```

- `role="dialog"` + `aria-modal="true"` para leitores de tela tratarem como região modal.
- `aria-label` descreve o propósito (ex.: `"Product detail"`, `"Shopping bag"`).
- O painel **não** fecha quando clicado internamente (somente o backdrop fecha).

## Ciclo de foco (focus trap)

Implemente focus trap manual ou use `@radix-ui/react-focus-scope` (já disponível como
dependência transitiva do shadcn):

1. Ao abrir: mova o foco para o primeiro elemento focável do painel.
2. Tab / Shift+Tab ciclam **apenas dentro do drawer** enquanto `open`.
3. Ao fechar: restaure o foco para o elemento gatilho.

## Animação

Usar classes Tailwind de transição (`translate-x`, `transition-transform`, `duration-300`)
controladas pelo estado `open`. Respeitar `prefers-reduced-motion`:

```tsx
<div
  className={cn(
    "translate-x-full transition-transform duration-300",
    open && "translate-x-0",
    "motion-reduce:transition-none"
  )}
>
```

## Estado de abertura

O estado `open` é gerido pela **tela pai** (não pelo drawer):

```tsx
// page.tsx ou componente pai
const [detailOpen, setDetailOpen] = useState(false);
const triggerRef = useRef<HTMLButtonElement>(null);

<button ref={triggerRef} onClick={() => setDetailOpen(true)}>Ver detalhe</button>
<DetailDrawer
  open={detailOpen}
  onClose={() => { setDetailOpen(false); triggerRef.current?.focus(); }}
  potion={selectedPotion}
  aria-label="Product detail"
/>
```

## Regras

- Nunca aninha dois drawers abertos ao mesmo tempo.
- Nenhum `fetch` direto no drawer; receba dados como prop ou via hook.
- Textos visíveis em inglês — **exceção pontual MP-001** (ver `CLAUDE.md §Exceção UI
  inglês / US$`).

## Definition of Done

- [ ] `DrawerBase` implementado com backdrop, botão de fechar e role ARIA.
- [ ] Fecha por botão, backdrop e Escape.
- [ ] Foco entra no drawer ao abrir; retorna ao gatilho ao fechar.
- [ ] Focus trap ativo enquanto open.
- [ ] Scroll do body bloqueado enquanto aberto.
- [ ] `motion-reduce:transition-none` aplicado.
- [ ] Walkthrough manual: Tab/Shift+Tab cicla internamente; Escape fecha; leitor de tela
      anuncia `role="dialog"`.
