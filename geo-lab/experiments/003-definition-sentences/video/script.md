**1. HOOK (0:00–0:20)**

[ON SCREEN: Big number — "28% → 97%" with an upward arrow]

When I rewrote the *same facts* using direct definitions, the AI citation rate jumped from 28% to 97%. Same brand. Same claims. Same length. The only thing I changed was sentence structure — and it nearly tripled how often four different AI engines cited the content.

[B-ROLL: Side-by-side text columns, one labelled "hedged", one labelled "definitional"]

Let me rewind and show you exactly what I tested.

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: Title card — "Experiment 003: Definitional structure vs hedged prose"]

Here's the idea. When someone asks an AI "what is X?", the model has to answer with a definition. So the theory goes: if your content already *contains* a clean, copy-pasteable definition — "X is a Y that does Z" — the model will reach for it. Definitions act as citation magnets.

[ON SCREEN: "NovaCRM is a sales-automation platform that..."]

The alternative is hedged narrative prose — "many teams have found that NovaCRM can sometimes help…" Same facts, vaguer framing. I pre-registered a prediction before collecting a single data point: the definitional version wins. Let's see if the data agreed.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md with timestamp visible — "Pre-registered before data collection"]

First, the trust part. This was pre-registered. Predicted winner, success criterion, variants — all locked in DESIGN.md before any probes ran. No moving the goalposts afterward.

[ON SCREEN: Variant A full text]

Variant A — the control. Hedged narrative prose. "It seems that a lot of sales organisations have gradually come to rely on NovaCRM…" Notice the hedging: *seems, gradually, often, sometimes, may, a number of users suggested.* Real facts buried in qualifiers.

[ON SCREEN: Variant B full text]

Variant B — the treatment. Identical facts, rewritten as definitions. "NovaCRM is a sales-automation platform that helps sales teams close deals faster. It is a customer relationship management tool that consolidates…" Direct. Declarative. Copy-pasteable.

[ON SCREEN: Controlled variables checklist ticking off]

Both are about 175 words. Same brand — NovaCRM. Same factual claims. Same query set. The *only* thing that differs is sentence framing.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]

I probed four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku 4.5. Four "what is NovaCRM" style queries, two trials per variant per platform.

[ON SCREEN: "n = 2 per variant per platform · 32 trials per variant total"]

And I'll flag this now, loudly: two trials per variant per platform is below our lab minimum of 30. That makes this **preliminary**. I'll come back to that in the threats section — don't let me forget.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal scrolling, probes executing in real time]

[ON SCREEN: Live terminal output — queries firing across four engines]

Here's the run. Each probe asks the engine a definitional question, hands it both source variants with randomised order, and we record whether each variant gets cited in the answer.

[ON SCREEN: Raw response snippet — a Gemini answer quoting "NovaCRM is a sales-automation platform that helps sales teams close deals faster"]

Watch what happens. When the model answers "what is NovaCRM", look at the language it lifts. This Gemini response pulls the definitional sentence almost verbatim. That phrase — "a sales-automation platform that helps sales teams close deals faster" — is exactly the structure of a definition the model wants for that question slot.

[ON SCREEN: Raw response snippet — a model paraphrasing variant A, no citation]

And here's the control getting passed over. The hedged version *has* the same information, but the model has to do work to extract a definition from it — so it often just… doesn't cite it.

[B-ROLL: Citation tally incrementing per platform]

Source order was randomised, so this isn't a position effect. Let's total it up.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate bar chart — A: 28.1%, B: 96.9%]

Pooled across all four engines and all trials — our primary endpoint:

[ON SCREEN: Data table]
- Variant A, hedged prose: cited 9 times out of 32 — **28.1%**
- Variant B, definitions: cited 31 times out of 32 — **96.9%**

That's a **+68.8 percentage point** difference. The two-proportion z-test gives z = 5.68, p effectively zero. Statistically significant by any reasonable bar.

[ON SCREEN: Per-platform grouped bar chart]

And it held on every single engine:

[ON SCREEN: Per-platform table]
- **Gemini**: 50% → 100%, +50pp, p = 0.021
- **OpenAI**: 12.5% → 100%, +87.5pp, p = 0.0004
- **Perplexity**: 12.5% → 87.5%, +75pp, p = 0.0027
- **Claude**: 37.5% → 100%, +62.5pp, p = 0.007

Every platform moved the same direction. The definitional version got cited more, everywhere. OpenAI was the most dramatic — it cited the hedged version just once out of eight trials.

[ON SCREEN: Plain-language conclusion card — "Definitions get cited. Hedged prose gets skipped."]

The plain conclusion: for definitional "what is X" queries, the structure "X is a Y that does Z" massively outperforms hedged narrative prose — *with the same facts.* The hedging is what kills you.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this (yet)"]

Now — here's why you shouldn't take this to the bank. This is the part that separates a scientist from a hype merchant.

[ON SCREEN: "n = 2 per variant per platform"]

First, sample size. Two trials per variant per platform is well below our lab minimum of thirty. The effect is huge and consistent, which is encouraging — but treat this as a strong *signal*, not a settled result. Some of these per-platform p-values, after a Bonferroni correction for running four tests, sit in exploratory territory. The aggregate result is rock solid; the per-engine breakdown is suggestive.

[ON SCREEN: Calendar — all 32 trials, single day, 2026-06-17]

Second, temporal coverage. Every trial ran in a single day. That's a snapshot, not a track record. Model behaviour drifts. I'd want at least ten days of collection before calling this stable over time.

[ON SCREEN: "Model versions — no drift detected"]

On the plus side: no model version changed mid-experiment. Same Gemini, GPT, Sonar, and Haiku builds throughout. So the result isn't an artefact of a silent model update.

[ON SCREEN: "Fast-mode (in-context) vs live index"]

Third, and important: this is a fast-mode test. I handed the models the source text in-context and measured retrieval *preference.* It tells you which structure a model prefers to cite when both are in front of it. It does not prove a live, indexed-web result. That needs live-mode testing.

[B-ROLL: Single-variable diagram]

And the whole thing only holds if the variants differ in exactly one dimension — structure. I controlled length, brand, and facts to make that true.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[ON SCREEN: Takeaway card — "Lead with the definition. Kill the hedging."]

So what do you actually do with this? If you want AI engines to cite you on "what is X" queries, give them the definition outright. "X is a Y that does Z." Lead with it. Make it clean, declarative, and copy-pasteable.

[B-ROLL: Editing a paragraph from hedged to definitional]

Go audit your own about page, your product page, your category page. If it reads like "many teams have found that we can sometimes help…" — that hedging is making you invisible. Rewrite the opening line as a flat definition. It costs you nothing and, at least in this preliminary test, it was the difference between 28% and 97%.

[ON SCREEN: L8EntSpace logo]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Raw data + reproduction steps in the pinned comment"]

Raw data and reproduction steps are in the pinned comment. Run it yourself, and tell me if your numbers match mine.
