# Experiment Finding

**Hypothesis**: If content names 3+ concrete entities (products, people, standards, organisations) per 100 words, then citation rate will be higher for product-evaluation queries than sparse entity usage, because entity density makes content more graspable to retrieval systems.

**Run at**: 2026-06-18T00:30:38.930Z
**Collection window**: < 1 day (2026-06-18 → 2026-06-18)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 6 | 8 | 75.0% | [40.9%, 92.9%] |

**B vs A**: +50.0pp, z=2, p=0.0455

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: +25.0pp, z=1.512, p=0.1306

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 4 | 8 | 50.0% | [21.5%, 78.5%] |

**B vs A**: +25.0pp, z=1.033, p=0.3017

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 6 | 8 | 75.0% | [40.9%, 92.9%] |

**B vs A**: +75.0pp, z=3.098, p=0.0019

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 4 | 32 | 12.5% |
| B | 18 | 32 | 56.3% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=13.342, p=0.0003, common odds ratio=15 (16 informative strata) — ✓ significant

*Sensitivity (stratified by engine only)*: p=0.0005, OR=10.33. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A +43.8pp, z=3.685, p=0.0002._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| What CRM helps sales teams close deals faster and integrates with c... | 0/8 (0%) | 1/8 (13%) |
| Which sales CRM connects with Slack and Salesforce and is SOC 2 com... | 0/8 (0%) | 7/8 (88%) |
| I need a CRM that integrates with my email and messaging apps — wha... | 3/8 (38%) | 6/8 (75%) |
| What is NovaCRM and what does it integrate with? | 1/8 (13%) | 4/8 (50%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +50.0pp (p=0.0455) — ≈ suggestive (nominal p<0.05 only — does NOT survive correction)
- **OPENAI**: B vs A: +25.0pp (p=0.1306) — ✗ no significant effect
- **PERPLEXITY**: B vs A: +25.0pp (p=0.3017) — ✗ no significant effect
- **CLAUDE**: B vs A: +75.0pp (p=0.0019) — ✓ significant (survives correction)

**Bottom line**: the effect survives multiple-comparison correction on 1 of 4 engines, with a nominal-only (uncorrected) signal on 1 more. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 12.5% | 15.6% |
| B | 56.3% | 90.6% |

Inter-method agreement: raw **71.9%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.45**, Gwet's AC1 = **0.45**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-18: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 32 pooled trials per variant and a 13% control baseline, the minimum reliably detectable lift is ~23.2pp (two-sided α=0.05, 80% power).  Detecting a 10pp lift from this baseline needs ~172 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
