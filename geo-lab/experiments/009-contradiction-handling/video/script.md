**1. HOOK (0:00–0:20)**

[ON SCREEN: A giant number — "+55pp" — slams onto a black screen. Beneath it, smaller: "on ONE engine out of four."]

The exact same content. One version refutes a common myth about the product. The other just... states the facts. On OpenAI's model, the myth-busting version went from a 2.5% citation rate to a 57.5% citation rate. That's a 55-percentage-point swing.

[B-ROLL: Slow zoom on the number, then a hard cut to Gwylym.]

But here's the catch — and it's a big one. On Claude, that same trick did nothing. Slightly negative, even. So which is the real finding? Let's rewind.

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: "Experiment 009 — Contradiction handling vs silence"]

Here's the idea we tested. There's a GEO lever called "contradiction handling." The theory: if your content names a common false claim about your topic and explicitly refutes it, AI engines will prefer to cite you — because you resolve the ambiguity the user is actually asking about.

[B-ROLL: A search query typing out: "Is NovaCRM too complex for startups?"]

Think about it. When someone asks "Is it true that NovaCRM is too complex for startups?" — a page that says "Actually, that's a myth, here's why" is directly answering the question. A page that just lists features isn't. So our prediction was: the myth-busting variant wins by maybe 8 to 15 points on evaluative queries.

That's the hypothesis. Now let me show you exactly how we tested it, so you can decide whether to trust a word I say.

**3. METHOD (1:00–3:00)**

[ON SCREEN: Split screen — Variant A (left, "Control") vs Variant B (right, "Treatment"). Both ~180 words.]

Two variants. Same brand, same facts, same length — within 10%. Variant A describes NovaCRM's fit for small teams as plain positive claims. Variant B takes the identical facts and reframes them as a refutation: "A common misconception is that NovaCRM is only for large enterprises. This is false..."

[ON SCREEN: Highlight the opening line of Variant B in the accent colour.]

That's the only difference. Naming and refuting the false claim. Everything else is controlled.

[ON SCREEN: The pre-registered DESIGN.md file, cursor scrolling to the timestamp. "Run at: 2026-06-24T11:41:31Z"]

This design was pre-registered before the run — the hypothesis, the metric, the success criterion, all locked in. That matters. It stops me quietly moving the goalposts after I see the data.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude.]

We pushed four evaluative queries — all of them embedding the misconception — across four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku. Forty trials per variant per engine. 160 trials per variant, 320 total.

[ON SCREEN: Metric definition — "Citation rate = % of trials where the variant is cited."]

The metric is citation rate: how often does the engine actually cite our content when answering? Simple, binary, countable.

One honest caveat up front, and I'll come back to it: these are provider APIs, not the consumer apps. This is Claude Haiku with no web tools — not Claude.ai with search. So treat this as mechanism evidence about how models weight content, not a literal prediction of what Google AI Overviews will do tomorrow.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal window, probes firing one after another, JSON responses streaming.]

[ON SCREEN: Raw terminal output scrolling — "gemini | B | cited: true", "openai | A | cited: false"...]

Watching it run is the fun part. Each probe sends a query, gets an answer, and we score whether our variant was cited. Source order is randomised so we're not just measuring "the model cites whatever's first."

[B-ROLL: A response card expanding to show an OpenAI answer that quotes the myth-busting language.]

And the OpenAI results jumped out immediately. Variant A — the plain version — was basically invisible to GPT-4o-mini. One citation out of forty. Then Variant B lights up. Answer after answer pulling in the "this is a common misconception, and it's false" framing.

[ON SCREEN: Counter animating — OpenAI A: 1/40 ... OpenAI B: 23/40.]

Meanwhile, over on Claude, the two variants traded blows and basically tied. Same content. Completely different behaviour. That contrast is the whole story here.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Four-panel bar chart, one per engine, A vs B.]

Let's go engine by engine, because — spoiler — the aggregate lies to you here.

[ON SCREEN: OpenAI panel highlighted. "2.5% → 57.5%, +55pp, p<0.001".]

