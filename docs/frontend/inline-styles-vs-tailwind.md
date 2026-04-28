# Inline Styles vs Tailwind CSS — When to Use Each

## Rule

**Default to Tailwind CSS classes for ALL static styling.** Use inline styles only when Tailwind cannot express the value.

## Tailwind CSS (Preferred)

Use Tailwind utilities for every visual property that has a fixed or design-token-based value:

| Property | Tailwind equivalent |
|---|---|
| `display: flex` | `flex` |
| `display: grid` | `grid` |
| `flex-direction: column` | `flex-col` |
| `gap: 16px` | `gap-4` |
| `padding: 16px` | `p-4` |
| `margin-bottom: 24px` | `mb-6` |
| `background-color: var(--bg-surface-container)` | `bg-surface-container` |
| `color: var(--text-tertiary)` | `text-text-tertiary` |
| `border: 1px solid var(--border-color)` | `border border-border-color` |
| `border-radius: 4px` | `rounded` |
| `font-size: 13px` | `text-sm` |
| `font-family: var(--font-mono)` | `font-mono` |
| `font-weight: 600` | `font-semibold` |
| `text-transform: uppercase` | `uppercase` |
| `letter-spacing: 0.05em` | `tracking-[0.05em]` |
| `overflow: hidden` | `overflow-hidden` |
| `text-overflow: ellipsis` | `text-ellipsis` |
| `white-space: nowrap` | `whitespace-nowrap` |
| `transition: all 0.2s` | `transition-all duration-200` |
| `cursor: pointer` | `cursor-pointer` |
| `box-shadow` | `shadow`, `shadow-*` |
| `width: 100%` | `w-full` |
| `height: 100%` | `h-full` |
| `min-width: 200px` | `min-w-[200px]` |
| `max-width: 400px` | `max-w-[400px]` |
| `position: relative` | `relative` |
| `position: absolute` | `absolute` |
| `z-index: 10` | `z-10` |
| `line-clamp: 2` | `line-clamp-2` |

### CSS custom properties via Tailwind

Our Tailwind config maps all CSS custom properties to Tailwind utilities. Use them directly:

```tsx
// ✅ Good: Tailwind with CSS variable tokens
<div className="bg-surface-container-lowest border border-border-color rounded p-4">
  <span className="text-text-tertiary text-sm font-mono">label</span>
</div>

// ❌ Bad: Inline styles with CSS variables
<div style={{ backgroundColor: "var(--bg-surface-container-lowest)", border: "1px solid var(--border-color)" }}>
  <span style={{ color: "var(--text-tertiary)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>label</span>
</div>
```

## Inline Styles (Exceptions Only)

Use inline styles ONLY when the value is **dynamic** — i.e., it changes at runtime based on data, user interaction, or external configuration.

### Valid inline style cases

| Case | Example |
|---|---|
| **Dynamic color from data** | `style={{ color: sourceConfig.color }}` — source badge color depends on runtime source type |
| **Dynamic computed value** | `style={{ width: `${progress}%` }}` — progress bar width |
| **Dynamic opacity** | `style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` }}` — computed from data |
| **Mouse event transitions** | `onMouseEnter` / `onMouseLeave` for hover effects that change CSS variable values |
| **CSS variable transitions Tailwind can't express** | `style={{ textDecorationColor: "var(--border-color)" }}` — Tailwind doesn't support `textDecorationColor` with CSS vars |
| **Inline SVG attributes that vary** | `style={{ transform: `rotate(${angle}deg)` }}` |

### Examples

```tsx
// ✅ Dynamic source badge color — different for each source type
<span
  className="inline-block px-2 py-0.5 rounded-md font-mono text-xs font-semibold uppercase"
  style={{
    backgroundColor: sourceConfig.bgColor,
    color: sourceConfig.color,
  }}
>
  {sourceConfig.label}
</span>

// ✅ Mouse event hover effect that changes CSS variable
<a
  className="text-text-primary hover:text-text-secondary transition-colors"
  style={{ textDecorationColor: "var(--border-color)" }}
  onMouseEnter={(e) => {
    e.currentTarget.style.textDecorationColor = "var(--accent-primary-container)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.textDecorationColor = "var(--border-color)";
  }}
>
  {link.url}
</a>

// ❌ Bad: Static styling that could be Tailwind
<span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
  label
</span>

// ✅ Good: Same thing as Tailwind
<span className="text-text-tertiary text-sm">label</span>
```

## What Was Converted

The following components were converted from inline styles to Tailwind CSS classes:

| Component | Changes |
|---|---|
| `LinkTable` | Layout, columns, row styling, badges → Tailwind |
| `LinkTableRowSkeleton` | Cell padding, skeleton sizes → Tailwind |
| `MetricsCards` | Grid, card styling, typography → Tailwind |
| `LinkCard` | Layout, typography, tags, author avatar → Tailwind |
| `Pagination` | Button styles, nav buttons, spacing → Tailwind |
| `SearchBar` | Container, input, clear button → Tailwind |
| `LinkFilters` | Dropdowns, trigger buttons, checkboxes, date inputs → Tailwind |
| `LinkCardSkeleton` | Card container, skeleton sizes → Tailwind |
| `LinkGrid` | View toggle, grid/table containers, empty state → Tailwind |
| `LinkTable` (Stitch redesign) | Header bg, divide-y rows, badge with dot, Material icons, pagination integrated → Tailwind |
| `MetricsCards` (Stitch redesign) | Monospace values, progress bars, stacked avatars, hover icons → Tailwind |

### Remaining inline styles (all valid)

| Component | Reason |
|---|---|
| `LinkTable` | Source badge `backgroundColor`/`color` — dynamic per source type; `textDecorationColor` transition — Tailwind doesn't support CSS var transitions; progress bar width in MetricsCards — dynamic percentage |
| `LinkCard` | None — fully converted |
| `LinkFilters` | Dropdown `position: absolute` with `marginTop` — needs calc() for precise positioning |

## Quick Checklist

Before adding an inline style, ask:

1. **Is this value static or from a design token?** → Use Tailwind.
2. **Does Tailwind have a utility for this?** → Use Tailwind.
3. **Is this dynamic (from API data, user input, computation)?** → Inline style is OK.
4. **Is this a hover/interaction effect on a CSS variable?** → Inline style on mouse event is OK.
5. **Can I add a CSS class to `globals.css` instead?** → Consider it for repeated patterns.

## Tailwind Color Reference

All colors map to CSS custom properties defined in `globals.css`:

| Tailwind class | CSS variable | Value |
|---|---|---|
| `bg-surface-container-lowest` | `--bg-surface-container-lowest` | `#0e0e0e` |
| `bg-surface-container` | `--bg-surface-container` | `#201f1f` |
| `bg-surface-container-high` | `--bg-surface-container-high` | `#2a2a2a` |
| `bg-secondary` | `--bg-secondary` | `#1c1b1b` |
| `text-text-primary` | `--text-primary` | `#e5e2e1` |
| `text-text-secondary` | `--text-secondary` | `#ccc3d8` |
| `text-text-tertiary` | `--text-tertiary` | `#958da1` |
| `text-on-primary-container` | `--text-on-primary-container` | `#ede0ff` |
| `text-violet` | — | `#8b5cf6` (hardcoded) |
| `border-border-color` | `--border-color` | `#4a4455` |
| `border-accent-primary-container` | `--accent-primary-container` | `#7c3aed` |
| `bg-accent-primary-container` | `--accent-primary-container` | `#7c3aed` |

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
