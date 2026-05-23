import React from 'react';

const TermsOfUse = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-md">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Terms of Use</h1>
        <p className="text-blue-600 mb-6">Effective Date: June 15, 2025</p>
        <p className="text-slate-700 mb-6">These Terms of Use ("Terms") govern your use of the Government Suite datasets provided by Auspexi Ltd ("Auspexi," "we," "us," or "our"), a UK-based company, via government.auspexi.com, auspexi.com/data-suites, or third-party marketplaces (e.g., Databricks Marketplace). The Government Suite includes eight synthetic-first datasets: CHANGES, POISON, STRIVE, HYDRA, SIREN, REFORM, INSURE, and SHIELD. By accessing or purchasing our datasets, you agree to these Terms, our Privacy Policy, and applicable marketplace terms.</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Dataset Description</h2>
          <p className="text-slate-700">Overview: Generates 1 million data points per day, with 43% real/enhanced data from global public sources and 57% synthetic data via 20 AI models (e.g., DistilBERT, CTGAN, T5-Small).</p>
          <p className="text-slate-700 mt-2">Suites:</p>
          <ul className="list-disc list-inside text-slate-700 ml-4">
            <li>CHANGES: Healthcare epidemiological simulations.</li>
            <li>POISON: Policing sentiment and optimization.</li>
            <li>STRIVE: Military strategic simulations.</li>
            <li>HYDRA: Fire service risk modeling.</li>
            <li>SIREN: EMS response optimization.</li>
            <li>REFORM: Prison rehabilitation metrics.</li>
            <li>INSURE: Cross-sector insurance risk evaluation.</li>
            <li>SHIELD: Cybersecurity insurance threat modeling.</li>
          </ul>
          <p className="text-slate-700 mt-2">Add-Ons: 4 core (sentimentDynamics, behaviorPrediction, environmentalImpact, resourceOptimization) and 4 premium (network, optimization, clustering, forecasting).</p>
          <p className="text-slate-700 mt-2">Privacy: SHA-256 hashing for real data; full zk-SNARKs planned for Q4 2025; no PII/PHI.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Client Compliance Support</h2>
          <p className="text-slate-700">Our datasets help clients meet:</p>
          <ul className="list-disc list-inside text-slate-700 ml-4">
            <li>Healthcare: HIPAA, NHS DSPT for CHANGES/SIREN.</li>
            <li>Military: MoD JSP 440, NATO STANAG for STRIVE.</li>
            <li>Policing: NPCC, DOJ for POISON.</li>
            <li>Cybersecurity: NIST SP 800-53, CISA for SHIELD.</li>
            <li>Insurance: NAIC, Solvency II for INSURE/SHIELD.</li>
          </ul>
          <p className="text-slate-700 mt-2">Benefit: Synthetic data provides realistic scenarios without privacy risks, simplifying client compliance.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">3. License and Permitted Uses</h2>
          <p className="text-slate-700">License: Non-exclusive, non-transferable, revocable for:</p>
          <ul className="list-disc list-inside text-slate-700 ml-4">
            <li>Internal analytics, research, simulations.</li>
            <li>AI model/application development, compliant with Terms.</li>
            <li>Commercial use, subject to restrictions.</li>
          </ul>
          <p className="text-slate-700 mt-2">Delivery: Static datasets, streaming subscriptions, or hosted platform access. Self‑service (customer‑managed compute) and full‑service (we deploy/manage in customer AWS) options available.</p>
          <p className="text-slate-700 mt-2">Attribution: Credit Auspexi in public outputs.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Restrictions</h2>
          <p className="text-slate-700">You may not:</p>
          <ul className="list-disc list-inside text-slate-700 ml-4">
            <li>Resell, sublicense, or redistribute without consent.</li>
            <li>Use for unlawful purposes or privacy violations.</li>
            <li>Reverse-engineer to extract real data.</li>
            <li>Alter metadata (e.g., hash logs).</li>
            <li>Compete with Auspexi's services.</li>
            <li>For Full‑Service deployments: attempt to access underlying infrastructure, platform code, or managed secrets beyond the agreed scope.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Pricing and Payment</h2>
          <p className="text-slate-700">Pricing is published on the Pricing page and/or in marketplace listings. Enterprise and Full‑Service deployments are quoted separately and may include setup fees, minimum terms, and managed infrastructure costs.</p>
          <p className="text-slate-700 mt-2">Payment: Via Stripe or marketplaces, or invoice (enterprise). Taxes, duties, and withholding are your responsibility.</p>
          <p className="text-slate-700 mt-2">Taxes: Your responsibility.</p>
          <p className="text-slate-700 mt-2">Refunds: Non-refundable, except for delivery failures within 7 days.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Intellectual Property</h2>
          <p className="text-slate-700">Ownership: Auspexi owns datasets, AI models, pipelines and platform code (including managed deployments). White‑label source code access is available only under a separate license agreement.</p>
          <p className="text-slate-700 mt-2">Your Data: You own derived outputs, compliant with Terms.</p>
          <p className="text-slate-700 mt-2">Feedback: Becomes Auspexi's property.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">7. Compliance</h2>
          <p className="text-slate-700">Our Compliance: Synthetic‑first architecture with hashed public seeds, optional zk‑proof workflows, and no PHI/PII processing by default. Designed to support UK/EU GDPR, HIPAA, CCPA/CPRA, ISO 27001, NIST SP 800‑53, MoD JSP 440. Specific certifications and attestations available on request.</p>
          <p className="text-slate-700 mt-2">Customer Compliance: You are responsible for your regulatory posture and end‑use. We provide a <a href="/dpa" className="text-blue-600 underline">DPA</a> for Processor scenarios and will cooperate on customer‑specific security questionnaires and reasonable audits (with NDAs, scheduling, and scope limits).</p>
          <p className="text-slate-700 mt-2">White‑Label & Sovereign Deployments: For sensitive customers (e.g., MoD), we can license and ship code for review and deployment in customer‑owned secure networks under a separate agreement (license terms, IP protection, escrow optional).</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">8. Warranty and Liability</h2>
          <p className="text-slate-700">As-Is: No warranties for accuracy or fitness.</p>
          <p className="text-slate-700 mt-2">Liability: Limited to amount paid; no indirect damages.</p>
          <p className="text-slate-700 mt-2">Indemnity: You indemnify Auspexi for misuse claims.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">9. Termination</h2>
          <p className="text-slate-700">By You: Cancel subscriptions with 30 days' notice.</p>
          <p className="text-slate-700 mt-2">By Us: For breach, non-payment, or legal reasons, with 7 days' notice.</p>
          <p className="text-slate-700 mt-2">Effect: License terminates, data access ceases, derived outputs remain yours.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">11. Data Protection Addendum</h2>
          <p className="text-slate-700">If we process personal data on your behalf, our <a href="/dpa" className="text-blue-600 underline">Data Processing Addendum</a> applies and forms part of these Terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">10. Contact Information</h2>
          <p className="text-slate-700">Legal/Privacy: sales@auspexi.com</p>
          <p className="text-slate-700">General/Support: sales@auspexi.com</p>
          <p className="text-slate-700">Address: Auspexi Ltd, Surrey, United Kingdom</p>
        </section>
      </div>
    </div>
  </div>
);

export default TermsOfUse;
