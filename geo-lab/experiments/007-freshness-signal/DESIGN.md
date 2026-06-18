# Experiment 007 — Date markers (freshness signals) vs undated content

**Status**: DRAFT

---

## Hypothesis

If content includes explicit date markers ("As of 2026…", "Updated June 2026"), then citation rate will be higher than undated equivalent content for factual queries, because LLMs prefer temporally anchored sources for factual queries.

## Variable

**Independent variable**: Presence of explicit date markers (dated vs undated)  
**Controlled variables**: Word count (within 10%), brand (NovaCRM), topic (NovaCRM features/pricing/performance for sales teams), query set, platform versions, source order randomisation, temperature  
**Metric**: Citation rate (proportion of trials where the variant is cited)

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — NovaCRM overview with no date markers | baseline (undated) |
| B  | Treatment — identical NovaCRM overview with explicit date markers ("As of 2026…", "Updated June 2026") | freshness signals added |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- What is the latest version of NovaCRM and what does it do for sales teams?
- How current is NovaCRM's pricing and feature set?
- Is NovaCRM up to date for 2026 sales workflows?
- What are NovaCRM's most recent performance numbers for closing deals?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B (dated content) will have a higher citation rate. Predicted difference: +8pp or greater, strongest on grounded engines (Perplexity, Gemini) and for the "how current / latest" framed queries.

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform (Perplexity), or pooled across all platforms.

## Notes / context

Tests the **Freshness signals** lever from geo-principles.md. Temporal anchoring is hypothesised to matter most for queries that explicitly ask about currency/recency. The only difference between variants is the presence of date phrases — all facts, numbers, and structure are held identical so any citation lift is attributable to the date markers themselves, not to new information. Multiple comparisons across platforms inflate false positives; report this on camera.
