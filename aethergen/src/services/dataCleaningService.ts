export type CleaningConfig = {
  enforceSchema?: boolean;
  dedupe?: boolean;
  missing?: { strategy: 'leave' | 'drop-row' | 'impute-mean' | 'impute-median' | 'impute-mode' };
  outliers?: { method: 'iqr' | 'zscore' | 'none'; k?: number };
  pii?: { redact?: boolean; hash?: boolean };
  text?: { trim?: boolean; normalizeWhitespace?: boolean; lowercase?: boolean };
  dates?: { iso8601?: boolean };
};

export type CleaningReport = {
  totalRows: number;
  rowsRemoved: number;
  duplicatesRemoved: number;
  missingImputed: number;
  outliersCapped: number;
  piiRedacted: number;
  notes: string[];
};

export function cleanSeedData(data: any[], schema: any, config: CleaningConfig): { cleaned: any[]; report: CleaningReport } {
  return coreClean(data, schema, config);
}

export function cleanSyntheticData(data: any[], schema: any, config: CleaningConfig): { cleaned: any[]; report: CleaningReport } {
  return coreClean(data, schema, config);
}

export function triadGuidedConfig(base: CleaningConfig | undefined, triad: { geometricConsistency: number; triadValidationScore: number }): CleaningConfig {
  const strict = triad.geometricConsistency < 0.9 || triad.triadValidationScore < 0.85;
  const guided: CleaningConfig = {
    enforceSchema: true,
    dedupe: true,
    missing: { strategy: strict ? 'impute-median' : 'leave' },
    outliers: { method: 'iqr', k: strict ? 1.5 : 2.0 },
    pii: { redact: true },
    text: { trim: true, normalizeWhitespace: true, lowercase: false },
    dates: { iso8601: true }
  };
  return { ...guided, ...(base || {}) };
}

