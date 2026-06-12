import { describe, it, expect } from 'vitest';
import { secretsMatch } from '../api-auth';

describe('secretsMatch', () => {
  it('matches identical secrets', () => {
    expect(secretsMatch('hunter2-cron-secret', 'hunter2-cron-secret')).toBe(true);
  });

  it('rejects different secrets of equal length', () => {
    expect(secretsMatch('aaaaaaaa', 'aaaaaaab')).toBe(false);
  });

  it('rejects different lengths', () => {
    expect(secretsMatch('short', 'short-but-longer')).toBe(false);
  });

  it('fails closed on null/undefined/empty (never matches a missing secret)', () => {
    expect(secretsMatch(null, null)).toBe(false);
    expect(secretsMatch(undefined, undefined)).toBe(false);
    expect(secretsMatch('', '')).toBe(false);
    expect(secretsMatch('set', undefined)).toBe(false);
    expect(secretsMatch(undefined, 'set')).toBe(false);
  });

  it('handles multibyte input without throwing', () => {
    expect(secretsMatch('käse🔑', 'käse🔑')).toBe(true);
    expect(secretsMatch('käse🔑', 'käse🔒')).toBe(false);
  });
});
