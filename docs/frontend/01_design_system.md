# Design System

---

## Design Philosophy

**ScrumHub** uses a clean, modern design that prioritizes clarity for distributed teams:

- **Clean & Minimal**: White backgrounds with subtle shadows and borders
- **Accent Color**: Cyan (`cyan-600`) for primary actions and active states
- **Soft Pastels**: Mint green, pink, yellow, blue for avatars and status indicators
- **Rounded Corners**: Consistent `rounded-xl` (12px) on cards, buttons, inputs
- **Generous Whitespace**: Breathing room between elements

---

## Styling: Tailwind CSS v4

All styling is done with Tailwind utility classes directly in JSX. No separate CSS files.

**Design Tokens in use:**

- **Primary**: `cyan-600` — buttons, links, active nav states
- **Success**: `green-500` — completed tasks
- **Warning**: `yellow-400` — pending items
- **Error**: `red-500` — blockers, validation errors
- **Neutral**: `gray-50` to `gray-900` — text, borders, backgrounds
- **Standard card padding**: `p-6`
- **Standard gap**: `gap-4`
- **Base font size**: `text-sm` (14px)

---

## Component Architecture

All real components live in `components/custom/`. The `components/ui/` folder contains leftover scaffolding (not imported anywhere in the app).

### Custom Components (`components/custom/`)

All exported via barrel: `import { ... } from "../../components/custom/index"`

|      Component      |                       Purpose                        |
|---------------------|------------------------------------------------------|
|       `Avatar`      | User profile image with fallback initials            |
|       `Badge`       | Status indicators (priority, role, etc.)             |
|      `Button`       | Primary button with variants and `isLoading` state   |
|       `Card`        | Container for grouped content                        |
|     `ErrorText`     | Validation error message (red text)                  |
|      `HintText`     | Helper text below inputs (gray text)                 |
|      `IconBox`      | Colored circle container for icons                   |
|       `Input`       | Text input with error state and icon support         |
|       `Label`       | Form label with consistent styling                   |
|       `Modal`       | Dialog wrapper for forms and detail views            |
| `ModalConfirmation` | Confirm/cancel dialog (used for destructive actions) |
|    `PageContainer`  | Centered layout wrapper for auth pages               |
|     `PageHeader`    | Page title + optional actions                        |
|       `Select`      | Dropdown for form selections                         |
|      `StatCard`     | Dashboard stat cards (number + label + icon)         |

### Button variants

`"primary" | "secondary" | "outline" | "ghost" | "text"`

### Layout

```
┌─────────────┬──────────────────────────────┐
│             │ TopBar                       │
│  Sidebar    ├──────────────────────────────┤
│  (nav)      │                              │
│             │  Main Content (bg-gray-50)   │
│             │                              │
└─────────────┴──────────────────────────────┘
```

- Sidebar: fixed left, `bg-white`, `border-r border-gray-200`
- TopBar: fixed top, `bg-white`, `border-b border-gray-200`
- Main: `bg-gray-50`, scrollable

---

## Import Pattern

```tsx
// Always import from the barrel
import { Button, Input, Label, ErrorText } from "../../components/custom/index";
```
