import React from 'react';

const Subprocessors: React.FC = () => {
  const subprocessors = [
    {
      name: 'Netlify (Hosting/Functions)',
      purpose: 'Website hosting, serverless functions, CDN',
      location: 'EU/UK/US regions as configured',
      dataCategories: 'Operational logs, minimal service metadata',
      DPA: 'https://www.netlify.com/gdpr-ccpa/',
    },
    {
      name: 'Supabase (Database/Auth)',
      purpose: 'Application persistence, authentication',
      location: 'EU/UK/US regions as configured',
      dataCategories: 'Account metadata, operational data',
      DPA: 'https://supabase.com/privacy',
    },
    {
      name: 'Stripe (Payments)',
      purpose: 'Payment processing, subscription billing',
      location: 'EU/US',
      dataCategories: 'Billing details (handled by Stripe), receipts',
      DPA: 'https://stripe.com/guides/general-data-protection-regulation',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Subprocessors</h1>
          <p className="text-slate-700 mb-6">We use carefully selected subprocessors to deliver the service. We impose equivalent data protection obligations via contract. You can subscribe to updates by emailing sales@auspexi.com.</p>

          <div className="divide-y divide-slate-200">
            {subprocessors.map((sp, i) => (
              <div key={i} className="py-4">
                <h2 className="text-xl font-semibold text-slate-900">{sp.name}</h2>
                <p className="text-slate-700"><strong>Purpose:</strong> {sp.purpose}</p>
                <p className="text-slate-700"><strong>Location:</strong> {sp.location}</p>
                <p className="text-slate-700"><strong>Data Categories:</strong> {sp.dataCategories}</p>
                <p className="text-slate-700"><strong>DPA/Docs:</strong> <a className="text-blue-600 underline" href={sp.DPA} target="_blank" rel="noreferrer">Link</a></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subprocessors;


