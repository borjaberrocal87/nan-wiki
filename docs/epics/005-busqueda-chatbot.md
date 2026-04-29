# Epic Update: 005-busqueda-chatbot.md

## Resumen cambiado

**Antes:** Búsqueda híbrida (keyword + vector) con pgvector y un chatbot conversacional que responde preguntas sobre los links compartidos.

**Ahora:** Búsqueda híbrida se mantiene para la página de exploración, pero el chatbot ha sido reemplazado por un pipeline NL2SQL de 4 etapas que responde preguntas en lenguaje natural ejecutando SQL real contra la base de datos.

**Nueva estimación del chat:** ~16-20h (más complejo que la versión anterior — requiere pipeline de 2 LLM calls + validación + ejecución + respuesta en natural language)

---

## Historias de Usuario actualizadas

### HU-5.2 — Pipeline NL2SQL de 4 etapas (reemplaza el chatbot anterior)

**Como** usuario, quiero hacer preguntas en lenguaje natural sobre los datos de la base de datos y recibir respuestas en lenguaje natural generadas a partir de los datos reales.

**Criterios de aceptación:**
- [ ] Pipeline `nl2sql/pipeline.py` con función `answer(question: str) -> AnswerResult`
- [ ] **Etapa 1 — NL → SQL:** Llama a LLM #1 (`LLM_MODEL_NL2SQL`, temp 0), inyecta schema SQL en system prompt, extrae SQL del fenced block
- [ ] **Etapa 2 — Validar:** Usa `pglast` para parsear el SQL generado, rechaza si no es `SELECT` o `WITH`, rechaza locking clauses (`FOR UPDATE`, `FOR SHARE`), rechaza múltiples statements
- [ ] **Etapa 3 — Ejecutar:** Ejecuta SQL en transacción `BEGIN READ ONLY` con `statement_timeout`, fetch `MAX_ROWS + 1` para detectar truncamiento, `SELECT COUNT(*)` para row_count
- [ ] **Etapa 4 — Rows → NL:** Llama a LLM #2 (`LLM_MODEL_ROWS2NL`, temp 0.2) con las filas serializadas a JSON, genera respuesta en lenguaje natural
- [ ] **Config:** `LLM_MODEL_NL2SQL` (temp 0), `LLM_MODEL_ROWS2NL` (temp 0.2), `STATEMENT_TIMEOUT_MS` (default 8000), `MAX_ROWS` (default 100), `MAX_RETRIES` (default 1)
- [ ] **Retry:** Si el SQL falla en ejecución, reintenta Stage 1 una vez con el error como contexto
- [ ] **Seguridad:** `NOTImplementedError` si el SQL referencia `:query_embedding` (placeholder para búsqueda semántica futura)
- [ ] **Config:** `STATEMENT_TIMEOUT_MS` (default 8000), `MAX_ROWS` (default 100), `MAX_RETRIES` (default 1)
- [ ] **CLI:** `python -m nl2sql "your question"` con `--debug` para ver SQL, rows y timings
- [ ] **Testing:** Unit tests para validador SQL, tests para parser de assumptions, integration test stub

**Tareas:**
- [ ] Crear `packages/api/src/nl2sql/pipeline.py` con las 4 etapas
- [ ] Crear `packages/api/src/nl2sql/__main__.py` para CLI
- [ ] Crear `packages/api/src/nl2sql/validator.py` con `pglast`
- [ ] Crear `packages/api/src/prompts/rows2nl.system.md` para Stage 4
- [ ] Mover prompts existentes a `packages/api/src/prompts/`
- [ ] Añadir `pyproject.toml` o `requirements.txt` con `openai`, `asyncpg`, `pglast`
- [ ] Tests unitarios: SQL validator, assumptions parser, integration test stub
- [ ] Integrar pipeline con el router de chat existente

**Estimación:** 16-20h

---

### HU-5.3 — Frontend NL2SQL (reemplaza al chat anterior)

