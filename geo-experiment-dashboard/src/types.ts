export interface StoryboardPanel {
  panelId: number;
  row: number;
  col: number;
  // Phase is a free-form label so each experiment can name its own beats. The
  // default GEO Lab phases are listed for editor hints, but any string is valid.
  phase: 'Hook' | 'Hypothesis' | 'Method' | 'The Danger' | 'The Run' | 'Results' | 'The Fix' | 'Rigor' | 'Threats' | 'Takeaway' | 'Outro' | (string & {});
  visual: string;
  audio: string;
  bRoll: string;
  // Optional: the comedic intent for this panel's b-roll. B-roll exists to lighten
  // otherwise dry, factual content — a humorous "exclamation point" juxtaposed
  // against the stiff finding (the experiment-001 approach). Guides which panels
  // get a comedic Flow cutaway; the geo-lab generator fills this.
  bRollComedic?: string;
  // Optional: whether this panel cuts away to a full-screen b-roll. When present on
  // the loaded storyboard it seeds the auto-b-roll panel map (replaces the hardcoded list).
  hasBRoll?: boolean;
  startTime: string;
  endTime: string;
}

// A self-contained, reusable video project for one experiment. This is the
// interchange format between the geo-lab pipeline (which generates it) and this
// app (which records it). Media files (b-roll/voiceover) are NOT bundled — they
// are produced fresh per experiment in Flow/ElevenLabs and uploaded at runtime.
export interface StoryboardProject {
  schemaVersion: number;        // bump when the shape changes; current: 1
  experimentId: string;         // e.g. "001-statistical-anchors"
  title: string;                // video / working title, e.g. "The Number Anchor Theory"
  subtitle?: string;            // one-line dossier description
  headlineStat?: string;        // e.g. "100%" — the hero number
  headlineStatLabel?: string;   // e.g. "Claude Citations Lift"
  baselineDurationSec?: number; // authored timeline length before audio scaling (default 330)
  panels: StoryboardPanel[];
  // Optional in-app editing state captured on export so a take is fully reproducible:
  manualPanelStarts?: Record<number, number>;
  manualPanelEnds?: Record<number, number>;
  panelOffsets?: Record<number, number>;
  autoBrollPanels?: Record<number, boolean>;
  isIntroEnabled?: boolean;
  isOutroEnabled?: boolean;
  createdAt?: string;
}

export interface EngineStat {
  id: string;
  name: string;
  controlRate: number;      // e.g. 0.25 (25%)
  treatmentRate: number;    // e.g. 1.00 (100%)
  controlCitations: string; // "4/16"
  treatmentCitations: string; // "16/16"
  pValue: number;
  isSignificant: boolean;
  color: string;
  badgeColor: string;
}

export interface HolmStep {
  step: number;
  comparison: string;
  pValue: number;
  alphaPrime: number;
  decision: 'Reject Null (Significant)' | 'Fail to Reject (Not Significant)';
  isSignificant: boolean;
}

export interface SimulatedProbe {
  id: string;
  engine: string;
  query: string;
  variant: 'A' | 'B';
  status: 'pending' | 'searching' | 'parsing' | 'evaluating' | 'completed';
  cited: boolean;
  citationText?: string;
  logs: string[];
}
