import React from 'react';

const DPA: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Data Processing Addendum (DPA)</h1>
          <p className="text-slate-700 mb-6">This DPA forms part of the agreement between Auspexi Ltd ("Processor") and Customer ("Controller") when Auspexi processes Personal Data on behalf of Customer.</p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Subject Matter, Duration, and Nature</h2>
            <p className="text-slate-700">Subject matter: provision of synthetic data platform and services. Duration: term of the underlying agreement. Nature and purpose: hosting, processing, and transmission of data strictly to provide the services.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Roles and Instructions</h2>
            <p className="text-slate-700">Customer is Controller; Auspexi is Processor. Auspexi processes Personal Data only on documented instructions from Customer, including transfers, unless required by law (in which case Auspexi will notify Customer unless prohibited).</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Security</h2>
            <p className="text-slate-700">Auspexi implements appropriate technical and organisational measures proportionate to risk, including encryption in transit and at rest, access controls, logging, incident response, and secure development practices. Architecture is synthetic‑first; public seeds are hashed; zk‑proof workflows are available on request.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Confidentiality</h2>
            <p className="text-slate-700">Auspexi ensures persons authorised to process Personal Data are subject to confidentiality obligations.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Sub‑processors</h2>
            <p className="text-slate-700">Customer provides general authorisation to engage sub‑processors. Auspexi maintains a current <a href="/subprocessors" className="text-blue-600 underline">Subprocessors</a> list and will notify Customer of material changes. Auspexi imposes data protection obligations on sub‑processors equivalent to this DPA.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">6. International Transfers</h2>
            <p className="text-slate-700">For EU/UK data, the EU Standard Contractual Clauses (SCCs) and UK IDTA/UK Addendum apply as applicable. Additional transfer safeguards (encryption, access controls) are maintained.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">7. Assistance</h2>
            <p className="text-slate-700">Auspexi will assist Customer, insofar as possible, with obligations to respond to data subject requests and comply with Articles 32–36 GDPR (security, breach notification, DPIA, consultation) given the nature of processing and information available.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">8. Breach Notification</h2>
            <p className="text-slate-700">Auspexi will notify Customer without undue delay after becoming aware of a Personal Data Breach, providing details of the nature, likely consequences, and measures taken or proposed.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">9. Audit and Compliance</h2>
            <p className="text-slate-700">Upon reasonable notice, Auspexi will make available information necessary to demonstrate compliance and allow audits by Customer or an independent auditor mandated by Customer, subject to confidentiality, scheduling, and scope limitations.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">10. Return or Deletion</h2>
            <p className="text-slate-700">Upon termination, at Customer’s choice, Auspexi will return or securely delete Personal Data, unless retention is required by law.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">11. Contact</h2>
            <p className="text-slate-700">For privacy questions, contact: sales@auspexi.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DPA;


