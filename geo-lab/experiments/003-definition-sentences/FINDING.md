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

**B vs A**: +50.0pp, z=2.309, p=0.0209 — ✓ significant (p < 0.05)

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 8 | 8 | 100.0% | [67.6%, 100%] |

**B vs A**: +87.5pp, z=3.528, p=0.0004 — ✓ significant (p < 0.05)

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 8 | 12.5% | [2.2%, 47.1%] |
| B | 7 | 8 | 87.5% | [52.9%, 97.8%] |

**B vs A**: +75.0pp, z=3, p=0.0027 — ✓ significant (p < 0.05)

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 3 | 8 | 37.5% | [13.7%, 69.4%] |
| B | 8 | 8 | 100.0% | [67.6%, 100%] |

**B vs A**: +62.5pp, z=2.697, p=0.007 — ✓ significant (p < 0.05)

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 9 | 32 | 28.1% |
| B | 31 | 32 | 96.9% |

**Aggregate B vs A** (primary): +68.8pp, z=5.68, p=0 — ✓ significant

---

## Conclusion

**Significant effects found** in 4 comparison(s):
- On GEMINI: B vs A: +50.0pp (p=0.0209)
- On OPENAI: B vs A: +87.5pp (p=0.0004)
- On PERPLEXITY: B vs A: +75.0pp (p=0.0027)
- On CLAUDE: B vs A: +62.5pp (p=0.007)

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-17: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
