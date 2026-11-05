# Imagem do backend (NestJS).
# Contexto de build = RAIZ do monorepo:  docker build -f apps/server/Dockerfile .
# (o `pnpm install` precisa do pnpm-workspace.yaml e do lockfile).

# ---------- build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable

# Manifests primeiro: o layer do install só invalida quando uma dependência muda,
# não a cada alteração de código.
# O tsconfig.base.json é estendido pelos pacotes: sem ele o tsc cai no target padrão (ES5).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile --filter @app/server... --filter @app/shared

COPY packages/shared/ ./packages/shared/
COPY apps/server/ ./apps/server/
RUN pnpm --filter @app/shared build && pnpm --filter @app/server build

# Sobra só o necessário p/ rodar (o shared entra como dependência do workspace).
RUN pnpm --filter @app/server --prod deploy --legacy /out

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/dist ./dist

USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
