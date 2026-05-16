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
  
  const { positions, colors, anchors } = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    const cols = new Float32Array(data.length * 3);
    
    // Identified major clusters/anchors in the data
    const anchorMap = new Map<string, { x: number, y: number, z: number, sentiment: string }>();

    data.forEach((p, i) => {
      const x = p.x / 10;
      const y = p.y / 10;
      const z = (p.z || (Math.random() * 20 - 10)) / 10;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Make colors more vibrant (increase saturation/brightness)
      const color = new THREE.Color(p.sentiment === 'positive' ? '#10b981' : '#f43f5e');
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;

      // Pick every 15th node as a potential "Cluster Anchor" if it's high quality
      if (i % 15 === 0) {
        anchorMap.set(p.label, { x, y, z, sentiment: p.sentiment });
      }
    });
    
    return { 
      positions: pos, 
      colors: cols,
      anchors: Array.from(anchorMap.entries()).map(([label, pos]) => ({ label, ...pos }))
    };
  }, [data]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
       ref.current.rotation.y = t * 0.015;
    }
  });

  return (
    <group>
      <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.5}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </Points>
      
      {/* Semantic Anchor Monoliths (Bigger, solid identifiers) */}
      {anchors.map((p, i) => (
        <group key={`anchor-${i}`} position={[p.x, p.y, p.z]}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial 
              color={p.sentiment === 'positive' ? '#059669' : '#e11d48'} 
              emissive={p.sentiment === 'positive' ? '#10b981' : '#f43f5e'}
              emissiveIntensity={2}
            />
          </mesh>
          <Html distanceFactor={10} position={[0, 0.4, 0]} center zIndexRange={[100, 0]}>
            <div className="pointer-events-none px-2 py-1 bg-black/80 backdrop-blur-md border border-white/20 rounded shadow-2xl">
              <span className="text-[9px] font-black text-white whitespace-nowrap uppercase tracking-widest">{p.label}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* Subtle background nodes for depth */}
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#1e293b"
          size={0.15}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.2}
        />
      </Points>
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
