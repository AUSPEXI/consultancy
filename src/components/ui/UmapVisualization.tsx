import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Center, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MapPoint {
  id: number;
  x: number;
  y: number;
  z?: number;
  label: string;
  type: string;
  sentiment: 'positive' | 'negative';
  distance: number;
}

function PointCloud({ points: data }: { points: MapPoint[] }) {
  const ref = useRef<THREE.Points>(null!);
  const [hovered, setHovered] = useState<number | null>(null);
  
  const { positions, colors, anchors } = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    const cols = new Float32Array(data.length * 3);
    
    // Identified major clusters/anchors in the data
    const anchorMap = new Map<string, { x: number, y: number, z: number, sentiment: string }>();

    data.forEach((p, i) => {
      const x = p.x / 10;
      const y = p.y / 10;
      const z = (p.z || (Math.random() * 10 - 5)) / 10; // Slightly flatter for better perception 
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // More distinct colors
      const color = new THREE.Color(p.sentiment === 'positive' ? '#10b981' : '#f43f5e');
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;

      // Anchor nodes from base types defined in server
      if (p.type.includes('Anchor') || i % 20 === 0) {
        anchorMap.set(p.label, { x, y, z, sentiment: p.sentiment });
      }
    });
    
    return { 
      positions: pos, 
      colors: cols,
      anchors: Array.from(anchorMap.entries()).map(([label, pos]) => ({ label, ...pos })).slice(0, 4) // Max 4 to keep focus
    };
  }, [data]);

  const onPointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(e.index);
  }, []);

  const onPointerOut = useCallback(() => {
    setHovered(null);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current && !hovered) {
       ref.current.rotation.y = t * 0.01;
    }
  });

  return (
    <group>
      <Points 
        ref={ref} 
        positions={positions} 
        colors={colors} 
        stride={3} 
        frustumCulled={false}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <PointMaterial
          transparent
          vertexColors
          size={0.6}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
          opacity={0.9}
        />
      </Points>
      
      {/* Interactive Hover Label */}
      {hovered !== null && data[hovered] && (
        <Html 
          position={[positions[hovered * 3], positions[hovered * 3 + 1], positions[hovered * 3 + 2]]} 
          pointerEvents="none"
          zIndexRange={[100, 0]}
        >
          <div className="px-3 py-2 bg-zinc-950/95 border border-pink-500/50 rounded-lg shadow-2xl backdrop-blur-xl min-w-[140px]">
            <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">{data[hovered].sentiment} signal</p>
            <p className="text-xs font-bold text-white whitespace-nowrap">{data[hovered].label}</p>
            <div className="mt-2 text-[9px] text-zinc-500 font-mono">
              SCORE: {Math.round((1 - data[hovered].distance) * 100)}% CLARITY
            </div>
          </div>
        </Html>
      )}

      {/* Semantic Anchor Pillars (Monolithic structures) */}
      {anchors.map((p, i) => (
        <group key={`anchor-${i}`} position={[p.x, p.y, p.z]}>
          <mesh position={[0, -2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 10, 8]} />
            <meshBasicMaterial color={p.sentiment === 'positive' ? '#10b981' : '#f43f5e'} transparent opacity={0.1} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial 
              color={p.sentiment === 'positive' ? '#059669' : '#e11d48'} 
              emissive={p.sentiment === 'positive' ? '#10b981' : '#f43f5e'}
              emissiveIntensity={4}
            />
          </mesh>
          <Html distanceFactor={12} position={[0, 0.6, 0]} center zIndexRange={[100, 0]}>
            <div className="pointer-events-none px-3 py-1.5 bg-zinc-900 border-2 border-white/20 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] font-black text-white whitespace-nowrap uppercase tracking-[0.2em]">{p.label}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* Grid Floor for spatial context */}
      <gridHelper args={[20, 20, '#27272a', '#18181b']} position={[0, -5, 0]} rotation={[0, 0, 0]} />
    </group>
  );
}

export function UmapVisualization({ points = [] }: { points?: any[] }) {
  const mockPoints = useMemo(() => {
    if (points && points.length > 0) return points;
    // Generate high-fidelity mock latent space data if none provided
    const clusters = [
      { x: -50, y: 40, label: "Reputational Moat", color: "#ec4899" },
      { x: 60, y: -30, label: "Technical Competence", color: "#06b6d4" },
      { x: -20, y: -60, label: "Pricing Perception", color: "#8b5cf6" },
    ];

    return Array.from({ length: 60 }, (_, i) => {
      const cluster = clusters[i % clusters.length];
      const theta = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 50;
      
      return {
        id: i,
        x: cluster.x + r * Math.cos(theta),
        y: cluster.y + r * Math.sin(theta),
        z: Math.random() * 40 - 20,
        label: ["Security", "API", "Founder", "Tokenomics", "Market", "Github", "Patent", "Discord", "Reddit", "Enterprise", "Latency", "Drift"][i % 12],
        sentiment: Math.random() > 0.4 ? 'positive' : 'negative',
        distance: Math.random(),
      };
    });
  }, [points]);

  return (
    <div className="w-full h-full bg-transparent relative group">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={['#09090b']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Center>
          <PointCloud points={mockPoints} />
        </Center>
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          autoRotate 
          autoRotateSpeed={0.8}
          maxDistance={25}
          minDistance={8}
          makeDefault
        />
      </Canvas>
      
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 w-fit">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[9px] font-black text-white tracking-[0.2em] uppercase">768-D Latent Explorer</span>
          </div>
          <p className="text-[8px] text-zinc-500 font-mono ml-2">INTERACTIVE_NEURAL_RECONSTRUCTION_MODE</p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="text-right">
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Navigation</p>
          <p className="text-[8px] text-zinc-500 font-mono">DRAG TO ROTATE • SCROLL TO ZOOM</p>
        </div>
      </div>
    </div>
  );
}
