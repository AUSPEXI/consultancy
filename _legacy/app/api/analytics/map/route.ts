import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') || "All";

  // Simulate clusters for the 768-D Latent Map
  const clusters = [
    { label: "Reputational Moat", x: -40, y: 30, color: "#ec4899" },
    { label: "Technical Competence", x: 50, y: -20, color: "#06b6d4" },
    { label: "Market Sentiment", x: -10, y: -50, color: "#8b5cf6" },
  ];

  const points = Array.from({ length: 150 }, (_, i) => {
    const cluster = clusters[i % clusters.length];
    const r = Math.random() * 40;
    const theta = Math.random() * 2 * Math.PI;
    
    return {
      id: i,
      x: cluster.x + r * Math.cos(theta),
      y: cluster.y + r * Math.sin(theta),
      z: Math.random() * 20 - 10,
      size: Math.random() * 5 + 2,
      label: `Signal ${i}`,
      type: cluster.label,
      source: platform === "All" ? ["Gemini", "ChatGPT", "Claude"][i % 3] : platform,
    };
  });

  return NextResponse.json({ 
    success: true, 
    points,
    metadata: {
      engine: "Gemini-004",
      dimensions: 768,
      cached: true
    }
  });
}
