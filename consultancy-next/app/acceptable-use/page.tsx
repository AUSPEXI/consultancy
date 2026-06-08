import type { Metadata } from 'next';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | L8EntSpace',
  description: 'L8EntSpace\'s Acceptable Use Policy — what you may and may not do with the platform, brand protection rules, and enforcement.',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/acceptable-use' },
  openGraph: {
    title: 'Acceptable Use Policy | L8EntSpace',
    description: 'Rules governing acceptable use of the L8EntSpace GEO platform.',
    url: 'https://l8entspace.com/acceptable-use',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Acceptable Use Policy | L8EntSpace',
    description: 'Rules governing acceptable use of the L8EntSpace GEO platform.',
  },
};

const aupJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Acceptable Use Policy',
  url: 'https://l8entspace.com/acceptable-use',
  description: 'L8EntSpace Acceptable Use Policy.',
  isPartOf: { '@id': 'https://l8entspace.com/#website' },
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aupJsonLd) }} />
      <PublicHeader />
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Acceptable Use Policy</h1>
          <p className="text-zinc-400 mb-2 font-mono text-xs">Last updated: May 2026 &nbsp;·&nbsp; Version 1.0</p>
          <p className="text-zinc-500 text-xs mb-12">This policy forms part of our <a href="/terms" className="text-pink-400/70 hover:text-pink-300">Terms of Service</a>. By using L8EntSpace, you agree to this policy.</p>

          <div className="prose prose-invert prose-zinc max-w-none text-sm leading-relaxed space-y-10 font-sans">

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">1. Purpose</h2>
              <p className="text-zinc-300">This Acceptable Use Policy (&ldquo;AUP&rdquo;) sets out the rules governing your use of the L8EntSpace platform and website. It exists to protect the integrity, security, and reputation of the Service, and to ensure fair access for all users. Violations may result in immediate suspension, permanent termination, and legal action.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">2. Prohibited Activities</h2>
              <p className="text-zinc-300 mb-4">You must not use the L8EntSpace platform for any of the following:</p>

              <div className="space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3">Illegal or Harmful Conduct</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs">
                    <li>Any activity that violates applicable law or regulation, including data protection laws, intellectual property laws, anti-spam laws, and financial regulations</li>
                    <li>Generating, storing, or distributing content that is defamatory, harassing, threatening, discriminatory, or sexually explicit</li>
                    <li>Using the platform to facilitate fraud, deception, phishing, or other dishonest conduct</li>
                    <li>Infringing the intellectual property, privacy, or other rights of any third party</li>
                  </ul>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3">Platform Abuse and System Integrity</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs">
                    <li>Attempting to reverse engineer, decompile, disassemble, or derive source code from any part of the platform</li>
                    <li>Systematically scraping, crawling, or harvesting data from the Service by automated means</li>
                    <li>Probing, scanning, or testing the vulnerability of the platform or its infrastructure</li>
                    <li>Introducing malicious code, viruses, trojans, worms, or any other harmful software</li>
                    <li>Attempting to gain unauthorised access to any part of the Service or its backend systems</li>
                    <li>Interfering with or disrupting the integrity or performance of the Service</li>
                    <li>Using the platform in any way that imposes an unreasonable or disproportionately large load on our infrastructure</li>
                    <li>Circumventing or attempting to circumvent any access controls, rate limits, or technical measures</li>
                  </ul>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3">Competitive Misuse</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs">
                    <li>Using the platform, its outputs, or proprietary methodologies to build, train, or improve a competing product or service</li>
                    <li>Benchmarking the Service for the purpose of competitive analysis without our prior written consent</li>
                    <li>Accessing the Service as an agent of a competing business without disclosure</li>
                    <li>Reselling, sublicensing, or white-labelling the Service or its outputs without our express written authorisation</li>
                  </ul>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3">Account Misuse</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs">
                    <li>Sharing account credentials with individuals not authorised under your subscription tier</li>
                    <li>Creating multiple accounts to circumvent subscription limits, bans, or restrictions</li>
                    <li>Misrepresenting your identity, business, or purpose when creating an account</li>
                    <li>Allowing third parties to access the Service through your account without authorisation</li>
                  </ul>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3">Brand and AI Misuse</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs">
                    <li>Using the platform to generate content designed to deceive AI models in ways that harm third parties</li>
                    <li>Submitting false, misleading, or fraudulent brand data intended to manipulate AI-generated results unethically</li>
                    <li>Using competitor intelligence features to harass, impersonate, or damage the reputation of third-party brands through dishonest means</li>
                    <li>Publishing AI-generated content from the platform without reviewing it for accuracy, as required by our Terms</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">3. Brand and Intellectual Property Protection</h2>
              <p className="text-zinc-300 mb-4">The following names and terms are proprietary to L8EntSpace. They may not be used without our prior written consent in any marketing, product naming, domain, social media handle, or other commercial context:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['L8EntSpace™', 'Citacious™', 'GEO-Pulse™', 'Cite-Magnet™', 'Fact-Vault™', 'Latent Space Moat™', 'Share of Voice (GEO)', '768-D Mapping'].map((tm) => (
                  <div key={tm} className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-center">
                    <span className="text-pink-300 text-xs font-semibold">{tm}</span>
                  </div>
                ))}
              </div>
              <p className="text-zinc-400 mt-4 text-xs">Unauthorised use of these marks — including in domain names, product descriptions, or social media profiles — constitutes trademark infringement and will be acted upon. We actively monitor for misuse.</p>
              <p className="text-zinc-400 mt-2 text-xs">If you wish to reference L8EntSpace for editorial, journalistic, or review purposes, use of the name &ldquo;L8EntSpace&rdquo; is permitted provided it is clearly descriptive and does not imply endorsement or partnership.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">4. Content Standards</h2>
              <p className="text-zinc-300 mb-3">When using the platform to generate, store, or distribute content, you are responsible for ensuring that content:</p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                <li>Is accurate to the best of your knowledge, or is clearly marked as AI-generated where applicable</li>
                <li>Does not make false factual claims about third parties that could constitute defamation</li>
                <li>Does not infringe third-party copyright, trademarks, or other IP rights</li>
                <li>Complies with the ASA (Advertising Standards Authority) rules if used in advertising contexts</li>
                <li>Does not constitute unsolicited commercial communication (spam) when distributed</li>
              </ul>
              <p className="text-zinc-400 mt-3 text-xs">We reserve the right to remove any content stored on our platform that violates these standards, without notice.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">5. Fair Use of AI Features</h2>
              <p className="text-zinc-300 mb-3">Our platform integrates with third-party AI APIs with rate limits. You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                <li>Submit excessive automated requests that exceed the volume typical of normal platform use</li>
                <li>Use the voice agent (Citacious) in a way that generates disproportionate API costs relative to your subscription tier</li>
                <li>Use automation or scripts to interact with the dashboard in ways not intended by its design</li>
              </ul>
              <p className="text-zinc-400 mt-3 text-xs">We may implement rate limits or request throttling to maintain service quality for all users. Persistent abuse may result in account suspension.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">6. Enforcement</h2>
              <div className="space-y-3">
                <p className="text-zinc-300">We take breaches of this policy seriously. Depending on the severity of the breach, we may take one or more of the following actions:</p>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {[
                    { level: 'Warning', desc: 'Written notice of breach with opportunity to remedy' },
                    { level: 'Suspension', desc: 'Temporary suspension of account access pending investigation' },
                    { level: 'Termination', desc: 'Permanent termination of account without refund' },
                    { level: 'Legal Action', desc: 'Civil proceedings for damages and/or injunctive relief' },
                    { level: 'Regulatory Referral', desc: 'Reporting to the ICO, Police, or other relevant authorities' },
                    { level: 'IP Enforcement', desc: 'UKIPO opposition, takedown notices, trademark infringement claims' },
                  ].map((a) => (
                    <div key={a.level} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                      <p className="font-semibold text-white text-xs mb-1">{a.level}</p>
                      <p className="text-zinc-400 text-xs">{a.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-400 text-xs mt-2">Where a breach is severe (e.g., IP theft, system attacks, competitive misuse), we will proceed directly to termination and legal action without prior warning.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">7. Reporting Violations</h2>
              <p className="text-zinc-300">If you observe a violation of this policy by another user, or believe our IP or brand is being misused by a third party, please report it to <a href="mailto:sales@l8entspace.com" className="text-pink-400 hover:text-pink-300">sales@l8entspace.com</a> with subject line &ldquo;AUP Report&rdquo;. Include as much detail as possible. We treat all reports in confidence.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">8. Changes to This Policy</h2>
              <p className="text-zinc-300">We may update this policy to address new risks or changes in law. Material changes will be notified by email. Continued use of the Service after the effective date of any changes constitutes acceptance.</p>
            </section>

            <section className="bg-zinc-900/30 border border-pink-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-3 text-white font-heading">Questions</h2>
              <p className="text-zinc-300 text-sm">Contact us at <a href="mailto:sales@l8entspace.com" className="text-pink-400 hover:text-pink-300">sales@l8entspace.com</a>.</p>
              <p className="text-zinc-500 text-xs mt-3">
                Also see: <a href="/terms" className="text-pink-400/70 hover:text-pink-300">Terms of Service</a> &nbsp;·&nbsp; <a href="/privacy" className="text-pink-400/70 hover:text-pink-300">Privacy Policy</a>
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footerdemo />
    </div>
  );
}
