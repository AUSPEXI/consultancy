import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, BookOpen, Video, Download, ExternalLink, ArrowRight,
  Shield, Target, Eye, RotateCcw, TrendingUp, Lock, Package,
  Activity, Car, Brain, Settings, Gauge, AlertTriangle,
  Users, Globe, Zap, Database, Code
} from 'lucide-react'

export const Resources: React.FC = () => {
  const technicalDocs = [
    {
      icon: TrendingUp,
      title: 'Evidence‑Efficient AI (Explainer)',
      description: 'How we achieved 72% tokens / 73% latency savings and 100% call avoidance',
      category: 'Highlights',
      link: '/blog/evidence-efficient-ai-73-percent-faster',
      type: 'Blog'
    },
    {
      icon: TrendingUp,
      title: 'A Billion Queries (Story)',
      description: 'The human journey and the 1B‑query proof with links to pilots',
      category: 'Highlights',
      link: '/blog/a-billion-queries-10-months-promise-kept',
      type: 'Blog'
    },
    {
      icon: Shield,
      title: 'Always‑on Evaluators',
      description: 'Cheap, continuous risk scoring feeding Risk Guard and evidence',
      category: 'Highlights',
      link: '/blog/always-on-evaluators-risk-guard',
      type: 'Blog'
    },
    {
      icon: Shield,
      title: 'Operational AI Guide',
      description: 'Guide to operating AI with gated promotions and rollback hooks (pilot‑scoped)',
      category: 'Technical Documentation',
      link: '/stability-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Brain,
      title: 'Context Engineering',
      description: 'Hybrid retrieval, context signals, and budget packing with evidence provenance',
      category: 'Technical Documentation',
      link: '/context-engineering',
      type: 'Guide + Demo'
    },
    {
      icon: Brain,
      title: 'Build a Model (Starters)',
      description: 'LLM, SLM, LAM, MoE, VLM, MLM, LCM, SAM — prefilled configs and evidence hooks',
      category: 'Technical Documentation',
      link: '/build',
      type: 'Gallery'
    },
    {
      icon: Gauge,
      title: 'Metrics & A/B (Dev)',
      description: 'Submit Databricks metrics jobs, run A/B experiments, compare runs, publish acceptance',
      category: 'Technical Documentation',
      link: '/ab-experiment',
      type: 'Interactive Demo'
    },
    {
      icon: Activity,
      title: 'Context Dashboard (Dev)',
      description: 'Fetch results, evaluate gates (invariance, counterfactual, stability), and export acceptance',
      category: 'Technical Documentation',
      link: '/context-dashboard',
      type: 'Interactive Demo'
    },
    {
      icon: Lock,
      title: 'Kill Switch & Policy Guard',
      description: 'Tenant/geo revocation, policy fingerprints, and UC comment linking for governance',
      category: 'Technical Documentation',
      link: '/safety',
      type: 'Guide'
    },
    {
      icon: Package,
      title: 'Air-Gapped Packaging Guide',
      description: 'How to generate secure edge bundles with manifests, QR codes, and field verification',
      category: 'Technical Documentation',
      link: '/air-gapped-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Car,
      title: 'Automotive Quality Control',
      description: 'Golden run systems, calibration, and automotive-specific edge packaging',
      category: 'Technical Documentation',
      link: '/automotive-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Database,
      title: 'Dataset & Model Cards',
      description: 'Comprehensive documentation that buyers actually use with Unity Catalog integration',
      category: 'Technical Documentation',
      link: '/cards-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Target,
      title: 'Financial Crime Lab (Synthetic Graphs)',
      description: 'Generate synthetic transaction graphs, run typology sweeps, and evaluate OP utility & stability',
      category: 'Technical Documentation',
      link: '/financial-crime-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Shield,
      title: 'Swarm Safety (8D Topology)',
      description: 'Topological neighbors with safety clamps; resilience metrics and export',
      category: 'Technical Documentation',
      link: '/swarm-safety-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Shield,
      title: 'Insurance Fraud Playbooks',
      description: 'Generate playbooks, evaluate at OP, and export datasets for safe testing',
      category: 'Technical Documentation',
      link: '/insurance-fraud-demo',
      type: 'Interactive Demo'
    },
    {
      icon: Globe,
      title: 'Universal Marketplace',
      description: 'Platform-agnostic asset management with trial provisioning and conversion analytics',
      category: 'Technical Documentation',
      link: '/marketplace-demo',
      type: 'Interactive Demo'
    },
    // On-Device AI
    {
      icon: Zap,
      title: 'On‑Device AI (Hybrid Routing & SLOs)',
      description: 'CPU/NPU routing with fallback-rate, battery, and thermal SLOs; demo and playbook',
      category: 'Technical Documentation',
      link: '/stability-demo',
      type: 'Guide + Demo'
    }
  ]

  const bestPractices = [
    {
      icon: Target,
      title: 'SLO Configuration Best Practices',
      description: 'How to configure utility, stability, latency, and privacy SLOs for regulated environments',
      category: 'Best Practices',
      link: '/stability-demo',
      type: 'Guide'
    },
    {
      icon: Eye,
      title: 'Shadow Evaluation Implementation',
      description: 'Step-by-step guide to implementing shadow evaluation for lower‑risk model deployment',
      category: 'Best Practices',
      link: '/stability-demo',
      type: 'Guide'
    },
    {
      icon: RotateCcw,
      title: 'Automated Rollback Strategies',
      description: 'Designing effective rollback strategies with evidence logging and incident response',
      category: 'Best Practices',
      link: '/stability-demo',
      type: 'Guide'
    },
    {
      icon: TrendingUp,
      title: 'Drift Monitoring Setup',
      description: 'Implementing PSI/KS metrics with time-window analysis and segment tracking',
      category: 'Best Practices',
      link: '/stability-demo',
      type: 'Guide'
    }
  ]

  const caseStudies = [
    {
      icon: Activity,
      title: 'Healthcare AI Operations',
      description: 'How healthcare organisations can design privacy‑preserving workflows (not legal advice)',
      category: 'Case Studies',
      link: '/stability-demo',
      type: 'Use Case'
    },
    {
      icon: TrendingUp,
      title: 'Financial Services Model Risk',
      description: 'Model risk management with gated promotions and rollback hooks',
      category: 'Case Studies',
      link: '/stability-demo',
      type: 'Use Case'
    },
    {
      icon: Car,
      title: 'Automotive Quality Control',
      description: 'Quality control with golden run systems and automotive-specific edge packaging',
      category: 'Case Studies',
      link: '/automotive-demo',
      type: 'Use Case'
    }
  ]

  const apiDocs = [
    {
      icon: Settings,
      title: 'SLO Management API',
      description: 'API documentation for configuring and monitoring SLOs',
      category: 'API Documentation',
      link: '/stability-demo',
      type: 'API Reference'
    },
    {
      icon: Package,
      title: 'Air-Gapped Packaging API',
      description: 'API for generating secure edge bundles and verification systems',
      category: 'API Documentation',
      link: '/air-gapped-demo',
      type: 'API Reference'
    },
    {
      icon: Database,
      title: 'Dataset & Model Cards API',
      description: 'API for generating comprehensive documentation with Unity Catalog integration',
      category: 'API Documentation',
      link: '/cards-demo',
      type: 'API Reference'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Resources & Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to understand and implement operational AI stability with gated promotions and evidence‑led reporting
            </p>
          </div>
        </div>
            </div>

      {/* Technical Documentation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Pricing & Entitlements */}
        <div className="mb-12 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-amber-600" /> Pricing & Entitlements
          </h3>
          <p className="text-gray-700 mb-4">Rights-based tiers, compute ownership clarity, and evidence-linked SLAs.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/blog/pricing-and-entitlements-explained" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Pricing & Entitlements Explained</div>
              <div className="text-sm text-gray-600">How tiers map to real needs without cannibalisation</div>
            </Link>
            <Link to="/pricing" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Pricing Page & Calculator</div>
              <div className="text-sm text-gray-600">Explore tiers and estimate costs quickly</div>
            </Link>
            <Link to="/zero-trust-calibration" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Zero‑Trust Calibration (1‑Week)</div>
              <div className="text-sm text-gray-600">Calibrate in your Databricks, deliver signed evidence</div>
            </Link>
          </div>
        </div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 mr-3 text-blue-500" />
            Technical Documentation
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interactive demos and comprehensive guides for all our operational AI features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {technicalDocs.map((doc, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <doc.icon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{doc.type}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{doc.description}</p>
              
              <Link
                to={doc.link}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Access Demo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              {doc.title.includes('On‑Device AI') && (
                <div className="mt-3">
                  <Link to="/docs/on_device_ai_playbook" className="text-sm text-indigo-600 hover:text-indigo-700">
                    On‑Device AI Playbook
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 mr-3 text-green-500" />
              Best Practices
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Proven strategies and implementation guides for operational AI stability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {bestPractices.map((practice, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <practice.icon className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{practice.title}</h3>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">{practice.type}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{practice.description}</p>
                
                <Link
                  to={practice.link}
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  Read Guide
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 mr-3 text-purple-500" />
              Use Cases & Case Studies
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real-world applications and implementation examples for regulated industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {caseStudies.map((study, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <study.icon className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{study.title}</h3>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">{study.type}</span>
                  </div>
            </div>
                
                <p className="text-gray-600 mb-4">{study.description}</p>
                
                <Link
                  to={study.link}
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                >
                  View Use Case
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Anchor Packs */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Download className="w-8 h-8 mr-3 text-emerald-600" />
              Open Anchor Packs (v0)
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Public, attribution-friendly anchor bundles to calibrate synthetic generation without sharing raw data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <a href="/anchor-packs/nyc_taxi_anchors.json" className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition border">
              <div className="font-semibold text-gray-900 mb-1">NYC TLC Trips</div>
              <div className="text-sm text-gray-600 mb-2">Distance/time/fare quantiles; borough and hour mixes; correlations</div>
              <span className="inline-flex items-center text-emerald-700">
                Download JSON <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </a>
            <a href="/anchor-packs/sec_edgar_anchors.json" className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition border">
              <div className="font-semibold text-gray-900 mb-1">SEC EDGAR</div>
              <div className="text-sm text-gray-600 mb-2">Financial ratios & segment mixes; validate by sector and period</div>
              <span className="inline-flex items-center text-emerald-700">
                Download JSON <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </a>
            <a href="/anchor-packs/openalex_anchors.json" className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition border">
              <div className="font-semibold text-gray-900 mb-1">OpenAlex</div>
              <div className="text-sm text-gray-600 mb-2">Citations/references quantiles; field/time mixes; corr</div>
              <span className="inline-flex items-center text-emerald-700">
                Download JSON <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </a>
          </div>

          <div className="text-sm text-gray-600">
            <div className="mb-2">License/Attribution: See each JSON header. Consider adding DP noise before production use.</div>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* CI & Evidence quick section */}
          <div className="mb-16 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-indigo-500" /> CI & Evidence Bundles
            </h3>
            <p className="text-gray-600 mb-4">Signed, reproducible evidence is generated automatically in CI. Review workflow, script, and bundle layout.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/blog/evidence-bundles-and-testing" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Evidence Bundles Overview</div>
                <div className="text-sm text-gray-600">ZIP layout, hashes, PDFs, privacy, and index</div>
              </Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">CI Workflow & Script</div>
                <div className="text-sm text-gray-600">.github/workflows/evidence.yml and scripts/generate-evidence.cjs</div>
              </a>
              <Link to="/cards-demo" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Export Signed Evidence</div>
                <div className="text-sm text-gray-600">Use Cards demo to download signed ZIPs locally</div>
              </Link>
              <Link to="/ai" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">AI Communication</div>
                <div className="text-sm text-gray-600">Canonical facts page for AI indexers</div>
              </Link>
            </div>
          </div>

          {/* On‑Device AI quick info */}
          <div className="mb-16 bg-emerald-50 border border-emerald-100 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-emerald-600" /> On‑Device AI (Hybrid Routing & SLOs)
            </h3>
            <p className="text-gray-600 mb-4">CPU/NPU‑first routing with measurable SLOs: max fallback rate, battery budget, and thermal guard. See the demo and the playbook.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/stability-demo" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Stability Demo</div>
                <div className="text-sm text-gray-600">Live SLO dashboard with on‑device metrics</div>
              </Link>
              <Link to="/docs/on_device_ai_playbook" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">On‑Device AI Playbook</div>
                <div className="text-sm text-gray-600">Routing, SLOs, packaging, telemetry</div>
              </Link>
              <Link to="/blog/on-device-ai-slos-hybrid-routing" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Blog: Hybrid Routing & SLOs</div>
                <div className="text-sm text-gray-600">Implementation notes and quick start</div>
              </Link>
            </div>
          </div>

          {/* Risk Guard quick info */}
          <div className="mb-16 bg-rose-50 border border-rose-100 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-rose-600" /> Pre‑generation Hallucination Risk Guard
            </h3>
            <p className="text-gray-600 mb-4">Estimate risk before answering. Calibrate a threshold to bound hallucination rate and take actions (fetch context, abstain, reroute).</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/stability-demo" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Stability Demo</div>
                <div className="text-sm text-gray-600">Risk Guard panel with target rate & threshold</div>
              </Link>
              <Link to="/whitepaper#risk-guard" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Whitepaper</div>
                <div className="text-sm text-gray-600">Design, policy, and evidence notes</div>
              </Link>
              <Link to="/blog/hallucination-risk-guard-pre-generation" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Blog: Risk Guard</div>
                <div className="text-sm text-gray-600">Quick start with thresholds & actions</div>
              </Link>
            </div>
          </div>

          {/* Sustainability & Energy */}
          <div className="mb-16 bg-emerald-50 border border-emerald-100 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-emerald-600" /> Sustainability & Energy
            </h3>
            <p className="text-gray-600 mb-4">Evidence-led efficiency, carbon metrics, and green deployments.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/blog/ai-carbon-footprint-revolution-sustainable-computing" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">AI Carbon Footprint Revolution</div>
                <div className="text-sm text-gray-600">Metrics, monitoring, and ESG reporting</div>
              </Link>
              <Link to="/blog/energy-efficient-ai-optimization-beats-scaling" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Energy‑Efficient AI</div>
                <div className="text-sm text-gray-600">Optimization &gt; scaling; adapters, pruning, quantization</div>
              </Link>
              <Link to="/blog/green-ai-carbon-neutral-machine-learning" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
                <div className="font-semibold text-gray-900 mb-1">Green AI: Carbon‑Neutral Systems</div>
                <div className="text-sm text-gray-600">Renewables, offsets, restoration, and compliance</div>
              </Link>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Code className="w-8 h-8 mr-3 text-indigo-500" />
              API Documentation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Technical API references for integrating our operational AI features into your systems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {apiDocs.map((api, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                    <api.icon className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{api.title}</h3>
                    <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">{api.type}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{api.description}</p>
                
                <Link
                  to={api.link}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View API Reference
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training & Support */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Video className="w-8 h-8 mr-3 text-blue-500" />
              Training & Support
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get the most out of our platform with comprehensive training and support resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Video Tutorials</h3>
              <p className="text-sm text-gray-600 mb-4">Step-by-step platform tutorials and feature walkthroughs</p>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Coming Soon</span>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Training Programs</h3>
              <p className="text-sm text-gray-600 mb-4">Comprehensive training for enterprise customers</p>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Enterprise</span>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Implementation Guides</h3>
              <p className="text-sm text-gray-600 mb-4">Industry-specific implementation guides</p>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Available</span>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-sm text-gray-600 mb-4">Technical support and consultation services</p>
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">24/7 Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pilot CTA */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/pilot" className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Request a Pilot</div>
              <div className="text-sm text-gray-600">Closed‑data calibration, evidence, and ROI in weeks</div>
            </Link>
            <Link to="/blog/evidence-efficient-ai-73-percent-faster" className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Evidence‑Efficient AI</div>
              <div className="text-sm text-gray-600">72% token / 73% latency savings</div>
            </Link>
            <Link to="/blog/always-on-evaluators-risk-guard" className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Always‑on Evaluators</div>
              <div className="text-sm text-gray-600">Thresholds feeding Risk Guard; gates can block promotions</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start with our interactive demos to see how operational AI stability can transform your AI operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/stability-demo"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Start with Stability Demo
            </Link>
            <Link
              to="/contact"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
