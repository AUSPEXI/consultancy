import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Download, 
  Play, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Code,
  Database,
  Brain,
  Shield,
  Zap,
  Target
} from 'lucide-react'
import { marketplaceAssetService, MarketplaceAsset, Listing, ConversionMetrics } from '../services/marketplaceAssetService'
import { trialManagementService, TrialRequest, TrialProvisioning, TrialAnalytics } from '../services/trialManagementService'
import { platformApi } from '../services/platformApi'

export const MarketplaceDemo: React.FC = () => {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [activeTrials, setActiveTrials] = useState<any[]>([])
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MarketplaceAsset | null>(null)
  const [trialStatus, setTrialStatus] = useState<string>('')
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<'databricks' | 'azure' | 'internal'>('internal')

  useEffect(() => {
    loadDemoData()
  }, [])

  const loadDemoData = async () => {
    // Create demo assets
    const demoAssets = await createDemoAssets()
    setAssets(demoAssets)

    // Generate listings for each asset
    const demoListings = await Promise.all(demoAssets.map(asset => marketplaceAssetService.generateListing(asset)))
    setListings(demoListings)

    // Load active trials
    const trials = await trialManagementService.getActiveTrials()
    setActiveTrials(trials)

    // Load conversion metrics
    const metrics = await Promise.all(demoAssets.map(asset => trialManagementService.getConversionMetrics(asset.id)))
    setConversionMetrics(metrics)
  }

  const createDemoAssets = async () => {
    const demoAssets: MarketplaceAsset[] = [
      {
        id: 'asset_1',
        name: 'Financial Fraud Detection Dataset',
        type: 'dataset',
        description: 'High-quality synthetic dataset for training fraud detection models with comprehensive feature engineering and balanced class distribution.',
        version: '2.1.0',
        author: 'Aethergen',
        created: new Date(),
        updated: new Date(),
        status: 'published',
        platform: 'universal',
        metadata: {
          schema: {
            fields: [
              { name: 'transaction_id', type: 'string', description: 'Unique transaction identifier', nullable: false },
              { name: 'amount', type: 'float', description: 'Transaction amount', nullable: false },
              { name: 'merchant_category', type: 'string', description: 'Merchant category code', nullable: true },
              { name: 'is_fraud', type: 'boolean', description: 'Fraud indicator', nullable: false }
            ],
            constraints: [],
            sampleData: [
              { transaction_id: 'TXN001', amount: 150.50, merchant_category: 'retail', is_fraud: false },
              { transaction_id: 'TXN002', amount: 2500.00, merchant_category: 'electronics', is_fraud: true }
            ],
            rowCount: 100000,
            format: 'delta'
          },
          fileSize: 52428800, // 50MB
          checksum: 'sha256:abc123def456',
          dependencies: ['pandas>=1.5.0', 'numpy>=1.21.0'],
          requirements: ['Python 3.8+', 'Delta Lake'],
          license: {
            type: 'Commercial',
            terms: 'Commercial license for business use',
            restrictions: ['redistribution', 'reverse_engineering'],
            attribution: 'Aethergen',
            commercial: true
          },
          usage: {
            allowedUse: ['training', 'validation', 'commercial'],
            prohibitedUse: ['redistribution', 'reverse_engineering'],
            redistribution: false,
            modification: true,
            retention: 'perpetual'
          }
        },
        evidence: {
          metrics: [
            { name: 'accuracy', value: 0.94, confidenceInterval: [0.92, 0.96], unit: '%', description: 'Model accuracy on test set' },
            { name: 'precision', value: 0.91, confidenceInterval: [0.89, 0.93], unit: '%', description: 'Precision for fraud class' },
            { name: 'recall', value: 0.88, confidenceInterval: [0.86, 0.90], unit: '%', description: 'Recall for fraud class' }
          ],
          plots: [],
          ablation: [
            { component: 'feature_engineering', baseline: 0.85, ablated: 0.78, impact: 0.07, significance: 'high' },
            { component: 'class_balancing', baseline: 0.94, ablated: 0.91, impact: 0.03, significance: 'medium' }
          ],
          privacy: {
            synthetic: true,
            privacyMetrics: [
              { name: 'privacy_score', value: 0.95, threshold: 0.8, passed: true }
            ]
          },
          reproducibility: {
            seeds: [42, 123, 456],
            config: { framework: 'pandas', version: '1.5.0' },
            hash: 'config_hash_123',
            environment: 'Python 3.9'
          },
          stability: {
            crossValidation: 0.93,
            segmentStability: 0.91,
            temporalStability: 0.89,
            robustness: 0.92
          }
        },
        pricing: [
          {
            name: 'self-service',
            price: 199,
            currency: 'USD',
            period: 'monthly',
            features: ['dataset_access', 'basic_support', 'updates'],
            limits: { users: 5, requests: 1000, storage: 100, compute: 500 }
          },
          {
            name: 'assisted',
            price: 499,
            currency: 'USD',
            period: 'monthly',
            features: ['dataset_access', 'priority_support', 'custom_features', 'consulting'],
            limits: { users: 20, requests: 5000, storage: 500, compute: 2000 }
          }
        ],
        trials: {
          enabled: true,
          duration: 14,
          features: ['full_access', 'samples', 'documentation', 'support'],
          limits: { users: 1, requests: 100, storage: 10, compute: 50 },
          conversionTriggers: ['usage_threshold', 'time_limit', 'feature_usage']
        },
        tags: ['finance', 'fraud', 'synthetic', 'ml-ready']
      },
      {
        id: 'asset_2',
        name: 'Healthcare Anomaly Detection Model',
        type: 'model',
        description: 'Pre-trained deep learning model for detecting anomalies in healthcare data with high accuracy and low false positive rates.',
        version: '1.3.0',
        author: 'Aethergen',
        created: new Date(),
        updated: new Date(),
        status: 'published',
        platform: 'universal',
        metadata: {
          modelInfo: {
            framework: 'pytorch',
            format: 'onnx',
            architecture: 'transformer',
            parameters: 125000000,
            inputShape: [1, 512],
            outputShape: [1, 2],
            deviceRequirements: ['GPU', '8GB RAM'],
            inferenceLatency: 15,
            accuracy: 0.96
          },
          fileSize: 104857600, // 100MB
          checksum: 'sha256:def456ghi789',
          dependencies: ['torch>=1.12.0', 'onnxruntime>=1.12.0'],
          requirements: ['Python 3.8+', 'CUDA 11.0+'],
          license: {
            type: 'Commercial',
            terms: 'Commercial license for healthcare applications',
            restrictions: ['redistribution', 'reverse_engineering'],
            attribution: 'Aethergen',
            commercial: true
          },
          usage: {
            allowedUse: ['inference', 'fine-tuning', 'commercial'],
            prohibitedUse: ['redistribution', 'reverse_engineering'],
            redistribution: false,
            modification: true,
            retention: 'perpetual'
          }
        },
        evidence: {
          metrics: [
            { name: 'accuracy', value: 0.96, confidenceInterval: [0.94, 0.98], unit: '%', description: 'Model accuracy' },
            { name: 'f1_score', value: 0.94, confidenceInterval: [0.92, 0.96], unit: '%', description: 'F1 score' },
            { name: 'latency', value: 15, confidenceInterval: [12, 18], unit: 'ms', description: 'Inference latency' }
          ],
          plots: [],
          ablation: [
            { component: 'attention_mechanism', baseline: 0.96, ablated: 0.89, impact: 0.07, significance: 'high' },
            { component: 'data_augmentation', baseline: 0.96, ablated: 0.93, impact: 0.03, significance: 'medium' }
          ],
          privacy: {
            synthetic: false,
            privacyMetrics: [
              { name: 'privacy_score', value: 0.98, threshold: 0.9, passed: true }
            ]
          },
          reproducibility: {
            seeds: [42, 123],
            config: { framework: 'pytorch', version: '1.12.0' },
            hash: 'config_hash_456',
            environment: 'Python 3.9, CUDA 11.0'
          },
          stability: {
            crossValidation: 0.95,
            segmentStability: 0.94,
            temporalStability: 0.93,
            robustness: 0.95
          }
        },
        pricing: [
          {
            name: 'self-service',
            price: 299,
            currency: 'USD',
            period: 'monthly',
            features: ['model_access', 'basic_support', 'updates'],
            limits: { users: 3, requests: 500, storage: 50, compute: 200 }
          },
          {
            name: 'assisted',
            price: 799,
            currency: 'USD',
            period: 'monthly',
            features: ['model_access', 'priority_support', 'custom_deployment', 'consulting'],
            limits: { users: 10, requests: 2000, storage: 200, compute: 1000 }
          }
        ],
        trials: {
          enabled: true,
          duration: 7,
          features: ['model_access', 'samples', 'documentation'],
          limits: { users: 1, requests: 50, storage: 5, compute: 25 },
          conversionTriggers: ['usage_threshold', 'time_limit']
        },
        tags: ['healthcare', 'anomaly', 'deep-learning', 'pytorch']
      }
    ]

    // Create assets in the service
    const createdAssets = await Promise.all(
      demoAssets.map(asset => marketplaceAssetService.createAsset(asset))
    )

    return createdAssets
  }

  const handleProvisionTrial = async (assetId: string) => {
    setTrialStatus('Provisioning trial...')
    
    const request: TrialRequest = {
      assetId,
      userId: `demo_user_${Date.now()}`,
      userEmail: 'demo@example.com',
      company: 'Demo Corp',
      useCase: 'Evaluation',
      requestedFeatures: ['full_access', 'samples']
    }

    try {
      const provisioning = await trialManagementService.provisionTrial(request)
      
      if (provisioning.status === 'active') {
        setTrialStatus(`Trial provisioned successfully! Access URL: ${provisioning.accessUrl}`)
        if (platformApi.isLive()) {
          platformApi.logMlflow({ summary: { mkt_trial_provisioned: 1, mkt_platform: selectedPlatform } }).catch(()=>{})
        }
        
        // Refresh active trials
        const trials = await trialManagementService.getActiveTrials()
        setActiveTrials(trials)
      } else {
        setTrialStatus(`Trial provisioning failed: ${provisioning.error}`)
      }
    } catch (error) {
      setTrialStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleGeneratePackage = async (asset: MarketplaceAsset) => {
    setGenerationStatus('Generating marketplace package...')
    
    try {
      const packageBlob = await marketplaceAssetService.generateMarketplacePackage(asset, selectedPlatform)
      
      // Create download link
      const url = URL.createObjectURL(packageBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${asset.name.replace(/\s+/g, '_')}_${selectedPlatform}_package.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setGenerationStatus('Package generated and downloaded successfully!')
      if (platformApi.isLive()) {
        platformApi.logMlflow({ summary: { mkt_package_generated: 1, mkt_platform: selectedPlatform, mkt_asset_type: asset.type } }).catch(()=>{})
      }
    } catch (error) {
      setGenerationStatus(`Error generating package: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleConvertTrial = async (trialId: string, tier: string) => {
    try {
      await trialManagementService.convertTrial(trialId, tier, 'manual')
      
      // Refresh data
      const trials = await trialManagementService.getActiveTrials()
      setActiveTrials(trials)
      
      const metrics = await Promise.all(assets.map(asset => trialManagementService.getConversionMetrics(asset.id)))
      setConversionMetrics(metrics)
      
      setTrialStatus('Trial converted successfully!')
      if (platformApi.isLive()) {
        platformApi.logMlflow({ summary: { mkt_trial_converted: 1, mkt_tier: tier } }).catch(()=>{})
      }
    } catch (error) {
      setTrialStatus(`Error converting trial: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getTotalRevenue = () => {
    return conversionMetrics.reduce((sum, metric) => sum + metric.revenue, 0)
  }

  const getTotalTrials = () => {
    return conversionMetrics.reduce((sum, metric) => sum + metric.totalTrials, 0)
  }

  const getAverageConversionRate = () => {
    const rates = conversionMetrics.map(metric => metric.conversionRate).filter(rate => rate > 0)
    return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <Package className="mr-3 text-blue-600" />
            Universal Marketplace Demo
          </h1>
          <p className="text-lg text-gray-900">
            Platform-agnostic marketplace system for managing assets, trials, and conversions
          </p>
        </div>

        {/* Platform Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Settings className="mr-2" />
            Platform Configuration
          </h2>
          <div className="flex space-x-4">
            {(['internal', 'databricks', 'azure'] as const).map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPlatform === platform
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Active Trials</p>
                <p className="text-2xl font-bold text-gray-900">{activeTrials.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(getAverageConversionRate() * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${getTotalRevenue()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {asset.type === 'dataset' ? (
                      <Database className="h-6 w-6 text-blue-600 mr-2" />
                    ) : (
                      <Brain className="h-6 w-6 text-purple-600 mr-2" />
                    )}
                    <h3 className="text-xl font-semibold text-gray-900">{asset.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    asset.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>
                
                <p className="text-gray-900 mb-4">{asset.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {asset.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-900 rounded-md text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-900">Type</p>
                    <p className="font-medium">{asset.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Version</p>
                    <p className="font-medium">{asset.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Size</p>
                    <p className="font-medium">{(asset.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Trials</p>
                    <p className="font-medium">{asset.trials.enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleProvisionTrial(asset.id)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Trial
                  </button>
                  
                  <button
                    onClick={() => handleGeneratePackage(asset)}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Package
                  </button>
                  
                  <button
                    onClick={() => setSelectedAsset(asset)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Trials */}
        {activeTrials.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2" />
              Active Trials
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Trial ID</th>
                    <th className="text-left py-2">Asset</th>
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Start Date</th>
                    <th className="text-left py-2">End Date</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrials.map(trial => (
                    <tr key={trial.id} className="border-b">
                      <td className="py-2 text-sm">{trial.id}</td>
                      <td className="py-2 text-sm">{assets.find(a => a.id === trial.assetId)?.name}</td>
                      <td className="py-2 text-sm">{trial.userId}</td>
                      <td className="py-2 text-sm">{trial.startDate.toLocaleDateString()}</td>
                      <td className="py-2 text-sm">{trial.endDate.toLocaleDateString()}</td>
                      <td className="py-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConvertTrial(trial.id, 'self-service')}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Convert
                          </button>
                          <button
                            onClick={() => trialManagementService.expireTrial(trial.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Expire
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conversion Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2" />
            Conversion Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversionMetrics.map(metric => {
              const asset = assets.find(a => a.id === metric.assetId)
              return (
                <div key={metric.assetId} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{asset?.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Trials:</span>
                      <span className="font-medium">{metric.totalTrials}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversions:</span>
                      <span className="font-medium">{metric.conversions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-medium">{(metric.conversionRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">${metric.revenue}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Messages */}
        {trialStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-900">{trialStatus}</p>
          </div>
        )}
        
        {generationStatus && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <p className="text-green-900">{generationStatus}</p>
          </div>
        )}

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="mr-2" />
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Asset Management</h3>
              <p className="text-gray-900 text-sm">
                Create, manage, and package datasets and models with comprehensive metadata and evidence
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Trial System</h3>
              <p className="text-gray-900 text-sm">
                Automated trial provisioning, usage tracking, and conversion analytics
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Platform Agnostic</h3>
              <p className="text-gray-900 text-sm">
                Works with Databricks, Azure, or your own marketplace infrastructure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
