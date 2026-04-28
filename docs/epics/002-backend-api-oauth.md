# Epic: Backend API + OAuth

## Resumen

Construir el backend FastAPI con endpoints CRUD de links, el flujo de autenticación con Discord OAuth2 y la base del frontend Next.js con tema oscuro inspirado en nan.builders.

**Estimación:** ~25h
**Estado:** ✅ Completada
**Riesgo:** Bajo-Medio
**Dependencias:** Epic 001 (DB schema, bot básico)

---

## Historias de Usuario

### HU-2.1 — Backend FastAPI: estructura y endpoints CRUD

**Como** frontend, quiero una API REST con endpoints para listar, buscar y filtrar links para poder consumirlos desde el frontend.

**Criterios de aceptación:**
- [x] FastAPI app en `packages/api/src/main.py` con CORS habilitado
- [x] Endpoint `GET /api/links` con paginación (offset/limit)
- [x] Endpoint `GET /api/links/{id}` para obtener un link individual
- [x] Endpoint `GET /api/links/sources` para listar fuentes disponibles
- [x] Filtros query params: `source_id`, `tags`, `domain`, `channel`, `author_id`, `date_from`, `date_to`
- [x] Ordenación: `sort=posted_at|title` y `order=asc|desc`
- [x] Respuestas paginadas: `{ data: [], total: N, page: N, per_page: N }`
- [x] Pydantic schemas para request/response en `packages/api/src/schemas.py`
- [x] SQLAlchemy CRUD en `packages/api/src/services/`

**Tareas:**
- [x] Configurar FastAPI app con middleware (CORS, logging)
- [x] Configurar `packages/api/src/config.py` con pydantic-settings
- [x] Configurar `packages/api/src/dependencies.py` (DB session + auth)
- [x] Crear Pydantic schemas (LinkRead, LinkFilter, LinkCreate, PaginationResponse)
- [x] Implementar endpoints en `packages/api/src/routers/links.py`
- [x] Implementar lógica de filtrado y paginación
- [x] Crear `packages/api/Dockerfile` (ya existía en `infra/dockerfiles/api/Dockerfile`)
- [x] Añadir servicio API al docker-compose.yml (ya existía)
- [x] Probar endpoints con Swagger UI (`/docs`)

**Estimación:** 10h

---

### HU-2.2 — Discord OAuth2

**Como** usuario del servidor de Discord, quiero loguearme con mi cuenta de Discord para poder acceder a la web.

**Criterios de aceptación:**
- [x] Endpoint `GET /api/auth/discord` genera state y redirige a Discord OAuth
- [x] Discord redirige al frontend en `/auth/discord/callback` con code y state
- [x] Frontend llama al backend `POST /api/auth/discord/callback` para intercambiar code por JWT
- [x] Backend verifica code con Discord API, crea/actualiza usuario, genera JWT
- [x] Frontend guarda JWT en cookie httpOnly tras login exitoso
- [x] Creación/actualización de usuario en tabla `users` si no existe
- [x] JWT expire: configurable (30 days recommended)
- [x] Cookie `token` con `httpOnly: true`, `secure: false` (dev), `sameSite: lax`
- [x] Redirección server-side: `/` redirige a `/login` si no autenticado
- [x] Redirección server-side: `/login` redirige a `/` si ya autenticado
- [x] Endpoint `GET /api/auth/me` devuelve info del usuario logueado
- [x] Logout limpia cookie token y redirige a `/`

**Tareas:**
- [x] Crear `packages/api/src/routers/auth.py` con endpoints (`GET /discord`, `POST /discord/callback`)
- [x] Implementar JWT generation/verification (python-jose + passlib)
- [x] Implementar middleware de auth dependency (`packages/api/src/dependencies.py`)
- [x] Configurar vars de entorno: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, JWT_SECRET, FRONTEND_URL
- [x] Crear `packages/web/src/app/auth/discord/callback/route.ts` como Next.js API route
- [x] Crear `packages/web/src/lib/auth.ts` con gestión de session (cookies)
- [x] Añadir funciones `getServerToken()` y `getServerIsLoggedIn()` para SSR redirect
- [x] Actualizar docker-compose.yml con `API_URL` y `NEXT_PUBLIC_API_URL`
- [x] Probar flujo completo OAuth localmente: login → Discord → frontend callback → API token exchange → redirect

**Estimación:** 7h

---

### HU-2.3 — Frontend base + tema oscuro nan.builders

**Como** visitante, quiero ver una web con diseño oscuro, minimal y limpio inspirado en nan.builders para explorar los links compartidos.

**Criterios de aceptación:**
- [x] Next.js 15 App Router configurado en `packages/web/`
- [x] Tailwind CSS configurado con tema oscuro (background: #0a0a0a o similar)
- [x] Tipografía limpia (Inter o similar, sans-serif)
- [x] Paleta de colores consistente: fondo oscuro, texto claro, acentos sutiles
- [x] Layout con header fijo (logo/título + botón login/logout)
- [x] Página principal `/` con grid de cards de links
- [x] Página `/login` redirige a Discord OAuth
- [x] Página `/auth/discord/callback` maneja OAuth callback y redirige tras login exitoso
- [x] Responsive: mobile-first, funciona en móvil y desktop
- [x] No hay contenido placeholder — los datos vienen de la API real
- [x] Redirección server-side: `/` protege acceso (requiere login)
- [x] Redirección server-side: `/login` redirige a `/` si ya logueado

**Tareas:**
- [x] Actualizar `packages/web/src/styles/globals.css` con tema oscuro completo
- [x] Configurar `packages/web/src/app/layout.tsx` con header fijo
- [x] Crear `packages/web/src/app/page.tsx` con grid de links + auth guard SSR
- [x] Crear `packages/web/src/app/login/page.tsx` con redirect a OAuth + auth guard SSR
- [x] Crear `packages/web/src/app/auth/discord/callback/route.ts` como API route handler
- [x] Crear `packages/web/src/lib/api.ts` con fetch wrapper a la API + `exchangeDiscordToken()`
- [x] Crear `packages/web/src/lib/auth.ts` con gestión de session via cookies
- [x] Crear `packages/web/src/components/layout/Header.tsx`
- [x] Crear `packages/web/src/components/links/LinkCard.tsx`
- [x] Crear `packages/web/src/components/links/LinkGrid.tsx`
- [x] Crear `packages/web/Dockerfile` (ya existía en `infra/dockerfiles/web/Dockerfile`)
- [x] Añadir servicio web al docker-compose.yml (ya existía)
- [x] Probar flujo completo: login → callback → página principal con datos

**Estimación:** 8h

---

## Dependencias entre historias

```
HU-2.1 (API CRUD) ──┐
HU-2.2 (OAuth)     │──→ HU-2.3 (Frontend base)
HU-2.1 (API CRUD) ──┘
```

## Aceptación de la Epic

- [x] API FastAPI accesible en localhost con endpoints CRUD y Swagger docs
- [x] Filtros y paginación funcionan correctamente
 - [x] Login con Discord OAuth funciona (login → Discord → frontend callback → API token exchange → usuario logueado)
- [x] JWT se almacena en cookie httpOnly, no en localStorage
- [x] Rutas protegidas con SSR redirect: `/` requiere login, `/login` redirige a `/` si ya logueado
- [x] JWT session protege rutas API
- [x] Frontend Next.js renderiza lista de links desde API real
- [x] Tema oscuro inspirado en nan.builders aplicado
- [x] Responsive en móvil y desktop
- [x] Todo dockerizado (api + web con Dockerfile)
- [x] `docker compose up` levanta todo incluyendo frontend
