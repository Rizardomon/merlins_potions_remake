# Padrão — Nova tela (`apps/web`)

Checklist determinístico para criar uma tela nova. Complementa o [UI Web](ui-web.md)
(tokens, primitivos, nomenclatura) com o **passo-a-passo** e onde cada arquivo entra.
Siga na ordem — cada passo depende do anterior.

> Convenção (ver `ui-web.md §0`): **código em inglês**, **UI em português**. Arquivos
> `kebab-case`; componentes/tipos `PascalCase`; hooks `useX`; vars/funcs `camelCase`.

A tela de Papéis (`/roles`) é a referência viva deste caminho completo: contrato →
backend → BFF → repository → hook → tela → menu.

## Passo-a-passo

### 1. Contrato — `packages/shared/src/<domain>.ts`
Defina os schemas Zod do recurso (inglês) e reexporte em `src/index.ts`. É a **fonte
única** de tipos entre front e back: `<Entity>Schema`, `Create<Entity>Schema`,
`Update<Entity>Schema` e os tipos inferidos. Reaproveite `Page<T>`/`PageSchema`.

### 2. Backend — `apps/server/src/modules/<domain>/`
Crie o módulo seguindo [backend-modulo.md](backend-modulo.md) (entity/repository →
service → controller). Sem endpoint não há o que a tela consumir.

### 3. BFF — `apps/web/src/app/api/<dominio>/route.ts`
Proxy para a API, usando `proxyToApi` de `src/lib/bff.ts`. `GET`/`POST` na rota de
coleção; `PUT`/`DELETE` em `[id]/route.ts`. O browser nunca chama a API NestJS direto
(ver [auth.md](auth.md)).

### 4. Data-access — `apps/web/src/lib/api/<dominio>-repository.ts`
`fetch` no BFF, **validando a resposta com o schema Zod do `@app/shared`**. Exponha
métodos de domínio (`listX`, `createX`, `updateX`, `deleteX`). Se o backend não pagina,
mantenha o `Page<T>` filtrando/paginando no client. Modelo: `role-repository.ts`.

### 5. Hook de dados — `apps/web/src/hooks/use-app.ts`
- Registre a query key em `queryKeys` (ex.: `suppliers: (search, page) =>
  ["suppliers", { search, page }] as const`).
- Exporte `useSuppliers(...)` com `useQuery`, e as mutations com `useMutation` +
  `onSuccess` invalidando a chave do domínio.

### 6. Tela — `apps/web/src/app/(app)/<segmento>/page.tsx`
- Segmento de rota em inglês, kebab-case (ex.: `/suppliers`, detalhe em
  `/suppliers/[id]/page.tsx`).
- `"use client"`, consome **somente** o hook, trata loading com `Skeleton`, compõe com
  primitivos (`ui/*`) e composições (`common/*`). Textos em português.
- Catálogo simples (id + descrição)? Use `CatalogCrudCard` e pule o resto:

```tsx
"use client";

import { CatalogCrudCard } from "@/components/common/catalog-crud-card";
import { useCreateSupplier, useDeleteSupplier, useSuppliers, useUpdateSupplier } from "@/hooks/use-app";

export default function SuppliersPage() {
  return (
    <CatalogCrudCard
      title="Fornecedores cadastrados"
      addLabel="Cadastrar Fornecedor"
      addTitle="Cadastrar Fornecedor"
      editTitle="Editar Fornecedor"
      useData={useSuppliers}
      useCreate={useCreateSupplier}
      useUpdate={useUpdateSupplier}
      useDelete={useDeleteSupplier}
    />
  );
}
```

### 7. Menu + título — `apps/server/src/modules/menu/menu.repository.ts`
A navegação é **dado servido pelo backend**, não código: acrescente a linha do item
(`name`, `label`, `route`, `icon`, `section`, ordenação, `title`/`subtitle` da topbar).

Se o ícone lucide ainda não estiver no mapa `iconByName` de
`apps/web/src/components/layout/nav-config.tsx`, registre-o lá — e espelhe o item no
`navSections`/`pageMeta` do mesmo arquivo, que é o fallback exibido enquanto `/api/menu`
não responde.

### 8. Componentes específicos da tela (se houver)
Reutilizáveis entre telas → `src/components/common/*`. Componentes que só pertencem a
**uma** feature → `src/components/<feature>/*`.

## Definition of Done
- [ ] Contrato, módulo do backend, BFF, repository, hook, tela e menu criados.
- [ ] Tela depende só do hook (nunca do repository ou de `fetch` direto).
- [ ] Resposta da API validada com o Zod do `@app/shared`.
- [ ] Loading via `Skeleton`; sem hex hardcoded (só tokens/utilitários).
- [ ] Nomenclatura EN no código / PT na UI.
- [ ] `pnpm typecheck` sem erros.
