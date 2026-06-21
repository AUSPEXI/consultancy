# Storyboard Project Schema (`*.project.json`)

This is the interchange format between the **GEO Lab** experiment pipeline (which
generates it) and the **video app** (which records it). One file = one
experiment's video. Load it in the app via **Load Project**; the app's
**Export** button writes this exact shape back out (panels + timing + settings).

Media files (b-roll clips, voiceover audio, intro/outro) are **not** bundled —
they're produced fresh per experiment in Flow / ElevenLabs and uploaded in the
app at runtime. The project only carries text, structure, and timing.

## Top level

```jsonc
{
  "schemaVersion": 1,
  "experimentId": "001-statistical-anchors",   // matches geo-lab/experiments/<id>
  "title": "The Number Anchor Theory",          // video / working title
  "subtitle": "Testing whether LLMs prefer precise stats…", // optional, one line
  "headlineStat": "100%",                        // optional hero number
  "headlineStatLabel": "Claude Citations Lift",  // optional caption for the stat
  "baselineDurationSec": 330,                    // authored timeline before audio scaling
  "panels": [ /* StoryboardPanel[] — see below */ ],

  // Optional: captured by the app's Export so a take is fully reproducible.
  // A freshly generated project can omit all of these.
  "manualPanelStarts": { "1": 0, "2": 6.4 },     // tap-sync absolute starts (sec)
  "panelOffsets": { "5": -1.5 },                 // per-panel nudge (sec)
  "autoBrollPanels": { "3": true, "11": true },  // which panels cut to b-roll
  "isIntroEnabled": true,
  "isOutroEnabled": true,
  "createdAt": "2026-06-21"
}
```

## `StoryboardPanel`

```jsonc
{
  "panelId": 3,                 // unique number; drives ordering & timing
  "row": 1,                     // grid row (the app lays panels out 6×6 = 36)
  "col": 3,                     // grid column
  "phase": "Hook",              // free-form beat label (Hook, Method, Results, …)
  "visual": "Text banner slides in…",   // on-screen visual direction
  "audio": "Let me show you what actually happened…", // the narration line (verbatim)
  "bRoll": "Camera raw: head-and-shoulders…",         // b-roll asset note (optional)
  "bRollComedic": "Over-the-top 'serious science' gag…", // OPTIONAL, see below
  "hasBRoll": true,             // OPTIONAL: panel cuts away to a full-screen b-roll
  "startTime": "0:14",          // authored start (m:ss) — used before tap-sync
  "endTime": "0:20"             // authored end (m:ss)
}
```

### Required vs optional
- **Required:** `panelId`, `row`, `col`, `phase`, `visual`, `audio`, `startTime`, `endTime`.
- **Optional:** `bRoll`, `bRollComedic`, `hasBRoll`.

### `bRollComedic` — the humour brief
B-roll in these videos is **comic punctuation**: a short, funny Flow cutaway that
juxtaposes against otherwise dry, factual content — the experiment-001 approach.
`bRollComedic` describes that gag so the b-roll stays on-brand and the generator
knows which panels deserve a humorous "exclamation point." Set `hasBRoll: true`
on those panels; they seed the app's auto-b-roll map.

## Timing model
1. `startTime`/`endTime` define the authored timeline (`baselineDurationSec`).
2. The app linearly scales those to the loaded voiceover length.
3. **Tap-Sync** (recommended) overrides everything: play the voiceover once,
   tap each panel's start, and `manualPanelStarts` is captured — frame-accurate
   to the actual narration. Export then bakes those marks into the project.

## The `audio` field is the voiceover script
Concatenating every panel's `audio` in `panelId` order **is** the narration to
paste into ElevenLabs (strip nothing — it's already cue-free). The geo-lab
generator produces both this project and a flat `voiceover.txt` from the same text.
