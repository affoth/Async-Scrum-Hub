# ScrumHub — GitHub Pages demo

This repo deploys a **static, click-through demo** of the ScrumHub frontend to GitHub Pages.
The real backend (Python + Postgres + WebSockets) can't run on Pages, so in demo mode the app
serves seeded sample data from an in-memory mock layer and auto-logs-in a demo user.

- Live URL after deploy: `https://<your-user>.github.io/<this-repo-name>/`
- The Pages sub-path is derived automatically from the repo name at build time — **nothing to configure**.

## How it works

Demo mode is turned on by building with Vite's `--mode demo`, which loads
[`frontend/.env.demo`](frontend/.env.demo) (`VITE_DEMO_MODE=true`). In that mode:

- `frontend/src/services/api.ts` routes every request to `frontend/src/demo/router.ts`
  (an in-memory mock) instead of the network.
- the org WebSocket hook is a no-op.
- the app uses `HashRouter`, so refresh and deep links work on Pages (routes look like `…/#/dashboard`).
- `frontend/src/demo/bootstrap.ts` sets a demo token and lands you on the dashboard.

All demo code lives in `frontend/src/demo/`. The normal build (`npm run build`) is unaffected.

## Deploy

1. **Settings → Pages → Source: GitHub Actions** (one time; the workflow also tries to enable this automatically).
2. **Actions** tab → **Deploy demo to GitHub Pages** → **Run workflow**.
3. Wait ~1 min. The live URL is shown in the deploy step and at the Pages settings.

Pushing to `main` never deploys — deployment is manual via **Run workflow** only. Update anytime by
pushing, then click **Run workflow** when you want it live.

## Local preview

```bash
cd frontend
npm install

# fast dev loop (auto-lands in the dashboard with seeded data)
npm run dev -- --mode demo

# exact production check under the deployed sub-path
BASE_PATH=/<this-repo-name>/ npm run build:demo && npm run preview
```

## Caveats

- Demo data resets to the seed on a full page reload (it's in-memory).
- Signup/login, multi-user and live updates aren't real — it's a single-session showcase.
