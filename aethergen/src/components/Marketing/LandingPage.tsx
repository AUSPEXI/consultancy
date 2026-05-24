import React from 'react';
import { Rocket, ShieldCheck, PiggyBank, Database, Sparkles, Boxes, Mail, ArrowRightCircle, Cpu, Cog, Gem, Shield } from 'lucide-react';

const CTAButton: React.FC<{ label: string; tab?: 'pricing' | 'resources' | 'account'; variant?: 'primary' | 'secondary' }>=({ label, tab, variant='primary' })=> (
  <button
    onClick={() => tab && window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab } }))}
    className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-colors ${
      variant==='primary' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
    }`}
  >{label}</button>
);

// Divider variations
const DividerWave: React.FC = () => (
  <div className="w-full mx-auto my-10 flex justify-center">
    <svg viewBox="0 0 1440 60" className="w-full max-w-7xl" height="60" preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
      </defs>
      <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,60 L0,60 Z" fill="url(#waveGrad)" />
    </svg>
  </div>
);

const DividerZigzag: React.FC = () => (
  <div className="w-full mx-auto my-10 flex justify-center">
    <svg viewBox="0 0 600 80" className="max-w-3xl w-full" height="80" preserveAspectRatio="none">
      {/* blue outline */}
      <polyline points="0,60 100,20 200,60 300,20 400,60 500,20 600,60" fill="none" stroke="#1e3a8a" strokeWidth="8" />
      {/* white main line */}
      <polyline points="0,60 100,20 200,60 300,20 400,60 500,20 600,60" fill="none" stroke="#ffffff" strokeWidth="5" />
    </svg>
    {/* icons positioned at peaks */}
    <div className="absolute w-full max-w-3xl h-20 pointer-events-none">
      <div className="relative w-full h-full">
        <Cog className="text-blue-300 absolute left-[16%] top-2 transition-all duration-300 hover:scale-105" size={18} />
        <Cog className="text-blue-300 absolute left-[50%] top-2 transition-all duration-300 hover:scale-105" size={18} />
        <Cog className="text-blue-300 absolute left-[83%] top-2 transition-all duration-300 hover:scale-105" size={18} />
      </div>
    </div>
  </div>
);

const DividerDashedDiamond: React.FC = () => (
  <div className="w-full mx-auto my-10 flex justify-center items-center">
    <div className="relative w-full max-w-5xl">
      <div className="border-t-4 border-blue-500 border-dashed" style={{ borderImage: 'linear-gradient(90deg, rgba(59,130,246,1), rgba(59,130,246,1)) 1', borderStyle: 'dashed' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-slate-900 px-3 py-1 rounded-full shadow-md">
          <Gem className="text-blue-400 transition-all duration-300 hover:scale-105" size={18} />
        </div>
      </div>
    </div>
  </div>
);

const DividerPulseBar: React.FC = () => (
  <div className="w-full mx-auto my-10 flex justify-center">
    <div className="w-full max-w-6xl h-16 sm:h-20 bg-gradient-to-b from-blue-900/60 to-transparent rounded animate-pulse shadow-md" />
  </div>
);

const DividerWavyShield: React.FC = () => (
  <div className="w-full mx-auto my-8 flex justify-center items-center relative">
    <svg viewBox="0 0 600 30" className="max-w-4xl w-full" height="30" preserveAspectRatio="none">
      <path d="M0,15 C75,5 150,25 225,15 C300,5 375,25 450,15 C525,5 600,25 600,25" fill="none" stroke="#ffffff" strokeWidth="2" />
    </svg>
    <div className="absolute flex justify-center items-center">
      <div className="bg-slate-900 px-2 rounded-full shadow-md">
        <Shield className="text-blue-300 transition-all duration-300 hover:scale-105" size={16} />
      </div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; subtitle?: string; align?: 'left' | 'right' | 'center'; children: React.ReactNode }>=({ title, subtitle, align='left', children }) => {
  const textAlign = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const subWrap = align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : '';
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 mb-2 ${textAlign}`}>{title}</h2>
      {subtitle && (<p className={`text-slate-300 mb-8 max-w-3xl ${textAlign} ${subWrap}`}>{subtitle}</p>)}
      {children}
    </section>
  );
};

