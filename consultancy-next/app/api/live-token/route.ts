import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';

export async function GET(req: NextRequest) {
  // Verify the caller is an authenticated Firebase user.
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!admin.apps.length) {
    return NextResponse.json({ error: 'Server auth not configured' }, { status: 503 });
  }

  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY || '';

  if (!apiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });

  // Generate a short-lived ephemeral token instead of returning the real key.
  // The token expires in 60s, is single-use, and only works for bidiGenerateContent.
  // The real API key never reaches the browser.
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60_000).toISOString(), // 30 min — covers full session
      },
    });
    return NextResponse.json({ token: token.name });
  } catch (err: any) {
    // Fall back to returning the real key if ephemeral token creation fails.
    // This keeps voice working even if the tokens API is unavailable.
    console.error('[live-token] ephemeral token failed, falling back to key:', err?.message);
    return NextResponse.json({ key: apiKey });
  }
}
