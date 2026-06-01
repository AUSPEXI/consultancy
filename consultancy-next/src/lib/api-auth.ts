import { adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * Verify the Firebase ID token from the Authorization header.
 * Returns { userId } on success, or a 401 NextResponse on failure.
 * Usage:
 *   const auth = await requireAuth(request);
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId } = auth;
 */
export async function requireAuth(
  request: Request,
): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminAuth) {
    // Firebase Admin not configured (local dev without service account).
    // Decode token payload without verification so dev still works.
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
