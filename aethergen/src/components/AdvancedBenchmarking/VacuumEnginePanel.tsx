import React, { useState } from 'react';
import { runVRME } from '../../services/vacuumResonanceMultiverse';

const VacuumEnginePanel: React.FC<{ seedData: any[]; schema: any }> = ({ seedData, schema }) => {
  const [lambda, setLambda] = useState(0.7);
  const [scales, setScales] = useState(3);
  const [variants, setVariants] = useState(3);
  const [vacuumScore, setVacuumScore] = useState<number | null>(null);
  const [galaxies, setGalaxies] = useState<any[][]>([]);
  const [patches, setPatches] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  const go = () => {
    setRunning(true);
    setTimeout(() => {
      const res = runVRME(seedData, schema, { lambda, scales, variants });
      setVacuumScore(res.vacuumScore);
      setGalaxies(res.galaxies);
      setPatches(res.patches);
      setRunning(false);
    }, 0);
  };

  const downloadEvidence = () => {
    const payload = { vacuum: { lambda, scales, variants, vacuumScore }, patches };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vacuum_multiverse_evidence.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3">🌀 Vacuum Resonance Multiverse Engine</h3>
      <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
        <label className="flex items-center gap-2">λ <input type="number" min={0.05} max={3} step={0.05} value={lambda} onChange={e=>setLambda(parseFloat(e.target.value)||0.7)} className="w-24 border rounded px-2 py-1"/></label>
        <label className="flex items-center gap-2">Scales <input type="number" min={1} max={5} value={scales} onChange={e=>setScales(parseInt(e.target.value)||3)} className="w-20 border rounded px-2 py-1"/></label>
        <label className="flex items-center gap-2">Variants <input type="number" min={2} max={6} value={variants} onChange={e=>setVariants(parseInt(e.target.value)||3)} className="w-20 border rounded px-2 py-1"/></label>
        <button onClick={go} disabled={running || seedData.length===0} className={`px-4 py-2 rounded ${running||seedData.length===0? 'bg-gray-300 text-gray-600':'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{running?'Evolving…':'Evolve Galaxy'}</button>
        <button onClick={downloadEvidence} disabled={!patches.length} className={`px-3 py-2 rounded border ${patches.length? '':'opacity-60 cursor-not-allowed'}`}>Download Multiverse Evidence</button>
      </div>
      {vacuumScore!==null && (
        <div className="text-sm text-gray-700 mb-2">Vacuum score: <span className="font-semibold">{(vacuumScore*100).toFixed(1)}%</span></div>
      )}
      {patches.length>0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Scale</th>
                <th className="px-3 py-2 text-left">Energy</th>
                <th className="px-3 py-2 text-left">FRS</th>
                <th className="px-3 py-2 text-left">AGO</th>
                <th className="px-3 py-2 text-left">Harm</th>
                <th className="px-3 py-2 text-left">AUM</th>
                <th className="px-3 py-2 text-left">TriCoT</th>
              </tr>
            </thead>
            <tbody>
              {patches.slice(0,50).map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{p.scale}</td>
                  <td className="px-3 py-2">{p.energy.toFixed(3)}</td>
                  <td className="px-3 py-2">{(p.frs*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(p.ago*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(p.harm*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(p.aum*100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(p.tricots*100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VacuumEnginePanel;


