**1. HOOK (0:00–0:20)**

[ON SCREEN: Big number — "12.5% → 56.3%" with an upward arrow]

Swapping out vague phrases for named brands more than quadrupled how often AI engines cited the exact same content. Same facts. Same length. The only difference: named entities instead of generic ones.

[B-ROLL: Split screen of Variant A and B scrolling side by side]

That's a 43.8 percentage point jump on the pooled result — and the p-value was 0.0002. Let me rewind and show you exactly how I got there, including why you shouldn't fully trust it yet.

[ON SCREEN: Channel title card — "GEO A/B — Experiment 004"]

**2. HYPOTHESIS (0:20–1:00)**

[B-ROLL: Gwylym at desk, geo-principles.md open in background]

Here's the idea I wanted to test. When you write content you hope an AI will cite, you have a choice. You can say "popular email tools" — or you can say "Gmail, Outlook, and Slack." You can say "recognised security standards" — or you can say "SOC 2 Type II and GDPR."

[ON SCREEN: Two phrases stacked — "popular email tools" vs "Gmail, Outlook, Slack"]

The hypothesis: naming concrete entities — real products, people, standards, organisations — makes content easier for retrieval systems to grasp and match. Named entities act as anchors. They overlap with the tokens in a user's query and with the model's own knowledge graph.

[ON SCREEN: Hypothesis text — "3+ named entities per 100 words → higher citation rate"]

My prediction going in was modest: a 10 to 20 point lift, strongest on grounded engines like Perplexity and Gemini. Let's see if that held up.

**3. METHOD (1:00–3:00)**

[ON SCREEN: DESIGN.md file with timestamp visible — pre-registration proof]

First, the trust-builder. This design was written down before the run. Here's the DESIGN.md, pre-registered. Hypothesis, variables, success criterion — all committed in advance so I can't move the goalposts after seeing the data.

[ON SCREEN: Variant A full text]

Two variants. Variant A — the control. It describes a fictional CRM called NovaCRM using generic, unnamed references. "The email tools most sales teams already use." "Our founder." "Recognised security and privacy standards." Roughly zero to one named entity per hundred words.

[ON SCREEN: Variant B full text, named entities highlighted in accent colour]

Variant B — the treatment. Identical claims, identical length, but every reference is now a named concrete entity. Gmail. Outlook. Slack. Salesforce. SOC 2 Type II. GDPR. Founder Mara Whitfield. Tableau. Zendesk. Three-plus named entities per hundred words.

[B-ROLL: Side-by-side diff highlighting only the entity swaps]

Crucially, NovaCRM itself appears in both. The brand is held constant. The only thing that changes is the density of the *surrounding* named entities. This is a structural test, not a brand-familiarity test.

[ON SCREEN: Four engine logos — Gemini, OpenAI, Perplexity, Claude]

I probed four engines: Gemini 2.5 Flash, GPT-4o-mini, Perplexity Sonar, and Claude Haiku 4.5. Four product-evaluation queries — things like "Which sales CRM connects with Slack and Salesforce and is SOC 2 compliant?"

[ON SCREEN: "n = 2 trials per variant per platform — flagged preliminary"]

Now, full honesty: this run is two trials per variant per platform. That's 32 trials per variant pooled. Our lab minimum is 30 per variant per platform. So treat this as preliminary — I'll come back to that hard in the threats section.

**4. THE RUN (3:00–5:00)**

[B-ROLL: Terminal window, probes executing line by line]

[ON SCREEN: Live terminal output scrolling — probe requests firing across four engines]

Here's the run executing. Each probe sends one query to one engine, with both NovaCRM passages available in the retrieval context, source order randomised so position can't bias the result. Then I check: did the engine cite the variant or not?

[ON SCREEN: Raw response from Claude — Variant B cited, generic Variant A ignored]

Watch this Claude response. Given the generic version, it just… doesn't ground to it. Given the named-entity version, it pulls in "SOC 2 Type II," "Salesforce," "Slack" — and cites NovaCRM directly. The named entities gave it something to grab onto.

[B-ROLL: Raw OpenAI response, more reluctant]

OpenAI was the stubborn one. It cited the control zero times out of eight — and even the treatment only twice. Different engines, very different appetites for grounding. Hold that thought.

[ON SCREEN: Progress bar completing — "64 trials complete"]

Sixty-four trials, all collected on the same day, same model versions throughout. Now the numbers.

**5. THE RESULT (5:00–8:00)**

