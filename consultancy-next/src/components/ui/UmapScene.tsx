'use client'

import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ── Type colours ─────────────────────────────────────────────────────────────
// These are the canonical colours for the four anchor base-types used throughout
// the analytics/map route. They must stay in sync with the map route constants.
const TYPE_COLORS: Record<string, string> = {
  'Systemic Anchor':  '#f43f5e',   // pink
  'Signal Point':     '#22d3ee',   // cyan
  'Emergent Trend':   '#a78bfa',   // purple
  'Risk Vector':      '#fb923c',   // amber
  keyword:            '#22d3ee',   // same as Signal Point
  competitor:         '#fb923c',   // same as Risk Vector
  query:              '#eab308',   // gold — cite-probe queries
  anchor:             '#f43f5e',
};

// Citation status dims the colour rather than overriding it — cited = full,
// uncited = more saturated red tint, untested = muted.
function getPointColor(groupType: string, citationStatus: string): THREE.Color {
  const hex = TYPE_COLORS[groupType] ?? '#6366f1';
  const c = new THREE.Color(hex);
  if (citationStatus === 'uncited') {
    // Shift toward red and reduce luminance
    c.r = Math.min(1, c.r * 1.3);
    c.g *= 0.4;
    c.b *= 0.4;
  } else if (citationStatus === 'untested') {
    // Desaturate to ~50%
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    c.r = c.r * 0.5 + lum * 0.5;
    c.g = c.g * 0.5 + lum * 0.5;
    c.b = c.b * 0.5 + lum * 0.5;
  }
  return c;
}

interface MapPoint {
  id: number;
  x: number; y: number; z?: number;
  label: string;
  groupType?: string;
  type?: string;
  anchorName?: string;
  citationStatus?: string;
  sentiment?: string;
  distance?: number;
}

interface HoverInfo { index: number; clientX: number; clientY: number }

// ── Projector: projects the hovered 3D point to screen coords every frame ────
// Runs inside Canvas so it can read the camera.
function Projector({
  positions, hovered, onProject,
}: {
  positions: Float32Array;
  hovered: number | null;
  onProject: (x: number, y: number) => void;
}) {
  const { camera, gl } = useThree();
  useFrame(() => {
    if (hovered === null) return;
    const v = new THREE.Vector3(
      positions[hovered * 3],
      positions[hovered * 3 + 1] + 0.6,
      positions[hovered * 3 + 2],
    ).project(camera as unknown as THREE.Camera);
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    onProject(
      Math.round(rect.left + ((v.x + 1) / 2) * rect.width),
      Math.round(rect.top  + ((-v.y + 1) / 2) * rect.height),
    );
  });
  return null;
}

// ── Point cloud ───────────────────────────────────────────────────────────────
function PointCloud({
  points: data,
  onHover,
}: {
  points: MapPoint[];
  onHover: (idx: number | null, clientX?: number, clientY?: number) => void;
}) {
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { positions, colors } = useMemo(() => {
    const pos  = new Float32Array(data.length * 3);
    const cols = new Float32Array(data.length * 3);
    data.forEach((p, i) => {
      pos[i * 3]     = p.x  / 10;
      pos[i * 3 + 1] = p.y  / 10;
      pos[i * 3 + 2] = (p.z ?? 0) / 10;
      const c = getPointColor(p.groupType ?? p.type ?? '', p.citationStatus ?? 'untested');
      cols[i * 3]     = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    });
    return { positions: pos, colors: cols };
  }, [data]);

  const handleOver = useCallback((e: any) => {
    e.stopPropagation();
    if (e.index === undefined) return;
    if (debounce.current) clearTimeout(debounce.current);
    const ne = e.nativeEvent as MouseEvent;
    onHover(e.index, ne.clientX, ne.clientY);
  }, [onHover]);

  const handleOut = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onHover(null), 80);
  }, [onHover]);

  return (
    <Points
      positions={positions}
      colors={colors}
      stride={3}
      frustumCulled={false}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      limit={data.length}
    >
      <PointMaterial
        transparent
        vertexColors
        size={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.85}
      />
    </Points>
  );
}

