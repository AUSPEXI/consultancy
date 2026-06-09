# L8EntSpace GEO Predictive Model — Architecture Specification

**Status:** Pre-training. Data collection phase. Not yet built.  
**Purpose:** This document defines the model we are building toward, the data sources that feed it, and the prediction targets it will serve.

_Last updated: 2026-06-09._

---

## 1. What This Model Does

A brand using this platform takes a sequence of actions (add facts, publish content, run probes) and observes outcomes (citation rate changes, SOV shifts). Individual users see their own patterns. **This model sees patterns across all users simultaneously** and learns which action sequences reliably produce citation gains.

The deliverable is not a generic AI — it is a narrow, high-confidence recommender that answers: *given this brand's current state, what is the highest-leverage action they should take next, and how much citation rate improvement should they expect?*

---

## 2. Prediction Targets

### Primary
| Target | Type | Description |
|---|---|---|
| `citation_rate_at_next_probe` | Regression (0–100) | Predicted citation rate at the next probe run |
| `citation_rate_delta` | Regression (-100 to +100) | Predicted change from current rate |
| `days_to_first_citation` | Regression | For brands at 0%, when will the first citation appear |

### Secondary
| Target | Type | Description |
|---|---|---|
| `best_next_action` | Classification (7 classes) | Which action maximises citation gain: add_facts / publish_article / run_schema / update_content / run_probe / analyse_competitors / wait |
| `content_format_winner` | Classification (Q&A / Narrative / List / Technical) | Which format works for this brand's topic area |
| `platform_lift` | Multi-label | Which LLM platforms are reachable from current state |

---

## 3. Feature Matrix

Each training row is a `(userId, time_window)` snapshot. One row per probe-to-probe interval.

### 3a. Semantic Features (from UMAP / embeddings)
| Feature | Source | Notes |
|---|---|---|
| `avg_cosine_dist_to_probe_queries` | `facts.embedding` vs `citation_tests.results[].query` embedded | Core proximity metric |
| `semantic_concentration_score` | % of facts within cosine dist < 0.3 of probe queries | Density threshold signal |
| `anchor_coverage_pct` | % of TEO anchors with ≥1 fact within dist 0.3 | Coverage of the semantic space |
| `umap_x`, `umap_y`, `umap_z` | `facts.embedding` → umap-js | True cluster coordinates |
| `cited_territory_pct` | % of facts with `citationStatus === 'cited'` | Direct citation geography |
| `gap_territory_pct` | % of facts with `citationStatus === 'uncited'` | Gap exposure |

### 3b. Vault Features (from `facts` collection)
| Feature | Source | Notes |
|---|---|---|
| `fact_count` | `facts.userId == uid` count | Vault size |
| `avg_entropy_score` | `facts.entropyScore` mean | Complexity of claims |
| `high_entropy_fact_pct` | `facts.entropyScore > 80` count / total | Risky/controversial claims |
| `qa_format_pct` | Facts ending in `?` or containing `How / Why / What` | Q&A format density |
| `fact_add_velocity` | Facts added per 14-day window | Momentum signal |
| `days_since_last_fact_added` | Latest `facts.createdAt` | Recency signal |
| `fact_category_diversity` | Distinct categories / total | Topical breadth |

### 3c. Action Sequence Features (from `audit_logs`)
| Feature | Source | Notes |
|---|---|---|
| `days_between_fact_add_and_probe` | `audit_logs` delta | Critical timing signal |
| `probe_frequency` | Probe runs per 30 days | Usage intensity |
| `articles_published_between_probes` | `audit_logs: Published Article to CMS` | Content action count |
| `agent_pipeline_runs` | `audit_logs: Multi-Agent Crawler` | Pipeline usage |
| `schema_actions_taken` | `audit_logs: Generated JSON-LD Schema` | Technical GEO actions |
| `competitor_analyses_run` | `audit_logs: Analyzed Competitor` | Intel gathering |
| `days_since_last_article` | `articles.timestamp` | Content recency |
| `action_diversity_score` | Distinct audit action types / total | Breadth of platform use |

### 3d. Citation Probe Features (from `citation_tests`)

> **Important for the assembly script:** Do NOT hardcode engine column names. Read
> them dynamically from `citation_tests.platformRates` keys so that newly-added
> engines are automatically included without a spec or script change.
> Current engines: gemini, chatgpt, perplexity, claude, grok, deepseek, google_aio.

