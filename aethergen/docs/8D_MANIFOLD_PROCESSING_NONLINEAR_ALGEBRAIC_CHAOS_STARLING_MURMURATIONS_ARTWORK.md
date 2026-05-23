# 8D Manifold: Processing Non‑Linear Algebraic Chaos — Starling Murmurations (Artwork Design Record)

Status: Concept Spec v0.1 (not in production)
Owner: Gwylym / Auspexi
Target medium: Three.js + GPU particles + SDF raymarch + R3F

## Intent
Create an experiential “inside‑the‑machine” artwork larger and more profound than the neural‑network hero scene. The audience flies through an evolving higher‑dimensional manifold projected into 3D space, where non‑linear algebraic structures, time events, and starling‑like murmurations reveal emergent intelligence and order within chaos.

## Core Principles
- Non‑neural: This is not a network lattice. It’s an algebraic/analytic sculpture driven by fields, not edges/nodes.
- 8D to 3D: Represent an 8‑dimensional state as layered fields projected into 3D via parameterisations, implicit surfaces (SDFs), and ribbon fibres.
- Time as structure: Events (pulses, glitches, bifurcations) reconfigure the manifold; not just an animation timeline, but a narrative of phase transitions.
- Swarm as witness: A murmuration (boids + flowfields) interprets the manifold, expressing “understanding” via flock density waves, splits, and reunions.
- Evidence‑ready: Keep instrumentation hooks (Jacobian/curvature overlays) and deterministic seeds for replays.

## Visual Layers
1) Manifold Core (Algebraic)
- Implicit surfaces via signed distance fields (SDF), e.g., blended superquadrics/superellipsoids, gyroid‑like fields, and multi‑term polynomial isosurfaces f(x,y,z,t)=0.
- Parametric ribbons F(u,v,t) tracing integral curves of vector fields derived from the manifold gradient/curvature.
- Colour from curvature κ, Gaussian K, mean curvature H, or gradient magnitude; optional LUT.

2) Event‑Driven Time
- Phase score with cues: Pre‑emergence → Bifurcation → Murmuration Synchrony → Collapse/Reset.
- Procedural transitions: parameter morphs, field blend weights, SDF union/subtract operations, topological hints (no real topology change, but apparent).
- Pulses and black flashes echo prior glitch vocabulary but now drive field weights and camera moves.

3) Starling Murmuration Swarm
- GPU boids (instanced) with manifold‑aware flowfields (particles are attracted to isosurface hulls, ribbons, and gradient minima).
- Behaviours: flock, avoid curvature spikes, align to fibre tangents, “approval” pulses (gentle chroma waves).
- Sentience motif: rare, individually‑timed scouts that learn manifold corridors then lead cohorts.

4) Instrumentation & Evidence Overlays
- Jacobian heatmap for local deformation (proxy from gradients of blended fields).
- Divergence/rotationality glyphs (arrowlets or curls) sampled sparsely for clarity.
- Iso‑contour bands (thin shells) where |f|≈ε to visualize thickness/porosity.

5) Camera & Space
- Local vs Outer space modes with hysteresis; pass‑through zoom that respects SDF hull thickness.
- Axis‑locked pivots for “cathedral” reveals; spline‑guided flights for set‑pieces.

## Rendering Architecture (Three.js / R3F)
- SDF raymarch (fragment shader) for the manifold hull; tune steps and thickness with device caps.
- InstancedMesh ribbons (thousands) generated along integral curves; reuse temp vectors; batched updates.
- GPGPU boids (render targets) for murmuration; compute position/velocity; field sampling via SDF textures.
- Minimal overdraw; frame governor with dynamic particle caps.

## Mathematics Sketch
- Base field f = Σᵢ wᵢ fᵢ(x,y,z,t), where fᵢ are implicit components:
  - Superquadric: |x/a|^p + |y/b|^q + |z/c|^r − 1
  - Gyroid‑like: sin(x)*cos(y) + sin(y)*cos(z) + sin(z)*cos(x) − α
  - Polynomial knot/torus variants and distance fields blended (smooth min/max)
- Fibre curves follow −∇f normalised, or along principal curvature directions approximated by sampling.
- Colour C = map(κ, H, |∇f|, eventPhase).

## Event Score (00:00→03:00)
- 00:00–00:45 Pre‑emergence: Low‑contrast manifold, slow drift, scattered scouts.
- 00:45–01:15 Bifurcation pulse: SDF blend weights shift; fibres bloom; boids align in bands.
- 01:15–02:15 Murmuration synchrony: density waves sweep; instrument overlays fade in/out.
- 02:15–02:45 Collapse/veil: thickness increases; camera penetrates; black flickers.
- 02:45–03:00 Quiet reset: low energy; credits/evidence capture.

## Interaction
- Desktop: OrbitControls with tuned damping, pass‑through zoom inside hulls, hysteresis thresholds.
- Mobile: simplified target nudges, reduced particle caps, curated spline path.
- Toggles: overlays (curvature/Jacobian), murmuration density, event phase debug.

## Asset & Capture Plan
- Screenshot theatre: sequence of camera keys to capture 4–8 hero frames.
- 10s/30s MediaRecorder flythrough presets.
- JSON manifest of state (seed, phase times, field weights) to reproduce scenes.

## 2D Poster Concept (for now)
A cathedral‑like luminous hull (gyroid + superquadric blend) fills the frame; translucent ribbons arc along curvature, while a murmuration band sweeps like a living contour. Sparse glyphs show curls where the field twists. A single scout glows slightly ahead of the wave.

## Feasibility Notes
- “Equations streaming through structure”: feasible by animating coefficients and text‑projecting math onto the hull/ribbons as emissive decals that flow with the parameterisation.
- Non‑linear algebraic fields are ideal for SDF raymarch; careful step tuning required for mobile.
- Swarm + SDF sampling via GPGPU is standard; keep particle counts adaptive.

## Build Phases
1) Prototype SDF hull + ribbon fibres; desktop perf checks.
2) Add GPGPU murmuration; simple flowfields from ∇f.
3) Event bus + score; overlays (Jacobian/contours).
4) Camera passes; capture tools; mobile adaptations.
5) Polish (colour grading, halos, bloom), evidence manifest.

## Risks
- Overdraw/perf in mobile; mitigate with caps and LOD.
- Visual clutter with overlays; use sparse sampling and toggles.
- Camera pass‑through stability; reuse proven hysteresis logic.

## Appendix: Implementation Hooks
- Field authoring: shader defines, runtime weight morphs.
- Fibre generator: seeded integrator with arc‑length limiting.
- Boids: FBO ping‑pong with attractors from sampled SDF and ribbon fields.
- Debug: inline LUTs, seed logging, phase timestamps.
