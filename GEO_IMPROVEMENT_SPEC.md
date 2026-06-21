# GEO Lab + Dashboard — Implementation Spec

**Audience:** the engineer (Claude Code) implementing in this repo.
**Scope:** `consultancy-next/` (the product) and `geo-lab/` (the research lab).
**Guiding principle:** every change must make the system *more honest* and *more
valuable* at the same time. Where they ever conflict, honesty wins — for a GEO
company the provable claim ("verified this week, with a confidence interval") is
the moat. Do not ship anything that overstates a result.

---

## 0. Orientation — the three citation pathways (read first)

The codebase measures citation in three places, and each tests a *different*
mechanism. Conflating them is the central bug this spec fixes.

| Surface | Code | Mechanism it measures |
|---|---|---|
| Lab A/B probe | `geo-lab/scripts/probe.mjs` | **In-context selection** — both variants pasted as `SOURCE A/B`, model picks |
| Product probe (Gemini, ChatGPT, Claude, Grok, DeepSeek) | `consultancy-next/src/lib/cite-probe-core.ts` | **Parametric recall** — bare query, *no web tool*; does the model know the brand from training? |
| Product probe (Perplexity, `google_aio`) | same file | **Live retrieval** — sonar + real Google AI Overview via SerpAPI |

**The problem:** 5 of 7 product engines send a bare query with no web tool, so
they measure *training recall*. A young client brand will read "not cited" on
those 5 engines even when it is winning grounded answers — and all of our lever
advice (`geo-experiment-levers.ts`, `LEVER_GUIDANCE` in `publish-finding.mjs`)
moves **retrieval**, not training weight. We advise a game we don't score.

The workstreams below are ordered by impact. WS1 and WS4 are the flagship.

---

## WS1 — Grounded probe mode + pathway labelling (flagship)

**Goal:** every engine can be probed in its real *retrieval* mode, and every
result is labelled with the pathway it reflects, so "not cited (parametric)" is
shown as expected-for-a-young-brand rather than a failing grade.

### Files
- `consultancy-next/src/lib/cite-probe-core.ts` (core changes)
- `consultancy-next/app/api/cite-probe/route.ts` (pass mode through, persist pathway)
- `consultancy-next/app/dashboard/cite-probe/page.tsx` + any result component (UI labels)

### Contract changes
Extend the result type and add a capability map:

```ts
export type Pathway = 'parametric' | 'grounded';

// What each engine can do. DeepSeek has no native web search → parametric only.
export const ENGINE_PATHWAYS: Record<PlatformKey, Pathway[]> = {
  gemini:     ['parametric', 'grounded'],
  chatgpt:    ['parametric', 'grounded'],
  claude:     ['parametric', 'grounded'],
  grok:       ['parametric', 'grounded'],
  perplexity: ['grounded'],            // sonar always retrieves
  deepseek:   ['parametric'],          // no web tool today
  google_aio: ['grounded'],            // SerpAPI = real Google
};

export interface PlatformResult {
  // ...existing fields...
  pathway?: Pathway;                   // which mode produced THIS result
  sourceUrls?: string[] | null;        // structured citations returned by the engine (grounded)
  citedInSources?: boolean;            // brand domain appeared in sourceUrls
}
```

Add `mode: 'parametric' | 'grounded' | 'both'` to `runCitationProbe` opts and
thread it down through `probeQuery` into each `probe*` function.

### Grounded calls per engine (verify exact tool/version strings against current
provider docs at implementation time — these move)

- **OpenAI (`probeChatGPT`)** — use the Responses API with the web-search tool
  instead of `chat.completions`:
  ```ts
  const r = await client.responses.create({
    model: 'gpt-4o-mini',
    tools: [{ type: 'web_search' }],     // confirm: 'web_search' vs 'web_search_preview'
    input: query,
    temperature: 0.3,
  });
  // text: r.output_text; citations live in output items of type 'url_citation'
  ```
- **Gemini (`probeGemini`)** — enable Google Search grounding:
  ```ts
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: { temperature: 0.3, tools: [{ googleSearch: {} }] },
  });
  // citations: res.candidates[0].groundingMetadata.groundingChunks[].web.uri
  ```
