# Experiment Finding

**Hypothesis**: If each claim is expressed as a single short sentence (≤15 words), then citation rate will be higher than the same claims expressed in long compound sentences (30+ words), because short standalone sentences are more quote-able in LLM answers.

**Run at**: 2026-06-18T12:19:59.926Z
**Collection window**: < 1 day (2026-06-18 → 2026-06-18)
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 7 | 8 | 87.5% | [52.9%, 97.8%] |
| B | 3 | 8 | 37.5% | [13.7%, 69.4%] |

**B vs A**: -50.0pp, z=-2.066, p=0.0389 — ≈ suggestive (nominal p<0.05, fails Bonferroni α=0.0125)

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [21.5%, 78.5%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -25.0pp, z=-1.033, p=0.3017 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 7 | 8 | 87.5% | [52.9%, 97.8%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: -62.5pp, z=-2.52, p=0.0117 — ✓ significant (survives Bonferroni α=0.0125)

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 8 | 8 | 100.0% | [67.6%, 100%] |
| B | 5 | 8 | 62.5% | [30.6%, 86.3%] |

**B vs A**: -37.5pp, z=-1.922, p=0.0547 — ✗ not significant

---

## Aggregate (all platforms pooled) — PRIMARY ENDPOINT

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 26 | 32 | 81.3% |
| B | 12 | 32 | 37.5% |

**Aggregate B vs A** (primary): -43.8pp, z=-3.563, p=0.0004 — ✓ significant

---

## Conclusion

Per-engine verdicts, multiple-comparison corrected (Bonferroni α = 0.0125 for 4 engine tests). Every engine is listed, significant or not:

- **GEMINI**: B vs A: -50.0pp (p=0.0389) — ≈ suggestive (nominal p<0.05 only — does NOT survive correction)
- **OPENAI**: B vs A: -25.0pp (p=0.3017) — ✗ no significant effect
- **PERPLEXITY**: B vs A: -62.5pp (p=0.0117) — ✓ significant (survives correction)
- **CLAUDE**: B vs A: -37.5pp (p=0.0547) — ✗ no significant effect

**Bottom line**: the effect survives multiple-comparison correction on 1 of 4 engines, with a nominal-only (uncorrected) signal on 1 more. Treat the corrected engine(s) as the real finding; everything else is directional and needs more data.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-18: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = 0.0125. Per-platform results with p > 0.0125 are exploratory.
