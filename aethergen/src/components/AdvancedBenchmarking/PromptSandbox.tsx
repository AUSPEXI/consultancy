import React, { useState } from 'react';
import { RecursionPolicy } from '../../types/ablation';
import { runRecursivePromptChain } from '../../services/ablationService';

const defaultPolicy: RecursionPolicy = {
  maxDepth: 3,
  maxAttempts: 3,
  baseCase: [{ metric: 'wordCount', op: '>=', value: 30, onPass: 'stop' }],
  trigger: [{ metric: 'wordCount', op: '>', value: 30, onPass: 'rewrite' }],
  revertOn: [],
  unravel: { simplifyToCore: true },
  renest: { lines: 5 },
};

const PromptSandbox: React.FC = () => {
  const [prompt, setPrompt] = useState('Within this prompt, write a short poem about recursion.');
  const [policy, setPolicy] = useState<RecursionPolicy>(defaultPolicy);
  const [steps, setSteps] = useState<any[]>([]);
  const [finalText, setFinalText] = useState('');
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const out = await runRecursivePromptChain(prompt, policy);
      setSteps(out.steps);
      setFinalText(out.final);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🧪 Recursive Prompt Sandbox (zero-cost)</h3>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full h-24 p-3 border rounded font-mono text-sm"/>
      <div className="mt-3 flex gap-3 items-center">
        <button onClick={run} disabled={running} className={`px-4 py-2 rounded ${running?'bg-gray-400 text-gray-700':'bg-blue-600 text-white hover:bg-blue-700'}`}>{running?'Running…':'Run'}</button>
        <span className="text-xs text-gray-600">Depth: {policy.maxDepth ?? 3} • Attempts: {policy.maxAttempts ?? 3}</span>
      </div>
      {steps.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Chain Steps</h4>
          <div className="border rounded">
            {steps.map((s, i)=>(
              <div key={i} className="p-3 border-b">
                <div className="text-xs text-gray-600">depth {s.depth} • attempt {s.attempt} • words {s.metrics?.wordCount}</div>
                <pre className="text-xs whitespace-pre-wrap">{s.current}</pre>
              </div>
            ))}
          </div>
          <h4 className="font-semibold mt-4 mb-2">Final</h4>
          <pre className="text-sm whitespace-pre-wrap border rounded p-3">{finalText}</pre>
        </div>
      )}
    </div>
  );
};

export default PromptSandbox;


