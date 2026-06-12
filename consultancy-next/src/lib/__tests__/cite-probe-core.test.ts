import { describe, it, expect } from 'vitest';
import {
  wilsonCI95,
  checkCitation,
  buildQueries,
  estimateProbeCost,
  ENGINE_MODEL_VERSIONS,
  ALL_ENGINES,
  type PlatformKey,
} from '../cite-probe-core';

describe('wilsonCI95', () => {
  it('returns [0,100] for zero trials', () => {
    expect(wilsonCI95(0, 0)).toEqual([0, 100]);
  });

  it('never produces bounds outside 0–100', () => {
    for (let n = 1; n <= 20; n++) {
      for (let k = 0; k <= n; k++) {
        const [lo, hi] = wilsonCI95(k, n);
        expect(lo).toBeGreaterThanOrEqual(0);
        expect(hi).toBeLessThanOrEqual(100);
        expect(lo).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('contains the point estimate', () => {
    const [lo, hi] = wilsonCI95(3, 7);
    const point = (3 / 7) * 100;
    expect(lo).toBeLessThanOrEqual(point);
    expect(hi).toBeGreaterThanOrEqual(point);
  });

  it('is wide at n=7 (the honesty the UI warns about)', () => {
    const [lo, hi] = wilsonCI95(3, 7);
    expect(hi - lo).toBeGreaterThan(40);
  });

  it('narrows as n grows', () => {
    const [lo7, hi7] = wilsonCI95(3, 7);
    const [lo70, hi70] = wilsonCI95(30, 70);
    expect(hi70 - lo70).toBeLessThan(hi7 - lo7);
  });

  it('handles the k=0 and k=n edges without degenerate intervals', () => {
    const [lo0, hi0] = wilsonCI95(0, 7);
    expect(lo0).toBe(0);
    expect(hi0).toBeGreaterThan(0); // 0/7 does NOT mean "certainly 0%"
    const [loN, hiN] = wilsonCI95(7, 7);
    expect(hiN).toBe(100);
    expect(loN).toBeLessThan(100);
  });
});

describe('checkCitation', () => {
  const brand = 'Acme';
  const domain = 'acme.com';

  it('detects a plain brand mention as cited', () => {
    const r = checkCitation('Acme is a popular choice for widgets.', brand, domain);
    expect(r.cited).toBe(true);
    expect(r.accurate).toBe(true);
    expect(r.excerpt).toContain('Acme');
  });

  it('detects a domain-only mention as cited', () => {
    const r = checkCitation('You could try acme.com for that.', brand, domain);
    expect(r.cited).toBe(true);
  });

  it('returns not-cited when the brand is absent', () => {
    const r = checkCitation('There are many widget vendors out there.', brand, domain);
    expect(r.cited).toBe(false);
    expect(r.sentiment).toBeNull();
  });

  it('treats "no information about X" disclaimers as not-cited', () => {
    const r = checkCitation(
      "I couldn't find any information about Acme in my knowledge.",
      brand, domain,
    );
    expect(r.cited).toBe(false);
  });

  it('treats hypothetical framings as not-cited', () => {
    const r = checkCitation(
      "Let me imagine a company called Acme that sells widgets.",
      brand, domain,
    );
    expect(r.cited).toBe(false);
  });

  it('classifies positive sentiment from positive words near the brand', () => {
    const r = checkCitation('Acme is the best and most reliable option.', brand, domain);
    expect(r.sentiment).toBe('positive');
  });

  it('classifies negative sentiment', () => {
    const r = checkCitation('Acme is overpriced and buggy.', brand, domain);
    expect(r.sentiment).toBe('negative');
  });

  it('returns list rank when the brand appears in a numbered list', () => {
    const response = [
      'Here are the top options:',
      '1. WidgetCo: solid all-rounder',
      '2. Acme: strong for enterprises',
      '3. Gadgetly: budget pick',
    ].join('\n');
    const r = checkCitation(response, brand, domain);
    expect(r.position).toBe(2);
  });

  it('flags misinformation when a known-false statement is echoed without negation', () => {
    const falseStmt = 'Acme was founded in Germany by Klaus Schmidt';
    const r = checkCitation(
      'Acme was founded in Germany by Klaus Schmidt and makes widgets.',
      brand, domain, [falseStmt],
    );
    expect(r.cited).toBe(true);
    expect(r.accurate).toBe(false);
    expect(r.misinformation).toBeTruthy();
  });

  it('does NOT flag misinformation when the false claim is negated', () => {
    const falseStmt = 'Acme was founded in Germany by Klaus Schmidt';
    const r = checkCitation(
      'Acme was not founded in Germany by Klaus Schmidt. It started in Ohio.',
      brand, domain, [falseStmt],
    );
    expect(r.accurate).toBe(true);
  });
});

describe('buildQueries', () => {
  it('produces 7 queries and folds in brand + keywords', () => {
    const qs = buildQueries('Acme', 'acme.com', ['widget testing', 'gadget QA']);
    expect(qs).toHaveLength(7);
    expect(qs.some(q => q.includes('Acme'))).toBe(true);
    expect(qs.some(q => q.includes('widget testing'))).toBe(true);
  });

  it('falls back to generic GEO queries with no brand or keywords', () => {
    const qs = buildQueries('', '', []);
    expect(qs).toHaveLength(7);
    expect(qs.every(q => q.length > 10)).toBe(true);
  });
});

describe('estimateProbeCost', () => {
  it('scales linearly with passes', () => {
    const engines = new Set<PlatformKey>(ALL_ENGINES);
    const one = estimateProbeCost(7, engines, 1);
    const three = estimateProbeCost(7, engines, 3);
    expect(three).toBeCloseTo(one * 3, 10);
  });

  it('costs nothing with no engines', () => {
    expect(estimateProbeCost(7, new Set(), 1)).toBe(0);
  });

  it('full 7-engine 7-query pass lands near the ~$0.17 metering figure', () => {
    const cost = estimateProbeCost(7, new Set<PlatformKey>(ALL_ENGINES), 1);
    expect(cost).toBeGreaterThan(0.1);
    expect(cost).toBeLessThan(0.25);
  });
});

describe('ENGINE_MODEL_VERSIONS', () => {
  it('covers every engine in ALL_ENGINES', () => {
    for (const engine of ALL_ENGINES) {
      expect(ENGINE_MODEL_VERSIONS[engine]).toBeTruthy();
    }
  });
});
