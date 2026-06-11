# Full Project Audit — 2026-06-11

Scope: security, code quality & wiring, SEO/GEO, planning docs vs implementation,
ML/data pipeline (GEO_AI_MODEL_SPEC), geo-lab methodology, unit economics.
Method: six parallel deep-read audits over the live codebase with file:line verification.

**Overall verdict:** The product is far more real than most at this stage — ~90% of the
planned sprint work is genuinely shipped, the wiring between dashboard and API is clean
(zero orphaned calls in 44+ checked call sites), and the data collection is real. The two
things that need urgent attention are **security** (one privilege-escalation hole, a set of
unauthenticated endpoints) and **cost control** (the automation cost caps meter a number
~100× below real spend). Everything else is polish, follow-through, and honesty debt.

---

## 1. CRITICAL — fix this week

### 1.1 Tier privilege escalation (Firestore rules)
`firestore.rules:141` blocks self-writes to `role` but **not `tier`**. Any authenticated
user can `updateDoc(users/<own-uid>, { tier: 'Enterprise' })` from the browser console and
unlock every paid feature for free. `isValidUser` (line 54) only checks the enum.
**Fix:** disallow client `tier` writes exactly like `role`; tier becomes writable only via
Admin SDK / Stripe webhook. (The superuser page's tier-switching must move to a
server-side admin API at the same time — see 1.4.)

### 1.2 Unauthenticated IDOR endpoints
These take `userId` from query/body with **no `requireAuth` at all** — anyone can target any UID:
- `app/api/export-training-set/route.ts:16` — dumps any user's full `citation_tests` (training-data exfiltration)
- `app/api/analytics/pulse/route.ts:7` — any user's citation trend
- `app/api/analytics/map/route.ts:46` — any user's facts + embeddings, **and writes cost_audit
  against the victim's id** (line 217) — attacker can inflate another user's cost ledger
- `app/api/notify-article/route.ts:67` — emails arbitrary HTML to any user's real address (phishing vector)
- `app/api/webhooks/l8entspace/route.ts:20` — auth is skipped entirely if `L8ENTSPACE_WEBHOOK_SECRET` is unset (fail-open)
- `app/api/generate-report`, `app/api/amplify`, `app/api/create-checkout-session` — unauthenticated LLM/Stripe calls

**Fix:** add `requireAuth` everywhere; derive `userId` from the verified token, never the request.
Make the webhook secret mandatory (fail closed).

### 1.3 Auth dev-bypass can become total bypass in prod
`src/lib/api-auth.ts:35-44`: when `adminAuth` is falsy the JWT is **decoded without
signature verification** and trusted. If firebase-admin ever fails to init in production
(bad service-account env), every route accepts forged tokens for any UID.
**Fix:** hard-gate the unverified path behind `NODE_ENV !== 'production'`, or remove it.

### 1.4 Admin is client-side only + `NEXT_PUBLIC_ADMIN_BYPASS`
All superuser/admin gating is `user?.email === 'hopiumcalculator@gmail.com'` in React
components; privileged writes go straight to Firestore from the browser, so enforcement is
entirely on the (currently broken) rules. `NEXT_PUBLIC_ADMIN_BYPASS`
(`superuser/page.tsx:289`, `dashboard/layout.tsx:12`) ships in the client bundle if ever set.
Also: `live-token/route.ts:44-46` **falls back to returning the raw `GEMINI_API_KEY` to the
browser** when ephemeral token creation fails.
**Fix:** server-side admin custom claim, delete the bypass flag, remove the raw-key fallback.

### 1.5 Automation cost caps are decorative
`app/api/cron/run-automations/route.ts:127` hardcodes cite-probe cost at **$0.03/run**, but
with the new 20-competitor head-to-head a real run costs **~$3.49** (21 passes × ~$0.166;
Business at 50 competitors ≈ $8.45). One automated run blows through every tier's
daily cap ($0.25–$2.50) while passing the check. Manual paid-tier runs have **no ceiling at
all** — a daily-clicking Pro user with 20 competitors ≈ $105/mo (still ~79% margin at $499,
but 5–8× the documented envelope; unit-economics.md's "$50 absolute worst case" points at a
retired route).
**Fix:** have `callTool` use the real cost (route already computes it for cost_audit);
add a monthly per-user probe ceiling for manual runs; update docs/unit-economics.md.

---

## 2. HIGH — fix this month

