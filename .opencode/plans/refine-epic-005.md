# Plan: Refinar Epic 005 - Eliminar Historial de Conversaciones

## Objetivo

Eliminar la HU-5.3 (Historial de conversaciones) del epic 005 y simplificar el chatbot para que solo mantenga la conversación en curso sin persistencia entre sesiones.

## Cambios en `docs/epics/005-busqueda-chatbot.md`

### 1. Actualizar estimación y riesgo
- **Antes:** ~30h, Riesgo Medio-Alto
- **Después:** ~23h, Riesgo Medio

### 2. Eliminar HU-5.3 completa
Eliminar toda la sección "HU-5.3 — Historial de conversaciones" (líneas 73-100).

### 3. Actualizar HU-5.2 (Chatbot conversacional)
- Quitar `conversation_id?` del endpoint `POST /api/chat`
- Quitar tarea de implementar función con conversation_id
- Mantener solo: mensaje del usuario + contexto relevante

### 4. Actualizar HU-5.4 (Componente de chat en frontend)
- Quitar criterio: "UI: sidebar con lista de conversaciones (colapsable en móvil)"
- Quitar tarea: "Sidebar con lista de conversaciones"
- Quitar tarea: "Crear nueva conversación con botón '+'"
- Quitar tarea: "Borrar conversación con confirmación"
- Quitar tarea: "Conectar con API desde frontend" (solo la parte de historial)
- Quitar tarea: "Probar flujo completo: crear → chatear → ver historial → borrar"
- Mantener solo: chat en vivo sin persistencia

### 5. Actualizar diagrama de dependencias
```
HU-5.1 (Búsqueda híbrida) ──→ HU-5.2 (Chatbot) ──→ HU-5.4 (UI Chat)
HU-5.2 (Chatbot) ──→ HU-5.4 (UI Chat)
```
Eliminar referencia a HU-5.3.

### 6. Actualizar criterios de aceptación de la Epic
- Quitar: "Historial de conversaciones guardado y recuperable"
- Quitar: "Máximo 50 conversaciones por usuario (auto-limpieza)"

## Cambios en `docs/CONTEXT.md`

### Eliminar tablas de chat
Eliminar las siguientes tablas del esquema de base de datos (líneas ~150-165):

```sql
-- Interacciones con el chatbot
CREATE TABLE chat_conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT REFERENCES users(id),
    session_id  UUID NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL,           -- 'user' | 'assistant'
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

## Impacto

- **Reducción de trabajo:** ~7h menos (HU-5.3 eliminada)
- **Complejidad reducida:** No se necesita gestión de sesiones, limpieza automática, CRUD de conversaciones
- **Frontend simplificado:** Sin sidebar de historial, solo componente de chat en vivo
- **DB más simple:** Sin tablas adicionales de chat