[ON SCREEN: Aggregate table — A: 4/32 = 12.5%, B: 18/32 = 56.3%]

The headline, pooled across all four engines. Variant A — the generic version — got cited 12.5% of the time. Variant B — the named-entity version — 56.3%.

[ON SCREEN: Bar chart, two bars, big gap, "+43.8pp" label]

That's a 43.8 percentage point lift. Z of 3.685, p of 0.0002. On the primary pooled endpoint, that's significant — and well beyond my predicted 10 to 20 point effect.

[ON SCREEN: Per-platform breakdown table]

But the per-platform story is where it gets interesting. Let me break it down.

[ON SCREEN: Claude row highlighted — 0% → 75%, p=0.0019]

Claude: zero to 75%. A 75-point swing, p of 0.0019. The biggest effect in the experiment.

[ON SCREEN: Gemini row — 25% → 75%, p=0.0455]

Gemini: 25% to 75%. Fifty points, p of 0.0455 — just under the line.

[ON SCREEN: Perplexity row — 25% → 50%, p=0.30 / OpenAI row — 0% → 25%, p=0.13]

And then Perplexity and OpenAI. Both moved in the right direction — Perplexity 25 to 50, OpenAI zero to 25 — but neither reached significance on its own. P-values of 0.30 and 0.13.

[ON SCREEN: Summary — "Significant: aggregate, Gemini, Claude. Not significant: OpenAI, Perplexity"]

So the plain conclusion: pooled, the effect is strong and clear. Per engine, it's confirmed on Gemini and Claude, and merely suggestive on Perplexity and OpenAI. Interestingly, the opposite of my prediction — I guessed the grounded engines would lead, and instead Claude led hardest.

**6. THREATS TO VALIDITY (8:00–9:30)**

[ON SCREEN: "Why you shouldn't fully trust this — yet"]

Now the part that separates a scientist from a hype merchant. Here's why you shouldn't fully trust this result.

[ON SCREEN: "Threat 1 — Temporal coverage: 1 day"]

First, temporal coverage. All 64 trials were collected in a single day. That's a snapshot, not a movie. Model behaviour drifts — what's true on June 18th may not hold in July. We target at least ten days of collection for robust results. This had one. Big caveat.

[ON SCREEN: "Threat 2 — n=2 per variant per platform"]

Second, sample size. Two trials per variant per platform. Pooled it's 32, which is workable, but per-engine those significance calls rest on tiny numbers. A single flipped trial can swing a p-value. This is preliminary, full stop.

[ON SCREEN: "Threat 3 — Multiple comparisons → Bonferroni α = 0.0125"]

Third, multiple comparisons. I ran four per-platform tests alongside the primary pooled one. Run enough tests and one will look significant by chance. With a Bonferroni correction, the per-platform bar becomes 0.0125 — and Gemini's 0.0455 doesn't clear it. So strictly, only Claude and the aggregate survive correction. The Gemini result is exploratory.

[ON SCREEN: "Threat 4 — Fast-mode, not live index"]

Fourth, this is a fast-mode test. I'm testing in-context retrieval preference — which passage the model grounds to when both are in front of it. That's not the same as live web retrieval from a real index. External validity needs a live-mode follow-up.

[ON SCREEN: "Stable: same model versions throughout"]

One thing in our favour: no model drift. Same versions across every batch. So the result isn't an artefact of a mid-run model update.

**7. WHAT IT MEANS FOR YOU (9:30–END)**

[B-ROLL: Gwylym to camera]

So what do you do with this? Even with the caveats, the direction is consistent across all four engines and strong where it's measurable. The takeaway is cheap to apply: stop writing "popular tools" and "industry standards." Name them. Gmail, not "email." SOC 2, not "security standards." Named people, named products, named organisations.

[ON SCREEN: "Generic → Named. Same facts, more anchors."]

It costs you nothing — same facts, same length — and it gives retrieval systems concrete anchors to match your content against. Of every lever I've tested, this is one of the highest-leverage, lowest-effort edits you can make today. Just remember it's preliminary until the live-mode, longer-window rerun.

[ON SCREEN: L8EntSpace logo]

If you want to run this across your own brand at scale — probing all four engines, tracking share-of-voice over time — that's exactly what we built L8EntSpace for. Link below.

[ON SCREEN: "Raw data + reproduction steps in pinned comment"]

Raw data and reproduction steps are pinned. Run it yourself. See you in the next experiment.
