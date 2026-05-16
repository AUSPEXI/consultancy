import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const next = () => setCurrentSlide((s) => (s + 1) % SLIDES.length);
  const prev = () => setCurrentSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative group">
      <div className="aspect-[16/9] relative overflow-hidden">
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
              className="object-cover w-full h-full opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent p-8 flex flex-col justify-end">
              <h4 className="text-2xl font-bold text-white mb-2">{SLIDES[currentSlide].title}</h4>
              <p className="text-zinc-400 text-sm max-w-lg">{SLIDES[currentSlide].content}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
          <button 
            onClick={prev}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-zinc-500">
            {currentSlide + 1} / {SLIDES.length}
          </span>
          <button 
            onClick={next}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Maximize2 className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-sm font-medium text-white">Auspexi Series A Deck</span>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors">
          <ExternalLink className="w-3 h-3" /> FULLSCREEN_MODE
        </button>
      </div>
    </div>
  );
}
