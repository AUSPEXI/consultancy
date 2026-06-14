# Cross-Engine Citation Test — Do GPT, Gemini, Claude & Perplexity Agree?

## 1. Hook (0:00–0:20)

[ON SCREEN: Big bold text — "100% vs 0%" on a black background]

When I moved one statistic into the opening sentence of a product blurb, Claude went from citing it **zero percent of the time** to citing it **one hundred percent of the time**. Every single trial. And it wasn't just Claude.

[B-ROLL: Four engine logos — OpenAI, Gemini, Perplexity, Claude — lighting up one by one]

So I ran the same test across all four major AI engines to answer one question: do they actually agree on what makes you worth citing?

## 2. Hypothesis (0:20–1:00)

[ON SCREEN: Title card — "Experiment 013: Cross-Engine Comparison"]

Here's the thing most GEO advice gets wrong. People sell you "one weird trick" to get cited by AI — as if ChatGPT, Gemini, Claude, and Perplexity all think the same way. They don't necessarily. Each one runs its own retrieval and citation heuristics.

So my hypothesis was actually a prediction of **disagreement**. I took a single content lever — answer-first versus buried statistic — and held it completely frozen. The only thing I changed was the engine. My bet: at least one engine would disagree with the others about which variant wins.

[B-ROLL: Split screen showing identical text, swapping only the engine name above it]

Spoiler — the result surprised me. Let me show you the method first, because that's where the trust lives.

## 3. Method (1:00–3:00)

[ON SCREEN: DESIGN.md file with the timestamp visible]

This was pre-registered. The design doc was written before I ran anything — hypothesis, variables, success criteria, all locked. That matters, because it means I can't move the goalposts after seeing the data.

[ON SCREEN: Variant A and Variant B side by side]

Two variants. Both are blurbs for a fictional CRM called NovaCRM. Same brand, same topic, same length.

**Variant A — the control.** The key statistic is buried in vague mid-paragraph prose: "customers report that their close rate improves and their sales cycle gets shorter." Soft. Non-specific.

[ON SCREEN: Highlight the buried sentence in A — yellow underline]

**Variant B — the treatment.** Same content, but it leads with the hard number: "NovaCRM helps sales teams close 29% more deals and cut their sales cycle by 11 days, according to its 2026 benchmark across 400 teams."

[ON SCREEN: Highlight the opening sentence in B — green underline]

That's it. That's the only difference. Answer-first, specific statistic in the first sentence — versus buried and vague.

[ON SCREEN: Four engine names with model IDs — gemini-2.5-flash, gpt-4o-mini, sonar, claude-haiku-4-5]

I ran this across four engines: Gemini, OpenAI, Perplexity, and Claude. I logged the exact model version for each one. Four queries — things a real buyer would ask, like "what's the best CRM for closing deals faster?" — and I measured citation rate: how often each variant actually got cited in the answer.

[ON SCREEN: "n = 16 per variant per engine · 64 per variant total"]

Now, full honesty up front: this fast-mode run logged 2 trials per variant per query, 16 per variant per engine. That's below my lab's 30-minimum, so treat the per-engine numbers as preliminary. I'll come back to that hard in the threats section.

## 4. The Run (3:00–5:00)

[B-ROLL: Terminal scrolling, probes firing across four engines]

[ON SCREEN: Live terminal output — green CITED / red NOT CITED tags streaming]

Watching the probes run is genuinely the best part. Each probe sends the query, injects both variants into the retrievable context with randomised source order, and records whether the engine cited the variant in its answer.

[ON SCREEN: Raw Claude response — NovaCRM citation highlighted]

And you start to see the pattern almost immediately. Variant A — the buried-stat version — gets passed over again and again. Red, red, red. Then Variant B comes through, and the engines latch onto that specific number. "29% more deals." "11 days shorter." They want the hard figure.

[B-ROLL: Side-by-side of an A response with no citation and a B response with the citation]

By the time Claude finished, I checked the log twice. Variant A: cited zero times out of sixteen. Variant B: sixteen out of sixteen. A perfect split. Let's get into the numbers properly.

