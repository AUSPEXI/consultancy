import React, { useState, useEffect, useRef } from 'react';
import { Layers, HelpCircle, Shield, Globe, Award } from 'lucide-react';

interface Point {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  model: 'gemini' | 'chatgpt' | 'claude';
  label: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  color: string;
}

interface AnchorNode {
  name: string;
  type: 'Positive Anchor' | 'Risk Anchor';
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  desc: string;
}

const POINTS_DATA: Point[] = [
  // Gemini
  { x: 100, y: 50, z: -100, ox: 100, oy: 50, oz: -100, model: 'gemini', label: 'Enterprise Security API', sentiment: 'positive', color: '#10b981' },
  { x: 120, y: 80, z: -80, ox: 120, oy: 80, oz: -80, model: 'gemini', label: 'Highly Scaleable Infrastructure', sentiment: 'positive', color: '#10b981' },
  { x: 80, y: 40, z: -120, ox: 80, oy: 40, oz: -120, model: 'gemini', label: 'High-Integrity Data Seeding', sentiment: 'positive', color: '#10b981' },
  { x: -50, y: -80, z: 120, ox: -50, oy: -80, oz: 120, model: 'gemini', label: 'Hallucination: Pricing Lag', sentiment: 'negative', color: '#ef4444' },
  { x: 30, y: -20, z: 40, ox: 30, oy: -20, oz: 40, model: 'gemini', label: 'Neutral Brand Mention', sentiment: 'neutral', color: '#64748b' },
  
  // ChatGPT
  { x: -120, y: 100, z: 80, ox: -120, oy: 100, oz: 80, model: 'chatgpt', label: 'Developer-First Mindshare', sentiment: 'positive', color: '#10b981' },
  { x: -140, y: 60, z: 110, ox: -140, oy: 60, oz: 110, model: 'chatgpt', label: 'Dominant Category Citation', sentiment: 'positive', color: '#10b981' },
  { x: -90, y: 120, z: 40, ox: -90, oy: 120, oz: 40, model: 'chatgpt', label: 'Trustworthy Agent Integration', sentiment: 'positive', color: '#10b981' },
  { x: 140, y: -130, z: -50, ox: 140, oy: -130, oz: -50, model: 'chatgpt', label: 'Risk: Outdated Competitor Memory', sentiment: 'negative', color: '#ef4444' },
  
  // Claude
  { x: 50, y: -120, z: -140, ox: 50, oy: -120, oz: -140, model: 'claude', label: 'Exceptional Coding Moat', sentiment: 'positive', color: '#10b981' },
  { x: 30, y: -150, z: -100, ox: 30, oy: -150, oz: -100, model: 'claude', label: 'Highly Accurate Synthesis', sentiment: 'positive', color: '#10b981' },
  { x: 90, y: -100, z: -120, ox: 90, oy: -100, oz: -120, model: 'claude', label: 'Systemic Compliance Signal', sentiment: 'positive', color: '#10b981' },
  { x: -100, y: -50, z: 90, ox: -100, oy: -50, oz: 90, model: 'claude', label: 'Hallucination: Legacy Tech Misclustering', sentiment: 'negative', color: '#ef4444' }
];

const ANCHORS_DATA: AnchorNode[] = [
  { name: 'SOC2 Trust Anchor', type: 'Positive Anchor', x: 150, y: 150, z: 150, ox: 150, oy: 150, oz: 150, desc: 'Enterprise trust beacon validating secure operations' },
  { name: 'Pricing Hallucination', type: 'Risk Anchor', x: -150, y: -150, z: -150, ox: -150, oy: -150, oz: -150, desc: 'Outdated blog metrics claiming 2024 starter pricing structure' }
];

