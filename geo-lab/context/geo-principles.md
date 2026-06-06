# How LLM Citation Actually Works (GEO Principles)

This is the lab's shared model of *why* an LLM cites one source over another.
Every experiment tests one lever from this model.

## The two citation pathways

1. **Parametric (training-weight) citation** — the model "knows" your brand
   because it appeared, densely and consistently, in its training data. Slow to
   influence (a training cycle), but durable. This is what live-mode experiments
   eventually move.

2. **Retrieval (in-context) citation** — the model is given a set of candidate
   sources at query time (RAG, search-grounded answers like Perplexity,
   ChatGPT search, Gemini grounding) and *chooses* which to cite. Fast to test,
   and increasingly the dominant pathway for fresh/long-tail queries.

**The lab tests the retrieval pathway in fast mode** because it is measurable
today, controllable, and statistically powerful. Findings transfer: content that
wins in-context selection also tends to win parametric weighting over time.

## Levers that plausibly affect citation (each = a candidate experiment)

| Lever | Hypothesis to test |
|-------|--------------------|
| **Statistical anchors** | Sentences with specific numbers ("cut latency 43%") get cited more than vague ones ("improved latency"). |
| **Entity density** | Naming concrete entities (products, people, places, standards) raises citation odds. |
| **Inverted pyramid** | Leading with the citable claim (answer-first) beats burying it. |
| **Direct definitions** | "X is a Y that does Z" sentences are citation magnets vs hedged prose. |
| **JSON-LD / schema** | Structured markup affects retrieval-grounded engines (test on Perplexity/Gemini grounding). |
| **Freshness signals** | Dated content ("As of 2026…") vs undated. |
| **Source framing** | First-person brand claim vs third-party neutral phrasing. |
| **List vs prose** | Bulleted facts vs paragraph form. |
| **Quote-ability / length** | Short standalone sentences vs long compound ones. |
| **Contradiction handling** | Content that pre-empts the false claim vs ignores it. |

## What "cited" means (operational definition)

In a probe, a variant is **cited** for a query if the model's answer:
- names the brand/source, OR
- quotes or closely paraphrases a distinctive sentence from the variant, OR
- (grounded engines) lists the variant's URL/source in its citations.

The probe records a boolean per (variant × query × platform × trial). The
analyst aggregates these into a citation rate and tests the difference.

## Why this is honest

We are not claiming to read Google's or OpenAI's internals. We measure an
**observable behaviour**: given controlled inputs, how often does each engine
cite variant A vs variant B? Repeated many times, that is a real, reportable
effect — exactly the kind of empirical claim a YouTube audience can trust and
reproduce.
