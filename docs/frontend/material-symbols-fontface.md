# 🎯 Material Symbols — @font-face instead of Google Fonts CSS link

## 💡 Convention

When loading **Google Material Symbols** in the Next.js frontend, use a `@font-face` declaration in `globals.css` that loads directly from `fonts.gstatic.com`. **Never** use the `<link>` tag from `fonts.googleapis.com/css2?family=Material+Symbols+Outlined` — it injects an inline `font-size: 24px` that overrides all Tailwind utility classes like `text-xs` or `text-[10px]`.

```
✅ Use: @font-face in globals.css loading from fonts.gstatic.com directly
✅ Use: .material-symbols-outlined class with only font-family assignment
✅ Use: Tailwind text-* classes to control icon size
✅ Use: <link> in layout.tsx only for regular web fonts (Inter, Space Grotesk)
❌ Use: <link href="fonts.googleapis.com/css2?family=Material+Symbols+Outlined"> in layout.tsx
❌ Use: @import url("fonts.googleapis.com/...") in globals.css
❌ Use: style={{ fontSize: '10px' }} inline styles on icon spans
```

## 🏆 Benefits

- **Tailwind control**: Icon size is fully controlled by Tailwind utility classes (`text-xs`, `text-[10px]`, etc.) without any CSS override conflicts.
- **No !important hacks**: Avoids `font-size: 10px !important` or inline style overrides that break the design system.
- **Consistent sizing**: All icons follow the same sizing rules as regular text in the component hierarchy.
- **Predictable rendering**: The `@font-face` declaration loads the font file without any wrapper CSS that Google Fonts injects.

## 👀 Examples

### ✅ Good: @font-face in globals.css + Tailwind sizing

```css
/* packages/web/src/styles/globals.css */

@font-face {
  font-family: "Material Symbols Outlined";
  font-style: normal;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v332/KaDmSUFPe9JlAeFoPQGxwx24z8eqc1pVe...woff2) format("woff2");
}

.material-symbols-outlined {
  font-family: "Material Symbols Outlined";
  font-weight: 400;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -webkit-font-feature-settings: "liga";
}
```

```tsx
// Component usage — size controlled by Tailwind
<span className="material-symbols-outlined text-xs text-slate-600">
  open_in_new
</span>
```

```tsx
// layout.tsx — Google Fonts link only for regular fonts
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### ❌ Bad: Google Fonts CSS link with font-size: 24px injection

```tsx
// layout.tsx — This injects font-size: 24px that cannot be overridden
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
  rel="stylesheet"
/>
```

```css
/* globals.css — useless because Google Fonts already defines the class */
.material-symbols-outlined {
  font-family: "Material Symbols Outlined";
  /* Adding font-size here requires !important to override Google's inline style */
  font-size: 10px !important;
}
```

```tsx
// Component — fallback inline style (hack)
<span className="material-symbols-outlined" style={{ fontSize: '10px' }}>
  open_in_new
</span>
```

## 🧐 Real world examples

- [`packages/web/src/styles/globals.css`](../../packages/web/src/styles/globals.css) — `@font-face` for Material Symbols
- [`packages/web/src/app/layout.tsx`](../../packages/web/src/app/layout.tsx) — Google Fonts `<link>` only for Inter, JetBrains Mono, Space Grotesk
- [`packages/web/src/components/links/LinkTable.tsx`](../../packages/web/src/components/links/LinkTable.tsx) — Icon usage with `text-xs` Tailwind class

## 🔗 Related agreements

- [`docs/frontend/tailwind-v3-setup.md`](./tailwind-v3-setup.md) — Tailwind CSS setup
- [`docs/frontend/design-tokens-css.md`](./design-tokens-css.md) — CSS design tokens

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
