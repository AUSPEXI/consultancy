/**
 * Email-funnel scheduling logic — pure and unit-testable (no I/O).
 *
 * A lead doc carries { signupDate (ms epoch), lastEmailSentIndex }. Given the
 * current time, decide which funnel email (if any) is now due. Exactly one step
 * advances per evaluation, so an hourly cron walks each lead through the
 * sequence without ever skipping or double-sending.
 */

import { FUNNEL_EMAILS, type FunnelEmail } from './email-templates';

export interface ReportLead {
  email: string;
  domain: string;
  signupDate: number;       // ms epoch
  lastEmailSentIndex: number; // 0 = only the initial report sent
}

/**
 * Returns the funnel email that should be sent to this lead now, or null if
 * none is due (not enough time elapsed, or the whole sequence is complete).
 */
export function dueFunnelEmail(lead: Pick<ReportLead, 'signupDate' | 'lastEmailSentIndex'>, now: number): FunnelEmail | null {
  const hoursSinceSignup = (now - lead.signupDate) / (1000 * 60 * 60);
  // The next step is the one whose `index` equals the lead's current progress.
  const next = FUNNEL_EMAILS.find((e) => e.index === lead.lastEmailSentIndex);
  if (!next) return null;                       // sequence finished
  if (hoursSinceSignup < next.minHours) return null; // not due yet
  return next;
}
