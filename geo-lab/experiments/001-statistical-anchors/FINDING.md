# Experiment Finding — ⚠ PRELIMINARY (n=8 per variant, below pre-registered n≥30)

> This finding does not yet meet the lab's own significance bar. The Claude
> result (p=0.007) survives a Bonferroni correction across the 4 uncorrected
> platform comparisons, but the effect was found on Claude, not the
> pre-registered primary platform (Perplexity), and Gemini contributed 8/8
> null responses (API failures, since fixed in probe.mjs). Do not publish as
> a confirmed result until n≥30 per variant per platform.

**Hypothesis**: If the opening sentence contains a specific number ("cut latency 43%"), then citation rate will be higher than a version with vague language ("improved latency significantly") for product-performance queries, because LLMs weight precise, citable data points as credibility signals.

**Run at**: 2026-06-10T12:17:03.476Z
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 0%] |
| B | 0 | 8 | 0.0% | [0%, 0%] |

**B vs A**: 0.0pp, z=0, p=1 — ✗ not significant

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 0%] |
| B | 2 | 8 | 25.0% | [0%, 55%] |

**B vs A**: +25.0pp, z=1.512, p=0.1306 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 8 | 50.0% | [15.4%, 84.6%] |
| B | 6 | 8 | 75.0% | [45%, 100%] |

**B vs A**: +25.0pp, z=1.033, p=0.3017 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 3 | 8 | 37.5% | [4%, 71%] |
| B | 8 | 8 | 100.0% | [100%, 100%] |

**B vs A**: +62.5pp, z=2.697, p=0.007 — ✓ significant (p < 0.05)

---

## Aggregate (all platforms pooled)

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 7 | 32 | 21.9% |
| B | 16 | 32 | 50.0% |

---

## Conclusion

**Preliminary significant effect** in 1 of 4 uncorrected comparisons:
- On CLAUDE: B vs A: +62.5pp (p=0.007) — survives Bonferroni (α=0.0125) but
  is not on the pre-registered primary platform (Perplexity) and n=8 < 30.

---

## Threats to Validity

- **Model versioning**: Results reflect platform behaviour at time of run. Model updates may change these outcomes.
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **n=2 per variant**: ⚠ Below the lab minimum of 30 — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
