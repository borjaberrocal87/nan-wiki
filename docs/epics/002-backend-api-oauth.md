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
- [x] Filtros query params: `source`, `tags`, `domain`, `channel`, `author_id`, `date_from`, `date_to`
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
- [x] Endpoint `GET /api/auth/discord` redirige a Discord OAuth
- [x] Endpoint `GET /api/auth/discord/callback` procesa el callback
- [x] Verificación del state parameter (CSRF protection via cookie)
- [x] Intercambio de code → access_token + user info con Discord API
- [x] Creación/actualización de usuario en tabla `users` si no existe
- [x] Session JWT con Discord user ID como payload
- [x] JWT expire: configurable (7 days recommended)
- [x] Middleware de autenticación protege rutas `/api/*` (excepto `/api/auth/*`)
- [x] Endpoint `GET /api/auth/me` devuelve info del usuario logueado
- [x] Endpoint `POST /api/auth/logout` invalida session

**Tareas:**
- [x] Crear `packages/api/src/routers/auth.py` con endpoints
- [x] Implementar JWT generation/verification (python-jose + passlib)
- [x] Implementar middleware de auth dependency (`packages/api/src/dependencies.py`)
- [x] Configurar vars de entorno: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, JWT_SECRET
- [x] Añadir `packages/web/src/lib/auth.ts` para gestión de session en frontend
- [x] Probar flujo completo OAuth localmente

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
- [x] Página `/callback` maneja OAuth callback y redirige tras login exitoso
- [x] Responsive: mobile-first, funciona en móvil y desktop
- [x] No hay contenido placeholder — los datos vienen de la API real

**Tareas:**
- [x] Actualizar `packages/web/src/styles/globals.css` con tema oscuro completo
- [x] Configurar `packages/web/src/app/layout.tsx` con header fijo
- [x] Crear `packages/web/src/app/page.tsx` con grid de links
- [x] Crear `packages/web/src/app/login/page.tsx` con redirect a OAuth
- [x] Crear `packages/web/src/app/callback/page.tsx` con handler de OAuth
- [x] Crear `packages/web/src/lib/api.ts` con fetch wrapper a la API
- [x] Crear `packages/web/src/lib/auth.ts` con gestión de session
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
- [x] Login con Discord OAuth funciona (login → callback → usuario logueado)
- [x] JWT session protege rutas API
- [x] Frontend Next.js renderiza lista de links desde API real
- [x] Tema oscuro inspirado en nan.builders aplicado
- [x] Responsive en móvil y desktop
- [x] Todo dockerizado (api + web con Dockerfile)
- [x] `docker compose up` levanta todo incluyendo frontend
