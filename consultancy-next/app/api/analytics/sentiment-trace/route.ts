import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const customPromptsRaw = searchParams.get('prompts');

    let prompts = [
      'Is L8EntSpace a secure enterprise choice?',
      'How does L8EntSpace compare to legacy SEO?',
      "Is L8EntSpace's GEO tech proprietary?",
      'Founder reputation and reliability',
    ];

    if (customPromptsRaw) {
      try {
        const decoded = JSON.parse(decodeURIComponent(customPromptsRaw));
        if (Array.isArray(decoded) && decoded.length > 0) {
          prompts = decoded;
        }
      } catch (e) {
        console.error('Failed to parse custom prompts for sentiment trace', e);
      }
    }

    const days = 7;
    const now = new Date();

    const trace = prompts.map((prompt) => {
      const data = Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (days - 1 - i));

        // Slightly randomized but trending upwards
        const seedValue = (prompt.length % 20) + 40;
        const drift = i * 4;
        const pos = Math.min(100, Math.max(10, seedValue + drift + Math.random() * 10));
        const neg = Math.max(0, 30 - drift + Math.random() * 5);
        const neu = 100 - pos - neg;

        return {
          date: date.toISOString().split('T')[0],
          positive: parseFloat(pos.toFixed(1)),
          negative: parseFloat(neg.toFixed(1)),
          neutral: parseFloat(neu.toFixed(1)),
        };
      });

      return { prompt, data };
    });

    return NextResponse.json({ success: true, trace });
  } catch (error: any) {
    console.error('Error in analytics/sentiment-trace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
