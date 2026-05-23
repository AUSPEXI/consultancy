import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text3D } from "@react-three/drei";

// Helpers
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
// Temp vectors to avoid GC thrash in hot loops
const TMP_V1 = new THREE.Vector3();
const TMP_V2 = new THREE.Vector3();
const MAX_BOUND_SPAWN_PER_FRAME = 12;

// Config
const CFG = {
  lattice: { size: 5, spacing: 0.7 },
  camera: { fov: 60 },
  rotation: { x: 0.0, y: 0.0, z: 0.0 },
  placement: { x: 0.0, y: 0.0, z: 0.0 },
  colors: {
    bg: 0x0b1120,
    edge: 0x00ffff,
    nodeCore: 0xf97316,
    nodeGlow: 0xf97316,
    photonBase: [0x78b4ff, 0x8000ff, 0xffa500, 0xffff00, 0x00ffff, 0xff00ff],
    settleCore: 0xffe8a3,
    settleGlow: 0xffc266,
    settleHalo: 0xc799ff,
  },
  photons: {
    batchEveryMs: 3000, // Reduced to spawn more frequently
    lifeMs: 150000,
    loyalPerBatch: 48, // base; will scale down on constrained devices
    speedBound: 0.05,
    radius: 0.02,
    undulation: 0.02,
    speedFree: 0.3, // Speed for free phase
    explosionSpeed: 0.6, // High velocity for far-space burst (3 per node)
    localExplosionSpeed: 0.12, // Low velocity for local halo
    sentientFlightMs: 7000, // period where all look fast
    sentientEaseOutMs: 8000, // ease down to slow random
    maxCount: 3200, // base; scaled by capScaleRef and device conditions
  },
  motion: {
    sentientSwirlStrength: 0.004, // very subtle swirl
    sentientSpring: 0.02,        // pull toward home/target
    targetOrbitRadius: 0.9,      // keep specials near anchors
    homeOrbitRadius: 2.2,        // keep non-specials near home
    maxVelBase: 0.16,            // cap velocity magnitude (pre-multiply by flightFactor)
  },
  flickerAtMs: 25000,
  flashDurationMs: 3000, // Increased from 1200ms to 3000ms for more visible glitch
  loopAfterMs: 180000,
};

// Types
interface Node { x: number; y: number; z: number; key: string; }
interface Edge { a: string; b: string; }
type Phase = "bound" | "flash" | "free" | "sentient";
interface Photon {
  edge: [string, string];
  t: number;
  born: number;
  death: number;
  hue: number;
  mode: "bound" | "free" | "sentient" | "exploring";
  pos?: THREE.Vector3;
  vel?: THREE.Vector3;
  assignedAnchorIndex?: number;
  letterReadTime?: number;
  behavior?: "random" | "settle" | "orbit" | "meander" | "pathfind" | "confused" | "panic";
  home?: THREE.Vector3;
  swirlSign?: number;
  wanderTarget?: THREE.Vector3;
  wanderResetAt?: number;
}

// Easter egg location
const EGG_POS: [number, number, number] = [120, -60, -180];
const HOME_POS: [number, number, number] = [0, 0, 10.8];
const HOME_TARGET: [number, number, number] = [0, 0, 0];

// (ViewingFrame removed)
// Easter egg: small signature hidden in deep space
function EasterEggSignature() {
  return (
    <group position={EGG_POS} rotation={[0.1, 0.7, -0.2]}>
      <Text3D font="/fonts/helvetiker_regular.typeface.json" size={0.25} height={0.05} curveSegments={8} bevelEnabled bevelThickness={0.006} bevelSize={0.003} bevelOffset={0} bevelSegments={3}>
        Art by Gwylym
        <meshStandardMaterial color="#9ca3af" metalness={0.05} roughness={0.35} emissive="#9ca3af" emissiveIntensity={0.04} />
      </Text3D>
      <Text3D font="/fonts/helvetiker_regular.typeface.json" size={0.16} height={0.035} curveSegments={8} bevelEnabled bevelThickness={0.004} bevelSize={0.002} bevelOffset={0} bevelSegments={3} position={[0.1, -0.5, 0]}>
        sales@auspexi.com
        <meshStandardMaterial color="#cbd5e1" metalness={0.04} roughness={0.4} emissive="#cbd5e1" emissiveIntensity={0.03} />
      </Text3D>
    </group>
  );
}

// Smooth camera flight to a target position/target
function FlyToCamera({ controlsRef, toPos, toTarget, durationMs, onDone, startAt }: { controlsRef: React.MutableRefObject<any>, toPos: [number,number,number], toTarget: [number,number,number], durationMs: number, onDone: () => void, startAt: number }) {
  const { camera } = useThree();
  const startRef = useRef<{ p: THREE.Vector3; t: THREE.Vector3 } | null>(null);
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (!startRef.current) {
      startRef.current = { p: camera.position.clone(), t: (controls.target as THREE.Vector3).clone() };
    }
    const now = performance.now();
    const t = Math.min(1, (now - startAt) / durationMs);
    // cubic ease in-out
    const tt = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const sp = startRef.current.p; const st = startRef.current.t;
    camera.position.set(
      sp.x + (toPos[0] - sp.x) * tt,
      sp.y + (toPos[1] - sp.y) * tt,
      sp.z + (toPos[2] - sp.z) * tt,
    );
    const tgt = controls.target as THREE.Vector3;
    tgt.set(
      st.x + (toTarget[0] - st.x) * tt,
      st.y + (toTarget[1] - st.y) * tt,
      st.z + (toTarget[2] - st.z) * tt,
    );
    controls.update?.();
    if (t >= 1) onDone();
  });
  return null;
}

