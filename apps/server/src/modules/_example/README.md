# `_example` — persistência com Drizzle (referência)

Esta pasta **não é compilada para nada**: todo o código dentro dela está comentado. Ela
existe para mostrar como fica um módulo com **banco de verdade**, já que os repositories
do template (`modules/role`, `modules/menu`) são mocados em memória.

O prefixo `_` mantém a pasta fora da ordem alfabética dos domínios reais e sinaliza que
ela não é um módulo do app — não está no `app.module.ts`.

## Como ligar a persistência no seu projeto

1. **Suba um Postgres** e defina `DATABASE_URL` no `apps/server/.env`.
2. Em `src/conf/configuration.ts`, troque `DATABASE_URL` de `.optional()` para
   obrigatória (`z.string().url()`) — o boot passa a falhar sem banco, que é o que você
   quer quando a persistência é essencial.
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
