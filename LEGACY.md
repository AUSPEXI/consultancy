# LEGACY.md — What's Live, What's Archived

This repo has accumulated several generations of the product. This file explains
which directories are **live** (built and deployed) and which are **archived**
(kept for history and code-evolution tracing, but never deployed).

If you're new here: **the live website is `consultancy-next/`**. Almost everything
at the repo root is the previous version, superseded but intentionally kept.

---

## The live app

| Path | What it is | Deployed? |
|------|------------|-----------|
| `consultancy-next/` | The current **L8EntSpace** site — Next.js (App Router), the GEO platform. Self-contained: its own `src/`, `app/`, `package.json`, `netlify/functions/`. | ✅ **Yes** |
| `geo-lab/` | The GEO research lab — runs A/B citation experiments via GitHub Actions (`.github/workflows/geo-lab.yml`). Commits results back to the repo. | ✅ Runs in CI |
| `.github/workflows/` | Scheduled jobs: `brand-probe.yml` (daily citation monitoring) and `geo-lab.yml` (research). | ✅ Yes |

### How the live site builds
- Netlify **base directory = `consultancy-next/`** (set in the Netlify UI).
- Build command: `npm run build` → publishes `consultancy-next/.next`.
- Root `package.json` is a thin **workspace wrapper** (`auspexi-root`) whose
  scripts just delegate into `consultancy-next/`.

> ⚠️ **Do not change the Netlify base directory.** It is the wall that isolates
> the live app from the archived legacy code below. If the base were cleared
> (build from repo root), Netlify would try to bundle the legacy
> `netlify/functions/api.ts` → `server.ts` and the old app would interfere.

---

## Archived (kept for history, NOT deployed)

These are the original **Vite / React + Express** version of the site — the first
generation of auspexi.com, before the Next.js rebuild. As of June 2026 they live
under **`_legacy/`** so the repo root only contains the live app, research lab,
and shared config. They remain entirely outside the Netlify build scope.

| Path | What it was |
|------|-------------|
| `_legacy/server.ts` (~100KB) | The original monolithic Express server — API routes, the `/api/genai` proxy, voice-key handling. Superseded by `consultancy-next/app/api/*`. |
| `_legacy/src/`, `_legacy/app/`, `_legacy/lib/` | The original Vite/React source tree. Superseded by `consultancy-next/src` and `consultancy-next/app`. |
| `_legacy/index.html`, `_legacy/vite.config.ts` | Vite entry point + config. The new app is Next.js, not Vite. |
| `_legacy/next.config.ts`, `_legacy/tsconfig.json` | Root-level configs from the pre-rebuild era. The live configs are inside `consultancy-next/`. |
| `_legacy/vercel.json` | Old Vercel deploy config. The live app deploys on Netlify. |
| `_legacy/netlify/functions/api.ts` | Old Netlify function that wrapped `server.ts`. The live app uses `consultancy-next/netlify/functions/`. |
| `_legacy/public/` | Old static assets (pre-rebrand logo, deck, video). Live assets are in `consultancy-next/public/`. |
| `_legacy/test-genai*.cjs/js`, `_legacy/test-admin.ts` | One-off dev/test scripts from the Vite era. |
| `_legacy/metadata.json` | Old app metadata. |
| `_legacy/auspexi-logo.png` | Pre-rebrand logo. Live logos are SVGs in `consultancy-next/public/` and `consultancy-next/app/`. |

Nothing in `consultancy-next/` imports any of these — verified by grep. They are
a self-contained snapshot of the previous generation.

---

## Decommissioned external services

| Service | Was for | Replaced by |
|---------|---------|-------------|
| Railway `genai-proxy` | Securing the voice agent's Gemini API key behind a proxy. | Ephemeral tokens minted server-side by `consultancy-next/app/api/aura-token/route.ts` (30-min expiry). No proxy needed. |
| `daily-autopilot` cron | Auto-generating + emailing an article per keyword daily. | Retired. Superseded by the human-in-the-loop **Bulk Agent Pipeline** in the dashboard + the **brand-probe** monitoring cron. |

---

## Separate products in this repo

| Path | What it is |
|------|------------|
| `aethergen/` | **AethergenAI** — a separate product (synthetic data platform), still branded under Auspexi. Not part of the L8EntSpace rebrand. |

---

## The rebrand (June 2026)

The company was renamed **Auspexi → L8EntSpace** and the domain moved
`auspexi.com → l8entspace.com`. The brand colour changed from the legacy pink
(`#ec4899`) to electric pink (`#ff1493`). The rebrand applied to `consultancy-next/`
and `geo-lab/` only — `aethergen/` and the archived root code keep their original
Auspexi branding as a historical record.

---

## Other root docs worth knowing

- `AGENTS.md` — agent/contributor operating notes.
- `GEMINI.md` — Gemini integration notes.
- `GEO_AI_MODEL_SPEC.md` — the GEO model spec.
- `TODO.md` — running task list.
- `firestore.rules`, `firebase-blueprint.json` — Firebase/Firestore config.
- `consultancy-next/BLOG_GUIDELINES.md` — how to write blog posts (style, fact standards).
- `geo-lab/CLAUDE.md` — how the research lab operates.
