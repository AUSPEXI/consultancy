import { NextResponse } from 'next/server';

// Diagnostic: checks every key for bidiGenerateContent support.
// Visit /api/test-live to see which key is active and what Live API models it can use.
export async function GET() {
  const keys = {
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
    GEMINI_LIVE_API_KEY: process.env.GEMINI_LIVE_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  };

  const activeKey = keys.VITE_GEMINI_API_KEY || keys.GEMINI_LIVE_API_KEY || keys.GEMINI_API_KEY;
  if (!activeKey) return NextResponse.json({ error: 'No Gemini API key set in Netlify environment' }, { status: 503 });

  const results: Record<string, any> = {};

  for (const [name, key] of Object.entries(keys)) {
    if (!key) { results[name] = 'not set'; continue; }
    const masked = key.slice(0, 8) + '...' + key.slice(-4);
    try {
      // Check v1beta
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`,
      );
      const data = await r.json();
      if (!r.ok) { results[name] = { masked, error: data?.error?.message || r.status }; continue; }

      const models: any[] = data.models || [];
      const liveModels = models.filter((m: any) =>
        (m.supportedGenerationMethods || []).includes('bidiGenerateContent')
      );

      // Also check v1alpha
      const ra = await fetch(
        `https://generativelanguage.googleapis.com/v1alpha/models?key=${key}&pageSize=200`,
      );
      const dataA = await ra.json();
      const modelsA: any[] = (dataA.models || []);
      const liveModelsA = modelsA.filter((m: any) =>
        (m.supportedGenerationMethods || []).includes('bidiGenerateContent')
      );

      results[name] = {
        masked,
        v1beta: { totalModels: models.length, liveModels: liveModels.map((m: any) => m.name) },
        v1alpha: { totalModels: modelsA.length, liveModels: liveModelsA.map((m: any) => m.name) },
      };
    } catch (err: any) {
      results[name] = { masked, error: err.message };
    }
  }

  return NextResponse.json({ keyResults: results, activeKeyUsed: Object.keys(keys).find(k => (keys as any)[k] === activeKey) });
}
