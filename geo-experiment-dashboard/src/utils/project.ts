import { StoryboardPanel, StoryboardProject } from '../types';

// Where the active experiment's project is cached so a reload restores it.
export const PROJECT_STORAGE_KEY = 'activeStoryboardProject';
export const CURRENT_SCHEMA_VERSION = 1;

export interface ProjectValidation {
  ok: boolean;
  error?: string;
  project?: StoryboardProject;
}

const REQUIRED_PANEL_FIELDS: (keyof StoryboardPanel)[] = [
  'panelId', 'row', 'col', 'phase', 'visual', 'audio', 'startTime', 'endTime',
];

// Validate an untrusted blob (uploaded file or localStorage) into a project.
// Lenient on optional fields, strict on the structural ones the app relies on.
export function validateProject(data: any): ProjectValidation {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Not a valid project file (expected a JSON object).' };
  }
  if (!Array.isArray(data.panels) || data.panels.length === 0) {
    return { ok: false, error: 'Project has no "panels" array.' };
  }
  for (let i = 0; i < data.panels.length; i++) {
    const p = data.panels[i];
    for (const f of REQUIRED_PANEL_FIELDS) {
      if (p[f] === undefined || p[f] === null) {
        return { ok: false, error: `Panel #${i + 1} is missing required field "${String(f)}".` };
      }
    }
    if (typeof p.panelId !== 'number') {
      return { ok: false, error: `Panel #${i + 1} has a non-numeric panelId.` };
    }
    // bRoll is optional in the schema but the app expects a string for display.
    if (p.bRoll === undefined || p.bRoll === null) p.bRoll = '';
  }

  const project: StoryboardProject = {
    schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : CURRENT_SCHEMA_VERSION,
    experimentId: typeof data.experimentId === 'string' ? data.experimentId : 'untitled',
    title: typeof data.title === 'string' ? data.title : 'Untitled Experiment',
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
    headlineStat: typeof data.headlineStat === 'string' ? data.headlineStat : undefined,
    headlineStatLabel: typeof data.headlineStatLabel === 'string' ? data.headlineStatLabel : undefined,
    baselineDurationSec: typeof data.baselineDurationSec === 'number' ? data.baselineDurationSec : 330,
    panels: data.panels as StoryboardPanel[],
    manualPanelStarts: isNumberRecord(data.manualPanelStarts) ? data.manualPanelStarts : undefined,
    manualPanelEnds: isNumberRecord(data.manualPanelEnds) ? data.manualPanelEnds : undefined,
    panelOffsets: isNumberRecord(data.panelOffsets) ? data.panelOffsets : undefined,
    autoBrollPanels: isBoolRecord(data.autoBrollPanels) ? data.autoBrollPanels : undefined,
    isIntroEnabled: typeof data.isIntroEnabled === 'boolean' ? data.isIntroEnabled : undefined,
    isOutroEnabled: typeof data.isOutroEnabled === 'boolean' ? data.isOutroEnabled : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
  };
  return { ok: true, project };
}

function isNumberRecord(v: any): v is Record<number, number> {
  return v && typeof v === 'object' && !Array.isArray(v) &&
    Object.values(v).every(x => typeof x === 'number');
}
function isBoolRecord(v: any): v is Record<number, boolean> {
  return v && typeof v === 'object' && !Array.isArray(v) &&
    Object.values(v).every(x => typeof x === 'boolean');
}

export function loadActiveProject(): StoryboardProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return null;
    const res = validateProject(JSON.parse(raw));
    return res.ok ? res.project! : null;
  } catch {
    return null;
  }
}

export function saveActiveProject(project: StoryboardProject): void {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
  } catch {
    /* storage full / unavailable — non-fatal, project just won't persist */
  }
}

// Panels flagged hasBRoll seed the auto-b-roll cutaway map.
export function deriveAutoBroll(panels: StoryboardPanel[]): Record<number, boolean> {
  const out: Record<number, boolean> = {};
  for (const p of panels) {
    if (p.hasBRoll) out[p.panelId] = true;
  }
  return out;
}
