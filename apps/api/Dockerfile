# EngineerDNA API (NestJS).
# Build context is the REPO ROOT so the shared workspace package is available:
#   docker build -f apps/api/Dockerfile -t engineerdna-api .
# (docker-compose handles this automatically.)

FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @engineerdna/shared build \
  && pnpm --filter @engineerdna/api build

FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
# Carry the built workspace (with resolved node_modules) intact.
COPY --from=build /repo ./
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
