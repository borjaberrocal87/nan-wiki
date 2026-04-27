# Monorepo Structure

## 💡 Convention

This project uses a pnpm monorepo with workspaces. The codebase is organized into four packages under `packages/`, each containing a single service or shared utilities. Every package has its own `package.json`, `Dockerfile`, and `src/` directory.

```
link-library/
├── package.json                    # Workspace root
├── pnpm-workspace.yaml             # Workspace definition
├── .gitignore
├── .env.example
│
├── packages/
│   ├── shared/                     # Shared types and utilities
│   │   ├── package.json
│   │   └── src/
│   │       ├── types.ts            # TypeScript interfaces shared across services
│   │       ├── constants.ts        # Domain constants (source mappings, patterns)
│   │       └── utils.ts            # Pure utility functions
│   │
│   ├── bot/                        # Discord bot service (Node.js + discord.js)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Prisma schema for bot-side DB access
│   │   └── src/
│   │       ├── index.ts            # Entry point
│   │       ├── client.ts           # Discord client setup
│   │       ├── events/             # Discord event handlers
│   │       ├── services/           # Business logic (link detection, source detection)
│   │       └── utils/              # Utility functions (HTTP, parsing)
│   │
│   ├── api/                        # Backend API service (Python + FastAPI)
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   ├── src/
│   │   │   ├── main.py             # FastAPI app + middleware
│   │   │   ├── config.py           # Settings (pydantic-settings)
│   │   │   ├── database.py         # SQLAlchemy engine + session
│   │   │   ├── models.py           # SQLAlchemy ORM models
│   │   │   ├── schemas.py          # Pydantic request/response schemas
│   │   │   ├── routers/            # API route handlers
│   │   │   ├── services/           # Business logic (LLM, search, chatbot, OAuth)
│   │   │   ├── workers/            # Background workers (Redis queue consumer)
│   │   │   └── dependencies.py     # DI dependencies (DB session, auth)
│   │   └── tests/                  # API tests
│   │
│   └── web/                        # Frontend service (Next.js 15 + TypeScript)
│       ├── Dockerfile
│       ├── package.json
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       └── src/
│           ├── app/                # Next.js App Router pages
│           ├── components/         # React components (layout, links, chat, ui)
│           ├── lib/                # Client libraries (API client, auth, sources)
│           ├── hooks/              # Custom React hooks (useAuth, useLinks, useChat)
│           └── styles/             # Global styles (Tailwind + custom CSS)
│
└── infra/
    ├── docker-compose.yml          # Full local orchestration (PG, Redis, API, Bot, Worker, Web)
    ├── docker-compose.dev.yml      # Dev overrides (hot-reload, debug ports)
    └── README.md                   # Deploy instructions
```

**Package boundaries:**

- `packages/shared` — pure TypeScript, no service dependencies, no runtime framework imports
- `packages/bot` — only depends on `packages/shared`, has its own Prisma schema
- `packages/api` — independent Python package, owns all business logic and database models
- `packages/web` — only depends on `packages/shared`, communicates with API via HTTP

**Import rules:**

- `bot` can import from `shared`
- `web` can import from `shared`
- `api` does NOT import from `shared` (Python types live in Pydantic schemas)
- No cross-imports between `bot`, `api`, and `web` — they communicate via HTTP and Redis

## 🏆 Benefits

- **Isolation**: each service can be built, tested, and deployed independently
- **Clear boundaries**: import rules prevent tight coupling between services
- **Shared types**: `packages/shared` ensures type safety across bot and web without duplication
- **Docker-native**: each package has its own `Dockerfile`, enabling independent image builds for GHCR
- **Parallel development**: multiple developers can work on different packages without conflicts

## 👀 Examples

### ✅ Good: Package with proper boundaries

```
packages/shared/src/types.ts          # Shared interface
packages/bot/src/services/linkDetector.ts  # Bot logic, imports shared types
packages/api/src/routers/links.py     # API logic, owns its own schemas
packages/web/src/components/links/LinkCard.tsx  # UI component, imports shared types
```

### ❌ Bad: Cross-package imports

```typescript
// ❌ bot/src/services/apiCaller.ts — importing from api package
import { LinkService } from '../../api/src/services/linkService';
```

```typescript
// ❌ web/src/lib/llm.ts — importing business logic from api package
import { generateEmbedding } from '../../api/src/services/llm';
```

## 🧐 Real world examples

- [Monorepo workspace root](../package.json)
- [Workspace definition](../pnpm-workspace.yaml)
- [Shared types](../packages/shared/src/types.ts)
- [Bot entry point](../packages/bot/src/index.ts)
- [API main app](../packages/api/src/main.py)
- [Web app layout](../packages/web/src/app/layout.tsx)
- [Infra docker-compose](../infra/docker-compose.yml)

## 🔗 Related agreements

- [Architecture overview](CONTEXT.md)
- [Deployment flow (GHCR pull-only)](../AGENTS.md)
- [Docker multi-stage builds per package](CONTEXT.md)

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
