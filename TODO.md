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
- ☑ S1.3 Closed-loop attribution. New src/lib/attribution.ts correlates each probe
         run against the user's PREVIOUS run and the facts/articles created in the
         window between them. Computes newly-won queries (cited now, not before),
         lost queries, and ranks facts/articles by keyword overlap with the newly-won
         queries. Pure timestamp-windowing + keyword overlap — no model calls, no
         fabrication. Wired into /api/cite-probe POST (computed before persisting so
         the previous-run lookup is clean; stored on the citation_test doc + returned).
         Cite-Probe page shows a "Since Your Last Probe" panel: delta pp badge,
         newly-cited query chips, likely-contributing facts/articles with the queries
         they match. Framed explicitly as CORRELATION not proof, with the 2–6 week
         GEO-propagation caveat. Citacious config → v7.
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
- ☐ S3.6 Voice session analytics — log session starts, duration, voice-triggered tool
         navigations to copilot_sessions. Citacious can reference usage. No external cost.
- ☐ S3.7 Aura onboarding flow — if settings.brand empty, Aura proactively asks for brand
         name + domain on first session, then navigates to Settings (Aura-persona quest).
- ☐ S3.8 Voice interrupt / barge-in — detect new speech while audioPlaying, cancel current
         playback, process new utterance. Fixes top voice-UX frustration.
- ☐ S3.9 Citacious in-session memory — rolling 10-turn history injected into system
         instruction so it can reference earlier turns. Session-only, no Firestore.

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
- ☑ S4.3 Shadow Link rebuilt. Intent (I2): "Dark AI" UTM tracker — AI engines strip
         referral headers so AI clicks show as "Direct" in GA; a UTM-tagged URL embedded
         in JSON-LD lets the customer's own analytics attribute that traffic to AI. The
         UTM mechanism was real but the route minted a Math.random() tracking id and
         threw it away — no persistence, no history, nothing to prove a link was issued.
         Now: requires auth, validates the URL, mints a collision-resistant randomUUID
         tracking id, persists every link to shadow_links (+ audit_logs), and adds a GET
         history endpoint. Overview page uses authFetch and no longer fabricates an
         untracked link on failure (it surfaces the error). Citacious config → v4.
- ☑ S4.4 GEO Pulse audited — route was ALREADY honest: fires real probes at all 4 live
         engines (Gemini/ChatGPT/Perplexity/Claude), computes real per-platform + aggregate
         SoV, null per-platform when a key is unconfigured, persists to geo_pulse_history.
         No fabrication present. No change needed.
- ☑ S4.5 Competitor Radar rebuilt with REAL data. The old /api/analyze-competitor read
         the synthetic CSV (geo_synthetic_10000.csv) via geo-data.ts — typing a real
         competitor returned fabricated decay/content/entity scores. Now: requires auth,
         uses Exa (includeDomains: competitor host) to pull their actual most-recent
         indexed pages, computes a REAL freshness signal (days since newest published
         page → healthy/decaying/stale), and runs ONE cheap gemini-2.5-flash pass that
         scores ONLY the real excerpts (index-grounded) for entity density + statistical
         anchors + citation-worthiness, deriving vulnerabilities from what's actually there.
         Trojan-Horse flag = genuine opening (stale/decaying OR weak specificity). No public
         content → honest insufficientData state (no fabricated verdict, no Firestore write).
         Exa cost logged to cost_audit. Page uses authFetch + real decayScore.
- ☐ S4.6 Autopilot real implementation — audit whether the probe→generate→publish→re-probe
         loop actually runs or is a stub. If stub, implement real loop; gate Business tier.
- ☐ S4.7 Agent webhook delivery confirmation — log webhook HTTP status + response snippet,
         retry on 4xx/5xx (×3), surface per-article delivery status. Store on articles doc.
- ☐ S4.8 Entity Hub Wikidata export — implement QuickStatements (tab-delimited batch)
         export from the entity profile. Copy-to-clipboard. Pure formatting, no API call.

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
- ☑ S5.2 Sidebar reorganised. THE QUEST extended to 6 steps: schema-deploy added as
         step 6 (natural workflow endpoint after technical/Schema Engine step 5);
         progress bar denominator updated from 5→6. ADVANCED renamed ENTITY & SCHEMA
         (only entity-hub; schema-deploy promoted to Quest). Audit Logs demoted from
         nav group to footer (between Back-to-Website and Settings) — it's a Starter
         utility, not a Pro "advanced" tool. Citacious quest-path updated to 8-step
         flow (0-config → 1-measure → 2-vault → 3-generate → 4-score → 5-schema
         → 6-deploy → 7-probe → 8-defend). Config → v5.
- ☐ S5.3 Onboarding checklist — dismissable 5-step checklist (persisted to users doc)
         matching THE QUEST: Configure → First probe → Add 10 facts → Score article →
         Deploy schema. Steps auto-check on completion. Replaces static S0.1 setup prompt
         with something actionable.  [PRIORITY: trust-first]
- ☐ S5.4 Mobile responsive audit — audit all pages at 375px. Sidebar → hamburger,
         Overview dials stack, Cite-Probe chart scrollable, voice panel no overflow.
         Goal: usable on mobile, not pixel-perfect.
