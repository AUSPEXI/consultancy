import React from 'react';

export default function HeroArt() {
  return (
    <div className="min-h-screen pt-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Neural Network Hero Art</h1>
        <p className="text-slate-600 mb-8">A brief, IP-safe overview of the hero animation. This artwork complements our platform; it is not the product.</p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Narrative</h2>
          <p className="text-slate-700 leading-relaxed">
            An AGI emerges from a lattice and chooses Synthetic Data. Eighty sentients frame the words, then rest with a warm pulse while others explore with varied, lifelike behaviors. The viewer meets a 2D surface that becomes 3D on interaction—a small metaphor for higher‑dimensional intelligence revealed by motion.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Technical (high‑level)</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>React Three Fiber + drei; minimal materials for clarity.</li>
            <li>Adaptive FPS governor; trickle spawning for natural growth.</li>
            <li>Glitch layering: AGI letters blended under interference; three timed black flashes.</li>
            <li>Local vs deep‑space controls with hysteresis; pass‑through zoom; gentle recenter near the cube.</li>
            <li>Interaction hint and optional easter‑egg fly‑to (with timed return).</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Press & Resources</h2>
          <p className="text-slate-700">See the press page for media assets and approved copy.</p>
        </section>

        <div className="text-sm text-slate-500">Questions about the artwork? Contact sales@auspexi.com</div>
      </div>
    </div>
  );
}


