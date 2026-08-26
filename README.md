# Async Scrum Hub

Asynchronous Scrum collaboration for distributed teams — tickets, sub-tasks, daily standups and blockers, without the daily meeting.

**[Live demo →](https://affoth.github.io/Async-Scrum-Hub/)**
Frontend only, running on mock data in your browser. No signup, nothing saved.

## What it does

- **Sprint board** — tickets and sub-tasks, drag-and-drop between columns using the native HTML drag API (no DnD library)
- **Async standups** — one per person per day; yesterday's entry and your open blockers are filled in automatically
- **Blockers** — linked to tickets and tracked through to resolution
- **Analytics** — four-week ticket/task trends and average blocker cycle time
- **Roles** — Scrum Master, Product Owner, Developer; permissions checked server-side in one central `authorize()` call, including field-level rules (only the PO changes ticket priority)
- **Real-time** — org-scoped WebSockets, so everyone's board updates without polling

## Stack

**Backend** — Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL 15, JWT (python-jose), Pillow
**Frontend** — React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7, Recharts
**Infra** — Docker Compose, Nginx reverse proxy with TLS

## Run it locally

```bash
cp .env.example .env    # set JWT_SECRET_KEY
docker compose up
```

Four services come up: Postgres, FastAPI (migrations run on start), Vite dev server, and Nginx. The app is served over HTTPS at `https://localhost:8443` with a self-signed cert, so your browser will warn you once.

## Deploy the demo yourself

Demo mode (`VITE_DEMO_MODE=true`) swaps the API client for an in-browser mock router — no backend, no database, no persistence. Everything resets on reload.

Fork the repo, then go to **Actions → "Deploy demo to GitHub Pages" → Run workflow**. Deployment is manual on purpose; pushes don't trigger it. The build reads its base path from the repo name, so your copy lands at:

```
https://USERNAME.github.io/Async-Scrum-Hub/
```

## Status

Functional prototype, built as a team project at 42 Berlin over roughly 14 weeks.
## Team

Built with [@dtorretta](https://github.com/dtorretta), [@miguandr](https://github.com/miguandr) and [@mrabelo-](https://github.com/mrabelo-).
