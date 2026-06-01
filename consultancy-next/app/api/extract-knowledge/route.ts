import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

// Server-side knowledge extraction from voice conversations.
// Keeps GEMINI_API_KEY off the client entirely.
export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { transcript } = await request.json();
    if (!Array.isArray(transcript) || transcript.length < 2) {
      return NextResponse.json({ success: true, extracted: 0 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ success: true, extracted: 0 });

    const ai = new GoogleGenAI({ apiKey });
    const conversationText = transcript.map((t: any) => `${t.role}: ${t.text}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following conversation between a user and an Auspexi AI agent.
Extract any NEW, USEFUL facts, frequently asked questions, or insights about the user's needs or Auspexi's services that the agent should remember for future conversations.
Do not extract personal information (like names or emails).
Format the output as a JSON array of objects with 'topic' and 'fact' string properties. If there is nothing useful to extract, return an empty array [].

Conversation:
${conversationText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              fact: { type: Type.STRING },
            },
            required: ['topic', 'fact'],
          },
        },
      },
    });

    const extractedFacts = JSON.parse(response.text || '[]');
    if (extractedFacts.length > 0 && dbAdmin) {
      const batch = dbAdmin.batch();
      const colRef = dbAdmin.collection('knowledge_graph');
      for (const factObj of extractedFacts) {
        batch.set(colRef.doc(), {
          topic: factObj.topic,
          fact: factObj.fact,
          source: 'voice_agent_conversation',
          createdAt: new Date().toISOString(),
          userId,
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, extracted: extractedFacts.length });
  } catch (err: any) {
    console.error('[extract-knowledge]', err);
    return NextResponse.json({ success: true, extracted: 0 }); // non-fatal
  }
}
