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
| A | 2 | 8 | 25.0% | [0%, 55%] |
| B | 6 | 8 | 75.0% | [45%, 100%] |

**B vs A**: +50.0pp, z=2, p=0.0455 — ✓ significant (p < 0.05)

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 0%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: +25.0pp, z=1.512, p=0.1306 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [0%, 55%] |
| B | 4 | 8 | 50.0% | [15.4%, 84.6%] |

**B vs A**: +25.0pp, z=1.033, p=0.3017 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 0%] |
| B | 6 | 8 | 75.0% | [45%, 100%] |

**B vs A**: +75.0pp, z=3.098, p=0.0019 — ✓ significant (p < 0.05)

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 4 | 32 | 12.5% |
| B | 18 | 32 | 56.3% |

**Aggregate B vs A** (primary): +43.8pp, z=3.685, p=0.0002 — ✓ significant

---

## Conclusion

**Significant effects found** in 2 comparison(s):
- On GEMINI: B vs A: +50.0pp (p=0.0455)
- On CLAUDE: B vs A: +75.0pp (p=0.0019)

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-18: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **n=2 per variant**: ⚠ Below the lab minimum of 30 — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
