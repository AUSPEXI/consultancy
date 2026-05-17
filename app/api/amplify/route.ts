import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { AmplifySchema } from '@/lib/output-validation';
import { z } from 'zod';

const amplifyRequestSchema = z.object({
  fact: z.string().min(5).max(50000),
  userId: z.string().optional()
});

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?above/i,
  /new\s+instructions?:/i,
  /you\s+are\s+now/i,
];

function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

const SENSITIVE_PATTERNS = {
  creditCard: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

function filterSensitiveData(output: string): string {
  let filtered = output;
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    filtered = filtered.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
  });
  return filtered;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = amplifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    const { fact, userId = 'anonymous' } = parsed.data;

    if (detectPromptInjection(fact)) {
      return NextResponse.json({ error: "Security Policy Violation" }, { status: 400 });
    }

    const prompt = `
      You are an expert Generative Engine Optimization (GEO) and social media strategist.
      Take the following core fact and rewrite it into 6 distinct social media posts optimized for maximum engagement and AI citation indexing.
      
      Core Fact: "${fact}"
      
      Return ONLY a JSON object with keys: 'linkedin', 'reddit', 'twitter', 'youtube', 'tiktok', 'instagram'.
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      prompt,
      schema: AmplifySchema
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const filteredOutput = filterSensitiveData(JSON.stringify(result.data));
    return NextResponse.json(JSON.parse(filteredOutput));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
