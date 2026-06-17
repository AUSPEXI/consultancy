**1. HOOK (0:00–0:20)**

[ON SCREEN: Big bold text — "15.6% → 50%"]
[B-ROLL: Split screen, two near-identical paragraphs side by side]

Same product. Same numbers. Same facts. The only thing I changed was *who said them* — and citation rate by AI engines jumped from 15.6% to 50%. That's a three-fold lift from a single edit. But hold on — because two of the four engines didn't play along at all. Let me show you the data.

[ON SCREEN: "n=64 probes · 4 engines · same facts"]

**2. HYPOTHESIS (0:20–1:00)**

[B-ROLL: Gwylym at desk, terminal open behind]

Here's the idea I wanted to test. When a brand makes a claim in its own voice — "We found that our product cut sales cycles by 31%" — does an AI model quietly discount that as marketing fluff? And if you reframe the *exact same claim* as a third-party attribution — "According to independent testing, the product cut sales cycles by 31%" — does the model trust it more, and cite it more often?

[ON SCREEN: Two quotes stacked —
"We found…" (red)
"According to independent testing…" (green)]

Same statistic. Same brand. Same product page length. The only variable: the *voice* of the claim. First-person brand voice versus third-party attribution. That's the GEO "source framing" lever, and this is experiment 008.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file header, timestamp visible]
[B-ROLL: Scrolling the pre-registered design doc]

Before any data was collected, I pre-registered the design. Here's the file. This matters — I'm committing to the hypothesis, the metric, and the success criterion *before* I see the numbers, so I can't move the goalposts later.

The product is a fictional CRM called NovaCRM — fictional on purpose, so no real-world reputation contaminates the test. I wrote two versions of its product page.

[ON SCREEN: Variant A and B side by side, scrolling]

Variant A — the control — states every performance claim in first-person brand voice. "We found that teams shortened their sales cycle by 31%." "Our internal data shows reps spend 42% less time on data entry."

Variant B — the treatment — takes those *identical numbers* and reframes them as external attributions. "According to independent testing…" "A third-party usage audit found…" "Industry analysts reported…" Same 31%, same 42%, same 94% forecasting accuracy. Only the attribution changes.

[ON SCREEN: Controlled-variables checklist ticking down — word count, brand, numbers, query set, temperature]

Everything else is locked: word count around 175, identical claims, identical query set, same source-order randomisation.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]

Then I probed four engines — Gemini, GPT-4o-mini, Perplexity Sonar, and Claude Haiku — with four real buyer questions like "Does NovaCRM actually help teams close deals faster?" and "How much does NovaCRM reduce the sales cycle?"

[ON SCREEN: Red banner — "n=2 per variant per platform — PRELIMINARY"]

Now — full honesty up front. This is a fast-mode run. Just two trials per variant per engine — 64 probes total. My lab minimum for a confident result is 30 per cell. So treat everything here as a *preliminary signal*, not gospel. I'll hammer this point again in threats to validity.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal scrolling, probes firing, JSON responses streaming]
[ON SCREEN: Live citation counter ticking up per engine]

Here's the run executing. Each probe sends a buyer question, the engine answers, and I check: did it cite the NovaCRM content — and if so, which variant?

[ON SCREEN: Raw OpenAI response, NovaCRM cited, highlighted]

Watch OpenAI here. On the first-person variant — nothing. It just doesn't reach for that content. Then on the third-party version, it cites it. Again. And again. Every single time.

[ON SCREEN: Raw Claude response — control cited, treatment not]

But then there's Claude. And Claude does the *opposite*. It actually leans slightly toward the first-person version. Same input, totally inverted behaviour. This is the part of GEO nobody tells you — the engines do not agree with each other.

[B-ROLL: Four terminal windows tiled, results diverging]

By the end, 64 probes logged, no model version changes mid-run. Let's add it up.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate bar chart — A: 15.6%, B: 50.0%]

Pooled across all four engines — the primary endpoint. First-person brand voice: 15.6% citation rate. Third-party attribution: 50%. That's plus 34.4 percentage points. The z-test gives p equals 0.0034 — statistically significant.

[ON SCREEN: "Primary: +34.4pp · p=0.0034 ✓"]

So the headline holds: reframing claims as third-party attributions tripled the pooled citation rate. But the per-engine breakdown is where it gets interesting.

[ON SCREEN: Four-panel grid of bar charts per engine]

OpenAI: zero percent to one hundred percent. A perfect flip. p equals 0.0001.

Gemini: 12.5% to 62.5%. Plus 50 points, p equals 0.039.

Perplexity: basically flat — zero to 12.5%. Not significant. p of 0.30.

And Claude: it went the *wrong way*. 50% down to 25%. Also not significant, but the direction is reversed.

[ON SCREEN: "2 of 4 engines: significant lift · 1 flat · 1 reversed"]

So the effect is real and large — but it's *not universal*. It's driven mostly by OpenAI and Gemini. If your traffic comes from Perplexity or Claude, third-party framing might do nothing, or even backfire.

[ON SCREEN: Multiple-comparisons note — "Bonferroni α = 0.0125"]

And one statistical caveat: I ran four per-engine tests alongside the main one. After correcting for multiple comparisons, the bar moves to 0.0125. OpenAI clears it easily. Gemini at 0.039 does *not* — so treat Gemini as exploratory, not confirmed.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this yet"]
[B-ROLL: Gwylym leaning in, serious]

Here's where I tell you why to be skeptical — because that's the difference between a scientist and a hype merchant.

[ON SCREEN: "Threat 1 — n=2 per cell"]

One: the sample is tiny. Two trials per variant per engine. That's why OpenAI shows a clean zero-to-hundred — with n that small, you get extreme, fragile numbers. This is a signal worth chasing, not a settled fact.

[ON SCREEN: "Threat 2 — collected in <1 day"]

Two: every probe ran inside a single day — June 17th, 2026. That's a snapshot. Model behaviour drifts week to week. I want at least ten days of coverage before I'd stake real money on this.

[ON SCREEN: "Threat 3 — fast-mode, in-context only"]

Three: this is fast-mode. I'm feeding the content directly into context and testing retrieval *preference*. That's different from a live-mode test, where the model has to find your content in its actual index. The numbers here measure preference, not real-world discoverability.

[ON SCREEN: "Threat 4 — model drift" with green tick "none detected"]

The one bit of good news: no model version changed mid-run. Same engine builds throughout. So at least the snapshot is internally consistent.

[ON SCREEN: "Verdict: strong preliminary signal — not yet confirmed"]

Bottom line: promising, directional, worth a bigger run. Not a law of nature.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[B-ROLL: Gwylym to camera, calm]

So what do you actually do with this? If your buyers ask AI about your product, and those answers come from ChatGPT or Gemini, consider sourcing your claims to third parties — "according to independent testing," "analysts reported" — instead of "we found." Same facts, neutral voice. On those two engines it tripled citation here.

[ON SCREEN: "But: test Perplexity & Claude yourself"]

But do *not* assume it works everywhere. On Claude it slightly backfired. The real lesson of this channel, over and over: the engines disagree, so you have to measure your own mix — don't copy a blog post that only tested one.

[ON SCREEN: L8EntSpace logo + URL]

And if you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

Raw data and reproduction steps are in the pinned comment. Run it yourself. Tell me if Claude flips for you too. See you next experiment.

[ON SCREEN: "Subscribe — one controlled GEO test every week"]
