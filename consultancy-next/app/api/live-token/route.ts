import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Creates a short-lived ephemeral token server-side.
// The real API key never leaves the server — only the opaque token.name is returned.
// Requires a key with Live API (bidiGenerateContent) access.
// Set GEMINI_LIVE_API_KEY in Netlify with your paid Google AI Studio key,
// or fall back to GEMINI_API_KEY if it has Live access.
export async function POST() {
  const key = process.env.GEMINI_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'No Gemini API key configured (set GEMINI_LIVE_API_KEY)' }, { status: 503 });

  try {
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({ config: { uses: 1 } });
    if (!token.name) throw new Error('authTokens.create returned no name');
    return NextResponse.json({ token: token.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
