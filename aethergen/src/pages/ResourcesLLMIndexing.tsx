import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';

const ResourcesLLMIndexing: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [leaderboard, setLeaderboard] = useState<{ user: string; score: number }[]>([]);

  const simulate = async () => {
    try {
      const res = await fetch('/.netlify/functions/facts').then(r=>r.json());
      const fact = Array.isArray(res?.facts) && res.facts.length ? res.facts[0] : 'No facts available';
      setResponse(`Mock LLM: ${fact}`);
    } catch {
      setResponse('Mock LLM: (failed to load)');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/.netlify/functions/prompts');
        const d = await r.json();
        const lb = (Array.isArray(d?.prompts) ? d.prompts : []).map((p: any) => ({ user: 'Anon', score: p?.score || 0 }));
        setLeaderboard(lb);
      } catch {/* noop */}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="LLM Indexing Simulator – AethergenPlatform"
        description="Test prompts against a mock LLM using site facts to understand indexing behavior."
        canonical="https://auspexi.com/resources/llm-indexing"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'LLM Indexing Simulator',
          url: 'https://auspexi.com/resources/llm-indexing'
        }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">LLM Indexing Simulator</h1>
        <p className="text-slate-700 mb-6">Try a prompt and see how a mock LLM might surface site facts.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Enter a prompt..." className="w-full border rounded px-3 py-2 mb-3" />
          <button onClick={simulate} className="px-4 py-2 rounded bg-blue-600 text-white">Simulate LLM</button>
          <p className="mt-4 text-slate-800 text-sm whitespace-pre-wrap">{response}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 mt-6">
          <h2 id="leaderboard" className="text-lg font-semibold text-slate-900 mb-2">Prompt Challenge Leaderboard</h2>
          <ul className="list-disc ml-6 text-slate-800">
            {leaderboard.map((l, i) => (
              <li key={`lb-${i}`}>{l.user}: {l.score}</li>
            ))}
          </ul>
          <div className="sr-only" aria-hidden>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'GameResult',
              name: 'Prompt Challenge Leaderboard',
              url: 'https://auspexi.com/resources/llm-indexing#leaderboard'
            }) }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesLLMIndexing;


