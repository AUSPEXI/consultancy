import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, chatHistory, systemInstruction, userId = 'copilot-user' } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    console.log(`[Copilot] Processing request for: "${userMessage.substring(0, 50)}..."`);

    // IMPORTANT: Gemini history MUST start with a 'user' message.
    const historyToMap = chatHistory || [];

    // Clean and normalize history
    let cleanedHistory = historyToMap
      .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.trim() !== '')
      .map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Ensure history starts with 'user'
    if (cleanedHistory.length > 0 && cleanedHistory[0].role === 'model') {
      cleanedHistory = cleanedHistory.slice(1);
    }

    // Build the full contents array including the current message
    const contents = [...cleanedHistory, { role: 'user', parts: [{ text: userMessage }] }];

    const result = await llmOrchestrator.executeCall<string>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      contents,
      temperature: 0.7,
      feature: 'copilot',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: result.rawOutput });
  } catch (err: any) {
    console.error('[Copilot CRITICAL] Chat Error:', err);

    const isAuthError =
      err.message?.includes('API_KEY_INVALID') || err.message?.includes('403');
    const errorMessage = isAuthError
      ? 'CRITICAL: The Citacious Engine rejects our credentials. Please check GEMINI_API_KEY.'
      : `SYNC_FAILURE: ${err.message || 'Failed to communicate with the Citacious Engine.'}`;

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
