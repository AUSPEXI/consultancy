import React from 'react'
import { Link } from 'react-router-dom'
import { faqSections } from '../content/faqData'

const QA: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Platform vs Enterprise? What am I buying?',
    a: (
      <>
        <p className="mb-2"><b>Platform (Tools)</b>: generator, schema designer, benchmarks, evidence export. Great for prototyping, demos, and internal R&D.</p>
        <p><b>Enterprise (Managed on Databricks)</b>: we operate compute on your Databricks and deliver datasets/models in Unity Catalog with SLAs and signed evidence.</p>
      </>
    )
  },
  {
    q: 'Illustrative vs Production‑calibrated outputs?',
    a: (
      <>
        <p className="mb-2"><b>Illustrative</b> (pre‑calibration): simulation with guardrails for exploration and demos.</p>
        <p><b>Production‑calibrated</b>: calibrated with anchors or ZKP seeds and must pass acceptance gates (utility, privacy, drift). Delivered with evidence.</p>
      </>
    )
  },
  {
    q: 'Do we need real data to calibrate?',
    a: (
      <>
        <p>No raw rows. Provide <b>anchor bundles</b> (DP aggregates, histograms/quantiles, correlations, tails, segment mixes) or upload <b>ZKP‑protected seeds</b>. Both paths avoid exposing raw data to us.</p>
      </>
    )
  },
  {
    q: 'How does a customer create an anchor bundle?',
    a: (
      <>
        <p>Use our notebooks/SQL templates in your environment (Databricks, Snowflake, BigQuery) to compute DP‑friendly summaries. Export JSON (per‑field stats, correlations, segment mixes) and upload via <b>Upload → Anchor Bundle</b> or API.</p>
      </>
    )
  },
  {
    q: 'Why use the Schema Designer if we already have anchors?',
    a: (
      <>
        <p>The schema is the <b>contract</b>: ontology, units, constraints, lineage, policy gates. It unifies multiple systems, enables counterfactuals, and governs new scenarios safely.</p>
      </>
    )
  },
  {
    q: 'What is in the evidence bundle?',
    a: (
      <>
        <p>Signed JSON with provenance, privacy probes (ε/δ, re‑id, attribute, MI), utility (KS/TV/task), ablations, and checksums. See <Link to="/resources">Resources</Link>.</p>
      </>
    )
  },
  {
    q: 'Where is the anchor hash recorded?',
    a: (
      <>
        <p>The signed evidence zip includes <code>provenance/anchors.json</code> with the <b>anchor_hash</b> and timestamp, plus a manifest and signatures.</p>
      </>
    )
  },
  {
    q: 'How are Unity Catalog deliveries set up?',
    a: (
      <>
        <p>We create/verify Catalog/Schema/Volumes in your UC, stage assets, set grants/tags, and attach evidence. You retain ownership; we operate under change control.</p>
      </>
    )
  },
  {
    q: 'Safety and kill switch?',
    a: (
      <>
        <p>Policy Guard enforces entitlements, geo/sector deny, and thresholds. Breaches trigger the <b>kill switch</b> to revoke access and quarantine assets.</p>
      </>
    )
  },
  {
    q: 'How do privacy controls work (DP and probes)?',
    a: (
      <>
        <p>We support differential privacy budgets (ε/δ) and disclosure probes (membership, attribute, linkage). Privacy posture and results are embedded in the evidence bundle.</p>
      </>
    )
  },
  {
    q: 'Can we upload ZKP seeds instead of anchors?',
    a: (
      <>
        <p>Yes. ZKP seed uploads keep rows private while allowing calibration. Choose anchors, ZKP seeds, or both. Both paths avoid raw data transfer.</p>
      </>
    )
  },
  {
    q: 'Streams vs historical datasets?',
    a: (
      <>
        <p><b>Streams</b>: continuous generation with SLAs. <b>Datasets</b>: versioned historical tables with evidence. Both can be delivered to UC.</p>
      </>
    )
  },
  {
    q: 'How do SLAs and support differ across tiers?',
    a: (
      <>
        <p>Platform provides tools and community/standard support. Enterprise adds managed compute, UC delivery, and formal SLAs (availability, refresh cadence, change control).</p>
      </>
    )
  },
  {
    q: 'What about governance and audit?',
    a: (
      <>
        <p>Evidence bundles are signed and include provenance, metrics, and manifests. We maintain change logs and incident hooks; customers can archive bundles alongside approvals.</p>
      </>
    )
  },
  {
    q: 'How is Databricks Marketplace used?',
    a: (
      <>
        <p>Enterprise deliveries can be packaged for Marketplace listings or private offers. Listings reference UC assets, quickstart notebooks, and evidence.</p>
      </>
    )
  },
  {
    q: 'Edge/air‑gapped packaging?',
    a: (
      <>
        <p>We provide signed, offline packages with manifests, QR verification, and SOPs. Ideal for constrained or regulated environments.</p>
      </>
    )
  },
  {
    q: 'How are segments and stability handled?',
    a: (
      <>
        <p>We report stability and drift by segment; acceptance gates can require max deltas and confidence intervals. Fail‑closed by default.</p>
      </>
    )
  },
  {
    q: 'What happens if anchors are low quality?',
    a: (
      <>
        <p>Calibration fails gates or yields wider uncertainty. We offer an <b>Anchor Assist</b> add‑on (notebooks + validation) to improve bundles without sharing rows.</p>
      </>
    )
  },
  {
    q: 'Can we combine multiple domains/sources?',
    a: (
      <>
        <p>Yes. The schema designer harmonizes sources under one governed contract. Provide anchors per domain/segment; evidence traces lineage.</p>
      </>
    )
  },
  {
    q: 'What’s the minimum to start?',
    a: (
      <>
        <p>Platform: no data required for illustrative scenarios. To go production, provide an anchor bundle or ZKP seeds and target KPIs for acceptance.</p>
      </>
    )
  },
]

const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">FAQ</h1>
          <p className="text-blue-100 text-lg max-w-3xl">Clear answers about Platform vs Enterprise, calibration, anchors and ZKP seeds, UC delivery, and evidence.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Topics */}
          <div className="mb-8 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-700">Topics:</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {faqSections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="text-blue-600 hover:underline">{s.title}</a>
              ))}
            </div>
          </div>

          {faqSections.map(section => (
            <div key={section.id} id={section.id} className="mt-16 pt-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.items.map((it, i) => (
                  <div key={i} className="border rounded-xl p-4">
                    <div className="font-semibold text-slate-900">{it.q}</div>
                    <div className="text-slate-700 text-sm mt-1">{it.a}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 text-sm text-slate-600">
            See also: <Link to="/pricing" className="text-blue-600 hover:underline">Pricing</Link> · <Link to="/technology" className="text-blue-600 hover:underline">Technology</Link> · <Link to="/resources" className="text-blue-600 hover:underline">Resources</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FAQ


