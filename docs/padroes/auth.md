# Padrão — Autenticação

**O template não tem autenticação.** A aplicação é aberta: qualquer um que alcance a
porta acessa todas as telas e todos os endpoints. Isso é deliberado — cada projeto tem
seu IdP e seu modelo de permissão, e um esqueleto de auth errado custa mais para
desmontar do que para escrever.

Este documento descreve **onde** a autenticação se encaixa, para que plugá-la seja uma
mudança localizada e não uma reforma.

> ⚠️ Enquanto não houver auth, **não** exponha o app fora da rede interna, e não coloque
> dado sensível nele.

## Os três pontos de costura

O template já está desenhado para receber auth nesses três lugares — e só neles:

### 1. Backend — guard global (`apps/server`)

Hoje não há guard: todo controller é público. O padrão ao adicionar um IdP é um
**resource server** que valida o JWT **offline via JWKS** (sem chamar o IdP a cada
requisição):

- Registre o guard em `app.module.ts` via `APP_GUARD` — **global**, secure by default.
  Rota que precisa ficar aberta (ex.: `health`) recebe um decorator `@Public()`.
- Nunca escreva validação de JWT do zero. Use a biblioteca do seu IdP.
- Issuer e audience vêm de env, validadas em `src/conf/configuration.ts`.

### 2. Backend — identidade do autor (`src/common/http.ts`)

`actorOf(req)` hoje devolve `"system"` fixo, e é ele que alimenta `created_by`/`updated_by`
em toda tabela. Com o guard instalado, passe a ler o subject do token
(`req.user.sub`) **nessa única função** — nenhum controller ou service muda.

### 3. Frontend — BFF (`apps/web/src/lib/bff.ts`)

O browser **nunca** fala direto com a API NestJS: toda chamada passa pelas rotas
`src/app/api/*` do Next, que rodam no servidor. Essa indireção existe justamente para
isto — é onde o access token é obtido e injetado, sem que o token chegue ao browser.

Ao plugar auth, só a função `apiHeaders()` de `bff.ts` muda: buscar o token da sessão e
devolver `Authorization: Bearer …`. Nenhuma tela, hook ou repository é tocado.

Além disso, acrescente:

- **Rotas de sessão** em `app/api/auth/`: `login` (redirect ao IdP), `callback`
  (troca code→token e grava a sessão), `logout`.
- **Guard server-side** no `app/(app)/layout.tsx`: sem sessão → redirect para `/login`.
  O layout já está marcado com um comentário nesse ponto.

## Recomendações para quando for implementar

- **Auth Code + PKCE**, cliente público no front — sem client secret no browser.
- **Sessão server-side**: os tokens ficam num store no servidor e o **cookie HTTP-only
  guarda apenas um id opaco**. Tokens completos (access + refresh + id) estouram o limite
  de 4KB do cookie com facilidade. Em produção, use Redis; em dev, memória basta.
- **Refresh sob demanda**: renove o access token quando faltar pouco para expirar, em vez
  de derrubar a sessão. Só encerre se o token expirou **e** o refresh falhou.
- **Gate em duas camadas**: o `middleware.ts` checa a presença do cookie (barato, roda em
  toda requisição); o layout do grupo `(app)` exige uma sessão **real** no store. Sem a
  segunda camada, um cookie órfão (presente no browser, sem sessão correspondente) deixa
  o usuário "dentro" tomando 401 em toda chamada.

## Autorização (permissões)

O template também não tem permissionamento — o menu vem do backend (`modules/menu`) sem
qualquer filtro. Se o projeto precisar de controle de acesso, o desenho natural sobre
esta base é:

1. `MenuService.getMenu()` passa a filtrar os itens pelo que o usuário pode ver — o
   contrato com o front não muda.
2. Um guard de rota no `(app)/layout.tsx` recusa acesso direto por URL a uma tela fora
   do menu efetivo. **Esconder o item do menu não é controle de acesso**: sem essa
   checagem, qualquer autenticado abre qualquer tela digitando o endereço.
