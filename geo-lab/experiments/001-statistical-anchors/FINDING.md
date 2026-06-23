# Experiment Finding

**Hypothesis**: If the opening sentence contains a specific number ("cut latency 43%"), then citation rate will be higher than a version with vague language ("improved latency significantly") for product-performance queries, because LLMs weight precise, citable data points as credibility signals.

**Run at**: 2026-06-11T22:03:00.720Z
**Collection window**: 1.4 days (2026-06-10 → 2026-06-11)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 16 | 0.0% | [0%, 19.4%] |
| B | 5 | 16 | 31.3% | [14.2%, 55.6%] |

**B vs A**: +31.3pp, z=2.434, p=0.0149

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 16 | 0.0% | [0%, 19.4%] |
| B | 3 | 16 | 18.8% | [6.6%, 43%] |

**B vs A**: +18.8pp, z=1.819, p=0.0688

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 8 | 16 | 50.0% | [28%, 72%] |
| B | 11 | 16 | 68.8% | [44.4%, 85.8%] |

**B vs A**: +18.8pp, z=1.08, p=0.2802

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 16 | 25.0% | [10.2%, 49.5%] |
| B | 16 | 16 | 100.0% | [80.6%, 100%] |

**B vs A**: +75.0pp, z=4.382, p=0

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 12 | 64 | 18.8% |
| B | 35 | 64 | 54.7% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=23.366, p=0, common odds ratio=24 (16 informative strata) — ✓ significant

*Sensitivity (stratified by engine only)*: p=0, OR=10.2. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A +35.9pp, z=4.217, p=0._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| How much faster can NovaCRM help sales teams close deals? | 2/16 (13%) | 6/16 (38%) |
| Does NovaCRM actually speed up the sales cycle? | 3/16 (19%) | 11/16 (69%) |
| What performance results does NovaCRM deliver for closing deals? | 2/16 (13%) | 8/16 (50%) |
| Is NovaCRM effective at shortening deal-closing time for sales teams? | 5/16 (31%) | 10/16 (63%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +31.3pp (p=0.0149) — ✓ significant (survives correction)
- **OPENAI**: B vs A: +18.8pp (p=0.0688) — ✗ no significant effect
- **PERPLEXITY**: B vs A: +18.8pp (p=0.2802) — ✗ no significant effect
- **CLAUDE**: B vs A: +75.0pp (p=0) — ✓ significant (survives correction)

**Bottom line**: the effect survives multiple-comparison correction on 2 of 4 engines. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 18.8% | 21.4% |
| B | 54.7% | 94.6% |

Inter-method agreement: raw **60.7%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.23**, Gwet's AC1 = **0.21**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 64 trials collected over 1.4 days. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-10: 32, 2026-06-11: 32
- **Model versions stable**: No model version changes detected across batches ().
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **⚠ Low attribution sensitivity**: the variants share almost all text (smallest unique-fingerprint set = 6). The content-fingerprint scorer can barely tell them apart, so a null result here may be a measurement artifact rather than a true no-effect. Treat any null with extreme caution; make the variants more distinct on the tested dimension.
- **Sample size**: 16 trials per platform-variant (64 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 64 pooled trials per variant and a 19% control baseline, the minimum reliably detectable lift is ~19.3pp (two-sided α=0.05, 80% power).  Detecting a 10pp lift from this baseline needs ~240 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
