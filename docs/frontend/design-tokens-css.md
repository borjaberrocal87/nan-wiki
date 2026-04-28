# 🎯 Use CSS custom properties (design tokens) for all colors, fonts, and spacing

## 💡 Convention

All visual design values — colors, fonts, and spacing — must be defined as CSS custom properties (CSS variables) in `globals.css` under `:root`. Components must reference these variables instead of using hardcoded values.

The design token system follows a Material Design 3 naming convention:

```
--bg-{surface-level}       → Background surfaces (lowest → highest)
--text-{level}             → Text colors (primary → tertiary)
--border-{role}            → Border colors
--accent-{role}            → Accent/brand colors (primary, secondary, tertiary, error)
--font-{category}          → Font families (sans, headline, mono)
```

**Never** use hardcoded hex/RGB values directly in components. Always reference the token.

```
✅ Use: background-color: var(--bg-surface-container-lowest)
✅ Use: color: var(--text-tertiary)
✅ Use: border: 1px solid var(--border-color)
✅ Use: font-family: var(--font-sans)
❌ Use: background-color: #1c1b1b
❌ Use: color: #958da1
❌ Use: font-family: "Inter", sans-serif
```

## 🏆 Benefits

- **Theme switching**: Change one set of variables to re-theme the entire app.
- **Consistency**: All components derive from the same source of truth, preventing color drift.
- **AI-friendly**: Agents can reference token names (`--accent-primary-container`) instead of guessing hex values.
- **Maintainability**: Update a brand color in one place and it propagates everywhere.

## 👀 Examples

### ✅ Good: Component using design tokens

```tsx
// Using Tailwind classes that reference CSS variables
<div className="bg-[var(--bg-surface-container)]">
  <p style={{ color: "var(--text-tertiary)" }}>Tertiary text</p>
</div>

// In CSS components
.info-card {
  border: 1px solid var(--border-color);
  background-color: var(--bg-surface-container-lowest);
}
```

### ❌ Bad: Hardcoded values

```tsx
// Hardcoded hex — breaks theme consistency
<div style={{ backgroundColor: "#1c1b1b" }}>
  <p style={{ color: "#958da1" }}>Tertiary text</p>
</div>

// Hardcoded font — inconsistent with design system
<p style={{ fontFamily: "Inter, sans-serif" }}>
  This text should use the token
</p>
```

## 🧐 Real world examples

- [`packages/web/src/styles/globals.css`](../../packages/web/src/styles/globals.css) — All design tokens defined in `:root`
- [`packages/web/src/styles/globals.css:213-239`](../../packages/web/src/styles/globals.css#L213) — `.btn-primary` uses `--accent-primary-container` and `--text-on-primary-container`
- [`packages/web/src/styles/globals.css:267-286`](../../packages/web/src/styles/globals.css#L267) — `.input` uses `--bg-surface-container` and `--border-color`
- [`packages/web/src/styles/globals.css:118-134`](../../packages/web/src/styles/globals.css#L118) — `.code-block` uses `--bg-secondary` and `--accent-primary-container`

## 🔗 Related agreements

- [`docs/frontend/tailwind-v3-setup.md`](./tailwind-v3-setup.md) — Tailwind v3 configuration
- [`docs/frontend/reusable-component-classes.md`](./reusable-component-classes.md) — Pre-built component CSS classes

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
