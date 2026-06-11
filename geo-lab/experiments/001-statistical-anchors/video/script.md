**1. HOOK (0:00–0:20)**

[ON SCREEN: Big text — "100% vs 25%" with a Claude logo]
On Claude, swapping one vague phrase for one specific number took citation rate from 25% all the way to 100%. Every single trial. But before you go rewrite every opening line you've ever written — that result did *not* hold everywhere. Let me show you what actually happened across four engines.

[B-ROLL: Fast montage of four engine logos — Gemini, OpenAI, Perplexity, Claude — flashing past.]

**2. HYPOTHESIS (0:20–1:00)**

[ON SCREEN: The hypothesis text, highlighted]
Here's the question. There's a popular GEO claim that large language models prefer to cite sentences with specific, verifiable numbers — that a precise statistic reads as more "citable" than vague language. So I tested exactly that.

[B-ROLL: Two text snippets side by side.]
Same product page about a fictional CRM called NovaCRM. Same length, same structure, same claims. The *only* difference is the opening sentence. Variant A says the product "improved deal-closing speed significantly." Variant B says it "cut deal-closing time 43%." Vague qualifier versus precise number. That's the entire variable.

[ON SCREEN: "Independent variable: specific statistic vs vague qualifier"]
If the number-anchor theory is right, B should get cited more. I pre-registered a predicted lift of 10 to 20 percentage points.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file with the run timestamp visible — 2026-06-11]
Trust first. Here's the design doc, written and committed *before* any data was collected. Predicted direction, success criterion, controlled variables — all locked in advance. That matters, and I'll come back to why at the end.

[B-ROLL: Scroll through the variant files A.md and B.md.]
The setup: I held the brand constant. NovaCRM is the subject of both variants, so any difference in citation can't be brand familiarity — it has to be the statistic. I controlled length to within ten percent, kept the topic identical, randomised source order, and fixed temperature.

[ON SCREEN: Four query paraphrases listed]
I asked four product-performance questions — things like "How much faster can NovaCRM help sales teams close deals?" and "Does NovaCRM actually speed up the sales cycle?" Each query went to four engines: Gemini, OpenAI, Perplexity, and Claude.

[ON SCREEN: Big honest disclaimer card — "n = 2 trials per variant per platform. Lab minimum is 30. PRELIMINARY."]
And here's the most important caveat, up front, not buried: this run used just two trials per variant per platform. Our lab minimum is thirty. So treat everything you're about to see as *preliminary* and *exploratory*. I'm showing it because the pattern is interesting and worth a bigger run — not because it's settled.

[ON SCREEN: Metric definition — "Citation rate = proportion of trials where the variant is cited"]
The metric is simple: citation rate. Out of all the trials, how often did the engine actually cite our page?

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal window, probes firing one by one, green checkmarks appearing.]
Watching the probes run is the fun part. Each one sends the query, retrieves candidate sources, and we record whether our variant got cited in the answer.

[ON SCREEN: Raw response excerpt from Claude citing the "43%" line]
And almost immediately you see something. When Claude cites Variant B, it pulls the exact phrase — "cut deal-closing time 43%." The number becomes the quotable hook. The model grabs the thing it can attribute cleanly.

[B-ROLL: Split screen — Variant A response with no citation, Variant B with a citation badge.]
Meanwhile Variant A — the vague version — keeps getting passed over on some engines entirely. On both Gemini and OpenAI, the control got cited zero times across all sixteen trials. Zero.

[ON SCREEN: Running tally counter incrementing]
Perplexity behaved differently — it cited the control plenty. So already, before we even tally the numbers, you can feel that this is not one clean story. It's four different stories.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Four-panel bar chart, one per engine, A vs B]
Let's go engine by engine.

[ON SCREEN: Claude panel highlighted — 25% → 100%]
**Claude** is the headline. Control: 25%. Treatment: 100% — cited in every single trial. That's a 75 percentage-point jump, p-value effectively zero. Strongly significant, even at this tiny sample.

[ON SCREEN: Gemini panel — 0% → 31.3%]
**Gemini**: control got cited zero percent of the time, treatment 31.3%. A 31-point lift, p equals 0.0149. Also significant.

[ON SCREEN: OpenAI panel — 0% → 18.8%, marked "not significant"]
**OpenAI**: same direction — zero to 18.8% — but p equals 0.069. That's *not* significant. Promising, but it could be noise at n equals two.

[ON SCREEN: Perplexity panel — 50% → 68.8%, marked "not significant"]
**Perplexity**: 50% up to 68.8%. Right direction again, but p equals 0.28. Nowhere near significant. And notice Perplexity already cites the vague version half the time — it's the most generous citer of the four.

[ON SCREEN: Aggregate table — A: 18.8% (12/64), B: 54.7% (35/64)]
Pool everything together and the picture is striking: the vague control got cited 18.8% of the time, the specific-number version 54.7%. In four out of four engines, the direction favoured the number. Two of those four reached statistical significance.

[ON SCREEN: Plain-language verdict card]
So the honest conclusion: the specific-statistic lever shows a real, consistent directional effect — and on Claude and Gemini specifically, it's significant. But it is *not* a universal switch. OpenAI and Perplexity didn't reach significance in this run. Direction yes; proof everywhere, no.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: Threats checklist]
Now the part that keeps us honest.

[ON SCREEN: "n = 2 per variant — below minimum of 30"]
Number one, and biggest: the sample. Two trials per variant per platform is well below our thirty-trial floor. The Claude 100% is eye-catching, but a perfect score on sixteen pooled observations can flip with more data. This needs a full run before anyone bets a content strategy on it.

[ON SCREEN: "Multiple comparisons"]
Two, multiple comparisons. I ran significance tests on several engines at once. Running more tests inflates the chance one comes back significant by luck. Pre-registration helps, but treat these as exploratory.

[ON SCREEN: "In-context retrieval, not training weight"]
Three, this is a fast-mode test of in-context retrieval preference. It measures what the model does when our document is in front of it — not whether it's baked into the model's training. A live-index test would be a stronger claim.

[ON SCREEN: "Model versioning"]
And four, these are model snapshots from June 2026. Updates change behaviour. This is a moment-in-time reading, not a law of nature.

**7. WHAT IT MEANS FOR YOU (9:30–end)**

[ON SCREEN: Takeaway card — "Lead with a specific number. Low cost, directional upside."]
So what do you actually do with this? The practical takeaway is low-risk and cheap: where you have a real, defensible statistic, put it in your opening sentence instead of a vague qualifier. "Cut deal-closing time 43%" beats "improved significantly" — in four out of four engines, directionally, and significantly on two of them. It costs nothing to write a precise sentence. Just make sure the number is *true* — don't fabricate stats to game retrieval.

[B-ROLL: Gwylym to camera.]
What I would *not* do is treat that Claude 100% as gospel. It's a flag for a bigger experiment, not a finished result. That's the difference between data and hype.

[ON SCREEN: Soft CTA card with L8EntSpace logo]
If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Subscribe — one controlled GEO experiment every week."]
Raw data and reproduction steps are in the pinned comment. Subscribe if you want the next experiment — I'll be re-running this one at full sample size soon.
