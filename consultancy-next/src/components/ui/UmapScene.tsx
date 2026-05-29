'use client'

import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface MapPoint {
  id: number;
  x: number;
  y: number;
  z?: number;
  label: string;
  type?: string;
  sentiment: 'positive' | 'negative';
  distance: number;
}

function getSentimentLabel(index: number, data: MapPoint[]) {
  if (index % 10 === 0) return 'Grounding Point';
  return data[index].sentiment === 'positive' ? 'Positive Node' : 'Risk Node';
}

function getSentimentColor(index: number, data: MapPoint[]) {
  if (index % 10 === 0) return '#eab308';
  return data[index].sentiment === 'positive' ? '#10b981' : '#f43f5e';
}

function PointCloud({ points: data, onHoverChange }: { points: MapPoint[]; onHoverChange?: (h: boolean) => void }) {
  const pointRef = useRef<any>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPointerOver = useCallback((e: any) => {
    e.stopPropagation();
    const index = e.index;
    if (index !== undefined) {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      setHovered(prev => prev === index ? prev : index);
      onHoverChange?.(true);
    }
  }, [onHoverChange]);

  const onPointerOut = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHovered(null);
      onHoverChange?.(false);
    }, 100);
  }, [onHoverChange]);

  const { positions, colors, anchors } = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    const cols = new Float32Array(data.length * 3);
    const anchorMap = new Map<string, { x: number; y: number; z: number; sentiment: string; isYellow: boolean }>();

    data.forEach((p, i) => {
      const x = p.x / 10;
      const y = p.y / 10;
      const z = (p.z || 0) / 10;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Gold for every 10th (grounding anchor), green positive, red negative
      let nodeColor = p.sentiment === 'positive' ? '#10b981' : '#f43f5e';
      if (i % 10 === 0) nodeColor = '#eab308';

      const c = new THREE.Color(nodeColor);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      // One pillar per unique anchor name — dedup by Map key, cap at 7
      const anchorName = (p as any).anchorName;
      if (anchorName && anchorMap.size < 7 && !anchorMap.has(anchorName)) {
        anchorMap.set(anchorName, { x, y, z, sentiment: p.sentiment, isYellow: true });
      }
    });

    return {
      positions: pos,
      colors: cols,
      anchors: Array.from(anchorMap.entries())
        .map(([label, pos]) => ({ label, ...pos }))
        .slice(0, 5),
    };
  }, [data]);

  return (
    <group>
      <Points
        ref={pointRef}
        positions={positions}
        colors={colors}
        stride={3}
        frustumCulled={false}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        limit={data.length}
      >
        <PointMaterial
          transparent
          vertexColors
          size={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
          opacity={0.9}
        />
      </Points>

      {/* Hover tooltip */}
      {hovered !== null && data[hovered] && (
        <Html
          position={[positions[hovered * 3], positions[hovered * 3 + 1] + 0.5, positions[hovered * 3 + 2]]}
          pointerEvents="none"
          zIndexRange={[100, 0]}
          center
          distanceFactor={12}
        >
          <div
            className="px-3 py-2 bg-black/90 border-2 rounded-lg shadow-2xl backdrop-blur-xl min-w-[160px] animate-in fade-in zoom-in duration-100 pointer-events-none"
            style={{ borderColor: `${getSentimentColor(hovered, data)}66` }}
          >
            <div className="flex justify-between items-start mb-1">
              <p className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: getSentimentColor(hovered, data) }}>
                {getSentimentLabel(hovered, data)}
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/20" />)}
              </div>
            </div>
            <p className="text-sm font-bold text-white tracking-tight border-b border-white/10 pb-1 mb-1">
              {data[hovered].label}
            </p>
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[9px]">
                <span className="text-zinc-500 font-mono">WEIGHT:</span>
                <span className="font-mono text-zinc-300">{Math.round((1 - data[hovered].distance) * 100)}%</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-zinc-500 font-mono">SOURCE:</span>
                <span className="font-mono text-zinc-300">GEO_SYNC</span>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Semantic Anchor Pillars */}
      {anchors.map((p, i) => {
        const color = p.isYellow ? '#eab308' : (p.sentiment === 'positive' ? '#00ffa3' : '#ff003c');
        const emissive = color;
        const bodyColor = p.isYellow ? '#715808' : (p.sentiment === 'positive' ? '#065f46' : '#991b1b');
        const groundY = -5;
        const lineHeight = Math.abs(groundY - p.y);

        return (
          <group key={`anchor-${i}`} position={[p.x, p.y, p.z]}>
            {/* Grounding line */}
            <mesh position={[0, (groundY - p.y) / 2, 0]}>
              <cylinderGeometry args={[0.005, 0.05, lineHeight, 4]} />
              <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
            {/* Ring on grid floor */}
            <mesh position={[0, groundY - p.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.4, 0.45, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
            {/* Glowing core sphere */}
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Floating monolith box */}
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.3, 0.6, 0.3]} />
              <meshStandardMaterial
                color={bodyColor}
                emissive={emissive}
                emissiveIntensity={3}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Floating label */}
            <Html distanceFactor={15} position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
              <div
                className="pointer-events-none px-4 py-2 bg-black/80 backdrop-blur-md border-2 rounded shadow-[0_0_25px_rgba(0,0,0,0.9)]"
                style={{ borderColor: color }}
              >
                <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5 opacity-80" style={{ color }}>
                  {p.isYellow ? 'Master Anchor' : 'Semantic Anchor'}
                </p>
                <span className="text-xs font-bold text-white whitespace-nowrap tracking-tight">{p.label}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Latent space grid floor */}
      <gridHelper args={[20, 20, '#ffffff', '#a1a1aa']} position={[0, -5, 0]} />
    </group>
  );
}

