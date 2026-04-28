FROM node:22-alpine AS builder

WORKDIR /app

COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/

RUN corepack enable && pnpm install --shamefully-hoist

COPY packages/shared/ packages/shared/
COPY packages/web/ packages/web/

WORKDIR /app/packages/web
RUN pnpm build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production

COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./.next/static
COPY --from=builder /app/packages/web/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "server.js"]
