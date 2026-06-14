import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { secretsMatch } from '@/lib/api-auth';
import { sendMail, emailConfigured } from '@/lib/mailer';
import { dueFunnelEmail, type ReportLead } from '@/lib/email-funnel';

/**
 * Email-funnel cron — sends the 7-day post-report follow-up sequence.
 *
 * Replaces the legacy long-running setInterval + leads.json funnel with a
 * stateless, Netlify-compatible route: triggered hourly by a GitHub Action
 * (see .github/workflows/email-funnel.yml) and gated by CRON_SECRET. Lead state
 * lives in the Firestore `report_leads` collection. Exactly one email advances
 * per lead per run, so reruns are safe and never double-send.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secretsMatch(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!emailConfigured()) {
    return NextResponse.json({ skipped: 'email not configured' });
  }
  if (!dbAdmin) {
    return NextResponse.json({ skipped: 'admin db unavailable' });
  }

  const now = Date.now();
  const sent: { email: string; index: number }[] = [];

  try {
    // Only leads still mid-sequence (the final email advances the index to 7).
    const snap = await dbAdmin
      .collection('report_leads')
      .where('lastEmailSentIndex', '<', 7)
      .limit(500)
      .get();

    for (const doc of snap.docs) {
      const lead = doc.data() as ReportLead;
      if (lead.unsubscribed) continue;
      const due = dueFunnelEmail(lead, now);
      if (!due) continue;

      const ok = await sendMail({
        to: lead.email,
        subject: due.subject,
        html: due.build(lead.domain),
      });
      if (!ok.ok) continue; // leave index unchanged so it retries next run

      await doc.ref.update({
        lastEmailSentIndex: due.index + 1,
        lastEmailSentAt: new Date().toISOString(),
      });
      sent.push({ email: lead.email, index: due.index + 1 });
    }

    return NextResponse.json({ success: true, sentCount: sent.length, sent });
  } catch (err: any) {
    console.error('email-funnel cron error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