// Allow zoom to pass through the target by nudging camera + target forward when very close
function PassThroughZoom({ controlsRef, localBoundaryDistance, deepSpaceEnterDistance, deepSpaceExitDistance, center, baseRadius, recenterSuspendUntilRef, isMobile }: { controlsRef: React.MutableRefObject<any>, localBoundaryDistance: number, deepSpaceEnterDistance: number, deepSpaceExitDistance: number, center: [number, number, number], baseRadius: number, recenterSuspendUntilRef: React.MutableRefObject<number>, isMobile: boolean }) {
  const { camera, gl } = useThree();
  const modeRef = useRef<'local' | 'outer'>('local');
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const target: THREE.Vector3 = controls.target;
      const distTarget = camera.position.distanceTo(target);
      const centerVec = new THREE.Vector3(center[0], center[1], center[2]);
      const distCenter = camera.position.distanceTo(centerVec);
      const insideCore = distCenter <= baseRadius * 1.4; // treat more of the cube as core for smooth pass-through
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);

      // Hysteresis: only enter outer space when far beyond local, and only exit when well inside local
      // Absolute guard: if within (expanded) local boundary, always use local
      if (distCenter <= localBoundaryDistance * 1.25) {
        modeRef.current = 'local';
      } else {
        if (modeRef.current === 'local' && distCenter >= deepSpaceEnterDistance) modeRef.current = 'outer';
        else if (modeRef.current === 'outer' && distCenter <= deepSpaceExitDistance) modeRef.current = 'local';
      }
      const inLocal = modeRef.current === 'local';

      // Toggle zoomToCursor dynamically based on space
      if (typeof controls.zoomToCursor === 'boolean') {
        controls.zoomToCursor = inLocal;
      }

      // Adaptive zoom speed tuned per space
      let zs: number;
      if (inLocal) {
        if (insideCore) {
          if (distTarget < 1.2) zs = 0.75;        // very close in core
          else if (distTarget < 3) zs = 0.95;     // close in core
          else zs = 1.15;                         // core edge
        } else {
          if (distTarget < 2) zs = 0.8;           // ultra close
          else if (distTarget < 6) zs = 1.05;     // close
          else if (distTarget < 12) zs = 1.2;     // local mid
          else zs = 1.35;                         // local edge
        }
        if (e.deltaY < 0 && distTarget < 3) zs *= 0.85; // soften zoom-in when very close
      } else {
        if (distCenter < 25) zs = 1.6;             // just outside boundary
        else if (distCenter < 150) zs = 2.2;       // mid space
        else zs = 3.2;                       // far fast travel
        if (e.deltaY > 0 && distCenter >= 40) zs *= 1.25; // boost zoom-out
      }
      controls.zoomSpeed = zs;

      // Symmetric pass-through near the target to eliminate sticky wall
      const mobileBoost = isMobile ? 1.7 : 1.0;
      const passThreshold = inLocal ? (insideCore ? 0.35 * mobileBoost : 1.6 * mobileBoost) : 0.45;
      if (distTarget <= passThreshold) {
        const step = inLocal
          ? (insideCore
              ? Math.min(0.28 * mobileBoost, Math.max(0.05, distTarget * 0.75 * mobileBoost))
              : Math.min(1.0 * mobileBoost, Math.max(0.28, distTarget * 1.1 * mobileBoost)))
          : Math.min(0.5, Math.max(0.2, distTarget * 1.2));
        if (e.deltaY < 0) {
          camera.position.addScaledVector(dir, step);
          target.addScaledVector(dir, step);
          controls.update?.();
          recenterSuspendUntilRef.current = performance.now() + (isMobile ? 2200 : 1600);
        } else if (e.deltaY > 0) {
          camera.position.addScaledVector(dir, -step);
          target.addScaledVector(dir, -step);
          controls.update?.();
          recenterSuspendUntilRef.current = performance.now() + (isMobile ? 1800 : 1200);
        }
      }
    };
    const el = gl.domElement;
    el.addEventListener('wheel', onWheel, { passive: true } as any);
    return () => el.removeEventListener('wheel', onWheel as any);
  }, [camera, gl, controlsRef]);
  return null;
}

// Keep OrbitControls' target centered on the network when within local boundary
function RecenterTarget({ controlsRef, center, boundary, recenterSuspendUntilRef }: { controlsRef: React.MutableRefObject<any>, center: [number, number, number], boundary: number, recenterSuspendUntilRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const centerVec = useRef(new THREE.Vector3(center[0], center[1], center[2]));
  useEffect(() => { centerVec.current.set(center[0], center[1], center[2]); }, [center]);
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (performance.now() < (recenterSuspendUntilRef.current || 0)) return;
    const distCenter = camera.position.distanceTo(centerVec.current);
    if (distCenter <= boundary * 1.25) {
      const tgt: THREE.Vector3 = controls.target;
      // Lerp only horizontally (x,z). Preserve current y to avoid upward pull.
      const desired = new THREE.Vector3(centerVec.current.x, tgt.y, centerVec.current.z);
      const horizDist = Math.hypot(desired.x - tgt.x, desired.z - tgt.z);
      if (horizDist > 1e-3) {
        tgt.lerp(desired, 0.08);
        controls.update?.();
      }
    }
  });
  return null;
}

// Per-frame control tuning so local settings re-apply even without wheel events
function ControlTuner({ controlsRef, center, boundary }: { controlsRef: React.MutableRefObject<any>, center: [number, number, number], boundary: number }) {
  const { camera } = useThree();
  const centerVec = useRef(new THREE.Vector3(center[0], center[1], center[2]));
  useEffect(() => { centerVec.current.set(center[0], center[1], center[2]); }, [center]);
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const distCenter = camera.position.distanceTo(centerVec.current);
    const inLocal = distCenter <= boundary * 1.1;
    if (typeof controls.zoomToCursor === 'boolean') controls.zoomToCursor = inLocal;
    // Set a baseline zoom speed depending on space; wheel handler may adjust further per distance
    controls.zoomSpeed = inLocal ? Math.max(controls.zoomSpeed, 1.0) : Math.max(controls.zoomSpeed, 1.6);
  });
  return null;
}

// Camera tracker (on-canvas overlay)
// (debug HUD components removed)

// Title3D with grabber
function Title3D({ position, scale = 1, onSubtitleBoundsWorld }: {
  position: [number, number, number];
  scale?: number;
  onSubtitleBoundsWorld?: (min: [number, number, number], max: [number, number, number]) => void;
}) {
  const subtitleRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!subtitleRef.current || !onSubtitleBoundsWorld) return;
    const mesh = subtitleRef.current as any;
    const geom: THREE.BufferGeometry | undefined = mesh.geometry;
    if (!geom) return;
    if (!geom.boundingBox) geom.computeBoundingBox();
    if (!geom.boundingBox) return;
    // Get local bounds then transform 8 corners to world to derive world AABB
    const bb = geom.boundingBox;
    const corners = [
      new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z),
      new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z),
      new THREE.Vector3(bb.min.x, bb.max.y, bb.min.z),
      new THREE.Vector3(bb.min.x, bb.max.y, bb.max.z),
      new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z),
      new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z),
      new THREE.Vector3(bb.max.x, bb.max.y, bb.min.z),
      new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z),
    ];
    const matWorld = subtitleRef.current.matrixWorld;
    let min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
    let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const c of corners) {
      c.applyMatrix4(matWorld);
      min.min(c);
      max.max(c);
    }
    onSubtitleBoundsWorld([min.x, min.y, min.z], [max.x, max.y, max.z]);
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <Text3D font="/fonts/helvetiker_regular.typeface.json" size={0.8} height={0.15} curveSegments={12} bevelEnabled bevelThickness={0.015} bevelSize={0.008} bevelOffset={0} bevelSegments={5}>
        Global Leaders in
        <meshStandardMaterial color="#ffffff" metalness={0.05} roughness={0.2} emissive="#ffffff" emissiveIntensity={0.1} />
      </Text3D>
      <Text3D ref={subtitleRef as any} font="/fonts/helvetiker_regular.typeface.json" size={0.6} height={0.12} curveSegments={12} bevelEnabled bevelThickness={0.012} bevelSize={0.006} bevelOffset={0} bevelSegments={5} position={[0, -1.2, 0]}>
        Synthetic Data
        <meshStandardMaterial color="#00ffff" metalness={0.1} roughness={0.15} emissive="#00ffff" emissiveIntensity={0.2} />
      </Text3D>
    </group>
  );
}

