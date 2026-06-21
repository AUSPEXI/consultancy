# GEO Case Study — Measurement Protocol & Design-Partner Kit

**Purpose:** produce **one** airtight, publishable before/after that proves GEO
work moves real outcomes (citation → traffic → leads). This is the single
highest-leverage move for getting noticed — one credible case study beats a
quarter of features.

**Guiding principle:** your brand is *rigor and honesty*. A flimsy case study
hurts you more than no case study. This protocol is built so a hostile reviewer
(a rival trying to discredit you) can't take it apart.

---

## 0. The core problem, and how we beat it (read first)

A single-client before/after is, by default, **weak causal evidence**: no control
group, and confounded by time (seasonality, the client's other marketing, model
updates). Most "GEO case studies" are exactly this, and they're dismissible.

We make ours credible with three things the typical case study lacks:

1. **Pre-registration** — commit the plan, queries, and success metric to git
   *before* touching anything. Same trick the lab uses with `DESIGN.md`: the
   timestamp proves you didn't move the goalposts.
2. **A within-client control** — optimise one set of pages, deliberately leave a
   matched set **untouched (held-out)**. If the optimised set rises and the
   held-out set doesn't, you've ruled out "the whole site just had a good month."
   This is the single biggest credibility upgrade available to an n=1 study.
3. **A competitor benchmark** — track 2–3 rivals' citation share over the *same*
   window (you already have `probeBrandRate`). Client up + rivals flat = stronger
   still.

If all three line up — optimised pages rise, held-out pages flat, rivals flat —
the "it was just time/luck" objection is dead. That's the artifact.

---

## 1. Pick the right design partner

**Ideal partner:**
- A real business with a clear brand name (not a generic word — keeps
  `checkCitation` clean) and an existing website you can edit or advise on.
- Operates in a niche where people genuinely ask AI assistants for
  recommendations (B2B SaaS, professional services, specialist e-commerce).