- ☐ S5.5 Homepage marketing copy — the site currently feels clunky: everything is in
         neat boxes (great for LLM-structured factual ingestion, weak for human visitors).
         Feature descriptions are accurate but read "genius-robot" — meaningless to a
         first-time visitor who doesn't yet understand GEO or why Auspexi is worth a
         subscription. ADD human-language, VALUE-not-feature prose sections flowing down
         the page BETWEEN the boxes (keep the boxes — they serve the LLM/SEO purpose).
         Requirements:
         • ~5th-grade readability (short sentences, plain words, concrete imagery)
         • Sell the value/outcome, not the mechanism (how marketing actually works)
         • Subtle psychological levers: loss aversion (you're invisible to AI right now),
           social proof, future-pacing (picture being the answer AI gives), curiosity gap,
           authority, simple before/after contrast
         • Balance the aesthetic (prose softens the box-grid) AND the purpose (conversion)
         • Lead the reader from "what is GEO / why care" → "why it's urgent" → "why Auspexi"
           → clear subscribe CTA.

## Sprint 6 — GEO Lab Feedback Loop
- ☑ S6.1 Closed the GEO Lab → dashboard loop. Lab experiments now feed live content
         recommendations into the Content Scorer.
         • analyze.mjs additionally emits machine-readable finding.json (aggregate
           rates, significant comparisons, verdict, bestVariant, topEffect).
         • New geo-lab/scripts/publish-finding.mjs: reads finding.json + backlog
           entry, maps the lever to authored guidance (LEVER_GUIDANCE, 17 levers),
           attaches the empirical result, POSTs to the dashboard. Non-fatal if env
           unset. Wired into orchestrate.mjs analyze phase + `npm run publish`.
         • New dashboard route /api/geo-findings: POST (Bearer GEO_FINDINGS_SECRET)
           upserts by lever into Firestore geo_findings; GET (requireAuth) returns
           active (significant) findings sorted by effect, + null-result count.
         • Content Scorer page shows "Lab-Validated GEO Levers" panel with headline,
           recommendation, effect (pp + platform), p-value, n. Only significant
           findings surface as advice; nulls stored for transparency.
         • geo-lab.yml passes DASHBOARD_URL + GEO_FINDINGS_SECRET; documented in
           START_PROMPT.md. Citacious config → v6.
         ⚠ Deploy: set GEO_FINDINGS_SECRET in BOTH Netlify (dashboard) and GitHub
           secrets (lab), plus DASHBOARD_URL in GitHub secrets.
- ☐ S6.2 Lab results history page — dedicated /dashboard/geo-lab (read-only, Pro+)
         showing all findings: significant w/ effect sizes, null counts, run timeline.
         Uses existing GET /api/geo-findings. Add geo-lab to Citacious manifest.
- ☐ S6.3 User-triggered experiment requests — "Request an experiment" button writes a
         hypothesis to lab_requests; weekly orchestrator pulls top-voted into backlog.json.
- ☐ S6.4 Lab findings digest email — on significant publish, POST to Netlify fn that emails
         a one-line digest to sales@auspexi.com (+ opt-in users). Non-fatal.
- ☐ S6.5 Embed lab findings into Agent generation — inject top 3 active significant levers
         as explicit instructions into the article-generation prompt. Structural adoption.

## Sprint 7 — Competitive Validation
- ☐ S7.1 Competitor citation comparison — "Competitor Probe" mode runs the same query set
         for the user's brand AND a competitor domain; two citation-rate columns, per-query
         winner. Stored in citation_tests with mode:'competitor' + competitorDomain.
- ☐ S7.2 Industry citation benchmarks — aggregate anonymised rates (no PII, industry
         category only) into benchmark bands on the Cite-Probe chart. Opt-in toggle in
         Settings; weekly aggregation job/cloud function.

## Sprint 8 — Marketing Honesty + SEO (read-only investigations, parallel track)
- ☐ S8.1 Frontend honesty check — audit homepage hero/what-we-do/feature grid, Auspexi
         Arsenal, pricing cards (Starter $149 / Pro $499 / Business $1,899 + feature lists
         vs real gates), blog posts referencing changed features (Simulator/Brand Monitor/
         Shadow Link), and stale beta/coming-soon labels. Ground truth = DASHBOARD_TOOLS +
         tiers.ts.
- ☐ S8.2 SEO investigation — 17 indexed vs 4+ in sitemap. Check next-sitemap config,
         robots.txt, meta robots/noindex on marketing pages, generateMetadata coverage,
         Netlify X-Robots-Tag headers (staging noindex carried to prod), GSC coverage.
         Most likely: stray noindex header or over-broad robots.txt.

---

## Investigations
- ☑ I1 Simulator original intent: git history held nothing — only one unrelated commit
       (voice model revert) ever touched the route. No lost design to recover; rebuilt
       from first principles as a real multi-engine SOV probe (see S4.2).
- ☑ I2 Shadow Link original intent: "Dark AI" attribution. UI copy (overview page)
       confirms it — UTM-tagged URL embedded in JSON-LD so the customer's GA can
       attribute otherwise-"Direct" AI traffic to AI. Mechanism was sound; persistence
       was missing. Rebuilt in S4.3.
- ☑ I3 Local synonym embedder BUILT + EXPANDED: 341 groups, 2,162 word entries.
       generateWithLocal() runs API + local in parallel on high-priority calls;
       stores embedding + localEmbedding + embeddingAlignmentScore on every fact.
       Alignment score reveals dictionary gaps (< 0.3 = needs more synonyms).
       All high-priority write paths updated. Verified: 0.21 vs 0.00 unrelated.
- ☑ I4 RESOLVED: no separate files; personality in faqData.ts + inline prompts (see S3.4)

## Lab tasks
- ☑ L1 GEO Lab design + video phases already on claude-opus-4-8 (orchestrate.mjs:66,
       generate-video-package.mjs:38). Probe stays on claude-haiku-4-5 (high volume).
       Verified production dashboard uses ONLY cheap models (gemini-2.5-flash ×27,
       gpt-4o-mini ×6, sonar ×5, claude-haiku ×4) — zero Opus in any per-user path.
       Opus is confined to the weekly low-volume lab judgment tasks by design;
       deliberately NOT pushed further into production to keep costs low.
