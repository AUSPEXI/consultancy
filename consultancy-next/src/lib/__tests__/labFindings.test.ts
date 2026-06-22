import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { labFindings } from '../../data/labFindings';

// Drift guard (WS5): the public lab page (src/data/labFindings.ts) is hand-
// maintained and must never claim MORE than the committed geo-lab finding.json
// earned. We can't diff prose numbers, but we CAN enforce the verdict ladder
// against the machine-readable finding + its programme-wide FDR q-value.
const expRoot = path.resolve(process.cwd(), '../geo-lab/experiments');

describe('labFindings ↔ finding.json drift guard', () => {
  // Skip cleanly if the sibling geo-lab repo isn't checked out in this context.
  const haveLab = fs.existsSync(expRoot);

  for (const lf of labFindings) {
    it(`${lf.id}: matches a finding.json and does not overstate`, () => {
      if (!haveLab) return;
      const fp = path.join(expRoot, lf.id, 'finding.json');
      expect(fs.existsSync(fp), `no finding.json for public lab entry "${lf.id}"`).toBe(true);
      const f = JSON.parse(fs.readFileSync(fp, 'utf8'));

      // "supported" = a confident public claim → must be significant AND survive
      // Benjamini–Hochberg FDR across the whole programme (q < 0.05).
      if (lf.verdict === 'supported') {
        expect(f.verdict, `${lf.id} public verdict "supported" but finding verdict is "${f.verdict}"`).toBe('significant');
        expect(typeof f.qValue, `${lf.id} "supported" but finding has no qValue (run fdr-ledger.mjs)`).toBe('number');
        expect(f.qValue, `${lf.id} "supported" but q=${f.qValue} ≥ 0.05 (fails FDR)`).toBeLessThan(0.05);
      }

      // A null/rejected public verdict must not sit on a significant finding.
      if (lf.verdict === 'null' || lf.verdict === 'rejected') {
        expect(f.verdict, `${lf.id} public verdict "${lf.verdict}" but finding is "${f.verdict}"`).toBe('null');
      }
    });
  }
});
