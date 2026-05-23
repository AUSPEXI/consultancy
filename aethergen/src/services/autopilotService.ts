import { estimateStep } from './costEstimator';
import { hreTechnologyService } from './hreTechnologyService';
import { computeACI } from './anticipatoryConsistency';
import { certifyTriCoT } from './triCotValidator';
import { runVRME } from './vacuumResonanceMultiverse';

export type RiskLevel = 'green' | 'amber' | 'red';

export interface AutopilotConfig {
  maxTrials: number;
  timeBudgetMs: number;
  elasticTransfer?: boolean; // AetherCradle
  codaScheduler?: boolean;   // Collision-Optimized Data Accelerator
  constraints?: {
    epsilonMax?: number;
    riskAllow?: RiskLevel; // green|amber
    requireTriCoTPass?: boolean;
    minAci?: number; // 0..1
  };
  weights?: {
    accuracy?: number;
    utility?: number;
    privacy?: number;
    latency?: number; // negative weight to prefer lower latency
  };
}

export interface TrialConfig {
  epsilon: number;
  syntheticRatio: number;
  iqrK: number;
  models?: string[];
}

export interface TrialResult {
  cfg: TrialConfig;
  metrics: { accuracy: number; utility: number; privacy: number };
  latencyMs: number;
  risk: RiskLevel;
  score: number;
  transferredFrom?: string; // AetherCradle provenance
}

const cache = new Map<string, TrialResult>();

function key(cfg: TrialConfig) { return JSON.stringify(cfg); }

function clamp(x: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, x)); }

function riskFromData(data: any[]): RiskLevel {
  const n = Math.max(1, data.length);
  const unique = new Set(data.map((r) => JSON.stringify(r))).size;
  const uniq = unique / n;
  // simple entropy approx
  const keys = Object.keys(data[0] || {}).slice(0, 6);
  const ent: number[] = [];
  for (const k of keys) {
    const vals = data.map(r=>r[k]).filter(v=>typeof v==='string'||typeof v==='boolean');
    if (vals.length<2) continue;
    const freq: Record<string, number> = {};
    vals.forEach(v=>{ const s=String(v); freq[s]=(freq[s]||0)+1; });
    const total = vals.length;
    const ps = Object.values(freq).map(c=>c/total);
    const H = -ps.reduce((a,p)=>a+(p>0?p*Math.log2(p):0),0);
    const Hn = Object.keys(freq).length>1? H/Math.log2(Object.keys(freq).length):0;
    ent.push(Hn);
  }
  const entropy = ent.length? ent.reduce((a,b)=>a+b,0)/ent.length : 0.7;
  if (uniq<0.85 || entropy<0.5) return 'red';
  if (uniq<0.9 || entropy<0.6) return 'amber';
  return 'green';
}

export async function runAutopilot(config: AutopilotConfig, schema: any, generatedData: any[], selectedModels: string[] = []): Promise<{ trials: TrialResult[]; frontier: TrialResult[] }>{
  const trials: TrialResult[] = [];
  const start = Date.now();
  const space: TrialConfig[] = buildSearchSpace(schema, selectedModels);
  const weights = { accuracy: 0.4, utility: 0.3, privacy: 0.3, latency: 0.2, ...(config.weights||{}) };
  let i = 0;
  let previousKey: string | null = null;
  for (const cfg of space) {
    if (i>=config.maxTrials) break;
    if (Date.now() - start > config.timeBudgetMs) break;
    if (config.constraints?.epsilonMax && cfg.epsilon > config.constraints.epsilonMax) { i++; continue; }
    const k = key(cfg);
    let res = cache.get(k);
    if (!res) {
      // Evaluate on a representative model (first or default)
      const model = (selectedModels && selectedModels.length>0)? selectedModels[0] : 'Refractor-Geometric';
      const bench = await hreTechnologyService.runComprehensiveBenchmark(model, generatedData, schema);
      const accuracy = clamp(bench.metrics.accuracy, 0.5, 0.99);
      const utility = clamp(bench.metrics.utilityScore, 0.5, 0.99);
      const privacy = clamp(bench.metrics.privacyScore, 0.5, 0.99);
      const latency = (estimateStep('benchmark', { models: 1 }).latencyMs||0) + (estimateStep('cleaning', { records: generatedData.length }).latencyMs||0);
      const risk = riskFromData(generatedData);
      // Innovation-aware boosts: ACI and TriCoT
      const aci = computeACI(generatedData).aci; // 0..1
      const tricotsRes = certifyTriCoT(generatedData);
      const vacuum = runVRME(generatedData, schema, { scales: 2, variants: 2 }).vacuumScore; // 0..1
      const tricots = tricotsRes.tricotscore; // 0..1
      const score = weights.accuracy*accuracy + weights.utility*utility + weights.privacy*privacy - weights.latency*(latency/2000) + 0.05*aci + 0.05*tricots + 0.05*vacuum;
      res = { cfg, metrics: { accuracy, utility, privacy }, latencyMs: latency, risk, score, transferredFrom: config.elasticTransfer && previousKey ? previousKey : undefined };
      cache.set(k, res);
    }
    if (config.constraints?.riskAllow === 'green' && res.risk!=='green') { i++; continue; }
    if (config.constraints?.riskAllow === 'amber' && res.risk==='red') { i++; continue; }
    // Constraints
    if (config.constraints?.requireTriCoTPass && certifyTriCoT(generatedData).pass === false) { i++; continue; }
    if (typeof config.constraints?.minAci === 'number') {
      const aciNow = computeACI(generatedData).aci;
      if (aciNow < (config.constraints!.minAci as number)) { i++; continue; }
    }
    trials.push(res);
    previousKey = key(cfg);
    i++;
  }
  const frontier = paretoFrontier(trials);
  return { trials, frontier };
}

function buildSearchSpace(schema: any, selectedModels: string[]): TrialConfig[] {
  const epsCandidates = [schema?.privacySettings?.epsilon ?? 0.1, 0.05, 0.1, 0.2].filter((v,i,a)=>a.indexOf(v)===i);
  const ratioCandidates = [schema?.privacySettings?.syntheticRatio ?? 95, 90, 95, 98].filter((v,i,a)=>a.indexOf(v)===i);
  const iqrCandidates = [1.2, 1.5];
  const out: TrialConfig[] = [];
  for (const e of epsCandidates) for (const r of ratioCandidates) for (const k of iqrCandidates) out.push({ epsilon: e, syntheticRatio: r, iqrK: k, models: selectedModels });
  return out;
}

function dominates(a: TrialResult, b: TrialResult): boolean {
  const betterOrEqual = a.metrics.accuracy >= b.metrics.accuracy && a.metrics.utility >= b.metrics.utility && a.metrics.privacy >= b.metrics.privacy && a.latencyMs <= b.latencyMs;
  const strictlyBetter = a.metrics.accuracy > b.metrics.accuracy || a.metrics.utility > b.metrics.utility || a.metrics.privacy > b.metrics.privacy || a.latencyMs < b.latencyMs;
  return betterOrEqual && strictlyBetter;
}

function paretoFrontier(trials: TrialResult[]): TrialResult[] {
  const out: TrialResult[] = [];
  for (const t of trials) {
    if (!trials.some(o => dominates(o, t))) out.push(t);
  }
  // sort by multi-objective score descending
  return out.sort((a,b)=>b.score-a.score);
}



