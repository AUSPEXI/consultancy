# Unit Economics

How much it costs to serve an L8EntSpace user, and the margin per tier.
Numbers are grounded in the cost rates hardcoded into the app, not estimates.

_Last reviewed: 2026-06-09._

## Sources of truth

- **Pricing**: `consultancy-next/src/constants/tiers.ts` — `TIER_PRICES`
- **Per-engine API rates**: `consultancy-next/src/lib/cite-probe-core.ts` — `estimateProbeCost()`
- **Budget guards**: `consultancy-next/app/api/cron/brand-probe/route.ts`
  (`BRAND_PROBE_MONTHLY_TARGET_USD = 20`, `MONTHLY_CEILING_USD = 30`) and
  `app/api/geo-experiment/route.ts` ($15/mo feature guard)
- **Crawl cost**: `app/api/cron/daily-autopilot/route.ts` — Exa at `$0.025`/crawl

## Per-engine API cost (per query)

| Engine | Rate | Cost / query | Notes |
|---|---|---|---|
| Gemini Flash | $0.40 / 1M tok × ~500 tok | $0.0002 | cheapest |
| ChatGPT (4o-mini class) | $0.60 / 1M × ~800 tok | $0.0005 | |
| Claude | comparable token rate | ~$0.0005 | |
| DeepSeek | $0.28 / 1M | $0.0001 | |
| Grok (xAI) | $2.00 / 1M | $0.0016 | |
| **Perplexity** | flat per-request | **$0.005** | web-grounded; throttled |
| **Google AI Overviews** | SerpAPI per-search | **$0.013** | **most expensive — no chat API** |

**Key fact:** the two per-request-priced engines — Perplexity and Google AI
Overviews — dominate cost; the five token-billed engines combined are cheaper than
a single Google AIO search. This is why the `brand-probe` cron throttles both:
Perplexity runs Mon & Thu, Google AIO runs Wednesdays only, and both default *off*
in manual / Citability-Lab runs. Google AIO is per-search priced (SerpAPI $50/5k ≈
$0.01, ~1.3× to cover the occasional page_token redemption) because it has no public
API — it's the rendered Search surface read through SerpAPI.

## Per-user monthly variable cost

All the expensive features (Cite Probe, GEO Lab, Citability Lab) are
`requiredTier: 'Pro'`, so cost concentrates at Pro and above.

| Profile | Description | Variable cost / mo |
|---|---|---|
| Light | 1 brand, ~10 keywords, weekly probe, Perplexity throttled | $3–8 |
| Typical Pro | 1 brand + 3 competitors, sentiment/position, occasional experiment | $12–20 |
| Heavy | Perplexity unthrottled, frequent experiments, daily content gen | $25–35 |

Hard caps prevent runaway spend: $30 probe ceiling + $15 experiment guard +
Exa crawl ≈ $50/mo absolute worst case for a single user.

## Fixed infrastructure (platform-wide)

| Service | Tier | Cost / mo |
|---|---|---|
| Netlify | Pro (needed for 800s function timeouts) | ~$19 |
| Firebase (Auth + Firestore) | Blaze pay-as-you-go | ~$0–25 at low volume |
| Domain (l8entspace.com) | annual, amortized | ~$1–3 |
| Google OAuth / GA4 APIs | free | $0 |
| Voice agent (Aura ephemeral tokens) | usage | small, per-session |

**Floor: ~$40–50/mo** regardless of user count. Covered by the first Starter
subscriber; irrelevant thereafter.

## Margin per tier

| Tier | Price / mo | Variable cost | Gross margin $ | Gross margin % |
|---|---|---|---|---|
| Starter | $149 | $3–8 | ~$143 | 96% |
| Pro | $499 | $12–20 | ~$483 | 97% |
| Business | $1,899 | $60–120 | ~$1,810 | 95% |

Even a worst-case Pro user hitting every budget ceiling (~$50/mo) still leaves
~90% margin.

## Strategic implications

1. **Margins are SaaS-textbook (94–97%).** Variable cost is a handful of cheap
   LLM calls; the one expensive lever (Perplexity) is throttled by design.
2. **Budget guards protect the floor.** The $30 probe ceiling and $15 experiment
   guard keep even abusive usage above ~90% margin without manual intervention.
3. **Pro is the margin engine** — $499 against ~$15 cost is a ~33× markup. New
   engine coverage (incl. SERP-scraped Google AI Overviews at ~$2–5/mo extra)
   fits comfortably inside that envelope.
4. **The constraint is value perception, not cost.** At 96% margin the question
   is never "can we afford to run this" but "is the feature set worth the price."
   Invest freely in engine coverage and experiment depth — it barely moves COGS.

## Caveats

These are **variable / cost-to-serve margins**, not net. They exclude:

- Stripe fees (~2.9% + $0.30 per transaction)
- Support time and development cost
- Sales/marketing (CAC)

On raw cost-to-serve, the model is extremely healthy.
