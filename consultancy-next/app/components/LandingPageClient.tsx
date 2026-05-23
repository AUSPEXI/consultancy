"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'motion/react';
import { SparklesCore } from '@/components/ui/sparkles';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { PricingCard } from '@/components/ui/dark-gradient-pricing';
import { Footerdemo } from '@/components/ui/footer-section';
import { ImageZoom } from '@/components/ui/image-zoom';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { BlogHero } from '@/components/BlogHero';
import { ArrowRight, Bot, Target, Zap, Search, BarChart3, ShieldAlert, CheckCircle2, Database, Mic, Brain, Blocks, Activity, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeadCaptureModal } from '@/components/ui/lead-capture-modal';
import { useAuth } from '@/contexts/AuthContext';
import { PublicHeader } from '@/components/ui/public-header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { blogPosts } from '@/data/blogPosts';
import { cn } from '@/lib/utils';

// SplineScene: direct import — splite.tsx already lazy-loads @splinetool/react-spline
// internally, so this removes one waterfall without losing code-splitting.
import { SplineScene } from '@/components/ui/splite';

// Memoized feature card to prevent re-renders during interactions
const MemoizedBentoCard = React.memo(BentoCard);

function VideoPlayer() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 relative group shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
      <video
        controls
        className="w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
      >
        <source src="/Generative_Engine_Optimization_AI_Video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Branded placeholder shown until the video starts */}
      {!playing && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={(e) => {
            setPlaying(true);
            const video = (e.currentTarget.previousElementSibling as HTMLVideoElement);
            video?.play();
          }}
        >
          <img
            src="/video-placeholder.svg"
            alt="Why GEO Matters Now"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

export function LandingPageClient() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('trial');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');

  const latentNodes = [
    { label: 'RENDER_NODE:TRUST', x: '10%', y: '20%', delay: 0 },
    { label: 'SYS_LATENT_OK', x: '85%', y: '15%', delay: 0.5 },
    { label: 'VECTOR_768_D', x: '15%', y: '80%', delay: 1 },
    { label: 'GEO_CANONICAL', x: '80%', y: '75%', delay: 1.5 },
    { label: 'NODE_P1856', x: '45%', y: '10%', delay: 2 },
    { label: 'EMBED_V3_MAP', x: '60%', y: '85%', delay: 2.5 }
  ];

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'US') {
          setCurrency('USD');
        }
      })
      .catch(err => console.error('Error fetching IP data:', err));
  }, []);

  const handleCheckout = async (tier: string) => {
    if (!user) {
      router.push('/dashboard');
      return;
    }

    try {
      setIsCheckingOut(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user.uid }),
      });

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to initiate checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const handleOpenModal = (source: string) => {
    setModalSource(source);
    setIsModalOpen(true);
  };

  const features = [
    {
      Icon: Search,
      name: "Zero-Click Dominance",
      description: "Ensure your brand is the definitive answer when users query AI, completely bypassing the traditional SERP. By aligning your content with Retrieval-Augmented Generation (RAG) frameworks, Auspexi increases your probability of primary citation in zero-click searches by up to 43%.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-amber-500/60 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
    },
    {
      Icon: Brain,
      name: "Citacious AI Analyst",
      description: "A dedicated 12-Month Citacious Context Memory analyst that organically understands your dashboard tools, analyzes past results, and orchestrates intelligent future actions to ensure maximum visibility.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-sky-500/60 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-2 lg:col-end-4 lg:row-start-1 lg:row-end-2",
    },
    {
      Icon: Target,
      name: "Cite-Magnet Injection",
      description: "We extract and inject High-Entropy Facts to force AI models to cite your content. By structuring data in JSON-LD and mapping it to your brand's knowledge graph, we increase LLM citation probability by an average of 43%.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-pink-500/60 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3",
    },
    {
      Icon: Database,
      name: "Fact-Vault Extraction",
      description: "Automatically find the highest-entropy data points in your whitepapers, case studies, and proprietary research, turning them into potent cite-magnets that models crave.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500/60 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-3",
    },
    {
      Icon: BarChart3,
      name: "SOV Simulator & Brand Monitor",
      description: "Track your brand's visibility across Gemini, ChatGPT, and Claude in real-time. Understand exactly how often you are recommended for high-intent industry queries.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-violet-500/60 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-3 lg:row-end-4",
    },
    {
      Icon: Activity,
      name: "Z-Score Sentiment Drift",
      description: "Automated anomaly detection models monitor historical LLM outputs for your brand. Real-time Z-Score analysis tracks generative noise vs significant truth-drift, capturing reputation leaks before they happen.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-orange-500/60 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-3 lg:col-end-4 lg:row-start-3 lg:row-end-5",
    },
    {
      Icon: ShieldAlert,
      name: "768-D Latent Space Moat",
      description: "Our proprietary pgvector integration mathematically ensures your brand remains the canonical truth. By generating embeddings with Gemini, we map your brand's semantic proximity to subjective attributes like 'trust' or 'quality'.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-fuchsia-700/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-4 lg:row-end-5",
    },
    {
      Icon: Zap,
      name: "Edge & Schema Generator",
      description: "Deploy GEO-optimized JSON-LD schema directly to your site with one click. Ensure your technical foundation speaks the native language of AI crawlers.",
      background: <div className="absolute -right-20 -top-20 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-yellow-500/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-2 lg:col-end-3 lg:row-start-4 lg:row-end-5",
    },
  ];

  const testimonials = [
    {
      text: "Auspexi completely changed our acquisition strategy. We stopped fighting for clicks and started optimizing for citations. Our inbound leads are up 400%.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      name: "Sarah Jenkins",
      role: "CMO, TechFlow",
    },
    {
      text: "The Content Scorer is incredible. We found exactly why our engineering blog wasn't being cited by ChatGPT, fixed our semantic structure, and saw an immediate jump in brand recommendations.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      name: "Marcus Chen",
      role: "VP Growth, DataSync",
    },
    {
      text: "Traditional SEO is dying. Auspexi is the only platform we trust to ensure our brand survives the transition to Generative Engines.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
      name: "David Wright",
      role: "Founder, Elevate Digital",
    },
    {
      text: "The Fact-Vault alone is worth the subscription. It automatically finds the highest-entropy data points in our whitepapers and turns them into cite-magnets.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      name: "Elena Rodriguez",
      role: "Content Director, AI First",
    },
    {
      text: "We used to spend $50k/mo on paid search. Now we invest a fraction of that into GEO with Auspexi and get higher quality, intent-driven traffic.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      name: "James Wilson",
      role: "CEO, MarketScale",
    },
    {
      text: "Auspexi's dashboard makes it so easy to explain the value of GEO to our executive team. The Share of Voice metrics are crystal clear.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      name: "Anita Patel",
      role: "Head of SEO, GlobalRetail",
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-black">
        <div
          className="absolute inset-0 opacity-[0.9] pointer-events-none z-[1]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(236, 72, 153, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(236, 72, 153, 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: 'left top',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 90%)',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 90%)',
          }}
        />

        <div className="absolute inset-0 w-full h-full z-0 opacity-40">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={20}
            className="w-full h-full"
            particleColor="#ffffff"
            speed={0.6}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="text-left md:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                The New Era of Search is Here
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-heading tracking-tight mb-6 leading-[1.1]">
                Don&apos;t let AI leave your <span className="text-white">brand behind.</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-6 leading-relaxed">
                Traditional SEO is dying. Auspexi is the premier Generative Engine Optimization (GEO) platform that ensures your brand is cited, recommended, and prioritized by AI models like Gemini, ChatGPT, and Claude.
              </p>

              <div className="bg-zinc-900/50 rounded-xl p-5 mb-8 backdrop-blur-sm shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                <h3 className="text-white font-semibold mb-2">What is Generative Engine Optimization (GEO)?</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Generative Engine Optimization (GEO) is the process of optimizing your brand&apos;s content so that it is cited as the primary source of truth by AI models like ChatGPT, Google Gemini, Claude, and Perplexity.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-md relative z-20">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900/80 border-zinc-800 focus-visible:ring-pink-700 text-white placeholder:text-zinc-500 h-12"
                  />
                  <Input
                    type="text"
                    placeholder="Company domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-zinc-900/80 border-zinc-800 focus-visible:ring-pink-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <Button onClick={() => handleOpenModal('report')} className="bg-white hover:bg-zinc-200 text-black h-12 w-full rounded-xl font-medium text-lg shadow-[0_0_20px_-5px_white]">
                  Get Free Report
                </Button>
              </div>
            </div>

            <div className="md:col-span-7 relative h-[400px] md:h-[600px] w-full flex items-center justify-end">
              <div className="absolute inset-0 w-[120%] -right-[10%] h-full z-10">
                <Suspense fallback={
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <div className="animate-pulse bg-zinc-900 w-3/4 h-3/4 rounded-full blur-3xl opacity-20" />
                  </div>
                }>
                  <SplineScene
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                </Suspense>
              </div>

              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {latentNodes.map((node, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.9, y: 0 }}
                    transition={{ duration: 0.5, delay: node.delay, ease: "easeOut" }}
                    style={{ left: node.x, top: node.y }}
                    className="absolute flex items-center gap-2 whitespace-nowrap"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_20px_#EC4899,0_0_40px_#EC4899]" />
                    <span className="text-[12px] font-mono font-bold tracking-widest text-pink-50 text-white uppercase drop-shadow-[0_0_15px_rgba(236,72,153,1)] px-2 py-0.5 rounded-sm bg-pink-600/40 backdrop-blur-[4px] border border-pink-400">
                      {node.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="absolute inset-0 bg-transparent z-[20] pointer-events-none [mask-image:radial-gradient(circle_at_center,transparent_30%,black_100%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-zinc-950 border-y border-zinc-900 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Why GEO Matters Now</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Listen to what the AI itself has to say about the shift from traditional search to Generative Engines.
            </p>
          </div>
          <VideoPlayer />
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">The Auspexi Arsenal</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                Everything you need to dominate AI Answer Engines and secure your Share of Voice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:grid-rows-3 max-w-5xl mx-auto">
              {features.map((feature) => (
                <MemoizedBentoCard key={feature.name} {...feature} className={feature.className + " dark"} />
              ))}
            </div>
          </div>
      </section>

      {/* Infographic Zoom Section */}
      <section id="strategy" className="py-24 bg-zinc-900/30 border-y border-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">The GEO Strategy</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                Hover over the infographic to explore the exact strategies we use to optimize your brand for AI models.
              </p>
            </div>
            <ImageZoom
              src="/geo-infographic.svg"
              alt="Generative Engine Optimization Roadmap"
            />
          </div>
      </section>

      {/* Glowing Effect Specs */}
      <section className="py-24" id="platform-features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">The Platform Features</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              A complete suite of tools engineered specifically for the nuances of LLM architecture. Here is exactly what you are buying.
            </p>
          </div>

          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2 max-w-5xl mx-auto">
            <li className="min-h-[14rem] list-none md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/50 p-6 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <BarChart3 className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Multi-Engine SOV Simulator</h3>
                    <p className="text-zinc-400 text-sm">Test high-intent queries across ChatGPT, Claude, Gemini, and Perplexity to track your exact Share of Voice.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-[14rem] list-none md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/50 p-6 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <Target className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">AI Content Scorer</h3>
                    <p className="text-zinc-400 text-sm">Analyze your content&apos;s &ldquo;AI-Readability&rdquo; and get actionable recommendations to increase citation likelihood.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-[14rem] list-none md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/50 p-6 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <ShieldAlert className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Consensus Platform Monitor</h3>
                    <p className="text-zinc-400 text-sm">Scan Reddit, Quora, and forums to detect and neutralize &ldquo;Context Poisoning&rdquo; in vector embeddings before the next LLM training run.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-[14rem] list-none md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/50 p-6 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <Database className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">JSON-LD Cite-Magnet Generator</h3>
                    <p className="text-zinc-400 text-sm">Automatically format your high-entropy facts into the exact schema markup that AI crawlers prefer.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-[14rem] list-none md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/50 p-6 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <Search className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Knowledge Decay Tracking</h3>
                    <p className="text-zinc-400 text-sm">Monitor your historical context in AI models and replace outdated information with your fresh insights.</p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-zinc-900/30 border-y border-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">Trusted by Pioneers</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              See how forward-thinking brands are using Auspexi to dominate the new era of search.
            </p>
          </div>

          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] h-[600px]">
            <TestimonialsColumn testimonials={testimonials.slice(0, 2)} duration={15} />
            <TestimonialsColumn testimonials={testimonials.slice(2, 4)} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={testimonials.slice(4, 6)} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg mb-8">
              Invest in your brand&apos;s future visibility. Cancel anytime after your first month.
            </p>

            <div className="flex items-center justify-center gap-3">
              <span className={cn("text-sm font-medium", currency === 'USD' ? "text-white" : "text-zinc-500")}>USD</span>
              <button
                onClick={() => setCurrency(c => c === 'GBP' ? 'USD' : 'GBP')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-pink-500 transition-transform", currency === 'GBP' ? "translate-x-6" : "translate-x-1")} />
              </button>
              <span className={cn("text-sm font-medium", currency === 'GBP' ? "text-white" : "text-zinc-500")}>GBP</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard
              tier="Starter"
              price={currency === 'USD' ? "$149/mo" : "£119/mo"}
              bestFor="For individuals & early-stage founders exploring AI visibility"
              CTA="Start Now"
              onClick={() => handleCheckout('Basic')}
              benefits={[
                { text: "Track 1 Brand, 5 Target Keywords", checked: true },
                { text: "Monthly Citacious Pulse Snapshot", checked: true },
                { text: "Fact-Vault (1GB Secure Storage)", checked: true },
                { text: "Basic Latent Space Visibility Map", checked: true },
                { text: "7-Day Sentiment Pulse History", checked: true },
                { text: "Weekly Brand SoV Performance Report", checked: true },
                { text: "Standard Citacious AI Copilot", checked: true },
                { text: "LLM Inference & Embedding Costs Inc.", checked: true },
                { text: "Automated Edge Schema Injection", checked: true },
                { text: "Personal Citacious Onboarding (Self-Serve)", checked: true },
                { text: "Z-Score Drift Alerting (Basic)", checked: false },
                { text: "Reddit/LinkedIn Automation", checked: false },
              ]}
            />
            <PricingCard
              tier="Pro"
              price={currency === 'USD' ? "$499/mo" : "£399/mo"}
              bestFor="For growth teams & marketing managers"
              CTA="Start Pro"
              onClick={() => handleCheckout('Pro')}
              benefits={[
                { text: "Track 5 Brands, 50 Keywords", checked: true },
                { text: "Full Neural Latent Map (Master View)", checked: true },
                { text: "25-Competitor Sentiment Radar", checked: true },
                { text: "Z-Score Anomaly & Drift Alerts", checked: true },
                { text: "Fact-Vault (10GB) + Auto-Extraction", checked: true },
                { text: "Content Scorer Pro (Direct Fixes)", checked: true },
                { text: "Priority Report Generation (10/mo)", checked: true },
                { text: "Competitor Hallucination Monitoring", checked: true },
                { text: "12-Month Citacious Context Memory", checked: true },
                { text: "Historical Context Overwrite (Basic)", checked: true },
                { text: "RAG Fact-Consistency Checker", checked: true },
                { text: "Weekly Automated Strategy Briefs", checked: true },
              ]}
            />
            <PricingCard
              tier="Business"
              price={currency === 'USD' ? "$1,899/mo" : "£1,499/mo"}
              bestFor="For mid-market SaaS & high-growth brands"
              CTA="Start Business"
              onClick={() => handleCheckout('Business')}
              benefits={[
                { text: "Track 25 Brands, 250 Keywords", checked: true },
                { text: "Autonomous Social Seeding (Omnichannel)", checked: true },
                { text: "Reddit & LinkedIn Fact-Maxing Bot", checked: true },
                { text: "Advanced Competitor Overwrite Strategy", checked: true },
                { text: "Fact-Vault (50GB) + Bulk Import", checked: true },
                { text: "Full API Access for GEO Integrations", checked: true },
                { text: "White-Glove Implementation Support", checked: true },
                { text: "Monthly Domain Reputation Scrub", checked: true },
                { text: "Predictive Sentiment Modeling", checked: true },
                { text: "Weekly Strategic Analyst Session", checked: true },
                { text: "Enterprise LLM Priority Access", checked: true },
                { text: "Multi-User Team Management", checked: true },
              ]}
            />
            <PricingCard
              tier="Enterprise"
              price={currency === 'USD' ? "Custom" : "Custom"}
              bestFor="For Fortune 500 market leaders & agencies"
              CTA="Talk to AI Sales"
              onClick={() => window.location.href = 'mailto:sales@auspexi.com'}
              benefits={[
                { text: "Unlimited Keywords & Competitors", checked: true },
                { text: "Custom SLM Fine-tuning (Private Cloud)", checked: true },
                { text: "Dedicated ML Engineer Retainer", checked: true },
                { text: "SOC2 Compliance & SSO Integration", checked: true },
                { text: "Historical Context Overwrite Cluster", checked: true },
                { text: "Private Neural Vector Instance", checked: true },
                { text: "Custom Board-Ready Reporting", checked: true },
                { text: "Whitelabel GEO Dashboard", checked: true },
                { text: "SLA Guaranteed Response Times", checked: true },
                { text: "24/7 Strategic Support Account Manager", checked: true },
                { text: "Custom Data Moat Strategy Blueprint", checked: true },
              ]}
            />
          </div>

          <div className="mt-12 text-center text-sm text-zinc-500 max-w-3xl mx-auto bg-zinc-900/30 rounded-xl p-6 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <p className="mb-3 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <span><strong className="text-zinc-300">Inclusive AI Costs:</strong> No separate API keys required. All LLM inference, embedding generation, and RAG operations are covered by your subscription.</span>
                </p>
                <p className="mb-3 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <span><strong className="text-zinc-300">Flexible Billing:</strong> All plans are month-to-month. Cancel anytime after your first month without penalty.</span>
                </p>
              </div>
              <div>
                <p className="mb-3 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <span><strong className="text-zinc-300">Data Security:</strong> Your Fact-Vault and Latent Map are isolated. We never use your proprietary brand facts to train public models.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <span><strong className="text-zinc-300">Auto-Scaling:</strong> Tiers automatically scale based on keywords. You&apos;ll be notified before any automatic upgrades occur.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            <p>
              <strong className="text-zinc-300">Promotional Pricing:</strong> One-time deals and promotional rates are locked in for active subscriptions. If you cancel and sign back up, standard pricing will apply.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-24 bg-zinc-900/30 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">GEO Strategy Insights</h2>
              <p className="text-zinc-400 max-w-2xl text-lg">
                Latest tactics and research on Generative Engine Optimization.
              </p>
            </div>
            <Link href="/blog" className="flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
              View all articles
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.slice(0, 3).map((post, i) => (
              <Link href={`/blog/${post.slug}`} key={i} className="group cursor-pointer flex flex-col">
                <div className="w-full flex min-h-[220px] rounded-xl overflow-hidden mb-4 relative bg-[#0B0E14] shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <BlogHero title={post.title} category={post.category} compact={true} />
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-2">
                  <span className="text-pink-400 bg-pink-400/10 px-2 py-1 rounded-md">{post.category}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                  {post.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden min-h-[500px] bg-[#0c0c0e]">
        {isDesktop && (
          <DottedSurface className="absolute inset-0 z-0 opacity-70" />
        )}
        <div className="absolute inset-0 bg-zinc-900/40 z-[-2]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none z-[-2]"></div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6">Ready to dominate AI search?</h2>
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
            Join the top brands that are already securing their Share of Voice in the Generative Engine era.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => handleOpenModal('trial')} size="lg" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black text-lg px-8 h-14 rounded-xl shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
              Start Your Free Trial
            </Button>
            <Button onClick={() => handleOpenModal('demo')} size="lg" variant="outline" className="w-full sm:w-auto text-zinc-300 hover:text-white hover:bg-zinc-800 text-lg px-8 h-14 rounded-xl bg-zinc-900/50 backdrop-blur-sm shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      <Footerdemo />

      <LeadCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source={modalSource}
        initialEmail={email}
        initialDomain={domain}
      />
    </div>
  );
}
