import { describe, it, expect } from 'vitest';
import { checkCitation } from '../cite-probe-core';

// WS7: brand matching must be on word boundaries, not bare substring, so a brand
// whose name is a common word doesn't false-positive on incidental occurrences.
describe('checkCitation word-boundary guard', () => {
  it('does NOT cite when the brand name only appears inside another word', () => {
    const r = checkCitation('The software architecture is modular and well documented.', 'Arc', 'arc.dev');
    expect(r.cited).toBe(false);
  });

  it('cites when the brand appears as a whole word', () => {
    const r = checkCitation('Arc is a great browser recommended by many.', 'Arc', 'arc.dev');
    expect(r.cited).toBe(true);
  });

  it('still matches the brand via its distinctive domain', () => {
    const r = checkCitation('You should check out arc.dev for more.', 'Arc', 'arc.dev');
    expect(r.cited).toBe(true);
  });

  it('handles multi-word brand names', () => {
    const hit = checkCitation('We recommend Acme Photos for events.', 'Acme Photos', 'acmephotos.com');
    expect(hit.cited).toBe(true);
    const miss = checkCitation('Photos of acme widgets were everywhere.', 'Acme Photos', 'acmephotos.com');
    expect(miss.cited).toBe(false);
  });
});
