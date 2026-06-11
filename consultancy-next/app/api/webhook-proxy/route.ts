import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { assertSafeEgressUrl } from '@/lib/egress-guard';

// Server-side proxy for outbound webhook calls.
// Browser fetch() to external URLs fails with CORS — proxying here avoids that entirely.
// Auth-gated so it can't be abused as an open proxy by unauthenticated callers.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const { webhookUrl, payload } = await req.json();
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'webhookUrl required' }, { status: 400 });
    }

    const egressError = await assertSafeEgressUrl(webhookUrl);
    if (egressError) {
      return NextResponse.json({ error: egressError }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'error', // block redirect-based SSRF bounce
    });

    const responseText = await response.text();
    let responseData: any = {};
    try { responseData = JSON.parse(responseText); } catch (_) { responseData = { raw: responseText }; }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned ${response.status}`, details: responseData },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, ...responseData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}