export default function UmapScene({ points = [] }: { points?: any[] }) {
  const [isHovered, setIsHovered] = useState(false);

  const mockPoints = useMemo<MapPoint[]>(() => {
    if (points && points.length > 0) {
      return points.map((p: any, i: number) => ({
        id: i,
        x: p.x ?? 0,
        y: p.y ?? 0,
        z: p.z ?? 0,
        // label = fact text for hover tooltip (truncated); anchorName = TEO anchor for pillar
        label: (p.label || p.type || 'Signal').substring(0, 50),
        anchorName: p.type || 'Anchor',
        type: p.groupType || p.type,
        sentiment: (p.sentiment === 'positive' || p.sentiment === 'negative') ? p.sentiment : (p.distance < 0.5 ? 'positive' : 'negative'),
        distance: p.distance ?? Math.random(),
      }));
    }

    // Rich fallback demo data — 3 semantic clusters
    const clusters = [
      { x: -50, y: 40, label: 'Reputational Moat' },
      { x: 60, y: -30, label: 'Technical Competence' },
      { x: -20, y: -60, label: 'Pricing Perception' },
    ];

    const labels = ['Security', 'API', 'Founder', 'Tokenomics', 'Market', 'Github', 'Patent', 'Discord', 'Reddit', 'Enterprise', 'Latency', 'Drift'];

    return Array.from({ length: 60 }, (_, i) => {
      const cluster = clusters[i % clusters.length];
      const theta = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 50;
      return {
        id: i,
        x: cluster.x + r * Math.cos(theta),
        y: cluster.y + r * Math.sin(theta),
        z: Math.random() * 40 - 20,
        label: labels[i % labels.length],
        type: i % 15 === 0 ? 'Anchor' : undefined,
        sentiment: Math.random() > 0.4 ? 'positive' : 'negative',
        distance: Math.random(),
      };
    });
  }, [points]);

  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 45 }} frameloop="demand">
      <color attach="background" args={['#09090b']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <PointCloud points={mockPoints} onHoverChange={setIsHovered} />
      <OrbitControls
        enablePan={false}
        enableZoom
        autoRotate={false}
        maxDistance={25}
        minDistance={8}
        makeDefault
      />
    </Canvas>
  );
}
