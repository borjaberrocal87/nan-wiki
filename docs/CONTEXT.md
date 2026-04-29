# Plan de Arquitectura — Link Library

## 1. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Bot Discord** | Node.js + `discord.js` v14 | Ecosistema maduro, manejo robusto de events/gateway, async/await nativo |
| **Backend API** | Python + FastAPI | Paralelismo natural con LLMs, tipado fuerte, async, documentación OpenAPI automática |
| **Frontend** | Next.js 15 (App Router) + TypeScript | SSR para SEO, routing file-based, ecosistema Vercel, TypeScript shared types con backend |
| **LLM** | OpenAI GPT-4o (o equivalente) | Tool calling fiable para extracción de metadata, bueno generando descripciones concisas |
| **Base de datos** | PostgreSQL + pgvector | Datos relacionales + embeddings semánticos para búsqueda en exploración |
| **Queue** | PostgreSQL (DB polling) | Cola de procesamiento asíncrono con `FOR UPDATE SKIP LOCKED` para evitar contention entre workers |
| **Auth** | Discord OAuth2 | El usuario ya usa Discord, OAuth es trivial y seguro |
| **Contenedores** | Docker + docker-compose | Entornos reproducibles, despliegue consistente dev/prod, orquestación local |
| **CI/CD** | GitHub Actions → GHCR | Build automático de imágenes, push a GHCR, deploy pull-only en el servidor |
| **Servidor** | VPS dedicado con Docker | Ejecuta `docker pull` desde GHCR y `docker compose up` — no build local |

**Por qué no todo en un solo framework:** El bot de Discord necesita un proceso separado (WebSocket persistente), y el backend API necesita paralelismo para llamadas LLM. Separar bot + API da resiliencia: si el LLM tarda, el bot sigue capturando links.

---

## 2. Diagrama de Arquitectura

```
                    ┌─────────────────────────────────────────┐
                    │           DISCORD GATEWAY               │
                    │         (WebSocket Bot Token)           │
                    └──────────────┬──────────────────────────┘
                                    │
                    ┌──────────────▼──────────────────────────┐
                    │                                           │
              ┌────┴────┐                              ┌───────┴───────┐
              │  BOT     │   HTTP POST /api/links       │   BACKEND    │
              │ Discord  │─────────────────────────────│   FastAPI    │
              │ (Node.js)│                              │  (Python)    │
              │  Docker  │                              │   Docker     │
              └──────────┘                              └───────┬───────┘
                                                                  │
                     ┌────────────────────────────────────────────┤
                     │                                            │
            ┌────────▼────────┐   ┌───────────────────────────────▼───────────┐
            │   PostgreSQL    │   │   OpenAI / LLM API                        │
            │  + pgvector     │   │   (descriptions + embeddings)             │
            │   Docker        │   └───────────────────────────────────────────┘
            └─────────────────┘
                                                                  │
                     ┌────────────────────────────────────────────┤
                     │                                            │
               ┌─────▼─────┐                              ┌───────▼────────┐
               │  SERVER    │◄──── HTTP / OAuth ────────►│  Frontend      │
               │  Docker    │                              │  (Next.js)     │
               │ compose up │                              │   Docker       │
               └────────────┘                              └────────────────┘
```

**Flujo de datos:**

1. Bot detecta link → guarda registro "pending" en DB
2. Worker consume links pending de DB con `FOR UPDATE SKIP LOCKED` → llama a LLM (descripción + tags + embedding) → actualiza registro
3. Frontend hace query → API responde desde PostgreSQL
4. Chatbot NL2SQL de 4 etapas: usuario pregunta → LLM #1 genera SQL → pglast valida → SQL se ejecuta READ ONLY → LLM #2 genera respuesta en lenguaje natural
5. Exploración: usuario busca → API usa búsqueda híbrida (keyword + pgvector) → devuelve links

**Estrategia de contenedización:**

- Cada servicio tiene su propio `Dockerfile` optimizado con multi-stage builds
- `docker-compose.yml` orquesta todos los servicios en local (bot, api, worker, pg)
- Production: GitHub Actions construye imágenes → push a GHCR → servidor hace `docker pull`
- Todos los servicios corren en el mismo servidor vía `docker compose up`
- `.dockerignore` en cada paquete para minimizar imagen
- Imágenes base: `node:22-alpine` (bot/web), `python:3.12-slim` (api)

---

## 3. Esquema de Base de Datos