### 2.1 Server-side tier enforcement (3 of ~40 routes)
Only `cite-probe` (Free meter), `seed-content` (Business), and the cron enforce tier
server-side. A Free user with a valid token can directly call `brand-monitor`,
`content-scorer`, `agent/*`, `run-daily-audit`, `simulate`, `geo-pulse`, `shadow-link`,
`extract-facts`, `copilot-chat` — unmetered LLM spend despite UI gating.
**Fix:** small shared `requireTier(userId, 'Pro')` helper; apply per route to match the
dashboard's gates.

### 2.2 SSRF in webhook-proxy / push-to-cms
`webhook-proxy/route.ts:14` validates protocol only; `push-to-cms/route.ts:14` validates
nothing. Authenticated users can make the server fetch internal/metadata IPs
(169.254.169.254, 10.x, localhost) and read responses.
**Fix:** resolve host, reject RFC1918/loopback/link-local/metadata ranges.

### 2.3 Remaining fabricated data (violates the project's own #1 rule)
- `run-daily-audit/route.ts:152-153` — prompt instructs Gemini estimates "SHOULD NEVER BE
  ZERO… baseline 5-15%"; fallbacks `aSov||12` etc. (213-229); `Math.random()*50` added to
  aiTraffic (223). Persisted to `sovMetrics` **with no `synthetic` flag** — floor-ness is
  later inferred by a fragile 5-15% band heuristic.
- `content-scorer/page.tsx:161` — facts saved with random `entropyScore`.
- `overview/page.tsx:311` — fabricated per-platform values (`aSov+15`, `aSov+25`) under the
  "ESTIMATED" label despite the no-fabrication comment at :278.
**Fix:** return zeros honestly + `synthetic: true` flags; compute entropy server-side.

### 2.4 Quick security wins
- Timing-safe compare for `CRON_SECRET` (cron route + api-auth automation path); stop
  accepting the secret via query string (lands in logs).
- `knowledge_graph` rule line 187: legacy docs without `userId` are readable by any
  authenticated user.

---

## 3. MEDIUM — quality & follow-through

### 3.1 Wiring & error handling (otherwise clean)
- Dead endpoint: `app/api/exa-search` has no caller — wire or delete.
- Fire-and-forget `.catch(() => {})` on `audit_logs`/`cost_audit` writes in 7+ routes —
  silent loss is a SOC 2 problem.
- `brand-monitor/route.ts:48-50`: Exa failure degrades to the upbeat "no discussion found —
  opportunity!" message. Surface the error.
- `run-daily-audit/route.ts:146` throws if `competitors` omitted (no default).
- Unmount-safety: timers/post-await setState without guards in overview, brand-monitor,
  geo-pulse, cite-probe pages.

### 3.2 Legacy root app is a drift trap
Root `src/`+`app/` (old Vite build) is NOT deployed (root netlify.toml is inert; live build
is consultancy-next/) but has drifted badly: 8-tier enum, client-side `VITE_GEMINI_API_KEY`
usage in `VoiceAgentContext.tsx:115-149`, divide-by-zero in embeddings cosine. Delete or
quarantine; codify the Netlify base/publish config in-repo instead of UI-only.

### 3.3 SEO / GEO (the dogfooding gaps)
1. **Dashboard not noindexed** — robots.txt disallows `/dashboard/` (crawl) but nothing
   stops indexing; also the trailing-slash rule misses `/dashboard` itself.
2. **No `llms.txt`** — the single most on-brand missing artifact for a GEO product.
3. **No BlogPosting JSON-LD** on blog posts — the blog is the GEO content engine.
4. Organization schema duplicated (layout + page, different @ids); logo points at
   `geo-infographic.png` not the real logo; AggregateOffer omits the Free tier ($0).
5. `images.unoptimized: true` + raw `<img>` + full MP4 in public/; sitemap `lastModified`
   is build-time for everything. `typescript.ignoreBuildErrors` is on.

---

## 4. ML / data pipeline (GEO_AI_MODEL_SPEC.md)

**Verdict: ~50% ready for Phase 1 (GBT), ~20% for Phase 3 (fine-tune). Volume is fine
(~8k rows/user/mo at 50 users ≈ 400k rows); the assembly layer is the blocker.**

Feature coverage by spec section: probe features 8/8 ✓, sentiment 4/4 ✓, lab 4/4 ✓,
vault 4/7, actions 2/8, content 1/4, **semantic 0/6, competitor 0/4**. Overall 23/45 (51%).

