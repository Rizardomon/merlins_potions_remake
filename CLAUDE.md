# Regras para agentes

Scaffold base para projetos **NestJS + Next.js** em monorepo. Este repositório é um
**template**: ele é clonado para iniciar um projeto novo, não é um produto.

Ao derivar um projeto deste template, substitua este arquivo pelo contexto real do
projeto — mantendo as regras de trabalho abaixo.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo (`apps/*`, `packages/*`).
- **Backend — `apps/server`:** NestJS 11 + TypeScript. Persistência prevista com
  **Drizzle ORM + PostgreSQL**, mas **os repositories do template são mocados em
  memória** — o app sobe sem banco. Ver `apps/server/src/modules/_example/`.
- **Frontend — `apps/web`:** Next.js (App Router) + React 19, **shadcn/ui + Tailwind**,
  TanStack Query. O browser nunca chama a API direto: tudo passa pelo BFF em
  `src/app/api/*`.
- **Compartilhado — `packages/shared`:** Zod schemas + tipos/DTOs (**fonte única de
  verdade** entre front e back).
- **Autenticação: não existe.** A aplicação é aberta por decisão de projeto. Ver
  `docs/padroes/auth.md` para onde plugá-la.

## Regras de trabalho (OBRIGATÓRIAS)

1. **Padrões antes de implementar.** Antes de criar qualquer elemento concreto (service,
   controller, api, route, model, entity, dto, schema, component, hook, etc.), **consulte
   se existe um padrão documentado** em `docs/padroes/` (índice em
   `docs/padroes/README.md`). Se **não existir** padrão para aquele tipo de elemento,
   **não prossiga**: primeiro o padrão precisa ser definido. Você **pode sugerir** um
   padrão, mas só implementa após ele ser aprovado e documentado.

   - Exceção: **scaffold inicial** de um projeto derivado (estrutura base, tela de
     exemplo) pode ser feito sem padrões definidos — bypass explícito e pontual.

2. **Nomenclatura: código em inglês, UI em português.** Identificadores, tipos, campos,
   arquivos, segmentos de rota e query keys em inglês; textos visíveis ao usuário em
   português. Arquivos `kebab-case`; componentes/tipos `PascalCase`; hooks `useX`;
   funções/vars `camelCase`. Tabela no **singular**, rota no **plural**.

3. **O contrato é o Zod do `@merlins-potions-remake/shared`.** Não duplique tipos de domínio no front nem no
   back. O backend valida a entrada com ele; o frontend valida a resposta com ele.

4. **Respeite as camadas.** Backend: `controller → service → repository` — o controller
   não tem regra de negócio, o service não conhece a origem dos dados. Frontend:
   `tela → hook → repository → BFF → API` — telas nunca chamam `fetch` direto.

## Referências rápidas

- Criar um domínio no backend: `docs/padroes/backend-modulo.md`
- Criar uma tela: `docs/padroes/nova-tela.md`
- Ligar o banco (Drizzle): `apps/server/src/modules/_example/README.md`
- Renomear o template para um projeto novo: `node scripts/rename-project.mjs <slug> "Nome"`