- **Claude (`probeClaude`)** — add the web-search tool to the messages call:
  ```ts
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    messages: [{ role: 'user', content: query }],
  })
  // parse text from content[] blocks; URLs from web_search_tool_result blocks
  ```
- **Grok (`probeGrok`)** — xAI Live Search:
  ```ts
  body adds: search_parameters: { mode: 'auto', return_citations: true }
  // citations array on the response
  ```
- **Perplexity / Google AIO** — already grounded. Just set `pathway:'grounded'`
  and populate `sourceUrls` (Perplexity `search_results`/`citations`; AIO already
  folds reference links in `flattenAioText`).
- **DeepSeek** — leave parametric; if asked for grounded, return `SKIPPED` with a
  reason `'no native web search'`.

### Citation detection in grounded mode (important)
A brand is "cited" in grounded mode if **either**:
1. it's named in the answer text (existing `checkCitation`), **or**
2. its **domain** appears in the engine's returned `sourceUrls` (the real
   "cited as a source" signal that matters most for GEO).

Add a domain-match helper and set `citedInSources`; final `cited = cited || citedInSources`.

### Cost
Grounded calls cost more (search billing). Update `estimateProbeCost` with a
grounded multiplier per engine and show the estimate before a grounded run.
Gate grounded mode behind a paid tier if needed (mirror `enforceFreeProbeMeter`).

### UI
- Tab/toggle: **Parametric (do they know you?)** vs **Grounded (do they cite you
  when they search?)**.
- Badge each engine row with its pathway. For parametric "not cited" on a young
  brand, render the honest helper text: *"Not in training data yet — expected for
  a new brand. Switch to Grounded to test what you can influence now."*

### Acceptance criteria
- A grounded probe of a known-but-not-famous brand returns ≥1 `sourceUrls` entry
  on Perplexity/Gemini/Claude/OpenAI and correctly sets `citedInSources` when the
  brand domain is among them.
- Every stored `PlatformResult` has a `pathway`.
- UI never shows a bare "0%" without its pathway label.

---

## WS2 — Repeat-sampling + head-to-head significance

**Goal:** product citation rates carry real uncertainty and competitor
comparisons carry a p-value. (`wilsonCI95` already exists; sampling and testing
do not — note `estimateProbeCost(passes)` means *brand count*, not trials.)

### Files
- `consultancy-next/src/lib/cite-probe-core.ts`
- `consultancy-next/app/api/cite-probe/route.ts`

### Changes
1. Add `trialsPerQuery = 1` (default 3 for paid) to `runCitationProbe`/`probeBrandRate`.
   Loop each query `trialsPerQuery` times; a query's `cited` becomes a count k/n,
   not a boolean. Keep total API budget visible (n_queries × trials × engines).
2. Compute `ci95` on the trial-level k/n (more trials ⇒ tighter band) rather than
   query-level only.
3. Add a head-to-head test for competitor comparison. Port the two-proportion
   z-test from `geo-lab/scripts/analyze.mjs` (`twoProportionZ`, `normalCDF`) into a
   shared util and return `{ diffPp, z, pValue }` for brand-vs-competitor. Show
   "statistically ahead / behind / inconclusive at this n" instead of bare bars.
4. Differential missingness: track per-engine `attempted` vs `completed`; surface a
   warning when an engine completed materially fewer trials (errors/rate-limits),
   and add exponential-backoff retry (250ms→2s, 3 tries) in each `probe*` on
   429/5xx before giving up.

### Acceptance criteria
- A 3-trial probe shows a narrower `ci95` than a 1-trial probe on the same queries.
- Competitor comparison renders a p-value and an honest verdict at low n
  ("inconclusive — n too small").
- A forced 429 on one engine triggers retries and a missingness note, not a
  silently smaller denominator.

---

## WS3 — Optional LLM-judge scoring tier

**Goal:** replace substring/wordlist heuristics with semantic judgement when
accuracy matters, reusing the lab's proven approach.

### Files
- New: `consultancy-next/src/lib/cite-judge.ts` (port of `geo-lab/scripts/llm-judge.mjs`)
- `consultancy-next/src/lib/cite-probe-core.ts` (call judge when `scoring:'semantic'`)
- `consultancy-next/src/lib/llm-orchestrator.ts` (reuse existing `executeCall`)

