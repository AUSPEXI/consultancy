import { StoryboardPanel } from '../types';

export const STORYBOARD_DATA: StoryboardPanel[] = [
  // ROW 1: The Hook & The Problem
  {
    panelId: 1,
    row: 1,
    col: 1,
    phase: 'Hook',
    visual: 'Giant white text "100% vs 25%" over deep charcoal grey. Neon cyan Claude logo pulse-flashes next to 100%.',
    audio: 'On Claude, swapping one vague phrase for one specific number took our citation rate from 25% to a perfect 100%.',
    bRoll: 'Electric cyan color card overlay, asset: claude-logo.svg',
    startTime: '0:00',
    endTime: '0:07'
  },
  {
    panelId: 2,
    row: 1,
    col: 2,
    phase: 'Hook',
    visual: 'Fast multi-panel grid layout showing logos for Gemini, OpenAI, Perplexity, and Claude in a rapid 1-second sequence.',
    audio: 'Every single trial. But before you rewrite every line you\'ve ever written, that massive result did not hold true everywhere.',
    bRoll: 'Smooth asset transitions: gemini.svg, openai.svg, perplexity.svg',
    startTime: '0:07',
    endTime: '0:14'
  },
  {
    panelId: 3,
    row: 1,
    col: 3,
    phase: 'Hook',
    visual: 'Text banner slides in from bottom: "Exploring the 4 Engine Split". Gwylym to camera, looking skeptical but intrigued.',
    audio: 'Let me show you what actually happened when we put this to a rigorous statistical test across four different engines.',
    bRoll: 'Camera raw: Head-and-shoulders frame, professional ring studio lighting.',
    bRollComedic: 'Over-the-top "serious science" gag — safety goggles + lab coat to type one sentence — undercutting the gravitas.',
    hasBRoll: true,
    startTime: '0:14',
    endTime: '0:20'
  },
  {
    panelId: 4,
    row: 1,
    col: 4,
    phase: 'Hypothesis',
    visual: 'Split-screen text cards. Left: Gray card marked "Vague". Right: Neon cyan card marked "Specific".',
    audio: 'Here is the core hypothesis we are testing. There is a common theory in Generative Engine Optimization (GEO)...',
    bRoll: 'Motion graphic: Floating text blocks separating smoothly into two halves.',
    startTime: '0:20',
    endTime: '0:27'
  },
  {
    panelId: 5,
    row: 1,
    col: 5,
    phase: 'Hypothesis',
    visual: 'Highlighted text zoom on the specific phrases: "improved latency significantly" vs. "cut latency 43%".',
    audio: '...that large language models heavily weight precise, citable metrics as credibility anchors over vague corporate puffery.',
    bRoll: 'Document preview tracking shot over matching code text lines.',
    startTime: '0:27',
    endTime: '0:34'
  },
  {
    panelId: 6,
    row: 1,
    col: 6,
    phase: 'Hypothesis',
    visual: 'A floating target graphic icon displaying "Predicted Lift: +10% to +20%" appears center screen.',
    audio: 'If the number-anchor theory holds water, Variant B should see a distinct, measurable boost. We pre-registered a modest lift prediction.',
    bRoll: 'Minimalist vector icon: dartboard target or rising arrow vector graphic.',
    startTime: '0:34',
    endTime: '0:40'
  },

  // ROW 2: Method, Code Rigor & The Simpson's Threat
  {
    panelId: 7,
    row: 2,
    col: 1,
    phase: 'Method',
    visual: 'Dark UI text editor showing DESIGN.md. A distinct green git commit tag glows brightly: "[Locked June 11, 2026]".',
    audio: 'Trust first. Here is our design doc, fully committed to GitHub before a single piece of live engine data was gathered.',
    bRoll: 'Screen recording: Scrolling smoothly down clean markdown text file tree.',
    startTime: '0:40',
    endTime: '0:50'
  },
  {
    panelId: 8,
    row: 2,
    col: 2,
    phase: 'Method',
    visual: 'Close-up macro view on system variables: brand="NovaCRM", temperature=0.0.',
    audio: 'We held the brand name entirely constant to eliminate background domain bias, fixed the generation temperature, and randomized our query order.',
    bRoll: 'Code terminal snippet display with syntax highlighting.',
    startTime: '0:50',
    endTime: '1:00'
  },
  {
    panelId: 9,
    row: 2,
    col: 3,
    phase: 'Method',
    visual: 'Graphic list of 4 user intent variations sliding upward in a clean vertical stack.',
    audio: 'We fired four highly natural search query variations, testing exactly how these systems serve up product performance claims.',
    bRoll: 'Text list overlay animation with clean sans-serif typography.',
    startTime: '1:00',
    endTime: '1:10'
  },
  {
    panelId: 10,
    row: 2,
    col: 4,
    phase: 'Method',
    visual: 'Large amber warning card pops onto screen layout: "CAVEAT: Preliminary Run (n=2)".',
    audio: 'But let us be completely transparent up front. This initial batch used just two trials per variant per engine. Our absolute lab minimum is 30.',
    bRoll: 'Warning icon asset flashing amber yellow color tone.',
    startTime: '1:10',
    endTime: '1:20'
  },
  {
    panelId: 11,
    row: 2,
    col: 5,
    phase: 'The Danger',
    visual: 'Diagram showing a scale tipping erratically. Text banner: "The Simpson\'s Paradox Trap".',
    audio: 'Because we are pulling data from entirely unique environments, naively pooling these numbers introduces a massive mathematical trap.',
    bRoll: 'Vector animation: Grouped data clusters mixing together incorrectly.',
    bRollComedic: 'Slapstick see-saw gag — the "scale" tips so hard it flings a tiny figure offscreen. Simpson\'s Paradox as physical comedy.',
    hasBRoll: true,
    startTime: '1:20',
    endTime: '1:30'
  },
  {
    panelId: 12,
    row: 2,
    col: 6,
    phase: 'The Danger',
    visual: 'Split visualization showing Perplexity\'s huge 50% baseline vs. Gemini\'s baseline sitting flat at 0%.',
    audio: 'Perplexity naturally loves to cite everything, while Gemini starts at absolute zero. Combining them directly creates a false composition illusion.',
    bRoll: 'Two miniature side-by-side bar charts displaying wide baseline gaps.',
    startTime: '1:30',
    endTime: '1:40'
  },

  // ROW 3: Live Probes & The Verbatim Run
  {
    panelId: 13,
    row: 3,
    col: 1,
    phase: 'The Run',
    visual: 'Command-line window running scripts/orchestrate.mjs. Green checkmarks rapidly printing inline.',
    audio: 'To watch the live script run is where it gets interesting. The testing engine hits the APIs, scrapes the sources, and records the output.',
    bRoll: 'High-framerate terminal capture execution scrolling text blocks.',
    startTime: '1:40',
    endTime: '1:50'
  },
  {
    panelId: 14,
    row: 3,
    col: 2,
    phase: 'The Run',
    visual: 'Claude interface layout highlighted. A glowing circle focuses directly on the pulled text segment: "cut latency 43%".',
    audio: 'Look at this response log. When Claude chooses to cite Variant B, it explicitly grabs that specific 43 percent metric as its logical anchor.',
    bRoll: 'JSON payload view showing captured response text logs.',
    startTime: '1:50',
    endTime: '1:58'
  },
  {
    panelId: 15,
    row: 3,
    col: 3,
    phase: 'The Run',
    visual: 'Side-by-side screen display. Left side sits blank; Right side pops a bright cyan "CITED" badge.',
    audio: 'Meanwhile, the vague wording in Variant A gets completely passed over on multiple setups. It is treated like invisible filler text.',
    bRoll: 'Graphic overlay system badge icons popping up sequentially.',
    startTime: '1:58',
    endTime: '2:10'
  },
  {
    panelId: 16,
    row: 3,
    col: 4,
    phase: 'The Run',
    visual: 'Tally counter metric animation climbing up smoothly from 0 to 16 pooled test points.',
    audio: 'As the data points fill out our tracking matrix, we start to see distinct performance paths for each engine.',
    bRoll: 'Numerical odometer interface animation effect.',
    startTime: '2:10',
    endTime: '2:18'
  },
  {
    panelId: 17,
    row: 3,
    col: 5,
    phase: 'Results',
    visual: 'Full four-panel grid display showing individual bar charts for Gemini, OpenAI, Perplexity, and Claude.',
    audio: 'Let us break it down engine by engine using our baseline verbatim scoring system, starting with our standout performer.',
    bRoll: 'Master chart grid layout view using a deep dark gray frame.',
    startTime: '2:18',
    endTime: '2:25'
  },
  {
    panelId: 18,
    row: 3,
    col: 6,
    phase: 'Results',
    visual: 'Zoom dynamic sweep focus directly into the Claude data panel: 25% jumping up to 100%.',
    audio: 'Claude is our clear headline. The control sits at 25, while the treatment hits a flawless 100 percent citation rate.',
    bRoll: 'Single panel animation expansion with neon blue accent color bars.',
    startTime: '2:25',
    endTime: '2:35'
  },

  // ROW 4: Breaking Down Engine Results
  {
    panelId: 19,
    row: 4,
    col: 1,
    phase: 'Results',
    visual: 'Pan over to the Gemini data panel: 0% stepping up to 31.3%. Text tag shows p=0.0149.',
    audio: 'Gemini shows a similar clean path. Absolute zero citations for the vague text, climbing up to over 31 percent for the numbers.',
    bRoll: 'Bar chart animation showing vertical level step expansion.',
    bRollComedic: 'Gemini glow-up gag — flatlined zero suddenly does a triumphant little fist-pump as the bar shoots up.',
    hasBRoll: true,
    startTime: '2:35',
    endTime: '2:45'
  },
  {
    panelId: 20,
    row: 4,
    col: 2,
    phase: 'Results',
    visual: 'Pan over to the OpenAI data panel: 0% shifting to 18.8%. Red text label displays: p=0.0688 (NS).',
    audio: 'OpenAI moves in the exact same positive direction, hitting 18.8 percent, but its p-value misses our significance threshold on this tiny sample.',
    bRoll: 'Dotted line threshold overlay indicating significance cut-off point.',
    startTime: '2:45',
    endTime: '2:55'
  },
  {
    panelId: 21,
    row: 4,
    col: 3,
    phase: 'Results',
    visual: 'Focus shifts to Perplexity data panel: 50% to 68.8%. Flat trend text label overlays it: p=0.2802.',
    audio: 'And Perplexity remains incredibly generous across the board, starting at 50 percent and climbing upward, though well within the realm of noise.',
    bRoll: 'Flat chart visualization with wide error bar range markings.',
    startTime: '2:55',
    endTime: '3:05'
  },
  {
    panelId: 22,
    row: 4,
    col: 4,
    phase: 'Results',
    visual: 'Full display layout of the Descriptive Pooled Table: 18.8% vs. 54.7%. A thin red line crosses through it.',
    audio: 'If we just pool everything together naively, we get a massive 18 to 54 percent jump. But a smart data scientist would throw this chart right back at us.',
    bRoll: 'Macro table graphic with an explicit cross-out warning layout mask.',
    startTime: '3:05',
    endTime: '3:15'
  },
  {
    panelId: 23,
    row: 4,
    col: 5,
    phase: 'The Fix',
    visual: 'Clean typographic equation slide-in: Cochran–Mantel–Haenszel (CMH). Neon cyan banner: Odds Ratio (OR) = 10.2.',
    audio: 'To make this genuinely bulletproof, we deployed a stratified CMH test as our primary metric endpoint, controlling directly for engine baselines.',
    bRoll: 'Motion typography layout with mathematical statistical terms.',
    startTime: '3:15',
    endTime: '3:25'
  },
  {
    panelId: 24,
    row: 4,
    col: 6,
    phase: 'The Fix',
    visual: 'Text pop-up card appears centered: "Variant B is ~10x more likely to be cited".',
    audio: 'The result? A massive common odds ratio of 10.2. The effect is real, significant, and completely immune to Simpson\'s Paradox.',
    bRoll: 'Bold accent text card presentation element over dark interface template.',
    bRollComedic: '"10x" gag — a single lonely citation hits the gym and bench-presses a giant glowing "10x" odds ratio.',
    hasBRoll: true,
    startTime: '3:25',
    endTime: '3:35'
  },

  // ROW 5: Correction Alpha & Semantic Judging
  {
    panelId: 25,
    row: 5,
    col: 1,
    phase: 'Rigor',
    visual: 'Graphic showing an over-aggressive lock icon clamping down tightly onto a data plot point.',
    audio: 'When we asked an LLM how to manage our error rates across these engines, it blindly pointed us toward a standard Bonferroni correction.',
    bRoll: 'Minimal style line art vector animation of a heavy clamp closing down.',
    startTime: '3:35',
    endTime: '3:45'
  },
  {
    panelId: 26,
    row: 5,
    col: 2,
    phase: 'Rigor',
    visual: 'Text items reveal sequentially: "Overly Conservative" → "Erases Real Signals" → "False Negatives".',
    audio: 'But Bonferroni is incredibly punishing. It destroys your statistical power by aggressively splitting your alpha evenly across every test.',
    bRoll: 'Clean typographic checklist list layout with alert accent markers.',
    startTime: '3:45',
    endTime: '3:55'
  },
  {
    panelId: 27,
    row: 5,
    col: 3,
    phase: 'Rigor',
    visual: 'Flowchart displaying a step-down hierarchy layout sorting p-values dynamically from small to large.',
    audio: 'Instead, we implemented a Holm–Bonferroni step-down protocol, preserving critical testing power while maintaining absolute protection against false discoveries.',
    bRoll: 'UI flowchart animation displaying value sorting behavior dynamically.',
    startTime: '3:55',
    endTime: '4:05'
  },
  {
    panelId: 28,
    row: 5,
    col: 4,
    phase: 'Rigor',
    visual: 'Split card display. Left: Verbatim Scorer. Right: Semantic LLM-Judge (Claude Haiku).',
    audio: 'Then we attacked our next major vulnerability: the quotability confound. Was our code just matching strings, or measuring real preference?',
    bRoll: 'Dual brand graphic icon layout using contrasting white and gray backgrounds.',
    bRollComedic: 'Detective bit — a magnifying-glass sleuth squints suspiciously at "strings" vs. "meaning", milking the confound for laughs.',
    hasBRoll: true,
    startTime: '4:05',
    endTime: '4:15'
  },
  {
    panelId: 29,
    row: 5,
    col: 5,
    phase: 'Rigor',
    visual: 'Data table rendering side-by-side metrics: Verbatim (54.7% citation) vs. Semantic Judge (94.6% citation).',
    audio: 'We brought in an independent LLM judge to grade every response purely by meaning, completely blind to exact word patterns.',
    bRoll: 'Side-by-side data comparison table component card layout.',
    startTime: '4:15',
    endTime: '4:25'
  },
  {
    panelId: 30,
    row: 5,
    col: 6,
    phase: 'Rigor',
    visual: 'Big center metric value rolls into focus: "60.7% Record Agreement" with a solid green checkmark.',
    audio: 'The two methods showed a clear 60.7 percent record-level agreement in the exact same direction, proving this is not an artifact of string matching.',
    bRoll: 'Centered circle graphic framing the final percentage value scale.',
    startTime: '4:25',
    endTime: '4:35'
  },

  // ROW 6: Threats, Scope & Community Outreach
  {
    panelId: 31,
    row: 6,
    col: 1,
    phase: 'Threats',
    visual: 'Scrolling view down the comprehensive Threats to Validity checklist layout structure.',
    audio: 'Now, the parts that keep us completely honest. No statistical test can magically fix core design boundaries.',
    bRoll: 'Clean UI list view tracking down multiple bullet point rows smoothly.',
    startTime: '4:35',
    endTime: '4:45'
  },
  {
    panelId: 32,
    row: 6,
    col: 2,
    phase: 'Threats',
    visual: 'Text highlights explicitly on-screen: "In-Context Retrieval Only (Fast-Mode)".',
    audio: 'This remains a fast-mode test of in-context retrieval preference. It checks what a model does with text right in front of it, not live-index production.',
    bRoll: 'Diagram displaying a document fed directly into an LLM window block.',
    bRollComedic: 'Fast-food gag — a document literally shoved into the model\'s "mouth" like a drive-thru order. "In-context", served hot.',
    hasBRoll: true,
    startTime: '4:45',
    endTime: '4:52'
  },
  {
    panelId: 33,
    row: 6,
    col: 3,
    phase: 'Takeaway',
    visual: 'Gwylym back on camera, speaking directly with genuine, grounded delivery.',
    audio: 'So what is the low-cost takeaway for your content workflows? If you have a true, verified metric, lead with it instead of a generic phrase.',
    bRoll: 'Camera raw: Direct lens view frame, relaxed but authoritative stance.',
    startTime: '4:52',
    endTime: '5:02'
  },
  {
    panelId: 34,
    row: 6,
    col: 4,
    phase: 'Takeaway',
    visual: 'Side-by-side quick text comparison cards recap the basic lesson: "43% Beats Significantly".',
    audio: 'Writing precise, data-backed lines costs absolutely nothing and shows clear directional upside across every single engine we hit.',
    bRoll: 'Dual colored comparison block text graphics using crisp layout design.',
    startTime: '5:02',
    endTime: '5:10'
  },
  {
    panelId: 35,
    row: 6,
    col: 5,
    phase: 'Outro',
    visual: 'Minimalist logo splash card center frame: L8EntSpace. Banner below: "Explore the Lab Notes".',
    audio: 'If you want to map your own brand performance across these engine models at scale, explore our full testing infrastructure below.',
    bRoll: 'Clean brand logo motion graphic vector asset element.',
    startTime: '5:10',
    endTime: '5:20'
  },
  {
    panelId: 36,
    row: 6,
    col: 6,
    phase: 'Outro',
    visual: 'End card display with a clean pinned comment box preview text lines: "Raw Data & Replication Steps Pinned".',
    audio: 'I am an experimenter building this out in public, not a traditionally trained data scientist. Check out the raw logs, tell me what we missed, and subscribe for the next test.',
    bRoll: 'Overlay animation displaying comment frame graphics and subscription prompt.',
    bRollComedic: 'Earnest, self-aware "please subscribe" bit — indie-experimenter charm dialled to eleven, winking at the convention.',
    hasBRoll: true,
    startTime: '5:20',
    endTime: '5:30'
  }
];

import { StoryboardProject } from '../types';

// The shipped default project (experiment 001). Acts as the app's built-in
// template and the canonical example of the interchange schema. Loading another
// experiment's project JSON replaces these panels at runtime.
export const DEFAULT_PROJECT: StoryboardProject = {
  schemaVersion: 1,
  experimentId: '001-statistical-anchors',
  title: 'The Number Anchor Theory',
  subtitle: 'Testing whether search-engine LLMs prioritise precise statistics over qualitative descriptions.',
  headlineStat: '100%',
  headlineStatLabel: 'Claude Citations Lift',
  baselineDurationSec: 330,
  panels: STORYBOARD_DATA,
  createdAt: '2026-06-21',
};
