# Dashboard Automation Roadmap — "Set & Forget" SaaS

**Goal:** Convert the dashboard from a panel of buttons (every tool is a manual,
synchronous click) into a premium "set and forget" product where eligible tools
run on a schedule, per user, with no human in the loop — and the owner gets a
digest instead of having to log in.

**Hard rule:** No tool gets automated until it is *verified correct* against a
real account. Automating a broken or inaccurate tool just scales the breakage.
Phase 0 (verification) gates everything else.

---

## Guiding principles

1. **Verify before you schedule.** A tool must produce correct, reproducible
   output on demand before it earns a cron slot.
2. **Build the orchestration layer once.** Don't re-architect 18 features —
   build one scheduling + per-user-preference foundation and plug engines into it.
3. **The engines already exist.** Most of the work is wiring, not new logic.
   `run-daily-audit` and the Autopilot pipeline are already end-to-end.
4. **Set = toggles, Forget = digest.** "Set" is a preferences panel in Settings.
   "Forget" safely requires a weekly summary email so the owner stays informed.
5. **Spend is unattended now.** Scheduled loops burn API budget with nobody
   watching — cost ceilings and tier gating are first-class, not afterthoughts.

---

## Phase 0 — Verification (gate for everything below)

For each tool we record: **does it run without error**, **is the output
correct/plausible**, **is it reproducible**, **what does "correct" mean**, and
**known issues**. Test against one real Pro-tier account with a known brand so
results can be sanity-checked by hand.

Status legend: ☐ untested · ◐ partial · ☑ verified · ✗ broken

### Core measurement engines (highest automation priority)

| Tool | Route | "Correct" means | Status | Notes |
|---|---|---|---|---|
| Daily Audit (SOV refresh) | `POST /api/run-daily-audit` | Writes a dated `sovMetrics` doc; aSOV % is plausible vs manual check; Perplexity ground-truth lands in `knowledge_graph` | ☐ | Flagship automation candidate |
| Cite-Probe | `POST /api/cite-probe` | Per-platform citation rates match what each engine actually returns for the query; `citation_tests` doc persists; attribution panel correlates | ☐ | Verify all 7 engines respond |
| GEO-Pulse | `POST /api/geo-pulse` | Sentiment index + vector distribution are non-fabricated and stable across runs | ☐ | Confirm no Math.random remnants |
| Simulator | `POST /api/simulate` | Each engine's response is real; brand-mention detection is accurate | ☐ | Cross-check mention flags by hand |

### Content & knowledge pipeline

