import React, { useState, useEffect } from 'react'
import {
  FileText, Database, Brain, Shield, Download, Eye, Settings, Plus,
  CheckCircle, AlertTriangle, TrendingUp, BarChart3, QrCode, Package,
  Users, Clock, Target, Zap, ArrowRight, RefreshCw, Lock, Unlock
} from 'lucide-react'
import { datasetCardService, DatasetCard, DatasetCardOptions } from '../services/datasetCardService'
import { modelCardService, ModelCard, ModelCardOptions } from '../services/modelCardService'
import { unityCatalogService, UnityCatalogConfig, UnityCatalogExport } from '../services/unityCatalogService'
import { buildEvidenceBundle, downloadSignedEvidenceZip, generateEvidenceIndex, downloadEvidenceIndex } from '../services/evidenceService'
import { platformApi } from '../services/platformApi'

export const CardsDemo: React.FC = () => {
  const [datasetCards, setDatasetCards] = useState<DatasetCard[]>([])
  const [modelCards, setModelCards] = useState<ModelCard[]>([])
  const [unityAssets, setUnityAssets] = useState<any[]>([])
  const [selectedDomain, setSelectedDomain] = useState<'healthcare' | 'financial' | 'automotive'>('healthcare')
  const [selectedTask, setSelectedTask] = useState<'fraud_detection' | 'clinical_prediction' | 'defect_detection'>('fraud_detection')
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [unityConfig, setUnityConfig] = useState<UnityCatalogConfig>({
    workspace_url: 'https://demo.cloud.databricks.com',
    catalog_name: 'aethergen',
    schema_name: 'cards',
    api_token: 'demo_token'
  })
  const [showUnityConfig, setShowUnityConfig] = useState(false)
  const [includeDPBudgets, setIncludeDPBudgets] = useState<boolean>(false)
  const [entitlements, setEntitlements] = useState<any[]>([])
  const [canExportEvidence, setCanExportEvidence] = useState<boolean>(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/get-entitlements')
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data?.entitlements) ? data.entitlements : []
          setEntitlements(list)
          const allowed = list.some((e: any) => e?.active && e?.stripe_price && e.stripe_price !== 'DEV_FREE')
          setCanExportEvidence(!!allowed)
        } else {
          setEntitlements([{ stripe_price: 'DEV_FREE', active: true }])
          setCanExportEvidence(false)
        }
      } catch {
        setEntitlements([{ stripe_price: 'DEV_FREE', active: true }])
        setCanExportEvidence(false)
      }
      await loadDemoData()
    })()
  }, [])

  const loadDemoData = async () => {
    setGenerationStatus('Loading demo data...')
    
    // Configure Unity Catalog
    await unityCatalogService.configure(unityConfig)
    
    // Generate sample cards
    await generateSampleCards()
    
    setGenerationStatus('Demo data loaded successfully!')
  }

  const generateSampleCards = async () => {
    // Generate dataset card
    const datasetOptions = await datasetCardService.generateDatasetCardTemplate(selectedDomain, 'Fraud detection prototyping and evaluation')
    const datasetCard = await datasetCardService.generateDatasetCard(datasetOptions)
    
    // Generate model card
    const modelOptions = await modelCardService.generateModelCardTemplate(selectedDomain, selectedTask)
    const modelCard = await modelCardService.generateModelCard(modelOptions)
    
    // Register with Unity Catalog
    const datasetAsset = await unityCatalogService.registerDataset(datasetCard, '/data/healthcare_claims')
    const modelAsset = await unityCatalogService.registerModel(modelCard, '/models/fraud_detector')
    
    // Track lineage
    await unityCatalogService.trackLineage({
      asset_id: modelAsset.path,
      upstream_assets: [datasetAsset.path],
      downstream_assets: [],
      transformation_type: 'model_training',
      metadata: { algorithm: 'xgboost', version: '1.0.0' }
    })
    
    setDatasetCards([datasetCard])
    setModelCards([modelCard])
    setUnityAssets([datasetAsset, modelAsset])

    if (platformApi.isLive()) {
      try {
        await platformApi.logMlflow({
          summary: {
            card_dataset_quality: datasetCard.quality.data_health_score,
            card_model_f1: modelCard.evaluation.operating_points?.[0]?.metrics?.f1 ?? 0,
            uc_assets: 2
          }
        })
      } catch {}
    }
  }

  const handleGenerateCards = async () => {
    setGenerationStatus('Generating cards...')
    try {
      await generateSampleCards()
      setGenerationStatus('Cards generated successfully!')
    } catch (error) {
      setGenerationStatus(`Error generating cards: ${error}`)
    }
  }

  const handleExportCard = async (card: DatasetCard | ModelCard, format: 'html' | 'json') => {
    try {
      let content: string
      let filename: string
      let mimeType: string
      
      if (format === 'html') {
        const exportOptions: UnityCatalogExport = {
          format: 'html',
          include_evidence: true,
          include_lineage: true,
          include_grants: true
        }
        content = await unityCatalogService.exportCardAsHTML(card, exportOptions)
        filename = `${card.name.toLowerCase().replace(/\s+/g, '_')}_card.html`
        mimeType = 'text/html'
      } else {
        if ('schema' in card) {
          content = await datasetCardService.exportDatasetCardAsJSON(card)
        } else {
          content = await modelCardService.exportModelCardAsJSON(card)
        }
        filename = `${card.name.toLowerCase().replace(/\s+/g, '_')}_card.json`
        mimeType = 'application/json'
      }
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const handleExportSignedEvidence = async (card: DatasetCard | ModelCard) => {
    try {
      const bundle = buildEvidenceBundle({
        app_version: 'web-demo',
        schema_hash: 'demo-schema-hash',
        recipe_hash: 'demo-recipe-hash',
        dataset_hash: 'demo-dataset-hash',
        notes: [
          'Auto-generated demo evidence bundle',
          'Contains safe-to-share metrics only'
        ],
        privacy: includeDPBudgets ? { epsilon: 2.5, synthetic_ratio: 1.0 } : undefined,
        performance_metrics: {
          statistical_fidelity: 0.96,
          privacy_score: 0.98,
          utility_score: 0.94,
          generation_speed: 50000,
          memory_efficiency: 0.185
        }
      })
      await downloadSignedEvidenceZip(bundle, `${card.name.toLowerCase().replace(/\s+/g, '_')}_evidence.zip`)
    } catch (error) {
      console.error('Signed evidence export error:', error)
    }
  }

  const handleExportEvidenceIndex = async () => {
    const items = [
      ...datasetCards.map(dc => ({
        id: `dataset-${dc.name}-${dc.version}`,
        title: `Dataset: ${dc.name} v${dc.version}`,
        artifact_path: `${dc.name.toLowerCase().replace(/\s+/g, '_')}_evidence.zip`,
        hash: 'pending',
        signed: true,
        created_at: new Date(dc.created_at).toISOString(),
        tags: ['dataset', dc.domain]
      })),
      ...modelCards.map(mc => ({
        id: `model-${mc.name}-${mc.version}`,
        title: `Model: ${mc.name} v${mc.version}`,
        artifact_path: `${mc.name.toLowerCase().replace(/\s+/g, '_')}_evidence.zip`,
        hash: 'pending',
        signed: true,
        created_at: new Date(mc.created_at).toISOString(),
        tags: ['model', mc.task]
      }))
    ]
    const index = generateEvidenceIndex(items)
    downloadEvidenceIndex(index)
  }

  const getOperatingPointMetrics = (card: ModelCard) => {
    return card.evaluation.operating_points.map(op => ({
      name: op.name,
      precision: op.metrics.precision,
      recall: op.metrics.recall,
      f1: op.metrics.f1,
      alerts: op.business_impact.alerts_per_day,
      savings: op.business_impact.cost_savings
    }))
  }

  const getStabilityMetrics = (card: ModelCard) => {
    return {
      regionDelta: card.evaluation.stability.region_delta,
      specialtyDelta: card.evaluation.stability.specialty_delta,
      timeDelta: card.evaluation.stability.time_delta,
      segmentStability: card.evaluation.stability.segment_stability
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dataset & Model Cards Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Evidence-backed, Unity Catalog-aware, and procurement-ready cards that help buyers evaluate, adopt, and govern AI assets
          </p>
        </div>

        {/* Unity Catalog Configuration */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Database className="w-6 h-6 mr-2 text-blue-500" />
              Unity Catalog Configuration
            </h2>
            <button
              onClick={() => setShowUnityConfig(!showUnityConfig)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showUnityConfig ? 'Hide' : 'Configure'}
            </button>
          </div>
          
          {showUnityConfig && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace URL</label>
                <input
                  type="text"
                  value={unityConfig.workspace_url}
                  onChange={(e) => setUnityConfig({ ...unityConfig, workspace_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catalog Name</label>
                <input
                  type="text"
                  value={unityConfig.catalog_name}
                  onChange={(e) => setUnityConfig({ ...unityConfig, catalog_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schema Name</label>
                <input
                  type="text"
                  value={unityConfig.schema_name}
                  onChange={(e) => setUnityConfig({ ...unityConfig, schema_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                <input
                  type="password"
                  value={unityConfig.api_token}
                  onChange={(e) => setUnityConfig({ ...unityConfig, api_token: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">Unity Catalog configured and ready</span>
            </div>
          </div>
        </div>

        {/* Card Generation Controls */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Plus className="w-6 h-6 mr-2 text-blue-500" />
            Generate Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="healthcare">Healthcare</option>
                <option value="financial">Financial</option>
                <option value="automotive">Automotive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="fraud_detection">Fraud Detection</option>
                <option value="clinical_prediction">Clinical Prediction</option>
                <option value="defect_detection">Defect Detection</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateCards}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Cards
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="dp-toggle"
              type="checkbox"
              checked={includeDPBudgets}
              onChange={(e) => setIncludeDPBudgets(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="dp-toggle" className="text-sm text-gray-700">
              Include DP budgets (epsilon) in evidence bundles
            </label>
          </div>
          
          {generationStatus && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-blue-700">{generationStatus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dataset Cards */}
        {datasetCards.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="w-6 h-6 mr-2 text-blue-500" />
              Dataset Cards
            </h2>
            
            {datasetCards.map((card, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{card.name}</h3>
                    <p className="text-gray-600">Version {card.version}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportCard(card, 'html')}
                      className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      HTML
                    </button>
                    <button
                      onClick={() => handleExportCard(card, 'json')}
                      className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </button>
                    <button
                      onClick={() => canExportEvidence && handleExportSignedEvidence(card)}
                      disabled={!canExportEvidence}
                      className={`flex items-center px-3 py-2 rounded-lg transition ${
                        canExportEvidence ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canExportEvidence ? <Shield className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      Evidence (Signed)
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Quality Metrics</h4>
                    <p className="text-sm text-gray-600">Health Score: {card.quality.data_health_score}</p>
                    <p className="text-sm text-gray-600">Coverage: {Object.values(card.quality.coverage)[0]}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Fidelity & Utility</h4>
                    <p className="text-sm text-gray-600">Alignment: {card.fidelity.alignment_score}</p>
                    <p className="text-sm text-gray-600">Records: {card.packaging.record_count.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Privacy</h4>
                    <p className="text-sm text-gray-600">Re-ID Risk: {card.privacy.probes.reid_risk}</p>
                    <p className="text-sm text-gray-600">Non-Goals: {card.privacy.non_goals.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Domain: {card.domain}</span>
                  <span>Format: {card.packaging.format}</span>
                  <span>Created: {new Date(card.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Model Cards */}
        {modelCards.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Brain className="w-6 h-6 mr-2 text-blue-500" />
              Model Cards
            </h2>
            
            {modelCards.map((card, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{card.name}</h3>
                    <p className="text-gray-600">Version {card.version}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportCard(card, 'html')}
                      className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      HTML
                    </button>
                    <button
                      onClick={() => handleExportCard(card, 'json')}
                      className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </button>
                    <button
                      onClick={() => canExportEvidence && handleExportSignedEvidence(card)}
                      disabled={!canExportEvidence}
                      className={`flex items-center px-3 py-2 rounded-lg transition ${
                        canExportEvidence ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canExportEvidence ? <Shield className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      Evidence (Signed)
                    </button>
                  </div>
                </div>
                
                {/* Operating Points */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Operating Points
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getOperatingPointMetrics(card).map((op, opIndex) => (
                      <div key={opIndex} className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-blue-900">{op.name}</h5>
                        <div className="text-sm text-blue-700">
                          <p>Precision: {(op.precision * 100).toFixed(1)}%</p>
                          <p>Recall: {(op.recall * 100).toFixed(1)}%</p>
                          <p>F1: {(op.f1 * 100).toFixed(1)}%</p>
                          <p>Alerts/day: {op.alerts}</p>
                          <p>Savings: ${op.savings.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Stability Metrics */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Stability Metrics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-900">Region Delta</h5>
                      <p className="text-green-700">{(getStabilityMetrics(card).regionDelta * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-900">Specialty Delta</h5>
                      <p className="text-green-700">{(getStabilityMetrics(card).specialtyDelta * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-900">Time Delta</h5>
                      <p className="text-green-700">{(getStabilityMetrics(card).timeDelta * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-900">Segment Stability</h5>
                      <p className="text-green-700">{(Object.values(getStabilityMetrics(card).segmentStability)[0] * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Calibration</h4>
                    <p className="text-sm text-gray-600">Method: {card.calibration.method}</p>
                    <p className="text-sm text-gray-600">Target: {card.calibration.target}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Robustness</h4>
                    <p className="text-sm text-gray-600">Tests: {card.robustness.length}</p>
                    <p className="text-sm text-gray-600">Performance Delta: {(card.robustness[0]?.performance_delta * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Packaging</h4>
                    <p className="text-sm text-gray-600">Format: {card.packaging.format}</p>
                    <p className="text-sm text-gray-600">Profiles: {card.packaging.device_profiles.join(', ')}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Intended Use: {card.intended_use}</span>
                  <span>Format: {card.packaging.format}</span>
                  <span>Created: {new Date(card.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unity Catalog Assets */}
        {unityAssets.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="w-6 h-6 mr-2 text-blue-500" />
              Unity Catalog Assets
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unityAssets.map((asset, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      asset.type === 'table' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {asset.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{asset.description}</p>
                  <p className="text-xs text-gray-500 font-mono">{asset.path}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(asset.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-500" />
            Features Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Evidence-Backed Cards</h3>
              <p className="text-sm text-gray-600">Every statement links to verifiable artifacts in evidence bundles</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Unity Catalog Integration</h3>
              <p className="text-sm text-gray-600">Register datasets and models with grants and lineage tracking</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Operating Points</h3>
              <p className="text-sm text-gray-600">Precision thresholds with confidence intervals and business impact</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Stability Monitoring</h3>
              <p className="text-sm text-gray-600">Segment stability bands and drift sensitivity analysis</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Governance Hooks</h3>
              <p className="text-sm text-gray-600">Change control, rollback triggers, and audit integration</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multi-Format Packaging</h3>
              <p className="text-sm text-gray-600">MLflow, ONNX, GGUF formats with device profiles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
