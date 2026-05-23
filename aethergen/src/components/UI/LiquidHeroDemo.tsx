import React from 'react';
import { Rocket, Brain, Shield, Zap, Eye } from 'lucide-react';

const LiquidHeroDemo: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes liquid-morph {
            0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
            25% { transform: scale(1.05) rotate(1deg); filter: hue-rotate(15deg); }
            50% { transform: scale(1.1) rotate(-1deg); filter: hue-rotate(30deg); }
            75% { transform: scale(1.05) rotate(1deg); filter: hue-rotate(15deg); }
          }
          
          @keyframes undulate-slow {
            0%, 100% { transform: translateX(0) scaleY(1); }
            50% { transform: translateX(20px) scaleY(1.1); }
          }
          
          @keyframes undulate-medium {
            0%, 100% { transform: translateX(0) scaleY(1); }
            50% { transform: translateX(-15px) scaleY(0.9); }
          }
          
          @keyframes undulate-fast {
            0%, 100% { transform: translateX(0) scaleY(1); }
            50% { transform: translateX(10px) scaleY(1.05); }
          }
          
          .animate-fade-in { animation: fade-in 1s ease-out forwards !important; }
          .animate-liquid-morph { animation: liquid-morph 8s ease-in-out infinite !important; }
          .animate-undulate-slow { animation: undulate-slow 8s ease-in-out infinite !important; }
          .animate-undulate-medium { animation: undulate-medium 6s ease-in-out infinite !important; }
          .animate-undulate-fast { animation: undulate-fast 4s ease-in-out infinite !important; }
          
          .liquid-layer {
            will-change: transform, filter, opacity !important;
            transform-style: preserve-3d !important;
            backface-visibility: hidden !important;
          }
        `}
      </style>
      
      <div className="min-h-screen">
        {/* Liquid Morphing Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
          {/* Multiple Liquid Layers */}
          <div className="absolute inset-0">
            {/* Base Layer - Deep Space Blue */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
            
            {/* Liquid Layer 1 - Royal Blue Morphing */}
            <div className="absolute inset-0 opacity-60 liquid-layer">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-600 to-purple-700 animate-liquid-morph"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/30 to-transparent animate-undulate-slow"></div>
            </div>
            
            {/* Liquid Layer 2 - Purple Undulations */}
            <div className="absolute inset-0 opacity-40 liquid-layer">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-700 animate-liquid-morph" style={{ animationDelay: '1s' }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/20 to-transparent animate-undulate-medium"></div>
            </div>
            
            {/* Liquid Layer 3 - Golden Highlights */}
            <div className="absolute inset-0 opacity-30 liquid-layer">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 animate-liquid-morph" style={{ animationDelay: '2s' }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-400/15 to-transparent animate-undulate-fast"></div>
            </div>
            
            {/* Undulating Wave Effects */}
            <div className="absolute inset-0">
              {/* Wave 1 - Slow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 liquid-layer animate-undulate-slow"></div>
              
              {/* Wave 2 - Medium */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/15 via-blue-600/15 to-purple-600/15 liquid-layer animate-undulate-medium"></div>
              
              {/* Wave 3 - Fast */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 liquid-layer animate-undulate-fast"></div>
            </div>
          </div>
          
          {/* Content Overlay */}
          <div className="relative z-10 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                Cosmic Liquid Hero
              </h1>
              <p className="text-xl text-blue-100 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                Stripe-inspired liquid morphing with our cosmic color palette
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '1s' }}>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-500">
                  <Rocket className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-bounce" style={{ animationDelay: '1.5s' }} />
                  <h3 className="text-lg font-bold text-white">Deep Space Blue</h3>
                  <p className="text-blue-200 text-sm">Our signature slate-900 foundation</p>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-500">
                  <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-bounce" style={{ animationDelay: '2s' }} />
                  <h3 className="text-lg font-bold text-white">Mystical Purple</h3>
                  <p className="text-purple-200 text-sm">Innovation and quantum breakthroughs</p>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-500">
                  <Shield className="h-12 w-12 text-amber-400 mx-auto mb-4 animate-bounce" style={{ animationDelay: '2.5s' }} />
                  <h3 className="text-lg font-bold text-white">Golden Innovation</h3>
                  <p className="text-amber-200 text-sm">Eye of Horus mathematical brilliance</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Liquid Morphing Bottom Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-32">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 via-purple-600/30 to-transparent animate-undulate-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 via-amber-500/20 to-transparent animate-undulate-medium" style={{ animationDelay: '1s' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 via-blue-500/10 to-transparent animate-undulate-fast" style={{ animationDelay: '2s' }}></div>
          </div>
        </section>

        {/* White Content Section */}
        <section className="bg-white text-slate-900 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Liquid Morphing Technology
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              This hero section demonstrates the power of CSS animations and multiple layers
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-lg">
                <Zap className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Multiple Layers</h3>
                <p className="text-slate-600 text-sm">
                  Different opacity and animation speeds create depth and movement
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-lg">
                <Eye className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cosmic Palette</h3>
                <p className="text-slate-600 text-sm">
                  Blue, purple, and gold create our signature Aethergen aesthetic
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LiquidHeroDemo;


