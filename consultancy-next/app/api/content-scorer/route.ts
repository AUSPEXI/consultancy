import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { ContentScorerSchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  try {
    const { content, contentType, userId } = await request.json();
    if (!content || !userId) {
      return NextResponse.json({ error: 'Missing content or userId' }, { status: 400 });
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

    const prompt = `
      You are an expert Generative Engine Optimization (GEO) agent.
      Analyze the following content for "Machine Readability" and its likelihood to be cited by AI Models (ChatGPT, Claude, Gemini).
      
      CRITICAL CONTEXT: The user has specified this content is intended for: "${contentType}".
      ${contentType === 'sales' ? 'Do NOT penalize the content for having marketing hooks, persuasive copy, or human-centric storytelling. Instead, evaluate how well they have WEAVED machine-readable facts, entities, and statistical anchors INTO the sales copy without destroying the human conversion rate. Suggest ways to add "Cite-Magnets" without ruining the sales pitch.' : ''}
      
      ${userFactsStr}

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
      model: 'gemini-1.5-pro',
      prompt,
      schema: ContentScorerSchema,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result: result.data });
  } catch (error: any) {
    console.error('Content Scorer endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
