# Experiment NNN — [Short slug: what is being tested]

**Status**: DRAFT | RUNNING | COMPLETE

---

## Hypothesis

[One sentence. Format: "If [change], then [citations will increase/decrease] for [type of query], because [mechanism]."]

Example: "If we lead with a specific statistic in the first sentence, then citation rate will be higher than a version that buries the statistic, because LLMs weight the opening sentence heavily as a source anchor."

## Variable

**Independent variable**: [The ONE thing that changes between variants]  
**Controlled variables**: [Length, brand, topic, query set, platform — list everything that stays the same]  
**Metric**: Citation rate (proportion of trials where the variant is cited)

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — [describe] | baseline |
| B  | Treatment — [describe] | [the one thing that differs] |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- [Query 1 — phrase the topic as a question an LLM user would ask]
- [Query 2 — paraphrase of the same topic]
- [Query 3 — different angle on the same topic]
- [Query 4 — informational variant]

## Planned n

[Number] trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses [N]

## Predicted direction

[A or B] will have a higher citation rate, or the difference will be [X]pp.  
(Pre-register this BEFORE running. You may update this only before any data is collected.)

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform, or pooled across all platforms.

## Notes / context

[Why does this matter? What GEO principle does it test? Link to context/geo-principles.md if relevant.]
