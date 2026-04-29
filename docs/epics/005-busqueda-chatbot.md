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
- [ ] Búsqueda híbrida: keyword (PostgreSQL full-text search) + vector (pgvector cosine similarity)
- [ ] pesos combinados: 60% keyword + 40% vector (configurable)
- [ ] Endpoint `GET /api/links/search?q=...&type=hybrid` para búsqueda híbrida
- [ ] Endpoint `GET /api/links/search?q=...&type=text` para búsqueda por texto puro
- [ ] Resultados ordenados por score combinado
- [ ] El campo de búsqueda principal usa búsqueda híbrida por defecto
- [ ] Fallback: si pgvector no está disponible, usar solo keyword search
- [ ] Performance: respuesta en < 500ms para hasta 10K links

**Tareas:**
- [ ] Crear `packages/api/src/services/search.py` con lógica de búsqueda híbrida
- [ ] Implementar full-text search con PostgreSQL `tsvector/tsquery`
- [ ] Implementar búsqueda vectorial con pgvector (`<=>` operator, cosine distance)
- [ ] Implementar combinación de scores (weighted average)
- [ ] Crear endpoint en `packages/api/src/routers/links.py`
- [ ] Configurar pgvector index (ivfflat con 100 lists)
- [ ] Implementar fallback a keyword-only si pgvector falla
- [ ] Benchmark con dataset de prueba (mínimo 1000 links)
- [ ] Conectar búsqueda híbrida con SearchBar del frontend

**Estimación:** 10h

---

### HU-5.2 — Chatbot conversacional

**Como** usuario, quiero hacer preguntas en lenguaje natural sobre los links compartidos y recibir respuestas contextualizadas.

**Criterios de aceptación:**
- [ ] Endpoint `POST /api/chat` que recibe `{ message }`
- [ ] El chatbot busca contexto relevante de los links usando búsqueda semántica
- [ ] Construye un prompt con: sistema prompt + contexto de links relevantes + pregunta del usuario
- [ ] Llama a LLM con el prompt construido
- [ ] Respuesta devuelta en streaming (Server-Sent Events) o response completo
- [ ] Respuesta incluye referencias a los links consultados (mínimo 3)
- [ ] Límite de contexto: máximo 10 links relevantes por pregunta
- [ ] Respuesta en español por defecto (detectar idioma del user)
- [ ] Manejo de errores: si el LLM falla, respuesta de error amigable

**Tareas:**
- [ ] Crear `packages/api/src/services/chatbot.py` con lógica del chatbot
- [ ] Diseñar system prompt del chatbot (rol, capacidades, limitaciones)
- [ ] Implementar función `build_prompt(question, context_links)`
- [ ] Implementar función `get_relevant_context(question)` usando búsqueda híbrida
- [ ] Crear endpoint `POST /api/chat` en `packages/api/src/routers/chat.py`
- [ ] Implementar streaming con SSE (Server-Sent Events)
- [ ] Configurar temperature y max_tokens apropiados
- [ ] Probar con preguntas de ejemplo y verificar calidad de respuestas

**Estimación:** 10h

---

### HU-5.4 — Componente de chat en frontend

**Como** usuario, quiero una interfaz de chat intuitiva para interactuar con el chatbot.

**Criterios de aceptación:**
- [ ] Ventana de chat con burbujas de mensaje (estilo Discord/chat moderno)
- [ ] Mensajes del usuario alineados a la derecha, del bot a la izquierda
- [ ] Indicador de "escribiendo..." mientras el bot genera respuesta
- [ ] Streaming de respuesta (aparece palabra por palabra)
- [ ] Links referenciados en la respuesta son clicables
- [ ] Input de texto con placeholder: "Pregúntame sobre los links compartidos..."
- [ ] Botón de enviar con teclado (Enter)
- [ ] Scroll automático al último mensaje
- [ ] Responsive: ocupa toda la pantalla en móvil, panel lateral en desktop
- [ ] Error state: mensaje de error amigable si falla la petición

**Tareas:**
- [ ] Crear `packages/web/src/components/chat/ChatWindow.tsx`
- [ ] Crear `packages/web/src/components/chat/MessageBubble.tsx`
- [ ] Crear `packages/web/src/components/chat/ChatInput.tsx`
- [ ] Implementar streaming con EventSource / fetch stream
- [ ] Implementar indicador "escribiendo..."
- [ ] Implementar auto-scroll
- [ ] Parsear y hacer clicables los links en las respuestas
- [ ] Crear hook `useChat.ts` para gestión de estado del chat
- [ ] Integrar chat en la navegación principal
- [ ] Probar streaming y responsive

**Estimación:** 5h

---

## Dependencias entre historias

```
HU-5.1 (Búsqueda híbrida) ──→ HU-5.2 (Chatbot) ──→ HU-5.4 (UI Chat)
HU-5.2 (Chatbot) ──→ HU-5.4 (UI Chat)
```

## Aceptación de la Epic

- [ ] Búsqueda híbrida funciona: encuentra resultados semánticamente relevantes
- [ ] Performance < 500ms con dataset de prueba
- [ ] Chatbot responde preguntas sobre links compartidos con contexto relevante
- [ ] Respuestas incluyen referencias a links específicos

- [ ] Interfaz de chat moderna con streaming, burbujas, indicador "escribiendo..."
- [ ] Responsive: móvil y desktop
- [ ] pgvector index funcionando correctamente
