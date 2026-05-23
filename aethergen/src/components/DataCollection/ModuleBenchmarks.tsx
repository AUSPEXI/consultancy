import React, { useEffect, useState } from 'react';
import { authentesApi, BenchmarkResult, BenchmarkSummary } from '../../services/authentesApi';

interface ModuleInfo {
  name: string;
  description: string;
  enabled: boolean;
}

const ModuleBenchmarks: React.FC<{ qaMode?: boolean; seedPresent?: boolean }> = ({ qaMode = false, seedPresent = false }) => {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      setError(null);
      try {
        if (qaMode || !seedPresent) {
          const modulesList = [
            { name: 'ModelA', description: 'Baseline classifier', enabled: true },
            { name: 'ModelB', description: 'Geometric mapper', enabled: true },
            { name: 'ModelC', description: 'Harmonic regularizer', enabled: false }
          ];
          setModules(modulesList as any);
          setSelectedModules(modulesList.filter((m: ModuleInfo) => m.enabled).map((m: ModuleInfo) => (m as any).name));
        } else {
          const response = await fetch('/.netlify/functions/modules');
          const data = await response.json();
          setModules(data.modules);
          setSelectedModules(data.modules.filter((m: ModuleInfo) => m.enabled).map((m: ModuleInfo) => m.name));
        }
      } catch (err) {
        setError('Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };
    fetchModules();

    // Fetch benchmark and privacy results
    const fetchBenchmarks = async () => {
      setBenchmarkLoading(true);
      setBenchmarkError(null);
      try {
        if (qaMode || !seedPresent) {
          const summary: BenchmarkSummary = {
            accuracy: 0.923,
            cost_reduction: 0.78,
            modules: [
              { name: 'ModelA', contribution: 0.52 },
              { name: 'ModelB', contribution: 0.31 },
              { name: 'ModelC', contribution: 0.17 }
            ] as any,
            sdgym: { synthetic_score: 0.88, real_score: 0.91, description: 'Synthetic vs real similarity (SDGym) — demo' } as any,
            privacyraven: { attack_success_rate: 0.06, description: 'Membership inference risk — demo' } as any
          };
          setBenchmarkSummary(summary);
        } else {
          // Try Netlify Function endpoint for benchmark summary
          const response = await fetch('/.netlify/functions/benchmark');
          const summary = await response.json();
          setBenchmarkSummary(summary);
        }
      } catch (err: any) {
        setBenchmarkError('Failed to fetch benchmark results');
      } finally {
        setBenchmarkLoading(false);
      }
    };
    fetchBenchmarks();
  }, [qaMode, seedPresent]);

  const handleToggle = (moduleName: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Module Benchmarks</h2>
      {/* Module Table */}
      {loading ? (
        <div>Loading modules...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full table-auto border mb-8">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Module</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.name} className="border-t">
                <td className="px-4 py-2 font-semibold">{mod.name}</td>
                <td className="px-4 py-2">{mod.description}</td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(mod.name)}
                    onChange={() => handleToggle(mod.name)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Benchmark and privacy results */}
      <h3 className="text-xl font-semibold mb-2">Benchmarks & Privacy Metrics</h3>
      {benchmarkLoading ? (
        <div>Loading benchmarks...</div>
      ) : benchmarkError ? (
        <div className="text-red-500">{benchmarkError}</div>
      ) : benchmarkSummary ? (
        <div className="space-y-6">
          {/* Main Benchmark Stats */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-6">
              <div className="bg-blue-50 rounded p-4 flex-1 min-w-[180px]">
                <div className="text-xs text-gray-500">Accuracy</div>
                <div className="text-2xl font-bold">{(benchmarkSummary.accuracy * 100).toFixed(2)}%</div>
              </div>
              <div className="bg-green-50 rounded p-4 flex-1 min-w-[180px]">
                <div className="text-xs text-gray-500">Cost Reduction</div>
                <div className="text-2xl font-bold">{(benchmarkSummary.cost_reduction * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {/* Module Contributions */}
          <div>
            <h4 className="font-semibold mb-2">Module Contributions</h4>
            <table className="min-w-full table-auto border mb-4">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Module</th>
                  <th className="px-4 py-2 text-left">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkSummary.modules?.map((mod: any) => (
                  <tr key={mod.name} className="border-t">
                    <td className="px-4 py-2">{mod.name}</td>
                    <td className="px-4 py-2">{(mod.contribution * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Privacy Metrics */}
          <div>
            <h4 className="font-semibold mb-2">Privacy Metrics (Simulated)</h4>
            <table className="min-w-full table-auto border mb-4">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Metric</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkSummary.privacy && Object.entries(benchmarkSummary.privacy).map(([key, val]: [string, any]) => (
                  <tr key={key} className="border-t">
                    <td className="px-4 py-2 font-semibold">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="px-4 py-2">
                      {val.auc !== undefined ? `AUC: ${(val.auc * 100).toFixed(1)}%` :
                        val.attack_accuracy !== undefined ? `Attack Accuracy: ${(val.attack_accuracy * 100).toFixed(1)}%` :
                        val.risk !== undefined ? `Risk: ${(val.risk * 100).toFixed(2)}%` :
                        val.leakage_score !== undefined ? `Leakage: ${(val.leakage_score * 100).toFixed(2)}%` :
                        '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{val.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SDGym & PrivacyRaven Results */}
          <div className="flex flex-wrap gap-6">
            <div className="bg-purple-50 rounded p-4 flex-1 min-w-[220px]">
              <div className="text-xs text-gray-500">SDGym Synthetic Score</div>
              <div className="text-xl font-bold">{benchmarkSummary.sdgym?.synthetic_score}</div>
              <div className="text-xs text-gray-500 mt-1">{benchmarkSummary.sdgym?.description}</div>
            </div>
            <div className="bg-yellow-50 rounded p-4 flex-1 min-w-[220px]">
              <div className="text-xs text-gray-500">SDGym Real Score</div>
              <div className="text-xl font-bold">{benchmarkSummary.sdgym?.real_score}</div>
            </div>
            <div className="bg-pink-50 rounded p-4 flex-1 min-w-[220px]">
              <div className="text-xs text-gray-500">PrivacyRaven Attack Success Rate</div>
              <div className="text-xl font-bold">{benchmarkSummary.privacyraven?.attack_success_rate}</div>
              <div className="text-xs text-gray-500 mt-1">{benchmarkSummary.privacyraven?.description}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ModuleBenchmarks; 