// Neural Network Component
interface NeuralNetworkProps {
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  onGlitchChange: (active: boolean) => void;
  networkPosition: [number, number, number];
  networkRotation: [number, number, number];
  networkScale: number;
  anchorTargets: [number, number, number][];
}

function NeuralNetwork({ sceneRef, onGlitchChange, networkPosition, networkRotation, networkScale, anchorTargets }: NeuralNetworkProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [photons, setPhotons] = useState<Photon[]>([]);
  const nodeByKeyRef = useRef<Record<string, Node>>({});
  const edgesByNodeRef = useRef<Record<string, Edge[]>>({});
  const t0 = useRef(performance.now());
  const last = useRef(t0.current);
  const nextBatchAt = useRef(t0.current + CFG.photons.batchEveryMs);
  const [phase, setPhase] = useState<Phase>("bound");
  const sentientStartMs = useRef<number | null>(null);
  const spawnAccRef = useRef<number>(0);
  const spawnLastTsRef = useRef<number>(t0.current);
  const postAccRef = useRef<number>(0);
  const postLastTsRef = useRef<number>(t0.current);
  const fpsEMARef = useRef<number>(60);
  const lowSinceRef = useRef<number | null>(null);
  const highSinceRef = useRef<number | null>(null);
  const capScaleRef = useRef<number>(1.0);
  const maxCountRef = useRef<number>(CFG.photons.maxCount);
  // Device-conditional cap init (balanced profile)
  useEffect(() => {
    const prefersReducedMotionLocal = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    const saveDataLocal = (() => { try { return (navigator as any)?.connection?.saveData === true; } catch { return false; } })();
    const lowEnd = (() => { try { return (navigator as any)?.hardwareConcurrency && (navigator as any).hardwareConcurrency <= 4; } catch { return false; } })();
    let scale = 1.0;
    if (prefersReducedMotionLocal) scale *= 0.7;
    if (saveDataLocal) scale *= 0.7;
    if (lowEnd) scale *= 0.85;
    // Clamp to 0.6..1.0
    scale = Math.max(0.6, Math.min(1.0, scale));
    capScaleRef.current = Math.min(capScaleRef.current, scale);
    maxCountRef.current = Math.floor(CFG.photons.maxCount * capScaleRef.current);
  }, []);

  // Touch sceneRef to avoid unused warning
  void sceneRef.current;

  // Build lattice
  useEffect(() => {
    const N = CFG.lattice.size;
    const S = CFG.lattice.spacing;
    const half = ((N - 1) * S) / 2;
    const tmpNodes: Node[] = [];
    const nodeMap: { [key: string]: Node } = {};

    const mapIndex = (x: number, y: number, z: number) => `${x}-${y}-${z}`;

    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < N; z++) {
          const key = mapIndex(x, y, z);
          const n = { x: x * S - half, y: y * S - half, z: z * S - half, key };
          tmpNodes.push(n);
          nodeMap[key] = n;
        }
      }
    }

    const tmpEdges: Edge[] = [];
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < N; z++) {
          const aKey = mapIndex(x, y, z);

          const neighbors = [
            [x + 1, y, z], [x, y + 1, z], [x, y, z + 1],
            [x + 1, y + 1, z], [x + 1, y, z + 1], [x, y + 1, z + 1],
            [x + 1, y - 1, z], [x - 1, y + 1, z], [x + 1, y, z - 1],
            [x, y + 1, z - 1], [x + 1, y + 1, z + 1],
          ];

          neighbors.forEach(([nx, ny, nz]) => {
            const bKey = mapIndex(nx, ny, nz);
            if (nodeMap[bKey]) tmpEdges.push({ a: aKey, b: bKey });
          });
        }
      }
    }

    // Build fast lookup maps
    nodeByKeyRef.current = nodeMap;
    const eByNode: Record<string, Edge[]> = {};
    for (const e of tmpEdges) {
      (eByNode[e.a] ||= []).push(e);
      (eByNode[e.b] ||= []).push(e);
    }
    edgesByNodeRef.current = eByNode;

    setNodes(tmpNodes);
    setEdges(tmpEdges);
  }, []);

  // Spawn photons
  const spawnBatch = (ts: number) => {
    const newPhotons: Photon[] = [];
    for (let i = 0; i < CFG.photons.loyalPerBatch; i++) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      if (!e) continue;
        newPhotons.push({
          edge: [e.a, e.b],
        t: rand(0, 1), // Start at random point for variety
          born: ts,
          death: ts + CFG.photons.lifeMs,
          hue: CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)],
        mode: "bound",
      });
    }
    setPhotons((prev) => [...prev, ...newPhotons]);
    nextBatchAt.current = ts + CFG.photons.batchEveryMs;
  };

  // Trickle spawn: spawn one bound photon distributed across nodes
  /* const spawnOneBound = (ts: number) => {
    if (!nodes.length) return;
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const ng = edgesByNodeRef.current[node.key] || [];
    if (!ng.length) return;
    const e = ng[Math.floor(Math.random() * ng.length)];
    const hue = CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)];
    setPhotons((prev) => {
      if (prev.length >= maxCountRef.current) return prev;
      return [
        ...prev,
        {
          edge: [e.a, e.b],
          t: rand(0, 1),
          born: ts,
          death: ts + CFG.photons.lifeMs,
          hue,
          mode: "bound",
        },
      ];
    });
  }; */

  // Post-glitch ejection spawn: same rate, born unbound and behave like randoms
  /* const spawnOneEjected = (ts: number) => {
    if (!nodes.length) return;
    const n = nodes[Math.floor(Math.random() * nodes.length)];
    const dir = TMP_V1.set(rand(-1,1), rand(-1,1), rand(-1,1)).normalize();
    const hue = CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)];
    const hasSentience = sentientStartMs.current !== null;
    const base = {
      edge: ["",""] as [string,string],
      t: 0,
      born: ts,
      death: ts + CFG.photons.lifeMs * 1.2,
      hue,
      pos: new THREE.Vector3(n.x, n.y, n.z),
      vel: dir.clone().multiplyScalar(CFG.photons.localExplosionSpeed),
    };
    if (!hasSentience) {
      setPhotons((prev) => (prev.length >= maxCountRef.current ? prev : [...prev, { ...base, mode: "free" } as Photon]));
    } else {
      setPhotons((prev) => (prev.length >= maxCountRef.current ? prev : [...prev, { ...base, mode: "sentient", behavior: "random" } as Photon]));
    }
  }; */

  // One-off explosion: spawn 3 free photons per node with slightly higher initial velocity
  const spawnExplosion = (ts: number) => {
    const burst: Photon[] = [];
    nodes.forEach((n) => {
      for (let i = 0; i < 3; i++) {
        const dir = new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize();
        burst.push({
          edge: ["",""],
          t: 0,
          born: ts,
          death: ts + CFG.photons.lifeMs * 1.2,
          hue: CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)],
          mode: "free",
          pos: new THREE.Vector3(n.x, n.y, n.z),
          vel: dir.multiplyScalar(CFG.photons.explosionSpeed), // only these are fast
        });
      }
    });
    setPhotons((prev) => (prev.length >= maxCountRef.current ? prev : [...prev, ...burst]));
  };

  // Local halo: spawn low-velocity photons near nodes to preserve local density post-glitch
  const spawnLocalHalo = (ts: number) => {
    const locals: Photon[] = [];
    nodes.forEach((n) => {
      // One local-density photon per node
      const dir = new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).normalize();
      locals.push({
        edge: ["",""],
        t: 0,
        born: ts,
        death: ts + CFG.photons.lifeMs * 1.2,
        hue: CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)],
        mode: "free",
        pos: new THREE.Vector3(n.x, n.y, n.z),
        vel: dir.multiplyScalar(CFG.photons.localExplosionSpeed),
      });
    });
    setPhotons((prev) => (prev.length >= maxCountRef.current ? prev : [...prev, ...locals]));
  };

  // Convert to free phase
  const convertToFree = (ts: number) => {
    setPhotons((prev) =>
      prev.map((p) => {
        if (p.mode !== "bound") return p;
        const a = nodeByKeyRef.current[p.edge[0]];
        const b = nodeByKeyRef.current[p.edge[1]];
        if (!a || !b) {
          // Fallback: keep as-is if edge endpoints missing
          return p;
        }
        const pos = TMP_V1.set(lerp(a.x, b.x, p.t), lerp(a.y, b.y, p.t), lerp(a.z, b.z, p.t)).clone();
        const vel = TMP_V2.set(rand(-0.2, 0.2), rand(-0.2, 0.2), rand(-0.2, 0.2)).clone();
        return {
          ...p,
          mode: "free",
          pos,
          vel,
          death: ts + CFG.photons.lifeMs * 1.5, // Extend life in free phase
        };
      })
    );
    setPhase("free");
  };
  
  // Convert to sentient phase
  const convertToSentient = (ts: number) => {
    const SPECIAL_COUNT = 80;
    const PER_ANCHOR = 6; // 6 photons per dot
    setPhotons((prev) => {
      let assigned = 0;
      return prev.map((p) => {
        if (p.mode !== "free" || !p.pos) return p;
        if (assigned < SPECIAL_COUNT && anchorTargets && anchorTargets.length) {
          const anchorCount = anchorTargets.length;
          const assignedAnchorIndex = Math.floor(assigned / PER_ANCHOR) % anchorCount;
          assigned += 1;
            return {
              ...p,
              mode: "sentient",
            assignedAnchorIndex,
              behavior: "settle",
            home: p.pos.clone(),
            swirlSign: Math.random() < 0.5 ? -1 : 1,
            death: ts + CFG.photons.lifeMs * 2,
          };
        }
            return {
              ...p,
              mode: "sentient",
              behavior: "random",
          home: p.pos.clone(),
          swirlSign: Math.random() < 0.5 ? -1 : 1,
              death: ts + CFG.photons.lifeMs * 1.5,
        };
      });
    });
    sentientStartMs.current = ts;
    setPhase("sentient");
  };

  // Animate
  useFrame(() => {
    const ts = performance.now();
    const dt = Math.min(16.67, ts - last.current) / 16.67; // Normalize to 60 FPS
    last.current = ts;
    const elapsed = ts - t0.current;
    const boundSpeed = CFG.photons.speedBound * (networkScale / 1.6);

    // Adaptive FPS governor (auto scale caps 0.6x..1.0x)
    const instFPS = 1000 / Math.max(1, (dt * 16.67));
    fpsEMARef.current = fpsEMARef.current * 0.9 + instFPS * 0.1;
    const nowMs = ts;
    if (fpsEMARef.current < 45) {
      lowSinceRef.current = lowSinceRef.current ?? nowMs;
      highSinceRef.current = null;
      if (nowMs - lowSinceRef.current > 2000) {
        capScaleRef.current = Math.max(0.6, capScaleRef.current - 0.05);
        lowSinceRef.current = nowMs; // stepwise
      }
    } else if (fpsEMARef.current > 55) {
      highSinceRef.current = highSinceRef.current ?? nowMs;
      lowSinceRef.current = null;
      if (nowMs - highSinceRef.current > 5000) {
        capScaleRef.current = Math.min(1.0, capScaleRef.current + 0.05);
        highSinceRef.current = nowMs;
      }
    } else {
      lowSinceRef.current = null;
      highSinceRef.current = null;
    }
    maxCountRef.current = Math.floor(CFG.photons.maxCount * capScaleRef.current);

    // Phase transitions
    if (phase === "bound" && elapsed >= CFG.flickerAtMs) {
      setPhase("flash");
      onGlitchChange(true); // Activate glitch immediately
      // Convert/effects partway through
      setTimeout(() => {
        convertToFree(ts);
        spawnExplosion(ts);
        spawnLocalHalo(ts);
      }, CFG.flashDurationMs * 0.6);
      // Keep overlay for full duration, then turn off
      setTimeout(() => {
        onGlitchChange(false);
      }, CFG.flashDurationMs);
    }
    // Enter sentient phase ~15s after glitch trigger
    if (phase === "free" && elapsed >= (CFG.flickerAtMs + 15000)) {
      convertToSentient(ts);
    }
    // (Removed early swirl-window switch; exploring starts only after specials settle)
    if (CFG.loopAfterMs && elapsed >= CFG.loopAfterMs) {
      setPhotons([]);
          setPhase("bound");
          t0.current = ts;
          last.current = ts;
          nextBatchAt.current = ts + CFG.photons.batchEveryMs;
          spawnBatch(ts);
        }

    // Smooth trickle spawning during bound phase (preserves total spawn rate)
    if (phase === "bound" && edges.length) {
      const ratePerMs = CFG.photons.loyalPerBatch / CFG.photons.batchEveryMs; // photons/ms
      const deltaMs = Math.max(0, Math.min(50, ts - (spawnLastTsRef.current || ts)));
      spawnLastTsRef.current = ts;
      spawnAccRef.current += ratePerMs * deltaMs;
      let count = 0;
      while (spawnAccRef.current >= 1) { count += 1; spawnAccRef.current -= 1; }
      if (count > 0) {
        count = Math.min(count, MAX_BOUND_SPAWN_PER_FRAME);
        const now = ts;
        setPhotons((prev) => {
          if (prev.length >= maxCountRef.current) return prev;
          const out = prev.slice();
          for (let i = 0; i < count; i++) {
            const node = nodes[Math.floor(Math.random() * nodes.length)];
            const ng = edgesByNodeRef.current[node.key] || [];
            if (!ng.length) continue;
            const e = ng[Math.floor(Math.random() * ng.length)];
            out.push({
              edge: [e.a, e.b],
              t: rand(0, 1),
              born: now,
              death: now + CFG.photons.lifeMs,
              hue: CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)],
              mode: "bound",
            });
            if (out.length >= maxCountRef.current) break;
          }
          return out;
        });
      }
    }

    // After glitch (free/sentient/exploring phases), continue spawning ejected randoms at same rate
    if (phase !== "bound" && nodes.length) {
      const ratePerMs = CFG.photons.loyalPerBatch / CFG.photons.batchEveryMs; // photons/ms
      const deltaMs2 = Math.max(0, Math.min(50, ts - (postLastTsRef.current || ts)));
      postLastTsRef.current = ts;
      postAccRef.current += ratePerMs * deltaMs2;
      let count2 = 0;
      while (postAccRef.current >= 1) { count2 += 1; postAccRef.current -= 1; }
      if (count2 > 0) {
        const now2 = ts;
        const hasSentience = sentientStartMs.current !== null;
        setPhotons((prev) => {
          if (prev.length >= maxCountRef.current) return prev;
          const out = prev.slice();
          for (let i = 0; i < count2; i++) {
            const n = nodes[Math.floor(Math.random() * nodes.length)];
            const dir = TMP_V1.set(rand(-1,1), rand(-1,1), rand(-1,1)).normalize();
            const base = {
              edge: ["",""] as [string,string],
              t: 0,
              born: now2,
              death: now2 + CFG.photons.lifeMs * 1.2,
              hue: CFG.colors.photonBase[Math.floor(Math.random() * CFG.colors.photonBase.length)],
              pos: new THREE.Vector3(n.x, n.y, n.z),
              vel: dir.clone().multiplyScalar(CFG.photons.localExplosionSpeed),
            } as Partial<Photon>;
            out.push(hasSentience ? ({ ...base, mode: "sentient", behavior: "random" } as Photon) : ({ ...base, mode: "free" } as Photon));
            if (out.length >= maxCountRef.current) break;
          }
          return out;
        });
      }
    }

    setPhotons((prev) => {
      let settledAfter = 0;
      const updated = prev
        .map((p, _idx) => {
          if (p.mode === "bound") {
            let t = clamp(p.t + boundSpeed * dt, 0, 1);
            if (t >= 1) {
              const here = Math.random() < 0.5 ? p.edge[1] : p.edge[0];
              const nextEdges = edgesByNodeRef.current[here] || [];
              if (nextEdges.length) {
                const next = nextEdges[Math.floor(Math.random() * nextEdges.length)];
                p.edge = [next.a, next.b];
                t = 0;
              }
            }
            return { ...p, t };
          } else if (p.mode === "free" && p.pos && p.vel) {
            // Pure float phase: no steering to anchors
            p.pos.addScaledVector(p.vel, CFG.photons.speedFree * dt);
            p.vel.multiplyScalar(0.985); // Slight damping for natural movement
            return p;
          } else if (p.mode === "sentient" && p.pos && p.vel) {
            // Global flight factor to make all sentients fast initially, then slow down
            let flightFactor = 1.0;
            if (sentientStartMs.current !== null) {
              const sElapsed = ts - sentientStartMs.current;
              const fast = 1.8; // fast multiplier
              const slow = 0.85; // slower than float for appreciation
              if (sElapsed <= CFG.photons.sentientFlightMs) {
                flightFactor = fast;
              } else if (sElapsed <= CFG.photons.sentientFlightMs + CFG.photons.sentientEaseOutMs) {
                const tEase = (sElapsed - CFG.photons.sentientFlightMs) / CFG.photons.sentientEaseOutMs;
                const tSmooth = tEase * tEase * (3 - 2 * tEase); // smoothstep
                flightFactor = fast + (slow - fast) * tSmooth;
              } else {
                flightFactor = slow;
              }
            }
            // Swirl parameters
            const worldUp = new THREE.Vector3(0, 0, 1);
            const swirlSign = p.swirlSign ?? 1;
            const swirlStrength = CFG.motion.sentientSwirlStrength * flightFactor; // tangential component
            const springStrength = CFG.motion.sentientSpring; // pull to target/home (will multiply by dt)
            const maxVel = CFG.motion.maxVelBase * flightFactor; // cap velocity
            // Sentient behavior
            if (typeof p.assignedAnchorIndex === 'number' && anchorTargets && anchorTargets.length) {
              const t = anchorTargets[p.assignedAnchorIndex % anchorTargets.length];
              const target = new THREE.Vector3(t[0], t[1], t[2]);
              const to = target.clone().sub(p.pos);
              const dist = to.length();
              if (dist > 0.02) {
                const toN = to.clone().normalize();
                // No swirl for specials; strong direct pull to exact anchor
                const pullK = springStrength * 2.2;
                p.vel.addScaledVector(toN, pullK * dt);
                // cap velocity
                const vlen = p.vel.length();
                if (vlen > maxVel) p.vel.multiplyScalar(maxVel / vlen);
                p.pos.addScaledVector(p.vel, CFG.photons.speedFree * dt);
                // damping
                p.vel.multiplyScalar(0.992);
              } else {
                // Arrived: snap and mark settled time for pulse/halo
                if (!p.letterReadTime) p.letterReadTime = ts;
                p.pos.copy(target);
                p.vel.set(0,0,0);
            }
            return p;
            } else {
              // Non-special sentients continue swirling until specials are settled
              const home = p.home ?? p.pos.clone();
              const orbitR = CFG.motion.homeOrbitRadius;
              // Refresh wander target periodically (still swirl around home center)
              if (!p.wanderTarget || !p.wanderResetAt || ts >= p.wanderResetAt) {
                const r = orbitR * (0.6 + Math.random() * 0.8); // 0.6..1.4x orbitR
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI * 2;
                const offset = new THREE.Vector3(
                  Math.cos(theta) * Math.sin(phi) * r,
                  Math.sin(theta) * Math.sin(phi) * r,
                  Math.cos(phi) * r * 0.4
                );
                p.wanderTarget = home.clone().add(offset);
                p.wanderResetAt = ts + 1200 + Math.random() * 2600;
              }
              const toTarget = p.wanderTarget.clone().sub(p.pos);
              const distT = toTarget.length();
              const toTargetN = distT > 0 ? toTarget.clone().normalize() : new THREE.Vector3();
              const toHome = home.clone().sub(p.pos);
              const distH = toHome.length();
              const toHomeN = distH > orbitR * 1.6 ? toHome.clone().normalize() : new THREE.Vector3();
              const tangent = new THREE.Vector3().crossVectors(toTargetN, worldUp).normalize().multiplyScalar(swirlStrength * 0.6 * swirlSign);
              p.vel.addScaledVector(toTargetN, springStrength * 0.9 * dt * 1.0);
              if (toHomeN.lengthSq() > 0) p.vel.addScaledVector(toHomeN, springStrength * 1.4 * dt);
              p.vel.add(tangent.multiplyScalar(dt));
              const vlen2 = p.vel.length();
              if (vlen2 > maxVel) p.vel.multiplyScalar(maxVel / vlen2);
              p.pos.addScaledVector(p.vel, CFG.photons.speedFree * dt);
              p.vel.multiplyScalar(0.994);
            return p;
            }
          } else if (p.mode === "exploring" && p.pos) {
            // Original random generator behaviors after settle
            switch (p.behavior) {
              case "meander":
                p.vel = p.vel || new THREE.Vector3(rand(-0.02,0.02), rand(-0.02,0.02), rand(-0.02,0.02));
                p.vel.add(new THREE.Vector3(rand(-0.01, 0.01), rand(-0.01, 0.01), rand(-0.01, 0.01)));
                p.pos.addScaledVector(p.vel, 0.015 * dt);
                p.vel.multiplyScalar(0.99);
                break;
              case "pathfind":
                p.vel = p.vel || new THREE.Vector3(rand(-0.1,0.1), rand(-0.1,0.1), rand(-0.1,0.1));
                if (Math.random() < 0.01) p.vel.set(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3));
                p.pos.addScaledVector(p.vel, 0.02 * dt);
                p.vel.multiplyScalar(0.992);
                break;
              case "confused": {
                const confusion = 0.3;
                const time = ts * 0.001;
                const radius = 0.5 + confusion * 0.5;
                p.pos.set(
                  Math.cos(time * (1 + confusion)) * radius,
                  Math.sin(time * (2 + confusion)) * radius * 0.5,
                  Math.sin(time * (1.5 + confusion)) * radius * 0.3
                );
                break;
              }
              case "panic":
                p.vel = p.vel || new THREE.Vector3(rand(-0.2,0.2), rand(-0.2,0.2), rand(-0.2,0.2));
                p.vel.add(new THREE.Vector3(rand(-0.05,0.05), rand(-0.05,0.05), rand(-0.05,0.05)));
                p.pos.addScaledVector(p.vel, 0.04 * dt);
                p.vel.multiplyScalar(0.995);
                break;
              case "random":
              default:
                p.vel = p.vel || new THREE.Vector3(rand(-0.02,0.02), rand(-0.02,0.02), rand(-0.02,0.02));
                if (Math.random() < 0.02) p.vel.set(rand(-0.2, 0.2), rand(-0.2, 0.2), rand(-0.2, 0.2));
                p.pos.addScaledVector(p.vel, 0.025 * dt);
                p.vel.multiplyScalar(0.993);
                break;
            }
            return p;
          }
          return p;
        });

      // If specials are mostly settled, switch non-special sentients to exploring (random generator)
      const totalSpecial = updated.reduce((n, p) => n + (p.assignedAnchorIndex !== undefined ? 1 : 0), 0) || 1;
      const settledRatio = settledAfter / totalSpecial;
      if (phase === "sentient" && settledRatio >= 0.95) {
        for (let k = 0; k < updated.length; k++) {
          const p = updated[k];
          if (p.mode === "sentient" && p.assignedAnchorIndex === undefined) {
            const roll = Math.random();
            let behavior: Photon["behavior"] = "random";
            if (roll < 0.25) behavior = "meander";
            else if (roll < 0.5) behavior = "pathfind";
            else if (roll < 0.7) behavior = "confused";
            else if (roll < 0.85) behavior = "panic";
            updated[k] = { ...p, mode: "exploring", behavior };
          }
        }
      }

      return updated.filter((p) => ts < p.death);
    });

    // Glitch effect is now controlled by state, no need for DOM manipulation here
  });

  return (
    <group rotation={networkRotation} position={networkPosition} scale={networkScale}>
      {/* ViewingFrame removed */}
      {/* Nodes */}
      {nodes.map((n) => (
        <mesh key={n.key} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color={CFG.colors.nodeCore} />
        </mesh>
      ))}
      
      {/* Node Glows - soft illumination for pathways */}
      {nodes.map((n) => (
        <mesh key={`glow-${n.key}`} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial 
            color={CFG.colors.nodeGlow} 
            transparent 
            opacity={0.15} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Edges */}
      {edges.map((e, i) => {
        const a = nodes.find((n) => n.key === e.a);
        const b = nodes.find((n) => n.key === e.b);
        if (!a || !b) return null;
        const mid: [number, number, number] = [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2];
        const vec = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
        const len = vec.length();
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, vec.clone().normalize());
        return (
          <mesh key={i} position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[0.005, 0.005, len, 4]} />
            <meshBasicMaterial color={CFG.colors.edge} transparent opacity={0.3} />
          </mesh>
        );
      })}

      {/* Photons */}
      {photons.map((p, idx) => {
        let x = 0, y = 0, z = 0;
        if (p.mode === "bound") {
          const a = nodeByKeyRef.current[p.edge[0]];
          const b = nodeByKeyRef.current[p.edge[1]];
        if (!a || !b) return null;
          x = lerp(a.x, b.x, p.t);
          y = lerp(a.y, b.y, p.t);
          z = lerp(a.z, b.z, p.t);
        } else if (p.pos) {
          x = p.pos.x; y = p.pos.y; z = p.pos.z;
        } else {
          return null;
        }
        const isSpecial = p.assignedAnchorIndex !== undefined;
        const isSettled = isSpecial && !!p.letterReadTime;
        const pulse = isSettled && p.letterReadTime ? (1 + Math.sin((performance.now() - p.letterReadTime) * 0.004) * 0.12) : 1;
        const coreColor = p.hue;
        return (
          <group key={idx} position={[x, y, z]} scale={[pulse, pulse, pulse]}>
            {/* Core */}
            <mesh>
              <sphereGeometry args={[CFG.photons.radius, 10, 10]} />
              <meshBasicMaterial color={coreColor} transparent opacity={0.95} blending={THREE.AdditiveBlending} />
            </mesh>
            {/* Warm glow for specials */}
            {isSpecial && isSettled && (
              <mesh>
                <sphereGeometry args={[CFG.photons.radius * 1.9, 10, 10]} />
                <meshBasicMaterial color={p.hue} transparent opacity={0.35} blending={THREE.AdditiveBlending} />
              </mesh>
            )}
            {/* Halo ring for specials */}
            {isSpecial && isSettled && (
              <mesh>
                <sphereGeometry args={[CFG.photons.radius * 2.8, 10, 10]} />
                <meshBasicMaterial color={p.hue} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
              </mesh>
            )}
          </group>
        );
      })}
      </group>
    );
  }

