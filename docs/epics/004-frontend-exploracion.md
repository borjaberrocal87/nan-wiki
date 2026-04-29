# Epic: Frontend de Exploración

## Resumen

Construir la interfaz principal de exploración: grid de cards, barra de búsqueda, filtros avanzados, paginación y diseño visual que replica exactamente el look & feel de nan.builders — el sitio y sus docs.

**Estimación:** ~30h
**Riesgo:** Medio
**Dependencias:** Epic 002 (API CRUD, OAuth, frontend base)

---

## Sistema de Diseño — Dark theme Material 3

El frontend usa un dark theme con paleta violeta inspirada en Material Design 3. Tipografía con Space Grotesk para títulos, Inter para UI y JetBrains Mono para código.

### Estructura visual general

- **Comentarios de sección**: Cada sección del body empieza con un comentario de código `// nombre de sección` usando la clase `.section-comment` (mono, 13px, `--text-tertiary`).
- **Títulos de sección**: H2 con `font-size: 32px`, `font-weight: 600`, `letter-spacing: -0.01em`, `line-height: 1.2`. Fuente Space Grotesk.
- **Espaciado vertical entre secciones**: `padding: 80px 0` mínimo. Separadores con `.section-divider` (border-bottom 1px `--border-color`).
- **Contenedor**: `max-width: 1100px`, `margin: 0 auto`, `padding: 0 24px`.
- **Footer**: `padding: 40px 0`, borde superior `1px solid var(--border-color)`.

### Paleta

| Rol | Token CSS | Color | Uso |
|---|---|---|---|
| Fondo principal | `--bg-primary` | `#131313` | Fondo de la página |
| Fondo secundario | `--bg-secondary` | `#1c1b1b` | Bloques de código, fondos alternativos |
| Fondo superficie low | `--bg-surface-container-lowest` | `#0e0e0e` | Cards, contenedores |
| Fondo superficie container | `--bg-surface-container` | `#1c1b1b` | Inputs, botones outline |
| Fondo superficie high | `--bg-surface-container-high` | `#2a2a2a` | Skeletons |
| Texto principal | `--text-primary` | `#e5e2e1` | Títulos, cuerpo |
| Texto secundario | `--text-secondary` | `#ccc3d8` | Descripciones |
| Texto terciario | `--text-tertiary` | `#958da1` | Metadatos, fechas |
| Acento principal | `--accent-primary-container` | `#7c3aed` | Botones sólidos, focus, active |
| Bordes | `--border-color` | `#4a4455` | Separadores 1px |
| Bordes outline | `--border-outline-variant` | `#4a4455` | Tags, inputs |

### Tipografía

- **Títulos:** Space Grotesk, `letter-spacing: -0.02em`, `line-height: 1.1`.
- **Cuerpo / UI:** Inter, 14-15px, `line-height: 1.6`.
- **Código / técnico:** JetBrains Mono, 13px, `line-height: 1.5`.
- **Comentarios de sección:** Mono, 13px, `var(--text-tertiary)`.
- **Valores en info-cards:** Mono, 13px, `var(--text-primary)`.

### Componentes clave

#### Botones

- **Primario (`.btn-primary`):** `background: var(--accent-primary-container)`, `color: var(--text-on-primary-container)`, `padding: 10px 20px`, `border-radius: 4px`, `font-weight: 600`, `font-size: 14px`, `border: none`. Hover: `filter: brightness(1.1)`.
- **Outline (`.btn-outline`):** `background: transparent`, `color: var(--text-primary)`, `border: 1px solid var(--border-outline-variant)`, `border-radius: 4px`, `padding: 8px 16px`. Hover: `border-color: var(--accent-primary-container)`, `color: var(--accent-primary-container)`.

#### Bloques de código (`.code-block`)

- Fondo `var(--bg-secondary)`, borde izquierdo `2px solid var(--accent-primary-container)`, `border-radius: 4px`, `padding: 16px 20px`.
- Etiqueta del lenguaje arriba a la izquierda: `.code-block-label` — texto mono 11px en mayúsculas, color `var(--text-secondary)`.
- Botón "Copiar" arriba a la derecha: `.code-block-copy` — borde fino, texto "Copiar" en mono 11px.
- Fuente: `JetBrains Mono`, 13px, `line-height: 1.5`.
- Sin syntax highlighting colorido — texto claro sobre fondo oscuro.

#### Info-cards (`.info-card`)

