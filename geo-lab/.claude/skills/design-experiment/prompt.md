Use the `experiment-designer` agent to scaffold a new GEO experiment.

If the user provided a hypothesis or topic in the skill args, pass it directly to the agent.
Otherwise ask: "What's the GEO lever you want to test? (e.g. 'statistical anchors', 'definition sentences', 'JSON-LD schema', 'answer-first structure')"

Then invoke the experiment-designer agent with the full context.
