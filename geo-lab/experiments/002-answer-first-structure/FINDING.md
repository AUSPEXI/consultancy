# Experiment Finding

**Hypothesis**: If the citable conclusion appears in sentence 1, then citation rate will be higher than burying it in paragraph 3 for product-capability queries, because LLMs weight content that front-loads the answer.

**Run at**: 2026-06-16T13:25:54.131Z
**Collection window**: < 1 day (2026-06-16 → 2026-06-16)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 7 | 8 | 87.5% | [52.9%, 97.8%] |

**B vs A**: +62.5pp, z=2.52, p=0.0117

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: 0.0pp, z=0, p=1

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 3 | 8 | 37.5% | [13.7%, 69.4%] |

**B vs A**: +37.5pp, z=1.922, p=0.0547

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 4 | 8 | 50.0% | [21.5%, 78.5%] |

**B vs A**: +50.0pp, z=2.309, p=0.0209

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 2 | 32 | 6.3% |
| B | 14 | 32 | 43.8% |

**Aggregate B vs A** (primary): +37.5pp, z=3.464, p=0.0005 — ✓ significant

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +62.5pp (p=0.0117) — ✓ significant (survives correction)
- **OPENAI**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **PERPLEXITY**: B vs A: +37.5pp (p=0.0547) — ✗ no significant effect
- **CLAUDE**: B vs A: +50.0pp (p=0.0209) — ≈ suggestive (nominal p<0.05 only — does NOT survive correction)

**Bottom line**: the effect survives multiple-comparison correction on 1 of 4 engines, with a nominal-only (uncorrected) signal on 1 more. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-16: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
