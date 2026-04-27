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
- [ ] `package.json` en raíz con `pnpm workspaces`
- [ ] `pnpm-workspace.yaml` con `packages/*`
- [ ] Carpetas `packages/bot`, `packages/api`, `packages/web`, `packages/shared` creadas
- [ ] `packages/shared` con tipos TypeScript compartidos
- [ ] `pnpm install` funciona desde la raíz
- [ ] `.gitignore` configurado (node_modules, .env, .next, etc.)

**Tareas:**
- [ ] Inicializar monorepo con pnpm
- [ ] Crear estructura de carpetas
- [ ] Configurar `packages/shared/src/types.ts` con interfaces base
- [ ] Configurar `.gitignore` y `.editorconfig`

**Estimación:** 3h

---

### HU-1.2 — Infraestructura Docker local

**Como** desarrollador, quiero ejecutar toda la infraestructura local con docker-compose para tener un entorno de desarrollo consistente y reproducible.

**Criterios de aceptación:**
- [ ] `infra/docker-compose.yml` con servicios: postgres, redis
- [ ] `infra/docker-compose.dev.yml` con overrides para dev (hot-reload, puertos expuestos)
- [ ] `docker compose up` levanta PG + Redis correctamente
- [ ] PG con extensión pgvector habilitada
- [ ] Variables de entorno en `.env.example`
- [ ] `docker compose down` limpia contenedores y volúmenes

**Tareas:**
- [ ] Crear `infra/docker-compose.yml`
- [ ] Crear `infra/docker-compose.dev.yml`
- [ ] Crear `.env.example` con todas las vars necesarias
- [ ] Configurar PG con extensión pgvector
- [ ] Probar que todo levanta con `docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up`

**Estimación:** 4h

---

### HU-1.3 — Esquema de base de datos y migraciones

**Como** desarrollador, quiero las tablas de la BD definidas y migradas para poder empezar a almacenar datos.

**Criterios de aceptación:**
- [ ] Tabla `users` con campos: id (BIGINT PK), username, avatar_url, discriminator, joined_at, is_admin
- [ ] Tabla `channels` con campos: id (BIGINT PK), name, guild_id, category, created_at
- [ ] Tabla `links` con campos: id (UUID), url (UNIQUE), domain, source, raw_content, author_id (FK), channel_id (FK), discord_message_id, discord_channel_name, posted_at, llm_status, title, description, tags, source_detected, embedding (vector(1536)), created_at, updated_at
- [ ] Tablas `chat_conversations` y `chat_messages`
- [ ] Índices: source, tags (GIN), posted_at DESC, domain, embedding (ivfflat)
- [ ] Migraciones funcionando con SQLAlchemy/alembic (api) y Prisma (bot)
- [ ] `docker compose exec api alembic upgrade head` aplica migraciones

**Tareas:**
- [ ] Configurar SQLAlchemy en `packages/api/src/database.py`
- [ ] Definir modelos ORM en `packages/api/src/models.py`
- [ ] Crear migraciones iniciales con alembic
- [ ] Configurar Prisma client en `packages/bot/src/services/db.ts`
- [ ] Definir esquema Prisma en `packages/bot/prisma/schema.prisma`
- [ ] Probar migración local

**Estimación:** 5h

---

### HU-1.4 — Bot de Discord: conexión y detección de URLs

**Como** sistema, quiero conectarme al gateway de Discord y detectar URLs en los mensajes para capturar todos los links compartidos.

**Criterios de acceptance:**
- [ ] Bot se conecta al Discord Gateway con token de bot
- [ ] Evento `messageCreate` escuchado
- [ ] Regex que detecta URLs válidas (http/https, www.)
- [ ] URLs duplicadas no se procesan (check por URL única en DB)
- [ ] URL detectada se guarda en tabla `links` con estado `pending`
- [ ] Se captura: autor, canal, mensaje raw, timestamp, URL, dominio
- [ ] El bot responde al mensaje con un embed de "link capturado ✓"
- [ ] Bot loguea eventos en consola

**Tareas:**
- [ ] Configurar discord.js client en `packages/bot/src/client.ts`
- [ ] Implementar evento `messageCreate` en `packages/bot/src/events/messageCreate.ts`
- [ ] Implementar regex detector de URLs en `packages/bot/src/services/linkDetector.ts`
- [ ] Implementar guardado a DB desde el bot (prisma.create)
- [ ] Implementar respuesta con embed en Discord
- [ ] Crear `packages/bot/Dockerfile` (multi-stage, node:22-alpine)
- [ ] Añadir servicio bot al docker-compose.yml
- [ ] Configurar `packages/bot/.env` con DISCORD_TOKEN y DISCORD_GUILD_ID

**Estimación:** 8h

---

### HU-1.5 — Detección de fuente por dominio

**Como** sistema, quiero clasificar cada URL por su fuente (GitHub, X, YouTube, blog, etc.) para poder filtrar y mostrar iconos apropiados en el frontend.

**Criterios de aceptación:**
- [ ] Mapeo dominio → source en `packages/shared/src/constants.ts`
- [ ] Dominios conocidos: github.com, x.com, twitter.com, linkedin.com, youtube.com, youtu.be, twitch.tv, reddit.com, medium.com, blogs personales (*), etc.
- [ ] Fuente por defecto: "other" para dominios no reconocidos
- [ ] La fuente se guarda en `links.source` al crear el registro
- [ ] Función `detectSource(domain)` devuelve string coherente
- [ ] Lista de dominios configurables vía archivo

**Tareas:**
- [ ] Crear `packages/shared/src/constants.ts` con mapeo de dominios
- [ ] Crear función `detectSource(domain)` en `packages/shared/src/utils.ts`
- [ ] Usar la función en `packages/bot/src/services/linkDetector.ts`
- [ ] Actualizar `packages/bot/src/services/db.ts` para guardar source
- [ ] Añadir tests unitarios de la función detectSource

**Estimación:** 3h

---

## Dependencias entre historias

```
HU-1.1 (Monorepo) ──┐
HU-1.2 (Docker)  ───┤──→ HU-1.3 (DB Schema) ──→ HU-1.4 (Bot) ──→ HU-1.5 (Source)
HU-1.1 (Monorepo) ──┘
```

## Aceptación de la Epic

- [ ] Monorepo funcional con `pnpm install`
- [ ] Docker compose levanta PG + Redis + Bot
- [ ] Bot se conecta a Discord y muestra "online" en consola
- [ ] Compartir un link en Discord lo guarda en la BD con estado `pending`
- [ ] La fuente se detecta correctamente para dominios conocidos
- [ ] URLs duplicadas se ignoran
- [ ] Todo el código está en el monorepo con estructura definida
