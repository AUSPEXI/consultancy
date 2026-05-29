import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!key) {
    return NextResponse.json({
      success: false,
      stage: 'key-check',
      error: 'No GEMINI_API_KEY or VITE_GEMINI_API_KEY found in environment',
      envKeysPresent: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE')),
    });
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: key });
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Reply with the single word: working',
      config: { temperature: 0 },
    });

    return NextResponse.json({
      success: true,
      keyPrefix: key.substring(0, 8) + '...',
      response: result.text,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      stage: 'api-call',
      keyPrefix: key.substring(0, 8) + '...',
      error: e.message,
      status: e.status,
      errorDetails: e.errorDetails || e.cause || null,
    });
  }
}
