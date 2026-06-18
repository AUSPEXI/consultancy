# Experiment Finding

**Hypothesis**: If we hold the variant pair from experiment 001 (buried statistic vs. answer-first statistic) constant and vary only the engine identity, then the winning variant will differ across at least one engine pair, because each engine applies engine-specific retrieval and citation heuristics rather than a single universal citation principle.

**Run at**: 2026-06-14T11:27:29.390Z
**Collection window**: 1.0 days (2026-06-13 → 2026-06-14)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 16 | 6.3% | [1.1%, 28.3%] |
| B | 13 | 16 | 81.3% | [57%, 93.4%] |

**B vs A**: +75.0pp, z=4.276, p=0

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 1 | 16 | 6.3% | [1.1%, 28.3%] |
| B | 15 | 16 | 93.8% | [71.7%, 98.9%] |

**B vs A**: +87.5pp, z=4.95, p=0

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 3 | 16 | 18.8% | [6.6%, 43%] |
| B | 12 | 16 | 75.0% | [50.5%, 89.8%] |

**B vs A**: +56.3pp, z=3.188, p=0.0014

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 16 | 0.0% | [0%, 19.4%] |
| B | 16 | 16 | 100.0% | [80.6%, 100%] |

**B vs A**: +100.0pp, z=5.657, p=0

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 5 | 64 | 7.8% |
| B | 56 | 64 | 87.5% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by engine)**, B vs A: χ²(1)=76.055, p=0, common odds ratio=52 — ✓ significant

_Descriptive (naive pooled, not the primary test): B vs A +79.7pp, z=9.026, p=0._

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: +75.0pp (p=0) — ✓ significant (survives correction)
- **OPENAI**: B vs A: +87.5pp (p=0) — ✓ significant (survives correction)
- **PERPLEXITY**: B vs A: +56.3pp (p=0.0014) — ✓ significant (survives correction)
- **CLAUDE**: B vs A: +100.0pp (p=0) — ✓ significant (survives correction)

**Bottom line**: the effect survives multiple-comparison correction on 4 of 4 engines. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 64 trials collected over 1.0 days. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-13: 32, 2026-06-14: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 16 trials per platform-variant (64 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
