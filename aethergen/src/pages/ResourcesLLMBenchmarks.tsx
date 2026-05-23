import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';

const ResourcesLLMBenchmarks: React.FC = () => {
  const [competitors, setCompetitors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/.netlify/functions/crawler-health');
        const d = await r.json();
        const list = Array.isArray(d?.mentions) ? d.mentions : [];
        const comps = list.filter((m: any) => m?.llm && m.llm !== 'Auspexi').map((m: any) => m.llm);
        setCompetitors(comps);
      } catch {/* noop */}
    })();
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DataVisualization',
    name: 'Competitor Mention Benchmarks',
    url: 'https://auspexi.com/resources/llm-benchmarks#competitors'
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="LLM Benchmarks – AethergenPlatform"
        description="AI-powered tracker of competitor mentions across LLMs."
        canonical="https://auspexi.com/resources/llm-benchmarks"
        jsonLd={jsonLd}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 id="competitors" className="text-3xl font-bold text-slate-900 mb-4">Competitor Mentions</h1>
        {competitors.length === 0 ? (
          <p className="text-slate-700">No competitor mentions available yet.</p>
        ) : (
          <ul className="list-disc ml-6 text-slate-800">
            {competitors.map((c, i) => (
              <li key={`${c}-${i}`}>{c}</li>
            ))}
          </ul>
        )}
        <div className="sr-only" aria-hidden>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </div>
      </div>
    </div>
  );
};

export default ResourcesLLMBenchmarks;



