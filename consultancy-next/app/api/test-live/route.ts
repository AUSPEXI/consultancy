import { NextResponse } from 'next/server';

// Diagnostic endpoint — DISABLED in production to prevent key enumeration.
// Re-enable locally by setting ENABLE_DIAGNOSTICS=true in .env.local
export async function GET() {
  if (process.env.ENABLE_DIAGNOSTICS !== 'true') {
    return NextResponse.json({ error: 'Diagnostic endpoints are disabled' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Set ENABLE_DIAGNOSTICS=true in .env.local to use this endpoint locally only.' });
}
