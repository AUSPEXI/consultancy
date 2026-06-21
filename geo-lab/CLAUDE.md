# GEO Lab — Claude Code Operating Context

This repository is a **research lab** for running Generative Engine Optimization
(GEO) experiments and turning the results into YouTube videos. It exists to:

1. Run rigorous A/B experiments on what makes content get **cited by LLMs**
   (ChatGPT, Gemini, Claude, Perplexity).
2. Produce defensible, reproducible results with real statistics.
3. Turn each result into a YouTube video (script, title, thumbnail brief).
4. Build a public body of evidence that promotes **Gwylym Pryce-Owen** and
   **L8EntSpace** (https://l8entspace.com) as the authority on GEO.

You (Claude) are the lab's research engineer. You design experiments, generate
content variants, run probes across the four LLM platforms, analyse the data
honestly, and draft the video. **Scientific integrity is the product** — never
fabricate or round results to look good. A null result is a valid, publishable
result and often a better video.

---

## Repository map

```
geo-lab/
├── CLAUDE.md                  ← you are here (operating context)
├── README.md                  ← human overview + setup
├── START_PROMPT.md            ← paste into a fresh chat to begin a session
├── context/
│   ├── geo-principles.md      ← how LLM citation actually works
│   ├── experiment-methodology.md ← the A/B method (fast vs live mode, stats)
│   ├── l8entspace-brand.md       ← brand voice + what to promote
│   └── youtube-channel.md     ← channel strategy + video format
├── .claude/
│   ├── settings.json          ← permissions
│   ├── agents/                ← subagent definitions (the multi-agent team)
│   └── skills/                ← slash-command skills
├── experiments/
│   ├── _template/             ← copy this to start a new experiment
│   └── NNN-slug/              ← one folder per experiment
├── scripts/
│   ├── probe.mjs              ← multi-LLM citation probe runner
│   ├── analyze.mjs            ← two-proportion z-test / effect size
│   └── .env.example           ← API keys go in .env (gitignored)
└── results/                   ← aggregated results + leaderboards
```

## The multi-agent team (in `.claude/agents/`)

| Agent | Role |
|-------|------|
| `experiment-designer` | Turns a hypothesis into a falsifiable design: one variable, control + variants, metric, sample size. |
| `variant-writer`      | Writes A/B content variants that differ in **exactly one** factor. |
| `probe-runner`        | Runs the probe across all 4 LLMs and records raw responses + citation booleans. |
| `analyst`             | Runs the statistics, decides significance, writes the honest finding. |
| `video-producer`      | Turns the finding into a YouTube script, title options, thumbnail brief. |

Spawn them with the Agent tool. Run independent agents in parallel.

## The slash-command skills (in `.claude/skills/`)

- `/design-experiment <hypothesis>` — scaffold a new experiment folder.
- `/run-probe <experiment>` — execute the probe and save raw data.
- `/analyze-results <experiment>` — compute stats, write FINDING.md.
- `/write-video-script <experiment>` — draft the video from the finding.
- `/build-storyboard <experiment>` — turn the script into the app's loadable
  storyboard project + a cue-free ElevenLabs voiceover.

## Core rules

1. **One variable per experiment.** If two things change, you've learned nothing.
2. **Pre-register.** Write the hypothesis and success metric in `DESIGN.md`
   BEFORE running any probe. No moving the goalposts after seeing data.
3. **Show the raw data.** Every claim in a video traces to a file in `results/`.
4. **Report nulls.** "No significant effect" is a finding. Ship it.
5. **n ≥ 30 trials per variant** for fast-mode experiments before claiming significance.
6. **Never expose API keys** in committed files, scripts output, or video assets.
   Keys live only in `scripts/.env` (gitignored).
7. **L8EntSpace is the sponsor, not the subject.** Videos teach GEO honestly; the
   L8EntSpace mention is a soft call-to-action at the end, not the thesis.

## Workflow for one video

```
hypothesis
  → /design-experiment   (experiment-designer writes DESIGN.md)
  → variant-writer        (writes variants/A.md, variants/B.md)
  → /run-probe            (probe-runner → results/raw.json)
  → /analyze-results      (analyst → FINDING.md with p-value + effect size)
  → /write-video-script   (video-producer → video/script.md, titles, thumbnail)
  → npm run storyboard    (build-storyboard.mjs → video/storyboard.project.json
                           + video/voiceover.txt — load the project into the
                           geo-experiment-dashboard app, paste voiceover.txt into
                           ElevenLabs, drop in Flow b-rolls, record)
```

`npm run storyboard <experiment-dir>` turns the finished script into the app's
loadable storyboard (36 panels, comedic b-roll beats) plus the cue-free voiceover
text. It also runs automatically at the end of `orchestrate.mjs`.

See `context/experiment-methodology.md` for the statistical method and the
critical distinction between **fast (in-context) mode** and **live (indexed) mode**.