| Tool | Route | "Correct" means | Status | Notes |
|---|---|---|---|---|
| Autopilot (full loop) | autopilot page → agent/* chain | probe→crawl→extract→schema→write→email→webhook completes; `autopilot_runs` status reaches `complete`; article is coherent | ☐ | Test single keyword first, then bulk |
| Agent: Crawl | `POST /api/agent/crawl` | Exa returns relevant sources; cost logged to `cost_audit` | ☐ | |
| Agent: Extract | `POST /api/agent/extract` | Facts are grounded in the crawled sources (no hallucination) | ☐ | Manual spot-check vs source text |
| Agent: Schema | `POST /api/agent/schema` | JSON-LD validates (schema.org) and reflects the facts | ☐ | Run through validator |
| Agent: Synthesize | `POST /api/agent/synthesize` | Article uses the facts, on-brand, no fabricated claims | ☐ | |
| Content Scorer | `POST /api/content-scorer` | GEO score is deterministic-ish; lab levers pulled from `geo_findings` | ☐ | |
| Fact extraction | `/api/extract-facts`, `/api/extract-high-entropy-facts` | Entropy scores sane; embeddings stored | ☐ | |
| Research facts | `POST /api/research-facts` | Web-sourced, cited, not fabricated | ☐ | |

### Delivery & integrations

| Tool | Route | "Correct" means | Status | Notes |
|---|---|---|---|---|
| Email notify | `POST /api/notify-article` | Email actually sends; HTML + schema intact; `articles.webhookDelivered` set | ☐ | Needs EMAIL_USER/APP_PASSWORD |
| CMS webhook push | `POST /api/push-to-cms` | POSTs to user's `cmsWebhookUrl`; retry/backoff works; status logged | ☐ | Test with a webhook.site URL |
| Schema public API | `GET /api/schema-public/[userId]` | Serves current Fact-Vault schema; updates when facts change | ☐ | |
| GA4 attribution | `/api/integrations/ga4/*` | OAuth connect→callback→report works on l8entspace.com redirect URI; AI-referral rows classify correctly | ☐ | Blocked on OAuth client + redirect URI |
| Shadow link | `POST /api/shadow-link` | UTM link generates + tracks | ☐ | |

### Monitoring & intelligence

| Tool | Route | "Correct" means | Status | Notes |
|---|---|---|---|---|
| Brand Monitor | `POST /api/brand-monitor` | Reddit/Quora/HN threats surfaced; Gemini classification accurate | ☐ | |
| Competitor decay | `POST /api/analyze-competitor` | Decay score reflects real staleness; Trojan-Horse opps valid | ☐ | |
| Suggest competitors | `POST /api/suggest-competitors` | Exa-discovered competitors are real + relevant | ☐ | |
| Entity Hub | `POST /api/entity-profile` | Wikidata/QuickStatements export is valid | ☐ | |
| GEO Lab experiment | `POST /api/geo-experiment` | A/B effect sizes + significance are statistically sound | ☐ | geo-lab already cron'd |

### Cross-cutting metrics to validate

- ☐ **Cost accounting** (`cost_audit`) — logged costs match provider pricing.
- ☐ **Tier gating** — each tool respects tier limits (facts/keywords caps).
- ☐ **Empty-state honesty** — zero-data users see setup prompts, never fabricated
  numbers (Sprint 0 work — confirm still holds after changes).
- ☐ **Auth** — every route enforces `requireAuth`; no data leaks across users.

**Phase 0 exit criteria:** Every row in the "core measurement" and "content
pipeline" sections is ☑, and the cross-cutting checks pass. Tools that stay ✗/◐
are explicitly excluded from automation until fixed.

---

## Phase 1 — Orchestration foundation (build once)

Only starts once the tools we intend to schedule are ☑.

1. **Per-user automation preferences.** Add an `automation` object to the `users`
   doc:
   ```
   automation: {
     dailyAudit:     { enabled, lastRun },
     autopilot:      { enabled, frequency: 'daily'|'weekly', keywordsPerRun },
     brandMonitor:   { enabled, frequency, lastRun },
     competitorScan: { enabled, frequency, lastRun },
     dailyCostCapUsd: number,    // unattended-spend ceiling
   }
   ```
2. **Cron entrypoint pattern.** A `CRON_SECRET`-protected route that fans out
   over eligible users (tier + `automation.*.enabled` + cost-cap check) and calls
   the existing engines. Reuses the proven pattern from the retired
   `daily-autopilot` workflow — done properly with per-user prefs instead of
   running blindly for everyone.
3. **One GitHub Actions workflow** (mirrors `geo-lab.yml`) triggers the entrypoint
   on a daily schedule, staggered to avoid hammering all engines at once.
4. **Run ledger** — reuse `autopilot_runs` / `sovMetrics`; add a per-run cost
   tally so the cap is enforceable.

---

## Phase 2 — Sequenced rollout (one per sprint)

| # | Automate | Why this order | Effort | Depends on |
|---|---|---|---|---|
| 1 | Scheduled **daily audit** | 100% ready, zero new logic, instant "it updates itself" win | Low | P0 audit ☑, P1 |
| 2 | Scheduled **autopilot loop** | Flagship time-saver; pipeline + retries built | Med | P0 pipeline ☑, P1 |
| 3 | **Automation prefs UI** (Settings toggles) | Turns the above into real set-and-forget | Med | P1 |
| 4 | **Brand monitor** (weekly) | Passive risk alerting, low compute | Low | P0 ☑ |
| 5 | **Competitor decay scan** (weekly) | Surfaces opportunities, no clicks | Low | P0 ☑ |
| 6 | **Weekly digest email** | The "forget safely" piece that ties it together | Med | 1–5 |

---

## Decisions to lock as we go (not blocking P0)

- **Tier gating:** which tiers get scheduled runs vs manual-only? (Automation is
  the premium lever.)
- **Cost ceilings:** per-user daily cap default + hard platform cap.
- **Schedule staggering:** spread users across a window vs all at 06:00 UTC.
- **Failure policy:** retry, skip, or alert the user on a failed scheduled run?

---

## Out of scope / explicitly retired

- `daily-autopilot.yml` + `/api/cron/brand-probe` — retired; superseded by the
  Phase 1 per-user orchestration (the old version ran blindly for everyone).