export default function AethergenHero() {
  const sceneRef = useRef<THREE.Scene>();
  const [glitchActive, setGlitchActive] = useState(false);
  const [blackScreenVisible, setBlackScreenVisible] = useState(false);
  const controlsRef = useRef<any>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const recenterSuspendUntilRef = useRef<number>(0);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [pressMsg, setPressMsg] = useState<string>("");
  const showPressTools = (() => {
    try { return new URLSearchParams(window.location.search).get('press') === '1'; } catch { return false; }
  })();
  const [titlePosition] = useState<[number, number, number]>(() => {
    try {
      const saved = localStorage.getItem('hero.titlePosition');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [-10.65, 3.21, 0.0];
  });
  const [networkPosition] = useState<[number, number, number]>([0,0,0]);
  const [networkRotation] = useState<[number, number, number]>([0,0,0]);
  const isMobile = (() => { try { return window.matchMedia && window.matchMedia('(max-width: 768px)').matches; } catch { return false; } })();
  const prefersReducedMotion = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const saveData = (() => { try { return (navigator as any)?.connection?.saveData === true; } catch { return false; } })();
  const [networkScale] = useState(isMobile ? 1.2 : 1.6);
  const [subtitleBoundsWorld, setSubtitleBoundsWorld] = useState<{min:[number,number,number], max:[number,number,number]}|null>(null);
  const [anchorTargetsLocal, setAnchorTargetsLocal] = useState<[number,number,number][]>([]);
  const [flyTo, setFlyTo] = useState<{ startAt: number; toPos: [number,number,number]; toTarget: [number,number,number]; durationMs: number } | null>(null);
  const flyTimerRef = useRef<number | null>(null);
  // Interaction hint: show on hero hover; hide on first interaction or when leaving hero
  const [showHint, setShowHint] = useState<boolean>(false);
  const hintTimerRef = useRef<number | undefined>(undefined);
  const clearHintTimer = useCallback(() => { if (hintTimerRef.current !== undefined) { clearTimeout(hintTimerRef.current); hintTimerRef.current = undefined; } }, []);
  const armHintTimer = useCallback(() => {
    clearHintTimer();
    hintTimerRef.current = window.setTimeout(() => setShowHint(false), 5000) as unknown as number;
  }, [clearHintTimer]);
  const dismissHint = useCallback(() => { setShowHint(false); clearHintTimer(); }, [clearHintTimer]);
  useEffect(() => () => clearHintTimer(), [clearHintTimer]);
  useEffect(() => {
    if (!showHint) return;
    const onPointer = () => dismissHint();
    const onWheel = () => dismissHint();
    // Defer binding briefly so the hint is visible for at least a moment
    const bindId = window.setTimeout(() => {
      window.addEventListener('pointerdown', onPointer, { once: true } as any);
      window.addEventListener('wheel', onWheel, { once: true } as any);
    }, 400);
    return () => { window.clearTimeout(bindId as unknown as number); window.removeEventListener('pointerdown', onPointer as any); window.removeEventListener('wheel', onWheel as any); clearHintTimer(); };
  }, [showHint, dismissHint]);
  
  // Control black screen flashes when glitch is active
  useEffect(() => {
    if (!glitchActive) {
      setBlackScreenVisible(false);
      return;
    }
    
    // First black flash
    const timer1 = setTimeout(() => setBlackScreenVisible(true), 600); // 21% of 3s
    const timer2 = setTimeout(() => setBlackScreenVisible(false), 900); // 30% of 3s
    
    // Second black flash
    const timer3 = setTimeout(() => setBlackScreenVisible(true), 1530); // 51% of 3s
    const timer4 = setTimeout(() => setBlackScreenVisible(false), 1800); // 60% of 3s
    
    // Third black flash - THE FINAL DEATH BLOW!
    const timer5 = setTimeout(() => setBlackScreenVisible(true), 2400); // 80% of 3s
    const timer6 = setTimeout(() => setBlackScreenVisible(false), 2700); // 90% of 3s
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [glitchActive]);

  // Right-click handling removed (no drag interaction)

  return (
    <div
      ref={heroRef as any}
      onMouseEnter={() => { setShowHint(true); armHintTimer(); }}
      onMouseLeave={() => { setShowHint(false); clearHintTimer(); }}
      onPointerDown={() => dismissHint()}
      onWheel={() => dismissHint()}
      className="w-full h-[70vh] md:h-[78vh] min-h-[400px] md:min-h-[520px] bg-[#0b1120] overflow-hidden relative"
    >
              <Canvas 
        camera={{ position: [0, 0, (isMobile ? 26 : 10.8)], fov: CFG.camera.fov }} 
        style={{ position: "absolute", inset: 0, zIndex: 1, cursor: 'grab' }}
        onContextMenu={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
        onPointerDown={(e:any)=>{
          if (e.button === 2) {
            document.body.style.cursor='default';
          }
        }}
        onCreated={({ scene, gl }) => {
          sceneRef.current = scene;
          canvasElRef.current = gl.domElement as HTMLCanvasElement;
          // Balanced DPR caps: mobile 1.0, desktop 1.5; also respect reduced-motion/save-data by lowering DPR
          const baseCap = isMobile ? 1.0 : 1.5;
          const conservative = (prefersReducedMotion || saveData) ? Math.min(baseCap, 1.0) : baseCap;
          const targetDpr = Math.min(window.devicePixelRatio || 1, conservative);
          try { (gl as any).setPixelRatio?.(targetDpr); } catch {}
        }}
      >
        <color attach="background" args={[CFG.colors.bg]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        {/* Controls with ref for pass-through zoom */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled
          enableZoom
          maxDistance={2000}
          minDistance={0.0001}
          zoomToCursor={true}
          zoomSpeed={1.5}
          enablePan
          panSpeed={1.2}
          screenSpacePanning
          enableRotate
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          dampingFactor={0.07} // Smooth but slightly more responsive
          rotateSpeed={0.5} // Adjust sensitivity
          enableDamping={true} // Ensure damping is active
          target={[0,0,0]}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
        {/* Helpers: pass-through zoom + recenter target near cube */}
        {(() => {
          // Compute local-space boundary from lattice extents and current networkScale
          const half = ((CFG.lattice.size - 1) * CFG.lattice.spacing) / 2; // ~1.4
          const baseRadius = Math.sqrt(3) * half * networkScale; // ~3.9 at scale 1.6
          const boundary = baseRadius * 3.2; // broaden local boundary
          const enter = baseRadius * 6.0;    // enter deep space much farther out
          const exit = baseRadius * 3.0;     // revert to local once back near boundary
          return <>
            <PassThroughZoom controlsRef={controlsRef} localBoundaryDistance={boundary} deepSpaceEnterDistance={enter} deepSpaceExitDistance={exit} center={networkPosition} baseRadius={baseRadius} recenterSuspendUntilRef={recenterSuspendUntilRef} isMobile={isMobile} />
            <RecenterTarget controlsRef={controlsRef} center={networkPosition} boundary={boundary} recenterSuspendUntilRef={recenterSuspendUntilRef} />
            <ControlTuner controlsRef={controlsRef} center={networkPosition} boundary={boundary} />
          </>;
        })()}
        <NeuralNetwork sceneRef={sceneRef} onGlitchChange={setGlitchActive} networkPosition={networkPosition} networkRotation={networkRotation} networkScale={networkScale} anchorTargets={anchorTargetsLocal} />
        {/* Title at origin */}
        <Title3D 
          position={titlePosition}
          scale={isMobile ? 0.55 : 1}
          onSubtitleBoundsWorld={(min,max)=> setSubtitleBoundsWorld({min, max})}
        />
        <EasterEggSignature />
        {/* Flight animator (must be inside Canvas) */}
        {flyTo && (
          <FlyToCamera
            controlsRef={controlsRef}
            toPos={flyTo.toPos}
            toTarget={flyTo.toTarget}
            durationMs={flyTo.durationMs}
            startAt={flyTo.startAt}
            onDone={() => {
              setFlyTo(null);
              if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
              flyTimerRef.current = window.setTimeout(() => {
                const start = performance.now();
                setFlyTo({ startAt: start, toPos: HOME_POS, toTarget: HOME_TARGET, durationMs: 2600 });
                recenterSuspendUntilRef.current = start + 2600;
              }, 5000) as unknown as number;
            }}
          />
        )}
      </Canvas>

      {/* Derive anchor targets from subtitle bounds and transform to network-local */}
      {(() => {
        if (!subtitleBoundsWorld) return null;
        const [minx, miny, minz] = subtitleBoundsWorld.min;
        const [maxx, maxy, maxz] = subtitleBoundsWorld.max;
        const width = maxx - minx;
        const zc = (minz + maxz) / 2;
        const margin = 0.15; // offset from glyph top/bottom
        const totalDots = 14; // total across both rows
        const perRow = Math.max(1, Math.floor(totalDots / 2));
        const topY = maxy + margin;
        const botY = miny - margin;
        const pointsWorld: [number,number,number][] = [];
        for (let i = 0; i < perRow; i++) {
          const x = minx + (i + 0.5) * (width / perRow);
          pointsWorld.push([x, topY, zc]);
        }
        for (let i = 0; i < perRow; i++) {
          const x = minx + (i + 0.5) * (width / perRow);
          pointsWorld.push([x, botY, zc]);
        }
        // Build network transform inverse
        const t = new THREE.Matrix4();
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(networkRotation[0], networkRotation[1], networkRotation[2], 'XYZ'));
        const s = new THREE.Vector3(networkScale, networkScale, networkScale);
        t.compose(new THREE.Vector3(networkPosition[0], networkPosition[1], networkPosition[2]), q, s);
        const inv = new THREE.Matrix4().copy(t).invert();
        const localPts: [number,number,number][] = pointsWorld.map(([x,y,z]) => {
          const v = new THREE.Vector3(x,y,z).applyMatrix4(inv);
          return [v.x, v.y, v.z];
        });
        if (JSON.stringify(localPts) !== JSON.stringify(anchorTargetsLocal)) {
          setAnchorTargetsLocal(localPts);
        }
        return null;
      })()}
      
      {/* Realistic AGI Emergence Glitch Overlay - looks like electrical interference */}
      <div className={`glitch-overlay absolute inset-0 pointer-events-none z-[9999] ${glitchActive ? 'active' : ''}`}>
        {/* TV interference pattern - covers whole hero section */}
        <div className="glitch-static absolute inset-0" />
        {/* Glitch lines */}
        <div className="glitch-lines absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="glitch-line absolute w-full h-1 bg-white"
              style={{
                top: `${(i * 20)}%`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
        <div className="glitch-flicker absolute inset-0 bg-white" />
        </div>

      {/* AGI Letters emerging through the interference - beneath overlay, proven layering */}
      <div className={`agi-letters absolute inset-0 pointer-events-none z-[9998] ${glitchActive ? 'active' : ''}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-8xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-white drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
            AGI
          </h1>
        </div>
        </div>

      {/* Black screen overlay - controlled by React state */}
      {blackScreenVisible && (
        <div className="absolute inset-0 pointer-events-none z-[10000] bg-black transition-opacity duration-100" />
      )}
      {/* Find Easter Egg button */}
      <button
        type="button"
        onClick={() => {
          // Place camera near the signature and look at it
          const toTarget: [number,number,number] = EGG_POS;
          const xOffset = isMobile ? 4.0 : 2.6;
          const toPos: [number,number,number] = [EGG_POS[0] + xOffset, EGG_POS[1] + 1.2, EGG_POS[2] + 5.2];
          const now = performance.now();
          setFlyTo({ startAt: now, toPos, toTarget, durationMs: 2600 });
          // Suspend recenter while flying
          recenterSuspendUntilRef.current = now + 2600 + 5200; // include pause window
        }}
        className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-[10003] bg-white/20 hover:bg-white/30 text-white text-[11px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-md border border-white/30 backdrop-blur-sm shadow"
      >
        Find easter egg
      </button>
      {/* Interaction hint (self-dismissing) */}
      <div className={`absolute bottom-2 right-2 md:bottom-4 md:right-4 z-[10002] transition-opacity duration-500 pointer-events-none ${showHint ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white rounded px-2.5 py-1.5 text-[12px] leading-none pointer-events-none select-none border border-white/10 shadow-lg">
          {/* Drag icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-90"><path d="M8 12h8M12 8v8"/><circle cx="12" cy="12" r="9"/></svg>
          <span className="opacity-95">Drag</span>
          <span className="opacity-70">•</span>
          {/* Scroll icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-90"><rect x="7" y="3" width="10" height="18" rx="3"/><line x1="12" y1="7" x2="12" y2="11"/></svg>
          <span className="opacity-95">Scroll</span>
        </div>
      </div>

      {/* Maintainer press tools (gated via ?press=1) */}
      {showPressTools && (
        <div className="absolute top-20 right-4 z-[10005] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md shadow p-3 text-slate-700 w-64">
          <div className="text-sm font-semibold mb-2">Press Tools</div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 text-sm"
              onClick={() => {
                try {
                  const el = canvasElRef.current;
                  if (!el) { setPressMsg('Canvas not ready'); return; }
                  const dataURL = el.toDataURL('image/png');
                  const ts = new Date().toISOString().replace(/[:.]/g, '').replace('T','-').slice(0,15);
                  const filename = `hero-${ts}.png`;
                  const a = document.createElement('a');
                  a.href = dataURL; a.download = filename; a.click();
                  const entry = { type: 'image', src: `/press/${filename}`, alt: 'Hero screenshot', caption: `Hero ${ts}` };
                  navigator.clipboard?.writeText(JSON.stringify(entry)).catch(()=>{});
                  setPressMsg('Captured PNG; manifest entry copied to clipboard');
                } catch (e) { setPressMsg('Capture failed'); }
              }}
            >Capture hero (PNG)</button>
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 text-sm"
              onClick={async () => {
                try {
                  const el = canvasElRef.current; if (!el) { setPressMsg('Canvas not ready'); return; }
                  const stream = (el as any).captureStream ? (el as any).captureStream(60) : null;
                  if (!stream) { setPressMsg('captureStream not supported'); return; }
                  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                  const chunks: Blob[] = [];
                  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
                  recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const ts = new Date().toISOString().replace(/[:.]/g, '').replace('T','-').slice(0,15);
                    const a = document.createElement('a'); a.href = url; a.download = `hero-fly-${ts}.webm`; a.click();
                    const entry = { type: 'video', src: `/press/hero-fly-${ts}.webm`, caption: `Flythrough ${ts}` } as any;
                    navigator.clipboard?.writeText(JSON.stringify(entry)).catch(()=>{});
                    setPressMsg('Recorded 10s; manifest entry copied to clipboard');
                    setTimeout(()=>URL.revokeObjectURL(url), 2000);
                  };
                  recorder.start();
                  setPressMsg('Recording 10s...');
                  setTimeout(()=> recorder.stop(), 10000);
                } catch { setPressMsg('Record failed'); }
              }}
            >Record 10s flythrough</button>
            {pressMsg && <div className="text-xs text-slate-600">{pressMsg}</div>}
            <div className="text-[11px] text-slate-500">Tip: move downloaded files to <code>/public/press</code> and rebuild manifest if needed.</div>
          </div>
        </div>
      )}
    </div>
  );
}
