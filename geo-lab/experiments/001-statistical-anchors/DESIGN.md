# Experiment 001 — Specific statistic vs vague language in opening sentence

**Status**: DRAFT

---

## Hypothesis

If the opening sentence contains a specific number ("cut latency 43%"), then citation rate will be higher than a version with vague language ("improved latency significantly") for product-performance queries, because LLMs weight precise, citable data points as credibility signals.

## Variable

**Independent variable**: Presence of a specific statistic in the opening sentence (precise number vs vague qualifier).  
**Controlled variables**: Length (within 10%), brand (NovaCRM), topic (sales-cycle/deal-closing performance), query set, platform set, source order randomisation, temperature, model versions. Both variants make the same claim with the same structure; only the opening sentence's quantification differs.  
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — opening sentence uses vague language ("improved deal-closing speed significantly") | baseline, no specific stat |
| B  | Treatment — opening sentence uses a specific statistic ("cut deal-closing time 43%") | precise numeric anchor in sentence 1 |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- How much faster can NovaCRM help sales teams close deals?
- Does NovaCRM actually speed up the sales cycle?
- What performance results does NovaCRM deliver for closing deals?
- Is NovaCRM effective at shortening deal-closing time for sales teams?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30 (4 platforms × 4 query paraphrases × ~2 trials, balanced to 30).

## Predicted direction

B will have a higher citation rate. Predicted effect size: +10–20pp absolute in favour of B.  
(Pre-registered before any data collection.)

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform (Perplexity, grounded), or pooled across all platforms.

## Notes / context

This tests the **Statistical anchors** lever from `context/geo-principles.md`: sentences with specific numbers may be selected more often because they read as verifiable, quotable facts. Brand is held neutral (NovaCRM is the subject of both variants), so the measured effect is attributable to the statistic, not brand familiarity. A win here would establish a reusable, cheap content tactic for the retrieval pathway.
