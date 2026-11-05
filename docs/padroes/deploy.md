# Deploy (Docker + Nginx)

Dois containers (web + server) atrás de um **proxy reverso** (Nginx). O Postgres, quando
o projeto tiver banco, é externo à stack — o app apenas aponta a `DATABASE_URL` para ele.

## Arquivos

```
apps/server/Dockerfile          # Nest, build multi-stage + `pnpm --prod deploy`
apps/web/Dockerfile             # Next em output: "standalone"
.dockerignore
deploy/docker-compose.yml       # web + server (Postgres externo)
deploy/app.env.example          # -> deploy/app.env (NÃO versionado)
deploy/nginx.conf.example       # server blocks do proxy do host
```

## Regras que não podem ser quebradas

1. **Contexto de build = raiz do monorepo.** Os Dockerfiles vivem em `apps/*`, mas o
   build roda da raiz: o `pnpm install` precisa do `pnpm-workspace.yaml`, do lockfile e do
   `tsconfig.base.json` (sem ele o `tsc` cai no target padrão, ES5).
2. **O browser nunca fala com a API.** No compose, o web alcança o server pela rede
   interna (`API_URL=http://server:3001/api`). Publicar a API no proxy só é necessário se
   algo **fora** da stack precisar consumi-la.
3. **`BIND_ADDR` importa.** Use `127.0.0.1` quando o proxy roda na mesma máquina. Se o
   proxy estiver em outra e você publicar num IP da LAN, o firewall precisa liberar as
   portas **apenas para o IP do proxy** — senão qualquer um na rede chama os containers
   direto e contorna o proxy.
4. **Segredos por ambiente**, nunca versionados. `deploy/*.env` está no `.gitignore`;
   versione apenas o `.example`. Gere valores com `openssl rand -hex 32`.
5. **`X-Forwarded-Proto` no proxy.** O `main.ts` liga `trust proxy`; sem esse header o
   Express trata a requisição como http e monta URLs absolutas erradas.
6. **Migrations aplicadas antes do server subir.** Quando o projeto tiver banco,
   descomente o serviço `migrate` do compose: ele roda o runner e sai, e o `server`
   depende de `service_completed_successfully`. Ver [migrations.md](migrations.md).

## Build e subida

```bash
# na máquina de deploy, na raiz do repo
cp deploy/app.env.example deploy/app.env   # preencher domínios e segredos
docker compose --env-file deploy/app.env -f deploy/docker-compose.yml up -d --build
docker compose --env-file deploy/app.env -f deploy/docker-compose.yml logs -f server
```

Proxy: copiar os server blocks de `deploy/nginx.conf.example`, ajustar domínios e
certificados, `nginx -t && systemctl reload nginx`.

## Checklist de release

- [ ] `pnpm build` e `pnpm typecheck` passam localmente.
- [ ] Envs novas adicionadas ao `deploy/app.env.example` **e** ao schema Zod em
      `apps/server/src/conf/configuration.ts` (o boot precisa falhar se faltar).
- [ ] Migration gerada e commitada, se houve mudança de schema.
- [ ] `docker compose ... up -d --build` sem erro; `GET /api/health` responde `{"status":"ok"}`.
- [ ] Frontend abre e o menu carrega (indica que o BFF alcança a API).