- Bordes finos 1px `var(--border-color)`. Sin sombra.
- Pares `clave: valor` con valor en mono.
- Separadores `1px solid var(--border-color)` entre secciones dentro de la card.
- Títulos de modelo: H3 grande con nombre + subtítulo mono para tipo.
- Tags de categoría (llm, embedding, tts, stt): `.category-tag` — pequeño badge con borde fino, texto mono.

#### Acordeón (FAQ)

- Cada pregunta es un botón con `+` a la derecha.
- Respuesta expandida con `padding-top: 8px`, `color: var(--text-secondary)`.
- Sin iconos decorativos, sin animaciones elaborate.

#### Navegación de docs

- Breadcrumb (`.breadcrumb`): `Docs / Getting Started` en mono 13px, color `var(--text-tertiary)`.
- Navegación anterior/siguiente (`.doc-nav`): `← anterior Introduction` / `siguiente → Models` en la parte inferior del contenido.

#### Grid de cards (exploración)

- Cards con `border: 1px solid var(--border-color)`, `border-radius: 4px`, `background: var(--bg-surface-container-lowest)`.
- Hover: `border-color: var(--accent-primary-container)`, `box-shadow: 0 0 12px rgba(124, 58, 237, 0.15)`.
- Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, `gap: 16px`.
- Icono de fuente: SVG lineal pequeño, color `var(--accent-primary-container)`.
- Tags: borde fino `1px solid var(--border-outline-variant)`, fondo `var(--bg-secondary)`, texto `var(--text-secondary)`, mono 11px.
- Autor: avatar circular 20px + nombre en mono 11px color `var(--text-tertiary)`.
- Fecha: mono 11px color `var(--text-tertiary)`.

#### Barra de búsqueda

- Input con `border: 1px solid var(--border-color)`, `border-radius: 4px`, `background: var(--bg-surface-container)`.
- Focus: `border-color: var(--accent-primary-container)`.
- Icono de lupa lineal a la izquierda, color `var(--text-tertiary)`.
- Clear button (×) cuando hay texto.
- Atajo de teclado: `/` para focus en la barra de búsqueda.
- Resultado: "X results for '...'" en mono 12px color `var(--text-tertiary)`.

#### Filtros

- Panel colapsable con `border: 1px solid var(--border-color)`, `border-radius: 4px`, `background: var(--bg-surface-container-lowest)`.
- Cada filtro es un dropdown o input con `border: 1px solid var(--border-color)`, `background: var(--bg-surface-container)`.
- Dropdown: `border: 1px solid var(--border-color)`, `border-radius: 4px`, `background: var(--bg-surface-container-lowest)`, sin sombra.
- Botón "Clear all": `.btn-outline`, texto `var(--text-tertiary)`, hover `border-color: var(--accent-primary-container)` y `color: var(--accent-primary-container)`.
- Filtros: source_id (multiselect con checkboxes), tags (multiselect), channel (single select), author (single select), date range (desde/hasta).
- Contador de filtros activos visible (mono, color `var(--accent-primary-container)`).

#### Paginación

- Botones numéricos: `border: 1px solid var(--border-color)`, `border-radius: 4px`, `width: 32px`, `height: 32px`, `font-size: 13px`, `font-weight: 400`.
- Activo: `background: var(--accent-primary-container)`, `border-color: var(--accent-primary-container)`, `color: var(--text-on-primary-container)`, `font-weight: 600`.
- Hover (no activo): `border-color: var(--accent-primary-container)`.
- Labels "Prev" / "Next" con flechas SVG lineales.
- Contador de items: "1-20 of 150" en mono 12px color `var(--text-tertiary)`.
- Infinite scroll como alternativa: `localStorage` preference (`link-library-prefers-infinite-scroll`), `IntersectionObserver` con `rootMargin: 200px`.
- Scroll to top al cambiar de página (solo paginación numérica).

#### Skeleton loading

- Bloques rectangulares con `background-color: var(--bg-surface-container-high)`, `border-radius: 4px`.
- Animación `skeleton-pulse`: `opacity: 1 → 0.4 → 1` en 1.5s, ease-in-out (clase `.skeleton`).
- Sin gradientes, sin colores.

#### Empty state

- SVG lineal `stroke-width: 1.5`, color `var(--border-color)`, 40x40px.
- Título: `font-size: 14px`, `font-weight: 500`, color `var(--text-secondary)`.
- Subtítulo: `font-size: 13px`, color `var(--text-tertiary)`.

### Principios

