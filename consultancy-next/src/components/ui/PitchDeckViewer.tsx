'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, ExternalLink, X } from 'lucide-react';

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
    content: "Using Gemini's native embedding dimensions and pgvector, we build a proprietary coordinate map of your brand perception (a moat that deepens with every audit).",
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = () => setCurrentSlide((s) => (s + 1) % SLIDES.length);
  const prev = () => setCurrentSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);

  const slideContent = (
    <>
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
          {/* Text padded away from both arrows (64px sides) and dot bar (96px bottom) */}
          <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent flex flex-col justify-end ${isFullscreen ? 'px-16 pb-20 pt-8 md:px-32 md:pb-32 md:pt-16' : 'px-16 pb-24 pt-4 md:px-16 md:pb-20 md:pt-6'}`}>
            <h4 className={`font-bold text-white tracking-tight leading-tight ${isFullscreen ? 'text-3xl md:text-6xl mb-4 md:mb-8' : 'text-base md:text-3xl mb-2 md:mb-3'}`}>
              {SLIDES[currentSlide].title}
            </h4>
            <p className={`text-zinc-300 leading-relaxed ${isFullscreen ? 'text-base md:text-2xl max-w-4xl' : 'text-xs md:text-base max-w-2xl line-clamp-3 md:line-clamp-none'}`}>
              {SLIDES[currentSlide].content}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev — always visible, clear of text */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/60 hover:bg-pink-500 text-white rounded-full transition-colors z-30 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Next — always visible */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/60 hover:bg-pink-500 text-white rounded-full transition-colors z-30 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-8 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-none">
        {SLIDES.map((_, i) => (
          <div key={i} className={`h-1 transition-all rounded-full ${i === currentSlide ? 'w-8 bg-pink-500' : 'w-2 bg-zinc-700'}`} />
        ))}
      </div>
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black overflow-hidden">
        <div className="relative w-full h-full">
          {slideContent}
          {/* Fullscreen footer bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-zinc-900/80 backdrop-blur-sm z-50 border-t border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg hidden sm:block">
                <Maximize2 className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-sm font-medium text-white">L8EntSpace Series A Deck</span>
              <span className="text-xs font-mono text-zinc-500">{currentSlide + 1} / {SLIDES.length}</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 text-[10px] font-bold text-white transition-colors uppercase tracking-widest bg-pink-600 hover:bg-pink-500 px-3 py-1.5 rounded-md"
            >
              <X className="w-3 h-3" /> Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Slide viewport */}
      <div className="aspect-[16/9] relative overflow-hidden bg-zinc-950">
        {slideContent}
      </div>

      {/* Footer bar */}
      <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-lg hidden sm:block">
            <Maximize2 className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-xs md:text-sm font-medium text-white">L8EntSpace Series A Deck</span>
          <span className="text-[10px] md:text-xs font-mono text-zinc-500 ml-1">{currentSlide + 1} / {SLIDES.length}</span>
        </div>
        <button
          onClick={() => setIsFullscreen(true)}
          className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest bg-zinc-800/50 px-3 py-1.5 rounded-md border border-zinc-700/50"
        >
          <ExternalLink className="w-3 h-3" /> Fullscreen
        </button>
      </div>
    </div>
  );
}
