import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for outbound webhook calls.
// Browser fetch() to external URLs fails with CORS — proxying here avoids that entirely.
export async function POST(req: NextRequest) {
  try {
    const { webhookUrl, payload } = await req.json();
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'webhookUrl required' }, { status: 400 });
    }

    // Only allow http/https
    const url = new URL(webhookUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'Invalid webhook URL protocol' }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
