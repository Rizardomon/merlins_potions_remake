# Rotinas agendadas (`apps/server` — worker)

> **Documento de referência.** O template não implementa rotinas agendadas / worker — não há código
> correspondente neste repositório. Ele descreve o desenho a seguir se o seu projeto
> precisar do recurso, para não inventar um padrão novo. Adapte os nomes de domínio
> aos do seu projeto.

Padrão para **trabalho batch/agendado** (cargas noturnas, sweeps, notificações): varreduras
do Jira/BI, cálculo de horas por projeto, e-mails/Teams de aviso, etc. Complementa a
[Integração REST externa](integracao-rest.md) e o [Módulo de backend](backend-modulo.md).

## Duas decisões, independentes

1. **Onde roda:** processo **separado** da API (mesmo codebase).
2. **Como agenda:** **`@nestjs/schedule`** (`@Cron`), in-process. Sem Redis/BullMQ.

### 1. Mesmo codebase, processo separado
Não há projeto novo. As rotinas vivem no **`apps/server`**, reusando entities Drizzle,
repositórios, services de domínio e as integrações. O que muda é o **entrypoint**:

- **`main.ts`** → sobe a API (`AppModule`), atende HTTP.
- **`worker.ts`** → sobe o `WorkerModule` (infra + módulos de domínio usados pelos jobs +
  `ScheduleModule.forRoot()`). **Sem** controllers/guard HTTP; não escuta porta.

Motivo: um sweep noturno pesado não pode disputar CPU/latência com a API nem derrubá-la. Como é o
mesmo build, zero duplicação de domínio.

### 2. `@nestjs/schedule`, não BullMQ
Para o volume atual (poucos jobs noturnos, **uma instância** do worker, cada job = "dispara e roda
um método") o `@Cron` basta. **Não** adotamos BullMQ/Redis agora — seria infra a mais no deploy sem
requisito que a justifique.

**Quando escalar para BullMQ (fila + Redis)** — só se aparecer:
- **retry/backoff** automático necessário por falha;
- **múltiplas réplicas** do worker (aí o `@Cron` dispararia N vezes; o Redis faz o dedupe);
- **fila** de muitas tarefas curtas com produtor/consumidor desacoplados;
- visibilidade/progresso de fila.

A migração é local: os *processors* delegam aos services de domínio, então trocar o motor de
agendamento não mexe na regra de negócio.

> **Premissa registrada:** **uma única instância** do worker. Rodar 2+ réplicas com `@Cron`
> duplica execução — se um dia precisar escalar, é o gatilho para migrar a BullMQ.

## Peças

```
apps/server/src/
  worker.ts                      # entrypoint: NestFactory.createApplicationContext(WorkerModule) + app.init()
  worker.module.ts               # imports enxutos: Conf, Database, ScheduleModule.forRoot(), módulos de domínio + jobs
  jobs/
    <job-name>/
      <job-name>.job.ts          # @Injectable com @Cron(...): orquestra services de domínio
      <job-name>.module.ts       # provider do job + imports dos módulos que ele usa
```

- **Agendamento:** `@Cron(expr)` no método do job. A expressão vem de **config** quando fizer
  sentido ser ajustável (ex.: `JOB_X_CRON` no `conf/configuration.ts`, default no `.env.example`).
- **Job:** fino. Sem regra de negócio nem SQL próprio — **delega aos services/repos de domínio** já
  existentes (mesma regra da camada controller). Uma rotina = um job.
- **Config nova:** cron(s) via `configuration.ts` (Zod) + `.env.example`. (Sem `REDIS_URL`.)

## Autenticação das integrações no batch (importante)

A [integração Jira](integracao-rest.md) hoje **repassa o bearer do usuário logado**. Um job **não
tem usuário** → precisa de **credencial de serviço** (client-credentials / service account) para
Jira/BI. Isso é dependência de **SSO** (provisionamento), registrada em `tmp/necessidades_sso.md`.
Até existir, o client de integração ganha um modo "token de serviço" separado do "bearer do
request". **Nenhum job vai a produção sem essa credencial definida.**

## Idempotência e segurança operacional

- **Idempotente:** rodar duas vezes não duplica efeito (e-mail repetido, dupla escrita). Chave
  natural (ex.: `plano+colaborador+dia`) + upsert; marcar o que já foi notificado.
- **Sem cap silencioso:** se a rotina limita lote/tempo, **logar** o que ficou de fora.
- **Erro isolado por item:** falha de integração num item não aborta o batch — isolar (mesmo
  espírito do `mapWithConcurrency` do 3.89); respeitar limite de chamadas paralelas ao Jira.
- **Observabilidade:** log estruturado de início/fim/erro por execução.
- **Overlap:** job noturno longo não deve reentrar antes de terminar — guardar um flag "em execução"
  ou garantir que o cron não colida.

## Deploy
Mesma imagem Docker, **dois comandos**: `node dist/main.js` (api) e `node dist/worker.js` (worker),
como dois serviços no compose (ver [deploy](deploy.md)). **Sem** dependência de Redis.

## Checklist para uma nova rotina

1. Há padrão para o domínio que ela toca? (senão, definir antes).
2. Job fino delegando a service existente; cron via config.
3. Idempotência definida (chave + marcação de "já processado").
4. Credencial de serviço da integração disponível (se acessa Jira/BI).
5. Log de execução + tratamento de erro por item + guarda de overlap.
