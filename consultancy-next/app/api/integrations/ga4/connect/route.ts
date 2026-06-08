import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { buildAuthUrl, ga4Configured } from '@/lib/ga4';
import crypto from 'crypto';

// Returns a Google OAuth consent URL. The CSRF `state` is a random nonce stored
// server-side (oauth_states) mapped to the user, resolved in the callback.
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!ga4Configured()) {
    return NextResponse.json({ error: 'GA4 integration not configured on the server' }, { status: 503 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  const nonce = crypto.randomBytes(24).toString('hex');
  await dbAdmin.collection('oauth_states').doc(nonce).set({
    userId, provider: 'ga4', createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ url: buildAuthUrl(nonce) });
}
