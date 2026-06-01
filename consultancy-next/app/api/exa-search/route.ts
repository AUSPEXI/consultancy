import { NextResponse } from 'next/server';
import { getExa } from '@/lib/exa';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { query, numResults = 5 } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const exa = getExa();
    const searchResult = await exa.searchAndContents(query, {
      type: 'neural',
      useAutoprompt: true,
      numResults,
      text: true,
    });

    return NextResponse.json({ success: true, results: searchResult.results });
  } catch (error: any) {
    console.error('Error in Exa search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
