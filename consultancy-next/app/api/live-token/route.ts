import { NextRequest, NextResponse } from 'next/server';
import admin from '@/src/lib/firebase-admin';

export async function GET(req: NextRequest) {
  // Verify the caller is an authenticated Firebase user.
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!admin.apps.length) {
    // Firebase Admin not initialized (missing service account env var).
    // Fail closed — do not return the key without verified auth.
    return NextResponse.json({ error: 'Server auth not configured' }, { status: 503 });
  }

  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const key = process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY || '';

  if (!key) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });

  return NextResponse.json({ key });
}
