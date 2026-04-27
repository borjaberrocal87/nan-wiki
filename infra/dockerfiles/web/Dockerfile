FROM node:22-alpine AS builder

WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/

RUN corepack enable && pnpm install

COPY packages/shared/ packages/shared/
COPY packages/web/ packages/web/

WORKDIR /app/packages/web
RUN pnpm build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production

COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./.next/static
COPY --from=builder /app/packages/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
