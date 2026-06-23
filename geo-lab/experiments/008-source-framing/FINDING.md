# Experiment Finding

**Hypothesis**: If claims are framed as third-party attributions ("According to independent testing…") instead of first-person brand claims ("We found that…"), then citation rate will be higher for product-evaluation queries, because LLMs trust attributed neutral claims over apparent self-promotion.

**Run at**: 2026-06-17T22:11:59.223Z
**Collection window**: < 1 day (2026-06-17 → 2026-06-17)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 5 | 8 | 62.5% | [30.6%, 86.3%] |

**B vs A**: +50.0pp, z=2.066, p=0.0389

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 8 | 8 | 100.0% | [67.6%, 100%] |

**B vs A**: +100.0pp, z=4, p=0.0001

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 1 | 8 | 12.5% | [2.2%, 47.1%] |

**B vs A**: +12.5pp, z=1.033, p=0.3017

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [21.5%, 78.5%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -25.0pp, z=-1.033, p=0.3017

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 5 | 32 | 15.6% |
| B | 16 | 32 | 50.0% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=6.977, p=0.0083, common odds ratio=4.14 (16 informative strata) — ✓ significant

*Sensitivity (stratified by engine only)*: p=0.006, OR=4.26. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A +34.4pp, z=2.928, p=0.0034._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| Does NovaCRM actually help sales teams close deals faster? | 0/8 (0%) | 4/8 (50%) |
| How much does NovaCRM reduce the sales cycle? | 2/8 (25%) | 2/8 (25%) |
| Is NovaCRM worth it for shortening deal time? | 1/8 (13%) | 5/8 (63%) |
| What results do sales teams see after adopting NovaCRM? | 2/8 (25%) | 5/8 (63%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +50.0pp (p=0.0389) — ≈ suggestive (nominal p<0.05 only — does NOT survive correction)
- **OPENAI**: B vs A: +100.0pp (p=0.0001) — ✓ significant (survives correction)
- **PERPLEXITY**: B vs A: +12.5pp (p=0.3017) — ✗ no significant effect
- **CLAUDE**: B vs A: -25.0pp (p=0.3017) — ✗ no significant effect

**Bottom line**: the effect survives multiple-comparison correction on 1 of 4 engines, with a nominal-only (uncorrected) signal on 1 more. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

> **⚠ Simpson's-paradox warning**: the pooled effect points positive while one or more engines point the opposite way. The pooled number is misleading here — **report per engine, not the aggregate.**

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 15.6% | 71.9% |
| B | 50.0% | 46.9% |

Inter-method agreement: raw **42.2%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **-0.09**, Gwet's AC1 = **-0.15**. **⚠ The two methods disagree in direction** — the verbatim result may be a quotability artifact. Do not publish as a citation-preference finding until resolved.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 32 pooled trials per variant and a 16% control baseline, the minimum reliably detectable lift is ~25.4pp (two-sided α=0.05, 80% power).  Detecting a 10pp lift from this baseline needs ~207 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
