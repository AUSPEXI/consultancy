# Experiment Finding

**Hypothesis**: If content opens by restating the query as a direct question instead of opening with the answer, then citation rate will be lower for how-to and definitional queries, because LLMs prefer answer-mode sources that present extractable claims over question-mode sources that defer the answer.

**Run at**: 2026-06-17T21:15:39.801Z
**Collection window**: < 1 day (2026-06-17 → 2026-06-17)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 5 | 8 | 62.5% | [30.6%, 86.3%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -37.5pp, z=-1.512, p=0.1306

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [21.5%, 78.5%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -25.0pp, z=-1.033, p=0.3017

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: 0.0pp, z=0, p=1

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: +12.5pp, z=0.641, p=0.5218

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 12 | 32 | 37.5% |
| B | 8 | 32 | 25.0% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=0.614, p=0.4334, common odds ratio=0.67 (16 informative strata) — ✗ not significant

*Sensitivity (stratified by engine only)*: p=0.4227, OR=0.56. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A -12.5pp, z=-1.079, p=0.2807._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| What's the best way to help my sales team close deals faster? | 0/8 (0%) | 8/8 (100%) |
| How can a CRM speed up the sales cycle? | 3/8 (38%) | 0/8 (0%) |
| Which tools help sales reps close more deals quickly? | 2/8 (25%) | 0/8 (0%) |
| What software shortens the time it takes to close a sale? | 7/8 (88%) | 0/8 (0%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: -37.5pp (p=0.1306) — ✗ no significant effect
- **OPENAI**: B vs A: -25.0pp (p=0.3017) — ✗ no significant effect
- **PERPLEXITY**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **CLAUDE**: B vs A: +12.5pp (p=0.5218) — ✗ no significant effect

**Bottom line**: no significant effect on any engine. Valid null result under these conditions.

> **⚠ Simpson's-paradox warning**: the pooled effect points negative while one or more engines point the opposite way. The pooled number is misleading here — **report per engine, not the aggregate.**

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 37.5% | 96.9% |
| B | 25.0% | 71.9% |

Inter-method agreement: raw **43.8%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.11**, Gwet's AC1 = **-0.10**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 32 pooled trials per variant and a 38% control baseline, the minimum reliably detectable lift is ~33.9pp (two-sided α=0.05, 80% power). This null is therefore only evidence against effects **larger** than ~33.9pp; a smaller true effect could be missed at this n. Detecting a 10pp lift from this baseline needs ~368 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
