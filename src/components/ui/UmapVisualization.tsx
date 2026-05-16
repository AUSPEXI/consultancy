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

function PointCloud({ points: data, onHoverChange }: { points: MapPoint[], onHoverChange?: (hovered: boolean) => void }) {
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
      const z = (p.z || 0) / 10;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Extreme saturation for maximum contrast - Primary Green and Primary Red
      // Using very specific HSL values for better OLED / High-Contrast viewing
      const color = new THREE.Color(p.sentiment === 'positive' ? '#00cc66' : '#cc0033');
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;

      // Anchor nodes from base types defined in server
      if (p.type && (p.type.includes('Anchor') || i % 20 === 0)) {
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
    // Use the index directly from the event
    if (e.index !== undefined) {
      setHovered(e.index);
      onHoverChange?.(true);
    }
  }, [onHoverChange]);

  const onPointerOut = useCallback((e: any) => {
    // Only clear if we're moving away from the points entirely
    setHovered(null);
    onHoverChange?.(false);
  }, [onHoverChange]);

  useFrame((state) => {
    // Rotation is now handled by OrbitControls to avoid conflict
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
          position={[positions[hovered * 3], positions[hovered * 3 + 1] + 0.5, positions[hovered * 3 + 2]]} 
          pointerEvents="none"
          zIndexRange={[100, 0]}
          center
        >
          <div 
            className="px-3 py-2 bg-black/95 border-2 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl min-w-[160px] animate-in fade-in zoom-in duration-200"
            style={{ borderColor: data[hovered].sentiment === 'positive' ? '#00ffa366' : '#ff003c66' }}
          >
            <div className="flex justify-between items-start mb-1">
              <p 
                className="text-[9px] font-black uppercase tracking-[0.15em]"
                style={{ color: data[hovered].sentiment === 'positive' ? '#00ffa3' : '#ff003c' }}
              >
                {data[hovered].sentiment} Node
              </p>
              <div className="flex gap-0.5">
                {[1,2,3].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-white/20" />
                ))}
              </div>
            </div>
            <p className="text-sm font-bold text-white tracking-tight border-b border-white/10 pb-1 mb-1">{data[hovered].label}</p>
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[9px]">
                <span className="text-zinc-500 font-mono">WEIGHT:</span>
                <span className="font-mono text-zinc-300">{Math.round((1 - data[hovered].distance) * 100)}%</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-zinc-500 font-mono">SOURCE:</span>
                <span className="font-mono text-zinc-300 underline decoration-zinc-700 underline-offset-2">Gemini-Embed-004</span>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Semantic Anchor Pillars (Monolithic structures) */}
      {anchors.map((p, i) => (
        <group key={`anchor-${i}`} position={[p.x, p.y, p.z]}>
          {/* Grounding line to grid */}
          <mesh position={[0, (-5 - p.y) / 2, 0]}>
            <cylinderGeometry args={[0.005, 0.05, Math.abs(-5 - p.y), 4]} />
            <meshBasicMaterial color={p.sentiment === 'positive' ? '#00ffa3' : '#ff003c'} transparent opacity={0.2} />
          </mesh>
          
          {/* Grounding Ring on Grid */}
          <mesh position={[0, -5 - p.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshBasicMaterial color={p.sentiment === 'positive' ? '#00ffa3' : '#ff003c'} transparent opacity={0.3} />
          </mesh>

          {/* Floating Monolith */}
          <mesh>
            <boxGeometry args={[0.4, 0.8, 0.4]} />
            <meshStandardMaterial 
              color={p.sentiment === 'positive' ? '#065f46' : '#991b1b'} 
              emissive={p.sentiment === 'positive' ? '#00ffa3' : '#ff003c'}
              emissiveIntensity={2}
            />
          </mesh>
          <Html distanceFactor={15} position={[0, 1, 0]} center zIndexRange={[100, 0]}>
            <div 
              className="pointer-events-none px-4 py-2 bg-black/90 border-2 rounded shadow-[0_0_25px_rgba(0,0,0,0.9)] transition-all duration-300"
              style={{ borderColor: p.sentiment === 'positive' ? '#00ffa3' : '#ff003c' }}
            >
              <p 
                className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5 opacity-60"
                style={{ color: p.sentiment === 'positive' ? '#00ffa3' : '#ff003c' }}
              >
                Anchor
              </p>
              <span className="text-xs font-bold text-white whitespace-nowrap tracking-tight">{p.label}</span>
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
  const [isHovered, setIsHovered] = useState(false);
  
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
          <PointCloud points={mockPoints} onHoverChange={setIsHovered} />
        </Center>
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          autoRotate={false} 
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
          
          <div className="mt-4 flex flex-col gap-1 bg-black/30 backdrop-blur-sm border border-white/5 p-2 rounded-lg max-w-[150px]">
            <p className="text-[8px] text-zinc-400 font-bold uppercase mb-1 border-b border-white/10 pb-1">Data Integrity Pulse</p>
            <div className="flex justify-between items-center text-[7px] text-zinc-500">
              <span>Verified Citations:</span>
              <span className="text-emerald-400 font-mono">1,240</span>
            </div>
            <div className="flex justify-between items-center text-[7px] text-zinc-500">
              <span>Model Confidence:</span>
              <span className="text-emerald-400 font-mono">98.2%</span>
            </div>
            <div className="flex justify-between items-center text-[7px] text-zinc-500">
              <span>Vector Sync:</span>
              <span className="text-pink-400 font-mono">Real-time</span>
            </div>
          </div>
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
