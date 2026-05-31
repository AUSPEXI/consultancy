import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Creates a short-lived ephemeral token server-side.
// The real API key never leaves the server — only the opaque token.name is returned.
// The client uses token.name as apiKey with apiVersion v1alpha to open the Live WebSocket.
export async function POST() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });

  try {
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({ config: { uses: 1 } });
    if (!token.name) throw new Error('No token name returned');
    return NextResponse.json({ token: token.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
