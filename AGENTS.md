# Idioma

Todo el código debe escribirse en inglés aunque la conversación sea en español.

---

# Useful commands

```bash
docker compose up --build          # build and start all services (PG, Redis, API, Bot, Worker)
docker compose up -d               # detached mode
docker compose down -v             # stop and remove containers + volumes
docker compose logs -f api         # follow API logs
docker compose logs -f bot         # follow Bot logs

pnpm dev                           # dev mode with hot-reload via docker-compose.dev.yml
pnpm lint:fix                      # lint all packages
pnpm test                          # run tests across all packages
```

---

# Deployment Flow

**CRITICAL**: Docker images are built in GitHub Actions and pushed to GHCR. The server only runs `docker pull`.

1. **Edit code** locally
2. **Test locally**: `docker compose up --build` — verify all services start
3. **Push to repo**: `git push origin main`
4. **Monitor GitHub Actions** — the workflow builds images, pushes to GHCR, and deploys to the server
5. **Validate on server**: `docker ps` and `docker compose logs`

---

# Architecture

- Monorepo with pnpm workspaces.
- Three services: `packages/bot` (Discord bot, Node.js), `packages/api` (FastAPI backend, Python), `packages/web` (Next.js frontend).
- Next.js 15, Onion Architecture, DDD.
- All services are Dockerized with multi-stage builds.
- GitHub Actions builds images → pushes to GHCR → server runs `docker pull`.
- `infra/docker-compose.yml` orchestrates local development.
- Paths:
  - Bot: `packages/bot/src/`
  - API routes: `packages/api/src/`
  - Web: `packages/web/src/`
  - Shared types: `packages/shared/src/`

---

# Documentation

- Detailed conventions with examples live in `docs/`.
- When working on a task, use this map to find and read **only** the docs relevant to your task:

```
docs/
├── CONTEXT.md                    # Full project architecture plan (stack, DB schema, milestones)
├── code-style.md
├── documentation-format.md
├── monorepo-structure.md
├── backend/
│   ├── api-routes-reflect-metadata.md
│   ├── bot-event-handling.md
│   ├── dependency-injection-diod.md
│   ├── docker-multi-stage-builds.md
│   ├── hexagonal-architecture.md
│   ├── prisma-alembic-coexistence.md
│   └── thin-api-routes.md
├── database/
│   ├── creating-new-tables.md
│   ├── not-null-fields.md
│   ├── table-naming-singular-plural-convention.md
│   └── text-over-varchar-char-convention.md
├── frontend/
│   ├── design-tokens-css.md
│   ├── env-urls-oauth.md
│   ├── material-symbols-fontface.md
│   ├── reusable-component-classes.md
│   └── tailwind-v3-setup.md
├── epics/
│   ├── 001-foundation-bot.md
│   ├── 002-backend-api-oauth.md
│   ├── 003-llm-pipeline.md
│   ├── 004-frontend-exploracion.md
│   ├── 005-busqueda-chatbot.md
│   └── 006-pulido-deploy.md
└── testing/
    ├── conventions.md              # Testing conventions (vi.mock, MagicMock, pure function tests)
    ├── mock-objects.md
    └── object-mothers.md
```

---

# Bot Configuration

## Discord Intents

**CRITICAL**: In the [Discord Developer Portal](https://discord.com/developers/applications) for the bot application, enable:

- [x] MESSAGE CONTENT INTENT
- [x] MEMBERS INTENT

Without these intents, the bot cannot connect (`PrivilegedIntentsRequired`).

## Environment Variables

```env
DISCORD_TOKEN=                    # Bot token
DISCORD_GUILD_ID=                 # Server ID of Discord
LLM_BASE_URL=                     # LLM provider base URL
LLM_MODEL=                        # Chat model name
EMBEDDING_MODEL=                  # Embedding model name
LLM_API_KEY=                      # LLM provider API key
JWT_SECRET=                       # Secret for JWT session tokens
DATABASE_URL=                     # PostgreSQL connection string
WORKER_CONCURRENCY=               # Number of concurrent workers
WORKER_POLL_INTERVAL=             # Polling interval in seconds
MAX_RETRIES=                      # Max retry attempts for failed links
FRONTEND_URL=                     # Frontend base URL
```

---

# Security

- **NEVER** commit `.env` files or tokens
- `.env` is in `.gitignore`
- Secrets go in GitHub repository settings and on the server
- API keys only in environment variables on the server

---

# Commit & Push Policy

- **Commit after every completed task.** Never accumulate changes across tasks.
- **Push after every commit.** Use `git push` immediately — do not wait.
- Commit messages should be concise and task-focused: `feat(bot): add URL regex detector`, `feat(api): add Discord OAuth router`, etc.
- Follow conventional commits format: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
