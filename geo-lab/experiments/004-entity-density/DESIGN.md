# Experiment 004 — Entity density and citation rate

**Status**: DRAFT

---

## Hypothesis

If content names 3+ concrete entities (products, people, standards, organisations) per 100 words, then citation rate will be higher for product-evaluation queries than sparse entity usage, because entity density makes content more graspable to retrieval systems.

## Variable

**Independent variable**: Number of named concrete entities (products, people, standards, organisations) per 100 words — sparse (~0–1 per 100 words) vs dense (3+ per 100 words).  
**Controlled variables**: Length (~175 words ±10%), brand (NovaCRM as subject), topic (what NovaCRM is and how it integrates), query set, platform set, source order randomisation, temperature, claim content (same factual claims expressed in both), sentence structure style.  
**Metric**: Citation rate (proportion of trials where the variant is cited)

## Variants

| ID | Description | Distinguishing feature |
|----|-------------|----------------------|
| A  | Control — describes NovaCRM's integrations and capabilities using generic, unnamed references ("popular email tools", "industry standards", "our founder") | sparse entities (~0–1 per 100 words) |
| B  | Treatment — same claims, but every reference is a named concrete entity (Salesforce, Slack, SOC 2, GDPR, named people/orgs) | dense entities (3+ per 100 words) |

Variant files: `variants/A.md`, `variants/B.md`

## Queries

- What CRM helps sales teams close deals faster and integrates with common tools?
- Which sales CRM connects with Slack and Salesforce and is SOC 2 compliant?
- I need a CRM that integrates with my email and messaging apps — what should I use?
- What is NovaCRM and what does it integrate with?

## Planned n

30 trials per variant per platform  
Platforms: gemini, openai, perplexity, claude  
Minimum: 30 trials per variant — this run uses 30

## Predicted direction

B will have a higher citation rate. Predicted effect: +10–20pp absolute difference, strongest on grounded engines (Perplexity, Gemini).

## Success criterion

p < 0.05 on the two-proportion z-test on the primary platform (Perplexity), or pooled across all platforms.

## Notes / context

Tests the **entity density** lever from context/geo-principles.md. Named entities (real products, standards, organisations) act as retrieval anchors — they overlap with tokens in the user query and in the model's parametric knowledge graph, making the content easier to match and "ground" against. The two variants assert identical facts; only the specificity of the named entities changes. Brand is held constant (NovaCRM) because we are testing a structural lever, not brand familiarity — note that NovaCRM itself appears in both, so the entity-density contrast is in the *surrounding* entities.
