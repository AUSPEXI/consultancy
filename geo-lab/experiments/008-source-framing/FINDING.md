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
| A | 1 | 8 | 12.5% | [0%, 35.4%] |
| B | 5 | 8 | 62.5% | [29%, 96%] |

**B vs A**: +50.0pp, z=2.066, p=0.0389 — ✓ significant (p < 0.05)

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 0%] |
| B | 8 | 8 | 100.0% | [100%, 100%] |

**B vs A**: +100.0pp, z=4, p=0.0001 — ✓ significant (p < 0.05)

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 0%] |
| B | 1 | 8 | 12.5% | [0%, 35.4%] |

**B vs A**: +12.5pp, z=1.033, p=0.3017 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [15.4%, 84.6%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: -25.0pp, z=-1.033, p=0.3017 — ✗ not significant

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 5 | 32 | 15.6% |
| B | 16 | 32 | 50.0% |

**Aggregate B vs A** (primary): +34.4pp, z=2.928, p=0.0034 — ✓ significant

---

## Conclusion

**Significant effects found** in 2 comparison(s):
- On GEMINI: B vs A: +50.0pp (p=0.0389)
- On OPENAI: B vs A: +100.0pp (p=0.0001)

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **n=2 per variant**: ⚠ Below the lab minimum of 30 — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
