import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { ContentScorerSchema } from '@/lib/output-validation';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { content, contentType, userId } = await request.json();
    if (!content || !userId) {
      return NextResponse.json({ error: "Missing content or userId" }, { status: 400 });
    }

    let userFactsStr = "";
    if (dbAdmin) {
      const factsSnap = await dbAdmin.collection('facts').where('userId', '==', userId).limit(20).get();
      if (!factsSnap.empty) {
        const factsList = factsSnap.docs.map(doc => doc.data().statement);
        userFactsStr = "User's Master Facts:\n- " + factsList.join("\n- ");
      }
    }

    const prompt = `
      Analyze the following content for AI Citation Likelihood and GEO readability.
      Context: ${contentType}
      ${userFactsStr}
      Content: ${content}
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      prompt,
      schema: ContentScorerSchema
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
