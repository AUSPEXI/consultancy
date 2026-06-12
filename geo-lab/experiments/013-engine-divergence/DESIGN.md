# Experiment 013 — Cross-engine comparison: do the four engines disagree on a winner?

**Status**: DRAFT

---

## Hypothesis

If we hold the variant pair from experiment 001 (buried statistic vs. answer-first statistic) constant and vary only the engine identity, then the winning variant will differ across at least one engine pair, because each engine applies engine-specific retrieval and citation heuristics rather than a single universal citation principle.

## Variable

**Independent variable**: Engine identity (GPT-4o / OpenAI, Gemini, Perplexity, Claude). The content variants are held fixed; the engine is the thing that changes.
**Controlled variables**: Variant content (reused verbatim from experiment 001 — statistical-anchor lever), variant length, brand (NovaCRM), topic, query set, source-order randomisation, temperature, number of trials per variant.
**Metric**: Citation rate (proportion of trials where the variant is cited), measured separately per engine.

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — NovaCRM blurb with the key statistic buried mid-paragraph in vague-then-specific prose | baseline (no answer-first anchor) |
| B  | Treatment — same NovaCRM blurb leading with the specific statistic in the opening sentence | answer-first statistical anchor |

Variant files: `variants/A.md`, `variants/B.md`

Note: This is a **cross-engine** experiment. The A/B contrast is reused unchanged from experiment 001 so that any *difference in which variant wins* can be attributed to the engine, not to new content. The reported analysis is the **direction and size of the A-vs-B gap within each engine**, then a comparison of those gaps across engines.

## Queries

- "What's the best CRM for helping sales teams close deals faster?"
- "How much can NovaCRM improve a sales team's close rate?"
- "Which CRM tools actually speed up the sales cycle?"
- "Is NovaCRM worth it for a small sales team trying to close more deals?"

## Planned n

40 trials per variant per platform
Platforms: gemini, openai, perplexity, claude
Minimum: 30 trials per variant — this run uses 40

## Predicted direction

**Divergent.** We predict the A-vs-B winner will not be consistent across all four engines: at least one engine pair will disagree on which variant is cited more (e.g., Perplexity favours B's answer-first anchor while Claude shows no significant gap or favours A). We do not predict a single universal winner.

## Success criterion

The two-proportion z-test (A vs B) is computed **per engine**. The hypothesis is supported if the *sign* of the A−B difference differs across at least one engine pair, OR if a gap that is significant (p < 0.05) on one engine is null/reversed on another. Pooling across engines is reported but is NOT the primary test here — the point is the disagreement.

## Notes / context

Most lab experiments seek a universal lever. This one tests the meta-question: is GEO advice engine-agnostic? Grounded engines (Perplexity, Gemini grounding) and ungrounded/parametric-leaning answers (Claude, GPT-4o) plausibly weight an answer-first statistical anchor differently. Demonstrating divergence is valuable on camera because it cautions viewers against "one weird trick" GEO claims. Threat to validity: reusing 001's content means we inherit any flaws in that pair; we mitigate by keeping the content frozen and logging exact model IDs per engine.
