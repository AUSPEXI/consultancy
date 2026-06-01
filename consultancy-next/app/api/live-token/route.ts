import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// Returns a Gemini key for the Live WebSocket voice API.
// REQUIRES Firebase auth — the key must never be sent to unauthenticated callers.
export async function GET(request: Request) {
  // Verify Firebase ID token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (adminAuth) {
      await adminAuth.verifyIdToken(token);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!key) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });
  }
  return NextResponse.json({ key });
}
