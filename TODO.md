# Auspexi GEO Platform — Master TODO

> Source: full technical & product audit (2026-06-07) + founder directives.
> Working branch for dashboard work: `main` (Netlify CD) via feature branches.
> Superuser account: **hopiumcalculator@gmail.com** · Report/notify email: **sales@auspexi.com**

---

## Guiding Principles (apply to every task)

1. **No fake data. No hardcoded metrics. No stubs in production.** As we head to
   production, every number a user sees must trace to a real source. Where we
   previously used synthetic data as a development workaround, replace it with
   real data or an honest empty-state.
2. **Log everything (SOC 2).** Every meaningful action writes to `audit_logs`
   with timestamp, userId, action, details. No silent mutations.
3. **Breadth with integrity.** Keep the full tool suite. The Cite-Probe → Fact
   Vault → Agent → Schema → re-Probe loop is the **spine**; the other tools are
   **satellites**, each answering one distinct user question. Every satellite
   must return real value — a complex-but-fake tool is worse than no tool.
4. **Every data point feeds the model.** All collected data should be usable for
   eventual ML/SLM training, ethically and sustainably. Citacious is
   user-instance attached and should learn each user's brand over time.
5. **Investigate before deleting.** Several tools (Simulator, Shadow Link) were
   built on real AIStudio research. Check git history for original intent before
   replacing — rebuild equal-or-better, only delete if genuinely worthless.

---

## SPRINT 0 — Trust & Security (remove the landmines)

- [ ] **S0.1 — Remove all fake/simulated data from Overview.**
  `app/dashboard/overview/page.tsx` lines ~205–230 write `Math.random()` values
  to Firestore when no brand is set. Remove entirely. Replace with an honest
  empty-state: "Set your brand in Settings to see real metrics."
  *Accept:* no `Math.random()` anywhere in the render/audit path; new accounts
  see empty-state, not invented numbers.

- [ ] **S0.2 — Fix the false "Statistically Significant Drift Detected" alert.**
  `overview/page.tsx` ~line 401 uses a fallback z-score of -3.2 for users with no
  data, creating false urgency. Only show the alert when there are ≥2 real probe
  results to compare. *Accept:* zero-data accounts see no drift alert.

- [ ] **S0.3 — Sentiment Index dial (hardcoded 78%).** `overview/page.tsx` ~line 438.
  Decide: is sentiment useful for the data-collection/model plan? If yes →
  implement from real `sentiment-trace` data. If no → remove the dial.
  *Decision needed during task; default to implement if it feeds the model.*

- [ ] **S0.4 — Remove debug routes + security review.** Delete
  `app/api/test-gemini/` and `app/api/test-live/`. Then audit ALL API routes for
  unauthenticated access to LLM keys or Firestore writes (the aura-token fix in
  commit f90c4a8 is the pattern). *Accept:* debug routes gone; no route exposes a
  raw key or allows unauthenticated privileged writes.

- [ ] **S0.5 — Restrict tier switching to the superuser account.** The tier
  switcher (`app/dashboard/superuser/page.tsx`, referenced in Sidebar/AuthContext)
  must only function for **hopiumcalculator@gmail.com**. All other accounts: no
  switch capability. (Temporary dev tool — will be removed entirely before public
  launch.) *Accept:* tier switch is a no-op/hidden for any other email.

---

## SPRINT 1 — ML Data Backbone (unblock the model)

- [ ] **S1.1 — Store fact embeddings at write time.** Add `embedding: number[]`
  (768-D) to the `Fact` schema and compute it in the Fact Vault save path
  (`app/dashboard/fact-vault/page.tsx` + the save API). This is the **backbone of
  the eventual ML/SLM model** and the UMAP 3D latent-space visualisation.
  Investigate the existing "fire 1,200 synonyms locally for reduced API cost"
  mechanism in the codebase and make sure embeddings persist. Use existing
  `src/lib/embeddings.ts`. *Accept:* every new fact has a stored 768-D vector;
  UMAP reads stored vectors, not recomputed ones.

