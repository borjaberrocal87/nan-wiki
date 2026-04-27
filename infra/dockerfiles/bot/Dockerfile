FROM node:22-alpine AS builder

WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/bot/package.json packages/bot/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY packages/bot/ packages/bot/

WORKDIR /app/packages/bot
RUN npx prisma generate
RUN pnpm build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/packages/bot/dist ./dist
COPY --from=builder /app/packages/bot/node_modules ./node_modules
COPY --from=builder /app/packages/bot/package.json ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
