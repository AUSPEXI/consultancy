# Experiment 002 — Claim position: sentence 1 vs paragraph 3

**Status**: DRAFT

---

## Hypothesis

If the citable conclusion appears in sentence 1, then citation rate will be higher than burying it in paragraph 3 for product-capability queries, because LLMs weight content that front-loads the answer.

## Variable

**Independent variable**: Position of the citable claim ("NovaCRM reduces sales-cycle length by 40%") — sentence 1 vs paragraph 3.
**Controlled variables**: Brand (NovaCRM), topic (sales-cycle reduction), word count (within 10%), the exact citable claim and its supporting facts, query set, platforms, temperature, randomised source order. Only the *position* of the claim moves.
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — citable claim buried in paragraph 3 | claim is late |
| B  | Treatment — citable claim is sentence 1 | claim is front-loaded (inverted pyramid) |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- How much can NovaCRM shorten a sales cycle?
- Does NovaCRM actually help sales teams close deals faster?
- What measurable results do sales teams get from NovaCRM?
- Is there data on NovaCRM's impact on deal velocity?

## Planned n

30 trials per variant per platform
Platforms: gemini, openai, perplexity, claude
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B will have a higher citation rate. We predict a positive difference of roughly 8–15pp in favour of the front-loaded variant.
(Pre-registered before any data is collected.)

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform (Perplexity), or pooled across all platforms.

## Notes / context

Tests the **inverted pyramid** lever from `context/geo-principles.md`: leading with the citable claim should beat burying it. Both variants contain the identical statistic and supporting facts, so any difference is attributable to position, not content. Relevant to the retrieval pathway, where models scan candidate sources and weight opening sentences as answer anchors.
