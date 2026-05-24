import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-slate-200">
      <h1 className="text-3xl font-extrabold mb-4">Terms of Service</h1>
      <p className="mb-6 text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">These Terms govern your use of AethergenPlatform (the "Service"). By accessing or using the Service, you agree to these Terms.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Accounts</h2>
      <p className="mb-4">You are responsible for safeguarding the credentials that you use to access the Service. You must notify us immediately upon becoming aware of any security breach.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Acceptable Use</h2>
      <ul className="list-disc pl-6 space-y-1 text-slate-300">
        <li>Do not attempt to re‑identify individuals from synthetic datasets.</li>
        <li>Do not use the Service to violate applicable law or regulation.</li>
        <li>Respect intellectual property rights and licence terms.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Subscriptions and Payments</h2>
      <p className="mb-4">Certain parts of the Service are billed on a subscription basis or as one‑time purchases (e.g., prediction credits). Payments are processed by Stripe. Prices and features are subject to change on notice.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Content and IP</h2>
      <p className="mb-4">We retain rights to the platform, innovations, and evidence formats. You retain rights to your inputs and outputs subject to third‑party licences. Public claims about metrics must be accompanied by evidence bundles.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimers</h2>
      <p className="mb-4">The Service is provided "as is" without warranty. We disclaim all implied warranties of merchantability, fitness for a particular purpose, and non‑infringement to the extent permitted by law.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Limitation of Liability</h2>
      <p className="mb-4">To the maximum extent permitted by law, AUSPEXI Ltd shall not be liable for indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="mb-2">AUSPEXI Ltd, 123 Data Lane, London EC1A 1AA, UK</p>
      <p>Email: <a className="text-emerald-400 underline" href="mailto:sales@auspexi.com">sales@auspexi.com</a></p>
    </div>
  );
};

export default TermsOfService;



