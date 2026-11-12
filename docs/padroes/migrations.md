# Migrations (Drizzle)

Padrão para versionar e aplicar mudanças de schema no `apps/server`. Substitui o
`drizzle-kit push` (que fica **só para dev local**). Fonte do schema: as entities Drizzle
(`src/database/entities.ts`, barrel dos `*.entity.ts`).

> **A persistência está ligada (MP-002 / ADR-004):** `DATABASE_URL` é obrigatória e o
> `DatabaseModule` está importado no `app.module.ts`. `entities.ts` ainda está vazio até o
> primeiro domínio persistido gerar a primeira migration; o passo a passo por domínio está
> em `apps/server/src/modules/_example/README.md`.

## Postgres em dev e CI

Dev local (serviço opcional do compose, sob o profile `dev-db`):

```bash
docker compose -f deploy/docker-compose.yml --profile dev-db up -d postgres
export DATABASE_URL=postgres://app:app@localhost:5432/app
```

Os defaults do serviço são `app` / `app` / `app` (`POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB`). O volume `postgres-data` preserva os dados entre restarts.

Em CI, suba um Postgres equivalente e exporte `DATABASE_URL` (para o boot do server) e
`TEST_DATABASE_URL` (para o teste de integração, que é opt-in). Exemplo com GitHub Actions:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports: ["5432:5432"]
    options: >-
      --health-cmd "pg_isready -U app -d app"
      --health-interval 5s
      --health-timeout 5s
      --health-retries 10

env:
  DATABASE_URL: postgres://app:app@localhost:5432/app
  TEST_DATABASE_URL: postgres://app:app@localhost:5432/app
```

O teste de integração é opt-in (roda só quando `TEST_DATABASE_URL` existe):

```bash
pnpm --filter @merlins-potions-remake/server test:integration
```

## Arquivos

```
apps/server/
  drizzle.config.ts                      # schema -> entities.ts | out -> src/database/migrations
  src/database/
    migrate.ts                           # runner standalone (migrator nativo do drizzle-orm)
    migrations/
      0000_<slug>.sql                    # DDL versionado (aplicado em ordem)
      _journal.json                      # ordem/idempotência (NÃO editar à mão)
      meta/*.json                        # snapshots do drizzle-kit (NÃO editar à mão)
  nest-cli.json                          # assets: copia database/migrations/** para o dist
```

## Fluxo

1. **Alterou uma entity?** Gere a migration:
   ```bash
   cd apps/server && pnpm db:generate
   ```
   Cria `NNNN_<slug>.sql` + atualiza `_journal.json`/`meta`. **Revise o SQL gerado** antes de
   commitar (o `generate` não conecta no banco; só diffa entities × último snapshot).
2. **Commite** o `.sql`, o `_journal.json` e os `meta/*.json` juntos.
3. **Aplicar** (compilado):
   ```bash
   pnpm build && pnpm db:migrate      # = node dist/database/migrate.js
   ```

## Regras

- **`gen_random_uuid()` exige `pgcrypto`.** A **primeira** migration inclui
  `CREATE EXTENSION IF NOT EXISTS pgcrypto;` no topo (o `generate` não a emite sozinho).
- **`_journal.json` e `meta/` são gerados** — nunca editar à mão; deixe o `drizzle-kit` cuidar.
- **`db:migrate` roda o migrator nativo do `drizzle-orm`** (dependência de produção), **não** o
  `drizzle-kit` (devDependency, ausente no runtime após `pnpm --prod deploy`). Por isso o runner
  é `src/database/migrate.ts` compilado para `dist`, e os `.sql` são copiados para o `dist` pelos
  **assets do `nest-cli.json`**.
- **Idempotente:** o migrator registra o aplicado em `drizzle.__drizzle_migrations`; rodar de novo
  não reaplica.
- **`push` só em dev local.** Nunca contra banco com dados — é destrutivo.
- **Seeds ≠ migrations.** `src/database/seeds/*.sql` são **dados** (legado/carga), fora deste fluxo.

## Deploy

Aplicação automática por serviço one-shot no compose — ver `deploy.md` §Banco. O serviço
`migrate` usa a mesma imagem do `server`, roda `node dist/database/migrate.js` e sai; o `server`
depende dele com `condition: service_completed_successfully`. Env: só `DATABASE_URL`.
