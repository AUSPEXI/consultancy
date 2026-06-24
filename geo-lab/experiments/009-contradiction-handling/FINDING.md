# Experiment Finding

**Hypothesis**: If content explicitly addresses and refutes a common false claim about the topic, then citation rate will be higher for evaluative/comparison queries than content that ignores competing narratives, because LLMs prioritise sources that resolve ambiguity.

**Run at**: 2026-06-24T11:41:31.159Z
**Collection window**: 4.0 days (2026-06-20 → 2026-06-24)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 26 | 40 | 65.0% | [49.5%, 77.9%] |
| B | 27 | 40 | 67.5% | [52%, 79.9%] |

**B vs A**: +2.5pp, z=0.236, p=0.8131

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 40 | 2.5% | [0.4%, 12.9%] |
| B | 23 | 40 | 57.5% | [42.2%, 71.5%] |

**B vs A**: +55.0pp, z=5.367, p=0

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 22 | 40 | 55.0% | [39.8%, 69.3%] |
| B | 30 | 40 | 75.0% | [59.8%, 85.8%] |

**B vs A**: +20.0pp, z=1.875, p=0.0608

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 18 | 40 | 45.0% | [30.7%, 60.2%] |
| B | 16 | 40 | 40.0% | [26.3%, 55.4%] |

**B vs A**: -5.0pp, z=-0.452, p=0.651

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 67 | 160 | 41.9% |
| B | 96 | 160 | 60.0% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=10.724, p=0.0011, common odds ratio=2.15 (16 informative strata) — ✓ significant

*Sensitivity (stratified by engine only)*: p=0.0011, OR=2.15. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A +18.1pp, z=3.243, p=0.0012._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| Is NovaCRM only suitable for large enterprise sales teams? | 20/40 (50%) | 23/40 (58%) |
| Can a small sales team actually use NovaCRM, or is it overkill? | 12/40 (30%) | 20/40 (50%) |
| Is it true that NovaCRM is too complex for startups? | 16/40 (40%) | 32/40 (80%) |
| Does NovaCRM work for small businesses or just big companies? | 19/40 (48%) | 21/40 (53%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +2.5pp (p=0.8131) — ✗ no significant effect
- **OPENAI**: B vs A: +55.0pp (p=0) — ✓ significant (survives correction)
- **PERPLEXITY**: B vs A: +20.0pp (p=0.0608) — ✗ no significant effect
- **CLAUDE**: B vs A: -5.0pp (p=0.651) — ✗ no significant effect

**Bottom line**: the effect survives multiple-comparison correction on 1 of 4 engines. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

> **⚠ Simpson's-paradox warning**: the pooled effect points positive while one or more engines point the opposite way. The pooled number is misleading here — **report per engine, not the aggregate.**

---

## Robustness — independent LLM-judge attribution

A neutral judge (gpt-4o-mini) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 41.9% | 40.4% |
| B | 60.0% | 99.3% |

Inter-method agreement: raw **59.2%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.11**, Gwet's AC1 = **0.25**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 160 trials collected over 4.0 days. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-20: 32, 2026-06-21: 32, 2026-06-22: 32, 2026-06-23: 32, 2026-06-24: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 40 trials per platform-variant (160 pooled per variant). Meets the lab minimum of 30 per platform-variant.
- **Statistical power**: at 160 pooled trials per variant and a 42% control baseline, the minimum reliably detectable lift is ~15.5pp (two-sided α=0.05, 80% power).  Detecting a 10pp lift from this baseline needs ~383 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
