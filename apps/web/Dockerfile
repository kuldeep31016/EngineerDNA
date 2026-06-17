# EngineerDNA Web (Next.js).
# Build context is the REPO ROOT (shared workspace package):
#   docker build -f apps/web/Dockerfile -t engineerdna-web .

FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @engineerdna/shared build \
  && pnpm --filter @engineerdna/web build

FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo ./
EXPOSE 3000
WORKDIR /repo/apps/web
CMD ["pnpm", "start"]
