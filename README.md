# Link Library

Monorepo for a Discord-powered link curation platform. The bot detects links shared in Discord channels, classifies them by source, and stores them in a PostgreSQL database. An API processes them with LLMs for descriptions and semantic search, and a Next.js frontend provides exploration and chat.

## Stack

| Layer | Tech |
|---|---|
| Bot | Node.js + discord.js v14 |
| API | Python + FastAPI |
| Frontend | Next.js 15 (App Router) |
| Database | PostgreSQL + pgvector |
| Cache/Queue | Redis |
| LLM | OpenAI |
| Deploy | Docker + GitHub Actions → GHCR |

## Prerequisites

- **Docker** + **Docker Compose** (v2)
- **Node.js** >= 22
- **pnpm** (`corepack enable`)
- A [Discord Bot](https://discord.com/developers/applications) with **MESSAGE CONTENT INTENT** and **MEMBERS INTENT** enabled

## Quick Start

```bash
# 1. Clone
git clone <repo-url> && cd wiki-nan

# 2. Environment
cp .env.example .env
# Edit .env — fill in DISCORD_TOKEN, DISCORD_GUILD_ID, OPENAI_API_KEY, etc.

# 3. Start everything
docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up --build

# Services:
#   Bot     → ll-bot      (Discord)
#   API     → ll-api      → http://localhost:8000
#   Web     → ll-web      → http://localhost:3000
#   Worker  → ll-worker   (LLM processing)
#   Postgres→ ll-postgres (port 5432)
```

## Development

```bash
# Hot-reload mode (dev compose overrides)
pnpm dev

# Lint fix
pnpm lint:fix

# Tests
pnpm test
```

## Database

```bash
# Apply Prisma migrations (bot)
docker compose -f infra/docker-compose.yml exec bot npx prisma db push

# Apply Alembic migrations (API)
docker compose -f infra/docker-compose.yml exec api alembic upgrade head

# Reset database
docker compose down -v && docker compose up -d postgres
```

## Services

| Service | URL | Description |
|---|---|---|
| Bot | Discord | Detects links in Discord messages |
| API | http://localhost:8000 | REST API + OAuth + chatbot |
| API Docs | http://localhost:8000/docs | OpenAPI/Swagger UI |
| Web | http://localhost:3000 | Next.js frontend |

## Project Structure

```
├── packages/
│   ├── shared/     # Shared types & utilities
│   ├── bot/        # Discord bot (Node.js)
│   ├── api/        # FastAPI backend (Python)
│   └── web/        # Next.js frontend
├── infra/
│   ├── docker-compose.yml          # Production compose
│   ├── docker-compose.dev.yml      # Dev overrides (hot-reload)
│   └── dockerfiles/                # Per-service Dockerfiles
├── databases/
│   └── init.sql                    # Canonical DB schema
└── docs/                           # Architecture docs
```

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_GUILD_ID` | Server ID where the bot operates |
| `OPENAI_API_KEY` | OpenAI API key for LLM processing |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT session tokens |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | OAuth2 credentials |

## Deployment

Images are built in GitHub Actions and pushed to GHCR. The server only runs `docker pull`:

```bash
# On the server
git pull origin main
docker compose pull
docker compose up -d
```

## License

Private
