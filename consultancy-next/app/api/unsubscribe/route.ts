import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

/**
 * Public unsubscribe endpoint for the report email funnel. Marks every matching
 * report_leads doc as unsubscribed so the email-funnel cron skips it. Intentionally
 * unauthenticated (it's an unsubscribe link) and idempotent.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    if (!dbAdmin) return NextResponse.json({ error: 'Unavailable' }, { status: 503 });

    const normalized = email.toLowerCase().trim();
    const snap = await dbAdmin.collection('report_leads').where('email', '==', normalized).get();
    await Promise.all(
      snap.docs.map((d) =>
        d.ref.update({ unsubscribed: true, unsubscribedAt: new Date().toISOString() })
      )
    );

    return NextResponse.json({ success: true, unsubscribed: normalized });
  } catch (err: any) {
    console.error('unsubscribe error:', err);
    return NextResponse.json({ error: 'Unsubscribe failed' }, { status: 500 });
  }
}
