import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const now = new Date();

    // Generate simulated real-time ingestion pulse with date and zScore
    const pulse = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setMinutes(now.getMinutes() - (29 - i) * 30); // 30 min intervals

      // "drift" pulse - usually calm, with occasional spikes (anomalies)
      const baseNoise = Math.random() * 0.5 - 0.25;
      const spike = i === 15 || i === 25 ? (Math.random() > 0.5 ? 3.5 : -3.5) : 0;
      const zScore = parseFloat((baseNoise + spike).toFixed(2));

      return {
        date: date.toISOString(),
        zScore,
        isAnomaly: Math.abs(zScore) > 2.5,
        mentions: Math.floor(Math.random() * 100) + 20,
        citations: Math.floor(Math.random() * 40) + 10,
        nodeShift: Math.abs(zScore * 10), // Visual indicator for node movement
      };
    });

    return NextResponse.json({ success: true, pulse });
  } catch (error: any) {
    console.error('Error in analytics/pulse:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
