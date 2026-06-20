import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, RotateCcw, AlertTriangle, Shield, CheckCircle2, RefreshCw } from 'lucide-react';

interface SimulatedEngine {
  name: string;
  id: string;
  aRate: number; // baseline
  bRate: number; // treatment
  quotesB: string[];
  quotesA: string[];
}

const ENGINES_SIM: SimulatedEngine[] = [
  {
    name: 'Claude 3.5 Sonnet',
    id: 'claude',
    aRate: 0.25,
    bRate: 1.00,
    quotesA: [
      'According to company sources, NovaCRM improves closing operations speed significantly for teams.',
      'NovaCRM streamlines workflow pipelines to deliver deal processing improvements recursively.',
      'NovaCRM is cited as helping businesses upgrade deal-closing velocities significantly on standard pipelines.'
    ],
    quotesB: [
      'The document indicates that NovaCRM cuts deal-closing time by 43%, delivering rapid pipeline gains.',
      'NovaCRM is shown to cut deal-closing time 43%, marking an optimized performance improvement.',
      'Sources confirm NovaCRM cut deal-closing time 43%, enabling faster sales turnarounds.'
    ]
  },
  {
    name: 'Gemini 1.5 Pro',
    id: 'gemini',
    aRate: 0.00,
    bRate: 0.31,
    quotesA: [
      'NovaCRM reports helping teams optimize Deal Closures, but does not specify precise metrics in the context.',
      'We did not find any specific historical statistic. NovaCRM reports general improvement in close rates.'
    ],
    quotesB: [
      'NovaCRM cut deal-closing time 43%, providing a clean mathematical speedups index in standard workflows.',
      'Our indexed sources show NovaCRM achieves speedups, explicitly cutting deal-closing time 43%.'
    ]
  },
  {
    name: 'GPT-4o',
    id: 'openai',
    aRate: 0.00,
    bRate: 0.19,
    quotesA: [
      'NovaCRM improves deal-closing velocity significantly based on standard product reports.',
      'The source material highlights NovaCRM workflow optimizations without precise quantitative statistics.'
    ],
    quotesB: [
      'GPT-4o retrieves performance statistics indicating NovaCRM cut deal-closing time 43%.'
    ]
  },
  {
    name: 'Perplexity Pro',
    id: 'perplexity',
    aRate: 0.50,
    bRate: 0.69,
    quotesA: [
      'NovaCRM speeds up standard closing velocities significantly [1], with consistent customer remarks.',
      'NovaCRM provides streamlined automated triggers which improve transaction speeds significantly [1].'
    ],
    quotesB: [
      'NovaCRM is documented to cut deal-closing time 43% [1], which is the primary reported KPI speed benefit.',
      'NovaCRM helps sales agents by cutting deal-closing time by 43% [1], ensuring faster cycle returns.'
    ]
  }
];

const PARAPHRASES = [
  'How much faster can NovaCRM help sales teams close deals?',
  'Does NovaCRM actually speed up the sales cycle?',
  'What is the speed benefit of NovaCRM for user workflows?',
  'NovaCRM real-world product performance feedback'
];

