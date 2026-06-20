# PRE-REGISTRATION REPORT: GEO NUMBER-ANCHOR EXPERIMENT
**Status**: REGISTERED AND COMMITTED (LOCKED)
**Date**: June 11, 2026
**Commit Hash**: `7f2b91c12e8ae8dbfba89345e56e01a91a92`
**Lead Researcher**: Gwylym, L8EntSpace Lab

---

## 1. ABSTRACT & HYPOTHESIS
Generative Engine Optimization (GEO) suggests that Large Language Models (LLMs) used in search index retrieval architectures heavily favor precise quantitative data points as logical credibility anchors during citations of in-context retrieved paragraphs.

This experiment formally evaluates whether the introduction of a specific statistic (Variant B: "cut deal-closing time 43%") yields a statistically significant increase in retrieval-citation frequency relative to a vague adjective qualifier (Variant A: "improved deal-closing speed significantly") under identical contextual constraints.

* **Null Hypothesis (H0)**: Swapping a vague qualifier for a specific statistic will have no effect on model citation rates (Citation_Rate_A = Citation_Rate_B).
* **Alternative Hypothesis (H1)**: Swapping a vague qualifier for a specific statistic will yield a positive increase in model citation rates (Citation_Rate_B > Citation_Rate_A) with an expected lift of 10 to 20 percentage points.

---

## 2. EXPERIMENTAL VARIABLES
### Independent Variable:
The qualitative content of the opening line of a product performance claim for a fictional brand (**NovaCRM**):
* **Control (Variant A - Vague)**: *"NovaCRM improved deal-closing speed significantly."*
* **Treatment (Variant B - Statistic)**: *"NovaCRM cut deal-closing time 43%."*

### Dependent Variable:
* **Citation Rate**: The proportion of experimental trials where the target retrieved page is cited directly with matching attribution codes in the summary.

---

## 3. CONTROLLED SYSTEM CONSTANTS
1. **Brand Identity**: Held static under the fictional name "NovaCRM" to eliminate past public internet exposure training bias or familiarity weights.
2. **Document Length**: Kept within 10% tolerance between variant templates.
3. **Model Generation Parameters**: Temperature fixed at 0.0, Top-P fixed at 1.0, Max Tokens at 256.
4. **Context Construction**: Document is injected directly at index position 1 inside the agent context container.
5. **Query Seed**: 4 natural user query paraphases (intent metrics) fired systematically.

---

## 4. DESIGN PROTOCOL & SIG-METRIC ENDPOINTS
To counteract multi-engine baseline variations (Perplexity naturally cites ~50%, Gemini cites ~0%), we will deploy a stratified **Cochran–Mantel–Haenszel (CMH)** test as our primary multivariate endpoint, controlling for engine categories.

### Alpha Thresholds & Rigor Checks:
* Primary Alpha Threshold: α = 0.05
* Multiple Comparisons Protocol: **Holm–Bonferroni Step-down correction** to guard against inflated family-wise error rates (FWER) without completely crippling statistical power like standard Bonferroni.
* **Quotability Rigor check**: Comparative audit of a Verbatim string-match scorer against an independent Semantic LLM-Judge (Claude Haiku) to ensure results are not artificial artifacts of exact-string matching rules.

---

## 5. THREATS TO VALIDITY PRE-IDENTIFIED
1. **Sample Size Limit**: Preliminary exploratory runs (n=2 per variant per engine) are intended to audit the logging framework and reveal directional trends, but do not satisfy the standard clinical verification minimum (n=30). Any output from n=2 must be explicitly reported as preliminary.
2. **In-Context Bias**: This test observes in-context synthesis preference (fast-mode retrieval), not live indexing weights.
3. **Moment-in-Time snapshots**: Run on models in June 2026. Future model modifications could alter citation weights.