```sql
-- Usuarios del servidor
CREATE TABLE users (
    id          BIGINT PRIMARY KEY,           -- Discord user ID
    username    VARCHAR(100) NOT NULL,
    avatar_url  TEXT,
    discriminator VARCHAR(4),                 -- legacy
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    is_admin    BOOLEAN DEFAULT FALSE
);

-- Canales monitoreados
CREATE TABLE channels (
    id          BIGINT PRIMARY KEY,           -- Discord channel ID
    name        VARCHAR(200) NOT NULL,
    guild_id    BIGINT NOT NULL,
    category    VARCHAR(200),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fuentes (tabla estática)
CREATE TABLE sources (
    id    VARCHAR(50) PRIMARY KEY,             -- github, twitter, youtube, etc.
    name  VARCHAR(100) NOT NULL                -- GitHub, Twitter, YouTube, etc.
);

INSERT INTO sources (id, name) VALUES
    ('github', 'GitHub'), ('twitter', 'Twitter'), ('youtube', 'YouTube'),
    ('twitch', 'Twitch'), ('linkedin', 'LinkedIn'), ('reddit', 'Reddit'),
    ('medium', 'Medium'), ('blog', 'Blog'), ('other', 'Link');

-- Links capturados
CREATE TABLE links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT NOT NULL UNIQUE,
    domain          VARCHAR(255) NOT NULL,      -- github.com, x.com, etc.
    source_id       VARCHAR(50) NOT NULL REFERENCES sources(id),
    author_id       BIGINT REFERENCES users(id),
    channel_id      BIGINT REFERENCES channels(id),
    discord_message_id BIGINT,
    discord_channel_name VARCHAR(200),
    posted_at       TIMESTAMPTZ NOT NULL,

    -- Campos generados por LLM
    llm_status      VARCHAR(20) DEFAULT 'pending',
    --   'pending' | 'processing' | 'done' | 'failed'
    title           VARCHAR(500),
    description     TEXT,
    source_detected VARCHAR(50),
    embedding       vector(4096),               -- embedding vector
    retry_count     INTEGER DEFAULT 0 NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (entidad separada)
CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk__tags__name__not_empty CHECK (length(name) > 0)
);

-- Junction table: link ↔ tag (many-to-many)
CREATE TABLE link_tags (
    link_id     UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT pk__link_tags PRIMARY KEY (link_id, tag_id),
    CONSTRAINT chk__link_tags__link_neq_tag CHECK (link_id != tag_id)
);
CREATE INDEX idx_link_tags_tag_id ON link_tags(tag_id);

-- Índices
CREATE INDEX idx_links_source ON links(source_id);
CREATE INDEX idx_links_posted_at ON links(posted_at DESC);
CREATE INDEX idx_links_domain ON links(domain);

-- Índice vectorial para búsqueda semántica
CREATE INDEX idx_links_embedding ON links USING ivfflat (embedding vector_cosine_ops);

-- Índice para filtrar solo links procesados
CREATE INDEX idx_links_llm_status ON links(llm_status);
```

---

## 4. Estructura de Carpetas (Monorepo)

```
link-library/
├── README.md
├── package.json                    # Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
│
├── packages/
│   ├── shared/                     # Tipos y utilidades compartidos
│   │   ├── package.json
│   │   └── src/
│   │       ├── types.ts            # Interfaces TS compartidas
│   │       ├── constants.ts        # Source mappings, patterns
│   │       └── utils.ts
│   │
│   ├── bot/                        # Bot de Discord
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── client.ts           # Discord client setup
│   │   │   ├── events/
│   │   │   │   ├── messageCreate.ts  # Detector de links
│   │   │   │   └── ready.ts          # Log + health check
│   │   │   ├── services/
│   │   │   │   ├── linkDetector.ts   # Regex + URL parsing
│   │   │   │   ├── sourceDetector.ts # Clasifica dominio → source
│   │   │   │   └── db.ts             # Prisma/PG client
│   │   │   └── utils/
│   │   │       └── http.ts           # POST al backend API
│   │   └── .env
│   │
│   ├── api/                        # Backend FastAPI
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   ├── src/
│   │   │   ├── main.py             # FastAPI app + middleware
│   │   │   ├── config.py           # Settings (pydantic-settings)
│   │   │   ├── database.py         # SQLAlchemy + async engine
│   │   │   ├── models.py           # SQLAlchemy ORM models
│   │   │   ├── schemas.py          # Pydantic schemas
│   │   │   ├── routers/
│   │   │   │   ├── auth.py         # Discord OAuth flow
│   │   │   │   ├── links.py        # CRUD + search + filters
│   │   │   │   ├── chat.py         # NL2SQL chatbot endpoint
│   │   │   │   └── admin.py        # Admin endpoints
│   │   │   ├── services/
│   │   │   │   ├── llm.py          # OpenAI client (desc + tags + embedding)
│   │   │   │   ├── search.py       # Búsqueda híbrida (keyword + vector)
│   │   │   │   ├── chatbot.py      # NL2SQL prompt builder + LLM caller
│   │   │   │   └── oauth.py        # Discord OAuth verification
│   │   │   ├── workers/
│   │   │   │   ├── queue.py        # DB polling worker (FOR UPDATE SKIP LOCKED)
│   │   │   │   └── process_link.py # LLM processing task
│   │   │   └── dependencies.py     # DB session, auth deps
│   │   └── tests/
│   │       ├── test_links.py
│   │       ├── test_chatbot.py     # NL2SQL prompt + LLM integration
│   │       └── test_oauth.py
│   │
│   └── web/                        # Frontend Next.js
│       ├── Dockerfile
│       ├── package.json
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx      # Root layout (dark theme base)
│       │   │   ├── page.tsx        # Landing / Explore
│       │   │   ├── login/
│       │   │   │   └── page.tsx    # Redirect to Discord OAuth
│       │   │   └── callback/
│       │   │       └── page.tsx    # OAuth callback handler
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── Footer.tsx
│       │   │   │   └── Sidebar.tsx
│       │   │   ├── links/
│       │   │   │   ├── LinkCard.tsx
│       │   │   │   ├── LinkGrid.tsx
│       │   │   │   ├── LinkFilters.tsx
│       │   │   │   └── SearchBar.tsx
│       │   │   ├── chat/
│       │   │   │   ├── ChatWindow.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   └── ChatInput.tsx
│       │   │   └── ui/             # Reusable primitives
│       │   │       ├── Button.tsx
│       │   │       ├── Badge.tsx
│       │   │       ├── Input.tsx
│       │   │       └── Modal.tsx
│       │   ├── lib/
│       │   │   ├── api.ts          # API client (fetch wrapper)
│       │   │   ├── auth.ts         # Session management
│       │   │   └── sources.ts      # Source icon/color mappings
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useLinks.ts
│       │   │   └── useChat.ts
│       │   └── styles/
│       │       └── globals.css     # Tailwind + custom dark theme
│       └── .env
│
└── infra/
    ├── docker-compose.yml          # Orquestación completa local (PG, API, Bot, Worker)
    ├── docker-compose.dev.yml      # Overrides para dev (hot-reload, debug)
    └── README.md                   # Deploy instructions
```

