'use client';

import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';

export function TermsOfServicePage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-8">Terms of Service</h1>
          <p className="text-zinc-400 mb-12">Last updated: April 2026</p>
          
          <div className="prose prose-invert prose-zinc max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                By accessing and using Auspexi ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Intellectual Property and Copyright</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of Auspexi and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Auspexi.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white">3. Prohibited Uses & Anti-Reverse Engineering</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the business of Auspexi, or our general operations.
              </p>
              <p className="text-zinc-300 leading-relaxed mb-4">
                <strong>Specifically, you strictly agree NOT to:</strong>
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2 mb-4">
                <li>Reverse engineer, decompile, disassemble, decipher or otherwise attempt to derive the source code for any underlying intellectual property used to provide the Service.</li>
                <li>Copy, distribute, or disclose any part of the Service in any medium, including without limitation by any automated or non-automated "scraping".</li>
                <li>Create derivative works based on the Service, or copy its features, functions, or graphics to build a competitive product ("copycatting").</li>
                <li>Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Limitation of Liability</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                In no event shall Auspexi, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2 mb-4">
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>Any content obtained from the Service; and</li>
                <li>Unauthorized access, use or alteration of your transmissions or content.</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mb-4 uppercase font-semibold">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. AUSPEXI EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Termination</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Governing Law</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