- [ ] **S1.2 — Log individual fact additions to `audit_logs` (SOC 2).** One
  `addDoc` in the fact save handler: `action: 'Added Fact'`,
  `details: {factId, category, entropyScore}`. Audit every other unlogged
  mutation too (this is a SOC 2 requirement — log EVERYTHING).
  *Accept:* adding a fact produces an audit log row; sweep confirms no
  significant action is unlogged.

- [ ] **S1.3 — Add probe linking for time-series joins.**
  `previousProbeId: string|null` on each `citation_tests` doc (linked list of a
  user's probes) and `probeId: string` on each `audit_logs` entry (the most
  recent probe at action time). *Accept:* given any probe, you can walk to the
  previous one and list all actions in between deterministically.

- [ ] **S1.4 — Change `articles.facts` from `string` to `string[]`.** Store
  individual extracted facts so they join back to `Fact` documents. Migrate
  existing docs. *Accept:* new articles store an array; feature-linkage query
  works.

- [ ] **S1.5 — Build the feature-assembly script.** Described in
  `GEO_AI_MODEL_SPEC.md` §4 but doesn't exist. Joins `citation_tests` +
  `audit_logs` + `facts` (embeddings) into ML training rows of
  `(action_sequence, features) → citation_rate_delta`. *Accept:* a script emits
  labelled training rows from real Firestore data.

---

## SPRINT 2 — Make Value Visible (the proof)

- [ ] **S2.1 — Citation-rate history chart on Cite-Probe page.** Query the last
  5–10 `citation_tests` for the user, render a recharts AreaChart of citation
  rate over time. This is the product's single most important proof of value.
  `app/dashboard/cite-probe/page.tsx`. *Accept:* returning users see their real
  trend across probes, not just the current session.

- [ ] **S2.2 — Overview = real, useful metrics only.** Rebuild the KPI dials so
  each is (a) real and (b) decision-useful — not vanity. Each dial must answer
  "what should I do differently?" Tie SOV to real Citation Probe data; remove or
  implement the rest. *Accept:* every Overview number has a real source and a
  clear user action attached.

---

## SPRINT 3 — Voice Agents (Aura + Citacious)

> Aura = front-end **sales** agent on the marketing site. Citacious = dashboard
> **GEO expert/analyst**, "on a quest" personality, user-instance attached.
> Both created by Auspexi.

- [ ] **S3.1 — Fix Aura audio context.** `src/contexts/VoiceAgentContext.tsx`
  plays 24kHz Gemini Live PCM through a single 16kHz context → garbled/slow.
  Copy the dual-context pattern from `Copilot.tsx` (16kHz capture, 24kHz
  playback). *Accept:* Aura audio plays at correct speed.

- [ ] **S3.2 — Fix voice-agent JSON-LD naming.** `app/voice-agents/page.tsx`
  schema says `name: 'Citacious by Auspexi'` on the Aura page. Correct so Aura is
  indexed as Aura (sales agent) and Citacious's schema lives with the dashboard.
  Both `provider: Auspexi`. *Accept:* schema name matches the agent on each page.

- [ ] **S3.3 — Give Aura a sales persona.** Establish a defined voice/character
  for Aura (warm, consultative sales guide) beyond "warm and professional."

- [ ] **S3.4 — Preserve & audit Citacious knowledge-graph files.** Locate the
  complex files behind Citacious's personality + tool knowledge + knowledge-graph
  ("on a quest" vibe). Do NOT regress this — it took significant effort. Document
  where it lives before changing anything nearby.

- [ ] **S3.5 — Fix Citacious stale context.** `Copilot.tsx` `fetchKnowledge()`
  fires once on auth and never refreshes. Refresh before each message (or
  subscribe to Firestore) so new probes/facts are visible mid-session.
  *Accept:* running a probe while Citacious is open updates her context.

- [ ] **S3.6 — Inject action→outcome history into Citacious.**
  `GEO_AI_MODEL_SPEC.md` §6. Join `audit_logs` + `citation_tests` to feed:
  "you added 5 facts, published 2 articles, your rate rose 14%→23%." No ML
  needed. *Accept:* Citacious can reference the user's real action history.