## 5. The Result (5:00–8:00)

[ON SCREEN: Aggregate table — A: 7.8% (5/64), B: 87.5% (56/64)]

Pooled across all four engines: the buried-statistic control got cited **7.8%** of the time. The answer-first treatment — **87.5%**. That's a swing of **+79.7 percentage points**. Z-score of 9.0, p effectively zero. Statistically, this is not noise.

[ON SCREEN: Per-engine bar chart — A vs B for each of the four engines]

But the whole point of this experiment was the per-engine breakdown. So here it is:

[ON SCREEN: Highlight each row as I read it]

- **Gemini:** 6.3% → 81.3%. A +75-point jump.
- **OpenAI:** 6.3% → 93.8%. +87.5 points.
- **Perplexity:** 18.8% → 75%. +56.3 points — the smallest gap, but still significant.
- **Claude:** 0% → 100%. The clean sweep. +100 points.

[ON SCREEN: Big text — "All four agreed."]

And here's the surprise. My hypothesis predicted disagreement. I expected at least one engine to break ranks — to favour the control, or show no effect. **None of them did.** Every single engine favoured the answer-first variant, every gap was significant, and not one reversed direction.

So the hypothesis — that the engines would disagree — was **not supported**. The data points the other way. On this particular lever, answer-first beats buried-stat universally.

[ON SCREEN: "Hypothesis: NOT supported. And that's the finding."]

That's worth sitting with. The lever I tested looks engine-agnostic. The magnitude varies — Perplexity is the least dramatic, Claude the most — but the *direction* is rock solid across four independent systems.

## 6. Threats to Validity (8:00–9:30)

[ON SCREEN: "Why you shouldn't fully trust this — yet"]

Now here's why you shouldn't take this to the bank just yet. This is the part that separates a scientist from a hype merchant.

[ON SCREEN: "Threat 1 — n = 2 per variant per query"]

**First, sample size.** Two trials per variant per query. Sixteen per engine. My lab minimum is thirty. These are preliminary numbers — directionally strong, but underpowered. Don't tattoo the exact percentages anywhere.

[ON SCREEN: "Threat 2 — 1-day collection window"]

**Second, time.** All 64 trials were collected over a single day. That's a snapshot, not a trend. Model behaviour drifts. I aim for ten-plus days of coverage before I call something robust. One day isn't that.

[ON SCREEN: "Threat 3 — fast-mode, not live index"]

**Third — and this is important — this is a fast-mode test.** It measures in-context retrieval preference: when both variants are sitting in the context window, which does the engine pick? That's *not* the same as live-mode, where the engine has to find your content on the open web first. Live-index results would give stronger external validity. So read this as "given the engine sees both, which wins" — not "this gets you cited from scratch."

[ON SCREEN: "Threat 4 — multiple comparisons"]

**Fourth, multiple comparisons.** I ran four per-engine tests alongside the main pooled test. With a Bonferroni correction, the per-engine threshold tightens to 0.0125. The good news — all four still clear it comfortably. Even Perplexity, the weakest, sits at p=0.0014.

[ON SCREEN: "No model drift — versions stable across batches"]

One thing in its favour: zero model drift. Same versions across every batch. So the result isn't an artefact of a model update mid-run.

## 7. What It Means For You (9:30–end)

[ON SCREEN: "Takeaway: lead with the specific number."]

So what do you actually do with this? Lead with your most specific, verifiable statistic in the very first sentence. Don't bury it in soft, vague prose. Across four engines, the answer-first version got cited roughly 11 times more often. That's a free, structural edit you can make today.

[B-ROLL: Editing a real product page — moving a stat to the top]

But — and I mean this — verify it on your own content. My test was one fictional brand, one lever, one snapshot. Your mileage will vary by engine and by topic, and you need real reps to know.

[ON SCREEN: L8EntSpace logo]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Subscribe — one controlled GEO experiment a week."]

Raw data and reproduction steps are in the pinned comment. Go check my work. That's the whole point.