const LandingPage: React.FC = () => {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-1 text-sm bg-emerald-900/30 text-emerald-300 mb-4 neon-ring">
          <Sparkles size={16} /> Evidence‑led. Privacy‑preserving. Databricks‑ready.
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
          Unlock the Future of AI Training: AethergenAI – Evidence‑Led Synthetic Data & Models
        </h1>
        <p className="text-slate-300 max-w-3xl mx-auto mb-8">
          Generate high‑fidelity datasets, build specialised models, and optimise with Autopilot—faster, safer, and at a fraction of the cost. Designed for regulated industries, powered by 10 innovations. In a world where AI scaling hits limits, AethergenAI empowers you to innovate without the hefty price tag.
        </p>
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
          <div className="w-full sm:w-auto"><CTAButton label="Explore Resources →" tab="resources" variant="secondary" /></div>
          <div className="w-full sm:w-auto"><CTAButton label="View Pricing" tab="pricing" /></div>
          <div className="w-full sm:w-auto"><CTAButton label="Launch Platform" tab="account" variant="secondary" /></div>
        </div>
      </section>

      {/* Section 1: Problem We Solve */}
      {/* Divider: Hero → Problem (Gradient Wave) */}
      <DividerWave />
      <Section title="Why Traditional AI Training Falls Short" subtitle="Brute‑force scaling with GPUs is expensive and unsustainable—hitting cost walls, data scarcity, and privacy risks. Regulated sectors like healthcare and MoD struggle with compliance, while businesses waste time on opaque processes. AethergenAI changes that with evidence‑led, optimised tools that put control back in your hands." align='left'>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><PiggyBank size={18}/> Cost Barriers</div>
            <p className="text-slate-300 text-sm">Spend 5–10x less on training with lean techniques.</p>
          </div>
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><Database size={18}/> Data Scarcity</div>
            <p className="text-slate-300 text-sm">Generate unlimited synthetic data with &lt;3% real data reliance.</p>
          </div>
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><ShieldCheck size={18}/> Privacy Risks</div>
            <p className="text-slate-300 text-sm">Built‑in compliance for GDPR/ISO, ensuring trust.</p>
          </div>
        </div>
        <div className="mt-6">
          <CTAButton label="View Pricing" tab="pricing" />
        </div>
      </Section>

      {/* Section 2: Innovations & Capabilities */}
      {/* Divider: Problem → Innovations (Zigzag with cogs) */}
      <DividerZigzag />
      <Section title="10 Innovations Powering Your Success" subtitle="AethergenAI’s breakthroughs deliver real‑world results without revealing the magic. From synthetic‑first generation to self‑improving Autopilot, we’ve crafted a platform that’s efficient, auditable, and scalable." align='right'>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><Cpu size={18}/> Synthetic‑First Generation</div>
            <p className="text-slate-300 text-sm">Scale to tens of millions of rows locally, with DP control and cleaning built‑in—perfect for experimenting at the edge.</p>
          </div>
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><ShieldCheck size={18}/> Auditable Evidence</div>
            <p className="text-slate-300 text-sm">AUM certificates, AGO resonance, 432 harmony, TriCoT, ACI, VRME—bundled per release for compliance and confidence.</p>
          </div>
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><Boxes size={18}/> Databricks Ready</div>
            <p className="text-slate-300 text-sm">Delta tables + preview, OPTIMIZE/Z‑ORDER, Unity Catalog—seamless Marketplace listings.</p>
          </div>
          <div className="rounded-xl p-6 dark-card neon-card">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1"><Sparkles size={18}/> Build Specialised Models</div>
            <p className="text-slate-300 text-sm">Autopilot finds optimal recipes for your data—faster than brute force, safer than real data.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <CTAButton label="Build Your Model" tab="account" />
        </div>
      </Section>

      {/* Section 3: Offerings & Pricing */}
      {/* Divider: Innovations → Offerings (Dashed with diamond) */}
      <DividerDashedDiamond />
      <Section title="Tailored Solutions for Your Needs" subtitle="Whether you’re buying datasets, renting models, or building your own, AethergenAI offers flexible tiers with benefits like cost savings, privacy assurance, and innovation at scale." align='center'>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {[
            {t:'Datasets',d:'Preview (Free, 50k rows) • Standard £399/$499 • Enterprise £25k/$30k/yr (Delta Sharing)'},
            {t:'Specialised Models',d:'Niche like Healthcare Fraud Detection £149/$199 p/seat / month'},
            {t:'Prediction Credits',d:'100k £49/$59 • 1M £399/$499 (one‑time)'},
            {t:'Developer Hub',d:'Dev Hub £299/$379 • Pro £499/$629 • Enterprise Platform £2,999/$3,799 (5 seats, tools only)'}
          ].map(({t,d}) => (
            <div key={t} className="rounded-xl p-6 dark-card neon-card flex flex-col">
              <div className="text-emerald-300 font-semibold mb-2">{t}</div>
              <p className="text-slate-300 text-sm flex-grow">{d}</p>
              <div className="mt-4"><CTAButton label="View Pricing" tab="pricing" /></div>
            </div>
          ))}
        </div>
        <p className="text-slate-300 mt-6 text-center">Unlock unlimited potential—contact us for bundles or custom quotes.</p>
        <div className="mt-4 flex justify-center"><CTAButton label="Get Started" tab="account" /></div>
      </Section>

      {/* Section 4: Call to Action (Netlify form) */}
      {/* Divider: Offerings → CTA (Pulse gradient bar) */}
      <DividerPulseBar />
      <Section title="Ready to Transform Your AI Workflow?" subtitle="Join innovators using AethergenAI to experiment at the edge and compete on outcomes, not hardware. We’re here to partner—let’s chat.">
        <form name="contact" method="POST" data-netlify="true" className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="contact" />
          <input className="col-span-1 bg-slate-900/70 border border-slate-700 rounded px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Name" name="name" required />
          <input className="col-span-1 bg-slate-900/70 border border-slate-700 rounded px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Email" type="email" name="email" required />
          <div className="hidden">
            <input name="bot-field" />
          </div>
          <textarea className="md:col-span-3 bg-slate-900/70 border border-slate-700 rounded px-3 py-2 h-28 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Message" name="message" required />
          <div className="md:col-span-3 flex justify-center"><button type="submit" className="px-6 py-3 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500">Submit</button></div>
        </form>
      </Section>
      {/* Divider: CTA → Footer (Wavy with shield) */}
      <DividerWavyShield />
    </div>
  );
};

export default LandingPage;


