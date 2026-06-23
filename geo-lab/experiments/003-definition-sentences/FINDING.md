# Experiment Finding

**Hypothesis**: If content uses "X is a Y that does Z" definitional structure, then citation rate will be higher than equivalent hedged narrative prose for "what is X" queries, because definitions are citation magnets — models reach for them when answering definitional questions.

**Run at**: 2026-06-17T19:53:07.704Z
**Collection window**: < 1 day (2026-06-17 → 2026-06-17)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [21.5%, 78.5%] |
| B | 8 | 8 | 100.0% | [67.6%, 100%] |

**B vs A**: +50.0pp, z=2.309, p=0.0209

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 8 | 8 | 100.0% | [67.6%, 100%] |

**B vs A**: +87.5pp, z=3.528, p=0.0004

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 7 | 8 | 87.5% | [52.9%, 97.8%] |

**B vs A**: +75.0pp, z=3, p=0.0027

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 3 | 8 | 37.5% | [13.7%, 69.4%] |
| B | 8 | 8 | 100.0% | [67.6%, 100%] |

**B vs A**: +62.5pp, z=2.697, p=0.007

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 9 | 32 | 28.1% |
| B | 31 | 32 | 96.9% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by query × engine)**, B vs A: χ²(1)=25.442, p=0 (16 informative strata) — ✓ significant

*Sensitivity (stratified by engine only)*: p=0, OR=177. Both stratifications agree on significance.

_Descriptive (naive pooled, not the primary test): B vs A +68.8pp, z=5.68, p=0._

### Per-query breakdown (B vs A, pooled across engines)

| Query | A cited | B cited |
|---|---|---|
| What is NovaCRM? | 1/8 (13%) | 8/8 (100%) |
| Can you explain what NovaCRM does for sales teams? | 2/8 (25%) | 8/8 (100%) |
| What kind of software is NovaCRM and who is it for? | 3/8 (38%) | 8/8 (100%) |
| I keep hearing about NovaCRM — what exactly is it? | 3/8 (38%) | 7/8 (88%) |

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +50.0pp (p=0.0209) — ✓ significant (survives correction)
- **OPENAI**: B vs A: +87.5pp (p=0.0004) — ✓ significant (survives correction)
- **PERPLEXITY**: B vs A: +75.0pp (p=0.0027) — ✓ significant (survives correction)
- **CLAUDE**: B vs A: +62.5pp (p=0.007) — ✓ significant (survives correction)

**Bottom line**: the effect survives multiple-comparison correction on 4 of 4 engines. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 28.1% | 50.0% |
| B | 96.9% | 90.6% |

Inter-method agreement: raw **76.6%**, but raw agreement is inflated by the common "neither cited" case — chance-corrected, Cohen's κ = **0.48**, Gwet's AC1 = **0.58**. Both methods show the effect in the **same direction** — the result is not a verbatim-quotability artifact.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **External validity (API ≠ consumer surface)**: Probes hit the provider APIs (e.g. Claude via Haiku, no web tools), which are NOT the same systems as Claude.ai with search, ChatGPT search, or Google AI Overviews. These findings transfer as *mechanism evidence* about how models weight content, not as a literal prediction of any consumer product's behaviour.
- **Trial independence**: Trials sharing a query use the same fixed variant text and are not independent. The primary CMH now stratifies by query × engine to control for this, with the engine-only test reported as a sensitivity check. When the two stratifications disagree, the result is flagged inconclusive above.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Statistical power**: at 32 pooled trials per variant and a 28% control baseline, the minimum reliably detectable lift is ~31.5pp (two-sided α=0.05, 80% power).  Detecting a 10pp lift from this baseline needs ~318 trials per variant.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
