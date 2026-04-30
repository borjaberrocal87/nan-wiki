# Epic: Testing — Cobertura, Infraestructura y CI Gates

## Resumen

Auditoría completa y creación de la infraestructura de testing para el monorepo. Actualmente la cobertura global es ~33% con gaps críticos: frontend con 0% de cobertura, módulos de seguridad de la API sin tests, y la infraestructura del bot sin pruebas. Esta épica añade tests unitarios, integra configuración de coverage, object mothers, y gates de CI/CD para que los tests se ejecuten en cada PR.

**Estimación:** ~40h
**Riesgo:** Bajo
**Dependencias:** Todas las epics anteriores (001-006) — el código ya está escrito, los tests se adaptan al código tal como está

---

## Estado actual

| Paquete | Módulos testeados | Cobertura | Test files |
|---------|-------------------|-----------|------------|
| `shared` | 1/1 | **100%** | 1 |
| `api` | 12/16 | **~75%** | 17 |
| `bot` | 2/5 | **~40%** | 2 |
| `web` | 0/24 | **0%** | 0 |
| **Total** | **15/46** | **~33%** | **20** |

### Gaps críticos

- **`packages/web`**: 0 tests. Sin framework configurado. 24 módulos sin cubrir.
- **`packages/api/src/dependencies.py`**: Token decoding y auth — módulo de seguridad crítica sin tests.
- **`packages/api/src/schemas.py`**: Pydantic schemas con validadores sin tests.
- **`packages/api/src/main.py`**: App setup y health endpoint sin tests.
- **`packages/bot/src/events/ready.ts`**: Channel sync sin tests.
- **Sin integración tests**: Solo unit tests con mocks, no hay ciclos request/response con DB real.
- **Sin E2E tests**: No hay Playwright/Cypress para flujo completo.
- **Sin coverage reporting**: No hay `pytest-cov` ni `vitest --coverage`.
- **Sin CI gates**: Los tests no se ejecutan en GitHub Actions.

---

## Historias de Usuario

### HU-7.1 — Configurar infraestructura de tests en `packages/web`

**Como** desarrollador, quiero que el frontend tenga un framework de tests configurado para poder escribir tests unitarios y de componentes.

