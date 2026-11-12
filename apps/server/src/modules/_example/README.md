# `_example` — persistência com Drizzle (referência)

Esta pasta **não é compilada para nada**: todo o código dentro dela está comentado. Ela
existe para mostrar como fica um módulo com **banco de verdade**, já que os repositories
do template (`modules/role`, `modules/menu`) são mocados em memória.

O prefixo `_` mantém a pasta fora da ordem alfabética dos domínios reais e sinaliza que
ela não é um módulo do app — não está no `app.module.ts`.

> **Neste projeto a persistência já está ligada (MP-002 / ADR-004):** `DATABASE_URL` é
> obrigatória e o `DatabaseModule` está importado no `app.module.ts`. Os passos 1–3
> abaixo ficam como referência do que já foi feito; os passos 4–6 valem para cada novo
> domínio.

## Como ligar a persistência no seu projeto

1. **Suba um Postgres** e defina `DATABASE_URL` no `apps/server/.env`:
   ```bash
   docker compose -f deploy/docker-compose.yml --profile dev-db up -d postgres
   # DATABASE_URL=postgres://app:app@localhost:5432/app
   ```
2. Em `src/conf/configuration.ts`, torne `DATABASE_URL` obrigatória
   (`z.string().url()`) — o boot passa a falhar sem banco, que é o que você quer quando a
   persistência é essencial.
3. Importe o `DatabaseModule` no `app.module.ts` (ele é `@Global()`, uma vez basta).
4. Crie a `<domain>.entity.ts` do seu domínio (modelo: `example.entity.ts`) e
   **reexporte-a** em `src/database/entities.ts` — é de lá que o `drizzle-kit` descobre
   o schema.
5. Reescreva o `<domain>.repository.ts` injetando o token `DRIZZLE`
   (modelo: `example.repository.ts`). **Só o repository** toca no Drizzle; o service e o
   controller ficam intactos.
6. Gere e aplique a migration:
   ```bash
   pnpm --filter @merlins-potions-remake/server db:generate   # gera o .sql versionado (commite-o)
   pnpm --filter @merlins-potions-remake/server build
   pnpm --filter @merlins-potions-remake/server db:migrate    # aplica
   ```
   `example.migration.sql` mostra o formato do arquivo gerado. Ver
   `docs/padroes/migrations.md`.

## Regras que valem para todo domínio

- Uma tabela por domínio, **no singular** (`role`, não `roles`); rota no plural (`/roles`).
- Coluna em `snake_case`, campo do contrato em `camelCase` — o mapeamento é explícito na entity.
- **Auditoria obrigatória em toda tabela**: espalhe `...auditColumns()` (ver
  `src/database/audit.ts`).
- PK `uuid` com `gen_random_uuid()`. Em PostgreSQL < 13 isso exige a extensão `pgcrypto`,
  que deve entrar na primeira migration.
- `409` em conflito de unicidade e ao excluir registro em uso; `404` quando o `:id` não existe.

Detalhes completos: `docs/padroes/backend-modulo.md`.