- **Dark theme Material 3:** paleta violeta con tokens CSS (`--accent-primary-container`, `--bg-surface-container-lowest`, etc.).
- **Comentarios de código como estructura visual:** `// section name` como separadores de sección (clase `.section-comment`).
- **Mono para todo lo técnico:** valores, metadatos, fechas, IDs, fuentes.
- **Transiciones:** 150-250ms, solo en hover y cambios de estado.
- **Bordes 1px como separador universal:** nunca márgenes excesivos para separar secciones menores.
- **Navegación tipo docs:** breadcrumb, prev/next al final.
- **Hover con glow:** cards con `box-shadow: 0 0 12px rgba(124, 58, 237, 0.15)` en hover.
- **Clases pre-built:** usar `.btn-primary`, `.btn-outline`, `.input`, `.skeleton`, `.code-block`, `.info-card` definidas en `globals.css` en lugar de inline styles.

---

## Historias de Usuario

### HU-4.1 — Grid de cards con diseño nan.builders

**Como** usuario, quiero ver los links compartidos en un grid con el estilo exacto de nan.builders/docs/models para explorar rápidamente el contenido.

**Criterios de aceptación:**
- [x] Cards con: icono de fuente (SVG lineal), título, descripción, tags (mono, borde fino), autor (avatar 20px + nombre mono), fecha (mono relativa), canal
- [x] Diseño dark theme Material 3: fondo `var(--bg-surface-container-lowest)`, borde 1px `var(--border-color)`, hover con glow violeta
- [x] Hover effect: borde `var(--accent-primary-container)` + `box-shadow: 0 0 12px rgba(124, 58, 237, 0.15)`, 200ms transition
- [x] Click en card abre el link en nueva pestaña
- [x] Icono de fuente según dominio (GitHub, Twitter, YouTube, etc.) — SVG lineal, color `var(--accent-primary-container)`
- [x] Tags renderizados como badges: `border: 1px solid var(--border-outline-variant)`, `background: var(--bg-secondary)`, texto mono 11px color `var(--text-secondary)`
- [x] Fecha formateada relativa ("2h ago", "3d ago") en mono 11px color `var(--text-tertiary)`
- [x] Avatar del autor de Discord con tooltip del username
- [x] Skeleton loading: bloques `var(--bg-surface-container-high)` con animación `.skeleton` (1.5s pulse)
- [x] Empty state: SVG lineal `stroke-width: 1.5`, texto sobrio, sin ilustraciones

**Tareas:**
- [x] Crear `packages/web/src/components/links/LinkCard.tsx`
- [x] Crear `packages/web/src/components/links/LinkGrid.tsx`
- [x] Configurar iconos de fuente en `packages/web/src/lib/sources.ts` con SVGs lineales
- [x] Implementar formateo de fechas relativas
- [x] Implementar skeleton loading
- [x] Implementar empty state
- [x] Replicar dark theme Material 3: paleta violeta, tipografía (Space Grotesk + Inter + JetBrains Mono), bordes, espaciado
- [x] Probar responsive: grid 1 col (móvil) → 2 cols (tablet) → 3 cols (desktop)

**Estimación:** 10h

---

### HU-4.2 — Barra de búsqueda

**Como** usuario, quiero buscar links por texto para encontrar contenido específico rápidamente, con el estilo de input de nan.builders/docs.

**Criterios de aceptación:**
- [x] Barra de búsqueda en la parte superior del grid
- [x] Búsqueda por: título, descripción, tags, URL
- [x] Búsqueda en tiempo real (debounce 300ms)
- [x] Resultado: "X results for '...'" en mono 12px color `var(--text-tertiary)`
- [x] Búsqueda vacía → muestra todos los links (paginados)
- [x] Icono de lupa lineal en la barra, color `var(--text-tertiary)`
- [x] Placeholder: "Search links, tags, authors..."
- [x] Clear button (×) cuando hay texto
- [x] Atajo de teclado: `/` para focus en la barra de búsqueda
- [x] Input con `border: 1px solid var(--border-color)`, focus `border-color: var(--accent-primary-container)`, background `var(--bg-surface-container)`

**Tareas:**
- [x] Crear `packages/web/src/components/links/SearchBar.tsx`
- [x] Implementar debounce de 300ms
- [x] Conectar con API: `GET /api/links?q=...`
- [x] Backend: implementar búsqueda full-text en PostgreSQL (`tsvector`)
- [x] Implementar atajo de teclado `/` con hook
- [x] Replicar estilo dark theme: input limpio, icono lineal, sin kbd visual

**Estimación:** 5h

---

### HU-4.3 — Filtros avanzados

**Como** usuario, quiero filtrar links por fuente, tags, rango de fechas y canal para refinar los resultados, con el estilo de los componentes de nan.builders.

