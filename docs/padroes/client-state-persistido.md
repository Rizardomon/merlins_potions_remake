# Padrão — Client-state com persistência (`apps/web`)

> **Baseado em:** [ADR-003](../../.kproc/issues/MP-001/adrs/adr-003.md) (estado da sacola
> via React Context + reducer + localStorage).

## Contexto

Client-state compartilhado que precisa sobreviver a reload/restart do navegador sem
expirar e sem dependências novas. Diferente de server-state (TanStack Query), este estado
é local: não vai ao backend, não tem invalidação por tempo.

Exemplos de uso: sacola de compras, preferências de exibição, rascunhos locais.

## Quando aplicar

Quando o estado:
- É compartilhado entre mais de um componente não-pai-filho;
- Precisa persistir entre reloads no mesmo dispositivo;
- **Não** é server-state (não vem de API, não precisa de stale/revalidate).

Não use este padrão para server-state — use TanStack Query.

## Estrutura de arquivos

```
apps/web/src/lib/<feature>/
  types.ts        ← interfaces e union types das ações
  reducer.ts      ← reducer puro (sem side-effects)
  selectors.ts    ← valores derivados (memos puros)
  storage.ts      ← serialização/deserialização + chave versionada
  provider.tsx    ← Context + Provider + hook de acesso
```

Componentes de UI importam apenas o hook exportado do `provider.tsx`; nunca importam o
reducer ou o storage diretamente.

## Chave de storage versionada

```ts
// storage.ts
const STORAGE_KEY = "mp.<feature>.v1"; // bumpe v1→v2 ao mudar o schema

export function loadFromStorage(): MyState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return MyStateSchema.parse(parsed); // valida com Zod; lança se inválido
  } catch {
    localStorage.removeItem(STORAGE_KEY); // descarta dados corrompidos ou versão antiga
    return null;
  }
}

export function saveToStorage(state: MyState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

- Use um schema Zod para validar o que foi lido do storage. Dados inválidos são
  descartados e a chave é removida — nunca deixe estado corrompido ser hidratado.
- Ao mudar a estrutura persistida de forma incompatível, bumpe a versão (`v1` → `v2`).
  Dados da versão anterior são automaticamente descartados pelo `removeItem`.

## Provider e guarda de hydration

```tsx
// provider.tsx
"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { myReducer, initialState } from "./reducer";
import { loadFromStorage, saveToStorage } from "./storage";
import type { MyState, MyAction } from "./types";

const MyContext = createContext<{ state: MyState; dispatch: React.Dispatch<MyAction> } | null>(null);

export function MyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(myReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Hidrata client-side para evitar mismatch SSR/localStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) dispatch({ type: "hydrate", payload: stored });
    setHydrated(true);
  }, []);

  // Persiste a cada mudança após hydration
  useEffect(() => {
    if (hydrated) saveToStorage(state);
  }, [state, hydrated]);

  return <MyContext.Provider value={{ state, dispatch }}>{children}</MyContext.Provider>;
}

export function useMyState() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error("useMyState must be used inside MyProvider");
  return ctx;
}
```

**Guarda de hydration:** exiba contagens/badges como `0` ou `-` até `hydrated === true`
para evitar flash de conteúdo incorreto no SSR.

## Reducer puro

```ts
// reducer.ts
export const initialState: MyState = { /* valores padrão */ };

export function myReducer(state: MyState, action: MyAction): MyState {
  switch (action.type) {
    case "hydrate": return action.payload;
    // demais cases...
    default: return state;
  }
}
```

O reducer não tem acesso a `localStorage`; toda persistência é responsabilidade do
Provider. Isso facilita os testes unitários (Vitest): basta importar o reducer e chamar
como função pura.

## Seletores derivados

```ts
// selectors.ts — valores calculados, não armazenados
export function selectItemCount(state: MyState): number { /* ... */ }
export function selectSubtotalCents(state: MyState): number { /* ... */ }
```

Seletores são funções puras; use `useMemo` ao consumi-los em componentes para evitar
recálculo desnecessário.

## Integração com a árvore de componentes

Registre o Provider no nível mais alto necessário — normalmente no `layout.tsx` do
storefront ou no `layout.tsx` raiz, **nunca** dentro de um componente de folha:

```tsx
// (storefront)/layout.tsx
import { MyProvider } from "@/lib/<feature>/provider";

export default function StorefrontLayout({ children }) {
  return <MyProvider>{/* announcement bar, header, nav, {children}, footer */}</MyProvider>;
}
```

## Regras

- Reducer deve ser função pura: sem `fetch`, sem `localStorage`, sem efeitos.
- Sempre valide o que é lido do storage com Zod antes de hidratar.
- Nunca armazene o objeto completo de entidades no storage — apenas IDs e quantidades;
  recomponha cruzando com server-state na hidratação.
- Não misture client-state persistido com server-state: se um dado vem de API, use Query.

## Definition of Done

- [ ] `reducer.ts` puro, sem side-effects.
- [ ] `storage.ts` com chave versionada e validação Zod ao ler.
- [ ] `provider.tsx` com guarda de hydration (`hydrated` flag).
- [ ] Hook de acesso exportado; nenhum componente importa reducer/storage diretamente.
- [ ] Testes unitários do reducer (Vitest): todos os `action.type`; estado inicial; edge
      cases de quantidade.
- [ ] Teste de persistência: mock de `localStorage`; valida serialização e descarte de
      conteúdo inválido.
- [ ] `pnpm typecheck` sem erros.