function coreClean(data: any[], schema: any, config: CleaningConfig): { cleaned: any[]; report: CleaningReport } {
  const report: CleaningReport = {
    totalRows: data.length,
    rowsRemoved: 0,
    duplicatesRemoved: 0,
    missingImputed: 0,
    outliersCapped: 0,
    piiRedacted: 0,
    notes: []
  };

  let rows = [...data];

  // Enforce schema: coerce types
  if (config.enforceSchema && schema?.fields) {
    const fields = schema.fields as Array<{ name: string; type: string }>;
    rows = rows.map((row) => {
      const next: any = { ...row };
      for (const f of fields) {
        const v = next[f.name];
        next[f.name] = coerceType(v, f.type);
      }
      return next;
    });
  }

  // Missing handling
  if (config.missing && config.missing.strategy !== 'leave') {
    const strategy = config.missing.strategy;
    const fields = Object.keys(rows[0] || {});
    const colStats: Record<string, any> = {};
    if (strategy.startsWith('impute')) {
      for (const f of fields) {
        const vals = rows.map((r) => r[f]).filter((v) => v !== null && v !== undefined && typeof v === 'number');
        if (vals.length) {
          vals.sort((a, b) => a - b);
          const median = vals[Math.floor(vals.length / 2)];
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const mode = modeOf(rows.map((r) => r[f]));
          colStats[f] = { mean, median, mode };
        }
      }
    }
    rows = rows.filter((r) => {
      if (strategy === 'drop-row') {
        return !Object.values(r).some((v) => v === null || v === undefined || v === '');
      }
      return true;
    }).map((r) => {
      if (strategy.startsWith('impute')) {
        const next: any = { ...r };
        for (const f of fields) {
          if (next[f] === null || next[f] === undefined || next[f] === '') {
            const stats = colStats[f];
            if (stats) {
              if (strategy === 'impute-mean') next[f] = stats.mean;
              else if (strategy === 'impute-median') next[f] = stats.median;
              else if (strategy === 'impute-mode') next[f] = stats.mode;
              report.missingImputed += 1;
            }
          }
        }
        return next;
      }
      return r;
    });
  }

  // Dedupe
  if (config.dedupe) {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const r of rows) {
      const key = JSON.stringify(r);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      } else {
        report.duplicatesRemoved += 1;
      }
    }
    rows = unique;
  }

  // Outliers
  if (config.outliers && config.outliers.method !== 'none') {
    const method = config.outliers.method;
    const k = config.outliers.k ?? (method === 'iqr' ? 1.5 : 3);
    const numericFields = Object.keys(rows[0] || {}).filter((f) => typeof rows[0]?.[f] === 'number');
    for (const f of numericFields) {
      const vals = rows.map((r) => r[f]).filter((v) => typeof v === 'number');
      if (!vals.length) continue;
      vals.sort((a, b) => a - b);
      if (method === 'iqr') {
        const q1 = vals[Math.floor(vals.length * 0.25)];
        const q3 = vals[Math.floor(vals.length * 0.75)];
        const iqr = q3 - q1;
        const low = q1 - k * iqr;
        const high = q3 + k * iqr;
        rows = rows.map((r) => {
          const v = r[f];
          if (typeof v === 'number') {
            if (v < low) { r[f] = low; report.outliersCapped += 1; }
            if (v > high) { r[f] = high; report.outliersCapped += 1; }
          }
          return r;
        });
      } else if (method === 'zscore') {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
        const low = mean - k * sd;
        const high = mean + k * sd;
        rows = rows.map((r) => {
          const v = r[f];
          if (typeof v === 'number') {
            if (v < low) { r[f] = low; report.outliersCapped += 1; }
            if (v > high) { r[f] = high; report.outliersCapped += 1; }
          }
          return r;
        });
      }
    }
  }

  // Text normalization
  if (config.text) {
    rows = rows.map((r) => {
      const next: any = { ...r };
      for (const k of Object.keys(next)) {
        const v = next[k];
        if (typeof v === 'string') {
          let s = v;
          if (config.text.trim) s = s.trim();
          if (config.text.normalizeWhitespace) s = s.replace(/\s+/g, ' ');
          if (config.text.lowercase) s = s.toLowerCase();
          next[k] = s;
        }
      }
      return next;
    });
  }

  // Date normalization
  if (config.dates?.iso8601) {
    rows = rows.map((r) => {
      const next: any = { ...r };
      for (const k of Object.keys(next)) {
        const v = next[k];
        if (v instanceof Date) next[k] = v.toISOString();
      }
      return next;
    });
  }

  // PII (very conservative regexes)
  if (config.pii && (config.pii.redact || config.pii.hash)) {
    const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
    const phone = /\+?\d[\d\s().-]{7,}\d/g;
    const idlike = /\b[A-Z]{2,3}[- ]?\d{3,}\b/g;
    rows = rows.map((r) => {
      const next: any = { ...r };
      for (const k of Object.keys(next)) {
        const v = String(next[k] ?? '');
        let nv = v.replace(email, () => { report.piiRedacted++; return '[email]'; })
                  .replace(phone, () => { report.piiRedacted++; return '[phone]'; })
                  .replace(idlike, () => { report.piiRedacted++; return '[id]'; });
        if (config.pii.hash) {
          nv = simpleHash(nv);
        }
        next[k] = typeof next[k] === 'string' ? nv : next[k];
      }
      return next;
    });
  }

  report.rowsRemoved = Math.max(0, report.totalRows - rows.length);
  return { cleaned: rows, report };
}

function coerceType(value: any, type: string): any {
  if (value === null || value === undefined) return value;
  switch (type) {
    case 'number': {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
      return Boolean(value);
    case 'date':
      try { const d = new Date(value); return isNaN(d.getTime()) ? null : d.toISOString(); } catch { return null; }
    case 'json':
      if (typeof value === 'object') return value;
      try { return JSON.parse(String(value)); } catch { return null; }
    default:
      return String(value);
  }
}

function modeOf(values: any[]): any {
  const freq = new Map<any, number>();
  for (const v of values) freq.set(v, (freq.get(v) || 0) + 1);
  let best: any = undefined, cnt = -1;
  for (const [k, v] of freq.entries()) if (v > cnt) { best = k; cnt = v; }
  return best;
}

function simpleHash(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'h_' + (h >>> 0).toString(36);
}


