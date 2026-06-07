import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

/**
 * GET /api/export-training-set?userId=...&format=jsonl|csv
 *
 * Exports a supervised training set from accumulated citation tests.
 * Each row is: content variant (query text used to probe), query sent to LLM,
 * platform, cited (bool), embedding (if fact has one).
 *
 * This is the ML backbone for future fine-tuning / ranking model work.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'jsonl';

    if (!userId || userId === 'anonymous') {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (!dbAdmin) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // Load all citation test results for this user
    const testsSnap = await dbAdmin
      .collection('citation_tests')
      .where('userId', '==', userId)
      .get();

    if (testsSnap.empty) {
      if (format === 'csv') {
        return new Response(
          'query,platform,cited,citation_rate,timestamp\n',
          { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="training-set.csv"' } }
        );
      }
      return new Response('', {
        headers: { 'Content-Type': 'application/x-ndjson', 'Content-Disposition': 'attachment; filename="training-set.jsonl"' }
      });
    }

    // Load all fact embeddings for this user (for optional embedding attachment)
    const factsSnap = await dbAdmin
      .collection('facts')
      .where('userId', '==', userId)
      .get();
    const factEmbeddings: Map<string, number[]> = new Map();
    factsSnap.docs.forEach(d => {
      const data = d.data();
      if (data.statement && data.embedding?.length > 0) {
        factEmbeddings.set(data.statement as string, data.embedding as number[]);
      }
    });

    type TrainingRow = {
      query: string;
      platform: string;
      cited: boolean;
      citation_rate: number;
      timestamp: string;
      brand?: string;
      excerpt?: string | null;
      embedding?: number[];
    };

    const rows: TrainingRow[] = [];

    for (const doc of testsSnap.docs) {
      const test = doc.data();
      const timestamp = (test.timestamp as string) || '';
      const brand = (test.brand as string) || '';
      const citationRate = (test.citationRate as number) || 0;
      const results: any[] = (test.results as any[]) || [];

      for (const result of results) {
        const query: string = result.query || '';
        const platforms = result.platforms || {};

        for (const [platform, pResult] of Object.entries(platforms) as [string, any][]) {
          if (pResult.skipped) continue;

          const row: TrainingRow = {
            query,
            platform,
            cited: pResult.cited ?? false,
            citation_rate: citationRate,
            timestamp,
          };
          if (brand) row.brand = brand;
          if (pResult.excerpt) row.excerpt = pResult.excerpt;

          // Attach the embedding of the closest matching fact (exact-match on query text)
          const matchEmbed = factEmbeddings.get(query);
          if (matchEmbed) row.embedding = matchEmbed;

          rows.push(row);
        }
      }
    }

    // Sort chronologically
    rows.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (format === 'csv') {
      const headers = 'query,platform,cited,citation_rate,timestamp,brand,excerpt';
      const csv = [
        headers,
        ...rows.map(r =>
          [
            JSON.stringify(r.query),
            r.platform,
            r.cited ? '1' : '0',
            r.citation_rate,
            r.timestamp,
            JSON.stringify(r.brand || ''),
            JSON.stringify(r.excerpt || ''),
          ].join(',')
        ),
      ].join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="training-set.csv"',
        },
      });
    }

    // JSONL: one JSON object per line, optionally includes embeddings
    const includeEmbeddings = searchParams.get('embeddings') === '1';
    const jsonl = rows
      .map(r => {
        const out: any = { query: r.query, platform: r.platform, cited: r.cited, citation_rate: r.citation_rate, timestamp: r.timestamp };
        if (r.brand) out.brand = r.brand;
        if (r.excerpt) out.excerpt = r.excerpt;
        if (includeEmbeddings && r.embedding) out.embedding = r.embedding;
        return JSON.stringify(out);
      })
      .join('\n');

    return new Response(jsonl, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': 'attachment; filename="training-set.jsonl"',
      },
    });
  } catch (err: any) {
    console.error('export-training-set error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
