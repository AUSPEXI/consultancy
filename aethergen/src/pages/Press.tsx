import React from 'react';
import SEO from '../components/SEO';
import PressHero from '../components/PressSection/PressHero';
import PressKitBuilder from '../components/PressSection/PressKitBuilder';
import MediaGallery from '../components/PressSection/MediaGallery';

const Press = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <SEO
        title="Press – AethergenPlatform"
        description="Press materials for AethergenPlatform: evidence‑led platform overview, verified outcomes, and media assets. IP‑safe; public evidence is available in Resources."
        canonical="https://auspexi.com/press"
        ogImage="/og-image.svg?v=2"
      />
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Press Materials
          </h1>
          <h2 className="text-2xl md:text-4xl font-semibold text-blue-300 mb-6">
            Evidence‑Led Synthetic Data Platform – Press Materials
          </h2>
          <p className="text-xl text-blue-100 leading-relaxed mb-3">
            AethergenPlatform enables privacy‑preserving synthetic data generation, dataset/model delivery to Databricks with bundled evidence, and safe scaling from pilot to production.
          </p>
          <p className="text-lg text-blue-200 leading-relaxed">
            This page provides press‑ready assets and verifiable outcomes. We avoid speculative claims and do not disclose proprietary algorithms or implementation details.
          </p>
        </div>
      </section>

      {/* Press Kit Builder */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PressKitBuilder onDownload={(kit) => {
            try {
              const a = (kit?.audience || '').toLowerCase()
              const map: Record<string, string> = {
                'journalist/media': '/press/kits/journalist.html',
                'investor/vc': '/press/kits/investor.html',
                'enterprise client': '/press/kits/enterprise.html',
                'strategic partner': '/press/kits/partner.html',
                'research institution': '/press/kits/research.html',
              }
              const target = map[a] || '/press/press-kit.html'
              window.location.href = target
            } catch (_) { /* no-op */ }
          }} />
        </div>
      </section>

      {/* Media Gallery */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MediaGallery />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Request Interviews or Additional Materials
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Explore the platform overview and evidence supporting our results. We share verifiable outcomes and keep intellectual property protected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/about"
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-3 rounded-lg hover:bg-white/20 transition-all font-semibold"
            >
              About AethergenPlatform
            </a>
            <a
              href="/contact"
              className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-slate-900 transition-colors font-semibold"
            >
              Contact Media Relations
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Press;
