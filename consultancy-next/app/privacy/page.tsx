import type { Metadata } from 'next';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

export const metadata: Metadata = {
  title: 'Privacy & Cookie Policy | Auspexi',
  description: 'How Auspexi collects, uses, and protects your personal data. UK GDPR compliant — covering AI data processing, voice data, cookies, and your data rights.',
  metadataBase: new URL('https://auspexi.com'),
  alternates: { canonical: 'https://auspexi.com/privacy' },
  openGraph: {
    title: 'Privacy & Cookie Policy | Auspexi',
    description: 'How Auspexi collects, uses, and protects your personal data in compliance with UK GDPR.',
    url: 'https://auspexi.com/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy & Cookie Policy | Auspexi',
    description: 'UK GDPR-compliant privacy policy covering AI data processing, voice data, and your rights.',
  },
};

const privacyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy & Cookie Policy',
  url: 'https://auspexi.com/privacy',
  description: 'Auspexi privacy and cookie policy — UK GDPR compliant.',
  isPartOf: { '@id': 'https://auspexi.com/#website' },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyJsonLd) }} />
      <PublicHeader />
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Privacy &amp; Cookie Policy</h1>
          <p className="text-zinc-400 mb-2 font-mono text-xs">Last updated: May 2026 &nbsp;·&nbsp; Version 2.0</p>
          <p className="text-zinc-500 text-xs mb-12">Applies to all users of auspexi.com and the Auspexi platform.</p>

          <div className="prose prose-invert prose-zinc max-w-none text-sm leading-relaxed space-y-10 font-sans">

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">1. Who We Are</h2>
              <p className="text-zinc-300">Auspexi (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a Generative Engine Optimization (GEO) platform. We are the <strong>data controller</strong> responsible for your personal data collected through this website and platform.</p>
              <p className="text-zinc-300 mt-3"><strong>Contact:</strong> For all privacy matters, write to us at <a href="mailto:sales@auspexi.com" className="text-pink-400 hover:text-pink-300">sales@auspexi.com</a> with the subject line &ldquo;Privacy Request&rdquo;. We aim to respond within 72 hours and will always respond within the statutory 30-day period.</p>
              <p className="text-zinc-400 mt-3 text-xs">Note: If you are a UK business using Auspexi to process personal data about third parties on your behalf, please contact us to discuss a Data Processing Agreement (DPA).</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">2. What Data We Collect</h2>
              <p className="text-zinc-300 mb-4">We collect the following categories of personal and business data:</p>
              <div className="space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Account &amp; Identity Data</h3>
                  <p className="text-zinc-400">Email address, name, account password (hashed), and profile information you provide at sign-up or in Settings.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Brand &amp; Business Data</h3>
                  <p className="text-zinc-400">Brand name, website domain, target keywords, competitor names, brand &ldquo;facts&rdquo; you add to your Fact-Vault, and any content generated through our platform. This is business information you choose to enter.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Usage &amp; Technical Data</h3>
                  <p className="text-zinc-400">IP address, browser type and version, operating system, pages visited, features used, timestamps, and error logs. Collected automatically when you use the platform.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Voice &amp; Audio Data</h3>
                  <p className="text-zinc-400">When you use the Citacious voice assistant, your microphone audio is streamed in real time to Google Gemini Live API for processing. <strong>We do not store your voice recordings.</strong> Audio is processed transiently and discarded at session end. Transcripts of queries may be retained for up to 30 days for service quality purposes.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Payment &amp; Billing Data</h3>
                  <p className="text-zinc-400">We use a third-party payment processor. We do not store your full card number, CVV, or bank details. We retain billing records (amounts, dates, subscription tier) as required by HMRC for 7 years.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Audit &amp; Security Logs</h3>
                  <p className="text-zinc-400">Records of actions taken within the platform (e.g., data exports, settings changes, content published) for security and compliance purposes.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">3. Why We Use Your Data — and Our Lawful Basis</h2>
              <p className="text-zinc-300 mb-4">Under UK GDPR, we must have a lawful basis for each use of your personal data:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Purpose</th>
                      <th className="text-left py-3 pr-4 text-zinc-300 font-semibold">Lawful Basis</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-400">
                    {[
                      ['Creating and managing your account', 'Contract (Art. 6(1)(b))'],
                      ['Delivering GEO platform services', 'Contract (Art. 6(1)(b))'],
                      ['Processing your subscription payments', 'Contract (Art. 6(1)(b))'],
                      ['Sending transactional emails (billing, security alerts)', 'Contract / Legal Obligation'],
                      ['Maintaining security, preventing fraud and abuse', 'Legitimate Interests (Art. 6(1)(f))'],
                      ['Improving platform features and performance', 'Legitimate Interests (Art. 6(1)(f))'],
                      ['Sending marketing emails about new features', 'Consent (Art. 6(1)(a)) — opt out anytime'],
                      ['Retaining financial records for HMRC', 'Legal Obligation (Art. 6(1)(c))'],
                      ['Processing voice queries via Citacious', 'Consent (Art. 6(1)(a)) — granted by initiating a call'],
                    ].map(([purpose, basis], i) => (
                      <tr key={i} className="border-b border-zinc-800/60">
                        <td className="py-3 pr-4">{purpose}</td>
                        <td className="py-3 text-pink-300/80">{basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">4. AI Processing — How Your Data Is Used with Third-Party AI Services</h2>
              <p className="text-zinc-300 mb-4">Our platform is built on artificial intelligence. To deliver our core services, your brand data (keywords, competitor names, brand facts) is sent to the following AI providers as <strong>data processors</strong> acting on our instructions:</p>
              <div className="space-y-3">
                {[
                  { name: 'Google (Gemini API, Firebase, Firestore, Cloud)', purpose: 'AI query processing, embeddings, data storage, voice processing (Citacious). Data may be processed in the US and EU.', link: 'https://policies.google.com/privacy' },
                  { name: 'OpenAI', purpose: 'AI citation and Share of Voice queries. Data may be processed in the US.', link: 'https://openai.com/policies/privacy-policy' },
                  { name: 'Anthropic', purpose: 'AI citation queries. Data may be processed in the US.', link: 'https://www.anthropic.com/privacy' },
                  { name: 'Perplexity AI', purpose: 'AI citation queries. Data may be processed in the US.', link: 'https://www.perplexity.ai/hub/legal/privacy-policy' },
                  { name: 'Netlify', purpose: 'Website hosting and content delivery. Data may be processed in the US.', link: 'https://www.netlify.com/privacy/' },
                ].map((p) => (
                  <div key={p.name} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                    <p className="font-semibold text-white text-xs mb-1">{p.name}</p>
                    <p className="text-zinc-400 text-xs">{p.purpose}</p>
                  </div>
                ))}
              </div>
              <p className="text-zinc-400 mt-4 text-xs">We only share the minimum data required to fulfil your query. We do not sell your data to any third party. We do not use your brand data to train third-party AI models (where we have the contractual ability to restrict this).</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">5. International Data Transfers</h2>
              <p className="text-zinc-300">Some of our third-party processors operate outside the UK. Where we transfer personal data internationally, we ensure appropriate safeguards are in place, including International Data Transfer Agreements (IDTAs), Standard Contractual Clauses (SCCs), or transfers to countries with UK adequacy decisions.</p>
              <p className="text-zinc-300 mt-3">By using our platform and submitting data, you acknowledge that your data may be transferred to and processed in the United States and other countries where our processors operate.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">6. Cookies</h2>
              <p className="text-zinc-300 mb-4">We use the following categories of cookies:</p>
              <div className="space-y-3">
                {[
                  { type: 'Strictly Necessary', required: true, desc: 'Essential for authentication, security, and core platform functionality. These cannot be disabled. Examples: session tokens, CSRF protection.' },
                  { type: 'Functional', required: false, desc: 'Remember your preferences (e.g., dashboard layout, notification settings). Enabled by default but you can disable them.' },
                  { type: 'Analytics', required: false, desc: 'Help us understand how the site is used so we can improve it. We may use privacy-respecting analytics tools. No tracking across other websites.' },
                ].map((c) => (
                  <div key={c.type} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white text-xs">{c.type}</span>
                      {c.required
                        ? <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">Always Active</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">Requires Consent</span>
                      }
                    </div>
                    <p className="text-zinc-400 text-xs">{c.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-zinc-400 mt-4 text-xs">You can manage cookies through your browser settings. Disabling functional cookies may affect your platform experience. Disabling analytics cookies will not affect platform functionality.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">7. How Long We Keep Your Data</h2>
              <div className="space-y-2">
                {[
                  ['Account &amp; profile data', 'Duration of active subscription + 30 days after deletion request'],
                  ['Brand data, facts, keywords in Fact-Vault', 'Duration of active subscription + 30 days after deletion request'],
                  ['AI query results and Share of Voice history', '24 months rolling, then aggregated/anonymised'],
                  ['Voice session transcripts', '30 days'],
                  ['Billing and financial records', '7 years (HMRC legal requirement)'],
                  ['Security and audit logs', '7 years'],
                  ['Marketing consent records', '3 years after consent given or withdrawn'],
                ].map(([item, period], i) => (
                  <div key={i} className="flex gap-4 py-2 border-b border-zinc-800/60 text-xs">
                    <span className="text-zinc-300 w-1/2" dangerouslySetInnerHTML={{ __html: item }} />
                    <span className="text-zinc-500 w-1/2">{period}</span>
                  </div>
                ))}
              </div>
              <p className="text-zinc-400 mt-4 text-xs">You can request deletion of your account data at any time (see Your Rights below). Some data must be retained for legal compliance even after account deletion.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">8. Your Rights Under UK GDPR</h2>
              <p className="text-zinc-300 mb-4">You have the following rights regarding your personal data. To exercise any of them, email <a href="mailto:sales@auspexi.com" className="text-pink-400 hover:text-pink-300">sales@auspexi.com</a> with the subject &ldquo;Privacy Request&rdquo;. We will respond within 30 days and will not charge a fee for reasonable requests.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { right: 'Right of Access', desc: 'Request a copy of all personal data we hold about you.' },
                  { right: 'Right to Rectification', desc: 'Ask us to correct inaccurate or incomplete data.' },
                  { right: 'Right to Erasure', desc: 'Request deletion of your data where we have no legal reason to retain it.' },
                  { right: 'Right to Restrict Processing', desc: 'Ask us to pause processing your data in certain circumstances.' },
                  { right: 'Right to Data Portability', desc: 'Receive your data in a machine-readable format to transfer to another service.' },
                  { right: 'Right to Object', desc: 'Object to processing based on legitimate interests or direct marketing.' },
                  { right: 'Right to Withdraw Consent', desc: 'Withdraw consent for consent-based processing (e.g., marketing, voice) at any time.' },
                  { right: 'Right to Complain', desc: 'Lodge a complaint with the Information Commissioner\'s Office at ico.org.uk or 0303 123 1113.' },
                ].map((r) => (
                  <div key={r.right} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                    <p className="font-semibold text-white text-xs mb-1">{r.right}</p>
                    <p className="text-zinc-400 text-xs">{r.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">9. Children&apos;s Privacy</h2>
              <p className="text-zinc-300">Our platform is intended for business use by individuals aged 18 and over. We do not knowingly collect personal data from anyone under 18. If you believe a minor has provided us with personal data, please contact us immediately and we will delete it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">10. Security</h2>
              <p className="text-zinc-300">We implement appropriate technical and organisational measures to protect your data, including:</p>
              <ul className="list-disc pl-6 space-y-1 text-zinc-400 mt-3 text-sm">
                <li>Encryption at rest (AES-256) and in transit (TLS 1.3)</li>
                <li>Role-based access control — staff access is need-to-know only</li>
                <li>Firestore security rules restricting data access to the owning user UID</li>
                <li>Automated audit trails for all data mutations</li>
                <li>Multi-tenant data isolation — your data is never shared with or visible to other Auspexi customers</li>
              </ul>
              <p className="text-zinc-400 mt-3 text-xs">No system is 100% secure. In the event of a data breach that poses a risk to your rights and freedoms, we will notify the ICO within 72 hours and notify affected individuals without undue delay.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">11. Changes to This Policy</h2>
              <p className="text-zinc-300">We may update this policy to reflect changes in law or our practices. Material changes will be communicated by email and by updating the &ldquo;Last updated&rdquo; date above. Continued use of the platform after changes take effect constitutes acceptance of the updated policy.</p>
            </section>

            <section className="bg-zinc-900/30 border border-pink-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-3 text-white font-heading">Contact &amp; Complaints</h2>
              <p className="text-zinc-300 text-sm">For any privacy questions or to exercise your rights: <a href="mailto:sales@auspexi.com" className="text-pink-400 hover:text-pink-300">sales@auspexi.com</a></p>
              <p className="text-zinc-300 text-sm mt-2">To complain to the UK supervisory authority: <a href="https://ico.org.uk/make-a-complaint/" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">ico.org.uk/make-a-complaint</a> or call 0303 123 1113.</p>
              <p className="text-zinc-500 text-xs mt-4">You have the right to complain to the ICO at any time. However, we would appreciate the opportunity to address your concerns first.</p>
            </section>

          </div>
        </div>
      </main>
      <Footerdemo />
    </div>
  );
}
