import React, { useState } from 'react';
import { STORYBOARD_DATA } from '../data/storyboard';
import { FileText, Camera, Volume2, Sparkles, MoveRight } from 'lucide-react';

interface ScriptSegment {
  id: number;
  title: string;
  timestamp: string;
  text: string;
  panelIds: number[];
}

const SCRIPT_SEGMENTS: ScriptSegment[] = [
  {
    id: 1,
    title: '1. THE HOOK',
    timestamp: '0:00 - 0:20',
    text: "On Claude, swapping one vague phrase for one specific number took citation rate from 25% all the way to 100%. Every single trial. But before you go rewrite every opening line you've ever written — that massive result did not hold everywhere. Let me show you what actually happened across four engines.",
    panelIds: [1, 2, 3]
  },
  {
    id: 2,
    title: '2. THE HYPOTHESIS',
    timestamp: '0:20 - 1:00',
    text: "Here's the question. There's a popular GEO claim that large language models prefer to cite sentences with specific, verifiable numbers — that a precise statistic reads as more citable than vague language. So I tested exactly that. Same product page about NovaCRM. Same length, same structure. Variant A says it improved deal speed significantly. Variant B says it cut deal-closing time 43%. If the theory holds, B gets cited more.",
    panelIds: [4, 5, 6]
  },
  {
    id: 3,
    title: '3. THE METHOD',
    timestamp: '1:00 - 3:00',
    text: "Trust first. Here's our design doc, fully committed to Git before data was gathered. Locked June 11, 2026. We held the brand constant. Eliminated background prior biases. Fixed the generator temperature, randomized query order. We fired four product-performance queries across Gemini, Claude, OpenAI, and Perplexity. Warning caveat: this run used n=2 trials per variant per engine. Work is exploratory, but patterns are staggering.",
    panelIds: [7, 8, 9, 10, 11, 12]
  },
  {
    id: 4,
    title: '4. THE RUN',
    timestamp: '3:00 - 5:00',
    text: "Watching the probes run is the fun part. Each sends the query, retrieves documents, and captures citation outputs. Instantly we notice: when Claude references Variant B, it pulls the verbatim stat, 'cut deal-closing time 43%' as a logical anchor. Meanwhile, Variant A keeps getting completely empty results on Gemini and OpenAI. Out of 16 trials, the vague control got exactly zero citations.",
    panelIds: [13, 14, 15, 16]
  },
  {
    id: 5,
    title: '5. THE RESULTS',
    timestamp: '5:00 - 8:00',
    text: "Let's go engine by engine. Claude control: 25% to treatment: 100% citation rate. Gemini: 0% to 31.3%. OpenAI: same positive direction (0% to 18.8%), but near-significant (p=0.068). Perplexity starts generous (50%) and steps up to 68.8% but represents noise. Overall pooled naive jump: 18.8% vs 54.7%. However, simple aggregation commits Simpson's Paradox. Thus we deployed CMH stratified testing.",
    panelIds: [17, 18, 19, 20, 21, 22]
  },
  {
    id: 6,
    title: '6. THE FIX & COMPLETED RIGOR',
    timestamp: '3:15 - 4:35',
    text: "To protect the integrity of the data, we deployed a stratified Cochran-Mantel-Haenszel test, yielding a common Odds Ratio (OR) of 10.2 (highly significant, p=0.0004). Then we evaluated alpha corrections. Bonferroni is too punishing, yielding a False Negative for Gemini. We implemented a step-down Holm-Bonferroni correction to preserve power. We also validated verbatim scorers against Claude Haiku semantic judging, yielding 60.7% exact agreement.",
    panelIds: [23, 24, 25, 26, 27, 28, 29, 30]
  },
  {
    id: 7,
    title: '7. THREATS TO VALIDITY',
    timestamp: '8:00 - 9:30',
    text: "Now the part that keeps us completely honest. No statistical tool fixes design bounds. First: Sample size. This preliminary cohort is n=2 per engine. Second: Multiple comparisons require strict Holm correction. Third: In-context window synthesis (fast-mode) is distinct from actual web indexing. Fourth: snapping June 2026 model snapshot parameters. We report transparently.",
    panelIds: [31, 32]
  },
  {
    id: 8,
    title: '8. WHAT IT MEANS & THE CTA',
    timestamp: '9:30 - end',
    text: "So what do you do? Takeaway is low-risk and cheap: where you have a verified statistic, put it in your opening sentence instead of a vague qualifier! 'Cut deal-closing time 43%' beats 'improved significantly' directionally in 4 out of 4 engines, and significantly on 2. It costs nothing. Tell me what we missed in community logs, and subscribe. Explore L8EntSpace below.",
    panelIds: [33, 34, 35, 36]
  }
];