**OpenAI**: 2.5% to 57.5%. A 55-point lift. p is essentially zero. This survives multiple-comparison correction. This is real, and it's enormous.

[ON SCREEN: Perplexity panel. "55% → 75%, +20pp, p=0.061".]

**Perplexity**: 55% to 75%. A 20-point lift — but p is 0.061. Just misses significance after correction. Directionally consistent, not proven.

[ON SCREEN: Gemini panel. "65% → 67.5%, +2.5pp, p=0.81".]

**Gemini**: basically flat. Plus 2.5 points, p of 0.81. No detectable effect at this sample size.

[ON SCREEN: Claude panel. "45% → 40%, -5pp, p=0.65".]

**Claude**: went the *other* way. Down 5 points, not significant.

[ON SCREEN: A big warning banner — "⚠ SIMPSON'S PARADOX".]

Now, if you pool everything together, you get a tidy +18-point lift with a significant p-value. And the stratified primary test — Cochran-Mantel-Haenszel — does come back significant, odds ratio 2.15, p equals 0.0011. But one engine points the *opposite* direction. When that happens, the pooled number is misleading. The honest reporting is per engine.

[ON SCREEN: Bottom line card — "Survives correction on 1 of 4 engines."]

So the bottom line: contradiction handling produced a massive, verified lift on one engine, a promising-but-unproven lift on a second, and nothing detectable on the other two.

[ON SCREEN: Robustness table — "Verbatim 60% vs LLM-judge 99.3% for B."]

One robustness check worth flagging. We had an independent judge re-score every answer by meaning, not exact wording, to rule out "Variant B is just more quotable." Both methods show the effect in the same direction — so it's not a quotability artifact. But note the agreement between methods is weak — Cohen's kappa of just 0.10. The two scorers agree on the direction, not the magnitude. Read the semantic 99% as "B's ideas show up almost everywhere," not as a hard citation rate.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this — yet."]

Here's where I tell you why to be skeptical. This is the part that separates a scientist from a hype merchant.

[ON SCREEN: "Collection window: 4 days ⚠"]

**One: this is a four-day snapshot.** All 320 trials ran across four days in June. Model behaviour drifts. Four days is a narrow window — I want ten-plus days before I'd call anything settled.

[ON SCREEN: "No model drift ✓ — versions stable across batches."]

**Two, the good news:** no model version changed mid-experiment. Consistent engine versions throughout. That's a point in favour of the numbers being internally clean.

[ON SCREEN: "API ≠ consumer product."]

**Three: fast-mode APIs, not live consumer surfaces.** As I said — this is in-context retrieval preference on the raw APIs, with no web search. It's mechanism evidence, not a promise about ChatGPT search or AI Overviews.

[ON SCREEN: "4 engine tests → Holm-Bonferroni correction."]

**Four: multiple comparisons.** We ran four engine tests, so we corrected for that with Holm-Bonferroni. OpenAI survives. And across a whole research programme, roughly one in twenty nominal positives is chance — so replicate before betting the farm.

[ON SCREEN: "Perplexity +20pp: promising, NOT proven."]

And on power: at this sample size we can reliably detect about a 15-point lift. Perplexity's 20-point signal missed significance — that's a "need more data," not a "no." Absence of evidence isn't evidence of absence.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[ON SCREEN: "Takeaway: name the myth, refute it."]

So what do you actually do with this? If your buyers carry a misconception about you — "too complex," "enterprise-only," "too expensive" — naming it and refuting it directly can dramatically improve whether AI cites you. On GPT-4o-mini it was the difference between invisible and cited more than half the time.

[B-ROLL: Someone editing a webpage, adding a "Common misconception:" heading.]

But — and this is the whole point of testing across engines — it is not universal. It crushed on OpenAI, trended positive on Perplexity, and did nothing measurable on Gemini or Claude. So don't blanket-apply it and assume it's working everywhere. Measure per engine.

[ON SCREEN: L8EntSpace™ logo, clean.]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Raw data in the pinned comment. Reproduce it yourself."]

Raw data's in the pinned comment. Run it yourself, and tell me if you get the same split. See you next experiment.