Blockers, in order:
1. **The core training pair `(actions_between_probes → citation_delta)` is never assembled**
   — TODO S1.5's feature-assembly script doesn't exist; `export-training-set` produces a
   flat per-(query,platform) classification set that bears no resemblance to the spec's rows.
2. The export's embedding join matches probe **query text** to fact **statement text**
   exactly — questions never equal statements, so embeddings are dead code in the export.
3. `previousProbeId` probe linking (S1.3) is not written by the cite-probe route.
4. Action logging is incomplete: manual fact adds, article publishes, schema generations,
   competitor analyses don't hit `audit_logs` — 6 of 8 action features uncomputable.
5. No `synthetic` flag anywhere — the floor data stays out of the export today only because
   the export doesn't read `sovMetrics`; a spec-compliant join would ingest it blind.
6. sovMetrics has 4 engines; spec needs 7.
7. Raw LLM responses are discarded at probe time — cannot re-score or audit later
   (geo-lab learned this lesson; product probes haven't).

## 5. geo-lab — experiment 001

Methodology is fundamentally sound (single-variable variants, per-trial shuffle, automated
canonical fingerprint rescore before analyze ✓, correct z-test math ✓), but:
- **n=8 per variant per platform vs pre-registered 30** — FINDING.md claims significance
  (Claude p=0.007) in violation of the lab's own n≥30 rule. Label preliminary.
- **Gemini returns 8/8 silent nulls** (no error captured) — investigate key/model; aggregate
  denominators inconsistent between FINDING.md (32) and rescore (24).
- shuffleMap is still **not persisted** in raw.json (audit trail broken — only the
  fingerprint rescore saves the data); `orchestrate.mjs` `countN()` (lines 102-116) counts
  response instances, not citations — broken for future experiments.
- Finding is on Claude, not the pre-registered primary platform (Perplexity); 4 uncorrected
  platform comparisons (Claude survives Bonferroni, but say so).
- `sort(() => Math.random()-0.5)` is a biased shuffle — use Fisher-Yates.

## 6. Docs vs reality — gaps worth closing

- **Weekly digest email (automation Phase 2 #6) is unbuilt** — the "forget safely" promise.
  Automation runs leave no passive trace for the user.
- unit-economics.md is stale: claims Perplexity/AIO are off-by-default in manual runs
  (false — `ALL_ENGINES` is the default), cites a retired brand-probe cron as the budget
  guard, and pre-dates the 20/50-competitor cap.
- competitor-analysis.md self-contradicts (4 engines in the matrix row vs 7 in text).
- S3.6/S3.7 (Citacious action→outcome memory + acted-upon logging) unverified/partial.
- Undocumented shipped features worth writing down: copilot session analytics, voice
  barge-in, industry benchmarks, seed-content, fact_permutations.

## 7. What's genuinely good

- API↔frontend wiring: zero orphaned calls, contracts match on all main flows including
  the new multi-competitor probe shape.
- Stripe webhook signature verification done right; tier set server-side from amount.
- `ga4_integrations`/`oauth_states` rules correctly locked; no committed secrets found.
- Real-data rebuild of the satellite tools (S4) holds up; honest source labels on Overview.
- Automation architecture (per-user prefs, cooldowns, tier entitlement, floor-data gate) is
  well designed — it just meters the wrong number.
- geo-lab's fingerprint rescorer is a genuinely robust design and saved the experiment.

---

## Priority queue (suggested order)

| # | Item | Effort |
|---|------|--------|
| 1 | firestore.rules: block client `tier` writes | minutes |
| 2 | requireAuth + token-derived userId on the 8 open routes | hours |
| 3 | Hard-gate api-auth dev bypass to non-prod | minutes |
| 4 | Real cost in cron callTool + manual probe monthly ceiling | hours |
| 5 | Delete live-token raw-key fallback + NEXT_PUBLIC_ADMIN_BYPASS | minutes |
| 6 | requireTier() helper on the ~10 UI-gated-only routes | hours |
| 7 | SSRF egress filter on webhook-proxy/push-to-cms | hours |
| 8 | Remove remaining fabricated data + add synthetic flags | hours |
| 9 | noindex dashboard, llms.txt, BlogPosting schema, org-schema fixes | hours |
| 10 | Feature-assembly script per spec §4 (unblocks Phase 1 ML) | days |
| 11 | Digest email (automation Phase 2 #6) | day |
| 12 | geo-lab: persist shuffleMap, fix countN, label 001 preliminary, fix Gemini nulls | hours |
| 13 | Archive legacy root src/+app/; codify Netlify config in repo | hours |
