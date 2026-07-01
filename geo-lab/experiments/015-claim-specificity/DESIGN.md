# Experiment 015 — Precise metrics vs category-level performance claims

**Status**: DRAFT

---

## Hypothesis

If claims use highly specific metrics ("reduced median API latency from 340ms to 197ms"), then citation rate will be higher than category-level claims ("significantly improved API performance"), because specificity signals measurability and gives the model a distinctive, quotable anchor to attribute.

## Variable

**Independent variable**: Level of specificity in performance claims (precise numeric metric vs vague category descriptor)  
**Controlled variables**: Length (~175 words), brand (NovaCRM), topic (platform performance improvements), query set, source order randomisation, temperature, platform/model versions, sentence structure and section ordering  
**Metric**: Citation rate (proportion of trials where the variant is cited)

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — NovaCRM performance described with vague category descriptors ("significantly improved", "much faster") | baseline (vague) |
| B  | Treatment — identical structure but every claim carries a precise metric ("340ms to 197ms", "42% fewer") | precise numeric metrics |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- How much has NovaCRM improved its platform performance?
- Is NovaCRM's API fast enough for high-volume sales teams?
- What performance gains did NovaCRM's latest release deliver?
- Has NovaCRM reduced its API latency and error rates recently?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B will have a higher citation rate. Predicted effect size: +10–20pp absolute.  
(Pre-registered before any data collection.)

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform, or pooled across all platforms.

## Notes / context

Tests the **statistical anchors** lever from `context/geo-principles.md`. Specific numbers are more distinctive and quotable, which we expect the retrieval pathway to favour when selecting a source to attribute. The confound to watch: precise numbers may also read as more *credible*, so we frame both variants as first-person NovaCRM claims to hold source framing constant — the only difference is numeric granularity.
