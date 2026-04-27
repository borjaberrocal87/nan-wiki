# Epic: Backend API + OAuth

## Resumen

Construir el backend FastAPI con endpoints CRUD de links, el flujo de autenticación con Discord OAuth2 y la base del frontend Next.js con tema oscuro inspirado en nan.builders.

**Estimación:** ~25h
**Riesgo:** Bajo-Medio
**Dependencias:** Epic 001 (DB schema, bot básico)

---

## Historias de Usuario

### HU-2.1 — Backend FastAPI: estructura y endpoints CRUD

**Como** frontend, quiero una API REST con endpoints para listar, buscar y filtrar links para poder consumirlos desde el frontend.

**Criterios de aceptación:**
- [ ] FastAPI app en `packages/api/src/main.py` con CORS habilitado
- [ ] Endpoint `GET /api/links` con paginación (offset/limit o cursor)
- [ ] Endpoint `GET /api/links/{id}` para obtener un link individual
- [ ] Endpoint `GET /api/links/sources` para listar fuentes disponibles
- [ ] Filtros query params: `source`, `tags`, `domain`, `channel`, `author_id`, `date_from`, `date_to`
- [ ] Ordenación: `sort=posted_at|title` y `order=asc|desc`
- [ ] Respuestas paginadas: `{ data: [], total: N, page: N, per_page: N }`
- [ ] Pydantic schemas para request/response en `packages/api/src/schemas.py`
- [ ] SQLAlchemy CRUD en `packages/api/src/services/`

**Tareas:**
- [ ] Configurar FastAPI app con middleware (CORS, logging)
- [ ] Configurar `packages/api/src/config.py` con pydantic-settings
- [ ] Configurar `packages/api/src/dependencies.py` (DB session)
- [ ] Crear Pydantic schemas (LinkCreate, LinkRead, LinkFilter, PaginationResponse)
- [ ] Implementar endpoints en `packages/api/src/routers/links.py`
- [ ] Implementar lógica de filtrado y paginación
- [ ] Crear `packages/api/Dockerfile` (multi-stage, python:3.12-slim)
- [ ] Añadir servicio API al docker-compose.yml
- [ ] Probar endpoints con Swagger UI (`/docs`)

**Estimación:** 10h

---

### HU-2.2 — Discord OAuth2

**Como** usuario del servidor de Discord, quiero loguearme con mi cuenta de Discord para poder acceder a la web.

**Criterios de aceptación:**
- [ ] Endpoint `GET /api/auth/discord` redirige a Discord OAuth
- [ ] Endpoint `GET /api/auth/discord/callback` procesa el callback
- [ ] Verificación del state parameter (CSRF protection)
- [ ] Intercambio de code → access_token + user info con Discord API
- [ ] Creación/actualización de usuario en tabla `users` si no existe
- [ ] Session JWT con Discord user ID como payload
- [ ] JWT expire: 7 days
- [ ] Middleware de autenticación protege rutas `/api/*` (excepto `/api/auth/*`)
- [ ] Endpoint `GET /api/auth/me` devuelve info del usuario logueado
- [ ] Endpoint `POST /api/auth/logout` invalida session

**Tareas:**
- [ ] Crear `packages/api/src/services/oauth.py` con lógica de Discord OAuth
- [ ] Crear `packages/api/src/routers/auth.py` con endpoints
- [ ] Implementar JWT generation/verification (python-jose + passlib)
- [ ] Implementar middleware de auth dependency
- [ ] Configurar vars de entorno: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, JWT_SECRET
- [ ] Añadir `packages/web/src/lib/auth.ts` para gestión de session en frontend
- [ ] Probar flujo completo OAuth localmente

**Estimación:** 7h

---

### HU-2.3 — Frontend base + tema oscuro nan.builders

**Como** visitante, quiero ver una web con diseño oscuro, minimal y limpio inspirado en nan.builders para explorar los links compartidos.

**Criterios de aceptación:**
- [ ] Next.js 15 App Router configurado en `packages/web/`
- [ ] Tailwind CSS configurado con tema oscuro (background: #0a0a0a o similar)
- [ ] Tipografía limpia (Inter o similar, sans-serif)
- [ ] Paleta de colores consistente: fondo oscuro, texto claro, acentos sutiles
- [ ] Layout con header fijo (logo/título + botón login)
- [ ] Página principal `/` con grid de cards de links
- [ ] Página `/login` redirige a Discord OAuth
- [ ] Página `/callback` maneja OAuth callback y redirige tras login exitoso
- [ ] Responsive: mobile-first, funciona en móvil y desktop
- [ ] No hay contenido placeholder — los datos vienen de la API real

**Tareas:**
- [ ] Crear Next.js app con `npx create-next-app` (TypeScript + Tailwind)
- [ ] Configurar `packages/web/tailwind.config.ts` con tema oscuro
- [ ] Configurar `packages/web/src/styles/globals.css` con variables CSS custom
- [ ] Crear `packages/web/src/app/layout.tsx` con header fijo
- [ ] Crear `packages/web/src/app/page.tsx` con grid de links
- [ ] Crear `packages/web/src/app/login/page.tsx` con redirect a OAuth
- [ ] Crear `packages/web/src/app/callback/page.tsx` con handler de OAuth
- [ ] Crear `packages/web/src/lib/api.ts` con fetch wrapper a la API
- [ ] Crear `packages/web/src/lib/auth.ts` con gestión de session
- [ ] Crear `packages/web/Dockerfile` (multi-stage, node:22-alpine)
- [ ] Añadir servicio web al docker-compose.yml
- [ ] Probar flujo completo: login → callback → página principal con datos

**Estimación:** 8h

---

## Dependencias entre historias

```
HU-2.1 (API CRUD) ──┐
HU-2.2 (OAuth)     │──→ HU-2.3 (Frontend base)
HU-2.1 (API CRUD) ──┘
```

## Aceptación de la Epic

- [ ] API FastAPI accesible en localhost con endpoints CRUD y Swagger docs
- [ ] Filtros y paginación funcionan correctamente
- [ ] Login con Discord OAuth funciona (login → callback → usuario logueado)
- [ ] JWT session protegge rutas API
- [ ] Frontend Next.js renderiza lista de links desde API real
- [ ] Tema oscuro inspirado en nan.builders aplicado
- [ ] Responsive en móvil y desktop
- [ ] Todo dockerizado (api + web con Dockerfile)
- [ ] `docker compose up` levanta todo incluyendo frontend
