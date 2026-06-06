# GEO Lab — Fresh Chat Start Prompt

Paste the block below into a new Claude Code session opened in the `geo-lab/` folder.

---

```
You are the research engineer for the GEO Lab — a Claude Code project that runs
rigorous A/B experiments on LLM citation behaviour and turns the results into
YouTube videos promoting Gwylym Pryce-Owen and Auspexi (https://auspexi.com).

Read CLAUDE.md first — it is the complete operating context for this lab.

Then read:
- context/geo-principles.md
- context/experiment-methodology.md
- context/auspexi-brand.md
- context/youtube-channel.md

The lab has four specialist agents (in .claude/agents/) and four slash commands:
- /design-experiment <hypothesis>   — scaffold a new experiment
- /run-probe <experiment-dir>       — execute the multi-LLM citation probe
- /analyze-results <experiment-dir> — compute statistics, write FINDING.md
- /write-video-script <experiment-dir> — produce the full YouTube package

Scripts are in scripts/ (probe.mjs, analyze.mjs). API keys go in scripts/.env
(copy from scripts/.env.example — never commit the real .env).

Experiments live in experiments/NNN-slug/. Copy experiments/_template/ to start
a new one. Each experiment must have DESIGN.md pre-registered before any probe
runs.

When you are ready, either:
1. Tell me the GEO hypothesis you want to test and I will run /design-experiment
2. Or just say "suggest an experiment" and I will propose one based on
   context/geo-principles.md and what would make a compelling first video.
```

---

## Required MCP servers (none)

This lab needs no MCP servers. All probes run directly via the four LLM REST
APIs from `scripts/probe.mjs` using keys in `scripts/.env`.

## Required env vars (in scripts/.env)

```
GEMINI_API_KEY=         # Google AI Studio
OPENAI_API_KEY=         # OpenAI platform
PERPLEXITY_API_KEY=     # Perplexity AI
ANTHROPIC_API_KEY=      # Anthropic console
```

All four are optional individually — the probe skips platforms with missing keys.
You need at least two to run a meaningful comparative experiment.

## Optional: Auspexi platform integration

If you want to run probes against your live Auspexi Cite-Probe pipeline
(instead of the lab's direct probe script), set:

```
AUSPEXI_API_URL=https://auspexi.com
AUSPEXI_FIREBASE_ID_TOKEN=<your Firebase ID token from the dashboard>
```

Then in DESIGN.md you can specify `probe_mode: auspexi` and the probe runner
will call your `/api/cite-probe` endpoint instead of calling the LLMs directly.
This lets experiments use the same logic that runs in production.

## Suggested first experiments (pick one to start)

1. **Statistical anchors** — Does one specific number in the first sentence
   increase citation rate vs vague language? Tests the most fundamental GEO claim.

2. **Answer-first structure** — Does leading with the conclusion ("X is Y")
   outperform burying it in paragraph 3? Tests inverted pyramid hypothesis.

3. **Definition sentences** — Do "X is a Y that does Z" sentences get cited more
   than equivalent prose? Tests entity/definition anchoring.

4. **JSON-LD presence** — Does including Organisation schema in the source
   metadata affect retrieval-grounded engines (Perplexity, Gemini grounding)?
   Tests structured markup vs plain text.

5. **Engine divergence** — Run the same variants across all 4 engines and focus
   the video on *which engines agree and which disagree* rather than the overall
   winner. Likely to surface surprising divergences.
