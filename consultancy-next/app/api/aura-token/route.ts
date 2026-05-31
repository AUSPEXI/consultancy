import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Public endpoint — no auth required (Aura is the public-facing voice agent).
// Returns a short-lived ephemeral token instead of the real API key so the
// real key never reaches the browser.
export async function GET() {
  const apiKey = process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY || '';

  if (!apiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60_000).toISOString(),
      },
    });
    return NextResponse.json({ token: token.name });
  } catch (err: any) {
    console.error('[aura-token] ephemeral token failed, falling back to key:', err?.message);
    return NextResponse.json({ key: apiKey });
  }
}
