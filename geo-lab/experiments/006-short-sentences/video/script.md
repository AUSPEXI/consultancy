# Sentence Length & AI Citation — Script

**1. HOOK (0:00–0:20)**

[ON SCREEN: Big text — "SHORTER SENTENCES = FEWER CITATIONS?"]

Here's something that broke my intuition. I took the exact same facts about a fake CRM, and I wrote them two ways: one in long, dense compound sentences, the other chopped into short, punchy one-liners. Conventional GEO advice says short and quotable wins. The data said the opposite.

[B-ROLL: Two text blocks side by side, the long one fading in confident, the short one looking "cleaner"]

[ON SCREEN: "Long sentences cited 81.3% — short sentences 37.5%"]

Let me rewind and show you exactly what happened, including why you shouldn't fully trust it yet.

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: Hypothesis card]

The theory we tested is one of the most repeated rules in AI SEO: make your content *quotable*. Short, standalone sentences — under 15 words — should be easier for a language model to lift cleanly into an answer. Long compound sentences bury the citable fact inside subordinate clauses, raising the "cost" of extraction.

[B-ROLL: A sentence with the key fact highlighted, surrounded by clauses dimming it out]

So the prediction was simple: Variant B — short sentences — should get cited *more* than Variant A — long sentences. Same facts, same stats, same brand. Only the packaging changes. That's the whole game in GEO: does packaging move citations?

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file header — "Experiment 006 — Sentence length" — timestamp visible]

This was pre-registered before I ran a single probe. Here's the design doc with the hypothesis, the variable, and the success criterion locked in. No moving the goalposts after the fact.

[ON SCREEN: Variant A and Variant B side by side, scrolling]

Variant A packs everything into long, flowing compound sentences. Thirty-plus words each. Variant B takes the *identical* facts — same five-hours-saved stat, same 31% shorter sales cycle, same $29 pricing — and breaks them into short standalone sentences. Word count held within ten percent. Both stay in prose, no bullet lists, so we're not accidentally testing the list-versus-prose lever.

[B-ROLL: Highlighting matching statistics in both variants to prove facts are constant]

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]

I probed four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku. Four queries about how NovaCRM helps sales teams. Citation rate is the metric — what fraction of answers actually cite the variant.

[ON SCREEN: "n = 8 per platform-variant · 32 pooled per variant" with a ⚠ flag]

Now — full transparency up front. The plan was 30 trials per platform-variant. This run got 8. That's below our lab minimum. So treat everything you're about to see as *preliminary*. I'll come back to that hard in the threats section.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal scrolling, probes firing across four engines]

[ON SCREEN: Live-style terminal output — "Probing gemini... cited: A ✓ B ✗"]

Watching the probes run, a pattern showed up almost immediately. The long-sentence version kept getting pulled into answers. The short version — the one that's supposed to be more quotable — kept getting skipped.

[B-ROLL: Raw model response with the cited sentence highlighted]

And here's the thing that surprised me. When models cited Variant A, they often lifted a whole compound sentence — the clause carried context *with* the fact. The 31% stat travelled with its "why." In the short version, that same fact sat alone, stripped of the connective tissue, and the models seemed less inclined to grab it.

[ON SCREEN: "Same facts. Different packaging. Opposite result."]

That's a mechanism worth keeping in mind — but a mechanism is a story, and stories are cheap. Let's look at the numbers.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate bar chart — A 81.3% vs B 37.5%]

Pooled across all four engines: long sentences cited 81.3% of the time. Short sentences, 37.5%. That's a 43.8 percentage-point drop — in the *opposite* direction from the hypothesis. The aggregate z-test gives p = 0.0004. Statistically, that's a clear signal.

[ON SCREEN: Per-engine table with p-values and Bonferroni column]

But — and this matters — I ran four per-engine tests alongside the pooled one. When you run multiple tests, you have to correct for it, or you'll fool yourself with random noise. So the bar for each engine isn't p<0.05, it's Bonferroni-corrected p<0.0125.

[ON SCREEN: Highlight Perplexity row green]

Perplexity is the only engine that clears that bar on its own: a 62.5-point drop, p=0.0117. That survives correction. That's the real, defensible finding.

[ON SCREEN: Highlight Gemini, Claude, OpenAI in amber/grey]

Gemini shows a 50-point drop, but p=0.039 — nominally significant, doesn't survive correction. Suggestive only. Claude: 37.5 points, p=0.055 — directionally consistent, not significant. OpenAI: 25 points, p=0.30 — no detectable effect at all.

[ON SCREEN: "1 of 4 engines confirmed. All 4 point the same way."]

So the honest read: the effect is confirmed on one engine, suggestive on a second, and every single engine leans the same direction — *against* the short-sentence advice. That consistency of direction is interesting. But with only 8 trials each, I can't call this settled.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this — yet"]

Here's where I tell you why I'm not popping champagne.

[ON SCREEN: "⚠ Collection window: < 1 day"]

First: all 32 trials were collected in under a single day. That's a snapshot, not a trend. Model behaviour drifts day to day. We aim for at least ten days of coverage for a robust result. This had less than one. So this could be a Thursday-afternoon mood of the models, for all I know.

[ON SCREEN: "⚠ n = 8 per platform-variant (target 30)"]

Second: sample size. Eight per cell, against a lab minimum of thirty. The aggregate p-value looks strong, but the per-engine confidence intervals are *huge* — Variant A on Gemini ranges from 53% to 98%. At this power, three of four engines genuinely could not detect an effect, and absence of evidence is not evidence of absence. The non-significant engines are not proof that sentence length "does nothing" there — they're just underpowered.

[ON SCREEN: Model version list — all stable]

The good news: no model drift. Same versions across every batch — Gemini 2.5 Flash, GPT-4o-mini, Sonar, Haiku. So the comparison is clean on that axis.

[ON SCREEN: "Fast-mode = in-context retrieval, not live web"]

And the caveat that matters most: this is fast-mode. We're testing in-context retrieval preference — what the model picks when the content is handed to it — not how it behaves crawling the live web. Live-mode would be needed for stronger real-world validity.

[ON SCREEN: "Verdict: real on Perplexity, directional elsewhere, needs more n + time"]

So: a real, corrected signal on Perplexity, a consistent direction everywhere, and enough caveats that I'd call this a strong lead, not a law.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[ON SCREEN: "Don't atomise your facts into orphan sentences."]

Here's the practical takeaway, held to what the data actually supports. The popular advice — "chop everything into short quotable sentences" — did *not* win in this test, and on Perplexity it clearly lost. The plausible reason: a fact needs its context to be worth citing. When you strip a statistic out into a lonely five-word sentence, you may be removing the very clause that made it answer-worthy.

[B-ROLL: A statistic shown with vs without its surrounding "why" clause]

So before you run a find-and-replace turning your whole site into staccato one-liners — test it on your own brand. Direction is consistent here, but one day and eight trials is a lead, not gospel.

[ON SCREEN: L8EntSpace logo]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Subscribe — one controlled GEO experiment every week."]

Raw data and reproduction steps are in the pinned comment. Go check my math.
