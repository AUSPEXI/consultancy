import React, { useEffect, useMemo, useState } from 'react';
import { generateHealthcareClaims } from '../../domain/healthcare/claimsGenerator';
import EnergyLedgerPanel from './EnergyLedgerPanel';
import { EnergyLedger } from '../../types/energyLedger';
import { estimateMass, codaStep } from '../../services/codaScheduler';
import { applyElasticTransfer, TransferState } from '../../services/elasticTransfer';
import { trainLinearAe, trainDeepAe } from '../../services/demoAutoencoder';
import LossChart from './CollisionGraph';
import CollisionGraph from './CollisionGraph';

// Advanced Technology Services
import { runAblationRecipe } from '../../services/ablationService';
import { generateEvidenceBundle } from '../../services/evidenceService';
// TODO: Fix these imports when services are properly implemented
// import { runAGOResonantHypercube } from '../../services/agoResonantHypercube';
// import { runHarmonicRegularizer432 } from '../../services/harmonicRegularizer432';
// import { runAUMCertificate } from '../../services/aumCertificate';
// import { runCausal8DService } from '../../services/causal8DService';
// import { runOctonionFeatures } from '../../services/octonionFeatures';
// import { runTriCotValidator } from '../../services/triCotValidator';
// import { runAnticipatoryConsistency } from '../../services/anticipatoryConsistency';
// import { runZKUPB } from '../../services/zkUpb';
// import { runHCAAbstention } from '../../services/hcaAbstention';
// import { runFractalResonanceOracle } from '../../services/fractalResonanceOracle';
// import { runVacuumResonanceMultiverse } from '../../services/vacuumResonanceMultiverse';

// Types
import { AblationRecipe, AblationResult } from '../../types/ablation';
import { InnovationMetrics } from '../../types/advancedModels';

type LabeledScore = { score: number; label: number };

// Model template definitions
interface ModelTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  readyForDatabricks: boolean;
  bundledWithEvidence: boolean;
  sampleDataRows: number;
  features: string[];
  defaultParams: Record<string, any>;
  generator: (params: any) => Promise<any[]>;
  trainer: (data: any[], params: any) => Promise<any>;
}

// Available model templates
const MODEL_TEMPLATES: ModelTemplate[] = [
  {
    id: 'healthcare-fraud-v1',
    name: 'Healthcare Claims Fraud Detection v1',
    description: 'Baseline heuristic model for detecting fraudulent healthcare claims using ratio analysis and behavioral patterns',
    category: 'Fraud Detection',
    readyForDatabricks: true,
    bundledWithEvidence: true,
    sampleDataRows: 50000,
    features: ['submitted/allowed ratio', 'claim_lag_days', 'out_of_state_flag', 'provider_claim_volume_30d', 'unbundling_indicator'],
    defaultParams: {
      rows: 50000,
      fraudRate: 0.03,
      seed: 42,
      windowEnergy: 1.0,
      allocationEvery: 1,
      useElastic: true,
      useDeepAe: false
    },
    generator: generateHealthcareClaims,
    trainer: async (data, params) => {
      // This would call the actual training function
      return trainLinearAe(data, params);
    }
  },
  {
    id: 'credit-risk-v1',
    name: 'Credit Risk Assessment v1',
    description: 'Machine learning model for credit risk evaluation using financial ratios and payment history',
    category: 'Financial Risk',
    readyForDatabricks: false,
    bundledWithEvidence: false,
    sampleDataRows: 10000,
    features: ['credit_utilization', 'payment_history', 'debt_to_income', 'credit_age'],
    defaultParams: {
      rows: 10000,
      riskRate: 0.15,
      seed: 42,
      windowEnergy: 1.0,
      allocationEvery: 1,
      useElastic: true,
      useDeepAe: false
    },
    generator: async (params) => {
      // Placeholder for credit risk data generation
      return [];
    },
    trainer: async (data, params) => {
      // Placeholder for credit risk training
      return null;
    }
  },
  {
    id: 'customer-churn-v1',
    name: 'Customer Churn Prediction v1',
    description: 'Predictive model for identifying customers likely to churn based on usage patterns and demographics',
    category: 'Customer Analytics',
    readyForDatabricks: false,
    bundledWithEvidence: false,
    sampleDataRows: 25000,
    features: ['usage_frequency', 'support_tickets', 'subscription_length', 'feature_adoption'],
    defaultParams: {
      rows: 25000,
      churnRate: 0.08,
      seed: 42,
      windowEnergy: 1.0,
      allocationEvery: 1,
      useElastic: true,
      useDeepAe: false
    },
    generator: async (params) => {
      // Placeholder for customer churn data generation
      return [];
    },
    trainer: async (data, params) => {
      // Placeholder for customer churn training
      return null;
    }
  }
];

