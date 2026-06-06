Produce the full YouTube video package for a completed experiment.

1. Identify the experiment folder from the args or ask the user.
2. Confirm FINDING.md exists (error if not — run /analyze-results first).
3. Invoke the `video-producer` agent with the path to FINDING.md.
4. After the agent writes the files, show the user:
   - The top 2 title options
   - The first paragraph of the script
   - The thumbnail concept
5. Tell the user where the files are: `experiments/NNN-slug/video/`
