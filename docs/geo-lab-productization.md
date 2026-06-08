# GEO Lab Productization

How the internal GEO research lab becomes user-facing value — without
overpromising the slow, expensive parts.

## The core constraint

GEO A/B testing has two modes, and they measure different things:

- **Live mode** — publish variant content on real URLs, wait 2–6 weeks for
  models to ingest it, measure citation change. High validity, but slow,
  expensive, and heavily confounded (backlinks, domain authority, model
  versions). **Not suitable for a self-serve promise.**
- **Fast mode (in-context)** — give the model a query plus candidate sources
  (one per variant, order randomised), ask it to answer and cite sources, record
  which variant it cites. Fast, cheap, reproducible. Measures *retrieval-time
  citability*, not long-term training weight.

The product decision flows directly from this: self-serve features use **fast
mode**; live mode stays internal/enterprise.

## The three layers

### Layer 1 — Playbook of validated findings ✅ (shipped)
Surface the lab's statistically-significant findings in-product so every user
benefits from validated tactics. Lives on `/dashboard/geo-lab` (GEO Lab Results)
— reads `/api/geo-findings`, which serves the `geo_findings` collection the lab
publishes to. Users can also submit experiment hypotheses (`lab_requests`).

### Layer 2 — "Test My Draft" citability experiments ⬅ (this build)
A fast-mode, preconfigured A/B on the **user's own content**:

1. User pastes a draft + the topic/queries it targets.
2. User picks a **lever** from a fixed menu (e.g. add Key Takeaways, add a stat
   block, tighten to declarative sentences).
3. We generate **variant B** by applying the lever to the draft (one variable
   changed).
4. We run a fast-mode head-to-head: for each engine × query × trial, present
   both variants as candidate sources in randomised order and record which one
   the model cites.
5. We report citation rates, the winner, a two-proportion z-test (p-value + 95%
   CI), and a per-engine breakdown — plus the generated winning variant to copy.

Honest framing: this is a **citability experiment**, not a scientific claim
about live citations. The UI says so.

**Reuses existing infrastructure:**
- `src/lib/cite-probe-core.ts` — engine-calling patterns + models.
- `app/api/agent/synthesize` / `llm-orchestrator` — variant generation.
- `app/api/content-scorer` — optional citability score alongside the result.
- `geo-lab/scripts/analyze.mjs` — the two-proportion z-test (ported to TS).
- `cost_audit` Firestore collection — cost logging + budget guard pattern.

**New pieces:**
- `src/lib/geo-experiment-core.ts` — levers config, head-to-head runner, stats.
- `app/api/geo-experiment/route.ts` — generate variant B, run, persist, return.
- `app/dashboard/experiments/page.tsx` — the UI.
- `geo_experiments` Firestore collection — saved runs.

### Layer 3 — Live longitudinal A/B 🔒 (internal / enterprise only)
The flagship YouTube experiments and a done-with-you enterprise service. Not
exposed in self-serve — the "results in 6 weeks (maybe)" promise doesn't belong
in a dashboard.

## Cost control

Fast-mode still costs real API calls: engines × queries × trials × 2 variants
(though the head-to-head presents both variants in one call, halving it to
engines × queries × trials). Guardrails:
- Per-experiment trial cap (lower on cheaper tiers).
- Perplexity is the dominant cost — make it opt-in per experiment.
- Log every run to `cost_audit`; the route refuses to exceed a monthly ceiling.

## Method fidelity

Layer 2 mirrors `geo-lab/context/experiment-methodology.md`:
- One variable changed between variants.
- Source order randomised every trial (counter position bias).
- Multiple query paraphrases per topic.
- Two-proportion z-test, significance at p < 0.05.
- Underpowered runs (n < 30/variant) are labelled "preliminary".
