# Epic: Frontend de Exploración

## Resumen

Construir la interfaz principal de exploración: grid de cards, barra de búsqueda, filtros avanzados, paginación y diseño visual que replica exactamente el look & feel de nan.builders — el sitio y sus docs.

**Estimación:** ~30h
**Riesgo:** Medio
**Dependencias:** Epic 002 (API CRUD, OAuth, frontend base)

---

## Sistema de Diseño — Réplica exacta de nan.builders

El frontend replica pixel-by-pixel el estilo de [nan.builders](https://nan.builders) y [nan.builders/docs](https://nan.builders/docs). Cada componente debe sentirse parte del mismo sitio.

### Estructura visual general

- **Comentarios de sección**: Cada sección del body empieza con un comentario de código `// nombre de sección` en mono, 13px, color `#999`, en mayúsculas o con capitalización natural.
- **Títulos de sección**: H2 con `font-size: 28px`, `font-weight: 600`, `letter-spacing: -0.02em`, `line-height: 1.2`. Color `#0a0a0a`.
- **Espaciado vertical entre secciones**: `padding: 80px 0` mínimo. Los bloques se separan con `border-bottom: 1px solid #e5e5e5`.
- **Contenedor**: `max-width: 1100px`, `margin: 0 auto`, `padding: 0 24px`.
- **Footer**: `padding: 40px 0`, borde superior `1px solid #e5e5e5`, texto `nan.builders © 2026` en mono 12px color `#999`.

### Paleta

| Rol | Color | Uso |
|---|---|---|
| Fondo | `#ffffff` | Fondo principal |
| Fondo secundario | `#f6f6f6` | Bloques de código |
| Texto principal | `#0a0a0a` | Títulos, cuerpo |
| Texto secundario | `#666666` | Descripciones |
| Texto terciario | `#999999` | Metadatos, comentarios |
| Acento | `#000000` | Botones sólidos, hover |
| Bordes | `#e5e5e5` | Separadores 1px |

**Sin dark mode.** nan.builders es claro por defecto. No invertir.

### Tipografía

- **Cuerpo / UI:** Inter, 15px, `line-height: 1.6`.
- **Títulos:** Inter, `letter-spacing: -0.02em`, `line-height: 1.2`.
- **Código / técnico:** JetBrains Mono o SF Mono, 13-14px.
- **Comentarios de sección:** Mono, 13px, color `#999`.
- **Valores en info-cards:** Mono, 13px, color `#0a0a0a`.

### Componentes clave

#### Botones

- **Primario:** `background: #000`, `color: #fff`, `padding: 10px 20px`, `border-radius: 6px`, `font-weight: 500`, `font-size: 14px`, `border: none`. Hover: `opacity: 0.85`.
- **Outline / secundario:** `background: transparent`, `color: #0a0a0a`, `border: 1px solid #e5e5e5`, `border-radius: 6px`, `padding: 8px 16px`. Hover: `border-color: #0a0a0a`.

#### Bloques de código

- Fondo `#f6f6f6`, borde izquierdo `2px solid #000`, `border-radius: 6px`, `padding: 16px 20px`.
- Etiqueta del lenguaje arriba a la izquierda: texto mono 11px en mayúsculas, color `#666`.
- Botón "Copiar" arriba a la derecha, borde fino, texto "Copiar" en mono 11px.
- Fuente: `JetBrains Mono` o `SF Mono`, 13-14px, `line-height: 1.5`.
- Sin syntax highlighting colorido — texto negro/gris sobre gris claro.

#### Info-cards (estilo /docs/models)

- Bordes finos 1px `#e5e5e5`. Sin sombra.
- Pares `clave: valor` con valor en mono.
- Separadores `1px solid #e5e5e5` entre secciones dentro de la card.
- Títulos de modelo: H3 grande con nombre + subtítulo mono para tipo.
- Tags de categoría (llm, embedding, tts, stt): pequeño badge con borde fino, texto mono.

#### Acordeón (FAQ)

- Cada pregunta es un botón con `+` a la derecha.
- Respuesta expandida con `padding-top: 8px`, `color: #666`.
- Sin iconos decorativos, sin animaciones elaborate.

#### Navegación de docs

- Breadcrumb: `Docs / Getting Started` en mono 13px, color `#666`.
- Navegación anterior/siguiente: `← anterior Introduction` / `siguiente → Models` en la parte inferior del contenido.
- TOC lateral derecha: lista de headings con `font-size: 12px`, color `#666`, enlace activo en `#0a0a0a` con borde izquierdo 2px.

#### Grid de cards (exploración)

- Cards con `border: 1px solid #e5e5e5`, `border-radius: 6px`, `background: #fff`.
- Hover: `border-color: #0a0a0a`, sin sombra, sin transform.
- Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, `gap: 16px`.
- Icono de fuente: SVG lineal pequeño, color según source.
- Tags: borde fino `1px solid #e5e5e5`, fondo `#f6f6f6`, texto `#666`, mono 11px.
- Autor: avatar circular 20px + nombre en mono 11px color `#666`.
- Fecha: mono 11px color `#999`.

#### Barra de búsqueda

- Input con `border: 1px solid #e5e5e5`, `border-radius: 6px`, `padding: 8px 12px`, `background: #fff`.
- Focus: `border-color: #0a0a0a`.
- Icono de lupa lineal a la izquierda, color `#999`.
- Kbd `/` a la derecha, estilo `border: 1px solid #e5e5e5`, `background: #f6f6f6`, mono 10px.

#### Filtros

- Panel colapsable con `border: 1px solid #e5e5e5`, `border-radius: 6px`, `background: #fafafa`.
- Cada filtro es un dropdown o input con `border: 1px solid #e5e5e5`, `background: #fff`.
- Dropdown: `border: 1px solid #e5e5e5`, `border-radius: 6px`, `background: #fff`, sin sombra.
- Botón "Clear all": outline, texto `#666`, hover `border-color: #0a0a0a` y `color: #0a0a0a`.

#### Paginación

- Botones numéricos: `border: 1px solid #e5e5e5`, `border-radius: 6px`, `width: 32px`, `height: 32px`, `font-size: 13px`, `font-weight: 400`.
- Activo: `background: #f6f6f6`, `border-color: #e5e5e5`, `font-weight: 600`.
- Hover (no activo): `border-color: #0a0a0a`.
- Labels "Prev" / "Next" acortados, con flechas SVG lineales.
- Contador de items: `font-size: 12px`, color `#999`, mono.

#### Skeleton loading

- Bloques rectangulares con `background: #f0f0f0`, `border-radius: 4px`.
- Animación `pulse`: `opacity: 1 → 0.5 → 1` en 1.5s, ease-in-out.
- Sin gradientes, sin colores.

#### Empty state

- SVG lineal `stroke-width: 1.5`, color `#e5e5e5`, 40x40px.
- Título: `font-size: 14px`, `font-weight: 500`, color `#666`.
- Subtítulo: `font-size: 13px`, color `#999`.

### Principios

- **Cero ruido decorativo:** sin emojis, sin ilustraciones, sin gradientes, sin sombras, sin patrones de fondo, sin glassmorphism.
- **Comentarios de código como estructura visual:** `// section name` como separadores de sección.
- **Mono para todo lo técnico:** valores, metadatos, fechas, IDs, fuentes.
- **Transiciones:** 150-250ms, solo en hover y cambios de estado.
- **Bordes 1px como separador universal:** nunca márgenes excesivos para separar secciones menores.
- **Navegación tipo docs:** breadcrumb, prev/next al final, TOC lateral.

---

## Historias de Usuario

### HU-4.1 — Grid de cards con diseño nan.builders

**Como** usuario, quiero ver los links compartidos en un grid con el estilo exacto de nan.builders/docs/models para explorar rápidamente el contenido.

**Criterios de aceptación:**
- [ ] Cards con: icono de fuente (SVG lineal), título, descripción, tags (mono, borde fino), autor (avatar 20px + nombre mono), fecha (mono relativa), canal
- [ ] Diseño idéntico a nan.builders: fondo blanco, borde 1px `#e5e5e5`, sin sombra, sin transform en hover
- [ ] Hover effect: solo cambio de borde a `#0a0a0a`, 200ms transition
- [ ] Click en card abre el link en nueva pestaña
- [ ] Icono de fuente según dominio (GitHub, Twitter, YouTube, etc.) — SVG lineal, color por source
- [ ] Tags renderizados como badges: `border: 1px solid #e5e5e5`, `background: #f6f6f6`, texto mono 11px color `#666`
- [ ] Fecha formateada relativa ("2h ago", "3d ago") en mono 11px color `#999`
- [ ] Avatar del autor de Discord con tooltip del username
- [ ] Skeleton loading: bloques `#f0f0f0` con animación pulse
- [ ] Empty state: SVG lineal `stroke-width: 1.5`, texto sobrio, sin ilustraciones

**Tareas:**
- [ ] Crear `packages/web/src/components/links/LinkCard.tsx`
- [ ] Crear `packages/web/src/components/links/LinkGrid.tsx`
- [ ] Configurar iconos de fuente en `packages/web/src/lib/sources.ts` con SVGs lineales
- [ ] Implementar formateo de fechas relativas
- [ ] Implementar skeleton loading
- [ ] Implementar empty state
- [ ] Replicar exactamente el estilo de nan.builders: paleta, tipografía, bordes, espaciado
- [ ] Probar responsive: grid 1 col (móvil) → 2 cols (tablet) → 3 cols (desktop)

**Estimación:** 10h

---

### HU-4.2 — Barra de búsqueda

**Como** usuario, quiero buscar links por texto para encontrar contenido específico rápidamente, con el estilo de input de nan.builders/docs.

**Criterios de aceptación:**
- [ ] Barra de búsqueda en la parte superior del grid
- [ ] Búsqueda por: título, descripción, tags, URL
- [ ] Búsqueda en tiempo real (debounce 300ms)
- [ ] Resultado: "X results for '...'" en mono 12px color `#999`
- [ ] Búsqueda vacía → muestra todos los links (paginados)
- [ ] Icono de lupa lineal en la barra, color `#999`
- [ ] Placeholder: "Search links, tags, authors..."
- [ ] Clear button (×) cuando hay texto
- [ ] Atajo de teclado: `/` para focus en la barra de búsqueda
- [ ] Input con `border: 1px solid #e5e5e5`, focus `border-color: #0a0a0a`, sin sombra

**Tareas:**
- [ ] Crear `packages/web/src/components/links/SearchBar.tsx`
- [ ] Implementar debounce de 300ms
- [ ] Conectar con API: `GET /api/links?q=...`
- [ ] Backend: implementar búsqueda full-text en PostgreSQL (`tsvector`)
- [ ] Implementar atajo de teclado `/` con hook
- [ ] Replicar estilo exacto: input limpio, kbd `/` a la derecha, icono lineal

**Estimación:** 5h

---

### HU-4.3 — Filtros avanzados

**Como** usuario, quiero filtrar links por fuente, tags, rango de fechas y canal para refinar los resultados, con el estilo de los componentes de nan.builders.

**Criterios de aceptación:**
- [ ] Filtro por fuente: dropdown con checkboxes (GitHub, Twitter, YouTube, etc.)
- [ ] Filtro por tags: dropdown con tags detectados (multiselect)
- [ ] Filtro por rango de fechas: date range picker (desde/hasta)
- [ ] Filtro por canal: dropdown con canales del servidor
- [ ] Filtro por autor: dropdown con autores (top 50 más activos)
- [ ] Botón "Clear all" con estilo outline, texto `#666`
- [ ] Contador de filtros activos visible (badge mono)
- [ ] Filtros combinables entre sí
- [ ] Filtros persisten en URL (query params) para poder compartir
- [ ] UI: panel colapsable con `border: 1px solid #e5e5e5`, `background: #fafafa`
- [ ] Dropdowns sin sombra, solo borde fino

**Tareas:**
- [ ] Crear `packages/web/src/components/links/LinkFilters.tsx`
- [ ] Implementar cada filtro con componentes UI reutilizables
- [ ] Implementar lógica de combinación de filtros
- [ ] Persistir filtros en URL query params
- [ ] Implementar backend: filtros en `GET /api/links` con query params
- [ ] Panel colapsable con flecha `>` que rota 90deg en hover
- [ ] Botón clear filters
- [ ] Replicar estilo exacto: bordes 1px, inputs limpios, dropdowns sin sombra

**Estimación:** 8h

---

### HU-4.4 — Paginación / Infinite scroll

**Como** usuario, quiero navegar entre páginas de links para explorar todo el contenido sin sobrecarga, con la paginación estilo nan.builders.

**Criterios de aceptación:**
- [ ] Paginación numérica (1, 2, 3, ...) con "prev/next" (labels cortos, no "anterior/siguiente")
- [ ] Opción de infinite scroll como alternativa (toggle en settings)
- [ ] 20 links por página (configurable)
- [ ] Loader visible al cargar página siguiente
- [ ] Scroll to top al cambiar de página
- [ ] Estado final: "No more results"
- [ ] La paginación funciona con filtros activos
- [ ] URL actualizada con `?page=N`
- [ ] Contador de items: "1-20 of 150" en mono 12px color `#999`
- [ ] Botones numéricos: 32x32px, borde 1px, activo con `background: #f6f6f6`

**Tareas:**
- [ ] Crear componente de paginación en `packages/web/src/components/ui/`
- [ ] Implementar paginación numérica con estilo nan.builders
- [ ] Implementar infinite scroll como alternativa (IntersectionObserver)
- [ ] Toggle entre paginación e infinite scroll (localStorage preference)
- [ ] Conectar con API: `GET /api/links?page=N&per_page=20`
- [ ] Backend: implementar paginación con offset/limit
- [ ] Probar paginación con filtros activos
- [ ] Probar scroll to top

**Estimación:** 7h

---

## Dependencias entre historias

```
HU-4.1 (Cards) ──→ HU-4.2 (Search) ──→ HU-4.3 (Filters) ──→ HU-4.4 (Pagination)
```

## Aceptación de la Epic

- [ ] Grid de cards con diseño idéntico a nan.builders (fondo blanco, borde 1px, sin sombra, sin transform)
- [ ] Cards muestran toda la info: fuente, título, descripción, tags, autor, fecha, canal
- [ ] Búsqueda en tiempo real por título, descripción, tags, URL
- [ ] Filtros por fuente, tags, fechas, canal, autor — combinables y persistentes en URL
- [ ] Paginación numérica + infinite scroll (toggle)
- [ ] Responsive: móvil, tablet, desktop
- [ ] Skeleton loading + empty state
- [ ] Transiciones discretas (150-250ms), cero ruido decorativo
- [ ] Atajo de teclado `/` para focus en búsqueda
- [ ] Tipografía Inter + JetBrains Mono, paleta exacta de nan.builders
- [ ] Comentarios `// section` como separadores visuales en el layout
