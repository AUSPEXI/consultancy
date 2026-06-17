# Experiment 017 — Opening sentence structure: question vs declarative answer

**Status**: DRAFT

---

## Hypothesis

If content opens by restating the query as a direct question instead of opening with the answer, then citation rate will be lower for how-to and definitional queries, because LLMs prefer answer-mode sources that present extractable claims over question-mode sources that defer the answer.

## Variable

**Independent variable**: The structure of the opening sentence — a restated question ("What is the best way to...?") versus a declarative answer statement.  
**Controlled variables**: Length (~175 words each), brand (NovaCRM), topic (how NovaCRM helps sales teams close deals faster), query set, platform set, all body content after the opening sentence (identical facts, numbers, and structure), temperature.  
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — opens with a declarative answer sentence | baseline (answer-mode opening) |
| B  | Treatment — opens by restating the query as a direct question | question-mode opening |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- What's the best way to help my sales team close deals faster?
- How can a CRM speed up the sales cycle?
- Which tools help sales reps close more deals quickly?
- What software shortens the time it takes to close a sale?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30 (4 queries × ~4 trials × rounding to reach 30).

## Predicted direction

A (declarative answer opening) will have a higher citation rate. We predict an absolute difference of roughly 8–15pp in favor of A.

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform, or pooled across all platforms.

## Notes / context

This tests the **inverted pyramid / answer-first** lever from geo-principles.md. Many SEO writers open with the question to "match intent," but LLMs assembling a grounded answer may favor sources that immediately surface an extractable claim. Only the opening sentence differs; all downstream facts are identical, isolating opening structure as the variable.