**Criterios de aceptación:**
- [ ] Instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` en `packages/web`
- [ ] Configurar `vitest.config.ts` con setup file para `@testing-library/jest-dom`
- [ ] Añadir scripts en `package.json`: `test`, `test:watch`, `test:coverage`
- [ ] Configurar `setupTests.ts` con imports globales de testing library
- [ ] `pnpm test` pasa sin errores
- [ ] `pnpm test:coverage` genera reporte de coverage

**Tareas:**
- [ ] `cd packages/web && pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom happy-dom`
- [ ] Crear `packages/web/vitest.config.ts`
- [ ] Crear `packages/web/src/test/setup.ts`
- [ ] Añadir scripts `test`, `test:watch`, `test:coverage` en `packages/web/package.json`
- [ ] Verificar con `pnpm test -- --run`

**Estimación:** 3h

---

### HU-7.2 — Tests unitarios para librerías de `packages/web`

**Como** sistema, quiero que las librerías de lógica pura del frontend tengan tests para validar fetch wrapper, streaming parser, auth y utilidades.

**Criterios de aceptación:**
- [ ] `src/lib/api.ts`: Tests para request wrapper, error handling, streaming SSE parser, token management
- [ ] `src/lib/auth.ts`: Tests para parseo de cookies, manejo de auth state
- [ ] `src/lib/sources.ts`: Tests para `getSourceColor`, `getIconPath`, `getRelativeDate`
- [ ] Coverage mínimo: 80% para librerías

**Tareas:**
- [ ] Crear `packages/web/src/lib/__tests__/api.test.ts` — tests para:
  - Request con token válido
  - Request sin token (no auth)
  - Error handling (4xx, 5xx)
  - Streaming SSE parser (chunks válidos, malformed, empty)
  - AbortController en requests
- [ ] Crear `packages/web/src/lib/__tests__/auth.test.ts` — tests para:
  - Parseo de cookies de auth
  - Expiración de tokens
  - Limpieza de session
- [ ] Crear `packages/web/src/lib/__tests__/sources.test.ts` — tests para:
  - `getSourceColor` para cada fuente conocida
  - `getIconPath` mapping
  - `getRelativeDate` con fechas pasadas y presentes

**Estimación:** 6h

---

### HU-7.3 — Tests de componentes React en `packages/web`

**Como** desarrollador, quiero tests de componentes para los UI components más importantes del frontend.

**Criterios de aceptación:**
- [ ] `LinkCard`: renderizado correcto, click en tags, truncado de texto largo
- [ ] `LinkFilters`: renderizado de filtros, selección de source/tag/author, reset
- [ ] `SearchBar`: búsqueda con Enter, keyboard shortcuts, debounce visual
- [ ] `Pagination`: navegación entre páginas, truncado de números, estados disabled
- [ ] `ChatWindow`: renderizado de mensajes, streaming, SQL highlighting
- [ ] Coverage mínimo: 70% para componentes

**Tareas:**
- [ ] Crear `packages/web/src/components/links/__tests__/LinkCard.test.tsx`
- [ ] Crear `packages/web/src/components/links/__tests__/LinkFilters.test.tsx`
- [ ] Crear `packages/web/src/components/links/__tests__/SearchBar.test.tsx`
- [ ] Crear `packages/web/src/components/links/__tests__/Pagination.test.tsx`
- [ ] Crear `packages/web/src/components/chat/__tests__/ChatWindow.test.tsx`
- [ ] Mock de API client para componentes que hacen fetch
- [ ] Mock de hooks (`useLinks`, `useChat`) para componentes que los consumen

**Estimación:** 10h

---

### HU-7.4 — Tests de hooks en `packages/web`

**Como** desarrollador, quiero tests para los hooks personalizados que manejan la lógica de estado y datos del frontend.

**Criterios de aceptación:**
- [ ] `useLinks.ts`: Tests para URL sync, filter parsing, pagination, search routing, debounced search
- [ ] `useChat.ts`: Tests para streaming state management, message appending, error recovery
- [ ] Coverage mínimo: 80% para hooks

**Tareas:**
- [ ] Crear `packages/web/src/hooks/__tests__/useLinks.test.ts` — tests para:
  - URL sync: filtros → URL params y viceversa
  - Filter parsing: source, tags, author, channel, date range
  - Pagination: page changes, total pages calculation
  - Search: debounced search, routing a `/search?q=...`
  - Empty state handling
- [ ] Crear `packages/web/src/hooks/__tests__/useChat.test.ts` — tests para:
  - Streaming: message state updates, chunk appending
  - Error recovery: failed requests, retry logic
  - Suggestion clicks
  - Empty input handling

**Estimación:** 6h

---

### HU-7.5 — Tests para módulos de seguridad y validación de la API

**Como** desarrollador, quiero tests para los módulos de seguridad (token decoding, schemas) para asegurar que no hay vulnerabilidades en la autenticación.

**Criterios de aceptación:**
- [ ] `src/dependencies.py`: Tests para `_decode_token` con token válido, expirado, malformed, missing header, invalid format
- [ ] `src/schemas.py`: Tests para validación de `LinkRead`, `LinkFilter`, `TagRead`, `ChatRequest`
- [ ] `src/main.py`: Tests para `/health` endpoint, middleware setup, router registration
- [ ] Coverage mínimo: 90% para estos módulos

**Tareas:**
- [ ] Crear `packages/api/tests/test_dependencies.py` — tests para:
  - Token JWT válido → `AuthUser` correcto
  - Token expirado → `HTTPException(401)`
  - Token malformed → `HTTPException(401)`
  - Missing Authorization header → `HTTPException(401)`
  - Invalid token format → `HTTPException(401)`
  - Token con claims válidos → user ID, username, avatar extraídos correctamente
- [ ] Crear `packages/api/tests/test_schemas.py` — tests para:
  - `LinkFilter` con filtros válidos
  - `LinkFilter` con filtros inválidos (fuentes inexistentes, fechas mal formateadas)
  - `LinkRead` desde primitives
  - `TagRead` creation
  - `ChatRequest` con query vacía
- [ ] Crear `packages/api/tests/test_main.py` — tests para:
  - `GET /health` devuelve `{ status: "ok" }`
  - Routers registrados correctamente
  - Middleware ejecutado (CORS, auth)

**Estimación:** 5h

---

### HU-7.6 — Tests para infraestructura del bot

**Como** desarrollador, quiero tests para los módulos de infraestructura del bot que no tienen cobertura.

**Criterios de aceptación:**
- [ ] `src/events/ready.ts`: Tests para channel sync desde Discord guild
- [ ] `src/client.ts`: Tests para Discord client setup
- [ ] `src/services/db.ts`: Tests para Prisma singleton
- [ ] Coverage mínimo: 80% para bot

**Tareas:**
- [ ] Crear `packages/bot/src/events/__tests__/ready.test.ts` — tests para:
  - Sync de canales desde guild
  - Canales nuevos creados en DB
  - Canales existentes actualizados
  - Manejo de errores de Discord API
- [ ] Crear `packages/bot/src/__tests__/client.test.ts` — tests para:
  - Client login con token
  - Event listeners registrados
  - Graceful shutdown
- [ ] Crear `packages/bot/src/services/__tests__/db.test.ts` — tests para:
  - Singleton pattern (misma instancia)
  - Conexión a DB
  - Error handling en conexión

**Estimación:** 4h

---

### HU-7.7 — Tests de integración para la API

**Como** desarrollador, quiero tests de integración que ejecuten ciclos request/response completos con una base de datos de test para validar el flujo real de la aplicación.

**Criterios de aceptación:**
- [ ] Tests de OAuth flow completo: login → callback → session
- [ ] Tests de link CRUD con DB real: crear, leer, actualizar, filtrar, buscar
- [ ] Tests de chat endpoint con SQL validation real
- [ ] Tests de búsqueda híbrida con datos reales
- [ ] Base de datos de test aislada (no comparte con dev/production)
- [ ] Coverage mínimo: 70% para endpoints

**Tareas:**
- [ ] Crear `packages/api/tests/conftest_integration.py` con fixtures de DB de test
- [ ] Crear `packages/api/tests/test_oauth_integration.py` — flujo completo OAuth
- [ ] Crear `packages/api/tests/test_links_integration.py` — CRUD completo con DB
- [ ] Crear `packages/api/tests/test_chat_integration.py` — chat endpoint con SQL real
- [ ] Crear `packages/api/tests/test_search_integration.py` — búsqueda híbrida con datos
- [ ] Configurar test database en docker-compose.yml (servicio `postgres_test`)

**Estimación:** 6h

---

### HU-7.8 — Configurar coverage reporting y CI gates

**Como** equipo de desarrollo, quiero que los tests se ejecuten automáticamente en cada PR con coverage reporting para evitar regressiones.

**Criterios de acceptance:**
- [ ] `pytest-cov` configurado en `packages/api/pyproject.toml` con threshold mínimo 80%
- [ ] `vitest --coverage` configurado en `packages/bot` y `packages/web` con threshold mínimo 70%
- [ ] GitHub Actions workflow que ejecute tests en cada PR:
  - `pnpm test` en cada package
  - Coverage report como comment en PR
  - Fail del workflow si coverage baja del threshold
- [ ] `pnpm test` en root ejecuta tests en todos los packages
- [ ] Coverage report generado en formato HTML accesible localmente

**Tareas:**
- [ ] Configurar `pyproject.toml` en `packages/api` con `pytest-cov` thresholds
- [ ] Configurar `vitest.config.ts` en `packages/bot` con coverage
- [ ] Configurar `vitest.config.ts` en `packages/web` con coverage
- [ ] Crear `.github/workflows/test.yml`:
  - Trigger: `pull_request` y `push to main`
  - Steps: setup pnpm, install deps, run tests con coverage
  - Coverage threshold como gate
- [ ] Añadir script `test` en root `package.json` que ejecute tests en todos los packages
- [ ] Verificar que `pnpm test` pasa en todo el monorepo

**Estimación:** 4h

---

## Dependencias entre historias

```
HU-7.1 (Config web) ──→ HU-7.2 (Libs web) ──→ HU-7.3 (Componentes web)
                                         ──→ HU-7.4 (Hooks web)
HU-7.5 (API security) ──────────────────────────────────────────────────┐
HU-7.6 (Bot infra) ─────────────────────────────────────────────────────┤
HU-7.2 ──→ HU-7.3 ──→ HU-7.7 (Integration) ──→ HU-7.8 (CI gates)
HU-7.5 ──→ HU-7.7
HU-7.6 ──→ HU-7.7
```

## Aceptación de la Epic

- [ ] `packages/shared`: cobertura 100% mantenida
- [ ] `packages/api`: cobertura >= 85% (subir de ~75%)
- [ ] `packages/bot`: cobertura >= 80% (subir de ~40%)
- [ ] `packages/web`: cobertura >= 70% (subir de 0%)
- [ ] Tests de integración pasan con DB real
- [ ] GitHub Actions ejecuta tests en cada PR
- [ ] Coverage report HTML generado y verificable
- [ ] `pnpm test` pasa en todo el monorepo sin errores
- [ ] Thresholds de coverage configurados y funcionando
