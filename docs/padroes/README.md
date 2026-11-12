# Padrões do projeto

Antes de implementar qualquer elemento concreto (service, controller, api, route, model,
entity, dto, schema, component, hook, etc.), **consulte se há um padrão aqui**. Se não
houver, o padrão precisa ser definido/aprovado antes de implementar — ver a regra no
`AGENTS.md` da raiz.

## Aplicáveis ao template

Estes descrevem código que **existe** neste repositório e valem desde o primeiro commit:

- [Módulo de backend (`apps/server`)](backend-modulo.md) — domínio NestJS: contrato Zod no
  shared → entity → repository → service → controller; conf, auditoria e convenções
- [UI Web (`apps/web`)](ui-web.md) — tema/tokens, primitivos shadcn-style, data-access
  (repository + hooks), App Shell
- [Nova tela (`apps/web`)](nova-tela.md) — checklist passo-a-passo: contrato → repository →
  hook → tela → menu
- [Migrations (Drizzle)](migrations.md) — versionar schema com `generate`/`migrate`, runner
  próprio, aplicação one-shot no deploy; `push` só em dev
- [Autenticação](auth.md) — **contas próprias (MP-002)**: sessão opaca em cookie HTTP-only
  resolvida no Postgres, Argon2id, reset com mailer simulado e os três pontos de injeção;
  substituto da recomendação de provedor externo do template
- [Deploy (Docker + Nginx)](deploy.md) — imagens de web/server, compose por ambiente, envs e
  checklist de release
- [Salvar direto em aba de detalhe (`apps/web`)](salvar-direto.md) — abas de subcoleção
  persistem na ação (sem botão "Salvar alterações"); replace-set × upsert quando há FK

## Aplicáveis ao storefront (MP-001)

Padrões definidos/aprovados para a issue MP-001; exigidos pela regra de trabalho nº 1
antes de qualquer implementação de componente ou feature do storefront:

- [Design system](design-system.md) — **fonte visual** (artefato de design + espelho dos
  tokens: cores, tipografia, espaço, componentes, voz); consultar antes de qualquer UI
- [Storefront público (`apps/web`)](storefront-publico.md) — route group `(storefront)` sem
  AppShell, layout próprio (announcement bar, header, nav de categorias, footer), composição
  de seções de página; referencia ADR-004 e ADR-005
- [Drawer (`apps/web`)](drawer.md) — painel lateral sobre backdrop escurecido; fechar por
  botão/backdrop/Escape; foco entra no drawer e retorna ao gatilho; focus trap; a11y ARIA;
  referencia ADR-004 e ADR-006
- [Client-state com persistência (`apps/web`)](client-state-persistido.md) — Context +
  reducer puro + localStorage versionado; guarda de hydration; validação Zod do storage;
  referencia ADR-003

## Referência (sem código correspondente)

Estes vieram do projeto de origem e **não têm implementação no template**. Ficam como
referência para quando o seu projeto precisar do recurso — siga-os em vez de inventar um
desenho novo:

- [Integração REST externa (`apps/server`)](integracao-rest.md) — consumir API de outro
  sistema: `integrations/<system>/` (client `fetch` → mapper Zod → service que delega ao
  domínio dono), auth/url via ConfigService, import por `externalId`
- [Rotinas agendadas (`apps/server`)](rotinas-agendadas.md) — batch/cron: `worker.ts` como
  processo separado da API (mesmo codebase), `@nestjs/schedule` (`@Cron`), jobs finos que
  delegam a services de domínio; idempotência
- [Geração de PDF no server (`apps/server`)](pdf-server.md) — front renderiza HTML (rota
  `(print)`) + Puppeteer imprime
