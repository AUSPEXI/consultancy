import React from 'react'

export const DocsCIEvidence: React.FC = () => {
  const workflowSnippet = `.github/workflows/evidence.yml
- Checkout
- Setup Node 20
- npm ci (install puppeteer)
- node scripts/generate-evidence.cjs
- Upload artifacts/**
- PR comment: bundle and manifest hashes`

  const scriptSnippet = `scripts/generate-evidence.cjs
- Build signed ZIP: metrics/, plots/, configs/, seeds/, privacy/, sbom.json, manifest.json, index.json
- Compute per-file SHA-256; write bundle-hash.txt and manifest-hash.txt
- Render PDF dashboards to artifacts/pdf/*.pdf`

  const layoutSnippet = `index.json
├─ metrics/
│  ├─ utility@op.json
│  ├─ stability_by_segment.json
│  ├─ drift_early_warning.json
│  └─ latency.json
├─ plots/
│  ├─ op_tradeoffs.html
│  ├─ stability_bars.html
│  └─ roc_pr.html
├─ configs/
│  ├─ evaluation.yaml
│  └─ thresholds.yaml
├─ privacy/
│  ├─ probes.json
│  └─ dp.json
├─ sbom.json
├─ manifest.json
├─ metadata/env_fingerprint.json
└─ seeds/seeds.txt`

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">CI & Evidence Bundles</h1>
        <p className="text-gray-700 mb-4">Evidence is generated automatically in CI to ensure reproducibility and auditability.</p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Workflow</h2>
        <pre className="bg-gray-50 p-4 rounded border overflow-x-auto text-sm"><code>{workflowSnippet}</code></pre>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Script</h2>
        <pre className="bg-gray-50 p-4 rounded border overflow-x-auto text-sm"><code>{scriptSnippet}</code></pre>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">ZIP Layout</h2>
        <pre className="bg-gray-50 p-4 rounded border overflow-x-auto text-sm"><code>{layoutSnippet}</code></pre>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Verification</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Record bundle and manifest hashes from PR comment.</li>
          <li>Verify manifest.json hashes match files.</li>
          <li>Review PDFs offline; reproduce with seeds/configs.</li>
        </ul>
      </div>
    </div>
  )
}


