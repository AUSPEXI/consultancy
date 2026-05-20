import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LeadCaptureSection } from '@/components/sections/LeadCaptureSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { PricingSection } from '@/components/sections/PricingSection'
import { CTASection } from '@/components/sections/CTASection'
import { Footer } from '@/components/sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Auspexi
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition">
              Features
            </a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition">
              Pricing
            </a>
            <Link href="/blog" className="text-sm text-zinc-400 hover:text-white transition">
              Blog
            </Link>
          </nav>
          <Link href="/dashboard">
            <Button className="bg-white text-black hover:bg-zinc-200 h-10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - Server Rendered */}
      <section className="relative py-32 lg:py-48 px-6 overflow-hidden bg-black">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="text-left">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
                The New Era of Search is Here
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
                Don't let AI leave your{' '}
                <span className="text-white bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">
                  brand behind.
                </span>
              </h1>

              <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
                Traditional SEO is dying. Auspexi is the premier Generative Engine Optimization (GEO)
                platform that ensures your brand is cited, recommended, and prioritized by AI models
                like Gemini, ChatGPT, and Claude.
              </p>

              {/* Info Box */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 backdrop-blur-sm">
                <h3 className="text-white font-semibold mb-2">What is GEO?</h3>
                <p className="text-sm text-zinc-300">
                  Generative Engine Optimization (GEO) is the process of optimizing your brand's
                  content so that it is cited as the primary source of truth by AI models like ChatGPT,
                  Google Gemini, Perplexity, and other LLMs.
                </p>
              </div>

              {/* Lead Capture */}
              <LeadCaptureSection />
            </div>

            {/* Right Column - Placeholder for 3D viz */}
            <div className="relative h-[400px] lg:h-[600px] bg-gradient-to-br from-pink-500/10 to-transparent rounded-2xl border border-zinc-800 flex items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-500 text-sm">3D Latent Space Visualization</p>
                <p className="text-zinc-600 text-xs mt-2">(Coming from Vite components)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Suspense fallback={<div className="h-96 bg-zinc-900/50" />}>
        <FeaturesSection />
      </Suspense>

      {/* Pricing Section */}
      <Suspense fallback={<div className="h-96 bg-zinc-900/50" />}>
        <PricingSection />
      </Suspense>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
