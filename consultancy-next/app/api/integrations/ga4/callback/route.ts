import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { exchangeCode, listProperties } from '@/lib/ga4';

// Google redirects the user here after consent. Public route (no Firebase auth
// header — the user identity comes from the server-stored `state` nonce).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const settingsUrl = `${base}/dashboard/settings`;

  const fail = (reason: string) => NextResponse.redirect(`${settingsUrl}?ga4=error&reason=${encodeURIComponent(reason)}`);

  if (!code || !state) return fail('missing_code');
  if (!dbAdmin) return fail('no_db');

  try {
    // Resolve + consume the nonce
    const stateRef = dbAdmin.collection('oauth_states').doc(state);
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) return fail('invalid_state');
    const { userId } = stateSnap.data() as { userId: string };
    await stateRef.delete().catch(() => {});

    // Exchange the code for tokens
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      // No refresh token returned — usually means the user previously granted
      // access. They must revoke at myaccount.google.com or we force prompt=consent
      // (which we do), so this should be rare.
      return fail('no_refresh_token');
    }

    // Auto-select the property if the account has exactly one
    let properties: Awaited<ReturnType<typeof listProperties>> = [];
    try { properties = await listProperties(tokens.access_token); } catch { /* non-fatal */ }
    const autoProperty = properties.length === 1 ? properties[0].propertyId : null;

    await dbAdmin.collection('ga4_integrations').doc(userId).set({
      userId,
      refreshToken: tokens.refresh_token,
      connectedAt: new Date().toISOString(),
      propertyId: autoProperty,
      properties,
    }, { merge: true });

    return NextResponse.redirect(`${settingsUrl}?ga4=connected`);
  } catch (err: any) {
    console.error('ga4 callback error:', err);
    return fail('exchange_failed');
  }
}
