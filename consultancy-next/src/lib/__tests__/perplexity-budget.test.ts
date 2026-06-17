import { describe, it, expect } from 'vitest';
import { isOverCap } from '../perplexity-budget';

describe('isOverCap', () => {
  it('is under when below the cap', () => {
    expect(isOverCap(2.22, 5)).toBe(false);
    expect(isOverCap(0, 5)).toBe(false);
  });

  it('trips at or above the cap', () => {
    expect(isOverCap(5, 5)).toBe(true);
    expect(isOverCap(7.5, 5)).toBe(true);
  });

  it('treats a cap of 0 (or negative) as disabled — never trips', () => {
    expect(isOverCap(1000, 0)).toBe(false);
    expect(isOverCap(1000, -1)).toBe(false);
  });
});
