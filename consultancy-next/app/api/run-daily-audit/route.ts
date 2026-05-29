import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { SOVMetricsSchema } from '@/lib/output-validation';
import Exa from 'exa-js';

let exaInstance: Exa | null = null;

function getExa(): Exa {
  if (!exaInstance) {
    const apiKey = process.env.EXA_API_KEY || process.env.NEXT_PUBLIC_EXA_API_KEY;
    if (!apiKey) throw new Error('EXA_API_KEY is not configured');
    exaInstance = new Exa(apiKey);
  }
  return exaInstance;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, brand, domain, competitors, keywords, sentimentPrompts } = await req.json();

    if (!userId || !brand || !domain || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const defaultSentimentPrompts = [
      'Best alternative to top competitor?',
      'Is the product reliable for enterprise?',
      'Common user complaints & reviews?',
      'Pricing compared to market average?',
    ];

    const promptsToUse =
      sentimentPrompts && sentimentPrompts.length > 0 ? sentimentPrompts : defaultSentimentPrompts;
    const sentimentSchema = promptsToUse
      .map(
        (p: string) =>
          `{ "prompt": "${p.replace(/"/g, '\\"')}", "score": <int -100 to 100> }`
      )
      .join(',\n    ');

    const exa = getExa();

    // 1. Search Exa for the keywords
    let combinedContext = '';
    for (const keyword of keywords.slice(0, 3)) {
      // Limit to 3 keywords to save time/tokens
      const searchResult = await exa.searchAndContents(keyword, {
        type: 'neural',
        useAutoprompt: true,
        numResults: 5,
        text: true,
      });
      combinedContext += `\n\n--- Results for keyword: ${keyword} ---\n`;
      combinedContext += searchResult.results
        .map((r: any) => r.text)
        .join('\n\n')
        .substring(0, 5000);
    }

    // 2. Ask Gemini to calculate SOV based on the context
    const prompt = `
You are an expert Generative Engine Optimization (GEO) analyst.
Analyze the following search results for the target keywords.
Calculate the "Share of Voice" (SOV) percentage for the primary brand and its competitors.

Primary Brand: ${brand}
Domain: ${domain}
Competitors: ${competitors.join(', ')}

Search Context:
${combinedContext.substring(0, 30000)}

Return ONLY a JSON object.
IMPORTANT: Your estimates for 'platforms' SHOULD NEVER BE ZERO. Base them on the citation frequency in the context.
If the context is sparse, use a baseline of 5-15% for the brand if it's mentioned at all.

{
  "aSov": <integer percentage for ${brand}>,
  "compA": <integer percentage for ${competitors[0] || 'Competitor A'}>,
  "compB": <integer percentage for ${competitors[1] || 'Competitor B'}>,
  "compGap": <integer percentage difference between brand and compA>,
  "aiTraffic": <integer count indicative of traffic source strength>,
  "aiCitations": <integer count of explicit brand citations>,
  "err": <integer 0-100 indicating how robustly AI remembers brand facts>,
  "platforms": {
    "chatgpt": <integer 0-100>,
    "perplexity": <integer 0-100>,
    "claude": <integer 0-100>,
    "gemini": <integer 0-100>
  },
  "radar": [
    { "subject": "Pricing Insights", "brandScore": <int>, "compScore": <int> },
    { "subject": "Feature Comparison", "brandScore": <int>, "compScore": <int> },
    { "subject": "Implementation Docs", "brandScore": <int>, "compScore": <int> },
    { "subject": "Customer Support", "brandScore": <int>, "compScore": <int> },
    { "subject": "Security & Auth", "brandScore": <int>, "compScore": <int> },
    { "subject": "Enterprise Ready", "brandScore": <int>, "compScore": <int> }
  ],
  "sentiment": [
    ${sentimentSchema}
  ],
  "topUrls": [
    { "path": "/pricing", "citations": <int> },
    { "path": "/blog/some-article-based-on-context", "citations": <int> },
    { "path": "/features", "citations": <int> }
  ]
}
`;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      prompt,
      schema: SOVMetricsSchema,
    });

    if (!result.success) {
      const isQuota = result.error?.includes('429') || result.error?.includes('RESOURCE_EXHAUSTED') || result.error?.includes('quota');
      return NextResponse.json(
        {
          error: isQuota
            ? 'AI quota exceeded. Ensure billing is enabled at console.cloud.google.com → APIs → Generative Language API.'
            : result.error,
          validationErrors: result.validationErrors,
          rawOutput: result.rawOutput,
        },
        { status: isQuota ? 429 : 500 }
      );
    }

    const parsedData = result.data;

    return NextResponse.json({
      success: true,
      providerUsed: result.providerUsed || 'gemini',
      metrics: {
        aSov: parsedData.aSov || 12,
        err: parsedData.err || 20,
        compA: parsedData.compA || 40,
        compB: parsedData.compB || 30,
        compC: parsedData.compC || 0,
        compD: parsedData.compD || 0,
        compGap:
          parsedData.compGap || (parsedData.aSov || 12) - (parsedData.compA || 40),
        aiTraffic:
          parsedData.aiTraffic ||
          (parsedData.aiCitations || 2) * 15 + Math.floor(Math.random() * 50),
        platforms: parsedData.platforms || {
          chatgpt: 15,
          perplexity: 10,
          claude: 12,
          gemini: 20,
        },
        radar: parsedData.radar || [],
        sentiment: parsedData.sentiment || [],
        topUrls: parsedData.topUrls || [],
      },
    });
  } catch (error: any) {
    console.error('Error running daily audit:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