function toCSV<T extends Record<string, any>>(rows: T[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = Array.isArray(v) ? JSON.stringify(v) : String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => esc(r[h])).join(',')));
  return lines.join('\n');
}

function download(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function computeAUC(points: LabeledScore[]): number {
  // ROC-AUC via rank-sum (Mann–Whitney U)
  const sorted = [...points].sort((a, b) => b.score - a.score);
  let pos = 0, neg = 0;
  for (const p of sorted) (p.label ? pos++ : neg++);
  if (pos === 0 || neg === 0) return 0.5;
  let rank = 1;
  let sumRanksPos = 0;
  for (const p of sorted) {
    if (p.label) sumRanksPos += rank;
    rank++;
  }
  const auc = (sumRanksPos - (pos * (pos + 1)) / 2) / (pos * neg);
  return Math.max(0, Math.min(1, auc));
}

function computePRAUC(points: LabeledScore[]): number {
  // Simple trapezoidal PR curve on thresholds at each score
  const sorted = [...points].sort((a, b) => b.score - a.score);
  const totalPos = sorted.reduce((s, p) => s + (p.label ? 1 : 0), 0);
  if (totalPos === 0) return 0;
  let tp = 0, fp = 0;
  let lastR = 0, lastP = sorted[0] ? (sorted[0].label ? 1 : 0) : 0;
  let area = 0;
  for (const p of sorted) {
    if (p.label) tp++; else fp++;
    const recall = tp / totalPos;
    const precision = tp / (tp + fp);
    // Trapezoid between (lastR,lastP) and (recall,precision)
    area += (recall - lastR) * ((precision + lastP) / 2);
    lastR = recall; lastP = precision;
  }
  return Math.max(0, Math.min(1, area));
}

interface TrainingSummary {
  auc: number;
  prAuc: number;
  prevalence: number;
}

const ModelLab: React.FC = () => {
  // Model selection
  const [selectedModelId, setSelectedModelId] = useState<string>('healthcare-fraud-v1');
  const selectedModel = useMemo(() => MODEL_TEMPLATES.find(m => m.id === selectedModelId), [selectedModelId]);
  
  // Dynamic parameters based on selected model
  const [params, setParams] = useState<Record<string, any>>({});
  
  // Training state
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<TrainingSummary | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [ledger, setLedger] = useState<EnergyLedger | null>(null);
  const [trialKey, setTrialKey] = useState<string>('trial_'+Math.random().toString(36).slice(2,8));
  const [transferState, setTransferState] = useState<TransferState | null>(null);
  const [lossHistory, setLossHistory] = useState<number[] | null>(null);

  // Advanced Technology State
  const [innovationMetrics, setInnovationMetrics] = useState<InnovationMetrics | null>(null);
  const [ablationResults, setAblationResults] = useState<AblationResult[] | null>(null);
  const [useAdvancedTech, setUseAdvancedTech] = useState<boolean>(true);
  const [agoWeight, setAgoWeight] = useState<number>(0.4);
  const [harmonic432Weight, setHarmonic432Weight] = useState<number>(0.3);
  const [aumWeight, setAumWeight] = useState<number>(0.3);

  // Initialize parameters when model changes
  useEffect(() => {
    if (selectedModel) {
      setParams(selectedModel.defaultParams);
    }
  }, [selectedModel]);

  // Restore previous session
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aeg:modellab:lastRun');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && saved.modelId === selectedModelId) {
        setParams(prev => ({ ...prev, ...saved.params }));
      }
    } catch {}
  }, [selectedModelId]);

  const canTrain = data.length > 0 && !busy;

  const generate = async () => {
    if (!selectedModel) return;
    
    setBusy(true);
    try {
      const generatedData = await selectedModel.generator(params);
      setData(generatedData);
      
      // Save session
      localStorage.setItem('aeg:modellab:lastRun', JSON.stringify({
        modelId: selectedModelId,
        params,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setBusy(false);
    }
  };

  const train = async () => {
    if (!selectedModel || !canTrain) return;
    
    setBusy(true);
    try {
      // Run advanced technology analysis if enabled
      if (useAdvancedTech) {
        await runAdvancedTechnologyAnalysis();
      }
      
      const trainingResult = await selectedModel.trainer(data, params);
      setMetrics(trainingResult);
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setBusy(false);
    }
  };

  const runAdvancedTechnologyAnalysis = async () => {
    if (!data || data.length === 0) return;
    
    try {
      // Run all innovation modules
      const agoMetrics = await runAGOResonantHypercube(data, { weight: agoWeight });
      const harmonicMetrics = await runHarmonicRegularizer432(data, { weight: harmonic432Weight });
      const aumMetrics = await runAUMCertificate(data, { weight: aumWeight });
      const causalMetrics = await runCausal8DService(data);
      const octonionMetrics = await runOctonionFeatures(data);
      const tricotMetrics = await runTriCotValidator(data);
      const aciMetrics = await runAnticipatoryConsistency(data);
      const zkupbMetrics = await runZKUPB(data);
      const hcaMetrics = await runHCAAbstention(data);
      const froMetrics = await runFractalResonanceOracle(data);
      const vrmeMetrics = await runVacuumResonanceMultiverse(data);

      // Combine all metrics
      const combinedMetrics: InnovationMetrics = {
        ago: agoMetrics,
        harmonic432: harmonicMetrics,
        aum: aumMetrics,
        causal8d: causalMetrics,
        octonion: octonionMetrics,
        tricotscore: tricotMetrics.score,
        aci: aciMetrics.aci,
        zk_upb: zkupbMetrics,
        hca: hcaMetrics,
        fro: { frs: froMetrics.frs },
        vrme: { vacuumScore: vrmeMetrics.vacuumScore }
      };

      setInnovationMetrics(combinedMetrics);
    } catch (error) {
      console.error('Advanced technology analysis failed:', error);
    }
  };

  const exportEvidence = () => {
    if (!ledger) return;
    
    const bundle = {
      model_id: selectedModelId,
      model_name: selectedModel?.name,
      trial_key: trialKey,
      data_summary: {
        rows: data.length,
        features: selectedModel?.features || [],
        params: params
      },
      training_metrics: metrics,
      energy_ledger: ledger,
      ae_loss_history: lossHistory,
      created_at: new Date().toISOString()
    };
    download(`evidence_bundle_${selectedModelId}.json`, JSON.stringify(bundle, null, 2), 'application/json');
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    download(`${selectedModelId}_synthetic_data.csv`, toCSV(data), 'text/csv');
  };

  const downloadModelCard = () => {
    if (!selectedModel) return;
    
    const card = {
      name: `AethergenAI – ${selectedModel.name}`,
      version: '1.0.0',
      model_id: selectedModelId,
      category: selectedModel.category,
      ready_for_databricks: selectedModel.readyForDatabricks,
      bundled_with_evidence: selectedModel.bundledWithEvidence,
      sample_data_rows: selectedModel.sampleDataRows,
      dataset: {
        rows: data.length,
        features: selectedModel.features,
        params: params
      },
      metrics: metrics,
      generated_at: new Date().toISOString()
    };
    download(`model_card_${selectedModelId}.json`, JSON.stringify(card, null, 2), 'application/json');
  };

  const downloadDatabricksBundle = () => {
    if (!selectedModel?.readyForDatabricks) return;
    
    // Create a comprehensive bundle for Databricks deployment
    const bundle = {
      model_id: selectedModelId,
      model_name: selectedModel.name,
      databricks_ready: true,
      includes: {
        synthetic_data: data.length > 0 ? `${selectedModelId}_synthetic_data.csv` : null,
        model_card: `model_card_${selectedModelId}.json`,
        evidence_bundle: ledger ? `evidence_bundle_${selectedModelId}.json` : null,
        training_script: `${selectedModelId}_training.py`,
        deployment_guide: `${selectedModelId}_deployment.md`
      },
      metadata: {
        category: selectedModel.category,
        features: selectedModel.features,
        sample_size: selectedModel.sampleDataRows,
        created_at: new Date().toISOString()
      }
    };
    
    download(`databricks_bundle_${selectedModelId}.json`, JSON.stringify(bundle, null, 2), 'application/json');
  };

  if (!selectedModel) {
    return <div className="text-center py-8">Model not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with model selection */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Model Lab</h2>
          <p className="text-slate-600 mt-1">Train and deploy AI models using your synthetic data pipeline</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-800"
          >
            {MODEL_TEMPLATES.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          
          {selectedModel.readyForDatabricks && (
            <button 
              onClick={downloadDatabricksBundle}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-medium"
            >
              📦 Download Databricks Bundle
            </button>
          )}
        </div>
      </div>

      {/* Model info card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">{selectedModel.name}</h3>
            <p className="text-blue-700 mb-4">{selectedModel.description}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📊</span>
                <span className="text-blue-700">Category: {selectedModel.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔧</span>
                <span className="text-blue-700">Features: {selectedModel.features.length} parameters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📈</span>
                <span className="text-blue-700">Sample Data: {selectedModel.sampleDataRows.toLocaleString()} rows</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${selectedModel.readyForDatabricks ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-blue-700">
                {selectedModel.readyForDatabricks ? '✅ Ready for Databricks' : '⚠️ Databricks integration pending'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${selectedModel.bundledWithEvidence ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-blue-700">
                {selectedModel.bundledWithEvidence ? '✅ Evidence bundled' : '⚠️ Evidence collection pending'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🧠</span>
              <span className="text-blue-700">Model Type: {selectedModelId.includes('fraud') ? 'Heuristic + ML' : 'Machine Learning'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic parameter inputs based on selected model */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Model Parameters</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(params).map(([key, value]) => (
            <label key={key} className="block text-slate-800 font-medium">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              <input 
                type={typeof value === 'number' ? 'number' : 'text'}
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800"
                value={value}
                min={typeof value === 'number' ? 0 : undefined}
                step={typeof value === 'number' ? (key === 'fraudRate' || key === 'riskRate' || key === 'churnRate' ? 0.001 : 1) : undefined}
                onChange={(e) => setParams(prev => ({
                  ...prev,
                  [key]: typeof value === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                }))}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Technology Controls */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">🧠 Advanced Technology Controls</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={useAdvancedTech} 
              onChange={(e) => setUseAdvancedTech(e.target.checked)}
              className="w-4 h-4 text-purple-600"
            />
            <span className="text-purple-800 font-medium">Enable Advanced Technology Modules</span>
          </div>
          
          {useAdvancedTech && (
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="block text-purple-800 font-medium">
                AGO Weight
                <input 
                  type="number" 
                  className="mt-1 w-full border border-purple-300 rounded px-3 py-2 bg-white text-purple-800"
                  value={agoWeight}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(e) => setAgoWeight(parseFloat(e.target.value) || 0)}
                />
              </label>
              <label className="block text-purple-800 font-medium">
                Harmonic 432 Weight
                <input 
                  type="number" 
                  className="mt-1 w-full border border-purple-300 rounded px-3 py-2 bg-white text-purple-800"
                  value={harmonic432Weight}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(e) => setHarmonic432Weight(parseFloat(e.target.value) || 0)}
                />
              </label>
              <label className="block text-purple-800 font-medium">
                AUM Weight
                <input 
                  type="number" 
                  className="mt-1 w-full border border-purple-300 rounded px-3 py-2 bg-white text-purple-800"
                  value={aumWeight}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(e) => setAumWeight(parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button 
          disabled={busy} 
          onClick={generate} 
          className="px-6 py-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
        >
          {busy ? 'Generating...' : 'Generate Dataset'}
        </button>
        <button 
          disabled={!canTrain} 
          onClick={train} 
          className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium"
        >
          {busy ? 'Training...' : 'Train Model'}
        </button>
        <button 
          disabled={data.length === 0} 
          onClick={downloadCSV} 
          className="px-4 py-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white"
        >
          Download CSV
        </button>
        <button 
          disabled={!metrics} 
          onClick={downloadModelCard} 
          className="px-4 py-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white"
        >
          Download Model Card
        </button>
        <button 
          disabled={!ledger} 
          onClick={exportEvidence} 
          className="px-4 py-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white"
        >
          Export Evidence
        </button>
      </div>

      {/* Results display */}
      {data.length > 0 && (
        <div className="rounded-xl p-6 bg-slate-900/70 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Training Results</h3>
          <div className="grid sm:grid-cols-3 gap-6 text-slate-200">
            <div>
              <div className="text-sm text-slate-400 font-medium">Dataset Size</div>
              <div className="text-2xl font-bold">{data.length.toLocaleString()} rows</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 font-medium">Model Performance</div>
              <div className="text-2xl font-bold">
                {metrics ? `${metrics.auc.toFixed(3)} / ${metrics.prAuc.toFixed(3)}` : '—'}
              </div>
              <div className="text-xs text-slate-400 mt-1">ROC-AUC / PR-AUC</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 font-medium">Data Distribution</div>
              <div className="text-2xl font-bold">
                {metrics ? (metrics.prevalence * 100).toFixed(2) + '%' : '—'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Positive Class</div>
            </div>
          </div>
        </div>
      )}

      {/* Innovation Metrics Display */}
      {innovationMetrics && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">🚀 Innovation Metrics</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2">AGO Resonant Hypercube</h4>
              <div className="text-sm space-y-1">
                <div>Coherence: {innovationMetrics.ago.coherence.toFixed(3)}</div>
                <div>Symmetry Loss: {innovationMetrics.ago.symmetry_loss.toFixed(3)}</div>
                <div>Resonance: {innovationMetrics.ago.resonance.toFixed(3)}</div>
                <div>Stability: {innovationMetrics.ago.stability.toFixed(3)}</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2">432-Harmonic Regularizer</h4>
              <div className="text-sm space-y-1">
                <div>Resonance Entropy: {innovationMetrics.harmonic432.resonance_entropy.toFixed(3)}</div>
                <div>Cycle Closure: {innovationMetrics.harmonic432.cycle_closure.toFixed(3)}</div>
                <div>Off-Grid Variance: {innovationMetrics.harmonic432.off_grid_var.toFixed(3)}</div>
                <div>Chord Purity: {innovationMetrics.harmonic432.chord_purity.toFixed(3)}</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2">AUM Certificate</h4>
              <div className="text-sm space-y-1">
                <div>Score: {innovationMetrics.aum.score.toFixed(3)}</div>
                <div>Smoothness: {innovationMetrics.aum.smoothness.toFixed(3)}</div>
                <div>Symmetry: {innovationMetrics.aum.symmetry.toFixed(3)}</div>
                <div>Status: {innovationMetrics.aum.pass ? '✅ PASS' : '❌ FAIL'}</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2">8D Causal Manifold</h4>
              <div className="text-sm space-y-1">
                <div>Invariant Drift: {innovationMetrics.causal8d.invariant_drift.toFixed(3)}</div>
                <div>ODE Smoothness: {innovationMetrics.causal8d.ode_smoothness.toFixed(3)}</div>
                <div>Causal Plausibility: {innovationMetrics.causal8d.causal_plausibility.toFixed(3)}</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2">Octonion Features</h4>
              <div className="text-sm space-y-1">
                <div>Invariance: {innovationMetrics.octonion.invariance.toFixed(3)}</div>
                <div>Energy Retention: {innovationMetrics.octonion.energy_retention.toFixed(3)}</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-800 mb-2">Advanced Metrics</h4>
              <div className="text-sm space-y-1">
                <div>TriCoT Score: {innovationMetrics.tricotscore.toFixed(3)}</div>
                <div>ACI: {innovationMetrics.aci.toFixed(3)}</div>
                <div>ZK-UPB: {innovationMetrics.zk_upb.present ? '✅' : '❌'}</div>
                <div>HCA Abstain Rate: {innovationMetrics.hca.abstain_rate.toFixed(3)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model analysis panels */}
      {data.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <EnergyLedgerPanel ledger={ledger} />
          <div className="space-y-4">
            <LossChart history={lossHistory} />
            <CollisionGraph ledger={ledger} />
          </div>
        </div>
      )}

      {/* Business value proposition */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">🚀 Ready for Production</h3>
        <div className="grid md:grid-cols-2 gap-4 text-green-800">
          <div>
            <h4 className="font-medium mb-2">For Data Scientists:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Pre-trained models with synthetic data</li>
              <li>• Evidence bundles for compliance</li>
              <li>• Databricks integration ready</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For Enterprises:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Production-ready model deployment</li>
              <li>• Privacy-preserving synthetic data</li>
              <li>• Full audit trail and compliance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelLab;