export function UmapVisualization() {
  const [selectedModel, setSelectedModel] = useState<'all' | 'gemini' | 'chatgpt' | 'claude'>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleXRef = useRef(0.005);
  const angleYRef = useRef(0.005);

  const [hoveredDetails, setHoveredDetails] = useState<{
    name: string;
    type: string;
    description: string;
    coordinates?: string;
  } | null>(null);

  // Rotation setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let points = JSON.parse(JSON.stringify(POINTS_DATA)) as Point[];
    let anchors = JSON.parse(JSON.stringify(ANCHORS_DATA)) as AnchorNode[];

    let animationId: number;

    const rotateX = (p: { x: number; y: number; z: number }, rad: number) => {
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const y1 = p.y * cos - p.z * sin;
      const z1 = p.z * cos + p.y * sin;
      p.y = y1;
      p.z = z1;
    };

    const rotateY = (p: { x: number; y: number; z: number }, rad: number) => {
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const x1 = p.x * cos - p.z * sin;
      const z1 = p.z * cos + p.x * sin;
      p.x = x1;
      p.z = z1;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      // Update rotation
      points.forEach(p => {
        rotateX(p, angleXRef.current);
        rotateY(p, angleYRef.current);
      });

      anchors.forEach(a => {
        rotateX(a, angleXRef.current);
        rotateY(a, angleYRef.current);
      });

      // Filter points
      const activePoints = points.filter(p => selectedModel === 'all' || p.model === selectedModel);

      // Render links between points to build structure
      ctx.lineWidth = 0.5;
      for (let i = 0; i < activePoints.length; i++) {
        for (let j = i + 1; j < activePoints.length; j++) {
          const p1 = activePoints[i];
          const p2 = activePoints[j];
          // Proportional distance link
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
          if (dist < 180) {
            const alpha = Math.max(0, 1 - dist / 180) * 0.15;
            ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(cx + p1.x, cy + p1.y);
            ctx.lineTo(cx + p2.x, cy + p2.y);
            ctx.stroke();
          }
        }
      }

      // Render point nodes
      activePoints.forEach(p => {
        const size = Math.max(1, (300 + p.z) / 100);
        ctx.fillStyle = p.sentiment === 'positive' ? '#10b981' : p.sentiment === 'negative' ? '#ef4444' : '#64748b';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Render anchor monolith nodes (cube projection)
      anchors.forEach(a => {
        const size = Math.max(4, (300 + a.z) / 40);
        ctx.fillStyle = a.type === 'Positive Anchor' ? '#a855f7' : '#f97316';
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(cx + a.x - size/2, cy + a.y - size/2, size, size);
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(a.name, cx + a.x + 8, cy + a.y + 4);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [selectedModel]);

  // Match canvas resolution to container size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const panel = canvas.parentElement;
      if (!panel) return;
      canvas.width = panel.offsetWidth || 600;
      canvas.height = panel.offsetHeight || 400;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid md:grid-cols-3 gap-8 p-6 bg-[#0B0E14] border border-zinc-800 rounded-3xl relative overflow-hidden group">
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, #EC4899 1px, transparent 1px), linear-gradient(to bottom, #EC4899 1px, transparent 1px)`, backgroundSize: '24px 24px', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }} />
      
      {/* Visual Canvas Panel */}
      <div className="md:col-span-2 flex flex-col items-center justify-center relative bg-zinc-950/40 rounded-2xl border border-zinc-900 min-h-[400px]">
        <canvas
          ref={canvasRef}
          className="cursor-all-scroll"
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            angleYRef.current = x * 0.00005;
            angleXRef.current = y * 0.00005;
          }}
          onMouseLeave={() => {
            angleXRef.current = 0.003;
            angleYRef.current = 0.003;
          }}
        />

        {/* Floating Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-between items-center bg-zinc-950/90 border border-zinc-850 p-3 rounded-xl backdrop-blur-md">
          <div className="flex gap-1">
            {(['all', 'gemini', 'chatgpt', 'claude'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all border ${selectedModel === m ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            768-D GEMINI PROJECTION
          </span>
        </div>
      </div>

      {/* Control / Details Sidebar Panel */}
      <div className="p-4 flex flex-col justify-between border-l border-zinc-900">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-pink-500" />
              Latent Embeds Map
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              3D coordinate projection of semantic citations. Distances represent model relevance similarity scores.
            </p>
          </div>

          {/* Model Status Indicators */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-900/60 pb-2">
              <span className="text-zinc-500">Positive Anchors:</span>
              <span className="text-emerald-400 font-bold">10 Nodes</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-900/60 pb-2">
              <span className="text-zinc-500">Risk Anchors:</span>
              <span className="text-orange-400 font-bold">2 Nodes</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-500">Total Audit Size:</span>
              <span className="text-pink-400 font-bold">1,024 Inference Paths</span>
            </div>
          </div>

          {/* Active Semantic Anchor Panel */}
          <div id="umap-explanation-card" className="p-4 bg-zinc-950/80 border border-zinc-850 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white font-mono uppercase">Interactive Anchor Point</span>
            </div>
            <p className="text-xs text-zinc-400 leading-normal">
              Hover and slide on any sector to update rotational vector dimensions. Monolith nodes define high-consensus semantic beacons.
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-900 pt-3">
          AUDIT ID: LTM_768_GEMINI_004
        </div>
      </div>
    </div>
  );
}
export default UmapVisualization;
