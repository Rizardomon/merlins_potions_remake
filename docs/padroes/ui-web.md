# Padrão — UI Web (`apps/web`)

Base para qualquer nova tela/componente do front. Para o passo-a-passo de criar uma tela,
ver [nova-tela.md](nova-tela.md).

## 0. Convenção de nomes (idioma)

- **Código em inglês:** identificadores, tipos, campos, nomes de arquivo/componente,
  segmentos de rota, query keys, métodos de repository/hook. Ex.: `RoleDetail`,
  `useRoles`, `catalog-crud-card.tsx`, rota `/roles/[id]`.
- **Textos visíveis da UI em português:** labels, títulos, placeholders, mensagens
  (ex.: `<CardTitle>Papéis cadastrados</CardTitle>`, `label="Descrição"`).
- **Sufixos técnicos/estruturais em inglês** nos componentes: `-card`, `-chart`, `-list`,
  `-tab`, `-modal`, `Button`, `useQuery`.
- Alinha com `packages/shared` (já em inglês). Arquivos kebab-case; componentes/tipos
  PascalCase; hooks `useX`; funções/vars camelCase.

## 1. Tema & design tokens

- Tokens ficam em `src/app/globals.css` como CSS custom properties em `:root` e
  `[data-theme="dark"]`. **Fonte da verdade visual** — não hardcodar hex nos componentes.
- O Tailwind (`tailwind.config.ts`) mapeia os tokens para utilitários semânticos:
  `bg-surface`, `bg-surface-2`, `text-content`, `text-content-2/3`, `border-border`,
  `text-accent-text`, `bg-accent-soft`, `text-green/red/blue`, `shadow-card`, etc.
  `darkMode: ['selector', '[data-theme="dark"]']`.
- Fontes via `next/font`: `--font-manrope` (UI) e `--font-jetbrains` (mono: valores
  monetários, datas, CPF, matrícula, tokens, colunas numéricas). Use `font-mono` nesses.
- Tema: `ThemeProvider` (`src/components/theme/theme-provider.tsx`) aplica `data-theme`
  no `<html>` e persiste em `localStorage`. `ThemeScript` (no `<head>`) evita flash.
  Trocar tema pelo `Segmented` no Modal Configurações.

## 2. Primitivos de UI (`src/components/ui/*`)

Estilo shadcn/ui (forwardRef, `cn` de `src/lib/utils.ts`), tematizados pelos tokens:
`Button`, `IconButton`, `Card` (+Header/Title/Subtitle/Body), `Input`/`InputWithIcon`,
`Field`, `Badge`, `Avatar`, `Table` (+THead/TBody/TR/TH/TD), `Tabs`,
`Segmented`, `Dialog`, `Pagination`, `Skeleton`, `EmptyState`.
Ícones: **lucide-react** (`strokeWidth={2}`, ~19px na nav). Novos primitivos entram aqui.
Adicionais: `Combobox` (single-select, com ou sem busca), `AsyncCombobox` (busca no servidor/
typeahead), `MoneyInput` (BRL), `Textarea`, `BooleanSelect`.

**TODO seletor é `Combobox` — o `<select>` nativo NÃO é usado.** O `<select>` abre o
dropdown do **sistema operacional**, quebrando o design. Escolha do modo pelo tamanho da
lista:
- **lista curta** (tipos, status, unidades, Sim/Não…) → `Combobox` com **`searchable={false}`**:
  mesmo popover, sem o campo de busca;
- lista **já carregada** e maior (papéis, planos, tipos de despesa…) → `Combobox` (busca
  client-side, padrão `searchable`);
- base **grande/que cresce** (typeahead server-side) → **`AsyncCombobox`** (`loadOptions(query)`).

Placeholder ("Selecione") é a prop `placeholder`, **não** uma option vazia.

**Campos booleanos → `BooleanSelect` (NUNCA `<input type="checkbox">`).** Todo campo
"ativo/inativo", "tem/não tem", "sim/não" usa `BooleanSelect` (Sim/Não), sempre dentro de
um `<Field label="...">` como qualquer outro campo — mantém o alinhamento do form. API:
`value: boolean | null | undefined` (comporta-se como booleano: `null`/`undefined` → "Não",
sem estado vazio) e `onChange: (value: boolean) => void`. Checkbox solto está **proibido**.

Componentes de composição em `src/components/common/*` (reaproveitados entre telas):
`DescriptionFormModal` (modal 1 campo), `DataTableCard` (card com tabela + busca + paginação),
`CatalogCrudCard` (tela de catálogo: lista + cadastrar/editar/remover; coluna "Código" opcional
via `showCode`) e `ConfirmDialog` (confirmação de ação destrutiva → mutation; substitui o
`window.confirm()`, que destoa das telas e não tem onde exibir o erro da mutation).
Componentes específicos de uma feature ficam em `src/components/<feature>/*`, não em
`common/*`.

## 3. Data-access (camada de service)

Três camadas, sempre nesta ordem — **tela → hook → repository → BFF → API**:

- **Contrato**: os tipos de domínio vivem no `@app/shared` (Zod), compartilhados com o
  backend. O front não redeclara tipo de domínio.
- **Repository** em `src/lib/api/<dominio>-repository.ts`: `fetch` no BFF
  (`/api/<dominio>`) e **validação da resposta com o schema Zod**. É a única camada que
  conhece a URL e o formato do transporte. Se o backend não pagina, é aqui que o `Page<T>`
  é montado no client.
