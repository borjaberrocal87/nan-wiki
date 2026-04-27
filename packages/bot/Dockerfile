FROM node:22-alpine AS builder

WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/bot/package.json packages/bot/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY packages/bot/ packages/bot/

RUN cd packages/bot && pnpm build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/packages/bot/dist ./dist
COPY --from=builder /app/packages/bot/package.json ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

RUN corepack enable && pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
