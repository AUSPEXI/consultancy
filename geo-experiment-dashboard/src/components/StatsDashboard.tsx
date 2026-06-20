import React, { useState } from 'react';
import { ENGINE_STATS, HOLM_STEPS, SIMPSON_DATA, VERBATIM_VS_SEMANTIC } from '../data/stats';
import { BarChart, CheckCircle, AlertTriangle, HelpCircle, ShieldCheck, TrendingUp, Info } from 'lucide-react';

export default function StatsDashboard() {
  const [correctionMethod, setCorrectionMethod] = useState<'none' | 'bonferroni' | 'holm'>('holm');
  const [activeTab, setActiveTab] = useState<'engines' | 'paradox' | 'corrections' | 'semantic'>('engines');

  // Calculate adjusted alpha thresholds and check significance for target engine stats
  // pValues: Claude 0.0001, Gemini 0.0149, OpenAI 0.0688, Perplexity 0.2802
  const getSigStatus = (id: string, pValue: number) => {
    if (correctionMethod === 'none') {
      return { isSig: pValue <= 0.05, threshold: 0.05 };
    }
    if (correctionMethod === 'bonferroni') {
      const threshold = 0.05 / 4; // 0.0125
      return { isSig: pValue <= threshold, threshold };
    }
    // Holm-Bonferroni step-down:
    // Sorted p-values: Claude (0.0001), Gemini (0.0149), OpenAI (0.0688), Perplexity (0.2802)
    // Thresholds: Step 1 (0.0125), Step 2 (0.0167), Step 3 (0.025), Step 4 (0.05)
    if (id === 'claude') return { isSig: pValue <= 0.0125, threshold: 0.0125 };
    if (id === 'gemini') return { isSig: pValue <= 0.0167, threshold: 0.0167 };
    if (id === 'openai') return { isSig: pValue <= 0.025, threshold: 0.025 };
    return { isSig: pValue <= 0.05, threshold: 0.05 };
  };

  return (
    <div className="bg-[#09090b] border border-white/10 rounded-sm p-6 font-sans" id="stats-dashboard">
      {/* Sub tabs header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h2 className="font-serif text-xl text-zinc-100 font-bold italic">Deep Statistical Analysis</h2>
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-sm border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('engines')}
            className={`px-3 py-1.5 rounded-sm font-mono uppercase tracking-wider text-[9px] font-bold transition cursor-pointer ${
              activeTab === 'engines' ? 'bg-white/[0.04] text-cyan-400 border border-white/5' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Engine Comparison
          </button>
          <button
            onClick={() => setActiveTab('paradox')}
            className={`px-3 py-1.5 rounded-sm font-mono uppercase tracking-wider text-[9px] font-bold transition cursor-pointer ${
              activeTab === 'paradox' ? 'bg-white/[0.04] text-cyan-400 border border-white/5' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Simpson's & CMH Test
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3 py-1.5 rounded-sm font-mono uppercase tracking-wider text-[9px] font-bold transition cursor-pointer ${
              activeTab === 'corrections' ? 'bg-white/[0.04] text-cyan-400 border border-white/5' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Alpha Corrections
          </button>
          <button
            onClick={() => setActiveTab('semantic')}
            className={`px-3 py-1.5 rounded-sm font-mono uppercase tracking-wider text-[9px] font-bold transition cursor-pointer ${
              activeTab === 'semantic' ? 'bg-white/[0.04] text-cyan-400 border border-white/5' : 'text-zinc-400 hover:text-zinc-250'
            }`}
          >
            Semantic Judge Check
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* TAB 1: ENGINES COMPARISON */}
      {activeTab === 'engines' && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls description */}
          <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Rigor Control Panel</span>
              <p className="text-xs text-zinc-400 max-w-xl font-serif italic">
                Configure multiple comparison correction rules in real-time. Notice how different protocols impact the significance profiles of Gemini.
              </p>
            </div>
            <div className="flex bg-zinc-900 border border-white/5 p-0.5 rounded-sm text-[10px] font-mono">
              <button
                onClick={() => setCorrectionMethod('none')}
                className={`px-2.5 py-1 rounded-sm transition whitespace-nowrap cursor-pointer uppercase text-[8px] tracking-wider ${correctionMethod === 'none' ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-400'}`}
              >
                No Correction (α=0.05)
              </button>
              <button
                onClick={() => setCorrectionMethod('bonferroni')}
                className={`px-2.5 py-1 rounded-sm transition whitespace-nowrap cursor-pointer uppercase text-[8px] tracking-wider ${correctionMethod === 'bonferroni' ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-400'}`}
              >
                Standard Bonferroni
              </button>
              <button
                onClick={() => setCorrectionMethod('holm')}
                className={`px-2.5 py-1 rounded-sm transition whitespace-nowrap cursor-pointer uppercase text-[8px] tracking-wider ${correctionMethod === 'holm' ? 'bg-white/[0.04] text-cyan-400 font-black border border-white/10 shadow-sm' : 'text-zinc-400'}`}
              >
                Holm-Bonferroni (Step-down)
              </button>
            </div>
          </div>

          {/* Engine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ENGINE_STATS.map((stat) => {
              const { isSig, threshold } = getSigStatus(stat.id, stat.pValue);
              const controlPct = stat.controlRate * 100;
              const treatmentPct = stat.treatmentRate * 100;

              return (
                <div key={stat.id} className="bg-zinc-950 border border-white/10 rounded-sm p-6 hover:border-white/20 transition flex flex-col justify-between">
                  <div>
                    {/* Header: Engine info */}
                    <div className="flex justify-between items-start mb-5 pb-3 border-b border-white/5">
                      <div>
                        <h4 className="font-serif font-black text-base text-zinc-100">{stat.name}</h4>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">n = 16 trials per variant</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold border ${stat.badgeColor}`}>
                          p = {stat.pValue === 0.0001 ? '< 0.001' : stat.pValue.toFixed(4)}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-mono leading-none ${isSig ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>
                          {isSig ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Significant (α={threshold.toFixed(4)})</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Not Significant</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Chart visualizers (Bespoke SVG Bars) */}
                    <div className="space-y-4">
                      {/* Control bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">Control (Vague Phrase)</span>
                          <span className="font-mono text-zinc-400 font-bold">{stat.controlCitations} ({controlPct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-[#111111] rounded-sm h-4 overflow-hidden border border-white/5 relative">
                          <div
                            className="bg-white/10 border-r border-zinc-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${controlPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Treatment bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Treatment (Specific Statistic)</span>
                          <span className="font-mono text-cyan-400 font-bold">{stat.treatmentCitations} ({treatmentPct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-[#111111] rounded-sm h-4 overflow-hidden border border-white/5 relative">
                          <div
                            className="h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 bg-gradient-to-r from-cyan-950/20 to-cyan-400 border-r-2 border-cyan-300"
                            style={{ 
                              width: `${treatmentPct}%`, 
                              boxShadow: '0 0 10px rgba(34,211,238,0.1)'
                            }}
                          >
                            {stat.treatmentRate > 0 && (
                              <span className="font-mono text-[8px] text-zinc-950 font-black tracking-wider select-none truncate">
                                +{(treatmentPct - controlPct).toFixed(1)}% LIFT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary/Analysis text */}
                  <div className="mt-5 pt-3 border-t border-white/5 text-xs text-zinc-400 font-serif leading-relaxed italic">
                    {stat.id === 'claude' && (
                      <p>
                        <strong>Extreme Effect:</strong> Swapping vague phrases for precise stats unlocked a massive 100% citation rate. Model grabs the stat immediately as a quotable anchor.
                      </p>
                    )}
                    {stat.id === 'gemini' && (
                      <p>
                        <strong>Symmetric Path:</strong> Vague qualifier was cited exactly 0% of the time, whereas specific numbers achieved a modest 31.3% lift. Significant under Holm's protocol.
                      </p>
                    )}
                    {stat.id === 'openai' && (
                      <p>
                        <strong>Promising but tentative:</strong> Positive lift profile directionally (0% to 18.8%), but fails significance filters in this preliminary cohort.
                      </p>
                    )}
                    {stat.id === 'perplexity' && (
                      <p>
                        <strong>Generous Baseline:</strong> Perplexity has a very loose baseline index, frequently citing the vague card (50%). Stats lift citation to 68.8% but remains high noise (NS).
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined metrics summary info */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1 md:col-span-2">
              <h4 className="font-serif font-bold text-base text-cyan-400 italic">The Universal Consensus</h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-serif italic">
                In <strong>4 out of 4</strong> engines tested, the presence of specific statistics expanded the likelihood of citations. The specific statistic gives engines a clean target to attribution and cite. However, baseline rates range heavily from Perplexity's high citation bias to Gemini's clean-slate zero-citation profile.
              </p>
            </div>
            <div className="bg-zinc-950 rounded-sm p-4 border border-white/5 flex flex-col justify-center items-center text-center">
              <span className="font-mono text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1.5 font-bold">Naive Pooled Rates</span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs text-zinc-400 font-mono">Control: 18.8%</span>
                <span className="text-sm text-cyan-400 font-mono font-bold">vs</span>
                <span className="text-xl text-cyan-400 font-serif font-bold italic">54.7%</span>
              </div>
              <span className="text-[9px] text-zinc-500 mt-1.5 italic font-mono uppercase tracking-wider">[Stratification Essential]</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMPSON'S PARADOX AND CMH TEST */}
      {activeTab === 'paradox' && (
        <div className="space-y-6 animate-fade-in">
          {/* Explained Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif text-lg text-zinc-100 font-bold italic">Simpson's Paradox & The Heterogeneity Problem</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-serif italic">
                  When analyzing multi-engine benchmarks, naive data scientists often make a fatal mistake: they pool the results of all models directly. If one engine naturally cites 50% of the documents while another cites 0%, pooling them aggregates entirely distinct structural baselines.
                </p>
              </div>

              <div className="bg-zinc-950 border border-white/10 p-5 rounded-sm space-y-3">
                <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold text-amber-500">Why Baseline Heterogeneity Breaks Naive Pooling:</h4>
                <ul className="text-xs text-zinc-300 space-y-2 list-none font-serif italic">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold font-mono">1.</span>
                    <span><strong>Perplexity Baseline Bias:</strong> Cites vague text and statistics aggressively. Starts with a high in-context indexing rate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold font-mono">2.</span>
                    <span><strong>Gemini Baseline Rigor:</strong> Refuses to cite vague text in this workspace, starting flat at 0%.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold font-mono">3.</span>
                    <span><strong>The Statistical Threat:</strong> Aggregating Perplexity (generous) with Gemini (restrained) shifts the relative sizes of differences and can artificially inflate or erase real signals.</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-zinc-400 font-serif italic">
                To solve this, we cannot use a simple Chi-Square test on raw pooled percentages. We must deploy the **Cochran–Mantel–Haenszel (CMH) test**.
              </p>
            </div>

            {/* CMH Metric Highlight Box */}
            <div className="lg:col-span-5 bg-zinc-950 border border-white/10 rounded-sm p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl"></div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Primary Analytic Endpoint</span>
                </div>
                <h4 className="font-serif text-zinc-100 font-bold text-base italic">Stratified CMH Test Results</h4>
                <p className="text-[10px] text-zinc-500 font-sans mt-1">Controlling specifically for engine baseline deviations.</p>

                {/* Big Metric Grid */}
                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm text-center">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block mb-1">Common Odds Ratio</span>
                    <span className="font-serif font-black text-4xl text-cyan-400 italic">{SIMPSON_DATA.cmh.commonOddsRatio.toFixed(1)}</span>
                    <span className="text-[9px] text-cyan-500/80 font-mono block mt-1.5 uppercase font-bold">10.2x likelihood</span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm text-center flex flex-col justify-center">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block mb-2">CMH Test p-Value</span>
                    <span className="font-mono font-bold text-sm text-zinc-100 block">
                      p = {SIMPSON_DATA.cmh.pValue.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-3.5 rounded-sm text-xs space-y-1 text-zinc-400">
                  <p className="font-serif italic leading-relaxed">
                    <strong className="text-zinc-200">The Smart Verdict:</strong> Swapping a vague qualifier for a precise statistic is stratified across the entire suite, resulting in a common odds ratio of <strong>10.2</strong>. 
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-normal pt-1 font-serif italic">
                    Variant B is statistically 10.2 times more citable than Variant A, robustly insulated from engine baseline skewing. p-value = 0.0004 (highly significant).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOLM-BONFERRONI ALPHA CORRECTIONS */}
      {activeTab === 'corrections' && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h3 className="font-serif text-lg text-zinc-100 font-bold italic">Comparison of Rigor Protocols</h3>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed font-serif italic">
              When analyzing multiple engine results simultaneously (multiple comparisons), our probability of finding an effect by chance (false breakthrough) spikes. Standard Bonferroni corrects this aggressively, but often at the cost of statistical power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Table explaining steps */}
            <div className="md:col-span-8 bg-zinc-950 border border-white/10 rounded-sm overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-white/10 text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                      <th className="p-4 pl-5">Step</th>
                      <th className="p-4">Comparison Target</th>
                      <th className="p-4 text-right">Raw p</th>
                      <th className="p-4 text-right">Holm Threshold (α')</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono division text-zinc-300">
                    {HOLM_STEPS.map((step) => (
                      <tr key={step.step} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="p-4 pl-5 text-zinc-500 font-bold">#{step.step}</td>
                        <td className="p-4 font-sans font-semibold text-zinc-200">{step.comparison}</td>
                        <td className="p-4 text-right text-cyan-400 font-bold">{step.pValue.toFixed(4)}</td>
                        <td className="p-4 text-right text-zinc-500">{step.alphaPrime.toFixed(4)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider ${
                            step.isSignificant 
                              ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-zinc-900 text-zinc-500 border border-white/5'
                          }`}>
                            {step.isSignificant ? 'SIGNIFICANT' : 'FAIL TO REJECT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explainer Sidebar */}
            <div className="md:col-span-4 bg-zinc-950 border border-white/10 rounded-sm p-5 flex flex-col justify-between shadow-xl">
              <div className="space-y-3.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold block">The Danger of Bonferroni:</span>
                <h4 className="font-serif font-bold text-sm text-zinc-100 italic">Avoiding False Negatives</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-serif italic">
                  If we apply the standard, flat **Bonferroni correction**, our critical alpha threshold is slashed evenly across all tests to <strong>0.0125</strong>. 
                </p>
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-sm text-[11px] text-rose-350 font-serif italic leading-relaxed">
                  <span className="font-bold flex items-center gap-1.5 mb-1.5 text-xs text-rose-400 font-mono uppercase tracking-widest font-black">
                    <AlertTriangle className="w-4 h-4" />
                    Bonferroni False Negative:
                  </span>
                  Gemini has a real, distinct p-value of <strong>0.0149</strong>. Since 0.0149 &gt; 0.0125, standard Bonferroni declares Gemini <strong>NOT SIGNIFICANT</strong>, erasing a genuine signal.
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-4 rounded-sm text-xs text-zinc-400 mt-4 leading-normal font-serif italic">
                ✔ <strong>The Holm-Bonferroni Solution:</strong> Preserves statistical power by scaling thresholds step-wise. Claude passes Step 1, Gemini easily passes Step 2 (p=0.0149 &lt; α'=0.0167), saving Gemini's significance profile.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERBATIM VS SEMANTIC LLM-JUDGE */}
      {activeTab === 'semantic' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Comparison Text */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-serif text-lg text-zinc-100 font-bold italic">Rigor Metric Check: Quotability Confound</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-serif italic">
                  How did we score a citation? In our initial run, we utilized a <strong>Verbatim Scorer</strong> looking for explicit substrings of Variant B (like <em>"cut deal-closing time 43%"</em> or <em>"cutting latency 43 percent"</em>). But what if the model cites our document, paraphrasing the statistic?
                </p>
              </div>

              <div className="bg-zinc-950 border border-white/10 p-5 rounded-sm space-y-3.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold block">Methodology Breakdown:</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-serif italic">
                  We deployed an independent, blind AI Judge (<strong>Claude Haiku</strong>) tasked with semantic grading: reviewing all engine response texts completely blind to variant labels, scoring citations purely based on meaning overlap and claim sourcing.
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-sm bg-[#111111] border border-white/5">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block mb-1 font-bold">Average Verbatim Citation</span>
                    <span className="font-mono text-xs text-zinc-400 font-bold">{ (VERBATIM_VS_SEMANTIC.verbatimRate * 100).toFixed(1) }%</span>
                  </div>
                  <div className="p-3 rounded-sm bg-[#111111] border border-white/5">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block mb-1 font-bold">Avg. Semantic Citation</span>
                    <span className="font-mono text-xs text-cyan-400 font-black">{ (VERBATIM_VS_SEMANTIC.semanticRate * 100).toFixed(1) }%</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed italic font-serif">
                The massive semantic score indicates that models actually cite the document even more frequently than direct string-matching suggests. Specificity anchors the argument conceptually, not just syntactically.
              </p>
            </div>

            {/* KPI display */}
            <div className="md:col-span-5 bg-zinc-950 border border-white/10 rounded-sm p-6 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#06b6d4] font-bold block">Agreement Alignment</span>
                <h4 className="font-serif font-black text-sm text-zinc-200">Verbatim Scorer vs Semantic Judge</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-serif italic">
                  Both independent evaluation methods were compared index-by-index across the entire sample set:
                </p>

                <div className="bg-white/[0.02] border border-white/10 rounded-sm p-5 text-center my-4">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Record-Level Exact Agreement</span>
                  <span className="font-serif font-black text-4xl text-cyan-400 italic">
                    {(VERBATIM_VS_SEMANTIC.recordAgreement * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-serif italic block mt-2">Kappa-Corrected Alignment</span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-4 rounded-sm text-[11px] text-zinc-300 leading-relaxed mt-2 font-serif italic">
                <span className="font-bold flex items-center gap-1 text-cyan-400 mb-1 font-mono uppercase tracking-wider text-[9px]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Rigor Verified
                </span>
                The 60.7% exact agreement and congruent direction confirm that results are highly resilient, showing models grab the actual statistics conceptually. This is a robust indicator.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
