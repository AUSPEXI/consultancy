import { NextResponse } from 'next/server';
import { getExa } from '@/lib/exa';

export async function POST(request: Request) {
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
