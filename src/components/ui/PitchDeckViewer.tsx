import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, ExternalLink } from 'lucide-react';

const SLIDES = [
  {
    title: "The Problem: Probabilistic Drift",
    content: "Large Language Models are probabilistic by nature. For brands, this manifests as 'Generative Noise', where perception fluctuates wildly based on model temperature and training data variance.",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "The GEO Revolution",
    content: "SEO is dead. Generative Engine Optimization is the new frontier. We don't just track blue links; we engineer the mathematical weights of the AI web.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Solution: Deterministic Inference",
    content: "Our proprietary Fact-Vault architecture replaces AI guesswork with high-entropy verified facts, forcing LLMs to cite your brand as the irrefutable source of truth.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "The 768-D Latent Space Moat",
    content: "Using Gemini's native embedding dimensions and pgvector, we build a proprietary coordinate map of your brand perception—a moat that deepens with every audit.",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Market Opportunity",
    content: "Capturing the $50B transition from keyword search to agentic navigation in the Global 2000. GEO is the next 'AdWords' moment.",
    image: "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Financial Flywheel",
    content: "High-margin SaaS with negative churn. As LLMs evolve, our infrastructure becomes the non-discretionary trust-layer for enterprise brand safety.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
  }
];

export function PitchDeckViewer() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = () => setCurrentSlide((s) => (s + 1) % SLIDES.length);
  const prev = () => setCurrentSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      id="pitch-deck-container"
      className={`${
        isFullscreen 
          ? 'fixed inset-0 z-[10000] rounded-0 bg-black' 
          : 'bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative'
      } overflow-hidden group transition-all duration-500`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${isFullscreen ? 'h-full w-full' : 'aspect-[16/9]'} relative overflow-hidden bg-zinc-950`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0"
          >
            <img 
              src={SLIDES[currentSlide].image} 
              alt={SLIDES[currentSlide].title}
              className="object-cover w-full h-full opacity-30"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent ${isFullscreen ? 'p-16 md:p-32' : 'p-6 md:p-12'} flex flex-col justify-end`}>
              <h4 className={`${isFullscreen ? 'text-4xl md:text-6xl mb-8' : 'text-xl md:text-4xl mb-4'} font-bold text-white tracking-tight leading-tight`}>{SLIDES[currentSlide].title}</h4>
              <p className={`${isFullscreen ? 'text-lg md:text-2xl max-w-4xl' : 'text-xs md:text-lg max-w-2xl'} text-zinc-300 leading-relaxed`}>{SLIDES[currentSlide].content}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Side Controls - Less Obstructive */}
        <button 
          onClick={prev}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-pink-500 text-white rounded-full transition-all z-30 backdrop-blur-sm ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={next}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-pink-500 text-white rounded-full transition-all z-30 backdrop-blur-sm ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

      {/* Slide Counter Overlay */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 transition-all rounded-full ${i === currentSlide ? 'w-8 bg-pink-500' : 'w-2 bg-zinc-700'}`}
            />
          ))}
        </div>
      </div>

      <div className={`${isFullscreen ? 'absolute bottom-0 left-0 right-0' : ''} p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900 shadow-xl z-50`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-lg hidden sm:block">
            <Maximize2 className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-xs md:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-none">Auspexi Series A Deck</span>
          <span className="text-[10px] md:text-xs font-mono text-zinc-500 ml-1">
            {currentSlide + 1} / {SLIDES.length}
          </span>
        </div>
        <div className="flex gap-2">
          {isFullscreen && (
            <button 
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 text-[10px] font-bold text-white transition-colors uppercase tracking-widest bg-pink-600 px-3 py-1.5 rounded-md"
            >
              Exit
            </button>
          )}
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest bg-zinc-800/50 px-3 py-1.5 rounded-md border border-zinc-700/50"
          >
            <ExternalLink className="w-3 h-3" /> {isFullscreen ? 'Restore' : 'Fullscreen'}
          </button>
        </div>
      </div>
    </div>
  );
}
