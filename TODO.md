# Auspexi GEO Platform — Master TODO

Living backlog for the consultancy-next dashboard, voice agents, ML data backbone,
and GEO Lab. Sprints are ordered by trust → data → visible value → features.

Legend: ☐ todo · ☑ done · ⧖ in progress

---

## Sprint 0 — Trust & Security  ☑ DONE
- ☑ S0.1 Remove Math.random() simulated SOV writes from Overview; show setup prompt instead
- ☑ S0.2 Stop false "Statistically Significant Drift Detected" alert for zero-data users
- ☑ S0.3 Sentiment Index dial — null/no-data state until real sentiment exists
- ☑ S0.4 Delete `/api/test-gemini` and `/api/test-live` debug routes
- ☑ S0.5 Restrict tier switching to hopiumcalculator@gmail.com (superuser guard)

## Sprint 1 — ML Data Backbone  ⧖
- ☑ S1.1 Persist + reload citation history (`GET /api/cite-probe`) → trend chart on Cite-Probe page
- ☑ S1.2 Fact embedding logging — extract-facts generates+returns embeddings;
         content-scorer write path stores embedding field; Fact interface updated
- ☐ S1.3 Link probe runs to facts/articles (closed-loop attribution) — deferred to S6
- ☑ S1.4 Build A-SOV trend from real citation_tests history (Overview chart no longer
         fabricates a 12→45 ramp; demo data clearly badged for zero-data users)
- ☑ S1.5 GET /api/export-training-set?userId=&format=jsonl|csv
         Exports (query, platform, cited, citation_rate, embedding) per probe run
         Export JSONL button on Cite-Probe history chart

## Sprint 2 — Make Value Visible
- ☑ S2.1 Overview A-SOV trend + dials driven by real citation data; LIVE/DEMO badge
- ☑ S2.2 Per-platform citation trend sparklines on Cite-Probe history chart

## Sprint 3 — Voice Agents (Aura + Citacious) + Citacious Config
- ☑ S3.1 Aura audio context resume — resume() on creation + before each playAudio
         (mirrors working Citacious pattern; fixes silent playback on Safari/iOS)
- ☑ S3.2 Citacious stale-context — fetchKnowledge re-runs on panel open, every 90s
         while open, and right before each voice session connect
- ☑ S3.3 JSON-LD naming — voice-agents schema named the public agent "Citacious"
         while the page renders Aura; corrected to "Aura by Auspexi" + provider org
- ☑ I4/S3.4 Located: NO separate config files. Aura/Citacious personality lives in
         faqData.ts (AURA_FAQ_KNOWLEDGE, CITACIOUS_GEO_KNOWLEDGE) + inline
         systemInstruction (VoiceAgentContext.tsx, Copilot.tsx). Future: centralize
         into versioned config (optional refactor, not blocking).
- ☑ S3.5 Centralised Citacious version config — `src/lib/citacious-config.ts` is single source
         of truth for all dashboard tool descriptions, quest path, and tool connections.
         DASHBOARD_TOOLS typed manifest with status (active/beta/deprecated).
         `buildToolsSection()`, `buildQuestPath()`, `buildToolConnections()`, `getActiveToolIds()`
         imported by both Copilot.tsx (voice) and copilot-chat/route.ts (text).
         CITACIOUS_CONFIG_VERSION string for audit trail. Sprint discipline: bump version +
         update DASHBOARD_TOOLS at end of any sprint that changes dashboard features.
- ☐ S3.6–S3.9 (TBD from voice audit)