### Why
`checkCitation` matches the brand by substring (false positives when a brand name
is a common word) and scores sentiment by `POSITIVE_WORDS`/`NEGATIVE_WORDS` (misses
negation, sarcasm, context). The lab already solved attribution bias with an LLM
judge — bring it over as an opt-in tier.

### Design
- Default tier = current heuristic (free, cheap).
- `scoring: 'semantic'` (paid) = after each probe, a neutral judge decides
  cited?/accurate?/sentiment from the raw answer. **Use a different judge family
  than the engine being judged** to avoid self-preference (e.g. don't judge Claude
  outputs with Claude). Report inter-method agreement as **Cohen's κ** (or Gwet's
  AC1 — better under skew), not raw % agreement.
- Route via `llmOrchestrator.executeCall` so cost is logged like everything else.

### Acceptance criteria
- A brand whose name is a common English word stops getting false-positive
  citations under semantic scoring.
- The probe result records which scorer ran and (when both ran) their κ.

---

## WS4 — Evidence-linked content-scorer (close the lab→product loop)

**Goal:** the content-scorer's axes and recommendations are weighted and
justified by the lab's *measured* effect sizes, not LLM opinion alone. This is the
"every rule has a number behind it" differentiator.

### Current state
- `app/api/content-scorer/route.ts` asks an LLM to rate Entity Density / Citation
  Likelihood / Inverted Pyramid / Statistical Anchors → `ContentScorerSchema`.
- `app/api/geo-findings/route.ts` GET **already returns** validated findings:
  `{ lever, headline, recommendation, topEffect:{platform,treatment,diffPp,pValue},
  verificationStatus, lastVerifiedAt, retestCount }`, sorted verified-first.
- The scorer **does not read** findings. Wire them together.

### Changes
1. In the content-scorer route, fetch active findings (read the `geo_findings`
   collection directly via `dbAdmin`, same source the GET uses — avoid an internal
   HTTP hop). Build a lever→evidence map.
2. Map each scorer axis to its lever(s) and:
   - **Weight** `overallScore` by measured lift: a lever with a large, *verified*
     `diffPp` contributes more than one that's `preliminary`/`unverified`. Down-weight
     `preliminary` and exclude `decayed`.
   - **Attach evidence** to each feedback item: e.g.
     `"Lead with a statistic — +31pp on Claude, p=0.007, verified 2026-06-18 [exp 001]."`
3. Extend `ContentScorerSchema` (`src/lib/output-validation.ts`) with an optional
   `evidence` array per feedback item: `{ lever, diffPp, pValue, verificationStatus, experimentId }`.
   Keep it optional so existing callers don't break.
4. **Honesty guard:** if a lever has no `supported`/`verified` finding, the scorer
   may still suggest it but must label it `"hypothesis — not yet validated in our lab"`.
   Never present an unproven lever as proven.

### Acceptance criteria
- Content-scorer feedback items for levers with findings render the effect size,
  p-value, and verification date.
- Removing/decaying a finding (set `verificationStatus:'decayed'`) removes its
  confident recommendation on the next scorer run.
- Levers without evidence are explicitly marked as hypotheses.

---

## WS5 — FDR ledger + finish the decay/verified surface

**Goal:** programme-level false-discovery control, and make verification status
visible everywhere a finding is shown.

### Files
- `geo-lab/scripts/` — new `fdr-ledger.mjs`
- `geo-lab/experiments/*/finding.json` — add `qValue`
- `consultancy-next/src/data/labFindings.ts` + public lab page (`app/lab/page.tsx`)
- product finding badges (`app/dashboard/geo-lab/page.tsx`, geo-audit, content-scorer)

### Changes
1. `fdr-ledger.mjs`: read every `experiments/*/finding.json`, collect each
   experiment's **primary** p-value (the CMH primary endpoint already in
   `analyze.mjs`), apply Benjamini–Hochberg across the whole programme, write back
   a `qValue` per finding and emit a `results/ledger.json` summary.
2. `publish-finding.mjs`: include `qValue` in the payload; `geo-findings` route:
   store and return it; UI: show q alongside p ("survives FDR across N experiments").