export default function ScriptExplorer() {
  const [selectedSegmentId, setSelectedSegmentId] = useState<number>(1);
  const [hoveredPanelId, setHoveredPanelId] = useState<number | null>(null);

  const currentSegment = SCRIPT_SEGMENTS.find(s => s.id === selectedSegmentId) || SCRIPT_SEGMENTS[0];
  const panelsInCurrentSegment = STORYBOARD_DATA.filter(p => currentSegment.panelIds.includes(p.panelId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in font-sans" id="script-explorer">
      {/* LEFT COLUMN: Transcript explorer */}
      <div className="lg:col-span-6 bg-[#09090b] border border-white/10 rounded-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-100 italic">Interactive Teleprompter</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Read the director's script & highlight associated board metrics</p>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
            {SCRIPT_SEGMENTS.map((segment) => {
              const isActive = segment.id === selectedSegmentId;
              return (
                <div
                  key={segment.id}
                  onClick={() => setSelectedSegmentId(segment.id)}
                  className={`p-4 rounded-sm border text-left cursor-pointer transition duration-150 relative ${
                    isActive
                      ? 'bg-white/[0.04] border-cyan-400 shadow-[0_4px_12px_rgba(34,211,238,0.08)] ring-1 ring-cyan-400/20'
                      : 'bg-white/[0.01]/30 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {segment.title}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500">{segment.timestamp}</span>
                  </div>
                  <p className={`text-xs leading-relaxed font-serif ${isActive ? 'text-zinc-200 font-medium' : 'text-zinc-400 italic'}`}>
                    {segment.text}
                  </p>
                  
                  {isActive && (
                    <div className="absolute right-3 top-3.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                      <span className="font-mono text-[8px] uppercase text-cyan-400 tracking-wider font-bold">Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[9px] text-zinc-500 font-mono pt-4 border-t border-white/10 mt-4 uppercase tracking-wider">
          ✔ Click a cell in the script above to bind panel reproduction
        </div>
      </div>

      {/* RIGHT COLUMN: Active Panels in this section */}
      <div className="lg:col-span-6 bg-zinc-950 border border-white/10 rounded-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-serif font-bold text-base text-zinc-100 italic">Visual Asset Binder</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Currently mapping {currentSegment.panelIds.length} scene components</p>
              </div>
            </div>
            <span className="font-mono text-xs text-zinc-400 px-2.5 py-0.5 rounded bg-zinc-900 border border-white/5 font-bold">
              SEGMENT #{currentSegment.id}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed font-serif italic">
            The visual boards listed below represent the exact camera targets mapped to the spoken audio of the highlighted script section above:
          </p>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
            {panelsInCurrentSegment.map((panel) => {
              const isHovered = panel.panelId === hoveredPanelId;
              
              return (
                <div
                  key={panel.panelId}
                  onMouseEnter={() => setHoveredPanelId(panel.panelId)}
                  onMouseLeave={() => setHoveredPanelId(null)}
                  className={`p-4 rounded-sm border text-left transition duration-150 ${
                    isHovered
                      ? 'bg-white/[0.04] border-cyan-400/40'
                      : 'bg-white/[0.01] border-white/5'
                  }`}
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                    <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                      PANEL #{panel.panelId} • Row {panel.row} Col {panel.col}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 font-bold">[{panel.startTime} - {panel.endTime}]</span>
                  </div>

                  {/* Visual Layout Description */}
                  <div className="mb-3">
                    <span className="text-[8px] font-mono uppercase text-zinc-500 font-bold tracking-wider block mb-1">VISUAL COMPOSITION:</span>
                    <p className="text-xs text-zinc-200 font-serif leading-relaxed font-semibold italic">
                      "{panel.visual}"
                    </p>
                  </div>

                  {/* Audio Script */}
                  <div className="text-[11px] text-zinc-350 italic bg-zinc-950/80 p-3 rounded-sm border border-white/5 flex items-start gap-2 leading-relaxed">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>"{panel.audio}"</span>
                  </div>

                  {/* B-Roll requirements */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase tracking-wider">Asset Required:</span>
                    <span className="text-cyan-400 font-bold uppercase tracking-wide">{panel.bRoll}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Binder guide */}
        <div className="pt-4 border-t border-white/10 mt-5 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1 font-mono uppercase text-[8.5px] tracking-wide text-zinc-450 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Segment {currentSegment.id} bound successfully
          </span>
          <button
            onClick={() => {
              // Smoothly scroll or click the play button in the storyboard explorer
              const target = document.getElementById('storyboard-explorer');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // Also automatically select the first panel of this segment
                const firstId = currentSegment.panelIds[0];
                const panelBtn = document.getElementById(`panel-button-${firstId}`);
                if (panelBtn) {
                  panelBtn.click();
                }
              }
            }}
            className="text-xs text-cyan-400 font-bold flex items-center gap-1 border-b border-cyan-400/40 hover:text-cyan-300 hover:border-cyan-300 transition shrink-0 cursor-pointer font-mono uppercase tracking-wider text-[10px]"
          >
            <span>Preview in Director's HUD</span>
            <MoveRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
