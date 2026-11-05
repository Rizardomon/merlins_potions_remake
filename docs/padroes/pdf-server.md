# Padrão — Geração de PDF no server (`apps/server`)

> **Documento de referência.** O template não implementa geração de PDF no servidor — não há código
> correspondente neste repositório. Ele descreve o desenho a seguir se o seu projeto
> precisar do recurso, para não inventar um padrão novo. Adapte os nomes de domínio
> aos do seu projeto.

Padrão para gerar documentos PDF (ex.: RA/RDV do fechamento — itens 1.12/1.13). Adota a
mesma abordagem do projeto `Kbase__/report-generator`: **o front renderiza o documento em HTML**
(rota de impressão, React/Tailwind) e o **server imprime com Puppeteer** (`page.pdf()`).

## Por que "front renderiza + Puppeteer imprime"

- Reaproveita React/Tailwind (o mesmo design system) para bater o layout do documento — sem um
  motor de layout separado no server.
- O server só orquestra: abre a URL da rota de impressão, espera montar e imprime.

## Fluxo

```
[browser] clica "PDF"
   → GET /api/reports/<kind>/<id>/pdf        (BFF autenticado, injeta o Bearer)
      → GET /<kind-plural>/:id/pdf           (API NestJS, autenticado)
         → ReportPdfService.render()
            → puppeteer.launch() → page.goto(`${FRONTEND_URL}/print/<kind>/<id>?t=<token>`)
               → a página (print) faz GET /api/print/<kind>/<id>?t=<token>
                  → GET /<kind-plural>/:id/print?t=<token>   (API pública, guardada por token)
               → renderiza e marca [data-print-ready]
            → page.pdf() → Buffer → stream de volta como application/pdf
```

## SSO — o problema do headless e o **token de impressão**

As rotas do portal estão atrás do Keycloak; o **Puppeteer headless não tem a sessão** do usuário.
Solução stateless: o endpoint de PDF (autenticado) gera um **token curto assinado** (HMAC-SHA256,
`{ kind, id, exp }`, ~120s) e o passa na URL da rota de impressão. A rota que serve os **dados** de
impressão é **pública mas valida o token** (`@Public()` + verificação HMAC). Nada de sessão no browser.

- Assinatura/verificação: `report-token.ts` (`signReportToken` / `verifyReportToken`), segredo em
  `PDF_TOKEN_SECRET`.
- A página `(print)` e a rota `/api/print/*` ficam **fora do gate** do middleware do front
  (`matcher` exclui `print` e `api`).

## Peças (modelo RA/RDV)

- **Server** (`modules/<dominio>/`):
  - `report-pdf.service.ts` — `puppeteer.launch({ headless, executablePath?, args:['--no-sandbox'] })`,
    `page.goto(url, { waitUntil: 'networkidle0' })`, `waitForSelector('[data-print-ready]')`, `page.pdf()`.
  - `report-token.ts` — HMAC do token.
  - controller: `GET /:id/pdf` (autenticado, dispara o Puppeteer) e `GET /:id/print` (`@Public()`,
    valida token, devolve o **DTO de impressão** do contrato shared).
- **Front**:
  - Página de impressão `app/print/<kind>/[id]/page.tsx` — client component, lê `?t=`, busca o DTO,
    renderiza em HTML light (bg branco/texto preto) e marca `data-print-ready` quando pronto.
    Envolver o corpo num `<Suspense>` (uso de `useSearchParams`).
  - BFF `app/api/print/<kind>/[id]/route.ts` — **público**, repassa o token à API (sem Bearer).
  - BFF `app/api/reports/<kind>/[id]/pdf/route.ts` — **autenticado**, injeta o Bearer e devolve o binário.

## Config / ENV (`apps/server`)

| ENV | Default | Uso |
|-----|---------|-----|
| `FRONTEND_URL` | `http://localhost:3000` | base das rotas `(print)` que o Puppeteer abre |
| `PDF_TOKEN_SECRET` | (dev) | segredo HMAC do token de impressão — **trocar em produção** |
| `PUPPETEER_EXECUTABLE_PATH` | — | Chromium externo (opcional; senão usa o baixado pelo puppeteer) |

> **Runtime:** o `puppeteer` precisa do Chromium. Em CI/deploy, rodar o download (`pnpm approve-builds`
> / `puppeteer browsers install chrome`) ou apontar `PUPPETEER_EXECUTABLE_PATH` para um Chromium do SO.

## On-the-fly

O PDF é sempre gerado na hora a partir dos dados persistidos (registro + espelho congelado). Não se
guarda o binário. O registro do documento (número, série, totais) é persistido; o layout é derivado.
