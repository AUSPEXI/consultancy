**1. HOOK (0:00–0:20)**

[ON SCREEN: Big text — "6.3% → 43.8%"]
[B-ROLL: Two web articles side by side, identical except one sentence has moved to the top.]

Moving one sentence to the top of a page took AI citation rate from 6.3% to 43.8%. Same statistic. Same facts. Same word count. I just moved *where* the claim sat — and citation rate jumped by 37.5 percentage points. But before you rewrite every page you own, let me show you the data — including the part where one engine completely ignored the trick.

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: Hypothesis text card]
[B-ROLL: Inverted-pyramid diagram — claim at the wide top.]

Here's the idea. There's an old journalism principle called the inverted pyramid: lead with the answer, then explain. The GEO version of that hypothesis is simple — if you put your citable claim in sentence one instead of burying it in paragraph three, large language models are more likely to lift it and cite you, because they weight the opening of a source as the answer anchor.

[ON SCREEN: "Predicted: +8 to 15pp in favour of front-loading"]

I pre-registered a prediction: front-loading would win by roughly 8 to 15 percentage points. Let's see if the data agreed — because it didn't behave the way I expected.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file, timestamp visible — pre-registered before data]
[B-ROLL: Scrolling the design doc.]

First, the trust-builder. This design document was written *before* a single probe ran. The hypothesis, the variants, the success criterion — all locked in advance. That stops me fishing for a result after the fact.

[ON SCREEN: Split screen — Variant A (left) vs Variant B (right)]

Two variants. Both describe a fictional product, NovaCRM. Both contain the identical citable claim: "NovaCRM reduces sales-cycle length by 40%." Both have the same supporting facts and the same word count, within ten percent.

[ON SCREEN: Highlight the claim — paragraph 3 on A, sentence 1 on B]

The *only* difference: in Variant A, that claim is buried in paragraph three. In Variant B, it's the very first sentence. That's it. One variable.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]
[B-ROLL: Terminal window ready to run.]

I tested four engines: Gemini, GPT-4o-mini, Perplexity Sonar, and Claude Haiku. Four product-capability queries — things like "How much can NovaCRM shorten a sales cycle?" Each query went to each engine, with both variants available as candidate sources, in randomised order so position bias couldn't leak in.

[ON SCREEN: "n = 2 trials per variant per platform — PRELIMINARY"]

Now, full honesty: this is a fast run. Two trials per variant per platform — 32 trials per variant, 64 total. That's below my lab's minimum of 30 per cell. So treat this as preliminary. I'll hammer that point again in the threats section.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal scrolling probe execution, JSON responses streaming.]
[ON SCREEN: Live probe counter ticking up]

Here's the run. Each probe sends the query, hands the model the candidate sources, and records whether our variant got cited in the answer. Raw responses, logged.

[ON SCREEN: Example raw response — Gemini citing Variant B]

Watching it live, a pattern showed up fast. When Gemini hit Variant B — the front-loaded one — it kept pulling that 40% number straight into the answer. With Variant A, it often answered the question generically and never cited the source at all.

[ON SCREEN: OpenAI responses — zero citations both variants]
[B-ROLL: A shrug-worthy flat-line graphic.]

Then OpenAI. GPT-4o-mini cited *neither* variant. Not once. Zero for A, zero for B. That's not a win for front-loading — that's an engine that just didn't bite on this content at all. Keep that in mind.

[ON SCREEN: Perplexity and Claude — partial citations on B]

Perplexity and Claude sat in between, citing Variant B several times and Variant A never. Let's put the numbers on a chart.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate bar chart — A 6.3% vs B 43.8%]

Pooled across all four engines — this is the primary endpoint. Variant A, the buried claim: cited in 2 of 32 trials, 6.3%. Variant B, front-loaded: 14 of 32, 43.8%. A difference of plus 37.5 percentage points.

[ON SCREEN: "z = 3.464, p = 0.0005 ✓ significant"]

The two-proportion z-test gives p equals 0.0005. That's strongly significant. On the pooled data, front-loading the claim clearly beat burying it — and by far more than my predicted 8 to 15 points.

[ON SCREEN: Per-platform table — Gemini, OpenAI, Perplexity, Claude]

But the per-engine breakdown is where it gets interesting. Gemini: 25% versus 87.5%, a 62.5-point jump, p equals 0.012 — significant. Claude: 0 versus 50%, p equals 0.021 — significant. 

[ON SCREEN: Highlight Perplexity row — p = 0.0547]

Perplexity moved from 0 to 37.5%, but p was 0.055 — just over the line, so not significant on its own. And OpenAI? Zero versus zero. Completely flat. No effect, because it cited nothing either way.

[ON SCREEN: Plain-language conclusion card]

So the honest conclusion: pooled across engines, front-loading your citable claim produced a large, significant lift. On Gemini and Claude individually, it clearly worked. On Perplexity it leaned the right way but wasn't conclusive. And on GPT-4o-mini, in this setup, it did nothing. Position matters — but it's not a universal lever.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this (yet)"]

Now the part that separates a scientist from a hype merchant. Here's why you should hold this loosely.

[ON SCREEN: "1. n = 2 per cell — below minimum of 30"]

One: sample size. Two trials per variant per platform. That's tiny. The pooled n of 32 gives a significant result, but the per-engine cells are fragile. This is preliminary, full stop.

[ON SCREEN: "2. Collected in < 1 day — snapshot only"]

Two: temporal coverage. All 64 trials ran in a single day. That's a snapshot of model behaviour on June 16th, 2026 — not a stable, repeated truth. My target for a robust result is at least ten days. This had one.

[ON SCREEN: "3. Model versions stable — no drift ✓"]

Three, on the good side: no model drift. Every batch ran on the same engine versions — Gemini 2.5 Flash, GPT-4o-mini, Sonar, Claude Haiku 4.5. So version churn isn't contaminating the comparison.

[ON SCREEN: "4. Fast-mode — in-context retrieval, not live index"]

Four: this is fast-mode. I handed the models the candidate sources directly. That tests in-context retrieval *preference* — not whether you'd actually get pulled from a live web index in the wild. Real-world external validity needs a live-mode run.

[ON SCREEN: "5. Multiple comparisons — Bonferroni α = 0.0125"]

And five: I ran four per-engine tests alongside the primary. Correcting for that, the per-engine bar tightens to 0.0125. Gemini and Claude still clear it. Perplexity doesn't. Treat the per-engine claims as exploratory.

**7. WHAT IT MEANS FOR YOU (9:30–END)**

[ON SCREEN: "Takeaway: front-load your citable claim"]
[B-ROLL: Editing a page — dragging the key stat to the top.]

So what do you actually do? Front-load your citable claim. Don't make the model dig for your best statistic in paragraph three — lead with it, then support it. On the engines that cited anything here, that single change roughly seven-x'd the citation rate. It costs you nothing to test on your own pages.

[ON SCREEN: "But: confirm per-engine. GPT cited neither."]

But confirm it for the engines *you* care about. Gemini and Claude loved it. GPT-4o-mini ignored both. A universal rule this is not.

[ON SCREEN: L8EntSpace logo + URL]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Subscribe — one experiment a week"]

I run one of these every week. Raw data's in the description so you can reproduce it yourself. See you in the next one.
