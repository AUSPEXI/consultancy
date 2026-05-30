import { NextResponse } from 'next/server';

// Returns the Gemini API key to the browser for the Live WebSocket voice API.
// The Live API opens a direct browser→Google WebSocket — it cannot be proxied through
// a Next.js HTTP route (no WebSocket upgrade support), so the key must reach the client.
export async function GET() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!key) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });
  }
  return NextResponse.json({ key });
}
