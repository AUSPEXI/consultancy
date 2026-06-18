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

**B vs A**: 0.0pp, z=0, p=1

### OPENAI

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: 0.0pp, z=0, p=1

### PERPLEXITY

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 0 | 8 | 0.0% | [0%, 32.4%] |
| B | 0 | 8 | 0.0% | [0%, 32.4%] |

**B vs A**: 0.0pp, z=0, p=1

### CLAUDE

| Variant | Cited | n | Citation Rate | 95% CI |
|---------|-------|---|---------------|--------|
| A | 2 | 8 | 25.0% | [7.1%, 59.1%] |
| B | 2 | 8 | 25.0% | [7.1%, 59.1%] |

**B vs A**: 0.0pp, z=0, p=1

---

## Combined effect across engines

Primary endpoint is the Cochran–Mantel–Haenszel stratified test (below). The pooled counts here are descriptive only.

| Variant | Cited | n | Citation Rate |
|---------|-------|---|---------------|
| A | 4 | 32 | 12.5% |
| B | 4 | 32 | 12.5% |

**PRIMARY — Cochran–Mantel–Haenszel (stratified by engine)**, B vs A: χ²(1)=0, p=1, common odds ratio=1 — ✗ not significant

_Descriptive (naive pooled, not the primary test): B vs A 0pp, z=0, p=1._

---

## Conclusion

Per-engine verdicts, family-wise-error controlled via the **Holm–Bonferroni step-down** (4 engine tests; more powerful than plain Bonferroni, same false-positive guarantee). Every engine is listed, significant or not:

- **GEMINI**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **OPENAI**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **PERPLEXITY**: B vs A: 0.0pp (p=1) — ✗ no significant effect
- **CLAUDE**: B vs A: 0.0pp (p=1) — ✗ no significant effect

**Bottom line**: no significant effect on any engine. Valid null result under these conditions.

---

## Robustness — independent LLM-judge attribution

A neutral judge (claude-haiku-4-5-20251001) re-attributed every answer by meaning, not verbatim phrasing — this rules out a "more-quotable-variant" artifact in the primary scorer. Citation rate by method:

| Variant | Verbatim scorer | LLM-judge (semantic) |
|---------|-----------------|----------------------|
| A | 12.5% | 43.8% |
| B | 12.5% | 93.8% |

Record-level agreement between the two methods: **37.5%**. **⚠ The two methods disagree in direction** — the verbatim result may be a quotability artifact. Do not publish as a citation-preference finding until resolved.

---

## Threats to Validity

- **⚠ Low temporal coverage**: All 32 trials collected over < 1 day. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.
  - Trials per day: 2026-06-18: 32
- **Model versions stable**: No model version changes detected across batches (gemini: gemini-2.5-flash, openai: gpt-4o-mini, perplexity: sonar, claude: claude-haiku-4-5-20251001).
- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.
- **Sample size**: 8 trials per platform-variant (32 pooled per variant). ⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.
- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.
- **Multiple comparisons**: 4 per-engine tests are family-wise-error controlled via Holm–Bonferroni step-down (more powerful than plain Bonferroni, whose fixed threshold would be α=0.0125). The aggregate is the single pre-registered primary endpoint.
- **Cross-experiment error rate**: significance within one experiment does not correct for the whole research programme — across many experiments, ~1 in 20 nominal positives is expected by chance. Replicate before treating any single result as settled.
