# Epic Update: 005-busqueda-chatbot.md

## Resumen cambiado

**Antes:** Búsqueda híbrida (keyword + vector) con pgvector y un chatbot conversacional que responde preguntas sobre los links compartidos.

**Ahora:** Búsqueda híbrida se mantiene para la página de exploración, pero el chatbot ha sido reemplazado por un agente NL2SQL que traduce preguntas en lenguaje natural a queries PostgreSQL.

**Nueva estimación del chat:** ~8-10h (más simple que el chat anterior — no requiere búsqueda semántica ni gestión de contexto de links)

---

## Historias de Usuario actualizadas

### HU-5.2 — Chat NL2SQL (reemplaza el chatbot anterior)

**Como** usuario, quiero hacer preguntas en lenguaje natural sobre los datos de la base de datos y recibir queries SQL generadas automáticamente.

**Criterios de aceptación:**
- [ ] Endpoint `POST /api/chat/message` que recibe `{ message }`
- [ ] Endpoint `POST /api/chat/message/stream` para streaming con SSE
- [ ] El chatbot inyecta el schema SQL completo en el system prompt
- [ ] Construye un prompt con: system prompt template + schema SQL + pregunta del usuario
- [ ] Llama a LLM con el prompt construido
- [ ] Respuesta devuelta en formato fenced ````sql` block
- [ ] Respuesta incluye comentarios con `-- tables:` y `-- assumptions:`
- [ ] Solo genera queries SELECT/WITH — rechaza operaciones de escritura
- [ ] Streaming de respuesta (Server-Sent Events)
- [ ] Manejo de errores: si el LLM falla, respuesta de error amigable

**Tareas:**
- [ ] Crear `packages/api/src/prompts/nl2sql.system.md` con prompt template
- [ ] Crear `packages/api/src/prompts/schema.sql` con DDL limpio
- [ ] Reescribir `build_prompt()` en `chatbot.py` para inyectar schema
- [ ] Eliminar `SearchService` y `get_relevant_context()` del router
- [ ] Actualizar frontend para eliminar UI de referencias de links
- [ ] Probar queries generadas con preguntas de ejemplo

**Estimación:** 8-10h

---

### HU-5.4 — Componente de chat en frontend (actualizado)

**Como** usuario, quiero una interfaz de chat para hacer preguntas sobre los datos de la base de datos.

**Criterios de aceptación:**
- [ ] Ventana de chat con burbujas de mensaje
- [ ] Mensajes del usuario alineados a la derecha, del bot a la izquierda
- [ ] Indicador de "escribiendo..." mientras el bot genera respuesta
- [ ] Streaming de respuesta
- [ ] El SQL generado se muestra formateado en el mensaje del bot
- [ ] Input de texto con placeholder: "Pregúntame algo sobre los datos..."
- [ ] Botón de enviar con teclado (Enter)
- [ ] Scroll automático al último mensaje
- [ ] Responsive: ocupa toda la pantalla en móvil, panel lateral en desktop
- [ ] Error state: mensaje de error amigable si falla la petición
- [ ] **Eliminada** la UI de referencias a links

**Tareas:**
- [ ] Actualizar `MessageResponse` type para eliminar `references`
- [ ] Actualizar `ChatWindow.tsx` para mostrar SQL formateado
- [ ] Actualizar `useChat.ts` para manejar el nuevo formato de respuesta
- [ ] Actualizar `api.ts` para eliminar referencias del cliente
- [ ] Eliminar componente de referencias de links

**Estimación:** 3-4h

---

## Lo que se mantiene del epic original

- **HU-5.1 (Búsqueda híbrida):** Se mantiene intacta para la página de exploración de links
- **HU-5.4 (UI Chat):** Se reemplaza la lógica de referencias por display de SQL

## Lo que se elimina del epic original

- Búsqueda semántica para el chat (pgvector ya no se usa en el endpoint de chat)
- Contexto de links relevantes por pregunta
- UI de referencias a links en los mensajes del chat
- `get_relevant_context()` y toda la lógica de búsqueda híbrida del chat

## Dependencias entre historias (actualizadas)

```
HU-5.1 (Búsqueda híbrida) ──→ Se mantiene para exploración de links
HU-5.2 (NL2SQL Chat) ──→ HU-5.4 (UI Chat actualizada)
```

## Aceptación de la Epic (actualizada)

- [ ] Búsqueda híbrida funciona en exploración de links
- [ ] Chatbot NL2SQL genera queries SQL correctas
- [ ] Schema SQL inyectado correctamente en el system prompt
- [ ] Respuestas siguen el output contract (fenced SQL block)
- [ ] Interfaz de chat moderna con streaming y burbujas
- [ ] Responsive: móvil y desktop
- [ ] pgvector index sigue funcionando para búsqueda de links (no para chat)
