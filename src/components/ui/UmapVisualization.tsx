import { useRef, useMemo, useState } from 'react';
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
  
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    const cols = new Float32Array(data.length * 3);
    
    data.forEach((p, i) => {
      // Map 2D coordinates to a 3D shell/field
      pos[i * 3] = p.x / 10;
      pos[i * 3 + 1] = p.y / 10;
      pos[i * 3 + 2] = (p.z || (Math.random() * 20 - 10)) / 10;

      const color = new THREE.Color(p.sentiment === 'positive' ? '#10b981' : '#ec4899');
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    });
    
    return { positions: pos, colors: cols };
  }, [data]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
       ref.current.rotation.y = t * 0.02;
    }
  });

  return (
    <group>
      <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.4}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Labels for key clusters */}
      {data.filter((_, i) => i % 10 === 0).map((p, i) => (
        <Html key={p.id} position={[p.x / 10, p.y / 10, (p.z || 0) / 10]}>
          <div className="pointer-events-none whitespace-nowrap">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter opacity-40">{p.label}</span>
          </div>
        </Html>
      ))}
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
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <Center>
          <PointCloud points={mockPoints} />
        </Center>
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          autoRotate 
          autoRotateSpeed={0.5}
          maxDistance={30}
          minDistance={5}
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
