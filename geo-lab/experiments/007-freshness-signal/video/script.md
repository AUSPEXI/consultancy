**1. HOOK (0:00–0:20)**

[ON SCREEN: Big text — "0.0pp difference"]

Adding "Updated June 2026" and "As of 2026" to your content did absolutely nothing for how often AI cited it. Zero percentage points. Same exact rate. I ran 64 citation probes across four AI engines to test one of the most repeated pieces of GEO advice — "add freshness signals" — and the data came back flat.

[B-ROLL: Slow zoom on a clean bar chart with two identical bars.]

Let me show you exactly what happened.

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: "Hypothesis: date markers → more citations?"]

The theory is intuitive. Large language models supposedly prefer temporally anchored sources — content that signals it's current. So if you stamp your page with "Updated June 2026" or "As of 2026," the model should trust it more for questions about what's *latest* or *current*, and cite it more often.

[B-ROLL: Mock webpage with a glowing "Updated June 2026" badge.]

This is the **freshness signals** lever. And it sounds right. Recency matters to humans, so why not to models? My prediction going in was a lift of at least eight percentage points, strongest on grounded engines like Perplexity and Gemini, and strongest for "how current is this" style queries.

That was the bet. Here's how I tested it.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file header with timestamp visible]

First — and this matters — the experiment was pre-registered. The design, the hypothesis, the success criterion, all written down before I collected a single data point. You can see the timestamp. This isn't me fishing for a result after the fact.

[ON SCREEN: Split screen — Variant A (left), Variant B (right)]

Two variants. Both describe a fictional CRM called NovaCRM — same facts, same numbers, same structure, same word count. The *only* difference: Variant B sprinkles in date markers. "Updated June 2026." "As of 2026." "Teams that adopted NovaCRM in 2026."

[B-ROLL: Highlight the date phrases lighting up in yellow on Variant B.]

Variant A is identical but undated. So any difference in citation rate is attributable to those date phrases and nothing else. That's the whole point of a controlled test.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]

I probed four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku 4.5. Four factual queries — things like "What is the latest version of NovaCRM?" and "Is NovaCRM up to date for 2026 sales workflows?" — exactly the kind of currency-framed questions where freshness signals *should* win if they win anywhere.

[ON SCREEN: "n = 2 trials per variant per platform"]

Now — full honesty — this was a fast-mode run. Two trials per variant per platform. That's 64 probes total, 32 per variant. That is below my lab's minimum of 30 trials per cell, so treat this as preliminary. I'll come back to that hard in the threats section. But let's look at what came out.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal scrolling, probes firing one by one, responses streaming in.]

Watching these run is oddly tense. Each probe sends the query, drops both variants into the retrieval context, randomises their order so position can't bias the result, and records whether the model cites A, B, both, or neither.

[ON SCREEN: Raw response snippet — model answering the NovaCRM query]

And here's the first thing you notice. OpenAI and Perplexity didn't cite *either* variant. Not the dated one, not the undated one. Zero citations across all 16 probes on each of those engines.

[ON SCREEN: "OpenAI: 0/8 vs 0/8 — Perplexity: 0/8 vs 0/8"]

Gemini and Claude did cite — but symmetrically. Two citations for the dated version, two for the undated version. Identical.

[B-ROLL: Side-by-side response cards from Gemini, both variants cited equally.]

No pattern emerged where the date markers pulled ahead. Not on the currency-framed queries, not anywhere. Let's put the numbers on the board.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate table — A: 4/32 = 12.5%, B: 4/32 = 12.5%]

Here's the headline, the primary endpoint, all platforms pooled. Variant A — undated — cited four times out of 32. Twelve and a half percent. Variant B — dated — cited four times out of 32. Twelve and a half percent.

[ON SCREEN: Two identical bars, "0.0pp difference, p = 1.0"]

The difference is zero point zero percentage points. The two-proportion z-test gives z equals zero, p equals one. You literally cannot get a less significant result than this. The bars are the same height.

[ON SCREEN: Per-platform breakdown table]

Per platform: Gemini, 25% versus 25%. Claude, 25% versus 25%. OpenAI, zero versus zero. Perplexity, zero versus zero. Every single engine — no difference. Not a small difference I'm rounding away. Exactly zero, every time.

[B-ROLL: Gwylym shrugging, deadpan.]

This is a clean null result. Under these conditions, adding "Updated June 2026" and "As of 2026" did not change how often AI engines cited the content. The freshness-signals lever — at least the lazy version of it, where you just bolt date phrases onto otherwise-identical text — did nothing.

[ON SCREEN: "Date phrases ≠ freshness"]

And honestly, that makes a kind of sense. A date string is not freshness. It's a *claim* of freshness with no underlying signal. The model already had identical facts in both variants. Stamping a date on stale-but-identical content doesn't add information — so why would it move the needle? Null results like this are valuable precisely because they kill advice that *sounds* smart but doesn't survive contact with data.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this (yet)"]

Now here's why you shouldn't take this as gospel. This is the part that separates a scientist from a hype merchant.

[ON SCREEN: "⚠ All 32 trials in < 1 day"]

One — temporal coverage. Every trial was collected inside a single day, the 18th of June. That's a snapshot of model behaviour on one day. These systems drift. My target for a robust read is at least ten days of collection, and this had less than one. So this captures one moment, not a trend.

[ON SCREEN: "n = 2 per cell — below lab minimum of 30"]

Two — sample size. Two trials per variant per platform. Below my own minimum of 30. With numbers this small, the confidence intervals are huge — the Gemini and Claude rates carry intervals from zero to 55%. A true effect smaller than this test could detect would be invisible here. The null is real, but it's a *preliminary* null.

[ON SCREEN: "Model versions stable — no drift"]

One thing in our favour: model versions were stable across every batch. No version changes mid-run. So drift didn't contaminate *this* run, even if it could change the answer tomorrow.

[ON SCREEN: "Fast-mode = in-context retrieval, not training weight"]

Three — this was fast-mode. I'm testing in-context retrieval preference, not what's baked into the model's training weights from the live web. A live-index test could behave differently, and freshness might matter more when the model is actually ranking real indexed pages.

[ON SCREEN: "4 per-platform tests → Bonferroni α = 0.0125"]

Four — multiple comparisons. I ran four per-platform tests alongside the primary aggregate. More tests means more chances for a false positive, so the per-platform numbers are corrected and exploratory. Doesn't change anything here — everything was a flat zero — but you should always demand that discipline.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[ON SCREEN: "Don't just stamp a date and call it fresh."]

So what do you actually do with this? Don't waste your time bolting "Updated June 2026" onto otherwise-identical content and expecting AI to cite you more. In this test, it did nothing. Freshness as a cosmetic label is not a citation lever.

[B-ROLL: Gwylym to camera.]

What probably *does* matter is real freshness — new facts, updated numbers, genuinely current information that the model didn't already have. That's a different experiment, and it's on the list. But the date-stamp shortcut? Preliminary data says skip it.

[ON SCREEN: L8EntSpace logo]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

Raw data's in the pinned comment so you can reproduce every number. See you in the next one.
