# Dependencies and Why

Every package in `package.json` and why it's here.

---

## Runtime Dependencies

### **react** + **react-dom** (^19.2.0)
Core React. `react-dom` mounts the app via `createRoot()` in `main.tsx`.

### **react-router-dom** (^7.11.0)
Client-side routing. Powers all navigation (`useNavigate`, `<Routes>`, `<Route>`).

### **lucide-react** (^0.562.0)
SVG icon library as React components. Used throughout every feature (sidebar, buttons, modals, etc.). Tree-shakeable — only bundled icons are included.

### **recharts** (^3.6.0)
React-native charting library. Used in `Analytics.tsx` for sprint metrics and charts. Chosen over Chart.js for better React integration (declarative API, composable components).

---

## Dev Dependencies

### Build

| Package | Why |
|---|---|
| `vite` ^7.2.4 | Dev server + production build. Instant HMR, native ESM. |
| `@vitejs/plugin-react` ^5.1.1 | React Fast Refresh in Vite. |

### TypeScript

|       Package       |                            Why                            |
|---------------------|-----------------------------------------------------------|
| `typescript` ~5.9.3 | Type safety, IDE autocomplete. Required for `.tsx` files. |
| `@types/react`      | Type definitions for React APIs.                          |
| `@types/react-dom`  | Type definitions for ReactDOM.                            |
| `@types/node`       | Node.js globals for Vite config.                          |

### Styling

|             Package            |                              Why                              |
|--------------------------------|---------------------------------------------------------------|
| `tailwindcss` ^4.1.18          | Utility-first CSS. All styling is done with Tailwind classes. |
| `@tailwindcss/postcss` ^4.1.18 | Integrates Tailwind v4 with Vite's PostCSS pipeline.          |
| `@tailwindcss/cli` ^4.1.18     | Tailwind CLI for processing.                                  |
| `postcss` ^8.5.6               | CSS transformation pipeline (required by Tailwind).           |
| `autoprefixer` ^10.4.23        | Adds vendor prefixes for cross-browser CSS.                   |

### Linting

| Package | Why |
|---|---|
| `eslint` ^9.39.1                      | Code quality and bug catching. Run with `npm run lint`. |
| `@eslint/js`                          | Core JS rule sets.                                      |
| `typescript-eslint` ^8.46.4           | TypeScript-specific lint rules.                         |
| `eslint-plugin-react-hooks` ^7.0.1    | Catches incorrect Hook usage (missing deps, etc.).      |
| `eslint-plugin-react-refresh` ^0.4.24 | Ensures HMR compatibility.                              |
| `globals` ^16.5.0                     | Tells ESLint which globals are valid                    |

### Testing

|           Package           |                       Why                      |
|-----------------------------|------------------------------------------------|
| `vitest`                    | Fast unit test runner, Vite-native.            |
| `@testing-library/react`    | Component testing utilities (render, queries). |
| `@testing-library/jest-dom` | Custom matchers (`toBeInTheDocument`, etc.).   |
| `jsdom`                     | DOM simulation for tests (no browser needed).  |

---

## Why These Choices?

**Vite over CRA**: CRA is deprecated. Vite is 10-100x faster, actively maintained.

**Tailwind over CSS/SCSS**: No context switching, built-in design tokens, tiny production bundle (unused classes purged).

**Recharts over Chart.js**: Declarative React API, no refs or lifecycle hacks needed.

**lucide-react over Font Awesome**: Tree-shakeable, React-native components, clean modern icons.

**Vitest over Jest**: Same API as Jest but Vite-native — zero config, instant startup.
