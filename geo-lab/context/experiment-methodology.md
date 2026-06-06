# Experiment Methodology

The lab runs A/B experiments on LLM citation behaviour. This file defines the
method so every experiment is comparable and defensible on camera.

## Two modes

### Fast mode — in-context citation preference (default)
Give the model a query plus a small set of candidate sources (one per variant,
order randomised), ask it to answer and cite its sources, and record which
variant it cites. Repeat across many trials and across all four platforms.

- **Pro:** results today, cheap, high statistical power, fully reproducible.
- **Con:** measures retrieval-time preference, not long-term training weight.
- **Use for:** the weekly cadence of YouTube experiments.

Controls that matter:
- **Randomise source order** every trial (counter position bias).
- **Vary the query** within a topic (3–5 paraphrases) so you're not overfitting
  one phrasing.
- **Hold temperature fixed** per run; optionally repeat at 0.2 and 0.7 to show
  robustness.
- **Blind the brand** when testing a *structural* lever (use a neutral label) so
  you measure the lever, not brand familiarity.

### Live mode — indexed citation (flagship only)
Actually publish variant content on real, comparable URLs, then probe live
ungrounded citations over 2–6 weeks. Higher external validity, slow, more
confounds (backlinks, domain authority). Reserve for milestone videos.

## The statistic

Each variant yields a citation rate = (# cited) / (# trials). Compare two
variants with a **two-proportion z-test**; report:

- the two rates and the absolute difference (effect size),
- the **p-value** (significant if p < 0.05),
- the 95% confidence interval on the difference,
- n per variant.

`scripts/analyze.mjs` does this for you. For >2 variants, it runs pairwise tests
against the control and notes that multiple comparisons inflate false positives
(mention this on camera — it builds trust).

### Sample size
Aim for **n ≥ 30 trials per variant per platform**. With 4 platforms × 4 query
paraphrases × 2 trials = 32. Underpowered runs can suggest a direction but must
be labelled "preliminary" in the video.

## Pre-registration (non-negotiable)
Before any probe runs, `DESIGN.md` must state:
- the single variable being changed,
- the exact variants,
- the citation metric,
- the planned n,
- the predicted direction.

This is what separates a credible GEO channel from hand-wavy "AI SEO tips."

## Confounds checklist
- [ ] Variants differ in **one** factor only (diff them and confirm).
- [ ] Equal length (or length itself is the variable — declare it).
- [ ] Source order randomised.
- [ ] Same query set across variants.
- [ ] Brand blinded if testing structure.
- [ ] Same platform/model versions across variants (log model IDs).

## Output contract
Every experiment ends with `FINDING.md` containing: hypothesis, method, n,
rates, p-value, CI, plain-English conclusion, and an honest "threats to validity"
section. The video is built from this file — never beyond it.
