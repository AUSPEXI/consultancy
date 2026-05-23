import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';

const ResourcesVisibilityScore: React.FC = () => {
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const es = new EventSource('/.netlify/functions/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data || '{}');
        if (typeof data.visibilityScore === 'number') setScore(data.visibilityScore);
      } catch {/* noop */}
    };
    return () => es.close();
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GameResult',
    name: 'Visibility Score Tracker',
    url: 'https://auspexi.com/resources/visibility-score'
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Visibility Score – AethergenPlatform"
        description="Gamified visibility score updated via real-time events."
        canonical="https://auspexi.com/resources/visibility-score"
        jsonLd={jsonLd}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 id="visibility-score" className="text-3xl font-bold text-slate-900 mb-4">Visibility Score</h1>
        <p className="text-slate-800 text-lg">Score: {score}</p>
        <div className="sr-only" aria-hidden>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </div>
      </div>
    </div>
  );
};

export default ResourcesVisibilityScore;



