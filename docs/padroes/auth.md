# Padrão — Autenticação

> **Status:** **Aprovado** em 2026-11-12 (ver [Aprovação](#aprovação)). Este documento
> substitui a recomendação anterior de provedor externo.
>
> **Baseado em:** [ADR-001](../../.kproc/issues/MP-002/adrs/adr-001.md) (contas próprias,
> email simulado), [ADR-004](../../.kproc/issues/MP-002/adrs/adr-004.md) (PostgreSQL +
> Drizzle), [ADR-005](../../.kproc/issues/MP-002/adrs/adr-005.md) (sessão opaca em cookie
> HTTP-only), [ADR-006](../../.kproc/issues/MP-002/adrs/adr-006.md) (Argon2id),
> [ADR-007](../../.kproc/issues/MP-002/adrs/adr-007.md) (mailer simulado) e
> [ADR-008](../../.kproc/issues/MP-002/adrs/adr-008.md) (Account como overlay).

Este é o padrão de autenticação **deste projeto**. A loja usa contas próprias de email e
senha (ADR-001) — não há IdP externo, login social, JWT de acesso nem verificação de email
nesta fase. Contas, sessões e tokens de reset são reais e duráveis, persistidos no
PostgreSQL via Drizzle (ADR-004).

A arquitetura continua a do template: contrato Zod em `@merlins-potions-remake/shared`,
módulo NestJS em `controller → service → repository` e, no front, o caminho
`tela → hook → repository → BFF → API`. O browser nunca fala direto com a API.

## Modelo de sessão (ADR-005)

### Token e persistência

- No sign-in ou sign-up, a API cria uma sessão na tabela `session` com um token aleatório
  de 256 bits gerado por CSPRNG.
- O banco guarda **apenas o hash SHA-256** do token em `session.token_hash` (único). O
  token em claro é devolvido uma única vez ao BFF e nunca é persistido nem logado.
- A sessão tem `expires_at = criação + 30 dias`, além das colunas de auditoria padrão do
  template. Sessão expirada é tratada como inexistente; a remoção oportunista de linhas
  expiradas é permitida.
- Não há sessão em memória nem JWT autossuficiente: a resolução é sempre uma consulta ao
  banco. É esse estado que permite revogação imediata.

### Cookie `mp_session`

O cookie é o único transporte do token até o browser:

- Nome `mp_session`, definido **somente** pelas rotas do BFF em `apps/web/src/app/api/auth/*`.
- `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção.
- Com "Keep me signed in" marcado: `Max-Age` de 30 dias. Desmarcado: cookie de sessão do
  browser (sem `Max-Age`). Nos dois casos a linha em `session` expira em 30 dias.
- Sign-up sempre segue o comportamento de "Keep me signed in" marcado.
- O cookie carrega apenas o token opaco. Nunca contém dados do cliente, hash, senha ou
  qualquer informação de sessão legível pelo JavaScript do browser.
- O token **não** é guardado em `localStorage`, `sessionStorage` ou estado client-side.

### Resolução por requisição

1. O BFF lê o cookie `mp_session` no servidor e envia o token à API no header
   `Authorization: Bearer <token>`.
2. O guard do backend calcula o SHA-256 do token, busca a sessão por `token_hash` e
   verifica `expires_at > now()`.
3. Sessão válida resolve o `customer` associado e o disponibiliza na requisição. Sessão
   inválida, expirada ou ausente é tratada como não autenticada.

`GET /api/auth/session` é a exceção de leitura: responde sempre `200` com
`{ customer }` ou `{ customer: null }`, permitindo que o header renderize o estado anônimo
sem tratar ausência de sessão como erro. Nas demais rotas protegidas, sessão inválida ou
ausente responde `401`.

### Primeiro paint sem flash

O layout do route group `(storefront)` é um Server Component: lê `cookies()` e chama
`GET /api/auth/session` na API antes da renderização. O resultado entra como
`initialSession` no provider client-side e como `initialData` da query `['session']`.
Assim o header já nasce no estado correto depois de um reload, sem alternar entre
"Sign in" e o nome do cliente.

### Revogação

- **Sign out:** apaga a linha da sessão atual e o BFF limpa o cookie. A operação é
  idempotente para a mesma sessão (repetir não causa erro).
- **Reset de senha concluído:** apaga **todas** as linhas de `session` do cliente,
  revogando inclusive a sessão do browser atual; o BFF também limpa o cookie local. O
  reset concluído **não** cria sessão nova — o shopper volta ao sign-in.
- Expiração natural: `expires_at` vencido invalida a sessão sem depender de logout.

## Os três pontos de injeção

O template já prevê onde a autenticação se encaixa. A implementação deve alterar esses
pontos — e só eles — para não espalhar conhecimento de auth por controllers, services,
telas ou hooks.

### 1. Backend — guard global (`apps/server`)

- Registrar um guard **global** via `APP_GUARD`: secure by default, toda rota exige sessão
  válida salvo marcação explícita.
- Rotas públicas recebem `@Public()`: health, catálogo de produtos, entradas de auth
  (`sign-up`, `sign-in`, `password-resets`, `password-resets/complete`), `GET
  /api/auth/session` (sessão opcional) e o mailbox de desenvolvimento fora de produção.
  `POST /api/auth/sign-out` é protegido e idempotente para a sessão corrente.
- O guard cuida apenas da fronteira HTTP: extrai o Bearer, chama a resolução de sessão do
  **service** de customer e anexa o cliente resolvido à requisição. Ele não contém regra
  de negócio, não importa Drizzle e não valida JWT.
- Requisição protegida sem sessão válida responde `401` com mensagem genérica; não revela
  se o token existiu, expirou ou nunca foi emitido.
- Não existe validação de JWT: o padrão é sessão opaca resolvida no banco (ADR-005).

### 2. Backend — identidade do autor (`apps/server/src/common/http.ts`)

`actorOf(req)` é a **única** fonte de identidade para `created_by`/`updated_by` em toda
tabela auditada. Hoje devolve `"system"`; com o guard instalado, passa a devolver o id do
cliente autenticado. Operações públicas ou de sistema continuam usando `"system"`.

Controllers e services não mudam por causa disso: continuam chamando `actorOf(req)`. Ao
trocar a origem da identidade, altere apenas essa função.

### 3. Frontend — headers do BFF (`apps/web/src/lib/bff.ts`)

- `apiHeaders()` é o ponto único onde o token entra nas chamadas server-side à API. Ele lê
  o cookie `mp_session` e devolve `Authorization: Bearer <token>`.
- `fetchFromApi()` (Server Components) e `proxyToApi()` (route handlers) usam o mesmo
  `apiHeaders()`. Nenhuma tela, hook ou repository precisa saber que auth existe.
- As rotas `app/api/auth/*` são as únicas donas do cookie: fazem o proxy para a API e
  traduzem a resposta em `Set-Cookie` ou em limpeza do cookie. Nenhum componente de
  browser lê ou escreve o cookie.
- O `auth-repository` do front chama apenas o BFF e valida cada resposta com o Zod do
  `@merlins-potions-remake/shared`. O token nunca chega ao JavaScript do browser.

## Credenciais e senhas (ADR-006)

- Hash com **Argon2id** usando o pacote `argon2` e os parâmetros padrão da biblioteca, que
  seguem a recomendação OWASP.
- O hash fica exclusivamente em `customer.password_hash`. Ele não sai da camada de
  service/repository, não aparece em DTO do shared, não é retornado pela API e nunca é
  logado.
- Senhas em claro nunca são persistidas, logadas, enviadas a analytics ou incluídas em
  mensagens de erro.
- O mínimo de 8 caracteres é validado pelo contrato Zod no shared. O medidor de força do
  front é apenas orientativo; não bloqueia além do mínimo.
- A verificação usa o `verify` da biblioteca, nunca comparação manual de strings.
- No sign-in de email inexistente, o service executa um `verify` contra um hash fictício
  para igualar o custo de tempo ao caminho de email existente (ADR-006). Essa é uma
  defesa contra enumeração de contas, não um detalhe opcional.

## Lockout e respostas indistinguíveis

### Sign-in

- Credencial errada responde `401` com uma única mensagem genérica ("Email or password is
  incorrect."). A resposta não diz se o email existe nem se a senha está errada.
- Após 5 falhas consecutivas para o mesmo email, o sign-in daquele email pausa por 15
  minutos e responde `429`. Durante a pausa, até a senha correta é recusada.
- Para email existente, o contador e o lockout ficam persistidos em `customer`. Para email
  inexistente, o service mantém um contador equivalente em memória por email — não há
  tabela para emails que não são contas.
- A resposta e o comportamento da pausa são os mesmos exista ou não a conta. Sucesso no
  sign-in ou reset de senha concluído zeram contador e lockout.
- O tempo de resposta também não deve distinguir os casos: daí o `verify` fictício do
  ADR-006.

### Reset de senha

- `POST /api/auth/password-resets` responde `202` **sempre** para um email sintaticamente
  válido, tenha ou não conta. O front mostra o mesmo "Check your inbox" e o mesmo texto
  nos dois casos. A resposta não revela existência, não devolve token e não diferencia o
  corpo.
- O token de reset é aleatório, tem apenas o hash SHA-256 persistido, expira em 30 minutos
  e é de uso único (`used_at`). Token expirado ou já usado responde `410`, sem revelar
  nada sobre a conta.
- O reset concluído revoga todas as sessões e não autentica o shopper automaticamente.
- **Exceção aceita:** o sign-up pode responder `409` quando o email já está registrado,
  porque a UX precisa oferecer "switch to sign-in". Essa é a única revelação de existência
  permitida (ADR-001). Sign-in e reset não têm essa exceção.

## Fluxo de reset com `DevMailer` (ADR-007)

- O backend expõe a interface `Mailer` (`send`), e o fluxo de reset depende apenas dela.
- Nesta fase a única implementação é `DevMailer`: guarda em memória a última mensagem por
  destinatário, com destinatário, assunto e a URL completa de reset
  (`${WEB_ORIGIN}/reset-password/<token>`).
- A mensagem é consultável por `GET /api/dev/mailbox/:email`. O módulo `dev` inteiro —
  mailer e endpoint — só é registrado quando `NODE_ENV !== 'production'`; a ausência em
  produção deve ser coberta por teste.
- Nenhum email real é enviado nesta issue. O envio real (Phase 2) entra como uma nova
  implementação de `Mailer`, sem alterar o service de reset nem o contrato.
- O endpoint de mailbox é ferramenta de desenvolvimento/QA: não exponha dados de produção
  nele e não o habilite fora do ambiente permitido.

## Fronteira de UI (ADR-008)

- O Account é um overlay client-side dentro do route group `(storefront)`, controlado por
  um provider no padrão do bag. Não tem rota própria nem deep-link.
- Rotas de página existem apenas para o que chega por URL: `/reset-password/[token]`,
  `/terms` e `/privacy`.
- O estado de autenticação exibido no header vem do servidor (Server Component), não de
  uma leitura de cookie no client.
- Entrar, criar conta ou sair **não altera o bag** (ADR-002).
- A UI do storefront permanece em inglês e os preços em US$, conforme a exceção aprovada
  do MP-001.

## Contrato e erros

O contrato de auth é o Zod em `packages/shared/src/auth.ts` — fonte única para back e
front. O backend valida a entrada com ele; o front valida a resposta. Não duplique tipos
de auth no módulo ou no front.

Convenção de status:

| Situação | Status |
|---|---|
| Sign-up criado | `201` |
| Sign-up com email já registrado (exceção do ADR-001) | `409` |
| Sign-in válido | `200` |
| Sign-in inválido (email ou senha) | `401` genérico |
| Lockout ativo | `429` |
| Sign-out | `204` idempotente |
| Sessão (com ou sem cliente) | `200` com `customer` ou `customer: null` |
| Pedido de reset (com ou sem conta) | `202` sempre |
| Reset concluído | `204` |
| Token de reset expirado/usado | `410` |
| Corpo inválido | `400` (Zod) |
| Rota protegida sem sessão válida | `401` genérico |

O service lança a exceção; o controller a traduz; o BFF repassa o status; o front mapeia
status para a copy aprovada. Nenhuma camada inventa uma mensagem que revele existência de
conta.

## Testes exigidos pelo padrão

- **Service (repository fake em memória):** mensagem genérica de sign-in; lockout após 5
  falhas, inclusive com senha correta e para email inexistente; limpeza por sucesso e por
  reset; `202` para email inexistente; token de reset de uso único e expiração de 30
  minutos; revogação de todas as sessões; `resolveSession` com token expirado/aleatório
  retorna `null`; hash nunca presente em DTO.
- **BFF:** atributos do cookie conforme `keepSignedIn`; limpeza no sign-out e no reset
  concluído; repasse de status; `session` sem cookie retorna `{ customer: null }`.
- **Integração com Postgres:** unicidade de email; ciclo criar → resolver → revogar
  sessão; ciclo do token de reset; durabilidade da conta após restart do processo da API.
- **Indistinguibilidade:** testes devem comparar status e corpo de sign-in e de pedido de
  reset para email registrado e não registrado. Onde o tempo for observável, use a mesma
  estratégia de `verify` fictício.
- **DevMailer:** endpoint e módulo não são registrados em produção.

## Referências

- [TechSpec MP-002 — System Architecture e Technical Considerations](../../.kproc/issues/MP-002/_techspec.md)
- [ADR-001 — Contas próprias, reais e duráveis, com email simulado](../../.kproc/issues/MP-002/adrs/adr-001.md)
- [ADR-002 — O bag permanece no dispositivo](../../.kproc/issues/MP-002/adrs/adr-002.md)
- [ADR-004 — PostgreSQL + Drizzle](../../.kproc/issues/MP-002/adrs/adr-004.md)
- [ADR-005 — Sessão opaca em cookie HTTP-only](../../.kproc/issues/MP-002/adrs/adr-005.md)
- [ADR-006 — Hash de senha com Argon2id](../../.kproc/issues/MP-002/adrs/adr-006.md)
- [ADR-007 — Mailer simulado com mailbox de desenvolvimento](../../.kproc/issues/MP-002/adrs/adr-007.md)
- [ADR-008 — Account como overlay](../../.kproc/issues/MP-002/adrs/adr-008.md)
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## Aprovação

Este padrão é **bloqueante**: nenhuma task de auth (backend ou frontend) inicia antes da
aprovação humana registrada abaixo.

- [x] Revisado contra os ADRs 004–008 e o TechSpec por humano.
- [x] Aprovado explicitamente para implementação.

**Aprovado por:** Richard Campos
**Data da aprovação:** 2026-11-12

Ao aprovar, atualize o status no topo deste documento para **Aprovado** e preencha os
campos acima. Sem esse registro, o documento permanece `proposto` e a implementação
continua bloqueada.
