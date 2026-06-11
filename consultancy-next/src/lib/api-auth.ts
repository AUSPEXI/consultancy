import { adminAuth, dbAdmin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { normalizeTier, checkTierAccess, type UserTier } from '@/constants/tiers';

/**
 * Verify the Firebase ID token from the Authorization header.
 * Returns { userId } on success, or a 401 NextResponse on failure.
 *
 * Internal automation calls (from /api/cron/run-automations) pass a synthetic
 * token of the form `automation:<userId>` plus the X-Automation-Run header and
 * a valid X-Cron-Secret. This path skips Firebase token verification because the
 * cron entrypoint has already authenticated with CRON_SECRET and is acting on
 * behalf of the user, not impersonating them externally.
 */
export async function requireAuth(
  request: Request,
): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Internal automation path: cron entrypoint passes automation:<userId>.
  // Only trusted when X-Automation-Run is set AND the CRON_SECRET matches.
  if (token.startsWith('automation:')) {
    const cronSecret = request.headers.get('x-cron-secret');
    const isAutomation = request.headers.get('x-automation-run') === '1';
    if (isAutomation && cronSecret && cronSecret === process.env.CRON_SECRET) {
      return { userId: token.slice('automation:'.length) };
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminAuth) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Server auth not configured' }, { status: 503 });
    }
    // Local dev without service account: decode without signature verification.
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return { userId: payload.user_id || payload.sub || 'dev-user' };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { userId: decoded.uid };
  } catch {
    return NextResponse.json({ error: 'Invalid or expired auth token' }, { status: 401 });
  }
}

/**
 * Verify auth AND check the caller's tier meets the minimum required.
 * Admins bypass the tier check.
 * Returns { userId } on success, or a 401/403 NextResponse.
 */
export async function requireTier(
  request: Request,
  minTier: UserTier,
): Promise<{ userId: string } | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) return { userId }; // can't verify tier without DB — allow in dev

  try {
    const snap = await dbAdmin.collection('users').doc(userId).get();
    const data = snap.data() ?? {};
    if (data.role === 'admin') return { userId };
    const tier = normalizeTier(data.tier) as UserTier;
    if (!checkTierAccess(tier, minTier)) {
      return NextResponse.json(
        { error: 'upgrade_required', upgradeTo: minTier },
        { status: 403 },
      );
    }
    return { userId };
  } catch {
    return NextResponse.json({ error: 'Could not verify tier' }, { status: 500 });
  }
}
