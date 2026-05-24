/* eslint-disable no-restricted-globals */
import { CleaningConfig } from '../services/dataCleaningService';

type MsgIn = { cmd: 'start'; data: any[]; schema: any; config: CleaningConfig };
type MsgOut = { type: 'progress'; processed: number } | { type: 'done'; cleaned: any[]; report: any };

function post(msg: MsgOut) { (self as any).postMessage(msg); }

function chunk<T>(arr: T[], size: number): T[][] { const out: T[][] = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

(self as any).onmessage = async (e: MessageEvent) => {
  const { cmd, data, schema, config } = (e.data || {}) as MsgIn;
  if (cmd !== 'start') return;

  // Lightweight in-worker cleaning: dedupe + simple text trim; defer heavy ops to main service if needed
  let rows = data.map((r: any) => {
    const next: any = { ...r };
    if (config?.text?.trim) {
      for (const k of Object.keys(next)) if (typeof next[k] === 'string') next[k] = String(next[k]).trim();
    }
    return next;
  });

  if (config?.dedupe) {
    const seen = new Set<string>();
    rows = rows.filter((r: any) => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  const parts = chunk(rows, 2000);
  let processed = 0;
  for (const p of parts) {
    processed += p.length;
    post({ type: 'progress', processed });
    await new Promise((r) => setTimeout(r, 0));
  }

  const report = { totalRows: data.length, rowsRemoved: data.length - rows.length, duplicatesRemoved: data.length - rows.length, missingImputed: 0, outliersCapped: 0, piiRedacted: 0, notes: ['worker-lite'] };
  post({ type: 'done', cleaned: rows, report });
};


