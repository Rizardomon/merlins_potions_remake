# Salvar direto em aba de detalhe (`apps/web`)

Padrão para as **abas de subcoleção** das telas de detalhe — as listas de itens filhos que
vivem dentro do cadastro de um registro pai (endereços, contatos, itens, anexos…).

> **Documento de referência.** O template não tem tela de detalhe com abas — a tela de
> exemplo (`/roles`) é um catálogo simples. Siga este padrão quando o seu projeto criar a
> primeira.

**Regra central: a ação do usuário persiste na hora.** Vincular, adicionar, editar ou remover
grava no banco no ato. **Não existe botão "Salvar alterações" por aba.**

## Por que

O padrão anterior mantinha um rascunho em `useState` e só persistia no clique de um segundo
botão. Isso gerava:

- **Dois botões escritos "Salvar"** — o do modal (fake, só mexia no draft) e o da aba (real).
  O usuário clicava no primeiro e perdia o trabalho ao sair da aba.
- **Perda silenciosa**: trocar de aba ou navegar descartava o draft sem aviso.
- Abas que **nunca ressincronizavam** com o servidor (`expenses-tab`, `roles-tab` não tinham o
  `useEffect` de sync), deixando a UI divergir do banco após cada save.

Uma aba de subcoleção não é um formulário com transação — é uma lista de vínculos. Cada linha é
independente, então cada linha persiste sozinha.

> **Não confundir** com o form de **Informações** (dados escalares da entidade), que **mantém**
> o botão "Salvar": ali o usuário edita vários campos correlatos e espera um commit único.

## Estrutura

```
apps/web/src/
  components/<dominio>/<sub>-tab.tsx     # a aba: lista + ação, sem draft
  hooks/use-app.ts                       # useSetX / useAddX / useRemoveX (mutations)
  lib/api/<dominio>-repository.ts        # chamada HTTP + validação Zod
  app/api/<dominio>/[id]/<sub>/route.ts  # BFF (proxyToApi)
```

## Persistência: replace-set × granular

O backend expõe `PUT /:id/<sub>` que **substitui a coleção inteira** (delete-all + insert-all).
Isso **recria os ids** a cada save. A escolha depende de haver quem referencie esses ids:

| Caso | Como | Abas |
|---|---|---|
| **Ninguém referencia os ids da subcoleção** | Mantém o `PUT` replace-set. A ação monta a lista já mutada e chama `save.mutate(next)` na hora. O churn de id é inofensivo. | Endereços, contatos, anexos… |
| **Alguém referencia os ids (FK)** | O replace-set é **proibido**: o `ON DELETE CASCADE` apagaria os dependentes. Usar **upsert preservando o id** (ou endpoint granular). | Qualquer subcoleção que seja alvo de `.references()` |

**Antes de aplicar replace-set numa subcoleção nova, verifique se alguma entity tem
`.references(() => <sub>.id)`.** Se tiver, é upsert.

## Regras da aba

- **Sem `draft`, sem `dirty`, sem botão "Salvar".** A fonte da verdade é o servidor; a UI só o
  reflete. Isso elimina de vez o problema de ressync.
- **Origem dos dados**: a lista renderizada tem de vir do servidor — seja por query própria da
  aba, seja por prop da página (quando o detalhe já traz as subcoleções aninhadas). O que importa
  é a mutation **invalidar a query que alimenta a lista**, para a aba se atualizar sozinha. Nunca
  copiar essa lista para um `useState`.
- **Modal de item**: o botão de confirmar chama a mutation e fecha **no `onSuccess`**. Nunca
  fecha antes de confirmar a persistência. O label é **"Adicionar"**/"Salvar" conforme criar ou
  editar — mas agora é o botão *real*, não há um segundo.
- **Remover**: confirmação → mutation, via `common/confirm-dialog.tsx` (`ConfirmDialog`). Nunca
  `window.confirm()`: destoa das telas e não tem onde exibir o erro da mutation.
- **Feedback**: `isPending` desabilita o controle acionado; erro aparece na aba (não silencioso).
- **Validação antes de persistir**: campo obrigatório vazio bloqueia a ação — impedimento do
  próprio botão, não aviso de rodapé.
- **Edição inline** (input direto na tabela): persiste no **`onBlur`**, não a cada tecla. Se o
  valor não mudou, não chama a mutation.

## Master-detail com transfer list

Quando a aba é uma atribuição N×N, o padrão é um painel master-detail: coluna mestre à
esquerda com CRUD que persiste direto e, à direita, sub-abas por dimensão com uma
**transfer list** (dual-list controlada por id).

> O template não traz esses componentes (`AssignmentPanel`/`TransferList`) — eles saíram
> junto com o permissionamento. Se o seu projeto precisar, construa-os sobre os primitivos
> de `components/ui/*` e siga as regras abaixo.

A transfer list também salva direto: mover um item persiste no ato. Como cada PUT leva a
coleção inteira, a lista fica **`disabled` durante a gravação** — isso serializa os
requests. Sem isso, dois PUTs em voo podem chegar fora de ordem e o payload antigo vence.

O painel não tem botão "Salvar": mostra só "Salvando…"/"Salvo."/erro.

## Checklist

1. A subcoleção tem FK apontando para ela? → upsert. Senão → replace-set.
2. A lista renderizada vem do servidor (query ou prop), nunca de um `useState`.
3. Nenhum `useState` de draft, nenhum `dirty`, nenhum botão "Salvar alterações".
4. Toda ação chama a mutation; modal fecha no `onSuccess`.
5. Mutation invalida a query key do domínio em `queryKeys` (`hooks/use-app.ts`).
6. Remoção tem confirmação; erro é exibido.
