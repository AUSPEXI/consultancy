import React, { useState, useEffect } from 'react';
import { SparklesCore } from '@/components/ui/sparkles';
import { SplineScene } from '@/components/ui/splite';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { PricingCard } from '@/components/ui/dark-gradient-pricing';
import { Footerdemo } from '@/components/ui/footer-section';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';
import { ImageZoom } from '@/components/ui/image-zoom';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { ArrowRight, Bot, Target, Zap, Search, BarChart3, ShieldAlert, CheckCircle2, Database, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeadCaptureModal } from '@/components/ui/lead-capture-modal';
import { useAuth } from '@/contexts/AuthContext';
import { PublicHeader } from '@/components/ui/public-header';
import { Link, useLocation } from 'react-router-dom';
import { blogPosts } from './BlogPage';

export function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('trial');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async (tier: string) => {
    if (!user) {
      onLoginClick();
      return;
    }

    try {
      setIsCheckingOut(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          userId: user.uid,
        }),
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
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
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
      href: "#",
      cta: "Learn more",
      background: <div className="absolute -right-20 -top-20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-indigo-500/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
    },
    {
      Icon: Target,
      name: "Cite-Magnet Injection",
      description: "We extract and inject High-Entropy Facts to force AI models to cite your content. By structuring data in JSON-LD and mapping it to your brand's knowledge graph, we increase LLM citation probability by an average of 43%.",
      href: "#",
      cta: "See how it works",
      background: <div className="absolute -right-20 -top-20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-emerald-500/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
    },
    {
      Icon: ShieldAlert,
      name: "Trojan Horse Strategy",
      description: "Identify competitor data decay and replace their stale answers with your fresh insights. Capitalize on the typical 6-12 month lag in LLM training data updates by feeding real-time JSON-LD corrections directly to AI crawlers.",
      href: "#",
      cta: "Analyze competitors",
      background: <div className="absolute -right-20 -top-20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-rose-500/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
    },
    {
      Icon: BarChart3,
      name: "Share of Voice Analytics",
      description: "Track your brand's visibility across Gemini, ChatGPT, and Claude in real-time. Understand exactly how often you are recommended versus your competitors.",
      href: "#",
      cta: "View dashboard",
      background: <div className="absolute -right-20 -top-20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-cyan-500/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
    },
    {
      Icon: Zap,
      name: "Automated Schema",
      description: "Deploy GEO-optimized JSON-LD schema directly to your site with one click. Ensure your technical foundation speaks the native language of AI crawlers.",
      href: "#",
      cta: "Get started",
      background: <div className="absolute -right-20 -top-20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-amber-500/50 w-64 h-64 rounded-full blur-3xl" />,
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
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
      text: "The Trojan Horse feature is incredible. We identified exactly where our biggest competitor was decaying in ChatGPT's memory and replaced them within weeks.",
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
      {/* Navigation */}
      <PublicHeader onLoginClick={onLoginClick} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={50}
            className="w-full h-full"
            particleColor="#ffffff"
            speed={1}
          />
          <div className="absolute inset-0 bg-zinc-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="text-left md:col-span-5">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                </span>
                The New Era of Search is Here
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-heading tracking-tight mb-6 leading-[1.1]">
                Don't let AI leave your <span className="text-white">brand behind.</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-6 leading-relaxed">
                Traditional SEO is dying. Auspexi is the premier Generative Engine Optimization (GEO) platform that ensures your brand is cited, recommended, and prioritized by AI models like Gemini, ChatGPT, and Claude.
              </p>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-8">
                <h3 className="text-white font-semibold mb-2">What is Generative Engine Optimization (GEO)?</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Generative Engine Optimization (GEO) is the process of optimizing your brand's content so that it is cited as the primary source of truth by AI models like ChatGPT, Google Gemini, Claude, and Perplexity. Unlike traditional SEO which focuses on ranking links on a search engine results page, GEO focuses on ensuring your facts and data are the ones the AI chooses to synthesize into its direct answers.
                </p>
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-md">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    type="email" 
                    placeholder="Enter your work email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                  <Input 
                    type="text" 
                    placeholder="Company domain" 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <Button onClick={() => handleOpenModal('report')} className="bg-white hover:bg-zinc-200 text-black h-12 w-full rounded-xl font-medium text-lg">
                  Get Free Report
                </Button>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-7 relative h-[400px] md:h-[600px] w-full flex items-center justify-end hidden md:flex">
              <div className="absolute inset-0 w-[120%] -right-[10%] h-full">
                {isDesktop && (
                  <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                )}
              </div>
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
          <div className="aspect-video rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 relative group">
            <video 
              controls 
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop"
            >
              <source src="/Generative_Engine_Optimization_AI_Video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">The Auspexi Arsenal</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Everything you need to dominate the AI latent space and secure your Share of Voice.
            </p>
          </div>
          
          <BentoGrid className="lg:grid-rows-3 max-w-5xl mx-auto">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} className={feature.className + " dark"} />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Infographic Zoom Section */}
      <section id="roadmap" className="py-24 bg-zinc-900/30 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">The GEO Roadmap</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Hover over the infographic to explore the exact strategies we use to optimize your brand for AI models.
            </p>
          </div>
          
          <ImageZoom 
            src="/geo-infographic.png" 
            alt="Generative Engine Optimization Roadmap" 
          />
        </div>
      </section>

      {/* Glowing Effect Specs */}
      <section className="py-24">
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
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
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
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <Target className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">AI Content Scorer</h3>
                    <p className="text-zinc-400 text-sm">Analyze your content's "AI-Readability" and get actionable recommendations to increase citation likelihood.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-[14rem] list-none md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <ShieldAlert className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Consensus Platform Monitor</h3>
                    <p className="text-zinc-400 text-sm">Scan Reddit, Quora, and forums to detect and neutralize "Context Poisoning" in vector embeddings before the next LLM training run.</p>
                  </div>
                </div>
              </div>
            </li>
            <li className="min-h-[14rem] list-none md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]">
              <div className="relative h-full rounded-[1.25rem] border border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3 bg-zinc-950">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
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
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                      <Search className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Competitor Decay Tracking</h3>
                    <p className="text-zinc-400 text-sm">Monitor your competitors' outdated information in AI models and replace it with your fresh insights.</p>
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

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-zinc-950 border-y border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-lg">
              Everything you need to know about Auspexi and GEO.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">What is Generative Engine Optimization (GEO)?</h3>
              <p className="text-zinc-400">
                GEO is the evolution of SEO. Instead of optimizing for blue links on Google, GEO optimizes your brand to be the definitive answer inside AI models like ChatGPT, Claude, Gemini, and Perplexity. It's about securing your "Share of Voice" in the AI latent space.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Why do I need GEO if I already do SEO?</h3>
              <p className="text-zinc-400">
                AI search engines don't rank pages the way Google does. They synthesize answers based on "High-Entropy Facts" and semantic relevance. Traditional SEO tactics (like keyword stuffing or backlinks) don't guarantee AI citations. Auspexi bridges this gap by structuring your data exactly how LLMs prefer to consume it.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">What exactly am I buying?</h3>
              <p className="text-zinc-400">
                You are getting access to a proprietary suite of Generative Engine Optimization (GEO) tools. This includes our Multi-Engine SOV Simulator to track your brand across AI models, our Content Scorer to ensure your text is AI-readable, our JSON-LD Cite-Magnet Generator to inject high-entropy facts into your site's code, and our Consensus Platform Monitor to defend your brand against negative AI context poisoning.
              </p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">How does the billing work? Can I cancel?</h3>
              <p className="text-zinc-400">
                Yes, our subscriptions are month-to-month. You can cancel anytime after your first month's subscription. There are no long-term lock-ins unless you choose an annual plan.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">What happens if I cancel a special or one-time deal?</h3>
              <p className="text-zinc-400">
                If you secure a discounted rate, lifetime deal, or special promotional pricing, that rate is locked in for as long as your subscription remains active. If you decide to cancel and sign back up later, you will be subject to the standard, full subscription pricing available at that time.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">How quickly will I see results?</h3>
              <p className="text-zinc-400">
                Unlike traditional SEO which can take 6-12 months, GEO results can often be seen much faster. When you inject Cite-Magnets and update your JSON-LD schema, AI models can pick up these high-entropy facts during their next crawl or training run, often resulting in increased Share of Voice within weeks.
              </p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Do I need technical knowledge to use this?</h3>
              <p className="text-zinc-400">
                No. We've abstracted the complex AI engineering into simple, actionable tools. Our JSON-LD generator creates the exact code you need to copy-paste into your website, and our Content Scorer tells you exactly what to change in plain English.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Invest in your brand's future visibility. Cancel anytime after your first month.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              tier="Basic"
              price="$499/mo"
              bestFor="For startups establishing AI presence"
              CTA="Start Basic"
              onClick={() => handleCheckout('Basic')}
              benefits={[
                { text: "Monthly AI SOV Report", checked: true },
                { text: "JS Pixel (Client-Side)", checked: true },
                { text: "10 Facts Extracted / mo", checked: true },
                { text: "AI 'To-Do' List", checked: true },
                { text: "Standard Analytics", checked: true },
                { text: "No Off-Page Seeding", checked: false },
              ]}
            />
            <PricingCard
              tier="Medium"
              price="$1,499/mo"
              bestFor="For growing brands dominating niches"
              CTA="Start Medium"
              onClick={() => handleCheckout('Medium')}
              benefits={[
                { text: "Weekly AI SOV + Competitor Decay", checked: true },
                { text: "JS Pixel + Semantic HTML Fixes", checked: true },
                { text: "50 Facts Extracted / mo", checked: true },
                { text: "4 Data-Style Posts / mo", checked: true },
                { text: "Dark AI Traffic Tracking", checked: true },
                { text: "Reddit/Quora Seeding", checked: true },
              ]}
            />
            <PricingCard
              tier="Premium"
              price="$4,999/mo"
              bestFor="For enterprise market leaders"
              CTA="Talk to AI Sales"
              onClick={() => window.location.href = '/voice-agents'}
              benefits={[
                { text: "Real-Time Dashboard", checked: true },
                { text: "Edge SEO (Cloudflare Server-Side)", checked: true },
                { text: "Unlimited Facts + CMS Auto-Sync", checked: true },
                { text: "Daily Posts + Info Cliffhangers", checked: true },
                { text: "Full Prompt-to-Conversion Pipeline", checked: true },
                { text: "Active 'Trojan Horse' Overwrites", checked: true },
              ]}
            />
          </div>

          <div className="mt-12 text-center text-sm text-zinc-500 max-w-2xl mx-auto bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
            <p className="mb-3">
              <strong className="text-zinc-300">Flexible Billing:</strong> All plans are month-to-month. You can cancel anytime after your first month's subscription. No long-term contracts.
            </p>
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
            <Link to="/blog" className="flex items-center justify-center border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View all articles
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.slice(0, 3).map((post, i) => (
              <Link to={`/blog/${post.slug}`} key={i} className="group cursor-pointer flex flex-col">
                <div className="aspect-[16/9] rounded-xl overflow-hidden mb-4 border border-zinc-800">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-2">
                  <span className="text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">{post.category}</span>
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
      <section className="py-32 relative overflow-hidden">
        {isDesktop && <DottedSurface className="absolute inset-0 z-0 opacity-50" />}
        <div className="absolute inset-0 bg-zinc-800/10 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6">Ready to dominate AI search?</h2>
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
            Join the top brands that are already securing their Share of Voice in the Generative Engine era.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => handleOpenModal('trial')} size="lg" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black text-lg px-8 h-14 rounded-xl">
              Start Your Free Trial
            </Button>
            <Button onClick={() => handleOpenModal('demo')} size="lg" variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-lg px-8 h-14 rounded-xl bg-zinc-900/50 backdrop-blur-sm">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footerdemo />

      <LeadCaptureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        source={modalSource} 
      />
    </div>
  );
}