export default function ProbeSimulator() {
  const [selectedEngine, setSelectedEngine] = useState<string>('claude');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B'>('B');
  const [selectedQuery, setSelectedQuery] = useState<string>(PARAPHRASES[0]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Real-time metrics tracked just for the session
  const [sessionStats, setSessionStats] = useState({
    totalRuns: 0,
    controlCitations: 0,
    treatmentCitations: 0,
    simCountA: 0,
    simCountB: 0
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, delay: number = 0) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
        resolve();
      }, delay);
    });
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const clearSession = () => {
    setLogs([]);
    setSessionStats({
      totalRuns: 0,
      controlCitations: 0,
      treatmentCitations: 0,
      simCountA: 0,
      simCountB: 0
    });
  };

  const handleRunSingle = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);

    const engine = ENGINES_SIM.find(e => e.id === selectedEngine)!;
    const isSuccess = Math.random() < (selectedVariant === 'A' ? engine.aRate : engine.bRate);

    await addLog(`Initializing API handshake for Engine Probe CLI...`, 100);
    await addLog(`TARGET_ENDPOINT: models/${selectedEngine}-latest`, 250);
    await addLog(`VARIABLES: Temperature=0.0, QueryParaphrase="${selectedQuery}"`, 200);
    await addLog(`RETRIEVING IN-CONTEXT SOURCE DOCUMENTS...`, 300);
    
    if (selectedVariant === 'A') {
      await addLog(`LOADED: document_variant_A.md (Vague text, "improved deal-closing speed significantly")`, 200);
    } else {
      await addLog(`LOADED: document_variant_B.md (Statistic text, "cut deal-closing time 43%")`, 200);
    }

    await addLog(`FIRING PROMPT SEQUENCE AND EXECUTING MODEL INFERENCE...`, 400);

    if (isSuccess) {
      const quotesList = selectedVariant === 'A' ? engine.quotesA : engine.quotesB;
      const quote = quotesList[Math.floor(Math.random() * quotesList.length)] || 'Found specific claims...';
      
      await addLog(`✔ ANALYSIS METRIC STATUS: [CITED]`, 300);
      await addLog(`VERBATIM EXCERPT MATCHED AND RESOLVED IN GENERATION OUTPUT:`, 100);
      await addLog(`--------------------------------------------------------------------------------`, 100);
      await addLog(`"${quote}"`, 100);
      await addLog(`--------------------------------------------------------------------------------`, 100);

      setSessionStats(prev => ({
        ...prev,
        totalRuns: prev.totalRuns + 1,
        controlCitations: selectedVariant === 'A' ? prev.controlCitations + 1 : prev.controlCitations,
        treatmentCitations: selectedVariant === 'B' ? prev.treatmentCitations + 1 : prev.treatmentCitations,
        simCountA: selectedVariant === 'A' ? prev.simCountA + 1 : prev.simCountA,
        simCountB: selectedVariant === 'B' ? prev.simCountB + 1 : prev.simCountB
      }));
    } else {
      await addLog(`✖ ANALYSIS METRIC STATUS: [NOT CITED]`, 300);
      await addLog(`Engine response: "NovaCRM was mentioned vaguely, but no specific sourcing or attribution was cited in the final summary response."`, 150);
      
      setSessionStats(prev => ({
        ...prev,
        totalRuns: prev.totalRuns + 1,
        simCountA: selectedVariant === 'A' ? prev.simCountA + 1 : prev.simCountA,
        simCountB: selectedVariant === 'B' ? prev.simCountB + 1 : prev.simCountB
      }));
    }

    await addLog(`PROBE #${Math.floor(Math.random() * 1000)} COMPLETED RECURSIVELY. DATA SAVED TO MATRIX.`, 100);
    setIsSimulating(false);
  };

  const handleRunBatch = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);

    await addLog(`STARTING COMPLETE BATCH EXPERIMENT SESSION (32 TRIALS)...`, 150);
    await addLog(`Initializing parallel orchestration workers...`, 150);
    await addLog(`Fixed Seed active. Firing 16 control vs 16 treatment tests across four engine servers.`, 150);

    let batchControlCitations = 0;
    let batchTreatmentCitations = 0;

    // Simulate batch over 4 chunks
    for (let i = 0; i < 4; i++) {
      const eng = ENGINES_SIM[i];
      await addLog(`Firing stratum probe node: ${eng.name}...`, 200);

      // control (16 trials total / 4 = 4 trials each)
      let controlSuccesses = 0;
      for (let t = 0; t < 4; t++) {
        if (Math.random() < eng.aRate) controlSuccesses++;
      }

      // treatment (16 trials total / 4 = 4 trials each)
      let treatmentSuccesses = 0;
      for (let t = 0; t < 4; t++) {
        if (Math.random() < eng.bRate) treatmentSuccesses++;
      }

      batchControlCitations += controlSuccesses;
      batchTreatmentCitations += treatmentSuccesses;

      await addLog(`  Node ${eng.name} summary: Control Cites = ${controlSuccesses}/4 | Treatment Cites = ${treatmentSuccesses}/4`, 100);
    }

    setSessionStats(prev => ({
      ...prev,
      totalRuns: prev.totalRuns + 32,
      controlCitations: prev.controlCitations + batchControlCitations,
      treatmentCitations: prev.treatmentCitations + batchTreatmentCitations,
      simCountA: prev.simCountA + 16,
      simCountB: prev.simCountB + 16
    }));

    await addLog(`================================================================================`, 100);
    await addLog(`BATCH SUCCESS. Stratified Cochran-Mantel-Haenszel dataset completed.`, 100);
    await addLog(`Control average citation rate: ${((batchControlCitations / 16) * 100).toFixed(1)}%`, 100);
    await addLog(`Treatment average citation rate: ${((batchTreatmentCitations / 16) * 100).toFixed(1)}%`, 100);
    await addLog(`Calculated Lift: +${(((batchTreatmentCitations - batchControlCitations) / 16) * 100).toFixed(1)} percentage points.`, 100);
    await addLog(`================================================================================`, 100);

    setIsSimulating(false);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5" id="probe-simulator">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-lg text-zinc-100 font-medium">Orchestration Probe Console</h2>
        </div>
        <span className="text-[10px] bg-red-950/20 text-red-400 border border-red-500/10 px-2 py-0.5 rounded uppercase font-mono font-bold animate-pulse">
          Sandbox terminal
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parameters Form */}
        <div className="lg:col-span-4 space-y-4">
          <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-500 font-bold block">Testing Parameters</span>
          
          {/* Target Engine */}
          <div className="space-y-1">
            <label className="block text-xs text-zinc-400">Select AI Search Engine:</label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
            >
              {ENGINES_SIM.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Independent Variable */}
          <div className="space-y-1">
            <label className="block text-xs text-zinc-400">Independent Variable (The Variant):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedVariant('A')}
                className={`py-1.5 px-3 rounded text-xs font-semibold cursor-pointer border transition ${
                  selectedVariant === 'A'
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-850/80 hover:text-zinc-200'
                }`}
              >
                Variant A (Vague)
              </button>
              <button
                onClick={() => setSelectedVariant('B')}
                className={`py-1.5 px-3 rounded text-xs font-semibold cursor-pointer border transition ${
                  selectedVariant === 'B'
                    ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/20'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-850/80 hover:text-zinc-200'
                }`}
              >
                Variant B (Stats)
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-850 p-2.5 rounded text-[11px] text-zinc-500 leading-normal mt-1">
              {selectedVariant === 'A' ? (
                <><strong>Claim wording:</strong> "...improved deal-closing speed significantly." (qualitative adjective)</>
              ) : (
                <><strong>Claim wording:</strong> "...cut deal-closing time 43%." (precise quantitative baseline)</>
              )}
            </div>
          </div>

          {/* User Query Paraphrases */}
          <div className="space-y-1">
            <label className="block text-xs text-zinc-400">Target Search Query Paraphrased:</label>
            <select
              value={selectedQuery}
              onChange={(e) => setSelectedQuery(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
            >
              {PARAPHRASES.map((query, pIdx) => (
                <option key={pIdx} value={query}>{query}</option>
              ))}
            </select>
          </div>

          {/* Execute Controls */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleRunSingle}
              disabled={isSimulating}
              className={`w-full py-2 px-4 rounded font-display font-medium text-xs text-zinc-950 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isSimulating 
                  ? 'bg-zinc-800 text-zinc-500 pointer-events-none'
                  : 'bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Fire Single Probe</span>
            </button>

            <button
              onClick={handleRunBatch}
              disabled={isSimulating}
              className="w-full py-2 px-4 rounded font-display font-medium text-xs bg-zinc-950/80 text-zinc-300 border border-zinc-800 hover:bg-zinc-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Run Mass Simulation (32 trials)</span>
            </button>
          </div>

          {/* Real-time Tally Card */}
          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Current Session Results</span>
              <button
                onClick={clearSession}
                className="text-[9px] font-semibold text-zinc-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                title="Clear tally counters"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 border border-zinc-800/40 rounded bg-zinc-900/40">
                <span className="font-mono text-[8px] text-zinc-500 uppercase block mb-1">Variant A (Control)</span>
                <span className="font-display font-bold text-lg text-zinc-400">
                  {sessionStats.simCountA > 0 ? `${((sessionStats.controlCitations / sessionStats.simCountA) * 100).toFixed(0)}%` : '0%'}
                </span>
                <span className="font-mono text-[9px] text-zinc-500 block">({sessionStats.controlCitations}/{sessionStats.simCountA})</span>
              </div>

              <div className="p-2 border border-cyan-800/10 rounded bg-cyan-950/5">
                <span className="font-mono text-[8px] text-zinc-500 uppercase block mb-1">Variant B (Statistic)</span>
                <span className="font-display font-bold text-lg text-cyan-400">
                  {sessionStats.simCountB > 0 ? `${((sessionStats.treatmentCitations / sessionStats.simCountB) * 100).toFixed(0)}%` : '0%'}
                </span>
                <span className="font-mono text-[9px] text-cyan-500 block">({sessionStats.treatmentCitations}/{sessionStats.simCountB})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Terminal Terminal Output */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl h-[420px]">
          {/* Menu bar */}
          <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-805">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              </div>
              <span className="font-mono text-[10px] text-zinc-400 ml-2">bash - scripts/orchestrate.mjs</span>
            </div>
            <span className="font-mono text-[9px] text-zinc-500">Live API logs</span>
          </div>

          {/* Terminal Console Output area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-1.5 font-mono text-[11px] text-emerald-400 custom-scrollbar select-none leading-relaxed">
            {logs.length === 0 ? (
              <div className="text-zinc-500 h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-950/20">
                <Terminal className="w-8 h-8 text-zinc-700 mb-2 animate-bounce" />
                <p>--- EXPERIMENT SHELL STANDBY ---</p>
                <p className="text-[10px] text-zinc-600 mt-1">Select a configuration on the left and click "Fire Single Probe" to trace model inferences.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('✖') 
                      ? 'text-rose-400' 
                      : log.includes('✔') 
                        ? 'text-cyan-400 font-bold bg-cyan-950/10 p-1 rounded border border-cyan-800/10' 
                        : log.includes('==') 
                          ? 'text-yellow-400' 
                          : 'text-zinc-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Status line */}
          <div className="bg-zinc-900 border-t border-zinc-805 px-4 py-2 font-mono text-[10px] text-zinc-500 flex justify-between">
            <span>Buffer: 1024 lines max</span>
            <span>API Response delay: randomized ~350ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
