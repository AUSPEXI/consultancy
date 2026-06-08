import type { Metadata } from 'next';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

export const metadata: Metadata = {
  title: 'Terms of Service | L8EntSpace',
  description: 'Terms governing your use of the L8EntSpace GEO platform — subscriptions, IP rights, AI content, limitations of liability, and governing law (England & Wales).',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/terms' },
  openGraph: {
    title: 'Terms of Service | L8EntSpace',
    description: 'Terms governing use of the L8EntSpace GEO platform under English law.',
    url: 'https://l8entspace.com/terms',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | L8EntSpace',
    description: 'Terms governing use of the L8EntSpace GEO platform under English law.',
  },
};

const termsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service',
  url: 'https://l8entspace.com/terms',
  description: 'L8EntSpace Terms of Service — English law.',
  isPartOf: { '@id': 'https://l8entspace.com/#website' },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }} />
      <PublicHeader />
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Terms of Service</h1>
          <p className="text-zinc-400 mb-2 font-mono text-xs">Last updated: May 2026 &nbsp;·&nbsp; Version 2.0</p>
          <p className="text-zinc-500 text-xs mb-12">These terms govern your access to and use of l8entspace.com and the L8EntSpace platform. By creating an account, you agree to be bound by these terms. Please read them carefully.</p>

          <div className="prose prose-invert prose-zinc max-w-none text-sm leading-relaxed space-y-10 font-sans">

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">1. About L8EntSpace</h2>
              <p className="text-zinc-300">L8EntSpace (&ldquo;L8EntSpace&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the L8EntSpace Generative Engine Optimization (GEO) platform, including the website at l8entspace.com, the dashboard, and all associated tools and services (collectively, &ldquo;the Service&rdquo;). For enquiries, contact <a href="mailto:sales@l8entspace.com" className="text-pink-400 hover:text-pink-300">sales@l8entspace.com</a>.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">2. Eligibility and Account</h2>
              <p className="text-zinc-300">You must be at least 18 years old to use the Service. By accepting these terms, you confirm you are 18 or over, or that you are using the Service on behalf of an organisation with authority to bind it to these terms.</p>
              <p className="text-zinc-300 mt-3">You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Notify us immediately at <a href="mailto:sales@l8entspace.com" className="text-pink-400 hover:text-pink-300">sales@l8entspace.com</a> if you suspect unauthorised access. We are not liable for losses resulting from unauthorised use of your account caused by your failure to keep credentials secure.</p>
              <p className="text-zinc-300 mt-3">You may only create one account per individual or organisation unless we expressly agree otherwise. Accounts are non-transferable.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">3. Subscriptions and Payment</h2>
              <div className="space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Billing</h3>
                  <p className="text-zinc-400">Subscriptions are billed in advance on a monthly or annual basis. By providing payment details, you authorise us to charge your payment method for the applicable subscription fee on each renewal date.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Price Changes</h3>
                  <p className="text-zinc-400">We will give you at least 30 days&apos; written notice before changing your subscription price. If you do not cancel before the new price takes effect, you accept the new price. Promotional or locked-in rates remain valid only while your subscription is continuously active.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Cancellation</h3>
                  <p className="text-zinc-400">You may cancel your subscription at any time from your account settings. Your access continues until the end of the current paid period. We do not offer partial-month refunds on cancellation.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Refunds</h3>
                  <p className="text-zinc-400">L8EntSpace is a digital service delivered immediately upon account creation. Under the Consumer Contracts Regulations 2013 (UK), your 14-day cancellation right is waived once you begin using the Service. Refunds are provided only where required by law (e.g., Service is materially faulty under the Consumer Rights Act 2015) or at our sole discretion.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-2">Failed Payments</h3>
                  <p className="text-zinc-400">If a payment fails, we will notify you and may suspend access until payment is received. Outstanding balances accrue statutory interest under the Late Payment of Commercial Debts (Interest) Act 1998 for business customers.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">4. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Our IP</h3>
                  <p className="text-zinc-300">The Service, including its software, source code, algorithms, design, GEO methodology, and all proprietary features, is and remains the exclusive intellectual property of L8EntSpace. The following names, terms, and concepts are proprietary trademarks and trade marks of L8EntSpace, whether registered or unregistered:</p>
                  <ul className="list-none mt-3 space-y-1 text-zinc-400 text-sm">
                    {['L8EntSpace™', 'Citacious™', 'GEO-Pulse™', 'Cite-Magnet™', 'Fact-Vault™', 'Share of Voice (SoV) methodology as implemented in our platform', 'Latent Space Moat methodology', '768-D Semantic Mapping methodology'].map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">›</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-zinc-400 mt-3 text-xs">No licence is granted to use any of the above names, marks, or methodologies except as required to use the Service itself. Any use of our brand names or marks in marketing, products, or services requires our prior written consent.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Your IP</h3>
                  <p className="text-zinc-300">You retain ownership of all brand data, keywords, competitor information, and content you upload to the platform (&ldquo;Your Content&rdquo;). By using the Service, you grant L8EntSpace a limited, non-exclusive, royalty-free licence to process Your Content solely for the purpose of delivering the Service to you. We do not claim ownership of Your Content and will not use it for any other purpose.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">5. AI-Generated Content</h2>
              <p className="text-zinc-300">The Service uses artificial intelligence to generate recommendations, articles, brand facts, competitor analyses, and other outputs (&ldquo;AI Content&rdquo;). You acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400 mt-3 text-sm">
                <li>AI Content may contain inaccuracies, omissions, or hallucinations and should not be relied upon without independent human review.</li>
                <li>You are solely responsible for reviewing, editing, and approving any AI Content before publishing, distributing, or acting upon it.</li>
                <li>L8EntSpace makes no representation or warranty as to the accuracy, completeness, or fitness for purpose of AI Content.</li>
                <li>Publication of AI Content is your decision and responsibility. L8EntSpace is not liable for any consequences arising from AI Content you choose to publish.</li>
                <li>Where AI Content incorporates third-party data, you are responsible for ensuring any use complies with applicable copyright and intellectual property laws.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">6. Acceptable Use</h2>
              <p className="text-zinc-300 mb-3">You agree to use the Service in accordance with our <a href="/acceptable-use" className="text-pink-400 hover:text-pink-300">Acceptable Use Policy</a>, which forms part of these terms. In summary, you must not use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                <li>Violate any applicable law, regulation, or third-party rights</li>
                <li>Reverse engineer, decompile, or copy any part of the platform</li>
                <li>Attempt to build a competing product using our platform, methodology, or data</li>
                <li>Scrape, harvest, or systematically extract data from the Service</li>
                <li>Introduce malicious code, interfere with the Service, or attack its infrastructure</li>
                <li>Share your account credentials or allow multiple users to access a single account</li>
                <li>Misrepresent your identity or organisational affiliation</li>
                <li>Generate, store, or distribute content that is defamatory, harassing, discriminatory, or otherwise unlawful</li>
              </ul>
              <p className="text-zinc-400 mt-3 text-xs">Breach of these restrictions is grounds for immediate account suspension and legal action.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">7. Third-Party Services</h2>
              <p className="text-zinc-300">The Service integrates with third-party AI providers (including Google, OpenAI, Anthropic, and Perplexity) to deliver its functionality. We are not responsible for the acts, omissions, or availability of these third parties. Your use of those services through our platform may also be subject to their own terms.</p>
              <p className="text-zinc-300 mt-3">The Service may display or link to third-party websites or content. We do not endorse such third parties and are not responsible for their content or practices.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">8. Service Availability and Changes</h2>
              <p className="text-zinc-300">We aim to make the Service available 99% of the time but do not guarantee uninterrupted access. The Service may be unavailable during maintenance, upgrades, or due to circumstances beyond our control. We may modify, suspend, or discontinue any feature of the Service at any time. For material changes that reduce core functionality, we will give reasonable advance notice.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">9. Disclaimers</h2>
              <p className="text-zinc-300">THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;. TO THE MAXIMUM EXTENT PERMITTED BY LAW, L8ENTSPACE EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
              <p className="text-zinc-300 mt-3">We do not warrant that the Service will increase your brand&apos;s visibility in AI-generated responses, achieve specific Share of Voice targets, or produce any particular commercial outcome. GEO is an emerging discipline and results depend on many factors outside our control, including AI model updates by third parties.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">10. Limitation of Liability</h2>
              <p className="text-zinc-300">TO THE MAXIMUM EXTENT PERMITTED BY LAW, L8ENTSPACE&apos;S TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO L8ENTSPACE IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
              <p className="text-zinc-300 mt-3">IN NO EVENT SHALL L8ENTSPACE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, BUSINESS, GOODWILL, OR ANTICIPATED SAVINGS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
              <p className="text-zinc-400 mt-3 text-xs">Nothing in these terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law under the Consumer Rights Act 2015 or other applicable UK legislation.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">11. Indemnification</h2>
              <p className="text-zinc-300">You agree to indemnify, defend, and hold harmless L8EntSpace and its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from: (a) your use or misuse of the Service; (b) your breach of these terms; (c) Your Content; or (d) your violation of any applicable law or third-party rights.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">12. Termination</h2>
              <p className="text-zinc-300">Either party may terminate these terms on written notice. We may suspend or terminate your access immediately and without notice if you breach these terms, engage in conduct harmful to our platform or other users, or fail to pay outstanding fees. Upon termination, your access to the Service ceases and we will handle your data in accordance with our <a href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</a>.</p>
              <p className="text-zinc-300 mt-3">Sections on IP, Disclaimers, Limitation of Liability, Indemnification, and Governing Law survive termination.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">13. Changes to These Terms</h2>
              <p className="text-zinc-300">We may update these terms from time to time. We will notify you of material changes by email at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated terms. If you do not accept the changes, you must cancel your subscription before the effective date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">14. Governing Law and Disputes</h2>
              <p className="text-zinc-300">These terms are governed by and construed in accordance with the laws of England and Wales. Any dispute, claim, or matter arising out of or in connection with these terms or the Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
              <p className="text-zinc-300 mt-3">Before commencing legal proceedings, the parties agree to attempt to resolve any dispute in good faith by negotiation. Either party may give written notice of a dispute and the parties will use reasonable efforts to resolve it within 30 days.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white font-heading">15. General</h2>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                <li><strong>Entire agreement:</strong> These terms, together with our Privacy Policy and Acceptable Use Policy, constitute the entire agreement between you and L8EntSpace regarding the Service.</li>
                <li><strong>Severability:</strong> If any provision of these terms is found to be unenforceable, that provision will be modified to the minimum extent necessary, and the remaining provisions will continue in full force.</li>
                <li><strong>No waiver:</strong> Our failure to enforce any right or provision does not constitute a waiver of that right.</li>
                <li><strong>Assignment:</strong> You may not assign your rights or obligations under these terms without our prior written consent. We may assign our rights to a successor in connection with a merger, acquisition, or sale of assets.</li>
                <li><strong>Notices:</strong> Notices to L8EntSpace must be sent to <a href="mailto:sales@l8entspace.com" className="text-pink-400 hover:text-pink-300">sales@l8entspace.com</a>. Notices to you will be sent to the email address on your account.</li>
              </ul>
            </section>

            <section className="bg-zinc-900/30 border border-pink-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-3 text-white font-heading">Questions About These Terms</h2>
              <p className="text-zinc-300 text-sm">Email us at <a href="mailto:sales@l8entspace.com" className="text-pink-400 hover:text-pink-300">sales@l8entspace.com</a>. We aim to respond to all queries within 2 business days.</p>
              <p className="text-zinc-500 text-xs mt-3">Also see our <a href="/privacy" className="text-pink-400/70 hover:text-pink-300">Privacy Policy</a> and <a href="/acceptable-use" className="text-pink-400/70 hover:text-pink-300">Acceptable Use Policy</a>.</p>
            </section>

          </div>
        </div>
      </main>
      <Footerdemo />
    </div>
  );
}
