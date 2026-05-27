import type { Metadata } from 'next';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

export const metadata: Metadata = {
  title: 'Terms of Service | Auspexi',
  description: 'Auspexi\'s Terms of Service. Read the full terms governing use of the Auspexi GEO platform, including intellectual property, prohibited uses, and limitation of liability.',
  metadataBase: new URL('https://auspexi.com'),
  alternates: { canonical: 'https://auspexi.com/terms' },
  openGraph: {
    title: 'Terms of Service | Auspexi',
    description: 'Terms governing use of the Auspexi GEO platform.',
    url: 'https://auspexi.com/terms',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | Auspexi',
    description: 'Terms governing use of the Auspexi GEO platform.',
  },
};

const termsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service',
  url: 'https://auspexi.com/terms',
  description: 'Auspexi Terms of Service governing use of the GEO platform.',
  isPartOf: { '@id': 'https://auspexi.com/#website' },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }} />
      <PublicHeader />
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-8">Terms of Service</h1>
          <p className="text-zinc-400 mb-12 font-mono text-xs">Last updated: April 2026</p>
          <div className="prose prose-invert prose-zinc max-w-none text-sm leading-relaxed text-zinc-350 space-y-8 font-sans">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">1. Acceptance of Terms</h2>
              <p>By accessing and using Auspexi (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>
            </section>
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">2. Intellectual Property and Copyright</h2>
              <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Auspexi and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Auspexi.</p>
            </section>
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">3. Prohibited Uses &amp; Anti-Reverse Engineering</h2>
              <p className="mb-4">You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. <strong>Specifically, you strictly agree NOT to:</strong></p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Reverse engineer, decompile, disassemble, decipher or otherwise attempt to derive the source code for any underlying intellectual property used to provide the Service.</li>
                <li>Copy, distribute, or disclose any part of the Service in any medium, including without limitation by any automated or non-automated &ldquo;scraping&rdquo;.</li>
                <li>Create derivative works based on the Service, or copy its features, functions, or graphics to build a competitive product (&ldquo;copycatting&rdquo;).</li>
                <li>Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
              </ul>
            </section>
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">4. Limitation of Liability</h2>
              <p className="mb-4">In no event shall Auspexi, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
              <p className="uppercase font-semibold text-zinc-200">THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS. AUSPEXI EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.</p>
            </section>
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">5. Termination</h2>
              <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
            </section>
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">6. Governing Law</h2>
              <p>These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
            </section>
          </div>
        </div>
      </main>
      <Footerdemo />
    </div>
  );
}
