import { describe, it, expect } from 'vitest';
import { pickJudge, cohenKappa } from '../cite-judge';

describe('cite-judge', () => {
  it('never judges an engine with its own model family', () => {
    expect(pickJudge('claude').provider).not.toBe('anthropic');
    expect(pickJudge('chatgpt').provider).not.toBe('openai');
    expect(pickJudge('gemini').provider).not.toBe('gemini');
    // perplexity is treated as openai-family for avoidance
    expect(pickJudge('perplexity').provider).not.toBe('openai');
  });

  it('picks a concrete judge for non-mapped engines', () => {
    expect(['openai', 'anthropic', 'gemini']).toContain(pickJudge('grok').provider);
    expect(['openai', 'anthropic', 'gemini']).toContain(pickJudge('deepseek').provider);
  });

  it('cohenKappa: perfect agreement is 1', () => {
    const k = cohenKappa([{ a: true, b: true }, { a: false, b: false }, { a: true, b: true }]);
    expect(k).toBe(1);
  });

  it('cohenKappa: chance-level agreement is near 0', () => {
    // Independent raters each ~50% yes → κ should be close to 0.
    const pairs = [
      { a: true, b: false }, { a: false, b: true }, { a: true, b: true }, { a: false, b: false },
    ];
    const k = cohenKappa(pairs)!;
    expect(Math.abs(k)).toBeLessThan(0.5);
  });

  it('cohenKappa: empty input returns null', () => {
    expect(cohenKappa([])).toBeNull();
  });
});
