# Experiment 003 — Definitional structure vs hedged narrative prose

**Status**: DRAFT

---

## Hypothesis

If content uses "X is a Y that does Z" definitional structure, then citation rate will be higher than equivalent hedged narrative prose for "what is X" queries, because definitions are citation magnets — models reach for them when answering definitional questions.

## Variable

**Independent variable**: Sentence structure of the core description — direct definitional ("NovaCRM is a sales-automation platform that...") vs hedged narrative prose ("Many teams have found that NovaCRM can sometimes help...").
**Controlled variables**: Length (~175 words each), brand (NovaCRM), topic (what NovaCRM is and does), factual claims conveyed, query set, platforms, temperature, source order randomisation.
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — hedged narrative prose describing NovaCRM | baseline (no direct definition) |
| B  | Treatment — same facts opened with "NovaCRM is a Y that does Z" definitions | direct definitional structure |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- What is NovaCRM?
- Can you explain what NovaCRM does for sales teams?
- What kind of software is NovaCRM and who is it for?
- I keep hearing about NovaCRM — what exactly is it?

## Planned n

30 trials per variant per platform
Platforms: gemini, openai, perplexity, claude
Minimum: 30 trials per variant — this run uses 30.

## Predicted direction

B will have a higher citation rate. Predicted winner: B.
(Pre-registered before any data collected.)

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform, or pooled across all platforms.

## Notes / context

Tests the "Direct definitions" lever from geo-principles.md. Definitional "what is X" queries are the cleanest case for testing whether models preferentially lift copy-pastable definitions. Brand is held constant (NovaCRM) since this is a structural lever; the only difference is sentence framing.