**Criterios de aceptación:**
- [x] Filtro por fuente: dropdown con checkboxes (GitHub, Twitter, YouTube, etc.) — usa `source_id`
- [x] Filtro por tags: dropdown con tags detectados (multiselect)
- [x] Filtro por rango de fechas: date range picker (desde/hasta)
- [x] Filtro por canal: dropdown con canales del servidor (single select)
- [x] Filtro por autor: dropdown con autores (single select)
- [x] Botón "Clear all" con estilo `.btn-outline`, texto `var(--text-tertiary)`
- [x] Contador de filtros activos visible (badge mono, color `var(--accent-primary-container)`)
- [x] Filtros combinables entre sí
- [x] Filtros persisten en URL (query params) para poder compartir
- [x] UI: panel colapsable con `border: 1px solid var(--border-color)`, `background: var(--bg-surface-container-lowest)`
- [x] Dropdowns sin sombra, solo borde fino

**Tareas:**
- [x] Crear `packages/web/src/components/links/LinkFilters.tsx`
- [x] Implementar cada filtro con componentes inline (sin librería externa)
- [x] Implementar lógica de combinación de filtros
- [x] Persistir filtros en URL query params
- [x] Implementar backend: filtros en `GET /api/links` con query params
- [x] Panel colapsable con flecha `>` que rota 90deg en hover
- [x] Botón clear filters
- [x] Replicar estilo dark theme: bordes 1px, inputs limpios, dropdowns sin sombra

**Estimación:** 8h

---

### HU-4.4 — Paginación / Load more

**Como** usuario, quiero navegar entre páginas de links para explorar todo el contenido sin sobrecarga, con la paginación estilo nan.builders.

**Criterios de aceptación:**
- [x] Paginación numérica (1, 2, 3, ...) con "prev/next" (labels cortos, no "anterior/siguiente") — vista tabla
- [x] "Load more" botón explícito — vista grid (appende cards, no reemplaza)
- [x] 20 links por página (configurable en `PER_PAGE`)
- [x] Loader visible al cargar página siguiente
- [x] Scroll to top al cambiar de página (solo paginación numérica, vista tabla)
- [x] Estado final: "No more results"
- [x] La paginación funciona con filtros activos
- [x] URL actualizada con query params (sin `page` en filters)
- [x] Contador de items: "1-20 of 150" en mono 12px color `var(--text-tertiary)`
- [x] Botones numéricos: 32x32px, borde 1px, activo con `background: var(--accent-primary-container)`

**Tareas:**
- [x] Crear componente de paginación en `packages/web/src/components/links/Pagination.tsx`
- [x] Implementar paginación numérica con estilo dark theme (vista tabla)
- [x] Implementar "Load more" botón explícito con append de cards (vista grid)
- [x] Conectar con API: `GET /api/links?page=N&per_page=20`
- [x] Backend: implementar paginación con offset/limit
- [x] Probar paginación con filtros activos
- [x] Probar scroll to top

**Estimación:** 7h

---

## Dependencias entre historias

```
HU-4.1 (Cards) ──→ HU-4.2 (Search) ──→ HU-4.3 (Filters) ──→ HU-4.4 (Pagination)
```

## Aceptación de la Epic

- [x] Grid de cards con dark theme Material 3 (fondo `var(--bg-surface-container-lowest)`, borde 1px `var(--border-color)`, hover con glow violeta)
- [x] Vista de tabla con columnas: ID, Source, Author, Channel, Tags, Age
- [x] Vista grid con toggle de vista (grid/tabla) con botones oscuros
- [x] Cards muestran toda la info: fuente, título, descripción, tags, autor, fecha, canal
- [x] Fecha relativa ("2d ago", "3h ago") en cards y tabla
- [x] Búsqueda en tiempo real por título, descripción, tags, URL
- [x] Filtros por fuente, tags, fechas, canal, autor — combinables y persistentes en URL
- [x] Tags clicables en la tabla y cards como filtros individuales (single-select)
- [x] Tags en cards expandibles (mostrar +N, click para ver todos)
- [x] Tags en tabla con popup al hover mostrando todos los tags
- [x] Paginación numérica (vista tabla) + "Load more" explícito (vista grid)
- [x] Responsive: móvil, tablet, desktop
- [x] Skeleton loading + empty state
- [x] Transiciones discretas (150-250ms)
- [x] Atajo de teclado `/` para focus en búsqueda
- [x] Tipografía Space Grotesk + Inter + JetBrains Mono, paleta dark Material 3 violeta
- [x] Comentarios `// section` como separadores visuales en el layout