**Como** usuario, quiero una interfaz de chat para hacer preguntas sobre los datos y recibir respuestas en lenguaje natural con datos reales.

**Criterios de aceptación:**
- [ ] Ventana de chat con burbujas de mensaje
- [ ] Mensajes del usuario alineados a la derecha, del bot a la izquierda
- [ ] Indicador de "escribiendo..." mientras el pipeline procesa
- [ ] Streaming de respuesta (SSE)
- [ ] Respuesta del bot muestra el texto natural generado por LLM #2
- [ ] Con `--debug` o toggle, muestra SQL ejecutado, filas y timings
- [ ] Input de texto con placeholder: "Ask something about your data..."
- [ ] Botón de enviar con teclado (Enter)
- [ ] Scroll automático al último mensaje
- [ ] Responsive: ocupa toda la pantalla en móvil, panel lateral en desktop
- [ ] Error state: mensaje de error amigable si falla el pipeline
- [ ] **Eliminada** la UI de referencias a links
- [ ] Icono `database` en vez de `smart_toy`

**Tareas:**
- [ ] Actualizar `MessageResponse` para incluir campos opcionales: `sql`, `row_count`, `error`
- [ ] Actualizar `ChatWindow.tsx` para mostrar respuesta en lenguaje natural
- [ ] Añadir toggle "Show SQL" para debug mode
- [ ] Actualizar `useChat.ts` para manejar el nuevo formato de respuesta
- [ ] Actualizar `api.ts` para endpoints de chat actualizados
- [ ] Actualizar `ChatView.tsx` y `Header.tsx` con nuevo branding (NL2SQL Chat)
- [ ] Actualizar `ChatInput.tsx` con nuevo placeholder

**Estimación:** 6-8h

---

### HU-5.1 — Búsqueda híbrida (sin cambios)

**Como** usuario, quiero buscar links en la página de exploración usando búsqueda híbrida (keyword + vector).

**Criterios de aceptación:**
- [ ] Endpoint `GET /api/links/search?type=hybrid` con búsqueda full-text + pgvector
- [ ] Fallback a búsqueda solo texto si pgvector no está disponible
- [ ] Filtros: source, tags, dates, author, channel
- [ ] Paginación con cursor o offset
- [ ] Cards con fuente icon, título, descripción, tags, autor, fecha

**Estimación:** ~23h (sin cambios)

---

## Lo que se mantiene del epic original

- **HU-5.1 (Búsqueda híbrida):** Se mantiene intacta para la página de exploración de links
- **pgvector:** Sigue siendo relevante para la búsqueda de links, no para el chat

## Lo que se elimina del epic original

- Chatbot que devuelve SQL crudo al usuario
- Búsqueda semántica para el chat (pgvector ya no se usa en el endpoint de chat)
- Contexto de links relevantes por pregunta
- UI de referencias a links en los mensajes del chat
- `get_relevant_context()` y toda la lógica de búsqueda híbrida del chat

## Dependencias entre historias

```
HU-5.1 (Búsqueda híbrida) ──→ Se mantiene para exploración de links
HU-5.2 (Pipeline NL2SQL) ──→ HU-5.3 (Frontend NL2SQL)
```

## Aceptación de la Epic

- [ ] Búsqueda híbrida funciona en exploración de links
- [ ] Pipeline NL2SQL genera SQL correcto y responde en lenguaje natural
- [ ] Validación SQL con pglast rechaza INSERT/UPDATE/DELETE/DDL/FOR UPDATE
- [ ] Ejecución en transacción READ ONLY con statement_timeout
- [ ] Retry automático ante error de SQL (1 intento)
- [ ] Frontend muestra respuestas en lenguaje natural con SQL opcional
- [ ] CLI `python -m nl2sql` funciona localmente con `--debug`
- [ ] Tests unitarios pasan (SQL validator, assumptions parser)
- [ ] Responsive: móvil y desktop
