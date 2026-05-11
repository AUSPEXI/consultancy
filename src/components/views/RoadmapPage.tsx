import { motion } from 'framer-motion';
import { Target, BrainCircuit, Globe, Shield, Zap, TrendingUp, Hash } from 'lucide-react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';

const ROADMAP_ITEMS = [
  {
    title: "Real-time Global Neural Indexing",
    status: "In Development",
    icon: Globe,
    description: "Moving beyond passive daily crawls. We are building infrastructure to maintain a live index of how LLMs perceive entities in real-time, mapping the shifting weights of AI neural networks globally as they happen."
  },
  {
    title: "Proprietary LLM Probe Models",
    status: "Q4 2026",
    icon: BrainCircuit,
    description: "Instead of just using generalized third-party APIs, we are training custom, heavily quantized probing models that run at massive scale. These probes reverse-engineer and predict how major foundational models will respond to specific entities before human users even form their queries."
  },
  {
    title: "Automated AI-Native Fact Seeding (AIFS)",
    status: "Q1 2027",
    icon: Zap,
    description: "Autonomous agents that automatically inject high-entropy facts from the Fact-Vault into targeted, high-authority AI training corpora (like Wikipedia, Reddit, StackOverflow). We ensure your brand is integrated into the model's base knowledge during their next pre-training or fine-tuning run."
  },
  {
    title: "Agentic Market Manipulation Defense (AMMD)",
    status: "Q2 2027",
    icon: Shield,
    description: "Detecting and defending against malicious competitor bots attempting to poison the AI's context window. Auspexi will act as a digital immune system, automatically neutralizing negative sentiment attacks on your brand."
  },
  {
    title: "Cross-Model Synthetic Benchmarking",
    status: "Q3 2027",
    icon: Target,
    description: "The 'FICO score' for AI presence. A unified, universally recognized metric that VCs, CMOs, and analysts use to evaluate a brand's deterministic strength across ChatGPT, Gemini, Claude, and Perplexity."
  },
  {
    title: "Predictive Trend Hacking",
    status: "Q4 2027",
    icon: TrendingUp,
    description: "Using predictive AI to forecast emerging generative queries and automatically generating optimized Fact-Vault content days before human SEOs even realize a trend is forming."
  }
];

export function RoadmapPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-24 pb-16 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <div className="max-w-6xl mx-auto px-6 mb-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-400 text-sm font-medium border border-pink-500/20 mb-6">
            <Target className="w-4 h-4" />
            The Future of GEO
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 font-heading">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">Master Plan</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
            We aren't just building a generative dashboard. We are building the deterministic operating system for the next generation of search. Here is how we dominate the AI Share of Voice (SoV) game.
          </p>
        </motion.div>

        {/* Vertical Alternating Timeline */}
        <div className="relative">
          {/* Center Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 transform -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {ROADMAP_ITEMS.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Timeline Dot */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-950 border-4 border-zinc-900 items-center justify-center z-10 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                    <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                  </div>

                  {/* Content Box */}
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div className={`w-full max-w-md ${isEven ? 'md:ml-auto md:pl-16' : 'md:mr-auto md:pr-16'}`}>
                      <div className="group relative p-8 rounded-2xl bg-[#0B0E14] border border-zinc-800 hover:border-pink-500/50 transition-all overflow-hidden text-left">
                        {/* Subtle vector grid */}
                        <div 
                          className="absolute inset-0 opacity-[0.25] pointer-events-none group-hover:opacity-[0.4] transition-opacity"
                          style={{
                            backgroundImage: `linear-gradient(to right, #EC4899 1px, transparent 1px), linear-gradient(to bottom, #EC4899 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'left top',
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                          }}
                        />
                        <div 
                          className="absolute inset-0 pointer-events-none bg-[#0B0E14]"
                          style={{
                            opacity: 0.9,
                            maskImage: 'linear-gradient(to bottom, black 0%, transparent 10%, transparent 90%, black 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 10%, transparent 90%, black 100%)',
                          }}
                        />
                        {/* Glowing effects */}
                        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none group-hover:bg-pink-500/20 transition-all" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 shrink-0 rounded-full bg-zinc-950 border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)] flex items-center justify-center group-hover:scale-110 transition-transform p-2">
                              <img src="/auspexi-logo.png" alt="Auspexi" className="w-full h-full object-contain" />
                            </div>
                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-zinc-950 text-zinc-200 border border-zinc-700/50 backdrop-blur-md">
                              {item.status}
                            </span>
                          </div>
                          
                          <h3 className="text-2xl font-bold text-white mb-3 leading-tight">{item.title}</h3>
                          <p className="text-zinc-400 text-base leading-relaxed mb-6">
                            {item.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 w-full opacity-70 font-mono text-xs text-pink-200 mt-auto">
                            <Hash className="w-3.5 h-3.5 text-pink-500" />
                            <span>SYS_RENDER_OK</span>
                            <span className="text-zinc-600">|</span>
                            <span>NODE_{1856 + index}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <Footerdemo />
    </div>
  );
}
