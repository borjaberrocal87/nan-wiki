# 🎯 Docker Multi-Stage Build Pattern

## 💡 Convention

All services use multi-stage Docker builds with Alpine-based images to minimize final image size and reduce attack surface. Each Dockerfile follows a consistent two-stage pattern:

1. **Builder stage** — Installs dependencies, compiles/transpiles code, generates artifacts.
2. **Runtime stage** — Copies only the compiled output and production dependencies.

**Base images:**
- Node.js services (bot, web): `node:22-alpine`
- Python service (api): `python:3.12-slim`

**Rules:**
- Every Dockerfile must have at least two stages: `AS builder` and `AS runtime`.
- Runtime images must NOT contain build tools, dev dependencies, or source code (only compiled output).
- Use `.dockerignore` in each package to exclude `node_modules`, `.git`, `__pycache__`, and test files.
- Node services must use `corepack enable` before `pnpm install`.
- Set `NODE_ENV=production` in the runtime stage.
- Expose only the ports each service actually listens on.

## 🏆 Benefits

- Final images are typically 50-80MB smaller than single-stage builds.
- No build tools or dev dependencies leak into production, reducing vulnerabilities.
- Build cache is efficient — dependency layers are cached separately from source code.
- Consistent pattern across all services makes Dockerfiles easy to read and maintain.
- Smaller images mean faster pushes to GHCR and faster pulls on the server.

## 👀 Examples

### ✅ Good: Node.js multi-stage build

```dockerfile
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
```

### ✅ Good: Python multi-stage build

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir poetry==1.8.5

COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --only main --no-interaction --no-ansi

FROM python:3.12-slim AS runtime

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY src/ ./src/
COPY pyproject.toml ./

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### ❌ Bad: Single-stage build with dev dependencies

```dockerfile
FROM node:22

WORKDIR /app

COPY . .

RUN npm install          # Installs devDependencies too
RUN npm run build

CMD ["node", "dist/index.js"]
# No .dockerignore — node_modules, .git, tests all included in build context
```

## 🧐 Real world examples

- `packages/bot/Dockerfile` — Node.js multi-stage with Prisma generation
- `packages/api/Dockerfile` — Python multi-stage with Poetry
- `packages/web/Dockerfile` — Next.js multi-stage with standalone output
- `packages/bot/.dockerignore` — Excludes node_modules, .git, env files
- `packages/api/.dockerignore` — Excludes __pycache__, venv, test files
- `packages/web/.dockerignore` — Excludes node_modules, .next, .git

## 🔗 Related agreements

- [Monorepo structure convention](monorepo-structure.md)
- [Deployment flow](../AGENTS.md#deployment-flow)

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
