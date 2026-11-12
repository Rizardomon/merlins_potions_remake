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

Isso é deliberado: são as decisões que mais variam entre projetos, e um esqueleto
errado custa mais para desmontar do que para escrever.

## Rodando

O backend agora persiste em PostgreSQL (ADR-004): `DATABASE_URL` é obrigatória.

```bash
pnpm install

# Postgres de dev (profile dev-db do compose) — obrigatório para o server subir
docker compose -f deploy/docker-compose.yml --profile dev-db up -d postgres

pnpm dev:all                # server (:3011) + web (:3010) na mesma tela
pnpm dev:all --terminals    # cada app numa janela do Terminal (macOS)

pnpm dev:server             # só o backend
pnpm dev:web                # só o frontend

pnpm build                  # build de tudo (Turborepo)
pnpm typecheck              # tsc em todos os pacotes
```

Copie `.env.example` para `.env` (ou use `apps/server/.env`); o default aponta para o
Postgres do compose (`postgres://app:app@localhost:5432/app`). Sem `DATABASE_URL` o boot
falha com mensagem explícita.

- Frontend: <http://localhost:3010>
- API: <http://localhost:3011/api> · Swagger: <http://localhost:3011/api/docs>

O único serviço externo é o Postgres; auth e permissionamento continuam fora do escopo.

## Estrutura

```
apps/
  server/                   # NestJS
    src/
      conf/                 # validação das envs (Zod)
      common/               # helpers de HTTP e OpenAPI
      database/             # Drizzle: módulo, migrations, auditoria (ativo)
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