## Sprint 4 — Satellite Tools
- ☑ S4.1 Brand Monitor now uses REAL data. Replaced the fully-fabricated route
         (fake reddit.com URLs + templated summaries from synthetic geo-data CSV) with
         Exa neural search restricted to reddit.com/quora.com/news.ycombinator.com
         (open-web fallback). Real URLs/titles come straight from Exa; the LLM only
         classifies sentiment + summarizes per-index (never invents links). Risk score
         + action plan grounded in actual results. Route now requires auth, logs Exa
         cost to cost_audit, prefills brand from profile, shows live source count.
         Business tier: autonomous seeding panel per thread. POST /api/seed-content
         generates per-platform drafts (Reddit post/comment with subreddit targeting
         + LinkedIn post with hashtags) from LLM grounded in actual thread context.
         Copy-to-clipboard workflow; seed history logged to Firestore seed_history.
         Non-Business users see upgrade callout. Citacious config bumped to v2.
- ☑ S4.2 Simulator rebuilt with REAL multi-engine queries. The old route asked ONE
         model to fabricate four engine answers and "decide randomly" whether each
         mentioned the brand — pure invention. New `src/lib/engine-query.ts` fires the
         user's query at every live engine we hold a key for (ChatGPT/Claude/Gemini/
         Perplexity via the same probes as cite-probe) and deterministically detects
         genuine brand mentions (substring + negative-context guard). SOV = mentions /
         LIVE engines; unconfigured engines are skipped & excluded from the denominator
         (shown as "Not Configured"), errored engines shown honestly. Route now requires
         auth + logs blended cost to cost_audit. Page uses authFetch, shows real
         per-engine response text. Citacious config → v3. (I1: git history held no
         original design — only one unrelated commit touched the route.)
- ☐ S4.3 Shadow Link intent + rebuild (see I2)
- ☐ S4.4–S4.8 (TBD)

## Sprint 5 — UI/UX & Pricing
- ☑ S5.1 Consolidate tier enum to 3 real tiers (Starter $149 / Pro $499 / Business $1,899).
         tiers.ts is now canonical: UserTier = Free|Starter|Pro|Business, TIER_PRICES,
         normalizeTier() maps legacy names (Basic→Starter, Medium/Pro/Premium/PipelineOffer→Pro,
         Enterprise→Business) so old Firestore docs + Stripe history keep working.
         Feature gates remapped: Starter = overview/cite-probe/fact-vault/content-scorer/audit-logs;
         Pro = +geo-pulse/competitors/brand-monitor/simulator/autopilot/agents/technical/
         schema-deploy/entity-hub; Business = top tier (social seeding + API, advertised).
         Fixed live landing page (was 4 cards w/ wrong $999 Pro) → 3 canonical cards.
         Stripe webhook + create-checkout-session aligned to real prices incl. $1,899 Business.
         Fact-Vault limits: Starter 50 / Pro 500 / Business ∞.
- ☐ S5.2 Sidebar reorganisation
- ☐ S5.3–S5.4 (TBD)

## Sprint 6 — GEO Lab Feedback Loop
- ☐ S6.1 Feed lab experiment findings back into dashboard content recommendations
- ☐ S6.2–S6.5 (TBD)

## Sprint 7 — Competitive Validation
- ☐ S7.1–S7.2 (TBD)

---

## Investigations
- ☑ I1 Simulator original intent: git history held nothing — only one unrelated commit
       (voice model revert) ever touched the route. No lost design to recover; rebuilt
       from first principles as a real multi-engine SOV probe (see S4.2).
- ☐ I2 Shadow Link original intent → informs S4.3
- ☑ I3 Local synonym embedder BUILT + EXPANDED: 341 groups, 2,162 word entries.
       generateWithLocal() runs API + local in parallel on high-priority calls;
       stores embedding + localEmbedding + embeddingAlignmentScore on every fact.
       Alignment score reveals dictionary gaps (< 0.3 = needs more synonyms).
       All high-priority write paths updated. Verified: 0.21 vs 0.00 unrelated.
- ☑ I4 RESOLVED: no separate files; personality in faqData.ts + inline prompts (see S3.4)

## Lab tasks
- ☐ L1 Switch GEO Lab orchestrator design/video phases to claude-opus-4-8
