Build the loadable storyboard project + voiceover for a completed experiment.

1. Identify the experiment folder from the args or ask the user.
2. Confirm `video/script.md` exists (error if not — run /write-video-script first).
3. Run: `npm run storyboard <experiment-dir>` (needs ANTHROPIC_API_KEY).
4. This writes:
   - `video/storyboard.project.json` — load this into the geo-experiment-dashboard
     app via "Load Project" (36 panels, comedic b-roll beats, honest narration).
   - `video/voiceover.txt` — the cue-free narration to paste into ElevenLabs.
5. Tell the user the panel count, which panels have comedic b-roll, and the
   voiceover word count, then the next steps: generate the voiceover in ElevenLabs,
   create the comedic b-rolls in Google Flow, load the project, drop in the assets,
   tap/edit the panel times to sync, and record.