// ── Anchor pillars ────────────────────────────────────────────────────────────
// Rendered as 3D objects only — no Html inside the Canvas to avoid event loops.
// Labels are drawn as DOM overlays in UmapScene using projected coords.
function AnchorPillars({ anchors }: { anchors: { label: string; x: number; y: number; z: number; baseType: string }[] }) {
  return (
    <>
      {anchors.map((a, i) => {
        const hex = TYPE_COLORS[a.baseType] ?? '#f43f5e';
        const colorHex = hex;
        const color = new THREE.Color(hex);
        const dimHex = '#' + color.clone().multiplyScalar(0.25).getHexString();
        const groundY = -5;
        const lineH = Math.abs(groundY - a.y);
        return (
          <group key={i} position={[a.x, a.y, a.z]}>
            {/* Ground line */}
            <mesh position={[0, (groundY - a.y) / 2, 0]}>
              <cylinderGeometry args={[0.005, 0.04, lineH, 4]} />
              <meshBasicMaterial color={colorHex} transparent opacity={0.25} />
            </mesh>
            {/* Floor ring */}
            <mesh position={[0, groundY - a.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.42, 32]} />
              <meshBasicMaterial color={colorHex} transparent opacity={0.35} />
            </mesh>
            {/* Glow core */}
            <mesh>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshBasicMaterial color={colorHex} />
            </mesh>
            {/* Monolith */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.28, 0.65, 0.28]} />
              <meshStandardMaterial
                color={dimHex}
                emissive={colorHex}
                emissiveIntensity={2.5}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function UmapScene({
  points = [],
  userAnchors = [],
}: {
  points?: any[];
  userAnchors?: { label: string; color: string; baseType: string }[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array());

  const data = useMemo<MapPoint[]>(() => {
    if (points.length > 0) {
      return points.map((p: any, i: number) => ({
        id: i,
        x: p.x ?? 0, y: p.y ?? 0, z: p.z ?? 0,
        label: String(p.label || p.type || 'Signal').substring(0, 60),
        groupType: p.groupType || p.type,
        type: p.groupType || p.type,
        anchorName: p.type || undefined,
        citationStatus: p.citationStatus ?? 'untested',
        sentiment: p.sentiment ?? 'positive',
        distance: p.distance ?? 0.5,
      }));
    }

    // Fallback demo — 4 named clusters matching the four anchor types
    const clusters = [
      { cx: -50, cy:  40, label: 'Reputational Moat',    baseType: 'Systemic Anchor'  },
      { cx:  55, cy: -30, label: 'Technical Competence', baseType: 'Signal Point'     },
      { cx: -15, cy: -55, label: 'Pricing Perception',   baseType: 'Emergent Trend'   },
      { cx:  40, cy:  50, label: 'Competitor Threat',    baseType: 'Risk Vector'      },
    ];
    const statuses: MapPoint['citationStatus'][] = ['cited', 'uncited', 'untested'];

    return clusters.flatMap((cl, ci) =>
      Array.from({ length: 15 }, (_, i) => {
        const theta = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random()) * 35;
        return {
          id: ci * 15 + i,
          x: cl.cx + r * Math.cos(theta),
          y: cl.cy + r * Math.sin(theta),
          z: Math.random() * 30 - 15,
          label: cl.label,
          groupType: cl.baseType,
          type: cl.baseType,
          citationStatus: statuses[(ci * 15 + i) % 3],
          sentiment: 'positive',
          distance: Math.random(),
        };
      })
    );
  }, [points]);

  // Build anchor display data from user anchors (merged with any anchors in point data)
  const anchorObjects = useMemo(() => {
    // Use userAnchors if provided; otherwise derive from the cluster labels in data
    const anchorsToShow = userAnchors.length > 0 ? userAnchors : [
      { label: 'Reputational Moat',    baseType: 'Systemic Anchor',  color: '#f43f5e' },
      { label: 'Technical Competence', baseType: 'Signal Point',     color: '#22d3ee' },
      { label: 'Pricing Perception',   baseType: 'Emergent Trend',   color: '#a78bfa' },
      { label: 'Competitor Threat',    baseType: 'Risk Vector',      color: '#fb923c' },
    ];

    // For each anchor, find the centroid of its matching data points
    return anchorsToShow.slice(0, 7).map(a => {
      const matching = data.filter(p => p.groupType === a.baseType || p.anchorName === a.label || p.label === a.label);
      if (matching.length > 0) {
        const cx = matching.reduce((s, p) => s + p.x, 0) / matching.length / 10;
        const cy = matching.reduce((s, p) => s + p.y, 0) / matching.length / 10;
        const cz = matching.reduce((s, p) => s + (p.z ?? 0), 0) / matching.length / 10;
        return { label: a.label, baseType: a.baseType, x: cx, y: cy, z: cz };
      }
      // No matching points — place near origin with small offset
      return { label: a.label, baseType: a.baseType, x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6, z: 0 };
    });
  }, [data, userAnchors]);

  // Keep positions ref in sync so the Projector can read them without a closure
  const positions = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    data.forEach((p, i) => {
      pos[i * 3]     = p.x  / 10;
      pos[i * 3 + 1] = p.y  / 10;
      pos[i * 3 + 2] = (p.z ?? 0) / 10;
    });
    positionsRef.current = pos;
    return pos;
  }, [data]);

  const handleHover = useCallback((idx: number | null, clientX?: number, clientY?: number) => {
    setHovered(idx);
    if (idx === null) { setTipPos(null); return; }
    if (clientX !== undefined && clientY !== undefined) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setTipPos({ x: clientX - rect.left, y: clientY - rect.top });
    }
  }, []);

  const hoveredPoint = hovered !== null ? data[hovered] : null;

  // Anchor label projected positions — updated by Projector inside the canvas
  const [anchorScreenPositions, setAnchorScreenPositions] = useState<Map<number, { x: number; y: number }>>(new Map());

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} frameloop="demand">
        <color attach="background" args={['#09090b']} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />

        <PointCloud points={data} onHover={handleHover} />
        <AnchorPillars anchors={anchorObjects} />

        {/* Project hovered point to screen each frame */}
        {hovered !== null && (
          <Projector
            positions={positions}
            hovered={hovered}
            onProject={(x, y) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) setTipPos({ x: x - rect.left, y: y - rect.top });
            }}
          />
        )}

        <gridHelper args={[20, 20, '#27272a', '#18181b']} position={[0, -5, 0]} />
        <OrbitControls enablePan={false} enableZoom autoRotate={false} maxDistance={25} minDistance={6} makeDefault />
      </Canvas>

      {/* ── DOM tooltip — outside Canvas, no event interference ── */}
      {hoveredPoint && tipPos && (
        <div
          className="pointer-events-none absolute z-30 transition-opacity duration-75"
          style={{ left: tipPos.x + 14, top: tipPos.y - 10 }}
        >
          <div
            className="px-3 py-2.5 bg-black/95 border rounded-lg shadow-2xl min-w-[160px] max-w-[220px]"
            style={{ borderColor: `${TYPE_COLORS[hoveredPoint.groupType ?? ''] ?? '#6366f1'}55` }}
          >
            <p
              className="text-[9px] font-black uppercase tracking-widest mb-1"
              style={{ color: TYPE_COLORS[hoveredPoint.groupType ?? ''] ?? '#6366f1' }}
            >
              {hoveredPoint.groupType ?? 'Unknown'} · {hoveredPoint.citationStatus ?? 'untested'}
            </p>
            <p className="text-sm font-bold text-white leading-snug border-b border-white/10 pb-1.5 mb-1.5">
              {hoveredPoint.label}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono">
              <span className="text-zinc-600">PROXIMITY</span>
              <span className="text-zinc-300">{Math.round((1 - (hoveredPoint.distance ?? 0.5)) * 100)}%</span>
              <span className="text-zinc-600">X (Onto)</span>
              <span className="text-zinc-300">{hoveredPoint.x.toFixed(1)}</span>
              <span className="text-zinc-600">Y (Epist)</span>
              <span className="text-zinc-300">{hoveredPoint.y.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Anchor labels — DOM overlays positioned by canvas bounds ── */}
      {anchorObjects.map((a, i) => {
        // Rough 2D approximation without per-frame projection — good enough for labels
        // (true projection would need another Projector per anchor — overkill)
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return null;
        // Project manually: NDC from 3D position (no camera rotation applied here —
        // just the initial camera position [0,0,15] with fov=45)
        const fovRad = (45 * Math.PI) / 180;
        const aspect = rect.width / rect.height;
        const zDist = 15 - a.z;
        const ndcX = (a.x / zDist) / Math.tan(fovRad / 2) / aspect;
        const ndcY = (a.y / zDist) / Math.tan(fovRad / 2);
        const screenX = ((ndcX + 1) / 2) * rect.width;
        const screenY = ((-ndcY + 1) / 2) * rect.height - 30;
        if (screenX < 10 || screenX > rect.width - 10 || screenY < 0) return null;
        const hex = TYPE_COLORS[a.baseType] ?? '#f43f5e';
        return (
          <div
            key={i}
            className="pointer-events-none absolute z-20"
            style={{ left: screenX, top: screenY, transform: 'translate(-50%, -100%)' }}
          >
            <div
              className="px-2 py-1 bg-black/80 backdrop-blur-sm border rounded text-center shadow-lg"
              style={{ borderColor: hex }}
            >
              <p className="text-[7px] font-black uppercase tracking-widest opacity-60 mb-0.5" style={{ color: hex }}>
                {a.baseType}
              </p>
              <span className="text-[10px] font-bold text-white whitespace-nowrap">{a.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
