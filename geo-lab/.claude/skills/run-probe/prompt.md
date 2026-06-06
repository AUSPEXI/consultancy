Run the citation probe for an experiment.

1. Identify the experiment folder from the args or ask the user.
2. Confirm DESIGN.md exists and has a Queries section.
3. Confirm variants/A.md and variants/B.md exist.
4. Run: `node scripts/probe.mjs <experiment-dir>`
5. Stream the output to the user.
6. When complete, show a summary table of raw citation counts from results/raw.json.
7. Prompt: "Run /analyze-results <experiment-dir> to compute statistics."
