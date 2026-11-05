# Merlin's Potions Remake

Remake do Merlin's Potions com **NestJS** (backend) e **Next.js** (frontend) em monorepo
pnpm + Turborepo. Projeto derivado do template `modelo-01` (Kbase Modelos).

## O que vem pronto

| | |
|---|---|
| **Monorepo** | pnpm workspaces + Turborepo (`apps/*`, `packages/*`) |
| **Backend** | NestJS 11, Swagger em `/api/docs`, envs validadas com Zod no boot |
| **Frontend** | Next.js 15 (App Router) + React 19, Tailwind + primitivos shadcn-style, TanStack Query, tema claro/escuro |
| **Contrato** | `packages/shared` com Zod — fonte única de tipos entre front e back |
| **BFF** | O browser nunca chama a API direto; tudo passa por `apps/web/src/app/api/*` |
| **Exemplos** | Dashboard mínima, CRUD completo de Papéis, menu servido pela API |
| **Deploy** | Dockerfiles multi-stage, docker-compose, exemplo de Nginx |
| **Padrões** | `docs/padroes/` — consulte antes de implementar qualquer coisa |

### O que **não** vem

- **Autenticação** — a aplicação é aberta. Cada projeto pluga o seu IdP; ver
  `docs/padroes/auth.md` para os três pontos de costura.
- **Permissionamento** — o menu vem do backend, sem filtro.
- **Banco de dados** — os repositories são mocados em memória, e o app sobe sem Postgres.
  O caminho completo com Drizzle está pronto e comentado em
  `apps/server/src/modules/_example/`.

Isso é deliberado: são as três decisões que mais variam entre projetos, e um esqueleto
errado custa mais para desmontar do que para escrever.

## Rodando

```bash
pnpm install
pnpm dev:all                # server (:3001) + web (:3000) na mesma tela
pnpm dev:all --terminals    # cada app numa janela do Terminal (macOS)

pnpm dev:server             # só o backend
pnpm dev:web                # só o frontend

pnpm build                  # build de tudo (Turborepo)
pnpm typecheck              # tsc em todos os pacotes
```

- Frontend: <http://localhost:3000>
- API: <http://localhost:3001/api> · Swagger: <http://localhost:3001/api/docs>

Nenhum serviço externo é necessário — sem banco, sem Redis, sem IdP.

## Estrutura

```
apps/
  server/                   # NestJS
    src/
      conf/                 # validação das envs (Zod)
      common/               # helpers de HTTP e OpenAPI
      database/             # Drizzle: módulo, migrations, auditoria (inativo)
      modules/
        _example/           # REFERÊNCIA comentada: como ligar o Postgres
        menu/               # menu de navegação (repository mocado)
        role/               # CRUD de exemplo (repository mocado)
  web/                      # Next.js
    src/
      app/
        (app)/              # telas internas, envoltas pelo AppShell
        api/                # BFF — proxy para a API NestJS
      components/
        ui/                 # primitivos (Button, Card, Table, Dialog…)
        common/             # composições (DataTableCard, CatalogCrudCard…)
        layout/             # AppShell, Sidebar, Topbar
      hooks/use-app.ts      # hooks TanStack Query
      lib/api/              # data-access por domínio
packages/
  shared/                   # contratos Zod (fonte única de tipos)
docs/padroes/               # os padrões do projeto — leia antes de implementar
deploy/                     # docker-compose, envs de exemplo, Nginx
scripts/                    # rename-project.mjs, dev-all.sh
```

## Antes de implementar

Leia `docs/padroes/README.md`. A regra vale para pessoas e agentes: **se não há padrão
documentado para o que você vai criar, o padrão precisa ser definido antes do código.**

Atalhos:
- Novo domínio no backend → [`docs/padroes/backend-modulo.md`](docs/padroes/backend-modulo.md)
- Nova tela → [`docs/padroes/nova-tela.md`](docs/padroes/nova-tela.md)
- Ligar o banco → [`apps/server/src/modules/_example/README.md`](apps/server/src/modules/_example/README.md)
- Plugar autenticação → [`docs/padroes/auth.md`](docs/padroes/auth.md)
