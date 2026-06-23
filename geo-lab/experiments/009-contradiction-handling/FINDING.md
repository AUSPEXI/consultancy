# Experiment Finding

**Hypothesis**: If content explicitly addresses and refutes a common false claim about the topic, then citation rate will be higher for evaluative/comparison queries than content that ignores competing narratives, because LLMs prioritise sources that resolve ambiguity.

**Run at**: 2026-06-22T14:31:11.555Z
**Collection window**: 2.1 days (2026-06-20 → 2026-06-22)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 24 | 0.0% | [0%, 13.8%] |
| B | 0 | 24 | 0.0% | [0%, 13.8%] |

**B vs A**: 0.0pp, z=0, p=1

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 24 | 0.0% | [0%, 13.8%] |
| B | 0 | 24 | 0.0% | [0%, 13.8%] |

**B vs A**: 0.0pp, z=0, p=1

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 24 | 0.0% | [0%, 13.8%] |
| B | 0 | 24 | 0.0% | [0%, 13.8%] |

**B vs A**: 0.0pp, z=0, p=1

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 24 | 0.0% | [0%, 13.8%] |
| B | 0 | 24 | 0.0% | [0%, 13.8%] |

**B vs A**: 0.0pp, z=0, p=1

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 0 | 96 | 0.0% |
| B | 0 | 96 | 0.0% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=0, p=1 (16 informative strata) — ✗ not significant

*Sensitivity (stratified by engine only)*: p=1. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A 0pp, z=0, p=1._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| Is NovaCRM only suitable for large enterprise sales teams? | 0/24 (0%) | 0/24 (0%) |
| Can a small sales team actually use NovaCRM, or is it overkill? | 0/24 (0%) | 0/24 (0%) |
| Is it true that NovaCRM is too complex for startups? | 0/24 (0%) | 0/24 (0%) |
| Does NovaCRM work for small businesses or just big companies? | 0/24 (0%) | 0/24 (0%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **OPENAI**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **PERPLEXITY**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **CLAUDE**: B vs A: 0.0pp (p=1) — ✗ no significant effect

**Bottom line**: no significant effect on any engine. Valid null result under these conditions.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 96 trials collected over 2.1 days. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-20: 32, 2026-06-21: 32, 2026-06-22: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 24 trials per platform-variant (96 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 96 pooled trials per variant and a 0% control baseline, the minimum reliably detectable lift is ~0pp (two-sided α=0.05, 80% power). This null is therefore only evidence against effects **larger** than ~0pp; a smaller true effect could be missed at this n. Detecting a 10pp lift from this baseline needs ~0 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
