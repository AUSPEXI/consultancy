import { NextResponse } from 'next/server';
import { adminAuth, dbAdmin } from '@/lib/firebase-admin';
import { secretsMatch } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Deployment diagnostics. Reports PRESENCE of critical env vars and whether
 * Firebase Admin initialized — never any values. Gated by CRON_SECRET so it
 * can't be used for recon.
 *
 *   curl -H "x-cron-secret: $CRON_SECRET" https://site/api/health
 */
export async function GET(request: Request) {
  if (!secretsMatch(request.headers.get('x-cron-secret'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT;

  let firestoreReachable = false;
  if (dbAdmin) {
    try {
      await dbAdmin.collection('users').limit(1).get();
      firestoreReachable = true;
    } catch {
      firestoreReachable = false;
    }
  }

  return NextResponse.json({
    adminAuthInitialized: !!adminAuth,
    dbAdminInitialized: !!dbAdmin,
    firestoreReachable,
    env: {
      FIREBASE_SERVICE_ACCOUNT_BASE64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      serviceAccountLength: saRaw ? saRaw.length : 0,
      CRON_SECRET: !!process.env.CRON_SECRET,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      PERPLEXITY_API_KEY: !!process.env.PERPLEXITY_API_KEY,
      SERPAPI_KEY: !!process.env.SERPAPI_KEY,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_APP_PASSWORD: !!process.env.EMAIL_APP_PASSWORD,
    },
    nodeEnv: process.env.NODE_ENV,
    checkedAt: new Date().toISOString(),
  });
}