| Feature | Source | Notes |
|---|---|---|
| `current_citation_rate` | Latest `citation_tests.citationRate` | Starting point |
| `citation_rate_30d_ago` | `citation_tests` 30 days prior | Trend input |
| `citation_rate_60d_ago` | `citation_tests` 60 days prior | Trend input |
| `citation_rate_slope` | Linear regression of last 4 probes | Direction |
| `gemini_rate` | `citation_tests.platformRates.gemini` | LLM surface |
| `chatgpt_rate` | `citation_tests.platformRates.chatgpt` | LLM surface |
| `perplexity_rate` | `citation_tests.platformRates.perplexity` | Web-grounded; runs Mon + Thu |
| `claude_rate` | `citation_tests.platformRates.claude` | LLM surface |
| `grok_rate` | `citation_tests.platformRates.grok` | xAI surface |
| `deepseek_rate` | `citation_tests.platformRates.deepseek` | DeepSeek surface |
| `google_aio_rate` | `citation_tests.platformRates.google_aio` | **Highest-value label** — the highest-traffic AI answer surface; authority-weighted; runs Wednesdays |
| `platform_spread` | Max platform rate − Min platform rate | Uneven distribution signal |
| `engines_with_zero_rate` | Count of active engines where rate === 0 | Platforms completely missing the brand |
| `uncited_query_count` | Probe results where `cited === false` | Gap count |
| `total_probes_run` | Count of `citation_tests` docs | Maturity signal |

### 3e. Sentiment + Prominence Features (from `citation_tests`)

> These fields were added in mid-2026. Older `citation_tests` docs won't have them;
> treat missing values as `null` (handled naturally by GBT).

| Feature | Source | Notes |
|---|---|---|
| `sentiment_positive_pct` | `sentimentBreakdown.positive / total_cited_results` | Share of positive brand mentions |
| `sentiment_negative_pct` | `sentimentBreakdown.negative / total_cited_results` | Risk signal — negative framing |
| `avg_position_pct` | `citation_tests.avgPositionPct` | Normalised position of first brand mention (0 = top, 100 = bottom); lower is more prominent |
| `avg_list_rank` | Mean `platforms[].position` across cited results | Brand's rank when AIs produce a recommendation list; 1 = first-mentioned |

### 3f. Competitor Features (from `competitors`)
| Feature | Source | Notes |
|---|---|---|
| `avg_competitor_decay_score` | `competitors.decayScore` mean | Competitive pressure |
| `competitors_in_decay` | `decayScore > 60` count | Displacement opportunity count |
| `lowest_competitor_decay` | Min `decayScore` | Weakest competitor |
| `trojan_horse_count` | `trojanHorseOpportunity !== null` count | Actionable displacement windows |

### 3g. Content Features (from `articles`, `content-scorer`)
| Feature | Source | Notes |
|---|---|---|
| `articles_published` | `articles` count | Content output |
| `avg_content_score` | `audit_logs: Scored Content.score` mean | Content quality |
| `has_schema_markup` | `audit_logs: Generated JSON-LD Schema` ever | Technical GEO signal |
| `schema_types_used` | Distinct schema types generated | Schema breadth |

### 3h. Citability Lab Features (from `geo_experiments`)
> Fast-mode A/B experiments measure which content levers AI engines prefer
> in-context. This is a separate signal from live citation probes — it captures
> intent-level content quality before deployment.

| Feature | Source | Notes |
|---|---|---|
| `experiments_run` | `geo_experiments` count | Platform engagement signal |
| `avg_experiment_win_rate` | Winner variant citation rate across experiments | Content quality signal |
| `most_effective_lever` | Most frequent winning `leverId` | Best-fit format for this brand |
| `lever_diversity` | Distinct levers tested | Exploration breadth |

---

## 4. Training Data Collection

### Already being collected (Firestore)
- ✅ `facts` — statements, entropyScore, category, timestamps
- ✅ `citation_tests` — full probe results per query per platform (all 7 engines), citationRate, sentimentBreakdown, avgPositionPct, timestamps
- ✅ `sovMetrics` — aSov, err, compGap, aiTraffic over time
- ✅ `audit_logs` — all user actions with timestamps and metadata
- ✅ `competitors` — decay scores, trojan horse opportunities
- ✅ `articles` — generated topics, timestamps
- ✅ `_embeddings_cache` — cached embedding vectors (reusable for model training)
- ✅ `knowledge_graph` — Perplexity-synced external facts per brand
- ✅ `geo_experiments` — Citability Lab A/B results (lever, winning variant, per-engine citation rates)
- ✅ `ga4_integrations` — GA4 OAuth tokens (server-side only); actual AI-referral sessions available via `runAttributionReport()`

### New engines added to `citation_tests.platformRates` since initial spec
- ✅ `grok` — xAI Grok-2, daily
- ✅ `deepseek` — DeepSeek Chat, daily
- ✅ `google_aio` — Google AI Overviews via SerpAPI, **Wednesdays only** (per-search cost; most valuable label for authority-weighted surfaces)