- [ ] **S3.7 — Log Citacious recommendations + whether acted upon.** Persist every
  recommendation and the follow-through. High-value training data; feeds model
  ethically. *Accept:* recommendations stored with an acted/not-acted signal.

- [ ] **S3.8 — Reduce agent response latency.** Both agents feel slow →
  conversation isn't natural. Profile the round-trip (token streaming, system
  prompt size, fetchKnowledge timing) and cut perceived latency (stream early,
  trim prompt, prefetch). *Accept:* noticeably faster first-token response.

- [ ] **S3.9 — Copilot starts collapsed.** `Copilot.tsx` ~lines 93–96 start
  open+maximised; on mobile it's a near-full-width bar. Start collapsed.
  *Accept:* first load shows a small launcher, not an open panel.

---

## SPRINT 4 — Make Every Satellite Tool Real

- [ ] **S4.1 — Brand Monitor: real APIs.** Replace the single Gemini parametric
  call with real data: **Reddit API** (founder has an account) + **Exa**
  (keys already in Netlify, used by the homepage analysis report). Drive it off
  the **competitors configured in Settings**. Add a time-series. List any
  sub-tasks needed for completeness here as they surface.
  *Accept:* Brand Monitor shows real, dated, sourced sentiment for the user's
  configured competitors.

- [ ] **S4.2 — SOV Simulator: recover original intent, then rebuild.** Dig through
  git history to find what the Simulator originally did (it was based on solid
  AIStudio research and real work). `/api/simulate` currently asks Gemini to
  "randomly decide." Rebuild as a genuine tool — e.g. a counterfactual:
  "given current facts + these proposed facts, what's the predicted change in
  citation rate / latent-space coverage of uncited queries?" Decide featured-tool
  vs replace based on findings. *Accept:* no randomness; output is grounded in
  real data or a real predictive method.

- [ ] **S4.3 — Shadow Link: recover intent, fix or delete.** AIStudio said proper
  link tracking is essential. Check original design intent in history. If the
  tracking value is real (LLM-ingest attribution), build it properly with stored
  click/attribution data; if genuinely just a UTM appender, delete the route.
  *Accept:* either a real tracking feature with stored data, or removed cleanly.

- [ ] **S4.4 — Competitor citation probing.** `/api/cite-probe` already accepts a
  `brand` param. Have Competitor Radar run real probes against competitor brands
  instead of LLM-estimated decay scores. *Accept:* competitor decay is computed
  from real probe results.

- [ ] **S4.5 — Entity Hub automated verification.** Currently a manual checklist.
  Add automated verification that the brand actually appears on each external
  platform/entity source. *Accept:* each checklist item has a real verified/not
  status, not manual self-report.

- [ ] **S4.6 — Schema Deploy: deployment status feedback.** Add a ping/validation
  endpoint that confirms the JSON-LD is live and well-formed on the target URL
  (Lighthouse-style). Acknowledge CMS webhook delivery in the UI.
  *Accept:* user sees verified "schema live" status, not fire-and-forget.

- [ ] **S4.7 — Reddit in Settings.** Founder's Reddit config lives in Settings and
  may be broken or insufficient. Investigate; wire it to S4.1 Brand Monitor or
  build what's missing. *Accept:* Reddit connection works and drives Brand Monitor.

- [ ] **S4.8 — Confirm GEO Autopilot email delivery.** Verify the autopilot emails
  actually send to **sales@auspexi.com**. *Accept:* a real autopilot run delivers
  an email.

---

## SPRINT 5 — UI/UX & Pricing Coherence

- [ ] **S5.1 — Collapse 8-tier enum → real 3 tiers.** Truth source = landing
  PricingSection: **Starter $149 / Pro $499 / Business $1,899**.
  `src/constants/tiers.ts` still defines `Free/Basic/Medium/Pro/Business/
  Enterprise/Premium/PipelineOffer`. Reconcile to 3 tiers, update `checkTierAccess`
  and every gated page. Verify pricing-card feature lists are accurate (edit if
  needed). *Accept:* one tier model used everywhere — cards, enum, gating all agree.

