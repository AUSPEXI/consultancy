import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { refreshAccessToken, runAttributionReport } from '@/lib/ga4';

export const maxDuration = 60;

// GET ?days=30 — AI-referral attribution for the user's selected GA4 property.
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  if (!dbAdmin) return NextResponse.json({ error: 'Database not available' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(7, Number(searchParams.get('days')) || 30), 90);

  const snap = await dbAdmin.collection('ga4_integrations').doc(userId).get();
  if (!snap.exists) return NextResponse.json({ connected: false }, { status: 200 });
  const d = snap.data() as any;
  if (!d.refreshToken) return NextResponse.json({ connected: false }, { status: 200 });
  if (!d.propertyId) return NextResponse.json({ connected: true, needsProperty: true }, { status: 200 });

  try {
    const accessToken = await refreshAccessToken(d.refreshToken);
    const report = await runAttributionReport(accessToken, d.propertyId, days);
    return NextResponse.json({ connected: true, propertyId: d.propertyId, report });
  } catch (err: any) {
    console.error('ga4 attribution error:', err);
    // A revoked/expired refresh token surfaces here — tell the client to reconnect.
    const needsReconnect = /token|invalid_grant|unauthorized/i.test(err.message || '');
    return NextResponse.json({ connected: true, error: err.message, needsReconnect }, { status: 200 });
  }
}