### Requires joining (not yet assembled)
- ⚙️ `(audit_actions_between_probes → citation_delta)` rows — the core training pair
- ⚙️ Feature matrix assembly script (reads all collections, builds tabular dataset per user per probe interval)
  - **IMPORTANT:** This script must read engine columns dynamically from `platformRates` keys — never hardcode the engine list, or newly-added engines will be silently dropped.

### Gaps to fill
- ⬜ Individual manual fact additions don't log to `audit_logs` (need to add)
- ⬜ Permutation engine output not yet stored (future: `fact_permutations` collection)
- ⬜ `cited_by_permutation` label (future: probe permutations, label each format)
- ⬜ `ga4_sessions_from_ai` per-engine (GA4 attribution data) not yet joined into training rows — worth adding once enough users have GA4 connected (closes the loop from "cited" to "clicked")

---

## 5. Model Architecture

### Phase 1 (current scale: <50 users)
**Gradient Boosted Trees (XGBoost or LightGBM)**
- Handles tabular data with missing values naturally
- Finds non-linear feature interactions without manual engineering
- Fast to train and retrain as new data arrives
- Produces feature importance scores (explainable to users)

### Phase 2 (50–500 users)
**Ensemble: GBT + Shallow Neural Network**
- Neural net processes the sequential audit action features (LSTM or attention)
- GBT processes the static snapshot features
- Outputs combined citation rate prediction

### Phase 3 (500+ users)
**Fine-tuned LLM for recommendation**
- Input: full user state serialised as structured text
- Output: specific recommended next action with rationale
- Training data: (user_state, action_taken, outcome) tuples from platform history
- This is where Citacious becomes genuinely predictive rather than rule-based

---

## 6. The Citacious Connection

Citacious currently uses rule-based quest stages. The model enables two upgrades:

**Near-term (no ML needed):** Feed Citacious the user's actual action→outcome history via the `actionHistory` field in the system prompt. Citacious can reason about "you added 5 facts, published 2 articles, waited 3 weeks, and your citation rate rose from 14% to 23%" without any trained model.

**Medium-term (Phase 1 model):** Citacious receives a model prediction alongside the user context. "The model predicts your citation rate will reach 31% if you publish 2 more GEO articles targeting your uncited queries before your next probe."

**Long-term (Phase 3):** Citacious IS the model. The LLM is fine-tuned on successful GEO strategies from real platform users. Every recommendation is grounded in what actually worked for comparable brands.

---

## 7. Proprietary Moat

This dataset cannot be reconstructed from public sources because it requires:
1. A GEO platform with real user adoption
2. Real citation probe results as ground truth (not simulated)
3. The semantic coordinates (embeddings) of each brand's facts
4. The time-series of actions taken between measurable outcomes
5. Cross-brand patterns that only emerge from aggregate data

All four are being collected simultaneously as the platform runs. The dataset grows automatically with every user action.

---

## 8. Validation Timeline

**Immediate:** Use L8EntSpace's own brand as the test case.
- Run cite-probe → establish baseline citation rate
- Execute the full workflow (add facts → agents pipeline → publish content on l8entspace.com)
- Wait 6–8 weeks (LLM indexing lag)
- Re-run probe → measure delta

**This is the most important experiment before any commercial launch.** If the workflow demonstrably moves citation rate for L8EntSpace, the product claim is proven. If it doesn't, we learn why before selling it to anyone else.

---

## 9. Cost Structure (per active brand per month)

_See `docs/unit-economics.md` for the full breakdown. Summary here._

| Component | Monthly Cost |
|---|---|
| Embedding API (after initial cache) | ~$0.00 |
| Citation Probe — 5 token-billed engines (daily) | ~$0.08 |
| Citation Probe — Perplexity (Mon + Thu only) | ~$0.25 |
| Citation Probe — Google AI Overviews via SerpAPI (Wed only) | ~$0.37 |
| Brand-probe cron — Exa crawl (content gen) | ~$0.025/run |
| Firestore reads/writes | ~$0.05 |
| **Total variable cost per brand (typical Pro user)** | **~$12–20/mo** |

Hard monthly caps prevent overrun: `MONTHLY_CEILING_USD = 30` in the brand-probe cron; `$15/mo` in the Citability Lab experiment route.

Infrastructure (Netlify Pro ~$19, Firebase Blaze ~$0–25) is a shared fixed cost.
At $499/mo Pro subscription, gross margin is ~97%. Full tier breakdown in `docs/unit-economics.md`.

The strategic play: price low during data collection phase → build model → the model creates a switching cost that justifies higher pricing once proven.

---

*Last updated: 2026-05-29*
