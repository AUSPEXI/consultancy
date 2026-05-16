import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Center } from '@react-three/drei';
import * as THREE from 'three';

function PointCloud() {
  const ref = useRef<THREE.Points>(null!);
  
  // Create 5,000 random points in a 3D sphere to mimic UMAP cluster distribution
  const points = useMemo(() => {
    const p = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
        const theta = THREE.MathUtils.randFloatSpread(360); 
        const phi = THREE.MathUtils.randFloatSpread(360); 

        const distance = Math.pow(Math.random(), 0.5) * 5; // Weighted towards outer edge for "space" feel
        
        p[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
        p[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
        p[i * 3 + 2] = distance * Math.cos(theta);
    }
    return p;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.05;
    ref.current.rotation.x = t * 0.02;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ec4899"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export function UmapVisualization() {
  return (
    <div className="w-full h-[400px] bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden relative group">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <Center>
            <PointCloud />
          </Center>
        </Canvas>
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full border border-zinc-700">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-[10px] font-bold text-pink-400 tracking-widest uppercase">768-D Latent Space Map (UMAP)</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-zinc-500 font-mono">RENDERING_SEMANTIC_PROXIMITY_V1.0.4</p>
      </div>

      {/* Grid overlay for tech feel */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
           style={{ 
             backgroundImage: 'radial-gradient(circle at 1px 1px, #3f3f46 1px, transparent 0)',
             backgroundSize: '40px 40px' 
           }} />
    </div>
  );
}
