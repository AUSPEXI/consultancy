# Experiment Finding

**Hypothesis**: If content includes explicit date markers ("As of 2026…", "Updated June 2026"), then citation rate will be higher than undated equivalent content for factual queries, because LLMs prefer temporally anchored sources for factual queries.

**Run at**: 2026-06-18T01:05:43.039Z
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
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: 0.0pp, z=0, p=1 — ✗ not significant

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: 0.0pp, z=0, p=1 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: 0.0pp, z=0, p=1 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: 0.0pp, z=0, p=1 — ✗ not significant

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 4 | 32 | 12.5% |
| B | 4 | 32 | 12.5% |

**Aggregate B vs A** (primary): 0pp, z=0, p=1 — ✗ not significant

---

## Conclusion

**No significant effects found** across any platform at α=0.05.

This is a valid null result. The tested variable does not appear to affect citation rates under these conditions.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-18: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
