import React from 'react';

const PipelinesOverview: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-3">Pipelines Overview</h3>
      <p className="text-slate-600 mb-4">
        Design multi‑schema datasets, orchestrate multi‑domain pipelines, and generate evidence‑backed outputs for LLMs or niche models.
      </p>
      <ul className="list-disc pl-5 text-slate-700 text-sm space-y-2">
        <li>Schema Designer: define/harmonize schemas across domains</li>
        <li>Pipeline Orchestration: cross‑domain synthesis & ablations</li>
        <li>Evidence Bundles: export verification for each stage</li>
        <li>Compute: Self‑Hosted or Full‑Service AWS</li>
      </ul>
      <div className="mt-6">
        <a href="/resources" className="text-blue-600 hover:text-blue-700 font-medium">View resources →</a>
      </div>
    </div>
  );
};

export default PipelinesOverview;



