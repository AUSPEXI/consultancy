import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ScreenQuad } from '@react-three/drei';
import * as THREE from 'three';

// Reusable SDF approximation in JS for camera/particle helpers
const sdfJS = (p:THREE.Vector3,t:number)=>{
  const gyroid = (pp:THREE.Vector3,a:number)=> Math.sin(pp.x)*Math.cos(pp.y)+Math.sin(pp.y)*Math.cos(pp.z)+Math.sin(pp.z)*Math.cos(pp.x)-a;
  const superq = (pp:THREE.Vector3,abc:THREE.Vector3,powr:THREE.Vector3)=>{
    const q = new THREE.Vector3(Math.abs(pp.x/abc.x), Math.abs(pp.y/abc.y), Math.abs(pp.z/abc.z));
    return Math.pow(q.x, powr.x)+Math.pow(q.y, powr.y)+Math.pow(q.z, powr.z)-1.0;
  };
  const pulse = 0.5+0.5*Math.sin(t*0.5);
  const a = 0.25+0.25*Math.sin(t*0.7);
  const g = gyroid(p.clone().multiplyScalar(1.1), a)* (0.5+0.2*pulse);
  const abc = new THREE.Vector3(1.2+0.3*pulse, 0.9+0.2*Math.sin(t*0.5), 1.0+0.2*Math.cos(t*0.3));
  const powr = new THREE.Vector3(2.0+0.6*pulse,2.5,2.0);
  const sq = superq(p, abc, powr);
  const k = 0.45+0.15*pulse;
  // smooth min
  const h = Math.max(0, Math.min(1, 0.5 + 0.5*(sq - g)/k));
  const sminVal = ((h-1.0)*k*h + g) + ((1.0-h)*k*(1.0-h) + sq - ((1.0-h)*k));
  // clamp opening so the shell doesn't collapse visually at extreme angles
  const open = 0.12; // must match uOpen-ish; smaller to stabilize
  return sminVal - open;
};

const gradJS = (p:THREE.Vector3, t:number, e=0.01)=>{
  const base = sdfJS(p, t);
  const dx = (sdfJS(new THREE.Vector3(p.x+e,p.y,p.z), t) - base) / e;
  const dy = (sdfJS(new THREE.Vector3(p.x,p.y+e,p.z), t) - base) / e;
  const dz = (sdfJS(new THREE.Vector3(p.x,p.y,p.z+e), t) - base) / e;
  return new THREE.Vector3(dx,dy,dz);
};

// (raymarch helper not used; kept minimal footprint)

