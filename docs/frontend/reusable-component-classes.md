# 🎯 Use pre-built component CSS classes from globals.css

## 💡 Convention

Common UI patterns are defined as reusable CSS classes in `globals.css` under `@layer components`. Use these classes instead of writing inline styles or repeating utility combinations.

Available component classes:

| Class | Purpose |
|---|---|
| `.btn-primary` | Primary action button (violet background, uppercase, letter-spacing) |
| `.btn-outline` | Outline/secondary button (transparent bg, border) |
| `.input` | Form input field (dark bg, border, focus glow) |
| `.code-block` | Code snippet container with left accent border |
| `.code-block-label` | Label above code blocks |
| `.code-block-copy` | Copy button for code blocks |
| `.info-card` | Key-value info display |
| `.info-card-row` | Row inside info card |
| `.info-card-label` | Label in info card row |
| `.info-card-value` | Value in info card row |
| `.category-tag` | Small monospace badge/tag |
| `.skeleton` | Loading skeleton with pulse animation |
| `.section-comment` | `// section name` comment divider |
| `.section-divider` | Full-width section divider line |
| `.doc-nav` | Prev/next document navigation |
| `.breadcrumb` | Navigation breadcrumb |
| `.breadcrumb-sep` | Separator in breadcrumb |

```
✅ Use: className="btn-primary"
✅ Use: className="code-block" + className="info-card"
✅ Use: className="category-tag"
❌ Write inline styles for buttons, inputs, code blocks
❌ Recreate button styles in each component
```

## 🏆 Benefits

- **Consistency**: Same visual treatment across all screens and components.
- **Speed**: Drop a class instead of composing 10+ Tailwind utilities.
- **Maintainability**: Change `.btn-primary` once, all buttons update.
- **AI-friendly**: Agents can reference known class names instead of guessing styles.

## 👀 Examples

### ✅ Good: Using pre-built component classes

```tsx
// Button
<Link href="/explore" className="btn-primary">
  Explore
</Link>

// Input
<input className="input" placeholder="Search..." />

// Code block
<div className="code-block">
  <span className="code-block-label">python</span>
  <pre>{code}</pre>
  <button className="code-block-copy">Copy</button>
</div>

// Info card
<div className="info-card">
  <div className="info-card-row">
    <span className="info-card-label">source:</span>
    <span className="info-card-value">github</span>
  </div>
</div>

// Category tag
<span className="category-tag">documentation</span>

// Skeleton loading
<div className="skeleton" style={{ width: "200px", height: "16px" }} />
```

### ❌ Bad: Recreating button styles inline

```tsx
// Recreating button styles every time
<button
  style={{
    background: "#7c3aed",
    color: "#ede0ff",
    padding: "10px 20px",
    borderRadius: "4px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }}
>
  Explore
</button>
```

## 🧐 Real world examples

- [`packages/web/src/styles/globals.css:213-239`](../../packages/web/src/styles/globals.css#L213) — `.btn-primary` and `.btn-outline`
- [`packages/web/src/styles/globals.css:267-286`](../../packages/web/src/styles/globals.css#L267) — `.input`
- [`packages/web/src/styles/globals.css:118-134`](../../packages/web/src/styles/globals.css#L118) — `.code-block` family
- [`packages/web/src/styles/globals.css:166-197`](../../packages/web/src/styles/globals.css#L166) — `.info-card` family
- [`packages/web/src/styles/globals.css:289-298`](../../packages/web/src/styles/globals.css#L289) — `.skeleton`

## 🔗 Related agreements

- [`docs/frontend/design-tokens-css.md`](./design-tokens-css.md) — CSS design tokens
- [`docs/frontend/tailwind-v3-setup.md`](./tailwind-v3-setup.md) — Tailwind v3 configuration

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
