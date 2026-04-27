# Epic: Frontend de Exploración

## Resumen

Construir la interfaz principal de exploración: grid de cards, barra de búsqueda, filtros avanzados, paginación y diseño visual que replica nan.builders.

**Estimación:** ~30h
**Riesgo:** Medio
**Dependencias:** Epic 002 (API CRUD, OAuth, frontend base)

---

## Historias de Usuario

### HU-4.1 — Grid de cards con diseño nan.builders

**Como** usuario, quiero ver los links compartidos en un grid de cards visualmente atractivo para explorar rápidamente el contenido.

**Criterios de aceptación:**
- [ ] Cards con: icono de fuente, título, descripción, tags, autor (avatar + nombre), fecha, canal
- [ ] Diseño oscuro, minimal, tipografía limpia — replica nan.builders
- [ ] Hover effect en cards (elevación sutil, cambio de borde)
- [ ] Click en card abre el link en nueva pestaña
- [ ] Icono de fuente según dominio (GitHub → icono GitHub, YouTube → icono play, etc.)
- [ ] Tags renderizados como badges con color por fuente
- [ ] Fecha formateada relativa ("hace 2 horas", "hace 3 días")
- [ ] Avatar del autor de Discord con tooltip del username
- [ ] Skeleton loading mientras cargan las cards
- [ ] Empty state: "No se han compartido links aún" con ilustración/icono

**Tareas:**
- [ ] Crear `packages/web/src/components/links/LinkCard.tsx`
- [ ] Crear `packages/web/src/components/links/LinkGrid.tsx`
- [ ] Configurar iconos de fuente en `packages/web/src/lib/sources.ts`
- [ ] Implementar formateo de fechas relativas
- [ ] Implementar skeleton loading
- [ ] Implementar empty state
- [ ] Ajustar CSS con Tailwind para replicar estética nan.builders
- [ ] Probar responsive: grid 1 col (móvil) → 2 cols (tablet) → 3 cols (desktop)

**Estimación:** 10h

---

### HU-4.2 — Barra de búsqueda

**Como** usuario, quiero buscar links por texto para encontrar contenido específico rápidamente.

**Criterios de aceptación:**
- [ ] Barra de búsqueda en la parte superior del grid
- [ ] Búsqueda por: título, descripción, tags, URL
- [ ] Búsqueda en tiempo real (debounce 300ms)
- [ ] Resultado: "X resultados para '...'"
- [ ] Búsqueda vacía → muestra todos los links (paginados)
- [ ] Icono de lupa en la barra
- [ ] Placeholder: "Buscar links, tags, autores..."
- [ ] Clear button (×) cuando hay texto
- [ ] Atajo de teclado: `/` para focus en la barra de búsqueda

**Tareas:**
- [ ] Crear `packages/web/src/components/links/SearchBar.tsx`
- [ ] Implementar debounce de 300ms
- [ ] Conectar con API: `GET /api/links?q=...`
- [ ] Backend: implementar búsqueda full-text en PostgreSQL (`tsvector`)
- [ ] Implementar atajo de teclado `/` con hook
- [ ] Probar búsqueda con diferentes términos

**Estimación:** 5h

---

### HU-4.3 — Filtros avanzados

**Como** usuario, quiero filtrar links por fuente, tags, rango de fechas y canal para refinar los resultados.

**Criterios de aceptación:**
- [ ] Filtro por fuente: dropdown con checkboxes (GitHub, Twitter, YouTube, etc.)
- [ ] Filtro por tags: dropdown con tags detectados (multiselect)
- [ ] Filtro por rango de fechas: date range picker (desde/hasta)
- [ ] Filtro por canal: dropdown con canales del servidor
- [ ] Filtro por autor: dropdown con autores (top 50 más activos)
- [ ] Botón "Limpiar filtros" para resetear todos
- [ ] Contador de filtros activos visible
- [ ] Filtros combinables entre sí
- [ ] Filtros persisten en URL (query params) para poder compartir
- [ ] UI: sidebar de filtros (desktop) / modal/drawer (móvil)

**Tareas:**
- [ ] Crear `packages/web/src/components/links/LinkFilters.tsx`
- [ ] Implementar cada filtro con componentes UI reutilizables
- [ ] Implementar lógica de combinación de filtros
- [ ] Persistir filtros en URL query params
- [ ] Implementar backend: filtros en `GET /api/links` con query params
- [ ] Implementar sidebar (desktop) / drawer (móvil)
- [ ] Botón clear filters
- [ ] Probar combinaciones de filtros

**Estimación:** 8h

---

### HU-4.4 — Paginación / Infinite scroll

**Como** usuario, quiero navegar entre páginas de links para explorar todo el contenido sin sobrecarga.

**Criterios de aceptación:**
- [ ] Paginación numérica (1, 2, 3, ...) con "siguiente/anterior"
- [ ] Opción de infinite scroll como alternativa (toggle en settings)
- [ ] 20 links por página (configurable)
- [ ] Loader visible al cargar página siguiente
- [ ] Scroll to top al cambiar de página
- [ ] Estado final: "No hay más resultados"
- [ ] La paginación funciona con filtros activos
- [ ] URL actualizada con `?page=N`

**Tareas:**
- [ ] Crear componente de paginación en `packages/web/src/components/ui/`
- [ ] Implementar paginación numérica
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
HU-4.1 (Cards) ──→ HU-4.2 (Search) ──→ HU-4.3 (Filters) ──→ HU-4.4 (Pagination)
```

## Aceptación de la Epic

- [ ] Grid de cards con diseño visual idéntico a nan.builders (oscuro, minimal)
- [ ] Cards muestran toda la info: fuente, título, descripción, tags, autor, fecha, canal
- [ ] Búsqueda en tiempo real por título, descripción, tags, URL
- [ ] Filtros por fuente, tags, fechas, canal, autor — combinables y persistentes en URL
- [ ] Paginación numérica + infinite scroll (toggle)
- [ ] Responsive: móvil, tablet, desktop
- [ ] Skeleton loading + empty state
- [ ] Hover effects y transiciones suaves
- [ ] Atajo de teclado `/` para focus en búsqueda