const GyroidSuperquadricMaterial: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, gl } = useThree();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uCamPos: { value: new THREE.Vector3(0, 0, 3.5) },
    uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    uCamForward: { value: new THREE.Vector3(0, 0, -1) },
    uFocal: { value: 1.6 },
    uCurvOverlay: { value: 0.0 },
    uOpen: { value: 0.2 },
  }), [size.width, size.height]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Keep resolution in sync with device pixel ratio
      const dw = (gl as any).domElement.width || gl.getSize(new THREE.Vector2()).width * gl.getPixelRatio();
      const dh = (gl as any).domElement.height || gl.getSize(new THREE.Vector2()).height * gl.getPixelRatio();
      materialRef.current.uniforms.uResolution.value.set(dw, dh);
      // Update camera uniforms for ray construction
      const cam = state.camera as THREE.PerspectiveCamera;
      // Focal length in view space (height normalized) from fov
      const fovRad = (cam.fov || 50) * Math.PI / 180;
      const focal = 1.0 / Math.tan(fovRad * 0.5);
      materialRef.current.uniforms.uFocal.value = focal;
      const m = cam.matrixWorld;
      const right = new THREE.Vector3(m.elements[0], m.elements[1], m.elements[2]).normalize();
      const up = new THREE.Vector3(m.elements[4], m.elements[5], m.elements[6]).normalize();
      const forward = new THREE.Vector3(-m.elements[8], -m.elements[9], -m.elements[10]).normalize();
      materialRef.current.uniforms.uCamPos.value.copy(cam.position as THREE.Vector3);
      materialRef.current.uniforms.uCamRight.value.copy(right);
      materialRef.current.uniforms.uCamUp.value.copy(up);
      materialRef.current.uniforms.uCamForward.value.copy(forward);
      // Bridge overlay state
      const ov = (window as any).__curvOverlay ? 1.0 : 0.0;
      materialRef.current.uniforms.uCurvOverlay.value = ov;

      // Auto pass-through: if near surface, nudge camera forward into field
      const distField = sdfJS(cam.position.clone(), state.clock.getElapsedTime());
      if (Math.abs(distField) < 0.05) {
        const fwd = new THREE.Vector3();
        cam.getWorldDirection(fwd);
        cam.position.addScaledVector(fwd, 0.02);
        (state as any).invalidate?.();
      }
    }
  });

  const fragmentShader = /* glsl */`
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uCamPos;
    uniform vec3 uCamRight;
    uniform vec3 uCamUp;
    uniform vec3 uCamForward;
    uniform float uFocal;
    uniform float uCurvOverlay;
    uniform float uOpen;

    // Hash/Noise helpers
    float hash(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }

    // Gyroid-like field
    float gyroid(vec3 p, float a){
      return sin(p.x)*cos(p.y) + sin(p.y)*cos(p.z) + sin(p.z)*cos(p.x) - a;
    }

    // Superquadric (superellipsoid-ish)
    float superq(vec3 p, vec3 abc, vec3 powr){
      vec3 q = abs(p/abc);
      float v = pow(q.x, powr.x) + pow(q.y, powr.y) + pow(q.z, powr.z) - 1.0;
      return v;
    }

    // Smooth min
    float smin(float a, float b, float k){
      float h = clamp(0.5 + 0.5*(b - a)/k, 0.0, 1.0);
      return mix(b, a, h) - k*h*(1.0 - h);
    }

    // Signed distance field (blend gyroid + superquadric)
    float sdf(vec3 p, float t){
      // Event pulse (bifurcation): slow envelope
      float pulse = 0.5 + 0.5*sin(t*0.5);
      float a = 0.25 + 0.25*sin(t*0.7);
      float g = gyroid(p*1.1, a);
      vec3 abc = vec3(1.2 + 0.3*pulse, 0.9 + 0.2*sin(t*0.5), 1.0 + 0.2*cos(t*0.3));
      vec3 powr = vec3(2.0 + 0.6*pulse, 2.5, 2.0);
      float sq = superq(p, abc, powr);
      // Map gyroid to pseudo-distance by scaling
      float gd = g * (0.5 + 0.2*pulse);
      // Blend hulls
      float k = 0.38 + 0.12*pulse;
      return smin(gd, sq, k) - uOpen; // open the hull slightly for easier entry (stable)
    }

    vec3 estimateNormal(vec3 p, float t){
      float e = 0.0015;
      vec2 h = vec2(1.0, -1.0) * e;
      return normalize(h.xyy*sdf(p + h.xyy, t) + h.yyx*sdf(p + h.yyx, t) + h.yxy*sdf(p + h.yxy, t) + h.xxx*sdf(p + h.xxx, t));
    }

    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy) / uResolution.y;
      float t = uTime;
      // Camera setup from uniforms
      vec3 ro = uCamPos;
      vec3 rd = normalize(uv.x * uCamRight + uv.y * uCamUp + (-uFocal) * uCamForward);

      // Raymarch (increase reach to minimize clipping)
      const int MAX_STEPS = 220;
      float MAX_DIST = 60.0;
      float SURF_EPS = 0.001;
      float d = 0.0;
      float hit = -1.0;
      vec3 p;
      for(int i=0;i<MAX_STEPS;i++){
        p = ro + rd*d;
        float dist = sdf(p, t);
        float ad = abs(dist);
        if(ad < SURF_EPS){ hit = 1.0; break; }
        d += clamp(ad*0.7, 0.003, 0.06);
        if(d>MAX_DIST) break;
      }

      // Sky gradient fallback
      vec3 sky = mix(vec3(0.06,0.08,0.14), vec3(0.01,0.02,0.04), clamp(rd.y*0.5+0.5, 0.0, 1.0));
      vec3 col = sky;
      if(hit>0.0){
        vec3 n = estimateNormal(p, t);
        // Curvature proxy via secondary sampling
        float k0 = sdf(p + n*0.02, t);
        float k1 = sdf(p - n*0.02, t);
        float curv = clamp(abs(k0 - k1)*15.0, 0.0, 1.0);
        // Lighting
        vec3 ld = normalize(vec3(0.6, 0.8, 0.2));
        float diff = clamp(dot(n, ld)*0.7+0.3, 0.0, 1.0);
        float hue = 0.5 + 0.5*sin(t*0.3 + curv*3.1415);
        vec3 base = mix(vec3(0.1,0.4,0.9), vec3(0.9,0.3,0.6), hue);
        col = base * (0.25 + 0.75*diff) + vec3(curv*0.3, curv*0.2, curv*0.5);
        // Edge halo
        float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
        col += fres * vec3(0.2, 0.3, 0.6);
        // Curvature overlay
        col = mix(col, col + vec3(curv)*0.6, clamp(uCurvOverlay,0.0,1.0));
        // Subtle fog for depth cue
        float fog = exp(-0.05 * d);
        col = mix(sky, col, fog);
      }

      // Vignette
      float v = 1.0 - dot(uv, uv);
      col *= smoothstep(0.0, 1.0, v);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const vertexShader = /* glsl */`
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  return (
    <ScreenQuad>
      <shaderMaterial ref={materialRef} fragmentShader={fragmentShader} vertexShader={vertexShader} uniforms={uniforms} />
    </ScreenQuad>
  );
};

