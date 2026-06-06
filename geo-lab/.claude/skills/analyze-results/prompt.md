Analyze citation probe results and write FINDING.md.

1. Identify the experiment folder from the args or ask the user.
2. Run: `node scripts/analyze.mjs <experiment-dir>`
3. Invoke the `analyst` agent with the path to FINDING.md and DESIGN.md.
4. Show the key result table and the plain-English conclusion to the user.
5. Prompt: "Run /write-video-script <experiment-dir> to produce the YouTube package."
