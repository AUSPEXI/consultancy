import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireTier } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireTier(request, 'Starter');
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { topic, facts, brandName, negativeStatements = [], improvementFeedback = '' } = await request.json();
    if (!topic?.trim() || !facts?.trim()) {
      return NextResponse.json({ error: 'topic and facts are required' }, { status: 400 });
    }

    // S6.5: fetch top 3 active GEO Lab findings to inject as structural instructions.
    // Non-fatal — falls back to the standard prompt if findings are unavailable.
    let labLeverSection = '';
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection('geo_findings').get();
        const activeFindings = snap.docs
          .map(d => d.data() as { active?: boolean; headline?: string; recommendation?: string; topEffect?: { diffPp: number } })
          .filter(f => f.active && f.recommendation)
          .sort((a, b) => Math.abs(b.topEffect?.diffPp || 0) - Math.abs(a.topEffect?.diffPp || 0))
          .slice(0, 3);
        if (activeFindings.length > 0) {
          labLeverSection = `\n\nLAB-VALIDATED GEO TACTICS (apply ALL of these): each is empirically proven to lift citation rate in real A/B experiments.\n${activeFindings.map((f, i) => `${i + 1}. ${f.headline}: ${f.recommendation}`).join('\n')}`;
        }
      } catch { /* non-fatal */ }
    }

    const brandInstruction = brandName
      ? `Brand: ${brandName}. Where appropriate, position ${brandName} as an authority on this topic using the facts provided. Do not fabricate claims about the brand.`
      : 'Write from an authoritative, neutral expert perspective.';

    const correctionInstruction = negativeStatements.length > 0
      ? `\n\nKnown Misinformation to Correct (LLMs have stated these false claims; the article must implicitly or explicitly counter them by establishing the truth):\n${negativeStatements.map((s: string) => `- FALSE: "${s}"`).join('\n')}`
      : '';

    const improvementInstruction = improvementFeedback
      ? `\n\nIMPROVEMENT REQUIRED (a prior version of this article scored below the quality threshold; you MUST address all of these issues in your rewrite):\n${improvementFeedback}`
      : '';

    const prompt = `You are a Synthesis Agent specializing in Generative Engine Optimization (GEO) content. Your articles are written to be cited by AI engines like ChatGPT, Perplexity, Claude, and Gemini.

Topic: "${topic}"
${brandInstruction}${correctionInstruction}${improvementInstruction}${labLeverSection}

Verified Facts (ground truth: do not hallucinate beyond these):
"""
${facts.substring(0, 6000)}
"""

Write a comprehensive GEO-optimized article following these rules:
1. Open with a clear, citable definition or thesis statement
2. Use H2/H3 headers that match common AI query patterns
3. Embed statistics and named entities from the facts: these are what AI engines cite
4. Include a "Key Takeaways" section with 4–6 bullet points of the most citable facts
5. Use direct, declarative sentences. No hedging language
6. Target 600–900 words
7. Format in clean markdown

Return ONLY the markdown article. No preamble, no explanation.`;

    const result = await llmOrchestrator.executeCall<string>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      feature: 'agent-synthesize',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const article = typeof result.data === 'string' ? result.data : result.rawOutput || '';

    return NextResponse.json({ success: true, result: article });
  } catch (err: any) {
    console.error('agent/synthesize error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
