import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const platform = searchParams.get('platform') || "All";
  const timeframe = searchParams.get('timeframe') || "current";

  // Default clusters if no custom ones exist
  let clusters = [
    { x: -50, y: 40, label: "Reputational Moat", color: "#ec4899", baseType: "Systemic Anchor" },
    { x: 60, y: -30, label: "Technical Competence", color: "#06b6d4", baseType: "Signal Point" },
    { x: -20, y: -60, label: "Pricing Perception", color: "#8b5cf6", baseType: "Emergent Trend" },
  ];

  // Fetch custom clusters from Firestore if userId provided
  if (userId && dbAdmin) {
    try {
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (data?.latentAnchors && Array.isArray(data.latentAnchors) && data.latentAnchors.length > 0) {
          // Assign fixed coordinates to anchors for deterministic clusters
          clusters = data.latentAnchors.map((a: any, idx: number) => ({
            ...a,
            x: idx === 0 ? -60 : idx === 1 ? 70 : idx === 2 ? -10 : idx === 3 ? 40 : -30,
            y: idx === 0 ? 50 : idx === 1 ? -40 : idx === 2 ? -70 : idx === 3 ? 20 : 10
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching custom anchors:", err);
    }
  }
  
  // Shift centers slightly based on platform to simulate different model biases
  const biasX = platform === 'Gemini' ? 20 : platform === 'ChatGPT' ? -20 : platform === 'Claude' ? 0 : 0;
  const biasY = platform === 'Gemini' ? -10 : platform === 'ChatGPT' ? 20 : platform === 'Claude' ? -30 : 0;

  // Simulate "drift" for historical snapshots
  const driftFactor = timeframe === 'month' ? 1.5 : timeframe === 'week' ? 0.7 : 0;
  const timeSeed = timeframe === 'month' ? 30 : timeframe === 'week' ? 7 : 1;

  const clustersWithBias = clusters.map((c, i) => ({
    ...c,
    x: c.x + biasX + (driftFactor * (i + 1) * 2),
    y: c.y + biasY - (driftFactor * (i + 1) * 1.5)
  }));

  const points = Array.from({ length: 120 }, (_, i) => {
    const cluster = clustersWithBias[i % clustersWithBias.length];
    const theta = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * 50; 
    
    const individualDrift = Math.sin(i + timeSeed) * driftFactor * 2;
    
    return {
      id: i,
      x: cluster.x + r * Math.cos(theta) + individualDrift,
      y: cluster.y + r * Math.sin(theta) - individualDrift,
      z: (Math.random() * 40 - 20) + (individualDrift * 2),
      size: Math.floor(Math.random() * 6) + 3,
      type: cluster.label,
      groupType: cluster.baseType,
      source: platform === "All" ? ["Gemini", "ChatGPT", "Claude"][i % 3] : platform,
      label: [
        "Security Compliance", "API Latency", "Founder History", 
        "Tokenomics", "Market Share", "Github Activity",
        "Patent Filing", "Discord Sentiment", "Reddit Leak",
        "Enterprise Trust", "Latency Spike", "Model Drift"
      ][i % 12],
      distance: Math.random(),
      sentiment: Math.random() > 0.4 ? 'positive' : 'negative',
    };
  });

  return NextResponse.json({ 
    success: true, 
    points, 
    metadata: { 
      engine: "Gemini-Embed-004", 
      dimensions: 768,
      cached: true,
      timeframe
    }
  });
}
