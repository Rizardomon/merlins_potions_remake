# Migrations (Drizzle)

Padrão para versionar e aplicar mudanças de schema no `apps/server`. Substitui o
`drizzle-kit push` (que fica **só para dev local**). Fonte do schema: as entities Drizzle
(`src/database/entities.ts`, barrel dos `*.entity.ts`).

> **O template ainda não tem banco** (repositories em memória) — por isso `entities.ts` está
> vazio e não há migration alguma. Este documento vale a partir do momento em que o seu
> projeto ligar a persistência; o passo a passo está em
> `apps/server/src/modules/_example/README.md`.

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
