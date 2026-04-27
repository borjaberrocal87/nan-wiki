# Epic: Foundation & Bot Básico

## Resumen

Configurar el monorepo, base de datos, infraestructura Docker y el bot de Discord que detecta y captura links compartidos en los canales del servidor.

**Estimación:** ~20h
**Riesgo:** Bajo
**Dependencias:** Ninguna

---

## Historias de Usuario

### HU-1.1 — Monorepo con pnpm workspaces

**Como** desarrollador, quiero un monorepo configurado con pnpm workspaces para poder desarrollar los 3 servicios (bot, API, web) de forma independiente pero coordinada.

**Criterios de aceptación:**
- [x] `package.json` en raíz con `pnpm workspaces`
- [x] `pnpm-workspace.yaml` con `packages/*`
- [x] Carpetas `packages/bot`, `packages/api`, `packages/web`, `packages/shared` creadas
- [x] `packages/shared` con tipos TypeScript compartidos
- [x] `pnpm install` funciona desde la raíz
- [x] `.gitignore` configurado (node_modules, .env, .next, etc.)

**Tareas:**
- [x] Inicializar monorepo con pnpm
- [x] Crear estructura de carpetas
- [x] Configurar `packages/shared/src/types.ts` con interfaces base
- [x] Configurar `.gitignore` y `.editorconfig`

**Estimación:** 3h

---

### HU-1.2 — Infraestructura Docker local

**Como** desarrollador, quiero ejecutar toda la infraestructura local con docker-compose para tener un entorno de desarrollo consistente y reproducible.

**Criterios de aceptación:**
- [x] `infra/docker-compose.yml` con servicios: postgres, redis, api, bot, worker, web
- [x] `infra/docker-compose.dev.yml` con overrides para dev (hot-reload, puertos expuestos)
- [x] `docker compose up` levanta PG + Redis correctamente
- [x] PG con extensión pgvector habilitada
- [x] Variables de entorno en `.env.example`
- [x] `docker compose down` limpia contenedores y volúmenes

**Tareas:**
- [x] Crear `infra/docker-compose.yml`
- [x] Crear `infra/docker-compose.dev.yml`
- [x] Crear `.env.example` con todas las vars necesarias
- [x] Configurar PG con extensión pgvector
- [x] Probar que todo levanta con `docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up`

**Tareas adicionales (post-implementación):**
- [x] Crear Dockerfiles separados en `infra/dockerfiles/` con contexto raíz (`..`)
- [x] Crear `Dockerfile.dev` para bot, web y api (hot-reload sin conflictos de volumen)
- [x] Mover `databases/init.sql` a `infra/docker-entrypoint-initdb.d/` vía volume mount
- [x] API Dockerfile: usar `pip install` (pyproject.toml con `[project]`, no Poetry)
- [x] Web Dockerfile: usar Next.js standalone output (`output: "standalone"`)
- [x] Bot Dockerfile: copiar shared package inline (no workspace resolution en Docker)

**Estimación:** 4h

---

### HU-1.3 — Esquema de base de datos y migraciones

**Como** desarrollador, quiero las tablas de la BD definidas y migradas para poder empezar a almacenar datos.

**Criterios de aceptación:**
- [x] Tabla `users` con campos: id (BIGINT PK), username, avatar_url, discriminator, joined_at (DEFAULT now()), is_admin
- [x] Tabla `channels` con campos: id (BIGINT PK), name, guild_id, category, created_at
- [x] Tabla `links` con campos: id (UUID), url (UNIQUE), domain, source, raw_content, author_id (FK), channel_id (FK), discord_message_id, discord_channel_name, posted_at, llm_status, title, description, tags, source_detected, embedding (vector(1536)), created_at, updated_at
- [x] Tablas `chat_conversations` y `chat_messages`
- [x] Índices: source, tags (GIN), posted_at DESC, domain, embedding (ivfflat)
- [x] Migraciones funcionando con SQLAlchemy/alembic (api) y Prisma (bot)
- [x] `docker compose exec api alembic upgrade head` aplica migraciones

**Tareas:**
- [x] Configurar SQLAlchemy en `packages/api/src/database.py`
- [x] Definir modelos ORM en `packages/api/src/models.py`
- [x] Crear migraciones iniciales con alembic
- [x] Configurar Prisma client en `packages/bot/src/services/db.ts`
- [x] Definir esquema Prisma en `packages/bot/prisma/schema.prisma`
- [x] Probar migración local con `prisma db push`

**Tareas adicionales (post-implementación):**
- [x] Crear `databases/init.sql` como definición canónica de la BD
- [x] Quitar campo `embedding` del schema Prisma (Prisma no soporta pgvector, solo la API lo usa)
- [x] Fijar `joinedAt` como `DateTime @default(now())` en Prisma (coincidir con DB NOT NULL + DEFAULT)
- [x] API models: quitar índice GIN de tags (tags es `TEXT[]`, no necesita índice GIN específico)

