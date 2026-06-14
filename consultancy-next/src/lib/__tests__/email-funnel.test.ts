import { describe, it, expect } from 'vitest';
import { dueFunnelEmail } from '../email-funnel';
import { FUNNEL_EMAILS } from '../email-templates';

const HOUR = 60 * 60 * 1000;
const NOW = 1_000_000_000_000;

/** A lead that signed up `hoursAgo` hours before NOW, at the given progress. */
const lead = (hoursAgo: number, lastEmailSentIndex: number) => ({
  signupDate: NOW - hoursAgo * HOUR,
  lastEmailSentIndex,
});

describe('dueFunnelEmail', () => {
  it('sends nothing in the first 24h', () => {
    expect(dueFunnelEmail(lead(1, 0), NOW)).toBeNull();
    expect(dueFunnelEmail(lead(23.9, 0), NOW)).toBeNull();
  });

  it('sends email 1 (index 0 -> due) at 24h', () => {
    const due = dueFunnelEmail(lead(24, 0), NOW);
    expect(due?.index).toBe(0);
    expect(due?.subject).toMatch(/SEO/i);
  });

  it('does not skip ahead: an index-0 lead at 200h still gets email 1 first', () => {
    // Hourly cron advances one step at a time, so a long-dormant lead resumes
    // from where it left off rather than jumping to the final email.
    const due = dueFunnelEmail(lead(200, 0), NOW);
    expect(due?.index).toBe(0);
  });

  it('waits for each step\'s threshold before sending the next', () => {
    // Already sent email 1 (index now 1); email 2 needs >= 48h.
    expect(dueFunnelEmail(lead(40, 1), NOW)).toBeNull();
    expect(dueFunnelEmail(lead(48, 1), NOW)?.index).toBe(1);
  });

  it('walks the full sequence at the documented hour thresholds', () => {
    const thresholds = [24, 48, 72, 96, 120, 144, 168];
    thresholds.forEach((h, i) => {
      const due = dueFunnelEmail(lead(h, i), NOW);
      expect(due?.index).toBe(i);
    });
  });

  it('returns null once the sequence is complete (index 7)', () => {
    expect(dueFunnelEmail(lead(1000, 7), NOW)).toBeNull();
  });

  it('has exactly 7 emails with contiguous indexes 0..6 and ascending thresholds', () => {
    expect(FUNNEL_EMAILS).toHaveLength(7);
    FUNNEL_EMAILS.forEach((e, i) => expect(e.index).toBe(i));
    const hours = FUNNEL_EMAILS.map((e) => e.minHours);
    expect(hours).toEqual([...hours].sort((a, b) => a - b));
  });
});
