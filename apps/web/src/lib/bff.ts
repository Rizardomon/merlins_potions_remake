import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3011/api";

/**
 * BFF: o browser nunca fala direto com a API NestJS. Toda chamada passa pelas rotas
 * `src/app/api/*` do Next, que rodam no servidor e repassam para o backend.
 *
 * Isso pode parecer indireção desnecessária enquanto a API é aberta — mas é o ponto de
 * costura onde a autenticação entra depois: ao plugar SSO, só estas duas funções mudam
 * (buscam o access token da sessão e o injetam como `Authorization: Bearer`), e nenhuma
 * tela precisa saber. Ver `docs/padroes/auth.md`.
 */

/** Cabeçalhos enviados à API. Ponto único de injeção do `Authorization`, quando houver. */
function apiHeaders(hasBody: boolean): HeadersInit {
  return hasBody ? { "Content-Type": "application/json" } : {};
}

/**
 * Leitura server-side da API (Server Components). Diferente do `proxyToApi`, devolve os
 * dados já desserializados em vez de uma `NextResponse` — para quando quem chama é uma
 * página/layout, não um route handler. Retorna null se a API recusar.
 */
export async function fetchFromApi<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: apiHeaders(false),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

/**
 * Proxy server-side genérico para a API NestJS. Repassa status e corpo da API,
 * preservando o 204 (sem corpo) do DELETE.
 */
export async function proxyToApi(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<NextResponse> {
  const hasBody = init?.body !== undefined;
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: apiHeaders(hasBody),
    body: hasBody ? JSON.stringify(init!.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json(
      data ?? { error: `Falha na API (${res.status})` },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: res.status });
}
