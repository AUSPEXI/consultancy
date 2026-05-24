import React, { useState } from 'react';
import { runAutopilot, AutopilotConfig, TrialResult } from '../../services/autopilotService';

const AutopilotPanel: React.FC<{ schema: any; generatedData: any[]; selectedModels: string[] }>=({ schema, generatedData, selectedModels })=>{
  const [maxTrials, setMaxTrials] = useState(8);
  const [timeBudgetMs, setTimeBudgetMs] = useState(5000);
  const [riskAllow, setRiskAllow] = useState<'green'|'amber'>('green');
  const [epsilonMax, setEpsilonMax] = useState(0.2);
  const [running, setRunning] = useState(false);
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [frontier, setFrontier] = useState<TrialResult[]>([]);
  const [requireTriCoT, setRequireTriCoT] = useState(false);
  const [minAci, setMinAci] = useState<number|''>('');

  const go = async () => {
    setRunning(true);
    try {
      const cfg: AutopilotConfig = { maxTrials, timeBudgetMs, constraints: { riskAllow, epsilonMax, requireTriCoTPass: requireTriCoT, minAci: typeof minAci==='number'? minAci: undefined }, weights: { accuracy: 0.4, utility: 0.3, privacy: 0.3, latency: 0.2 } };
      const out = await runAutopilot(cfg, schema, generatedData, selectedModels);
      setTrials(out.trials);
      setFrontier(out.frontier);
    } finally { setRunning(false); }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3">🤖 Autopilot (evidence‑driven)</h3>
      <div className="flex flex-wrap gap-4 items-center text-sm mb-3">
        <label className="flex items-center gap-1">Trials <input type="number" min={2} max={32} value={maxTrials} onChange={e=>setMaxTrials(parseInt(e.target.value)||8)} className="w-20 border rounded px-2 py-1"/></label>
        <label className="flex items-center gap-1">Budget (ms) <input type="number" min={1000} max={60000} step={1000} value={timeBudgetMs} onChange={e=>setTimeBudgetMs(parseInt(e.target.value)||5000)} className="w-24 border rounded px-2 py-1"/></label>
        <label className="flex items-center gap-1">ε ≤ <input type="number" min={0.01} max={1} step={0.01} value={epsilonMax} onChange={e=>setEpsilonMax(parseFloat(e.target.value)||0.2)} className="w-20 border rounded px-2 py-1"/></label>
        <label className="flex items-center gap-2">Risk <select value={riskAllow} onChange={e=>setRiskAllow(e.target.value as any)} className="border rounded px-2 py-1"><option value="green">Green</option><option value="amber">Amber</option></select></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={requireTriCoT} onChange={e=>setRequireTriCoT(e.target.checked)} /> Require TriCoT pass</label>
        <label className="flex items-center gap-1">min ACI<input type="number" min={0} max={1} step={0.05} value={minAci as any} onChange={e=>{ const v = parseFloat(e.target.value); setMinAci(Number.isFinite(v)? v : ''); }} className="w-20 border rounded px-2 py-1"/></label>
        <button onClick={go} disabled={running || generatedData.length===0} className={`px-4 py-2 rounded ${running||generatedData.length===0?'bg-gray-400 text-gray-700':'bg-blue-600 text-white hover:bg-blue-700'}`}>{running?'Searching…':'Find Pareto Frontier'}</button>
      </div>
      {frontier.length>0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-3 py-2 text-left">ε</th>
                <th className="px-3 py-2 text-left">ratio</th>
                <th className="px-3 py-2 text-left">IQR k</th>
                <th className="px-3 py-2 text-left">Acc</th>
                <th className="px-3 py-2 text-left">Util</th>
                <th className="px-3 py-2 text-left">Priv</th>
                <th className="px-3 py-2 text-left">Latency</th>
                <th className="px-3 py-2 text-left">Risk</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Persist</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {frontier.map((t,i)=>(
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{t.cfg.epsilon}</td>
                  <td className="px-3 py-2">{t.cfg.syntheticRatio}</td>
                  <td className="px-3 py-2">{t.cfg.iqrK}</td>
                  <td className="px-3 py-2">{(t.metrics.accuracy*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(t.metrics.utility*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(t.metrics.privacy*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{Math.round(t.latencyMs)} ms</td>
                  <td className="px-3 py-2">{t.risk.toUpperCase()}</td>
                  <td className="px-3 py-2">{t.score.toFixed(3)}</td>
                  <td className="px-3 py-2">
                    <button
                      className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={()=>{
                        try {
                          // Persist selections
                          localStorage.setItem('aeg_privacy', JSON.stringify({ epsilon: t.cfg.epsilon, synthetic_ratio: t.cfg.syntheticRatio }));
                          localStorage.setItem('aeg_cleaning_iqrk', String(t.cfg.iqrK));
                        } catch {}
                        // Notify app and generator
                        window.dispatchEvent(new CustomEvent('aethergen:apply-privacy', { detail: { epsilon: t.cfg.epsilon, synthetic_ratio: t.cfg.syntheticRatio, iqr_k: t.cfg.iqrK } }));
                      }}
                    >Apply</button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                      title="Apply to current schema"
                      onClick={async()=>{
                        try {
                          // Read schema from local UI prop, update, and store a local copy
                          const updated = {
                            ...(schema||{}),
                            privacySettings: {
                              ...(schema?.privacySettings||{}),
                              epsilon: t.cfg.epsilon,
                              syntheticRatio: t.cfg.syntheticRatio
                            }
                          };
                          try { localStorage.setItem('aeg_schema', JSON.stringify(updated)); } catch {}
                          // Broadcast so SchemaDesigner/App can pick it up immediately
                          window.dispatchEvent(new CustomEvent('aethergen:apply-privacy', { detail: { epsilon: t.cfg.epsilon, synthetic_ratio: t.cfg.syntheticRatio, iqr_k: t.cfg.iqrK } }));
                          alert('Applied to schema locally. Use "Save to Supabase" in Schema Designer when ready.');
                        } catch {}
                      }}
                    >Apply to schema</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AutopilotPanel;



