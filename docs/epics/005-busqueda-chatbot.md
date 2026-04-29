# Epic: Búsqueda Semántica + Chatbot

## Resumen

Implementar búsqueda híbrida (keyword + vector) con pgvector y un chatbot conversacional que responde preguntas sobre los links compartidos.

**Estimación:** ~23h
**Riesgo:** Medio
**Dependencias:** Epic 003 (LLM pipeline con embeddings), Epic 002 (API, OAuth)

---

## Historias de Usuario

### HU-5.1 — Búsqueda híbrida (keyword + vector)

**Como** usuario, quiero buscar links de forma semántica (no solo por texto exacto) para encontrar contenido relacionado aunque no coincidan las palabras exactas.

**Criterios de aceptación:**
- [x] Búsqueda híbrida: keyword (pg_trgm) + vector (pgvector cosine similarity)
- [x] Pesos combinados: 60% keyword + 40% vector (configurable)
- [x] Endpoint `GET /api/links/search?q=...` para búsqueda híbrida
- [x] Endpoint `GET /api/links/search?q=...&type=keyword` para búsqueda por texto puro
- [x] Resultados ordenados por score combinado
- [x] El campo de búsqueda principal usa búsqueda híbrida por defecto
- [x] Fallback: si pgvector no está disponible, usar solo keyword search
- [ ] Performance: respuesta en < 500ms para hasta 10K links

**Tareas:**
- [x] Crear `packages/api/src/services/search.py` con lógica de búsqueda híbrida
- [x] Implementar búsqueda fuzzy con PostgreSQL `pg_trgm` (reemplaza full-text search, soporta partial matches)
- [x] Implementar búsqueda vectorial con pgvector (HNSW index, cosine distance)
- [x] Implementar combinación de scores (weighted average 60/40)
- [x] Crear endpoint en `packages/api/src/routers/links.py`
- [x] Configurar pgvector index (HNSW en 1024-dim embeddings)
- [x] Implementar fallback a keyword-only si pgvector falla
- [ ] Benchmark con dataset de prueba (mínimo 1000 links)
- [x] Conectar búsqueda híbrida con SearchBar del frontend (`useLinks.ts`)

**Estimación:** 10h

---

### HU-5.2 — Chatbot conversacional

**Como** usuario, quiero hacer preguntas en lenguaje natural sobre los links compartidos y recibir respuestas contextualizadas.

**Criterios de aceptación:**
- [x] Endpoint `POST /api/chat/message` que recibe `{ message }`
- [x] Endpoint `POST /api/chat/message/stream` para streaming con SSE
- [x] El chatbot busca contexto relevante de los links usando búsqueda semántica
- [x] Construye un prompt con: sistema prompt + contexto de links relevantes + pregunta del usuario
- [x] Llama a LLM con el prompt construido
- [x] Respuesta devuelta en streaming (Server-Sent Events) o response completo
- [x] Respuesta incluye referencias a los links consultados
- [x] Límite de contexto: máximo 10 links relevantes por pregunta
- [x] Respuesta en el mismo idioma del usuario (detectado por LLM)
- [x] Manejo de errores: si el LLM falla, respuesta de error amigable

**Tareas:**
- [x] Crear `packages/api/src/services/chatbot.py` con lógica del chatbot
- [x] Diseñar system prompt del chatbot (rol, capacidades, limitaciones)
- [x] Implementar función `build_prompt(question, context_links)`
- [x] Implementar función `get_relevant_context(question)` usando búsqueda híbrida
- [x] Crear endpoint `POST /api/chat/message` en `packages/api/src/routers/chat.py`
- [x] Implementar streaming con SSE (Server-Sent Events)
- [x] Configurar temperature=0.7 y max_tokens=2048
- [x] Probar con preguntas de ejemplo y verificar calidad de respuestas

**Estimación:** 10h

---

### HU-5.4 — Componente de chat en frontend

**Como** usuario, quiero una interfaz de chat intuitiva para interactuar con el chatbot.

**Criterios de aceptación:**
- [x] Ventana de chat con burbujas de mensaje (estilo Discord/chat moderno)
- [x] Mensajes del usuario alineados a la derecha, del bot a la izquierda
- [x] Indicador de "escribiendo..." mientras el bot genera respuesta
- [x] Streaming de respuesta (aparece palabra por palabra)
- [x] Links referenciados en la respuesta son clicables
- [x] Input de texto con placeholder: "Pregúntame sobre los links compartidos..."
- [x] Botón de enviar con teclado (Enter)
- [x] Scroll automático al último mensaje
- [x] Responsive: ocupa toda la pantalla en móvil, panel lateral en desktop
- [x] Error state: mensaje de error amigable si falla la petición

**Tareas:**
- [x] Crear `packages/web/src/components/chat/ChatWindow.tsx`
- [x] Crear `packages/web/src/components/chat/MessageBubble.tsx`
- [x] Crear `packages/web/src/components/chat/ChatInput.tsx`
- [x] Implementar streaming con fetch stream (SSE reader)
- [x] Implementar indicador "escribiendo..."
- [x] Implementar auto-scroll
- [x] Parsear y hacer clicables los links en las respuestas
- [x] Crear hook `useChat.ts` para gestión de estado del chat
- [x] Integrar chat en la navegación principal (Header link)
- [x] Probar streaming y responsive

**Estimación:** 5h

---

## Dependencias entre historias

```
HU-5.1 (Búsqueda híbrida) ──→ HU-5.2 (Chatbot) ──→ HU-5.4 (UI Chat)
HU-5.2 (Chatbot) ──→ HU-5.4 (UI Chat)
```

## Aceptación de la Epic

- [x] Búsqueda híbrida funciona: encuentra resultados semánticamente relevantes
- [ ] Performance < 500ms con dataset de prueba
- [x] Chatbot responde preguntas sobre links compartidos con contexto relevante
- [x] Respuestas incluyen referencias a links específicos
- [x] Interfaz de chat moderna con streaming, burbujas, indicador "escribiendo..."
- [x] Responsive: móvil y desktop
- [x] pgvector index funcionando correctamente (HNSW, 1024-dim)
