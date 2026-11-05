# Módulo de backend (`apps/server`)

Padrão para criar um domínio no backend NestJS. **Um domínio = uma entidade = uma
tabela.** Antes de implementar, siga este documento; o módulo `role` é a referência viva.

> **No template os repositories são mocados em memória** — o app sobe sem Postgres. Tudo
> abaixo sobre Drizzle/migrations descreve o destino: o service e o controller já são
> definitivos, só o corpo do repository muda quando o banco entrar. O passo a passo está em
> `apps/server/src/modules/_example/README.md`.

## Estrutura de pastas

```
apps/server/
  drizzle.config.ts                 # config do drizzle-kit (push em dev)
  src/
    conf/                           # configuração e leitura de ENV
      configuration.ts              # validação/tipagem das envs (Zod)
      config.module.ts              # ConfigModule.forRoot({ isGlobal, validate })
    database/                       # tudo de banco (NUNCA "db")
      database.module.ts            # provê o token DRIZZLE (forRootAsync + ConfigService)
      entities.ts                   # barrel: reexporta todos os *.entity.ts (drizzle-kit lê daqui)
    modules/
      _example/                     # REFERÊNCIA comentada: entity/repository com Drizzle
      <domain>/                     # domínio SEMPRE no singular
        <domain>.entity.ts          # tabela Drizzle
        <domain>.repository.ts      # única camada que acessa o DRIZZLE
        <domain>.service.ts         # regras + tradução linha ⇄ contrato
        <domain>.controller.ts      # REST
        <domain>.module.ts
    app.module.ts
    main.ts
packages/shared/src/
  <domain>.ts                       # Zod (contrato): fonte única de tipos/DTOs
```

## Regras

### Nomenclatura
- **Inglês** em arquivos, tabelas e campos.
- **Tabela sempre no singular** (`plan`, não `plans`).
- Coluna no banco em `snake_case`; campo no contrato/API em `camelCase`
  (o Drizzle mapeia coluna↔propriedade explicitamente).
- **Rota do domínio no plural**: `/api/plans`.

### Contrato (DTOs)
- A **fonte única** dos tipos/DTOs é o Zod em `@app/shared` (`packages/shared/src/<domain>.ts`),
  compartilhado com o front. Não há arquivo de DTO dentro do módulo.
- Padrão de export por domínio: `<Entity>Schema`, `Create<Entity>Schema`,
  `Update<Entity>Schema` (+ tipos inferidos) e, quando útil, `<Entity>ListSchema`.

### Camadas
- **Controller** — só HTTP. Valida a entrada com o Zod do shared
  (`Create<Entity>Schema.parse(body)`), extrai o ator (`req.user.sub`), delega ao service,
  devolve DTO. Nunca contém regra de negócio.
- **Service** — regras de negócio e tradução linha (entity) ⇄ DTO (contrato). Nunca
  importa Drizzle/`pg` diretamente.
- **Repository** — única camada que conhece a origem dos dados (no template, uma lista em
  memória; com banco, a única a injetar o token `DRIZZLE`). Métodos base: `findAll`,
  `findById`, `create`, `update`, `remove` (+ consultas específicas do domínio). Trocar a
  origem **não pode** exigir mudança no service nem no controller.

### Banco / Drizzle
- **Drizzle ORM + `pg`**. O token `DRIZZLE` é provido pelo `DatabaseModule` **global** via
  `forRootAsync()` + `ConfigService` (lê `DATABASE_URL`).
- Tabelas em `<domain>.entity.ts`; `database/entities.ts` é o barrel que o `drizzle.config.ts`
  aponta.
- **PK**: `uuid` default `gen_random_uuid()`. Em PostgreSQL &lt; 13 essa função exige a
  extensão `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) — habilitá-la no banco antes
  do `push`; nas migrations versionadas (pós-V1), incluí-la na primeira migration.
- **Auditoria obrigatória em TODA tabela**: `created_at`, `updated_at`, `created_by`,
  `updated_by` (helper `...auditColumns()` em `src/database/audit.ts`).
  `created_by`/`updated_by` guardam o autor devolvido por `actorOf(req)` — hoje `"system"`,
  já que o template não tem autenticação (ver [auth.md](auth.md)).

### Config / ENV
- `ConfigModule.forRoot({ isGlobal: true, validate })` em `src/conf`, com validação Zod das envs.
- **Toda** injeção de env no runtime Nest é feita via **`ConfigService`** (módulos que precisam de
  env usam `forRootAsync()`); nunca ler `process.env` direto no runtime.
- `drizzle.config.ts` é ferramenta de build (fora do Nest) e pode ler `process.env`/dotenv.

### Erros
- `404` quando `:id` não existe.
- `409` em conflito de unicidade (ex.: `name` duplicado) e ao tentar excluir um registro
  **em uso** (referenciado por outra tabela) — o service verifica antes e retorna erro tratado
  em vez de deixar estourar a FK no banco.

### Migrations
- Schema versionado com `drizzle-kit generate` + runner `db:migrate` — ver `migrations.md`.
- `drizzle-kit push` fica **só para dev local**; nunca contra banco com dados.
- Ao criar/alterar uma entity, gere a migration (`pnpm db:generate`) e commite o `.sql`.

### Swagger / OpenAPI
- UI em `/api/docs` (SwaggerModule, configurado no `main.ts`).
- Como o contrato é **Zod** (não class-validator), os corpos/respostas são documentados
  convertendo o schema Zod com o helper `src/common/openapi.ts` (`toOpenApi` / `toOpenApiArray`)
  nos decorators `@ApiBody` / `@ApiOkResponse` / `@ApiCreatedResponse`. O Zod do shared segue
  sendo a fonte única — o Swagger apenas o reflete.
- Todo controller de domínio recebe `@ApiTags("<plural>")` (e `@ApiBearerAuth()` quando
  houver autenticação).

## CRUD padrão

| Verbo | Rota        | Ação                          |
|-------|-------------|-------------------------------|
| GET   | `/`         | lista                         |
| GET   | `/:id`      | busca por id (`404` se não há)|
| POST  | `/`         | cria (`409` se conflito)      |
| PUT   | `/:id`      | atualiza (`404` se não há)    |
| DELETE| `/:id`      | remove (`404`/`409` em uso)   |

## Ações de domínio (não-CRUD)

Operações com **semântica de negócio** (não um simples remove/update) usam um **verbo explícito**
como sub-recurso da rota, em vez de sobrecarregar `DELETE`/`PUT`:

- `POST /:id/<acao>` — ex.: `POST /orders/:id/cancel` ("cancelar": marca o pedido e
  **preserva** os itens relacionados, coisa que um `DELETE` genérico esconderia).
- Retorna `204` (ou o estado atualizado); `404` se o alvo não existe.
- Deixa claro o efeito colateral controlado — um `DELETE /:id` genérico esconderia a regra de
  preservar dados relacionados.
