# L8EntSpace

**Generative Engine Optimization (GEO) platform.** L8EntSpace helps brands get
cited by AI engines — ChatGPT, Gemini, Claude, and Perplexity — instead of being
invisible when people ask AI for recommendations.

Live site: [l8entspace.com](https://l8entspace.com)

---

## What it does

When someone asks an AI "who's the best at X?", the answer either mentions your
brand or it doesn't. L8EntSpace measures that, then helps you fix it:

- **Citation Probe** — asks the four major AI engines real questions and records
  whether your brand is cited. Gives you a citation rate and the gaps.
- **Fact Vault** — stores the true, specific facts about your business that AI
  should be citing.
- **Agent Pipeline** — researches a topic (Exa), extracts facts, synthesises a
  grounded article, and generates schema.
- **Content Scorer** — rates how citable a piece of content is (Gemini, 0–100).
- **Schema Deploy** — JSON-LD structured data, deployed via a JS snippet.
- **Latent Space Explorer** — 3D UMAP visualisation of your brand's embedding
  neighbourhood, showing cited territory vs. citation gaps.
- **Citacious** — an in-dashboard AI assistant (text + voice via Gemini Live).
- **Brand Probe Pipeline** — a scheduled job that probes your brand weekly and
  emails you a summary.

---

## Architecture at a glance

```
l8entspace.com (Netlify)
        │
        └── consultancy-next/        ← THE LIVE APP (Next.js, App Router)
                ├── app/             ← pages + API routes
                ├── src/             ← components, contexts, lib, data
                └── netlify/         ← functions config

geo-lab/                             ← GEO research lab (runs in GitHub Actions)
.github/workflows/                   ← scheduled jobs (brand-probe, geo-lab)
aethergen/                           ← SEPARATE product (AethergenAI), not L8EntSpace
<repo root>                          ← ARCHIVED first-gen Vite/React app (see LEGACY.md)
```

- **Frontend/backend:** Next.js 15 (App Router), React 19, Tailwind, Framer Motion.
- **3D / visualisation:** Three.js via `@react-three/fiber` + `drei`.
- **AI:** Gemini (`@google/genai`), OpenAI, Anthropic, Perplexity; Exa for research crawl.
- **Data/auth:** Firebase (Auth + Firestore), Firebase Admin server-side.
- **Payments:** Stripe.
- **Email:** Nodemailer (Gmail app password).
- **Hosting:** Netlify, **base directory = `consultancy-next/`**.

> ⚠️ The repo root is the **archived** previous-generation Vite/React app, kept
> for history. It is never deployed. See **[LEGACY.md](./LEGACY.md)** before you
> assume any root-level file is live.

---

## Where to start (docs map)

| Doc | What it covers |
|-----|----------------|
| **[LEGACY.md](./LEGACY.md)** | Live vs. archived code, decommissioned services, the rebrand. **Read first.** |
| `consultancy-next/BLOG_GUIDELINES.md` | How to write blog posts — style, two-tier depth, fact standards. |
| `geo-lab/CLAUDE.md` | How the research lab runs experiments. |
| `GEO_AI_MODEL_SPEC.md` | The GEO model spec. |
| `AGENTS.md` / `GEMINI.md` | Agent + Gemini integration notes. |
| `TODO.md` | Running task list. |

---

## Running locally

The live app lives in `consultancy-next/`. The root `package.json` is a thin
workspace wrapper that delegates to it, so from the repo root:

```bash
npm install          # installs the consultancy-next workspace
npm run dev          # → next dev (http://localhost:3000)
npm run build        # → next build
npm run lint
```

Or work inside `consultancy-next/` directly (`npm run dev` there does the same).

You'll need a `.env.local` in `consultancy-next/` with the variables below.

---

## Environment variables

Set these in **Netlify** (production) and `consultancy-next/.env.local` (local).
`NEXT_PUBLIC_*` vars are exposed to the browser — never put secrets in them.

### Firebase (client)
| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Keep as `*.firebaseapp.com` — **not** l8entspace.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |
| `NEXT_PUBLIC_FIREBASE_DATABASE_ID` | Named Firestore database id |

> Login uses Google sign-in popup. The serving domain (l8entspace.com) must be in
> **Firebase Console → Authentication → Authorized domains**.

### Firebase (server)
| Var | Notes |
|-----|-------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64-encoded service-account JSON for Firebase Admin |

### AI providers
| Var | Used for |
|-----|----------|
| `GEMINI_API_KEY` | Primary LLM (extraction, synthesis, scoring) |
| `GEMINI_LIVE_API_KEY` | Voice agent ephemeral tokens (falls back to GEMINI_API_KEY) |
| `OPENAI_API_KEY` | Citation Probe (ChatGPT) + embeddings |
| `ANTHROPIC_API_KEY` | Citation Probe (Claude) |
| `PERPLEXITY_API_KEY` | Citation Probe (Perplexity) |
| `EXA_API_KEY` | Research crawl in the agent pipeline |

### Payments
| Var | |
|-----|--|
| `STRIPE_SECRET_KEY` | |
| `STRIPE_WEBHOOK_SECRET` | |

### Email
| Var | |
|-----|--|
| `EMAIL_USER` | Gmail address |
| `EMAIL_APP_PASSWORD` | Gmail app password |

### Cron / automation (also set as GitHub Actions secrets)
| Var | Notes |
|-----|-------|
| `CRON_SECRET` | Bearer token guarding the cron routes. **Must match** the value in GitHub Secrets. |
| `APP_URL` *(GitHub secret)* | `https://l8entspace.com` — the base the workflows curl |
| `GEO_FINDINGS_SECRET` | Guards the lab → dashboard findings publish. Set in **both** Netlify and GitHub. |
| `BRAND_PROBE_MONTHLY_TARGET_USD` / `_CEILING_USD` / `BRAND_PROBE_MAX_COMPETITORS` | Brand-probe budget controls (optional, have defaults) |

### Site
| Var | |
|-----|--|
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` | `https://l8entspace.com` |

> **Removed/dead:** `NEXT_PUBLIC_GENAI_PROXY_URL` (the Railway genai proxy is
> decommissioned — voice now uses ephemeral tokens). `VITE_GEMINI_API_KEY` is a
> legacy alias still read as a fallback.

---

## Scheduled jobs

| Workflow | When | Does |
|----------|------|------|
| `.github/workflows/brand-probe.yml` | 07:00 UTC daily | Citation monitoring, budget-capped (~$20/mo) |
| `.github/workflows/geo-lab.yml` | 09:00 UTC daily | Runs the research lab, commits results |

(`daily-autopilot` was retired — superseded by the in-dashboard Bulk Agent
Pipeline. See LEGACY.md.)

---

## Deploying

Push to the active branch; Netlify builds from `consultancy-next/`. **Do not
change the Netlify base directory** — it isolates the live app from the archived
root code (see LEGACY.md).
