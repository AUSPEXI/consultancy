# Experiment Finding

**Hypothesis**: If facts are presented as a bulleted list, then citation rate will be higher than equivalent paragraph prose for feature-and-capability queries, because list items are discrete, copy-pasteable, and easier for LLMs to extract and attribute.

**Run at**: 2026-06-17T21:54:55.042Z
**Collection window**: < 1 day (2026-06-17 → 2026-06-17)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 3 | 8 | 37.5% | [13.7%, 69.4%] |

**B vs A**: +12.5pp, z=0.539, p=0.5896 — ✗ not significant

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: -12.5pp, z=-1.033, p=0.3017 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: -25.0pp, z=-1.512, p=0.1306 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: -25.0pp, z=-1.512, p=0.1306 — ✗ not significant

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 7 | 32 | 21.9% |
| B | 3 | 32 | 9.4% |

**Aggregate B vs A** (primary): -12.5pp, z=-1.377, p=0.1685 — ✗ not significant

---

## Conclusion

**No significant effects found** across any platform at α=0.05.

This is a valid null result. The tested variable does not appear to affect citation rates under these conditions.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
