FROM node:22-alpine AS builder

WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/bot/package.json packages/bot/

RUN corepack enable && pnpm install

COPY packages/shared/ packages/shared/
COPY packages/bot/ packages/bot/

WORKDIR /app/packages/bot
RUN mkdir -p src/shared && cp -r ../shared/src/* src/shared/
RUN npx prisma generate
RUN pnpm build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/packages/bot/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/bot/package.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
