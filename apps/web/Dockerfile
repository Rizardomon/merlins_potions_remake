# Imagem do frontend (Next.js, output standalone).
# Contexto de build = RAIZ do monorepo:  docker build -f apps/web/Dockerfile .
#
# Todas as envs do web são server-side (não há NEXT_PUBLIC_*): entram no `docker run`,
# não no build. A MESMA imagem serve todos os ambientes.

# ---------- build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable

# O tsconfig.base.json é estendido pelos pacotes: sem ele o tsc cai no target padrão (ES5).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @merlins-potions-remake/web... --filter @merlins-potions-remake/shared

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
RUN pnpm --filter @merlins-potions-remake/shared build && pnpm --filter @merlins-potions-remake/web build

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

# O standalone já traz o server.js e só as dependências que o build rastreou.
COPY --from=build /repo/apps/web/.next/standalone/ ./
COPY --from=build /repo/apps/web/.next/static/ ./apps/web/.next/static/
COPY --from=build /repo/apps/web/public/ ./apps/web/public/

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
