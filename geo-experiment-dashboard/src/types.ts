export interface StoryboardPanel {
  panelId: number;
  row: number;
  col: number;
  phase: 'Hook' | 'Hypothesis' | 'Method' | 'The Danger' | 'The Run' | 'Results' | 'The Fix' | 'Rigor' | 'Threats' | 'Takeaway' | 'Outro';
  visual: string;
  audio: string;
  bRoll: string;
  startTime: string;
  endTime: string;
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