---

## 5. Hitos de Desarrollo

### Hito 1 — Foundation & Bot básico (~20h)

- Setup del monorepo (pnpm workspaces)
- Esquema DB + migraciones (Prisma o SQLAlchemy)
- Dockerfile para el bot (multi-stage, node:22-alpine)
- Bot que se conecta a Discord, detecta URLs con regex, las guarda en DB
- Source detection por dominio (regex de dominios conocidos)
- **Riesgo: bajo** — todo es bien conocido

### Hito 2 — Backend API + OAuth (~25h)

- FastAPI con endpoints CRUD de links
- Dockerfile para la API (multi-stage, python:3.12-slim)
- Discord OAuth2 flow (auth + session)
- Middleware de protección de rutas
- Dockerfile para el frontend Next.js
- Frontend base con Next.js + tema oscuro inspirado en nan.builders
- Página de login/callback
- **Riesgo: bajo-medium** — OAuth de Discord es trivial, pero el tema visual requiere precisión

### Hito 3 — LLM pipeline (~20h)

- Worker que consume links pendientes de DB con `FOR UPDATE SKIP LOCKED`
- Llama a LLM para: título, descripción, tags (3-5)
- Genera embedding con text-embedding-3-small
- Actualiza registro en DB
- Fallback: si el LLM falla, guardar al menos dominio + título del oEmbed
- **Riesgo: medio** — costos de API, timeouts, calidad de generation

### Hito 4 — Frontend de exploración (~30h)

- Página principal con grid de cards (look nan.builders: oscuro, minimal, tipografía limpia)
- Vista de tabla con columnas: ID, URL, Domain, Source, Author, Channel, Tags, Posted At
- Barra de búsqueda con filtros: fuente, tags, rango de fechas, canal
- Paginación / infinite scroll
- Cards con: fuente icon, título, descripción, tags, autor, fecha
- Tags clicables en la tabla como filtros individuales
- **Riesgo: medio** — replicar el diseño exacto de nan requiere pulido visual

### Hito 5 — Búsqueda semántica + NL2SQL Chat (~23h)

- Búsqueda híbrida: keyword (PostgreSQL full-text) + vector (pgvector cosine similarity)
- NL2SQL Chat: usuario pregunta → API inyecta schema SQL → LLM genera query SQL
- Componente de chat en frontend (estilo Discord/chat moderno)
- Output contract: respuestas en formato fenced SQL block
- **Riesgo: bajo-medium** — pgvector requiere tuning, la calidad del NL2SQL depende del prompt engineering con schema+ejemplos

### Hito 6 — Pulido, deploy & monitoring (~15h)

- Docker compose para dev local
- Deploy: GH Actions → GHCR → VPS con `docker compose up`
- Health check del bot (endpoint `/health`)
- Logs estructurados
- Variables de entorno por ambiente
- **Riesgo: bajo**
