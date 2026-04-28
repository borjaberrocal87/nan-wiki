# 🎯 Use Tailwind v3 with PostCSS, not Tailwind v4

## 💡 Convention

The project uses **Tailwind CSS v3** with standard PostCSS pipeline (`tailwindcss` + `autoprefixer`). Do not use Tailwind v4's `@import "tailwindcss"` directive or its CSS-native `@layer` feature.

The PostCSS config (`postcss.config.mjs`) must include `tailwindcss` and `autoprefixer` as plugins. The Tailwind config (`tailwind.config.ts`) must declare content paths.

```
✅ Use: @tailwind base; @tailwind components; @tailwind utilities;
✅ Use: postcss.config.mjs with tailwindcss + autoprefixer plugins
✅ Use: tailwind.config.ts with content paths
❌ Use: @import "tailwindcss" (Tailwind v4 syntax)
❌ Use: @custom-variant (Tailwind v4 syntax)
❌ Use: @layer utilities { ... } with native CSS @layer (browser incompatibility)
```

## 🏆 Benefits

- **Browser compatibility**: Tailwind v4's CSS-native `@layer` is not supported by all browsers, causing utility classes to never render.
- **Predictable build**: Standard PostCSS pipeline works consistently across dev and Docker builds.
- **Standalone builds**: `output: "standalone"` in Next.js works reliably with Tailwind v3.
- **No CSS parsing errors**: v4 syntax causes build-time and runtime CSS errors.

## 👀 Examples

### ✅ Good: Tailwind v3 setup

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```js
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```ts
// tailwind.config.ts
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
```

### ❌ Bad: Tailwind v4 syntax

```css
/* This will break in the browser */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@layer utilities {
  .custom-utility { color: red; }
}
```

## 🧐 Real world examples

- [`packages/web/src/styles/globals.css`](../../packages/web/src/styles/globals.css) — `@tailwind` directives
- [`packages/web/postcss.config.mjs`](../../packages/web/postcss.config.mjs) — PostCSS plugins
- [`packages/web/tailwind.config.ts`](../../packages/web/tailwind.config.ts) — Content paths

## 🔗 Related agreements

- [`docs/frontend/design-tokens-css.md`](./design-tokens-css.md) — CSS design tokens
- [`docs/frontend/reusable-component-classes.md`](./reusable-component-classes.md) — Component CSS classes

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
