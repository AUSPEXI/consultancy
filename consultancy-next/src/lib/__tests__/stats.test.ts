import { describe, it, expect } from 'vitest';
import { normalCDF, twoProportionZ, headToHeadVerdict } from '../stats';

describe('stats', () => {
  it('normalCDF matches known values', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 5);
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCDF(-1.96)).toBeCloseTo(0.025, 3);
  });

  it('twoProportionZ: a large clear gap is significant', () => {
    // 18/20 vs 2/20 — a big difference, should be highly significant.
    const r = twoProportionZ(18, 20, 2, 20);
    expect(r.diffPp).toBeCloseTo(80, 0);
    expect(r.pValue).toBeLessThan(0.001);
  });

  it('twoProportionZ: equal proportions are not significant', () => {
    const r = twoProportionZ(5, 10, 5, 10);
    expect(r.diffPp).toBe(0);
    expect(r.pValue).toBeGreaterThan(0.9);
  });

  it('twoProportionZ: tiny sample is inconclusive', () => {
    // 2/2 vs 1/2 — directionally ahead but n is tiny, must NOT be significant.
    const r = twoProportionZ(2, 2, 1, 2);
    expect(r.pValue).toBeGreaterThan(0.05);
  });

  it('headToHeadVerdict labels honestly', () => {
    expect(headToHeadVerdict(18, 20, 2, 20).verdict).toBe('ahead');
    expect(headToHeadVerdict(2, 20, 18, 20).verdict).toBe('behind');
    expect(headToHeadVerdict(2, 2, 1, 2).verdict).toBe('inconclusive');
  });

  it('handles empty groups without throwing', () => {
    const r = twoProportionZ(0, 0, 0, 0);
    expect(r.pValue).toBe(1);
  });
});
