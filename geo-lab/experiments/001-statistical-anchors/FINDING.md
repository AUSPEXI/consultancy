# Experiment Finding

**Hypothesis**: If the opening sentence contains a specific number ("cut latency 43%"), then citation rate will be higher than a version with vague language ("improved latency significantly") for product-performance queries, because LLMs weight precise, citable data points as credibility signals.

**Run at**: 2026-06-11T22:03:00.720Z
**Variants**: A, B
**Platforms**: gemini, openai, perplexity, claude
**Trials per variant**: 2

---

## Results by Platform

### GEMINI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 16 | 0.0% | [0%, 0%] |
| B | 5 | 16 | 31.3% | [8.5%, 54%] |

**B vs A**: +31.3pp, z=2.434, p=0.0149 — ✓ significant (p < 0.05)

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 16 | 0.0% | [0%, 0%] |
| B | 3 | 16 | 18.8% | [0%, 37.9%] |

**B vs A**: +18.8pp, z=1.819, p=0.0688 — ✗ not significant

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 8 | 16 | 50.0% | [25.5%, 74.5%] |
| B | 11 | 16 | 68.8% | [46%, 91.5%] |

**B vs A**: +18.8pp, z=1.08, p=0.2802 — ✗ not significant

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 4 | 16 | 25.0% | [3.8%, 46.2%] |
| B | 16 | 16 | 100.0% | [100%, 100%] |

**B vs A**: +75.0pp, z=4.382, p=0 — ✓ significant (p < 0.05)

---

## Aggregate (all platforms pooled)

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 12 | 64 | 18.8% |
| B | 35 | 64 | 54.7% |

---

## Conclusion

**Significant effects found** in 2 comparison(s):
- On GEMINI: B vs A: +31.3pp (p=0.0149)
- On CLAUDE: B vs A: +75.0pp (p=0)

---

## Threats to Validity

- **Model versioning**: Results reflect platform behaviour at time of run. Model updates may change these outcomes.
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **n=2 per variant**: ⚠ Below the lab minimum of 30 — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 2 simultaneous tests inflate the false-positive rate. Treat findings as exploratory unless pre-registered.
