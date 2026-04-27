# Epic: LLM Pipeline

## Resumen

Implementar el pipeline asíncrono que procesa links pendientes: genera título, descripción y tags con LLM, crea embeddings vectoriales, y maneja errores con fallback.

**Estimación:** ~20h
**Riesgo:** Medio
**Dependencias:** Epic 001 (DB schema, bot básico), Epic 002 (API CRUD)

---

## Historias de Usuario

### HU-3.1 — Cola de procesamiento asíncrona con Redis

**Como** bot de Discord, quiero enviar links a una cola en Redis para que se procesen asíncronamente sin bloquear la respuesta al usuario.

**Criterios de aceptación:**
- [ ] Redis conectado desde la API
- [ ] Cola con estructura de tipo list o stream (Redis Streams recomendado)
- [ ] Endpoint `POST /api/links/process` push a cola (llamado por el bot o API)
- [ ] Worker consume de la cola y procesa un link a la vez
- [ ] Si la cola está vacía, el worker espera (polling o blocking pop)
- [ ] Control de concurrencia: máximo N workers simultáneos (configurable)
- [ ] Logs de consumo de cola

**Tareas:**
- [ ] Configurar cliente Redis en `packages/api/src/services/`
- [ ] Crear `packages/api/src/workers/queue.py` con consumidor de Redis Streams
- [ ] Implementar push a cola en endpoint API
- [ ] Configurar N workers con asyncio (tarea configurable, default 3)
- [ ] Añadir worker como servicio en docker-compose.yml
- [ ] Probar que el bot push a cola y el worker consume

**Estimación:** 5h

---

### HU-3.2 — Generación de metadata con LLM

**Como** usuario, quiero que cada link tenga un título, descripción y tags generados automáticamente para entender rápidamente de qué trata sin hacer clic.

**Criterios de aceptación:**
- [ ] Worker llama a OpenAI API con prompt estructurado
- [ ] Prompt solicita: título (máx 100 chars), descripción (máx 300 chars), 3-5 tags
- [ ] Respuesta parseada con tool calling o JSON structured output
- [ ] Fallback: si el LLM falla, se guarda al menos el título del oEmbed (si disponible)
- [ ] Estado `llm_status` actualizado: `pending` → `processing` → `done` | `failed`
- [ ] Retry con backoff exponencial (max 3 intentos)
- [ ] Rate limiting: máximo X llamadas/minuto a OpenAI
- [ ] Campos actualizados en DB: title, description, tags, llm_status

**Tareas:**
- [ ] Crear `packages/api/src/services/llm.py` con cliente OpenAI
- [ ] Diseñar prompt system para extracción de metadata
- [ ] Implementar función `generate_link_metadata(url, raw_content, source)`
- [ ] Implementar parsing de respuesta JSON
- [ ] Implementar lógica de retry con backoff exponencial
- [ ] Implementar fallback a oEmbed si el LLM falla
- [ ] Actualizar worker en `packages/api/src/workers/process_link.py` para llamar al LLM
- [ ] Configurar OPENAI_API_KEY en docker-compose y .env

**Estimación:** 7h

---

### HU-3.3 — Generación de embeddings

**Como** sistema, quiero generar un embedding vectorial para cada link para permitir búsqueda semántica futura.

**Criterios de aceptación:**
- [ ] Se usa `text-embedding-3-small` de OpenAI para generar embeddings
- [ ] El embedding se genera sobre: `title + description` (concatenados)
- [ ] Vector de 1536 dimensiones (ada-002)
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
- [ ] Si el LLM devuelve respuesta inválida → retry (max 3 intentos)
- [ ] Si tras 3 retries falla → estado `failed`, link visible sin metadata
- [ ] Si la API de OpenAI está caída → el bot sigue capturando links (solo metadata pendiente)
- [ ] Logs detallados de errores con contexto (URL, error, intent number)
- [ ] Endpoint `GET /api/links?llm_status=failed` para ver links con error
- [ ] Endpoint `POST /api/links/{id}/retry` para reintentar procesamiento manual
- [ ] Métricas: links procesados con éxito vs fallidos (log/consola)

**Tareas:**
- [ ] Implementar retry logic con backoff exponencial en `llm.py`
- [ ] Añadir endpoint de retry manual en `routers/links.py`
- [ ] Añadir endpoint de filtrado por llm_status
- [ ] Implementar logging estructurado con contexto
- [ ] Implementar contador de métricas (success/failed per hour)
- [ ] Probar escenario: API de OpenAI caída → verificar comportamiento

**Estimación:** 5h

---

## Dependencias entre historias

```
HU-3.1 (Redis Queue) ──→ HU-3.2 (LLM Metadata) ──→ HU-3.3 (Embeddings)
HU-3.2 (LLM Metadata) ──┘
HU-3.4 (Error Handling) ──┘ (aplica a toda la cadena)
```

## Aceptación de la Epic

- [ ] Bot guarda link con estado `pending` → push a Redis queue
- [ ] Worker consume de la cola y procesa automáticamente
- [ ] LLM genera título, descripción y tags correctamente
- [ ] Embedding vectorial generado y guardado en pgvector
- [ ] Fallback funciona: si el LLM falla, el link sigue visible
- [ ] Retry con backoff exponencial (3 intentos)
- [ ] Links con estado `failed` son visibles y tienen endpoint de retry manual
- [ ] El bot sigue capturando links incluso si la API de OpenAI está caída
- [ ] Worker dockerizado y orquestado en docker-compose
