# Experiment Finding

**Hypothesis**: If each claim is expressed as a single short sentence (≤15 words), then citation rate will be higher than the same claims expressed in long compound sentences (30+ words), because short standalone sentences are more quote-able in LLM answers.

**Run at**: 2026-06-18T12:19:59.926Z
**Collection window**: < 1 day (2026-06-18 → 2026-06-18)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 7 | 8 | 87.5% | [52.9%, 97.8%] |
| B | 3 | 8 | 37.5% | [13.7%, 69.4%] |

**B vs A**: -50.0pp, z=-2.066, p=0.0389

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [21.5%, 78.5%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -25.0pp, z=-1.033, p=0.3017

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 7 | 8 | 87.5% | [52.9%, 97.8%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -62.5pp, z=-2.52, p=0.0117

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 8 | 8 | 100.0% | [67.6%, 100%] |
| B | 5 | 8 | 62.5% | [30.6%, 86.3%] |

**B vs A**: -37.5pp, z=-1.922, p=0.0547

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 26 | 32 | 81.3% |
| B | 12 | 32 | 37.5% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=10.563, p=0.0012, common odds ratio=0.18 (16 informative strata) — ✓ significant

*Sensitivity (stratified by engine only)*: p=0.0007, OR=0.1. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A -43.8pp, z=-3.563, p=0.0004._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| How does NovaCRM help sales teams close deals faster? | 6/8 (75%) | 4/8 (50%) |
| What features does NovaCRM offer for improving sales conversion? | 6/8 (75%) | 4/8 (50%) |
| Is NovaCRM good for shortening the sales cycle? | 8/8 (100%) | 3/8 (38%) |
| What measurable results do teams get using NovaCRM? | 6/8 (75%) | 1/8 (13%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: -50.0pp (p=0.0389) — ≈ suggestive (nominal p<0.05 only — does NOT survive correction)
- **OPENAI**: B vs A: -25.0pp (p=0.3017) — ✗ no significant effect
- **PERPLEXITY**: B vs A: -62.5pp (p=0.0117) — ✓ significant (survives correction)
- **CLAUDE**: B vs A: -37.5pp (p=0.0547) — ✗ no significant effect

**Bottom line**: the effect survives multiple-comparison correction on 1 of 4 engines, with a nominal-only (uncorrected) signal on 1 more. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 81.3% | 93.8% |
| B | 37.5% | 59.4% |

Inter-method agreement: raw **64.1%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.20**, Gwet's AC1 = **0.36**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-18: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 32 pooled trials per variant and a 81% control baseline, the minimum reliably detectable lift is ~27.3pp (two-sided α=0.05, 80% power).  Detecting a 10pp lift from this baseline needs ~240 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
