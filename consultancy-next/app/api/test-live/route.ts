import { NextResponse } from 'next/server';

// Diagnostic: checks whether the Gemini API key can reach bidiGenerateContent
// by listing available models and filtering for ones that support it.
export async function GET() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 });

  try {
    // List models on v1beta
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data }, { status: r.status });

    const models: any[] = data.models || [];
    const liveModels = models.filter((m: any) =>
      (m.supportedGenerationMethods || []).includes('bidiGenerateContent')
    );

    return NextResponse.json({
      totalModels: models.length,
      liveModels: liveModels.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        methods: m.supportedGenerationMethods,
      })),
      allModelNames: models.map((m: any) => m.name),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
