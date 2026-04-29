# Epic: Pulido, Deploy & Monitoring

## Resumen

Finalizar la aplicación con pulido visual, configuración de despliegue en producción, health checks y logging estructurado.

**Estimación:** ~15h
**Riesgo:** Bajo
**Dependencias:** Todas las epics anteriores (001-005)

---

## Historias de Usuario

### HU-6.1 — Docker Compose para dev local completo

**Como** desarrollador, quiero un docker-compose completo que orqueste todos los servicios para tener un entorno de desarrollo 1:1 con producción.

**Criterios de aceptación:**
- [ ] `infra/docker-compose.yml` con todos los servicios:
  - `postgres` (pgvector habilitado, puertos expuestos para debug)
  - `api` (FastAPI, mapeo de puertos, healthcheck)
  - `bot` (Discord bot, mapeo de puertos)
  - `worker` (procesamiento asíncrono, mapeo de puertos)
  - `web` (Next.js, mapeo de puertos)
- [ ] `infra/docker-compose.dev.yml` con overrides:
  - Volúmenes mounteados para hot-reload
  - Variables de entorno de desarrollo
  - Puertos de debug expuestos
  - No compress para desarrollo
- [ ] `docker compose up` levanta todo automáticamente
- [ ] `docker compose down -v` limpia todo (incluyendo volúmenes)
- [ ] Healthchecks configurados para todos los servicios
- [ ] `depends_on` con condition: service_healthy
- [ ] Networks definidas para comunicación interna

**Tareas:**
- [ ] Revisar y completar `infra/docker-compose.yml`
- [ ] Crear `infra/docker-compose.dev.yml` con overrides de desarrollo
- [ ] Añadir healthchecks a todos los servicios
- [ ] Configurar networks y volumes
- [ ] Probar `docker compose up` completo
- [ ] Probar hot-reload en dev
- [ ] Documentar en `infra/README.md`

**Estimación:** 5h

---

### HU-6.2 — Health checks y monitoring básico

**Como** sistema, quiero endpoints de health check y logging estructurado para monitorizar el estado de los servicios.

**Criterios de aceptación:**
- [ ] Endpoint `GET /health` en la API: devuelve `{ status: "ok", uptime: N, db: "connected" | "disconnected" }`
- [ ] Endpoint `GET /health` en el bot: devuelve `{ status: "ok", guilds: N, channels: N, links_captured: N, uptime: N }`
- [ ] Health checks configurados en docker-compose.yml
- [ ] Logs estructurados en JSON (timestamp, level, service, message, context)
- [ ] Logs de la API con request ID para tracing
- [ ] Logs de errores con stack trace (solo en dev)
- [ ] Métricas básicas: links capturados/hora, requests por endpoint, errores por tipo
- [ ] `docker compose logs -f api` muestra logs en tiempo real

**Tasks:**
- [ ] Implementar `/health` en `packages/api/src/routers/`
- [ ] Implementar `/health` en `packages/bot/src/events/`
- [ ] Configurar logging estructurado en API (loguru o structlog)
- [ ] Configurar logging estructurado en bot (winston)
- [ ] Añadir healthchecks en docker-compose.yml
- [ ] Añadir request ID middleware en API
- [ ] Probar health checks localmente
- [ ] Probar `docker compose logs -f`

**Estimación:** 5h

---

### HU-6.3 — Deploy a producción con GHCR

**Como** administrador, quiero desplegar la aplicación en producción con imágenes Docker construidas en GH Actions y desplegadas pull-only en el servidor.

**Criterios de aceptación:**
- [ ] Variables de entorno por ambiente: `.env.development`, `.env.production`
- [ ] `.env.example` con todas las vars necesarias (sin valores sensibles)
- [ ] Dockerfiles optimizados para production (multi-stage, no dev dependencies)
- [ ] `.dockerignore` en cada paquete para minimizar imagen
- [ ] GitHub Actions workflow:
  - `push to main` → build de imágenes Docker
  - Push de imágenes a GHCR (GitHub Container Registry)
  - Tags: `main`, `latest`
- [ ] Servidor ejecuta `docker pull` desde GHCR + `docker compose up -d`
- [ ] `infra/README.md` con instrucciones de deploy en el servidor
- [ ] Base de datos con migraciones automáticas en deploy (entrypoint script)
- [ ] `.env` del servidor configurado con variables sensibles

**Tareas:**
- [ ] Crear `.env.example` completo con todas las vars
- [ ] Optimizar Dockerfiles para production (minimizar tamaño)
- [ ] Crear `.dockerignore` en cada paquete
- [ ] Crear `.github/workflows/build-and-push.yml` con GH Actions
  - Build Docker images con `docker buildx`
  - Login a GHCR con `GH_TOKEN`
  - Push de imágenes a `ghcr.io/<org>/<service>:main`
- [ ] Crear script de deploy en el servidor (`deploy.sh`):
  - `docker pull` para cada servicio
  - `docker compose up -d`
  - Rollback en caso de fallo de health check
- [ ] Configurar migraciones automáticas en el entrypoint del API
  - Ejecutar `alembic upgrade head` antes de iniciar la API
- [ ] Documentar todo en `infra/README.md`
- [ ] Configurar `.env` en el servidor con todas las variables
- [ ] Probar deploy completo: push → GH Actions → GHCR → servidor → todo funcionando

**Estimación:** 10h

---

## Dependencias entre historias

```
HU-6.1 (Docker local) ──→ HU-6.2 (Health checks) ──→ HU-6.3 (Deploy)
HU-6.1 (Docker local) ──→ HU-6.2 (Health checks) ──→ HU-6.3 (Deploy)
```

## Aceptación de la Epic

- [ ] `docker compose up` levanta todos los servicios (PG, Redis, API, Bot, Worker, Web)
- [ ] Hot-reload funciona en desarrollo
- [ ] Health checks retornan estado correcto de todos los servicios
- [ ] Logs estructurados visibles con `docker compose logs -f`
- [ ] Variables de entorno por ambiente documentadas
- [ ] Dockerfiles optimizados para production
- [ ] Deploy plan documentado con instrucciones paso a paso
- [ ] CI/CD configurado (push → build → deploy)
