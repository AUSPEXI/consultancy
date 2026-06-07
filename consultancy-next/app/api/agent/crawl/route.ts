import { NextResponse } from 'next/server';
import { getExa } from '@/lib/exa';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { topic } = await request.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const exa = getExa();
    const searchResult = await exa.searchAndContents(topic.trim(), {
      type: 'neural',
      useAutoprompt: true,
      numResults: 8,
      text: { maxCharacters: 3000 },
    });

    const sources = searchResult.results.map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      text: r.text || '',
      publishedDate: r.publishedDate || null,
    }));

    // Log Exa search cost: ~$0.025 per search request (neural, 8 results)
    if (dbAdmin && userId !== 'anonymous') {
      dbAdmin.collection('cost_audit').add({
        userId,
        feature: 'agent-crawl',
        model: 'exa-neural',
        provider: 'exa',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0.025,
        totalCostUsd: 0.025,
        exaResults: sources.length,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      result: {
        topic: topic.trim(),
        sources,
        totalSources: sources.length,
      },
    });
  } catch (err: any) {
    console.error('agent/crawl error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
