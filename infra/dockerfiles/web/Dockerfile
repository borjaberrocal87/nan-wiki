FROM node:22-alpine AS builder

WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY packages/web/ packages/web/

WORKDIR /app/packages/web
RUN pnpm build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/packages/web/.next ./packages/web/.next
COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder /app/packages/web/package.json ./packages/web/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

RUN corepack enable && pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "packages/web/node_modules/.bin/next", "start", "-p", "3000"]
