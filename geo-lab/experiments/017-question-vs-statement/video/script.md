**1. HOOK (0:00–0:20)**

[ON SCREEN: Big text — "12.5pp lower... p = 0.28"]

Open your blog post with the question, or open with the answer. Conventional SEO wisdom says match the searcher's intent — open with the question. I tested whether that actually changes how often AI cites you. The answer? Probably nothing. But "probably nothing" is a real finding, and there's a number you need to see.

[B-ROLL: Two text blocks side by side, one starting with a question mark, one starting with a statement.]

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: Hypothesis card]

Here's the theory. When an AI assembles an answer, it pulls from sources that hand it an extractable claim — a fact it can lift and cite. So my hypothesis was: if your content opens by restating the query as a question — "What's the best way to close deals faster?" — instead of answering it immediately, the AI has nothing to grab in that first sentence. It has to wait. And maybe it just grabs from a competitor who answered first.

[ON SCREEN: "Predicted: A (answer-first) beats B (question-first) by 8–15pp"]

I predicted answer-first would win by 8 to 15 percentage points. This is the inverted-pyramid lever — answer first, explain second. Half the SEO internet does the opposite. Let's find out who's right.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file with timestamp visible]

Everything is pre-registered before the run. Here's the design doc, timestamped. I write the hypothesis and success criterion down before I see a single result, so I can't move the goalposts later.

[ON SCREEN: Variant A and Variant B side by side, opening sentences highlighted]

Two variants. Both describe a fictional CRM called NovaCRM. Both are about 175 words. Both contain the exact same facts — same 35% sales-cycle reduction, same 6 hours saved per week, same 8% forecast accuracy. The only thing that differs is the first sentence.

Variant A opens with the answer: "NovaCRM helps sales teams close deals faster by automating follow-ups..."

Variant B opens with the question: "What is the best way to help your sales team close deals faster?" — then gives the identical content.

[B-ROLL: Highlight sweeping across just the first sentence of each, rest of text dimmed identical.]

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]

I probed four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku 4.5. Four how-to and definitional queries, the kind where answer-first should matter most.

[ON SCREEN: Big honest disclaimer — "n = 2 per variant per platform. Lab minimum is 30."]

Now — full transparency. This run is small. Two trials per variant per platform. My lab standard is 30. So treat this as preliminary, a fast-mode probe, not a verdict. I'll hammer that point again in the threats section, because it matters.

**4. THE RUN (3:00–5:00)**

[ON SCREEN: Terminal scrolling probe execution]

Here's the run. Each probe sends the query, drops both variants into the retrievable context, and records whether the engine cited variant A, variant B, both, or neither.

[B-ROLL: Terminal output streaming, citations being logged green/red.]

Watching it live, the pattern wasn't clean. On some queries Gemini grabbed the answer-first version. On others it ignored both. Perplexity was stubbornly even — it didn't seem to care which opening it saw. Claude, weirdly, leaned slightly toward the question version on the few trials we ran.

[ON SCREEN: Raw response snippet with citation highlighted]

No dramatic divergence. No moment where one variant clearly dominated. Which, honestly, was the first hint of where this was heading.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate table — A: 37.5%, B: 25.0%]

Let's go to the numbers. Pooled across all four engines — the primary endpoint — answer-first scored 37.5% citation rate, question-first scored 25%. That's a 12.5 percentage point gap, in the predicted direction.

[ON SCREEN: Big text — "p = 0.2807 — NOT significant"]

But here's the discipline. The p-value is 0.28. That's nowhere near significant. With this tiny sample, a 12.5-point gap is exactly what you'd expect from random noise. I cannot claim answer-first wins. The direction is suggestive; the statistics are not.

[ON SCREEN: Per-platform bar chart]

Per-platform, it falls apart further. Gemini showed the biggest gap — answer-first 62.5% versus 25% — but p was 0.13. OpenAI: 50 versus 25, p of 0.30. Perplexity: dead even, 25 versus 25, p of 1.0 — literally zero difference. And Claude actually went the other way, 12.5 versus 25 in favor of the question opening.

[ON SCREEN: "0 of 4 platforms significant. Aggregate: not significant."]

Zero significant effects. Anywhere. At every threshold. This is a clean null result.

[B-ROLL: Gwylym shrugging honestly at camera.]

So what do we actually know? We know that under these conditions, with this content, on this small sample — flipping your opening sentence from a statement to a question did not produce a detectable change in citation rate. The directional hint toward answer-first is interesting enough to re-test at full scale. But today, the honest headline is: it didn't move the needle.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this — yet"]

Here's why you shouldn't over-trust this. Four reasons.

[ON SCREEN: "1. Tiny sample — n=2"]

One — sample size. Two trials per variant per platform. That's far below my 30-trial minimum. A null result on a tiny sample mostly tells you "we didn't have the power to detect anything." It does not prove the effect is zero. The 12.5-point gap could be real and we simply couldn't resolve it.

[ON SCREEN: "2. One-day snapshot"]

Two — temporal coverage. Every one of these 32 trials was collected in a single day. That's a snapshot. Model behavior drifts; one day tells you about one day. I aim for ten days minimum for anything robust. This isn't that.

[ON SCREEN: "Model versions: stable across run ✓"]

Three — on the good side, the model versions were stable across the whole run. No silent updates mid-experiment, so the snapshot is at least internally consistent. But this was fast-mode — testing in-context retrieval preference, not live web indexing. A live-index test would tell you more about the real world.

[ON SCREEN: "4. Multiple comparisons — Bonferroni α = 0.0125"]

Four — multiple comparisons. I ran four per-platform tests alongside the main one. Run enough tests and one looks exciting by chance. Bonferroni-corrected, the bar for per-platform significance drops to 0.0125. Nothing came close anyway, so it's moot here — but you should know the correction exists.

[B-ROLL: Threats checklist ticking through.]

That's the honest accounting. Suggestive direction, underpowered test, single day. Re-test before you believe it.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[ON SCREEN: "Takeaway: don't sweat the opening sentence — yet"]

So the practical takeaway. If you've been agonizing over whether to open your content with a question or a statement to please the AI engines — based on this, stop agonizing. There's no evidence it's a high-leverage lever. The directional hint slightly favors answering first, which costs you nothing to do anyway, so do that. But don't expect it to transform your citation rate.

[ON SCREEN: "Answer first. It's free. But it's not magic."]

The bigger lesson: most single-sentence tweaks don't move citation rates. The big levers are elsewhere — the facts you provide, their structure, their extractability. That's where to spend your effort.

[ON SCREEN: L8EntSpace logo]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

Raw data and reproduction steps are in the pinned comment. Run it yourself, get more trials than I did, and tell me if the direction holds. See you next experiment.

[B-ROLL: End card with subscribe + next video.]
