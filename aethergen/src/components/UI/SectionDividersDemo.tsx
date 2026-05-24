import React, { useEffect, useRef } from 'react';
import SectionDivider from './SectionDivider';

const SectionDividersDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match Stripe's approach
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Liquid morphing class - much more subtle and organic
    class LiquidMorph {
      x: number;
      y: number;
      radius: number;
      color: string;
      morphSpeed: number;
      morphAngle: number;
      scale: number;
      opacity: number;
      driftX: number;
      driftY: number;

      constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.morphSpeed = Math.random() * 0.002 + 0.001; // Very slow morphing
        this.morphAngle = Math.random() * Math.PI * 2;
        this.scale = 1;
        this.opacity = 0.3 + Math.random() * 0.2; // Very subtle opacity
        this.driftX = (Math.random() - 0.5) * 0.3; // Minimal drift
        this.driftY = (Math.random() - 0.5) * 0.2;
      }

      update(time: number) {
        // Very slow, subtle morphing
        this.morphAngle += this.morphSpeed;
        
        // Minimal movement - barely perceptible
        this.x += this.driftX;
        this.y += this.driftY;
        
        // Very subtle scale variation
        this.scale = 1 + Math.sin(time * 0.00005 + this.morphAngle) * 0.02;
      }

      draw(ctx: CanvasRenderingContext2D, time: number) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Use screen blend mode like Stripe
        ctx.globalCompositeOperation = 'screen';

        // Create organic, flowing shape with many control points
        ctx.beginPath();
        const points = 24; // More points for smoother curves
        
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const morph = Math.sin(this.morphAngle + angle * 4) * 8; // Subtle morphing
          const radius = this.radius + morph;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Use bezier curves for ultra-smooth shapes
            const prevAngle = ((i - 1) / points) * Math.PI * 2;
            const prevMorph = Math.sin(this.morphAngle + prevAngle * 4) * 8;
            const prevRadius = this.radius + prevMorph;
            const prevX = Math.cos(prevAngle) * prevRadius;
            const prevY = Math.sin(prevAngle) * prevRadius;

            // Calculate control points for smooth curves
            const cp1x = prevX + (x - prevX) * 0.5;
            const cp1y = prevY + (y - prevY) * 0.5;
            const cp2x = x - (x - prevX) * 0.5;
            const cp2y = y - (y - prevY) * 0.5;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
          }
        }
        ctx.closePath();

        // Create radial gradient for depth
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.6, this.color.replace('1)', '0.4)'));
        gradient.addColorStop(1, this.color.replace('1)', '0.0)'));
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }
    }

    // Create morphing shapes with our cosmic palette - much fewer and larger
    const morphs: LiquidMorph[] = [
      // Deep blue - positioned like Stripe's main gradient
      new LiquidMorph(canvas.width * 0.3, canvas.height * 0.4, 120, 'rgba(30, 58, 138, 1)'),
      // Blue-purple - subtle accent
      new LiquidMorph(canvas.width * 0.7, canvas.height * 0.3, 100, 'rgba(67, 56, 202, 1)'),
      // Purple - deep background
      new LiquidMorph(canvas.width * 0.5, canvas.height * 0.6, 140, 'rgba(109, 40, 217, 1)'),
      // Amber/gold - very subtle light effect
      new LiquidMorph(canvas.width * 0.8, canvas.height * 0.2, 80, 'rgba(245, 158, 11, 0.8)'),
    ];

    // Animation loop - much more subtle
    let animationId: number;
    const animate = (time: number) => {
      // Clear with very dark background like Stripe
      ctx.fillStyle = 'rgb(10, 36, 64)'; // Very dark blue
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(30, 58, 138, 0.05)'); // Very subtle blue
      gradient.addColorStop(0.5, 'rgba(67, 56, 202, 0.03)'); // Very subtle purple
      gradient.addColorStop(1, 'rgba(10, 36, 64, 0.05)'); // Very subtle dark
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw morphs
      morphs.forEach(morph => {
        morph.update(time);
        morph.draw(ctx, time);
      });

      // Add very subtle golden light rays - barely visible
      ctx.save();
      ctx.globalAlpha = 0.02; // Extremely subtle
      ctx.fillStyle = 'rgba(245, 158, 11, 1)';
      
      for (let i = 0; i < 2; i++) { // Fewer rays
        const angle = (time * 0.00002 + i * Math.PI) % (Math.PI * 2); // Very slow rotation
        const x = canvas.width / 2 + Math.cos(angle) * canvas.width * 0.3;
        const y = canvas.height / 2 + Math.sin(angle) * canvas.height * 0.3;
        
        const rayGradient = ctx.createRadialGradient(x, y, 0, x, y, 200);
        rayGradient.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
        rayGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        
        ctx.fillStyle = rayGradient;
        ctx.beginPath();
        ctx.arc(x, y, 200, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Liquid Morphing Hero Section - Stripe Style */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        {/* Canvas Background Layer - Like Stripe */}
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ 
              zIndex: 1,
              filter: 'blur(0.5px)' // Very subtle blur for smoothness
            }}
          />
        </div>
        
        {/* Content Overlay - Like Stripe's structure */}
        <div className="relative z-10 py-20">
          <div className="max-w-6xl mx-auto px-4">
            {/* Two-column layout like Stripe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Text */}
              <div className="space-y-8">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-blue-100 to-amber-100 bg-clip-text text-transparent">
                  Liquid Morphing Hero
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Stripe-style cosmic liquid effect with our branded color palette. 
                  Calming, undulating lava lamp aesthetic.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                    Get Started
                  </button>
                  <button className="border border-white/20 text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-full transition-all duration-300">
                    Learn More
                  </button>
                </div>
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-100">60fps liquid morphing active</span>
                </div>
              </div>
              
              {/* Right Column - Placeholder for future graphic */}
              <div className="hidden lg:block">
                <div className="w-full h-96 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <div className="text-4xl mb-4">🎨</div>
                    <p>Future graphic content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Integrated Wave Divider */}
        <SectionDivider variant="wave" direction="down" fillColor="#f8fafc" />
      </section>

      {/* White Content Section */}
      <section className="bg-white text-slate-900">
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">White Section</h2>
            <p className="text-xl text-slate-600">Better readability for detailed content</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Feature One</h3>
                <p className="text-slate-600">Description of the first feature</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Feature Two</h3>
                <p className="text-slate-600">Description of the second feature</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Feature Three</h3>
                <p className="text-slate-600">Description of the third feature</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Blue Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <SectionDivider variant="curve" direction="up" fillColor="#ffffff" />
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Back to Blue</h2>
            <p className="text-xl text-blue-100 mb-8">CTA sections work great in blue</p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              Call to Action
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SectionDividersDemo;