# Experiment Finding

**Hypothesis**: If facts are presented as a bulleted list, then citation rate will be higher than equivalent paragraph prose for feature-and-capability queries, because list items are discrete, copy-pasteable, and easier for LLMs to extract and attribute.

**Run at**: 2026-06-17T21:54:55.042Z
**Collection window**: < 1 day (2026-06-17 → 2026-06-17)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 3 | 8 | 37.5% | [13.7%, 69.4%] |

**B vs A**: +12.5pp, z=0.539, p=0.5896

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: -12.5pp, z=-1.033, p=0.3017

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: -25.0pp, z=-1.512, p=0.1306

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: -25.0pp, z=-1.512, p=0.1306

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 7 | 32 | 21.9% |
| B | 3 | 32 | 9.4% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=1.125, p=0.2888, common odds ratio=0.38 (16 informative strata) — ✗ not significant

*Sensitivity (stratified by engine only)*: p=0.3006, OR=0.36. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A -12.5pp, z=-1.377, p=0.1685._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| What features does NovaCRM offer to help sales teams close deals fa... | 2/8 (25%) | 2/8 (25%) |
| How does NovaCRM speed up the sales cycle? | 4/8 (50%) | 0/8 (0%) |
| What are the key capabilities of NovaCRM for sales teams? | 1/8 (13%) | 1/8 (13%) |
| Can you summarize what NovaCRM does and its main benefits? | 0/8 (0%) | 0/8 (0%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +12.5pp (p=0.5896) — ✗ no significant effect
- **OPENAI**: B vs A: -12.5pp (p=0.3017) — ✗ no significant effect
- **PERPLEXITY**: B vs A: -25.0pp (p=0.1306) — ✗ no significant effect
- **CLAUDE**: B vs A: -25.0pp (p=0.1306) — ✗ no significant effect

**Bottom line**: no significant effect on any engine. Valid null result under these conditions.

> **⚠ Simpson's-paradox warning**: the pooled effect points negative while one or more engines point the opposite way. The pooled number is misleading here — **report per engine, not the aggregate.**

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 21.9% | 93.8% |
| B | 9.4% | 50.0% |

Inter-method agreement: raw **40.6%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.09**, Gwet's AC1 = **-0.17**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 32 pooled trials per variant and a 22% control baseline, the minimum reliably detectable lift is ~29pp (two-sided α=0.05, 80% power). This null is therefore only evidence against effects **larger** than ~29pp; a smaller true effect could be missed at this n. Detecting a 10pp lift from this baseline needs ~269 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
