import { NextResponse } from 'next/server';

// Returns the Gemini API key for the Live WebSocket voice API.
// The Live API is a direct browser→Google WebSocket — it cannot be proxied
// through Next.js HTTP routes (no WebSocket upgrade support).
// VITE_GEMINI_API_KEY is the original key that had bidiGenerateContent access.
export async function GET() {
  const key = process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });
  return NextResponse.json({ key });
}
