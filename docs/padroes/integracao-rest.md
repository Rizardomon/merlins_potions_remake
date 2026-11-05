# Integração REST externa (`apps/server`)

> **Documento de referência.** O template não implementa integração REST externa — não há código
> correspondente neste repositório. Ele descreve o desenho a seguir se o seu projeto
> precisar do recurso, para não inventar um padrão novo. Adapte os nomes de domínio
> aos do seu projeto.

Padrão para **consumir uma API REST de outro sistema** (Jira, BomControle, BI, …) a partir
do backend. Complementa o [Módulo de backend](backend-modulo.md): aqui o domínio **não é dono
do dado** — ele espelha/importa dados que nascem fora. **Um sistema externo = um módulo de
integração.**

> Regra de ouro: integração externa **nunca** acessa banco de outro sistema direto; sempre via
> **REST** (ver `CLAUDE.md`). Toda resposta externa é **validada com Zod lenient** antes de entrar
> no nosso mundo.

## Quando usar

- Popular/atualizar um espelho read-only (ex.: `client` ← BomControle).
- Listar candidatos "a cadastrar" vindos de fora (ex.: projetos ← Jira) e **importar** para um
  domínio nosso.
- Qualquer leitura/gatilho contra API de terceiro.

## Estrutura de pastas

```
apps/server/src/
  integrations/
    <system>/                       # nome do sistema externo, singular (ex.: jira)
      <system>.client.ts            # cliente HTTP puro: monta request, auth, timeout, parse cru
      <system>.mapper.ts            # payload cru (Zod lenient) → contrato @merlins-potions-remake/shared
      <system>.service.ts           # orquestra: client → mapper → domínio (upsert/import)
      <system>.controller.ts        # (opcional) expõe listagem/gatilho ao front via /api/...
      <system>.module.ts
packages/shared/src/
  <system>.ts                       # (opcional) schema do payload externo + tipo, se reutilizável
```

- `integrations/` fica **separado de `modules/`**: módulos são donos de dados; integrações
  trazem dados de fora e delegam a escrita ao módulo dono (injetando o `Repository`/`Service` dele).

## Camadas

- **Client** (`<system>.client.ts`) — única camada que faz HTTP. Usa **`fetch` nativo** (Node ≥ 18,
  sem dep nova). Responsável por: base URL, headers de **auth/token**, **timeout** (`AbortSignal.timeout`),
  paginação, e devolver o **JSON cru** (ainda não validado). Não conhece o contrato do shared.
- **Mapper** (`<system>.mapper.ts`) — valida o cru com um **Zod lenient** (`.passthrough()`, campos
  opcionais tolerantes ao que a origem manda) e traduz para o **contrato `@merlins-potions-remake/shared`**. Sem I/O.
- **Service** (`<system>.service.ts`) — orquestra: chama o client, passa pelo mapper, e delega ao
  **módulo dono** (ex.: `ProjectService.importFromExternal` / `ClientRepository.upsertByExternalId`).
  Idempotência por **`externalId`** (upsert), nunca duplica.
- **Controller** (opcional) — expõe ao front: `GET` p/ listar candidatos externos, `POST` p/ disparar
  import/sync. Mesmas regras do backend-modulo (Zod na entrada, `req.user.sub` como ator, Swagger via Zod).

## Config / ENV

- Toda credencial/URL externa vem de **env validada** em `conf/configuration.ts` (Zod) e é lida em
  runtime **só** via `ConfigService` (`forRootAsync`). Nunca `process.env` direto no runtime.
- Convenção de nomes: `<SYSTEM>_BASE_URL`, `<SYSTEM>_TOKEN` (ou `<SYSTEM>_USER`/`<SYSTEM>_API_TOKEN`
  para Basic). Ex.: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.
- Adicionar as novas envs ao `.env.example`.

## Resiliência

- **Timeout** obrigatório por request (`AbortSignal.timeout(ms)`), default configurável.
- Erros de rede/HTTP viram **`502 Bad Gateway`** (falha do sistema externo, não nossa) com mensagem
  tratada; nunca vazar o erro cru do `fetch` pro front.
- **Nunca** deixar a indisponibilidade externa derrubar o boot nem o CRUD do domínio nosso: a aba
  "Cadastrados" (nosso DB) funciona mesmo com a origem externa fora do ar.
- Validação Zod que falhar → logar o registro problemático e seguir (não abortar o lote inteiro),
  salvo quando o lote todo é inválido.

## Importar (candidato externo → domínio nosso)

Fluxo "A cadastrar" → "Cadastrado":

1. Front lista candidatos via `GET /api/<system>/…` (service → client → mapper).
2. Usuário aciona **Cadastrar**; front chama `POST /api/<system>/import` com o `externalId`.
3. Service busca o item cru na origem (ou recebe o payload), mapeia e delega ao **service do domínio
   dono** que cria a linha (com auditoria `req.user.sub`). Idempotente por `externalId`.
4. O item some da lista "a cadastrar" (passa a existir no nosso DB).

## Gatilho (sync em lote)

- Carga manual: endpoint `POST /api/<system>/sync` (idempotente, upsert por `externalId`).
- Periódico: **BullMQ/cron** chamando o mesmo service (ver stack). Registrar o que foi
  criado/atualizado/ignorado; **logar** truncamentos/limites (sem cap silencioso).

## Referência viva

- Espelho read-only + upsert por `externalId`: módulo `client` (payload BomControle → contrato,
  `PUT /api/clients/sync`) — precede este padrão e será realinhado a ele.