- Has **enough pages** that you can optimise some and hold others out.
- Willing to let you **publish** the result (named is best; anonymised
  "a UK B2B SaaS" is acceptable for #1).

**The offer (what makes them say yes):** a free/near-free GEO audit + done-for-you
implementation of validated levers, in exchange for permission to publish the
before/after. They get a head start in AI search and free expert work; you get
the proof artifact. Frame it as a partnership, not a favour.

**Recruit 2 partners, not 1** — one will stall or change something mid-study.

---

## 2. Pre-registration template (fill + `git commit` BEFORE any change)

```
# Case Study Pre-Registration — <client> — <date>

Hypothesis: Applying <levers> to <optimised pages> will increase citation rate
on grounded engines, with no change to the held-out pages or to competitors.

Query panel (frozen): <N ≥ 20 real buyer questions, intent-categorised>
  - informational: ...
  - comparison ("X vs Y"): ...
  - recommendation ("best <thing> for <use>"): ...

Engines + pathways: gemini, chatgpt, claude, grok (parametric + grounded),
  perplexity, google_aio (grounded), deepseek (parametric). [Label every result.]

Levers to apply (ONLY supported/verified findings — list effect size + source):
  - e.g. "lead with a specific statistic" — +Xpp, p=…, [experiment NNN]
  (Do NOT apply preliminary/low-power levers and then claim them.)

Optimised URLs: <list>
Held-out control URLs (matched topic/authority, deliberately untouched): <list>

Primary metric: citation rate on optimised URLs' queries (grounded), Wilson CI.
Secondary: AI-referral sessions to optimised pages (GA4).
Tertiary: conversions/leads from those sessions (GA4 events).

Success criterion (pre-committed): optimised citation rate rises ≥ <X>pp with a
CI excluding 0, while held-out + competitors move < half that.

Analysis plan: weekly snapshots; report time series + CIs; note any model drift.
Anticipated caveats: n=1, observational, zero-click attribution gap, decay.
```

Commit it. The git timestamp is your integrity proof — it's worth more than the
chart.

---

## 3. The metrics ladder (citation → traffic → leads)

| Tier | Metric | Source in your stack |
|---|---|---|
| **Primary** | Citation rate per engine + share-of-voice vs competitors | `runCitationProbe` (grounded mode), `probeBrandRate` for rivals; Wilson CI; **≥3 passes/query** |
| **Secondary** | AI-referral sessions to optimised pages | GA4: sessions where referrer ∈ AI-engine domains, segmented by landing page |
| **Tertiary** | Conversions / leads from those sessions | GA4 conversion events on the AI-referral segment |

**AI-referral domains for the GA4 segment** (referrer / source contains):
`chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`,
`copilot.microsoft.com`, `claude.ai`, `grok.com` / `x.com`. (Maintain this list —
it grows.) Note honestly: many AI answers are **zero-click**, so citation lift
will always exceed measurable referral lift. Report both; explain the gap rather
than hide it.

---

## 4. Timeline (why multiple snapshots, not two points)

```
Weeks -3..-1   BASELINE   3 weekly snapshots (establishes variance — a single
                          "before" point can be a fluke)
Week 0         INTERVENE  Apply levers. Log EXACTLY what changed per URL + date.
Weeks +1..+6   POST       6 weekly snapshots
```

The credible shape is a **flat baseline line, then a step-change** — not two bars
with no error bars. A flat baseline is itself evidence the metric was stable
before you touched it.

---

## 5. Instrumentation checklist (your actual stack)

- [ ] `client-panel.json` — the frozen query set + optimised/held-out URL lists.
- [ ] Baseline: run `runCitationProbe` for the client across all engines, **≥3
      passes**, grounded where available; store the `ProbeAggregate` as
      `snapshots/<date>.json`.
- [ ] Each snapshot: also run `probeBrandRate` for 2–3 competitors over the same
      panel.
- [ ] GA4: create the **AI-referral segment**, an **optimised-pages** content
      group, a **held-out-pages** content group, and confirm a **conversion
      event** fires.
- [ ] Pathway labelling: until WS1 ships, only Perplexity + `google_aio` are truly
      grounded — label the other five **parametric** in the writeup so you never
      imply you measured retrieval when you measured recall.
- [ ] Drift log: capture `ENGINE_MODEL_VERSIONS` at each snapshot; flag any change.

---

## 6. Analysis & honest reporting

- **Effect** = post citation rate − baseline mean, with Wilson CIs. Show the
  **time series**, not just two bars.
- **Within-client control delta** = optimised change − held-out change. This is
  the headline credibility number.
- **Competitor benchmark** over the same window.
- **Drift note** if any engine changed version mid-study.
- **Caveats section, stated plainly** (this *is* the brand): n=1 client,
  observational not randomised, zero-click attribution gap, findings decay.

**Published claim format (honest, specific, caveated):**
> Across `<client>`'s `N` target queries, grounded citation rate rose from
> `X%` (95% CI a–b) to `Y%` (95% CI c–d) over `<weeks>` weeks. Matched held-out
> pages moved `<Z>pp`; the two tracked competitors moved `<W>pp`. AI-referral
> sessions to the optimised pages rose `<V>%`. Observational, single client —
> full method, raw snapshots, and caveats below.

Publishing the **raw `snapshots/*.json`** alongside the claim is the radical-
transparency move no competitor will match.

---

## 7. Design-partner outreach (send-ready)

> **Subject:** Free AI-search audit for `<company>` (I publish the results)
>
> Hi `<name>` — I run a small GEO lab measuring how the big AI assistants
> (ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews) decide which brands
> to cite. I'd like to run a free audit of `<company>` across all of them, apply
> the changes my experiments show actually move citations, and measure the lift
> over ~8 weeks with real analytics.
>
> In return I'd like to publish the before/after as a case study (named, or
> anonymised — your call). You get expert GEO work and a head start in AI search
> for free; I get a documented result. Everything I claim is backed by the raw
> data, with confidence intervals and honest caveats — I don't do hype.
>
> 15 minutes this week to see if `<company>` is a fit?

Keep the honesty explicit — "I don't do hype, here's the raw data" is your
differentiator even in the cold email.

---

## 8. What I can build next (offer)

When you've got a partner, I can turn this protocol into running code:
- `case-study-probe.mjs` — runs the frozen panel on a schedule, snapshots the
  `ProbeAggregate` + competitor rates to `snapshots/<date>.json`, builds the time
  series.
- The GA4 AI-referral segment definitions + a small report generator that emits
  the published-claim block above from the snapshots.
- A one-page HTML/PDF case-study template wired to the snapshot data.

That makes the *second* and *third* case studies near-zero-effort — which is how
the authority flywheel actually compounds.