- **Hooks** TanStack Query em `src/hooks/use-app.ts` (`useMenu`, `useRoles`,
  `useCreateRole`…); `queryKeys` centraliza as chaves. **Telas nunca chamam o repository
  direto — sempre via hook**, e nunca `fetch` cru.

O ganho é a origem dos dados ser trocável: os repositories do backend são mocados em
memória hoje (ver `apps/server/src/modules/_example/`) e nada disso muda quando virarem
Postgres.

### 3.0. Tabela de listagem padrão (`DataTableCard`)

Toda listagem tabular usa `src/components/common/data-table-card.tsx` — não replicar o
shell (Card + header + Table + paginação). Formato: **título à esquerda do header + busca
à direita**, tabela por config de colunas, skeleton/vazio e **paginação com 12 itens/página**
(`TABLE_PAGE_SIZE`). O componente é dono do estado `search`/`page`.

- **Colunas**: array `DataColumn<T>` (`header`, `cell(item)`, `headClassName?`, `cellClassName?`).
- **Dados**: prop `useData(search, page) => { data?: Page<T>; isLoading }`.
  - Backend/mock paginado: passe o hook direto (`useData={useClients}`); se precisar de args
    extras, embrulhe num wrapper **nomeado `use*`** (ex.: `useTabCollaborators`) para satisfazer
    o `rules-of-hooks`.
  - CRUD local (estado em memória): use `localTablePage(items, search, page, matches)` — filtra
    e pagina client-side.
- **Sem paginação**: `paginated={false}` esconde o controle de páginas e o rodapé passa a mostrar
  só o total ("N registros"). Use quando a listagem deve sair **inteira** (universo pequeno e
  fechado) — o `useData` devolve todos os itens numa única `Page`.
- **Ações de linha** (editar/remover/ver) vão numa coluna final; `onRowClick` navega para o
  detalhe. Botão "Adicionar/Novo" fica **acima** do card (nível da página), não no header.
- Exemplo: `CatalogCrudCard` (usado por `/roles`) monta a listagem, o modal e a confirmação
  de remoção inteiros sobre o `DataTableCard`.

**Filtro obrigatório acima da tabela.** Quando a listagem só faz sentido após escolher um
**seletor obrigatório** (o dataset só existe depois da escolha, ex.: um período), o filtro fica
**acima** do `DataTableCard` (nível de página), não na busca do header. Sem seleção →
`EmptyState`. A busca do header segue filtrando **dentro** do resultado.

**Ação de linha com confirmação (mutação de domínio).** Ação na coluna final abre `ConfirmDialog`
→ dispara `useMutation` que invalida a query key da listagem no `onSuccess` (§3.1). Para verbos
de negócio (não-CRUD) o endpoint é explícito no backend (ver `backend-modulo.md` →
"Ações de domínio").

### 3.1. Ligar um domínio novo ao backend

Depois que o domínio ganha módulo no `apps/server`, o caminho no front é sempre este —
`/roles` é a referência viva de ponta a ponta:

1. **BFF** em `src/app/api/<dominio>/route.ts` (+ `[id]/route.ts` p/ item): use
   `proxyToApi(path, { method, body })` de `src/lib/bff.ts` — ele repassa status e corpo e
   preserva o `204` do DELETE. O browser nunca chama a API NestJS direto, e é aí que o
   `Authorization` entra quando houver auth (ver [auth.md](auth.md)).
   Modelo: `src/app/api/roles/route.ts`.
2. **Repository** em `src/lib/api/<dominio>-repository.ts`: `fetch` no BFF, resposta validada
   com o schema Zod de `@app/shared` (fonte única). Se o backend não pagina, monte o `Page<T>`
   aqui. Modelo: `src/lib/api/role-repository.ts`.
3. **Hooks** em `src/hooks/use-app.ts`: `useQuery` para leitura, `useMutation` para escrita com
   `onSuccess` invalidando a chave do domínio (`queryClient.invalidateQueries({ queryKey: ["roles"] })`
   — a chave-prefixo cobre todas as combinações de busca/página em cache). Telas usam
   `mutate(input, { onSuccess })`.

- **Quando persistir**: nas abas de subcoleção de uma tela de detalhe, a ação do usuário grava
  **na hora** — não há botão "Salvar alterações". Ver [salvar-direto.md](salvar-direto.md).

## 4. Layout / App Shell

- Rotas internas (inglês) ficam no route group `src/app/(app)/*` — ex.: `/dashboard`,
  `/roles` — envoltas por `AppShell` (`src/components/layout/app-shell.tsx`): Sidebar
  colapsável + Topbar + Modal Configurações. O grupo `(app)` não aparece na URL.
- **A navegação vem do backend** (`GET /api/menu`, hook `useMenu`): label, rota, ícone,
  seção, ordem e título/subtítulo da topbar são dados, não código. Nova tela = nova linha
  em `apps/server/src/modules/menu/menu.repository.ts`.
  `src/components/layout/nav-config.tsx` faz só a ponte: resolve o nome do ícone para o
  componente lucide (`iconByName` — registre ícones novos ali) e guarda o menu estático de
  fallback exibido enquanto a requisição não responde.
- **Para criar uma tela nova, siga o checklist em [nova-tela.md](nova-tela.md).**
- Conteúdo centralizado em `max-w-content` com padding `26px`, `animate-fade-up`.
