# Epic: LLM Pipeline

## Resumen

Implementar el pipeline asíncrono que procesa links pendientes: genera título, descripción y tags con LLM, crea embeddings vectoriales, y maneja errores con auto-retry configurable.

**Estimación:** ~20h
**Riesgo:** Medio
**Dependencias:** Epic 001 (DB schema, bot básico), Epic 002 (API CRUD)

**Provider LLM:** Custom provider en `https://api.nan.builders/v1` con modelo `qwen3.6` (chat) y `qwen3-embedding` (embeddings). Cliente OpenAI con `base_url` y `api_key` configurables.

---

## Historias de Usuario

### HU-3.1 — Cola de procesamiento asíncrono con DB polling

**Como** bot de Discord, quiero que los links pendientes se procesen de forma asíncrona sin bloquear la respuesta al usuario.

**Criterios de aceptación:**
- [ ] Worker consulta links con `llm_status IN ('pending', 'failed')` desde PostgreSQL
- [ ] Query usa `FOR UPDATE SKIP LOCKED` para evitar contention entre workers
- [ ] Query ordenada por `posted_at ASC` (FIFO) con `LIMIT 1`
- [ ] Worker consume un link a la vez
- [ ] Si no hay links pending, el worker hace polling cada N segundos (configurable, default 5s)
- [ ] Control de concurrencia: máximo N workers simultáneos (configurable)
- [ ] Al empezar procesamiento, el worker actualiza `llm_status` a `'processing'`
- [ ] Al terminar, actualiza `llm_status` a `'done'` o `'failed'`
- [ ] Logs de consumo de cola

**Tareas:**
- [ ] Crear `packages/api/src/workers/queue.py` con consumer de DB polling
- [ ] Implementar query `SELECT ... FROM links WHERE llm_status IN ('pending', 'failed') AND retry_count < max_retries ORDER BY posted_at LIMIT 1 FOR UPDATE SKIP LOCKED`
- [ ] Configurar N workers con asyncio (tarea configurable, default 3)
- [ ] Configurar interval de polling (configurable, default 5s)
- [ ] Añadir worker como servicio en docker-compose.yml
- [ ] Probar que el worker consume links pending correctamente

**Estimación:** 5h

---

### HU-3.2 — Generación de metadata con LLM

**Como** usuario, quiero que cada link tenga un título, descripción y tags generados automáticamente para entender rápidamente de qué trata sin hacer clic.

**Criterios de aceptación:**
- [ ] Worker llama a LLM custom provider (base_url: `https://api.nan.builders/v1`, model: `qwen3.6`) con prompt estructurado
- [ ] Prompt solicita: título (máx 100 chars), descripción (máx 300 chars), 3-5 tags
- [ ] Respuesta parseada con JSON structured output
- [ ] Fallback: si el LLM falla, se guarda al menos el `raw_content` del link
- [ ] Estado `llm_status` actualizado: `pending` → `processing` → `done` | `failed`
- [ ] Retry con backoff exponencial (max 3 intentos por llamada individual)
- [ ] Campos actualizados en DB: title, description, tags, llm_status

**Tareas:**
- [ ] Crear `packages/api/src/services/llm.py` con cliente OpenAI compatible
- [ ] Configurar `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL`, `LLM_API_KEY` en settings
- [ ] Diseñar prompt system para extracción de metadata
- [ ] Implementar función `generate_link_metadata(url, raw_content, source)`
- [ ] Implementar parsing de respuesta JSON
- [ ] Implementar lógica de retry con backoff exponencial
- [ ] Actualizar worker en `packages/api/src/workers/process_link.py` para llamar al LLM
- [ ] Configurar LLM_API_KEY en docker-compose y .env

**Estimación:** 7h

---

### HU-3.3 — Generación de embeddings

**Como** sistema, quiero generar un embedding vectorial para cada link para permitir búsqueda semántica futura.

**Criterios de aceptación:**
- [ ] Se usa `qwen3-embedding` del provider custom para generar embeddings
- [ ] El embedding se genera sobre: `title + description` (concatenados)
- [ ] Vector de 1536 dimensiones
- [ ] Embedding se guarda en campo `links.embedding` (tipo vector de pgvector)
- [ ] Se genera después de que el LLM haya generado title + description
- [ ] Si la generación del embedding falla, el link sigue procesado (no bloquea)
- [ ] Embedding se regenera si title/description cambian

**Tareas:**
- [ ] Añadir función `generate_embedding(text)` en `packages/api/src/services/llm.py`
- [ ] Actualizar `process_link.py` para generar embedding tras metadata
- [ ] Guardar embedding en DB con SQLAlchemy
- [ ] Probar que el embedding se guarda correctamente en pgvector
- [ ] Verificar que el índice ivfflat funciona con el nuevo dato

**Estimación:** 3h

---

### HU-3.4 — Manejo de errores y fallbacks

**Como** administrador, quiero que el pipeline maneje errores gracefully sin perder links ni bloquear el procesamiento.

**Criterios de aceptación:**
- [ ] Si el LLM devuelve respuesta inválida → retry (max 3 intentos por llamada individual)
- [ ] Si tras max_retries intentos falla → estado `failed`, link visible sin metadata
- [ ] Auto-retry: el worker re-procesa links con `llm_status = 'failed'` y `retry_count < MAX_RETRIES`
- [ ] Si la API del LLM está caída → el bot sigue capturando links (solo metadata pendiente)
- [ ] Logs detallados de errores con contexto (URL, error, intent number)
- [ ] Endpoint `GET /api/links?llm_status=failed` para ver links con error
- [ ] `MAX_RETRIES` configurable desde .env (default 5)
- [ ] Métricas: links procesados con éxito vs fallidos (log/consola)

**Tareas:**
- [ ] Implementar retry logic con backoff exponencial en `llm.py`
- [ ] Añadir campo `retry_count` en modelo Link (default 0)
- [ ] Añadir migración de alembic para `retry_count`
- [ ] Añadir endpoint de filtrado por llm_status
- [ ] Implementar logging estructurado con contexto
- [ ] Implementar contador de métricas (success/failed per hour)
- [ ] Probar escenario: API del LLM caída → verificar comportamiento

**Estimación:** 5h

---

## Dependencias entre historias

```
HU-3.1 (DB Polling) ──→ HU-3.2 (LLM Metadata) ──→ HU-3.3 (Embeddings)
HU-3.2 (LLM Metadata) ──┘
HU-3.4 (Error Handling) ──┘ (aplica a toda la cadena)
```

## Aceptación de la Epic

- [ ] Bot guarda link con estado `pending` en DB
- [ ] Worker consume links pending/failed de DB con `FOR UPDATE SKIP LOCKED`
- [ ] LLM genera título, descripción y tags correctamente
- [ ] Embedding vectorial generado y guardado en pgvector
- [ ] Fallback funciona: si el LLM falla, el link sigue visible
- [ ] Retry con backoff exponencial (3 intentos por llamada, max 5 reintentos por link)
- [ ] Links con estado `failed` son visibles y se reintentan automáticamente
- [ ] El bot sigue capturando links incluso si la API del LLM está caída
- [ ] Worker dockerizado y orquestado en docker-compose