const CaptureOverlayOutside: React.FC<{ hostRef: React.RefObject<HTMLDivElement> }> = ({ hostRef }) => {
  const onCapture = () => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = host.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = data;
    a.download = `manifold_poster_${Date.now()}.png`;
    a.click();
  };
  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 99999 }}>
      <button onClick={onCapture} style={{ padding: '8px 12px', background: '#0f172a', color: 'white', borderRadius: 8, border: '1px solid #334155' }}>
        Capture Poster
      </button>
    </div>
  );
};

// Simple CPU flowfield particles following a rough gradient proxy
const Particles: React.FC<{ enabled: boolean }>=({ enabled })=>{
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(()=>{
    const n = 1500;
    const arr = new Float32Array(n*3);
    for(let i=0;i<n;i++){
      const r = 1.5 + Math.random()*1.0;
      const th = Math.random()*Math.PI*2;
      const ph = Math.acos(2*Math.random()-1);
      arr[i*3+0] = r*Math.sin(ph)*Math.cos(th);
      arr[i*3+1] = r*Math.sin(ph)*Math.sin(th);
      arr[i*3+2] = r*Math.cos(ph);
    }
    return arr;
  },[]);

  // Approximate field gradient in JS (coarse, cheap)
  const sdfJS = (p:THREE.Vector3,t:number)=>{
    const gyroid = (pp:THREE.Vector3,a:number)=> Math.sin(pp.x)*Math.cos(pp.y)+Math.sin(pp.y)*Math.cos(pp.z)+Math.sin(pp.z)*Math.cos(pp.x)-a;
    const superq = (pp:THREE.Vector3,abc:THREE.Vector3,powr:THREE.Vector3)=>{
      const q = new THREE.Vector3(Math.abs(pp.x/abc.x), Math.abs(pp.y/abc.y), Math.abs(pp.z/abc.z));
      return Math.pow(q.x, powr.x)+Math.pow(q.y, powr.y)+Math.pow(q.z, powr.z)-1.0;
    };
    const pulse = 0.5+0.5*Math.sin(t*0.5);
    const a = 0.25+0.25*Math.sin(t*0.7);
    const g = gyroid(p.clone().multiplyScalar(1.1), a)* (0.5+0.2*pulse);
    const abc = new THREE.Vector3(1.2+0.3*pulse, 0.9+0.2*Math.sin(t*0.5), 1.0+0.2*Math.cos(t*0.3));
    const powr = new THREE.Vector3(2.0+0.6*pulse,2.5,2.0);
    const sq = superq(p, abc, powr);
    const k = 0.45+0.15*pulse;
    // smooth min approximation
    const h = Math.max(0, Math.min(1, 0.5 + 0.5*(sq - g)/k));
    return ( (h-1.0)*k*h + g ) + ( (1.0-h)*k*(1.0-h) + sq - ((1.0-h)*k) );
  };

  useFrame((state)=>{
    if(!enabled || !ref.current) return;
    const t = state.clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for(let i=0;i<arr.length;i+=3){
      const p = new THREE.Vector3(arr[i],arr[i+1],arr[i+2]);
      const e=0.01;
      const base = sdfJS(p,t);
      const dx = sdfJS(new THREE.Vector3(p.x+e,p.y,p.z),t)-base;
      const dy = sdfJS(new THREE.Vector3(p.x,p.y+e,p.z),t)-base;
      const dz = sdfJS(new THREE.Vector3(p.x,p.y,p.z+e),t)-base;
      const grad = new THREE.Vector3(dx,dy,dz).multiplyScalar(1.0/e);
      // Move opposite gradient, add slight curl
      p.addScaledVector(grad.normalize(), -0.015);
      p.applyAxisAngle(new THREE.Vector3(0,1,0), 0.002);
      // wrap
      if(p.length()>4.0) p.setLength(2.0);
      arr[i]=p.x; arr[i+1]=p.y; arr[i+2]=p.z;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={0x99ccff} size={0.02} sizeAttenuation opacity={0.8} transparent depthWrite={false} />
    </points>
  );
};

const ManifoldPrototype: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const [showCurv, setShowCurv] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const flyRef = useRef<{active:boolean; t:number}>({active:false, t:0});

  // Guided flythrough
  const startFly = () => { flyRef.current.active = true; flyRef.current.t = 0; };

  // Hard pass‑through: robust bracket+bisection to surface then step inside
  const enterPortal = () => {
    if (!controlsRef.current) return;
    const cam: THREE.PerspectiveCamera = controlsRef.current.object;
    const tnow = performance.now() * 0.001;
    // Build ray from camera through center of screen (forward dir)
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    const ro = cam.position.clone();
    const rd = forward.clone().normalize();
    // Sample along ray to find sign change
    let dPrev = 0.0;
    let sPrev = sdfJS(ro, tnow);
    let found = sPrev < 0.0; // already inside
    let d = 0.0;
    const MAX_DIST = 80.0;
    for (let i=0;i<400 && !found;i++){
      d += 0.2; // coarse step for bracket
      if (d > MAX_DIST) break;
      const p = ro.clone().addScaledVector(rd, d);
      const s = sdfJS(p, tnow);
      if (sPrev > 0.0 && s < 0.0) { // crossed surface
        // Bisection refine between dPrev and d
        let a = dPrev, b = d;
        for (let k=0;k<32;k++){
          const m = 0.5*(a+b);
          const pm = ro.clone().addScaledVector(rd, m);
          const sm = sdfJS(pm, tnow);
          if (sm < 0.0) b = m; else a = m;
        }
        d = 0.5*(a+b);
        found = true;
      }
      dPrev = d; sPrev = s;
    }
    let insidePos = ro.clone();
    if (found) {
      const pSurf = ro.clone().addScaledVector(rd, d);
      const n = gradJS(pSurf, tnow, 0.005).normalize();
      insidePos.copy(pSurf).addScaledVector(n, -2.5);
    } else {
      // Fallback: follow -grad for a while
      let pos = ro.clone();
      for (let i=0;i<800;i++){
        const s = sdfJS(pos, tnow);
        if (s < -1.0) break;
        const g = gradJS(pos, tnow, 0.01);
        if (g.lengthSq() < 1e-6) break;
        pos.addScaledVector(g.normalize(), -0.2);
      }
      insidePos.copy(pos);
    }
    // Apply and aim inward
    cam.position.copy(insidePos);
    const nAim = gradJS(insidePos, tnow, 0.01).normalize();
    const look = insidePos.clone().addScaledVector(nAim, -2.0);
    cam.lookAt(look);
    if (controlsRef.current.target) controlsRef.current.target.copy(look);
    if (controlsRef.current) { controlsRef.current.minDistance = 0.01; controlsRef.current.maxDistance = 200; }
    controlsRef.current.update();
  };

  // Wheel nudge for pass-through feel
  useEffect(()=>{
    const el = hostRef.current;
    if(!el) return;
    const onWheel = (e:WheelEvent)=>{
      if(!controlsRef.current) return;
      const cam: THREE.PerspectiveCamera = controlsRef.current.object;
      const forward = new THREE.Vector3();
      cam.getWorldDirection(forward);
      cam.position.addScaledVector(forward, -e.deltaY*0.0008);
      controlsRef.current.update();
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return ()=> el.removeEventListener('wheel', onWheel);
  },[]);
  return (
    <>
      <div ref={hostRef} style={{ position: 'fixed', inset: 0 as any, background: '#0b1120', zIndex: 9998 }}>
        <Canvas camera={{ position: [0, 0, 3.5], fov: 50, near: 0.01 }} style={{ position: 'absolute', inset: 0, zIndex: 9998 }}>
          <color attach="background" args={[0.04, 0.07, 0.13]} />
          <GyroidSuperquadricMaterial />
          {showParticles && <Particles enabled={true} />}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableDamping dampingFactor={0.08}
            minDistance={0.01}
            maxDistance={200}
            zoomToCursor={true}
            screenSpacePanning={true}
            target={[0,0,0] as any}
          />
        </Canvas>
      </div>
      <CaptureOverlayOutside hostRef={hostRef} />
      <div style={{ position:'fixed', left: 12, top: 12, zIndex: 99999, display:'flex', gap:8 }}>
        <label style={{ color:'#e2e8f0', background:'#0f172a', padding:'6px 10px', borderRadius:8, border:'1px solid #334155' }}>
          <input type="checkbox" checked={showCurv} onChange={(e)=>{ setShowCurv(e.target.checked); (window as any).__curvOverlay = e.target.checked?1:0; }} style={{ marginRight:6 }} /> Curvature overlay
        </label>
        <label style={{ color:'#e2e8f0', background:'#0f172a', padding:'6px 10px', borderRadius:8, border:'1px solid #334155' }}>
          <input type="checkbox" checked={showParticles} onChange={(e)=> setShowParticles(e.target.checked)} style={{ marginRight:6 }} /> Murmuration
        </label>
        <button onClick={startFly} style={{ color:'#e2e8f0', background:'#0f172a', padding:'6px 10px', borderRadius:8, border:'1px solid #334155' }}>Flythrough</button>
        <button onClick={enterPortal} style={{ color:'#e2e8f0', background:'#0f172a', padding:'6px 10px', borderRadius:8, border:'1px solid #334155' }}>Enter</button>
      </div>
    </>
  );
};

export default ManifoldPrototype;


