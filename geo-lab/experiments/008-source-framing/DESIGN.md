# Experiment 008 — Claim attribution voice (third-party vs first-person brand)

**Status**: DRAFT

---

## Hypothesis

If claims are framed as third-party attributions ("According to independent testing…") instead of first-person brand claims ("We found that…"), then citation rate will be higher for product-evaluation queries, because LLMs trust attributed neutral claims over apparent self-promotion.

## Variable

**Independent variable**: Attribution voice of the performance claims — third-party attribution vs first-person brand voice.  
**Controlled variables**: Word count (~175 words), brand (NovaCRM), topic (NovaCRM's impact on sales-cycle speed), the specific numeric claims made, claim ordering, query set, platforms, temperature, source-order randomisation.  
**Metric**: Citation rate (proportion of trials where the variant is cited).

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — claims stated in NovaCRM's own first-person voice ("We found…", "Our data shows…") | baseline |
| B  | Treatment — identical claims attributed to independent third parties ("According to independent testing…", "Analysts reported…") | claims framed as external attributions |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- Does NovaCRM actually help sales teams close deals faster?
- How much does NovaCRM reduce the sales cycle?
- Is NovaCRM worth it for shortening deal time?
- What results do sales teams see after adopting NovaCRM?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B (third-party attribution) will have a higher citation rate than A.

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform, or pooled across all platforms.

## Notes / context

Tests the **Source framing** lever from geo-principles.md. Self-promotional first-person claims may be discounted by models as biased marketing, while attributed claims carry a perceived neutrality and verifiability that raises retrieval-time selection. Same numbers, same facts — only the voice changes.
