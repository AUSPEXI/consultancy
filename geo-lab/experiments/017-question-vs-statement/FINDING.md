# Experiment Finding

**Hypothesis**: If content opens by restating the query as a direct question instead of opening with the answer, then citation rate will be lower for how-to and definitional queries, because LLMs prefer answer-mode sources that present extractable claims over question-mode sources that defer the answer.

**Run at**: 2026-06-17T21:15:39.801Z
**Collection window**: < 1 day (2026-06-17 → 2026-06-17)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 5 | 8 | 62.5% | [29%, 96%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: -37.5pp, z=-1.512, p=0.1306 — ✗ not significant

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [15.4%, 84.6%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: -25.0pp, z=-1.033, p=0.3017 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [0%, 55%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: 0.0pp, z=0, p=1 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [0%, 35.4%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: +12.5pp, z=0.641, p=0.5218 — ✗ not significant

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 12 | 32 | 37.5% |
| B | 8 | 32 | 25.0% |

**Aggregate B vs A** (primary): -12.5pp, z=-1.079, p=0.2807 — ✗ not significant

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
- **n=2 per variant**: ⚠ Below the lab minimum of 30 — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
