import React from 'react';

const ExplainerCard: React.FC<{ title: string; children: React.ReactNode }>=({ title, children })=> (
  <div className="bg-white/10 border border-white/20 rounded-xl p-4">
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <div className="text-blue-100 text-sm leading-relaxed">{children}</div>
  </div>
);

const ManifoldExplainer: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">8D Manifold — Visual Explainer</h1>
          <p className="text-blue-200 mb-6">An intuitive anchor for our higher‑dimensional processing: implicit algebraic fields, event‑driven time, and murmuration flow.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ExplainerCard title="8D → 3D Projection">
              We render a 3D “shadow” of an 8‑dimensional state: blended implicit fields (SDFs) form a luminous hull; ribbons and particles reveal structure.
            </ExplainerCard>
            <ExplainerCard title="Why It Matters">
              Non‑linear algebra helps reason about systems where 4D GANs struggle: drug discovery pathways, early‑warning weather signals, virtual worlds.
            </ExplainerCard>
            <ExplainerCard title="How to Read It">
              Curvature overlay highlights complex regions; murmuration particles follow gradients; zoom to pass through the hull and feel interior structure.
            </ExplainerCard>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/20 bg-black aspect-video">
            <iframe title="manifold" src="/manifold-prototype" className="w-full h-[70vh]" />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExplainerCard title="Controls">
              Rotate with mouse, zoom to cursor to pass through, toggles at top‑left for curvature and murmuration, capture posters anytime.
            </ExplainerCard>
            <ExplainerCard title="Next Steps">
              We’ll add a 30s guided flythrough and export assets to the Resources page for sharing.
            </ExplainerCard>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ManifoldExplainer;


