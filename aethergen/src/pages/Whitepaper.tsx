import React from 'react';
import SEO from '../components/SEO';
import BackButton from '../components/BackButton';

const Whitepaper: React.FC = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      name: 'AethergenPlatform Whitepaper (v1)',
      headline: 'Evidence-led synthetic data generation and delivery to Databricks',
      url: 'https://auspexi.com/whitepaper',
      datePublished: new Date().toISOString().slice(0, 10),
      author: {
        '@type': 'Organization',
        name: 'Auspexi',
        url: 'https://auspexi.com'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Auspexi',
        url: 'https://auspexi.com'
      },
      citation: 'https://auspexi.com/brand.json',
      isPartOf: {
        '@type': 'WebSite',
        name: 'AethergenPlatform',
        url: 'https://auspexi.com'
      },
      about: {
        '@type': 'Thing',
        name: 'Synthetic data generation and Databricks workflows'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Whitepaper – AethergenPlatform"
        description="Evidence-led synthetic data, calibration without raw transfer, and Unity Catalog delivery with signed provenance."
        canonical="https://auspexi.com/whitepaper"
        jsonLd={jsonLd}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6"><BackButton to="/" label="Back to Home" /></div>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">AethergenPlatform – Technical Whitepaper (Public)</h1>
        <p className="text-slate-700 mb-8">
          This document describes the public, implementation‑agnostic design of AethergenPlatform: a governed synthetic data and model delivery platform.
          It focuses on reproducibility, privacy, and enterprise delivery. Proprietary internals are intentionally omitted.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-sm">
          <a href="#abstract" className="text-blue-600 hover:underline">Abstract</a>
          <a href="#architecture" className="text-blue-600 hover:underline">Architecture (High Level)</a>
          <a href="#calibration" className="text-blue-600 hover:underline">Calibration without Raw Data</a>
          <a href="#evidence" className="text-blue-600 hover:underline">Evidence Model</a>
          <a href="#context" className="text-blue-600 hover:underline">Context Engineering Layer</a>
          <a href="#delivery" className="text-blue-600 hover:underline">Unity Catalog Delivery</a>
          <a href="#safety" className="text-blue-600 hover:underline">Privacy & Safety</a>
          <a href="#sustainability" className="text-blue-600 hover:underline">Sustainability</a>
          <a href="#limitations" className="text-blue-600 hover:underline">Limitations & Responsible Use</a>
          <a href="#roadmap" className="text-blue-600 hover:underline">Roadmap (Public)</a>
          <a href="#risk-guard" className="text-blue-600 hover:underline">Pre‑generation Risk Guard</a>
        </div>

        <section id="abstract" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Abstract</h2>
          <p className="text-slate-800">
            AethergenPlatform enables evidence‑led synthesis and delivery of AI datasets and models. Calibration uses <b>anchor bundles</b> (aggregates) and/or
            <b> ZKP‑protected seeds</b> rather than raw data transfer. Outputs are packaged with <b>signed evidence</b> and delivered to <b>Unity Catalog</b> under
            change control. Acceptance gates (utility, privacy, stability) are fail‑closed to ensure responsible adoption.
          </p>
        </section>

        <section id="context" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Context Engineering Layer</h2>
          <p className="text-slate-800 mb-3">We add a retrieval‑first layer that improves context quality before generation. Hybrid retrieval (BM25 + dense + reranker) is combined with MMR de‑duplication and boosts for recency and source trust.</p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li><b>Signals:</b> retrieval_margin, support_docs, recency_score, source_trust, format_health</li>
            <li><b>Policy:</b> signals feed the Risk Guard; if support is thin, fetch more context, ask to clarify, or abstain</li>
            <li><b>Evidence:</b> context_provenance.json records signals and included sources for audit</li>
          </ul>
        </section>

        <section id="architecture" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Architecture (High Level)</h2>
          <ul className="list-disc ml-6 text-slate-800 space-y-2">
            <li><b>Schema Designer</b>: governs ontology, units, constraints; composes multi‑domain data under one contract.</li>
            <li><b>Generation</b>: streaming synthesis with quotas and guardrails; seeded and reproducible.</li>
            <li><b>Calibration</b>: anchors/ZKP seeds align distributions/structure without exposing raw rows.</li>
            <li><b>Evaluation</b>: privacy probes, utility metrics (KS/TV, AUC/F1), stability and drift checks.</li>
            <li><b>Evidence</b>: signed bundle with provenance and acceptance results; anchor_hash recorded.</li>
            <li><b>Delivery</b>: UC objects (Catalog/Schema/Volumes) with comments/tags and Marketplace packaging.</li>
            <li><b>Policy Guard</b>: entitlements, geo/sector denies, kill switch for revocation.</li>
          </ul>
          <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">On‑Device AI: Hybrid Routing & SLOs</h3>
          <p className="text-slate-700 mb-2">Supported modes: device‑only, hybrid (device first, cloud fallback), and cloud‑only. Hybrid is default. Routing prefers CPU/NPU for gates and re‑rankers and promotes to cloud when constraints are exceeded.</p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1 mb-4">
            <li>Fallback‑rate SLO: at most r_max of requests may route to cloud.</li>
            <li>Battery budget: per‑inference energy cap E_max (mWh) by device class.</li>
            <li>Thermal guard: max temperature delta ΔT_max (°C) relative to baseline.</li>
          </ul>
          <p className="text-slate-700 mb-4">Selective thresholds can be tuned per device segment to satisfy coverage and accuracy while respecting these SLOs. Evidence includes device‑class tags and sampled telemetry summaries; raw data remains on device.</p>
        </section>

        <section id="calibration" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Calibration without Raw Data</h2>
          <p className="text-slate-800 mb-3">
            Customers can provide <b>anchor bundles</b>—DP‑friendly aggregates (counts, quantiles, correlations, tails, segment mixes)—or <b>ZKP seeds</b> with proofs.
            Anchors calibrate distributions; seeds validate structure. Both avoid raw data exposure and are referenced by a stable <b>anchor_hash</b> in evidence.
          </p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Segmented anchors enable per‑segment stability and drift monitoring.</li>
            <li>Temporal anchors capture windows/seasonality without raw joints.</li>
            <li>DP budgets (ε, δ) are optional; posture is documented in evidence.</li>
          </ul>
        </section>

        <section id="evidence" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Evidence Model</h2>
          <p className="text-slate-800 mb-3">
            Evidence is a signed, reproducible package: provenance, privacy probes, utility and stability metrics, ablations, manifests, and checksums. Auditors can
            independently verify integrity and acceptance results.
          </p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Provenance includes <b>anchor_hash</b>, schema versions, recipe IDs, and artifact checksums.</li>
            <li>Acceptance gates (utility/privacy/stability) are explicit; failure states block promotion.</li>
            <li>Redacted public variants are available for external sharing.</li>
          </ul>
        </section>

        <section id="evaluators" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Always‑on Evaluators (SLM)</h2>
          <p className="text-slate-800 mb-3">Compact small language models run continuously to score safety/quality metrics per turn (e.g., prompt injection, PII leak, toxicity, bias, jailbreak, tool errors). Scores inform the Risk Guard and can fail‑close responses when thresholds are exceeded.</p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li><b>Thresholds:</b> per‑metric, segment‑aware; configurable with a fail‑closed policy.</li>
            <li><b>Evidence:</b> evaluation events and summaries are embedded in signed evidence bundles.</li>
            <li><b>Runtime:</b> CPU/NPU‑first; GPU optional; parallelise cheap checks, sample heavy ones.</li>
          </ul>
        </section>

        <section id="deterministic" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Deterministic Inference (Batch‑Invariant)</h2>
          <p className="text-slate-800 mb-3">Optional deterministic mode ensures identical outputs for identical prompts by fixing microbatching and precision and selecting deterministic kernels. This strengthens reproducibility for research, safety, and audits.</p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li><b>Mechanics:</b> microbatch=1 on critical paths; float32 matmul; fixed KV cache precision; deterministic attention where available.</li>
            <li><b>Policy:</b> high‑risk and acceptance evaluations run in deterministic mode; fast paths may remain non‑deterministic.</li>
            <li><b>Evidence:</b> determinism_profile.json summarizes flags, kernels, unique_outputs over N runs, and slowdown_factor.</li>
          </ul>
        </section>

        <section id="evidence-scale" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Evidence at Scale</h2>
          <p className="text-slate-800 mb-3">Large‑scale runs (e.g., 1B queries) summarise resource savings and decision quality in evidence: token and latency reduction, large‑model call avoidance, and evaluator summaries. Procurement can verify signatures and thresholds.</p>
        </section>

        <section id="hallucination-controls" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Hallucination Controls (Runtime)</h2>
          <p className="text-slate-800 mb-3">
            In high‑reliability domains we reduce the impact of hallucinations at decision time. We optimize a 3‑state objective (correct, abstain, wrong), reward calibrated
            abstention over confident error, and gate answers behind lightweight checks for information sufficiency and verification.
          </p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li><b>Information‑sufficiency gating</b>: detect thin support; route to retrieval/tools, clarification, or abstain.</li>
            <li><b>Verification</b>: schema/units/range checks, citation consistency, fail‑closed if unverifiable.</li>
            <li><b>Coverage–precision tuning</b>: pick operating points per risk class and latency budget.</li>
            <li><b>Shadow evals + SLOs</b>: changes run under utility, stability, privacy, and latency gates; breaches trigger rollback.</li>
          </ul>
          <p className="text-slate-700 mt-3 text-sm">A simple falsifiable check: clamp latency and coverage, then measure wrong‑answer rate and re‑ask rate on a fresh‑news holdout pre/post gating.</p>
        </section>

        <section id="risk-guard" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Pre‑generation Risk Guard</h2>
          <p className="text-slate-800 mb-3">We estimate hallucination risk <b>before</b> generation using signals such as margin, entropy, retrieval support, and optional self‑consistency. A calibrated threshold bounds the hallucination rate (e.g., ≤ 5%) on held‑out data.</p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li><b>Calibration:</b> select target rate and compute a risk threshold that satisfies it on samples.</li>
            <li><b>Policy:</b> below threshold → generate; above → fetch more context; far above → abstain or reroute.</li>
            <li><b>Evidence:</b> thresholds and outcomes can be logged for audit alongside selective prediction and SLOs.</li>
        </ul>
          <p className="text-slate-600 text-sm mt-3">Related work: Hassana Labs hallucination risk toolkit (<a className="text-blue-600 hover:underline" href="https://hassana.io/readme.html">link</a>), OpenAI “Why language models hallucinate” (<a className="text-blue-600 hover:underline" href="https://cdn.openai.com/pdf/d04913be-3f6f-4d2b-b283-ff432ef4aaa5/why-language-models-hallucinate.pdf">PDF</a>).</p>
        </section>

        <section id="delivery" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Unity Catalog Delivery</h2>
          <p className="text-slate-800 mb-3">
            Enterprise deliveries create/verify UC objects (Catalog/Schema/Volumes), apply grants/tags, and attach evidence references. Marketplace packaging and private
            offers reference the same evidence for buyer due diligence.
          </p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Least‑privilege, change‑controlled operations; you retain ownership.</li>
            <li>Comments and tags carry manifest refs and hashes for auditors.</li>
            <li>Promotion across Dev/Stage/Prod is documented and reversible.</li>
          </ul>
        </section>

        <section id="safety" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Privacy & Safety</h2>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Privacy: membership/attribute/linkage probes; optional DP accounting.</li>
            <li>Safety: entitlements, geo/sector denies, and a kill switch for revocation.</li>
            <li>Responsible disclosures: evidence notes intended use, limits, and failure modes.</li>
          </ul>
        </section>

        <section id="sustainability" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Sustainability</h2>
          <p className="text-slate-800 mb-3">Optional carbon/energy summaries can be embedded in evidence, with methodology and assumptions clearly stated.</p>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Efficiency deltas (quantization/pruning/early‑stopping) help reduce footprint without sacrificing acceptance KPIs.</li>
            <li>Device‑aware estimates where measured data is not available.</li>
          </ul>
        </section>

        <section id="limitations" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Limitations & Responsible Use</h2>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Illustrative packs are for exploration only; production requires calibration and passing acceptance gates.</li>
            <li>Anchors/seeds quality bounds outcomes; poor anchors widen uncertainty or fail gates.</li>
            <li>Sector policies may restrict usage; violations lead to revocation.</li>
          </ul>
        </section>

        <section id="roadmap" className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Roadmap (Public)</h2>
          <ul className="list-disc ml-6 text-slate-800 space-y-1">
            <li>Richer anchor tooling and validation notebooks.</li>
            <li>Automated evidence dashboards and Marketplace workflows.</li>
            <li>Sustainability reporting options and governance integrations.</li>
          </ul>
        </section>

        <div className="text-sm text-slate-600">
          See also: <a href="/faq" className="text-blue-600 hover:underline">FAQ</a> · <a href="/technology" className="text-blue-600 hover:underline">Technology</a>
        </div>
      </div>
    </div>
  );
};

export default Whitepaper;


