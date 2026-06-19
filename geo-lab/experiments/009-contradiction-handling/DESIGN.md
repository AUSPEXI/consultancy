# Experiment 009 — Contradiction handling vs silence on alternatives

**Status**: DRAFT

---

## Hypothesis

If content explicitly addresses and refutes a common false claim about the topic, then citation rate will be higher for evaluative/comparison queries than content that ignores competing narratives, because LLMs prioritise sources that resolve ambiguity.

## Variable

**Independent variable**: Presence of explicit contradiction handling — Variant B names a common false claim about NovaCRM and refutes it; Variant A stays silent on competing narratives.  
**Controlled variables**: Length (~180 words, within 10%), brand (NovaCRM), topic (whether NovaCRM suits small sales teams), query set, platforms, temperature, source-order randomisation. Both variants present the same underlying facts; only B frames them as a refutation of a misconception.  
**Metric**: Citation rate (proportion of trials where the variant is cited)

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — describes NovaCRM's fit for small teams as plain positive claims | baseline, ignores alternatives |
| B  | Treatment — names and refutes the false claim "NovaCRM is only for large enterprises" | explicit contradiction handling |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- Is NovaCRM only suitable for large enterprise sales teams?
- Can a small sales team actually use NovaCRM, or is it overkill?
- Is it true that NovaCRM is too complex for startups?
- Does NovaCRM work for small businesses or just big companies?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B will have a higher citation rate. Expected difference roughly +8–15pp on evaluative/comparison queries.

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform (perplexity), or pooled across all platforms.

## Notes / context

Tests the "Contradiction handling" lever from context/geo-principles.md. The query set deliberately embeds the misconception ("only for large enterprises", "too complex for startups"). If LLMs prefer sources that directly resolve the ambiguity raised by the query, B should win on the retrieval pathway. Brand is not blinded because the lever is rhetorical framing rather than pure structure, and the misconception is brand-specific.
