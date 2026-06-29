# Setup and Tooling

---

## Initial Scaffold

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

---

## Key Dependencies Installed

```bash
npm install react-router-dom lucide-react recharts
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## Tailwind CSS v4 Setup

Tailwind v4 uses PostCSS — no `tailwind.config.js` needed.

`postcss.config.mjs`:
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
}
```

Import in `src/index.css`:
```css
@import "tailwindcss";
```

---

## Testing Setup (Vitest)

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

Run tests:
```bash
npm test
```

Test files: `src/features/auth/*.test.tsx`, `src/features/blockers/Blockers.test.tsx`, `src/features/info/Info.test.tsx`

---

## Dev Server

```bash
npm run dev   # http://localhost:5173
npm run build
npm run preview
npm run lint
```

---

## Tooling Summary

|        Tool        |        Version        |        Purpose         |
|--------------------|-----------------------|------------------------|
|        Vite        |        ^7.2.4         | Build tool + dev server|
|        React       |       ^19.2.0         | UI framework           |
|     TypeScript.    |       ~5.9.3          | Type safety            |
|     React Router   |       ^7.11.0         | Client-side routing    |
|    Tailwind CSS    |       ^4.1.18         | Utility-first styling  |
|    lucide-react    |       ^0.562.0        | Icon library           |
|      recharts      |        ^3.6.0         | Charts (Analytics)     |
|       ESLint       |        ^9.39.1        | Linting                |
|       Vitest       |           —           | Unit testing           |
---

## Common Errors and Fixes

### Buttons rendering black (invisible text)

**Cause**: Tailwind's `@tailwind base` resets `color: inherit` on buttons, conflicting with any preset CSS.

**Fix**: Remove conflicting styles from `index.css`. Only Tailwind directives should remain.

### Screen layout in single column

**Cause**: Tailwind not scanning source files correctly.

**Fix**: Verify content paths include `./src/**/*.{js,ts,jsx,tsx}` (v3) or that `@import "tailwindcss"` is in the CSS entry (v4).
