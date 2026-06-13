import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import { requireTier } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

// Server-side knowledge extraction from voice conversations.
// Keeps GEMINI_API_KEY off the client entirely.
export async function POST(request: Request) {
  const authResult = await requireTier(request, 'Starter');
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { transcript } = await request.json();
    if (!Array.isArray(transcript) || transcript.length < 2) {
      return NextResponse.json({ success: true, extracted: 0 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (!geminiKey && !openaiKey) return NextResponse.json({ success: true, extracted: 0 });

    const conversationText = transcript.map((t: any) => `${t.role}: ${t.text}`).join('\n');
    const extractionPrompt = `Analyze the following conversation between a user and an L8EntSpace AI agent.
Extract any NEW, USEFUL facts, frequently asked questions, or insights about the user's needs or L8EntSpace's services that the agent should remember for future conversations.
Do not extract personal information (like names or emails).
Format the output as a JSON array of objects with 'topic' and 'fact' string properties. If there is nothing useful to extract, return an empty array [].

Conversation:
${conversationText}`;

    let rawText = '';
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: extractionPrompt,
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
        rawText = response.text || '[]';
      } catch (e: any) {
        const fatal = e.message?.includes('403') || e.message?.includes('suspended') ||
          e.message?.includes('401') || e.message?.includes('ACCOUNT_STATE_INVALID');
        if (!fatal || !openaiKey) throw e;
      }
    }

    if (!rawText && openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey });
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt + '\n\nRespond with ONLY a JSON array.' }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });
      const content = r.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      rawText = JSON.stringify(Array.isArray(parsed) ? parsed : parsed.facts || parsed.items || []);
    }

    const extractedFacts = JSON.parse(rawText || '[]');
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
