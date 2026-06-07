import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const { webhookUrl, payload } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: 'No CMS Webhook URL configured' }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'auspexi.shadow_link_sync',
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`CMS responded with ${response.status}`);
    }

    return NextResponse.json({ success: true, message: 'Successfully synchronized with CMS' });
  } catch (err: any) {
    console.error('CMS Push error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to push to CMS' },
      { status: 500 }
    );
  }
}
