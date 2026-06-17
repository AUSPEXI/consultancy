**1. HOOK (0:00–0:20)**

[ON SCREEN: Big bold text — "BULLETS LOST. 9.4% vs 21.9%"]

Everyone tells you to format your facts as bullet points so AI can pull them out and cite you. So I tested it. And the bulleted version got cited *less* — 9.4% versus 21.9% for plain prose.

[B-ROLL: Slow zoom on two content blocks side by side, prose left, bullets right.]

But before you delete every list on your site — hang on. The result isn't statistically significant, and the *why* matters more than the headline.

[ON SCREEN: "p = 0.1685 — not significant"]

**2. HYPOTHESIS (0:20–1:00)**

[B-ROLL: Whiteboard sketch of a bullet list with little "copy" icons next to each item.]

Here's the logic everyone repeats. List items are discrete. They're copy-pasteable. They're atomic claims. So an LLM grounding its answer in retrieved text *should* find them easier to isolate and attribute. Prose, the theory goes, gets paraphrased — your facts get absorbed into the answer with no credit.

[ON SCREEN: Hypothesis card —
"IF facts are bulleted, THEN citation rate rises vs prose."]

That's a clean, testable hypothesis. It's also one of the most repeated pieces of GEO advice on the internet. So I pre-registered it and ran the experiment across four AI engines. Predicted direction: bullets win by 8 to 15 percentage points.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md open in editor, cursor on "Status: DRAFT" and pre-registration note.]

First, the trust part. I wrote the design *before* collecting any data — hypothesis, predicted direction, success criterion, all locked. That's the pre-registration. No moving the goalposts after seeing results.

[ON SCREEN: Split screen — Variant A (prose) left, Variant B (bullets) right.]

The two variants describe the exact same fictional product, NovaCRM. Same facts. Same numbers — 23% win-rate lift, 2.4× faster outreach, $29 a month, five hours saved per rep. Word count within ten percent. The *only* difference: Variant A is flowing paragraph prose, Variant B is a bulleted list.

[B-ROLL: Highlight the identical "23%" stat appearing in both variants.]

That single-variable discipline is the whole game. If anything else differed, the test would be meaningless.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude.]

I probed four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku 4.5. Four feature-and-capability queries — things like "What features does NovaCRM offer to help sales teams close deals faster?"

[ON SCREEN: "n = 2 trials per variant per platform — 64 trials total" with a ⚠ flag.]

Now — full honesty up front. This is a fast-mode run. Two trials per variant per platform. That's well below our lab minimum of thirty. Treat this as preliminary, a signal-check, not a verdict. I'll come back to that hard in the threats section.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal scrolling, probes firing one by one, green and grey status ticks.]

[ON SCREEN: Terminal output — query sent → response returned → "CITED / NOT CITED" tag.]

Watching it run is the unglamorous part of science. Each probe sends a query, the engine returns an answer, and we check: did it actually cite our variant as a source, or just absorb the facts?

[ON SCREEN: Raw response snippet — a Perplexity answer that paraphrases NovaCRM's features with no source attribution.]

And you see it happen in real time — an engine confidently states "NovaCRM lifts win rates by 23%" and attributes it to… nothing. The fact survived. The citation didn't.

[B-ROLL: Side-by-side of a cited response vs an uncited response, citation link highlighted in the cited one.]

What struck me during the run: the bulleted version kept getting paraphrased *anyway*. The neat little list items didn't seem to act as the copy-paste magnets the theory predicted. But that's eyeballing it — let's go to the numbers.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate table —
Variant A (prose): 7 / 32 cited — 21.9%
Variant B (bullets): 3 / 32 cited — 9.4%]

Pooled across all four engines: prose got cited 21.9% of the time, bullets 9.4%. That's a 12.5 percentage point gap — in the *opposite* direction to the prediction.

[ON SCREEN: Bar chart, prose bar clearly taller than bullets bar, with error bars.]

But here's the discipline. The z-test gives p = 0.1685. Our threshold was 0.05.

[ON SCREEN: "p = 0.1685 — NOT SIGNIFICANT" in the accent colour.]

So this is a null result. We cannot conclude bullets help, and we cannot conclude bullets hurt. With this sample size, a 12.5-point gap is well within the range of pure noise.

[ON SCREEN: Per-platform table — Gemini, OpenAI, Perplexity, Claude rows with rates and p-values.]

Per engine it's messier. Gemini actually leaned the *other* way — bullets 37.5% versus prose 25%. Perplexity and Claude both went prose 25%, bullets 0%. OpenAI: prose 12.5%, bullets 0%. Every single per-platform p-value is above 0.05 — and after Bonferroni correction for running four tests, the bar is even higher, 0.0125. Nothing clears it.

[B-ROLL: Animation of four arrows pointing in different directions, then collapsing to a flat line.]

Plain conclusion: in this snapshot, formatting facts as a bulleted list did not raise citation rate. If anything the directional signal is *against* it — but the honest answer is the effect, if it exists, is too small to detect here.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this" header.]

Here's why you shouldn't over-read this — and this is the part that separates a scientist from a hype merchant.

[ON SCREEN: "1. Sample size — n=2 per cell ⚠"]

First, sample size. Two trials per variant per platform. That's tiny. The confidence intervals are enormous — Gemini's prose rate is "somewhere between 0 and 55%." You can't build strategy on that. This is a preliminary signal, full stop.

[ON SCREEN: "2. Temporal coverage — 32 trials, 1 day ⚠"]

Second, time. All 64 trials ran in a single day. That's a snapshot of model behaviour on one afternoon. These engines change. We target at least ten days of coverage for robust results; this had less than one. A different day could give a different answer.

[ON SCREEN: "3. Model versions — STABLE ✓"]

Third — and this one's a credibility plus — no model drift. Same engine versions across every batch. So at least we're not comparing apples to a different model's oranges.

[ON SCREEN: "4. Fast-mode vs live-mode"]

Fourth, this is a fast-mode, in-context retrieval test. We're measuring which format an engine prefers to cite when the content is placed in front of it — not whether it earns its way into the live index over time. Live-mode testing would be needed for stronger real-world validity.

[ON SCREEN: "5. Multiple comparisons — Bonferroni α = 0.0125"]

And fifth, we ran four per-platform tests alongside the main one. Run enough tests and one will look interesting by chance — so those per-platform numbers are exploratory, not conclusions.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[B-ROLL: Slow pan over a clean content page mixing prose and bullets.]

So what do you actually do with this? Two things.

[ON SCREEN: "Takeaway 1 — Bullets are not a citation cheat code."]

One: stop treating "format it as bullets" as a guaranteed citation lever. In this test it did nothing — and leaned negative. The atomic-claim theory sounds great, but the data didn't back it. Use bullets for *human* readability, by all means. Just don't expect AI to reward the formatting itself.

[ON SCREEN: "Takeaway 2 — Format probably isn't your bottleneck."]

Two: if even a clean prose-versus-bullets test produces a null, your citation problem is probably upstream — whether your facts are distinctive and verifiable at all, not how they're punctuated.

[B-ROLL: Gwylym to camera, calm, direct.]

I'll re-run this at full sample and over ten days to see if a real signal emerges. That's how this channel works — I test it so you don't have to.

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: Subscribe + raw data link card.]