**Estimación:** 5h

---

### HU-1.4 — Bot de Discord: conexión y detección de URLs

**Como** sistema, quiero conectarme al gateway de Discord y detectar URLs en los mensajes para capturar todos los links compartidos.

**Criterios de aceptación:**
- [x] Bot se conecta al Discord Gateway con token de bot
- [x] Evento `messageCreate` escuchado
- [x] Regex que detecta URLs válidas (http/https, www.)
- [x] URLs duplicadas no se procesan (check por URL única en DB)
- [x] URL detectada se guarda en tabla `links` con estado `pending`
- [x] Se captura: autor, canal, mensaje raw, timestamp, URL, dominio
- [x] El bot responde al mensaje con un embed de "link capturado ✓"
- [x] Bot loguea eventos en consola

**Tareas:**
- [x] Configurar discord.js client en `packages/bot/src/client.ts`
- [x] Implementar evento `messageCreate` en `packages/bot/src/events/messageCreate.ts`
- [x] Implementar regex detector de URLs en `packages/bot/src/services/linkDetector.ts`
- [x] Implementar guardado a DB desde el bot (prisma.create)
- [x] Implementar respuesta con embed en Discord
- [x] Crear `packages/bot/Dockerfile` (multi-stage, node:22-alpine)
- [x] Añadir servicio bot al docker-compose.yml
- [x] Configurar `packages/bot/.env` con DISCORD_TOKEN y DISCORD_GUILD_ID

**Tareas adicionales (post-implementación):**
- [x] `ensureUser()`: upsert del usuario antes de guardar link (evita FK violation en `links_author_id`)
- [x] `ensureChannel()`: upsert del canal antes de guardar link (evita FK violation en `links_channel_id`)
- [x] Error handling: si ensureUser/ensureChannel fallan, el link se guarda sin la FK correspondiente
- [x] Rate limiting: máximo 10 URLs por mensaje, 5 mensajes por minuto por usuario
- [x] Sync de canales al arrancar: escanea todos los canales de texto del guild y los crea/actualiza en DB
- [x] Fix Discord.js: cambiar `ready` → `clientReady` (deprecation warning)
- [x] `linkDetector.ts`: importar desde ruta relativa (`../shared/utils.js`) en vez de `@link-library/shared` (tsx no resuelve workspace packages)

**Estimación:** 8h

---

### HU-1.5 — Detección de fuente por dominio

**Como** sistema, quiero clasificar cada URL por su fuente (GitHub, X, YouTube, blog, etc.) para poder filtrar y mostrar iconos apropiados en el frontend.

**Criterios de aceptación:**
- [x] Mapeo dominio → source en `packages/shared/src/constants.ts`
- [x] Dominios conocidos: github.com, x.com, twitter.com, linkedin.com, youtube.com, youtu.be, twitch.tv, reddit.com, medium.com, blogs personales (*), etc.
- [x] Fuente por defecto: "other" para dominios no reconocidos
- [x] La fuente se guarda en `links.source` al crear el registro
- [x] Función `detectSource(domain)` devuelve string coherente
- [x] Lista de dominios configurables vía archivo

**Tareas:**
- [x] Crear `packages/shared/src/constants.ts` con mapeo de dominios
- [x] Crear función `detectSource(domain)` en `packages/shared/src/utils.ts`
- [x] Usar la función en `packages/bot/src/services/linkDetector.ts`
- [x] Actualizar `packages/bot/src/services/db.ts` para guardar source
- [x] Añadir tests unitarios de la función detectSource

**Estimación:** 3h

---

## Dependencias entre historias

```
HU-1.1 (Monorepo) ──┐
HU-1.2 (Docker)  ───┤──→ HU-1.3 (DB Schema) ──→ HU-1.4 (Bot) ──→ HU-1.5 (Source)
HU-1.1 (Monorepo) ──┘
```

## Aceptación de la Epic

- [x] Monorepo funcional con `pnpm install`
- [x] Docker compose levanta PG + Redis + Bot + API + Worker + Web
- [x] Bot se conecta a Discord y muestra "online" en consola
- [x] Compartir un link en Discord lo guarda en la BD con estado `pending`
- [x] La fuente se detecta correctamente para dominios conocidos
- [x] URLs duplicadas se ignoran
- [x] Todo el código está en el monorepo con estructura definida
- [x] Bot sincroniza canales del guild al arrancar
- [x] Rate limiting activo (10 URLs/mensaje, 5 mensajes/min/usuario)
- [x] Error handling graceful para FK violations
