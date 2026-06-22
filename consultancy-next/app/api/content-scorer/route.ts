import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { ContentScorerSchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  const { requireTier } = await import('@/lib/api-auth');
  const authResult = await requireTier(request, 'Starter');
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { content, contentType } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Retrieve User's Facts for Cross-Referencing
    let userFactsStr = '';
    if (dbAdmin) {
      try {
        const factsSnap = await dbAdmin.collection('facts').where('userId', '==', userId).limit(20).get();
        if (!factsSnap.empty) {
          const factsList = factsSnap.docs.map((doc) => doc.data().statement);
          userFactsStr =
            "User's Master Facts from Fact Vault (Evaluate if the content successfully leverages these, or suggest where they could be injected):\n- " +
            factsList.join('\n- ');
        } else {
          userFactsStr =
            'The user has no facts stored in their Vault yet. Advise them to add verified statistics to their Fact Vault to improve Entity Density.';
        }
      } catch (dbErr) {
        console.warn('Failed to retrieve user facts from Firestore:', dbErr);
        userFactsStr = 'Could not fetch stored warehouse facts due to temporary offline-state.';
      }
    }

    // WS4: pull the lab's own validated findings (active, non-decayed) so the
    // scorer's advice is grounded in measured effect sizes, not just LLM opinion.
    // The real numbers are attached to the response server-side (below) so they
    // can't be hallucinated; here they steer the model's recommendations + honesty.
    interface Evidence {
      lever: string; headline: string; recommendation: string;
      diffPp: number | null; pValue: number | null; platform: string | null;
      verificationStatus: string; lastVerifiedAt: string | null;
    }
    let evidenceBase: Evidence[] = [];
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection('geo_findings').get();
        evidenceBase = snap.docs
          .map((d) => d.data() as any)
          .filter((f) => f.active && f.verificationStatus !== 'decayed' && f.topEffect)
          .map((f) => ({
            lever: f.lever,
            headline: f.headline || f.title || f.lever,
            recommendation: f.recommendation || '',
            diffPp: f.topEffect?.diffPp ?? null,
            pValue: f.topEffect?.pValue ?? null,
            platform: f.topEffect?.platform ?? null,
            verificationStatus: f.verificationStatus ?? 'unverified',
            lastVerifiedAt: f.lastVerifiedAt ?? null,
          }))
          .sort((a: Evidence, b: Evidence) => Math.abs(b.diffPp ?? 0) - Math.abs(a.diffPp ?? 0));
      } catch (e) {
        console.warn('content-scorer: failed to load geo_findings evidence:', e);
      }
    }
    const evidenceStr = evidenceBase.length
      ? `VALIDATED LEVERS FROM OUR OWN GEO LAB — each is a real A/B experiment result. Ground your recommendations in these and reference the effect size where relevant. Anything NOT in this list is a hypothesis and MUST be labelled "(hypothesis — not yet validated in our lab)":\n` +
        evidenceBase
          .map((e) => `- ${e.headline}: ${(e.diffPp ?? 0) > 0 ? '+' : ''}${e.diffPp}pp on ${e.platform} (p=${e.pValue}${e.verificationStatus === 'verified' && e.lastVerifiedAt ? `, re-verified ${String(e.lastVerifiedAt).slice(0, 10)}` : ''}) — ${e.recommendation}`)
          .join('\n')
      : 'No validated lab findings are available yet — clearly label ALL advice as "(hypothesis — not yet validated in our lab)".';

    const prompt = `
      You are an expert Generative Engine Optimization (GEO) agent.
      Analyze the following content for "Machine Readability" and its likelihood to be cited by AI Models (ChatGPT, Claude, Gemini).

      CRITICAL CONTEXT: The user has specified this content is intended for: "${contentType}".
      ${contentType === 'sales' ? 'Do NOT penalize the content for having marketing hooks, persuasive copy, or human-centric storytelling. Instead, evaluate how well they have WEAVED machine-readable facts, entities, and statistical anchors INTO the sales copy without destroying the human conversion rate. Suggest ways to add "Cite-Magnets" without ruining the sales pitch.' : ''}

      ${userFactsStr}

      ${evidenceStr}

      Evaluate the content provided below against these metrics:
      1. Entity Density: How many clear nouns, statistics, and verifiable facts are present? Did they use their Master Facts?
      2. Citation Likelihood: If an AI was asked about this topic, would it confidently cite this text as a source?
      3. Information Gain: Does this provide new, unique value over generic text?

      Content to evaluate:
      """${content.substring(0, 15000)}"""
      
      Return ONLY valid JSON matching this schema:
      {
        "overallScore": <int 0-100>,
        "entityDensityScore": <int 0-100>,
        "statisticalAnchorsScore": <int 0-100>,
        "invertedPyramidScore": <int 0-100>,
        "feedback": [<array of 2-3 short strings with actionable advice>],
        "rewrittenSnippet": "<A suggested rewrite of a weak paragraph to make more machine-readable while keeping the tone suited for this content type>"
      }
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: ContentScorerSchema,
      feature: 'content-scorer',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 500 }
      );
    }

    // Attach the validated evidence base to the response so the UI can render the
    // receipt for each recommendation ("+31pp on Claude, p=0.007, verified …").
    // Sourced from Firestore, not the model — these numbers are not hallucinable.
    return NextResponse.json({ success: true, result: result.data, evidence: evidenceBase });
  } catch (error: any) {
    console.error('Content Scorer endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
