# Experiment 005 — List vs prose: do bulleted facts get cited more?

**Status**: DRAFT

---

## Hypothesis

If facts are presented as a bulleted list, then citation rate will be higher than equivalent paragraph prose for feature-and-capability queries, because list items are discrete, copy-pasteable, and easier for LLMs to extract and attribute.

## Variable

**Independent variable**: Content format — bulleted list vs flowing paragraph prose.  
**Controlled variables**: Brand (NovaCRM), topic (its features and capabilities), the specific facts and statistics conveyed, total word count (within 10%), query set, platform versions, temperature, randomised source order.  
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — NovaCRM features written as flowing paragraph prose | baseline (prose) |
| B  | Treatment — identical facts rendered as a bulleted list | facts formatted as bullets |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- What features does NovaCRM offer to help sales teams close deals faster?
- How does NovaCRM speed up the sales cycle?
- What are the key capabilities of NovaCRM for sales teams?
- Can you summarize what NovaCRM does and its main benefits?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30 (≈4 paraphrases × 2 trials × 4 platforms, topped up to 30/platform).

## Predicted direction

B (bulleted list) will have a higher citation rate. Estimated effect: +8–15pp absolute.  
(Pre-registered before any data collected.)

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform (perplexity), or pooled across all platforms.

## Notes / context

This tests the **List vs prose** lever from `context/geo-principles.md`. Bulleted facts are hypothesized to be easier for retrieval-grounded engines to isolate and attribute as discrete extractable claims, whereas the same facts embedded in prose may be paraphrased without attribution. Brand is held neutral (NovaCRM is the subject of both variants), so we measure the structural lever, not brand familiarity.

## Confounds checklist

- [x] Variants differ in one factor only (format) — same facts, same numbers.
- [x] Equal length (within 10%).
- [x] Source order randomised.
- [x] Same query set across variants.
- [x] Brand neutral (NovaCRM is subject of both).
- [x] Same platform/model versions logged across variants.