3. Finish decay badges: the data is already on `geo_findings`
   (`verificationStatus`, `lastVerifiedAt`, `retestCount`) and the GET sorts
   verified-first — render the badge in the dashboard components that list
   findings/recommendations. A `decayed` finding must visibly demote.
4. `labFindings.ts` is currently hand-maintained and must mirror `finding.json`.
   Add a check (script or test) that fails if a `labFindings` entry's numbers drift
   from the committed `finding.json`, so the public page can never overstate.

### Acceptance criteria
- Each finding shows a q-value; a borderline p that fails FDR is not presented as
  a confirmed effect.
- Decayed findings are visibly demoted in every surface that lists findings.
- CI fails if `labFindings.ts` disagrees with `finding.json`.

---

## WS6 — geo-lab methodology hardening

**Files:** `geo-lab/scripts/probe.mjs`, `analyze.mjs`, `llm-judge.mjs`,
`context/experiment-methodology.md`.

1. **Temperature** — `probe.mjs` sets none (provider defaults). Pin and log
   `temperature` per trial (match the product's 0.3) so runs are reproducible and
   the methodology doc's "hold temperature fixed" is actually enforced.
2. **Output-length confound** — `probe.mjs` sets `max_tokens: 600` for
   OpenAI/Perplexity/Claude but nothing for Gemini. Longer answers cite more
   sources. Normalise max output across all four callers.
3. **Trial independence** — `analyze.mjs` `twoProportionZ` assumes independent
   trials, but trials sharing a query are correlated. Stratify CMH by query×engine
   (or add query as a cluster) and report the per-query breakdown + intra-query
   correlation. At minimum, flag clustering as a known limitation in `FINDING.md`.
4. **Agreement metric** — replace raw % agreement (verbatim vs LLM-judge) with
   **Cohen's κ / Gwet's AC1** (raw agreement is inflated by the common "not cited"
   case under skew).
5. **Judge self-preference** — `llm-judge.mjs` judges Claude outputs with Claude
   Haiku. Switch the judge to a different family (or ensemble of 2–3, report κ).
6. **Differential missingness** — add 429/5xx backoff-retry in the four callers;
   have `analyze.mjs` warn when per-platform completion rates diverge materially.
7. **Power / MDE** — `DESIGN.md` template: add an a-priori power calc (expected
   effect → required n) and have `analyze.mjs` print the post-hoc **minimum
   detectable effect** next to every null so "true null" vs "underpowered" is clear.
8. **External-validity caveat** — `FINDING.md` threats section must state: probes
   hit APIs (Claude = Haiku, no tools), which is not the same system as Claude.ai /
   ChatGPT search / AI Overviews; findings transfer as *mechanism* evidence.

### Acceptance criteria
- `raw.json` records temperature; all four engines share a max-output cap.
- `FINDING.md` reports κ (not raw %), an MDE for nulls, and the external-validity caveat.
- A simulated rate-limit produces retries + a missingness warning.

---

## WS7 — Consistency nits (cheap, do last)

1. **Centralise model IDs.** They're duplicated: `probe.mjs` (`callers` +
   `MODEL_VERSIONS`), `cite-probe-core.ts` (`probe*` + `ENGINE_MODEL_VERSIONS`),
   `geo-experiment-core.ts`. One const per repo, referenced by both the call and
   the version log, so drift-logging can't desync from the actual model called.
2. **Brand substring false-positives.** `checkCitation` flags a citation on any
   substring match of the brand. Add word-boundary matching and a min-length /
   common-word guard (covered more robustly by WS3 semantic tier).
3. **Dashboard repo cosmetics.** `geo-experiment-dashboard/README.md` still ships
   the AI-Studio/Gemini boilerplate banner + `GEMINI_API_KEY`-only setup; make it
   provider-neutral.

---

## Suggested order & branching
1. WS1 (grounded mode + pathway labels) — highest leverage.
2. WS4 (evidence-linked scorer) — turns the lab into the product differentiator.
3. WS2 (sampling + significance) — makes numbers defensible.
4. WS5 (FDR + decay badges) — programme-level trust.
5. WS3 (semantic judge tier), WS6 (lab hardening), WS7 (nits).

Land each workstream as its own PR with the acceptance criteria above as the
test checklist. Keep `labFindings.ts` / public claims in lockstep with
`finding.json` at every step — the public-facing honesty is the product.
