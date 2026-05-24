import React, { useMemo, useState } from 'react';

function scoreDoc(q: string, doc: string): number {
  const terms = q.toLowerCase().split(/\W+/).filter(Boolean);
  const hay = doc.toLowerCase();
  let s = 0;
  for (const t of terms) if (hay.includes(t)) s += 1;
  return s / Math.max(1, terms.length);
}

const RAGConfidencePanel: React.FC<{ corpus: string[] }>=({ corpus })=>{
  const [query, setQuery] = useState('');
  const [depthCap, setDepthCap] = useState(3);
  const [threshold, setThreshold] = useState(0.6);
  const [hits, setHits] = useState<Array<{ doc: string; score: number }>>([]);
  const [attempts, setAttempts] = useState(0);

  const searchOnce = (q: string) => {
    const scored = corpus.map(doc => ({ doc, score: scoreDoc(q, doc) }))
      .sort((a,b)=>b.score-a.score)
      .slice(0, 5);
    setHits(scored);
    return scored[0]?.score || 0;
  };

  const runRecursive = () => {
    setAttempts(0);
    let conf = 0;
    for (let d=0; d<depthCap; d++){
      setAttempts(d+1);
      conf = searchOnce(query);
      if (conf >= threshold) break;
      // expand query heuristically
      const extra = hits.slice(0,2).map(h=>h.doc.split(/\s+/).slice(0,5).join(' ')).join(' ');
      setQuery(prev => prev + ' ' + extra);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-2">🔎 RAG Confidence (recursive, zero‑cost)</h3>
      <div className="flex flex-wrap gap-3 items-center text-sm mb-2">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter query" className="border rounded px-2 py-1 flex-1 min-w-[240px]"/>
        <label className="flex items-center gap-1">Depth <input type="number" min={1} max={5} value={depthCap} onChange={e=>setDepthCap(parseInt(e.target.value)||3)} className="w-16 border rounded px-1 py-0.5"/></label>
        <label className="flex items-center gap-1">τ <input type="number" step="0.05" min={0.1} max={0.95} value={threshold} onChange={e=>setThreshold(parseFloat(e.target.value)||0.6)} className="w-20 border rounded px-1 py-0.5"/></label>
        <button onClick={runRecursive} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Run</button>
        <span className="text-xs text-gray-600">Attempts: {attempts}</span>
      </div>
      <div className="text-xs text-gray-600 mb-2">Top hits:</div>
      <ul className="text-xs space-y-1">
        {hits.map((h,i)=>(<li key={i}><span className="font-mono">{(h.score*100).toFixed(1)}%</span> — {h.doc.slice(0,120)}{h.doc.length>120?'…':''}</li>))}
      </ul>
    </div>
  );
};

export default RAGConfidencePanel;


