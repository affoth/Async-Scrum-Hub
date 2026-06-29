# Frontend Overview

### Core Features

- **Async Standups**: Team members submit daily updates on their schedule
- **Sprint Board**: Kanban-style task and ticket tracking with modals for create/edit/detail
- **Blocker Management**: Centralized visibility into team blockers and dependencies
- **Analytics Dashboard**: Sprint metrics and team performance charts
- **Info Page**: Team and sprint information view

### Tech Stack

- **Build Tool**: Vite 7.2.4
- **Framework**: React 19.2.0 with TypeScript 5.9.3
- **Routing**: React Router v7 (client-side navigation)
- **Styling**: Tailwind CSS v4 (utility-first)
- **Icons**: lucide-react
- **Charts**: recharts

---

## Application Routes

### Pre-Auth Routes (no sidebar/topbar)

|     Route     |       Component        |             Purpose              |
|---------------|------------------------|----------------------------------|
|       `/`     | `WelcomeAnimation.tsx` | Animated landing / splash screen |
|   `/welcome`  |     `Welcome.tsx`      | Sign up / log in options         |
|    `/login`   |      `Login.tsx`       | Email + password authentication  |
|   `/signup`   |      `SignUp.tsx`      | New user registration            |
| `/team-setup` |     `TeamSetup.tsx`    | Create/join a team (post-signup) |

### Authenticated Routes (with Sidebar + TopBar)

Wrapped in `RequireAuth` → renders `AuthenticatedLayout`

| Route        | Component          | Purpose 
|--------------|--------------------|--------------------------------------|
| `/dashboard` | `Dashboard.tsx`    | Sprint overview and recent updates   |
| `/board`     | `SprintBoard.tsx`  | Kanban board for current sprint      |
| `/standup`   | `AsyncStandup.tsx` | Daily standup submission and history |
| `/blockers`  | `Blockers.tsx`     | Active blockers across the team      |
| `/analytics` | `Analytics.tsx`    | Sprint metrics and charts            |
| `/info`      | `Info.tsx`         | Team and sprint info                 |

---

## Project Structure

```
frontend/src/
├── components/
│   ├── custom/         # App-specific reusable components
│   └── layout/         # Sidebar, TopBar (shared layout)
├── features/           # Feature-based modules
│   ├── auth/           # Welcome, Login, SignUp, TeamSetup
│   ├── dashboard/      # Home dashboard
│   ├── sprint_board/   # Kanban board + modals + hooks
│   ├── standups/       # Async standup
│   ├── blockers/       # Blocker tracking
│   ├── analytics/      # Charts and metrics
│   └── info/           # Team info
├── routes/             # Auth guard + provider
│   ├── AuthProvider.tsx
│   ├── RequireAuth.tsx
│   └── useAuth.ts
├── services/
│   └── api.ts          # API layer (all backend calls)
└── utils/
    └── formatters.ts
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173 / http://localhost:5174)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

---

## Documentation Index

|             File          |                      Purpose                         |
|---------------------------|------------------------------------------------------|
|      `00_overview.md`     | High-level project summary                           |
|   `01_design_system.md`   | Design philosophy, Tailwind tokens, component system |
| `02_setup_and_tooling.md` | Vite setup, dependencies, common errors              |
|  `03_onboarding_flow.md`  | Auth flow, user model, route guards                  |
|    `04_deps_and_why.md`   | Every package.json dependency explained              |
|     `05_references.md`    | Learning resources and references                    |