- [ ] **S5.2 — Align feature gating to the 3 tiers.** Audit every
  `checkTierAccess` call so the gate matches what the pricing card promises for
  that tier (e.g. Cite-Probe sidebar vs page gate mismatch). *Accept:* no tool is
  shown as accessible then blocked by a different gate.

- [ ] **S5.3 — Dashboard IA: spine vs satellites.** Reorganise the sidebar so the
  quest spine (Cite-Probe → Fact Vault → Agents → Score → Schema → re-Probe) is
  visually primary, and satellite tools (GEO Pulse, Competitor Radar, Brand
  Monitor, Simulator, Entity Hub) are grouped by the question each answers
  ("Measure", "Monitor", "Research"). Make it obvious when to use what.
  *Accept:* a new user can follow the spine without getting lost in satellites.

- [ ] **S5.4 — localStorage cross-page state cleanup.** Add TTL/cleanup to
  `agents_topic`, `contentScorer_draft`, `technical_content_source` so multi-tab
  doesn't cross-contaminate. *Accept:* stale handoff keys expire; multi-tab safe.

---

## SPRINT 6 — GEO Lab → Product Feedback Loop

- [ ] **S6.1 — Content Scorer flags lab-confirmed levers.** e.g. "Opening sentence
  lacks a specific statistic — predicted -Xpp (validated, n=N)" once an
  experiment confirms the lever.
- [ ] **S6.2 — Fact Vault entropy scorer weights lab-confirmed attributes**
  (entity density, inverted pyramid, statistical anchors) explicitly.
- [ ] **S6.3 — Agent Synthesis prompt hard-codes winning patterns** from confirmed
  experiments.
- [ ] **S6.4 — Citation Probe tags results by lever category** so users get
  targeted guidance ("3 entity-density queries uncited → name your standards").
- [ ] **S6.5 — Lab results generate pre-training labels** for the model
  (`{feature, citation_delta}`) before user data is sufficient.

---

## SPRINT 7 — Competitive Validation (do before over-investing)

- [ ] **S7.1 — Validate "no competitor does this" for Citation Probe.** Confirm
  whether simultaneous 4-platform real probing is a genuine moat or something
  competitors deliberately avoid (cost, ToS, reliability). Document findings.
- [ ] **S7.2 — Validate the `(action → citation_delta)` data strategy** the same
  way — is no one collecting it because it's hard/valuable, or because it doesn't
  predict well? Decide how to strengthen our position.

---

## GEO Lab improvements (separate system, lower urgency)

- [ ] **L1 — Switch orchestrator design/video generation to `claude-opus-4-8`**
  for higher-quality experiment design and scripts (probe stays mechanical).
- [ ] **L2 — Confirm Experiment 001 ships end-to-end** (probe → analyze → video →
  email to sales@auspexi.com) on the first real Tuesday run.

---

## Investigations (do first where a task depends on them)

- [ ] **I1 — Simulator original intent** (git history) → informs S4.2.
- [ ] **I2 — Shadow Link original intent** (git history) → informs S4.3.
- [ ] **I3 — "1,200 local synonyms / 768-D latent space" mechanism** in existing
  code → informs S1.1.
- [ ] **I4 — Citacious knowledge-graph / personality files** location → informs S3.4.

---

## Suggested execution order

1. **Sprint 0** (trust/security) — fastest path to a production-safe state.
2. **Sprint 1** (ML backbone) — unblocks the model; mostly trivial schema work.
3. **Sprint 2** (visible value) — the proof users pay for.
4. **Sprint 3** (voice agents) — differentiation + the latency fix you flagged.
5. **Sprints 4–5** (real satellites + coherent UI/pricing) — the bulk of the work.
6. **Sprint 6–7** (lab loop + competitive validation) — ongoing.
