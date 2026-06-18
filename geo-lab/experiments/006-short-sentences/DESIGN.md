# Experiment 006 — Sentence length (short vs long compound)

**Status**: DRAFT

---

## Hypothesis

If each claim is expressed as a single short sentence (≤15 words), then citation rate will be higher than the same claims expressed in long compound sentences (30+ words), because short standalone sentences are more quote-able in LLM answers.

## Variable

**Independent variable**: Sentence length — short standalone sentences (≤15 words each) vs long compound sentences (30+ words each).  
**Controlled variables**: Brand (NovaCRM), topic (how NovaCRM helps sales teams close deals faster), the actual claims/facts conveyed, total word count (within 10%), query set, platforms, temperature, source-order randomisation. Both variants carry identical statistics, entities, and structure (prose, no lists).  
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — claims packed into long compound sentences (30+ words each) | baseline |
| B  | Treatment — same claims, each as a short standalone sentence (≤15 words) | sentence length |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- How does NovaCRM help sales teams close deals faster?
- What features does NovaCRM offer for improving sales conversion?
- Is NovaCRM good for shortening the sales cycle?
- What measurable results do teams get using NovaCRM?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B will have a higher citation rate. Short, standalone sentences are easier for the model to lift verbatim or closely paraphrase into an answer.

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform, or pooled across all platforms.

## Notes / context

Tests the "Quote-ability / length" lever from geo-principles.md. The mechanism: LLM answers favour content that can be dropped in as a clean, self-contained quote. Long compound sentences bury the citable unit inside subordinate clauses, raising the cost of extraction. We hold the facts constant so any difference is attributable to packaging, not content. Both variants stay in prose form to avoid confounding with the list-vs-prose lever.
