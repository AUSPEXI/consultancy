import React, { useState, useEffect } from 'react'
import {
  Zap, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Activity, BarChart3, Settings, Play, Pause, RotateCcw, Eye,
  Database, Brain, FileText, Package, Users, Lock, Globe,
  Leaf, DollarSign, Thermometer, Cpu, HardDrive, Wifi
} from 'lucide-react'
import { 
  modelOptimizationService, 
  OptimizationConfig, 
  OptimizationResult, 
  EffectSize,
  DeviceProfile 
} from '../services/modelOptimizationService'
import { 
  efficiencyMetricsService, 
  EfficiencyMetrics, 
  EfficiencyTargets,
  EfficiencyReport,
  CarbonFootprint 
} from '../services/efficiencyMetricsService'
import { platformApi } from '../services/platformApi'

export const EfficiencyDemo: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('healthcare-fraud-detector')
  const [selectedDevice, setSelectedDevice] = useState('jetson-orin-nx')
  const [optimizationType, setOptimizationType] = useState<'adapter' | 'quantization' | 'pruning' | 'architecture'>('quantization')
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<EfficiencyMetrics | null>(null)
  const [efficiencyReport, setEfficiencyReport] = useState<EfficiencyReport | null>(null)
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprint | null>(null)
  const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [efficiencyTargets, setEfficiencyTargets] = useState<EfficiencyTargets>({
    max_energy_per_task: 0.8,
    max_cost_per_inference: 0.002,
    max_carbon_footprint_per_day: 5.0,
    min_throughput: 8,
    max_latency_p95: 100,
    max_resource_utilization: 90
  })

  useEffect(() => {
    loadDeviceProfiles()
    loadDemoData()
  }, [selectedModel])

  const loadDeviceProfiles = async () => {
    const profiles = await modelOptimizationService.getDeviceProfiles()
    setDeviceProfiles(profiles)
  }

  const loadDemoData = async () => {
    // Set efficiency targets
    await efficiencyMetricsService.setEfficiencyTargets(selectedModel, efficiencyTargets)
    
    // Load optimization history
    const history = await modelOptimizationService.getOptimizationHistory(selectedModel)
    setOptimizationResults(history)
    
    // Generate efficiency report
    const report = await efficiencyMetricsService.generateEfficiencyReport(selectedModel, 'daily')
    setEfficiencyReport(report)
    
    // Get carbon footprint
    const today = new Date().toISOString().split('T')[0]
    const carbon = await efficiencyMetricsService.getCarbonFootprint(selectedModel, today)
    setCarbonFootprint(carbon)
  }

  const startOptimization = async () => {
    const config: OptimizationConfig = {
      model_id: selectedModel,
      optimization_type: optimizationType,
      target_device: selectedDevice,
      constraints: {
        max_latency_ms: 100,
        max_energy_joules: 0.8,
        max_memory_mb: 2048,
        min_accuracy: 0.8
      },
      operating_point: {
        target_fpr: 0.01,
        target_tpr: 0.95,
        budget_alerts_per_day: 2000
      }
    }

    try {
      const result = await modelOptimizationService.optimizeModel(config)
      setOptimizationResults(prev => [result, ...prev])
      
      // Update metrics after optimization
      await efficiencyMetricsService.recordMetrics(selectedModel, {
        optimization_status: 'optimized',
        device_profile: selectedDevice
      })
      
      // Refresh report
      const report = await efficiencyMetricsService.generateEfficiencyReport(selectedModel, 'daily')
      setEfficiencyReport(report)

      if (platformApi.isLive()) {
        platformApi.logMlflow({
          summary: {
            eff_opt: 1,
            eff_type: config.optimization_type,
            eff_device: selectedDevice,
            eff_delta_latency_pct: (result.after_metrics.latency_p95 - result.before_metrics.latency_p95) / result.before_metrics.latency_p95,
            eff_delta_energy_pct: (result.after_metrics.energy_per_task - result.before_metrics.energy_per_task) / result.before_metrics.energy_per_task
          }
        }).catch(()=>{})
      }
    } catch (error) {
      console.error('Optimization failed:', error)
    }
  }

  const startMonitoring = async () => {
    setIsMonitoring(true)
    
    const interval = setInterval(async () => {
      const metrics = await efficiencyMetricsService.recordMetrics(selectedModel, {
        device_profile: selectedDevice,
        optimization_status: optimizationResults.length > 0 ? 'optimized' : 'baseline'
      })
      setCurrentMetrics(metrics)
      if (platformApi.isLive() && metrics) {
        platformApi.logMlflow({
          summary: {
            eff_energy_task: metrics.energy_metrics.energy_per_task_joules,
            eff_cost_inf: metrics.cost_metrics.cost_per_inference_usd,
            eff_latency_p95: metrics.performance_metrics.latency_p95_ms,
            eff_throughput: metrics.performance_metrics.throughput_tasks_per_second
          }
        }).catch(()=>{})
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100'
      case 'degrading': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Efficiency Beyond Moore's Law
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Optimize models for energy efficiency, cost reduction, and environmental impact with evidence-backed optimization
          </p>
        </div>

        {/* Model Selection & Controls */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-green-500" />
              Model Optimization
            </h2>
            <div className="flex space-x-4">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="healthcare-fraud-detector">Healthcare Fraud Detector</option>
                <option value="financial-risk-model">Financial Risk Model</option>
                <option value="automotive-quality-control">Automotive Quality Control</option>
              </select>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="jetson-orin-nx">Jetson Orin NX</option>
                <option value="rtx-a2000">RTX A2000</option>
                <option value="arm-sbc">ARM SBC</option>
              </select>
              <select
                value={optimizationType}
                onChange={(e) => setOptimizationType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="quantization">Quantization</option>
                <option value="adapter">Adapter Training</option>
                <option value="pruning">Pruning</option>
                <option value="architecture">Architecture</option>
              </select>
              <button
                onClick={startOptimization}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Optimization
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                isMonitoring 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isMonitoring ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            
            {currentMetrics && (
              <div className="text-sm text-gray-600">
                Last updated: {new Date(currentMetrics.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Current Metrics Dashboard */}
        {currentMetrics && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-500" />
              Real-Time Efficiency Metrics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Energy/Task</h3>
                <p className="text-2xl font-bold text-green-600">
                  {currentMetrics.energy_metrics.energy_per_task_joules.toFixed(3)}J
                </p>
                <p className="text-sm text-gray-600">
                  {currentMetrics.energy_metrics.power_draw_watts.toFixed(0)}W
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Cost/Inference</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${currentMetrics.cost_metrics.cost_per_inference_usd.toFixed(4)}
                </p>
                <p className="text-sm text-gray-600">
                  ${currentMetrics.cost_metrics.cost_per_day_usd.toFixed(2)}/day
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Leaf className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Carbon Footprint</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {currentMetrics.energy_metrics.carbon_footprint_kg_co2.toFixed(2)}kg CO₂
                </p>
                <p className="text-sm text-gray-600">
                  {currentMetrics.energy_metrics.thermal_temp_celsius.toFixed(0)}°C
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Throughput</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {currentMetrics.performance_metrics.throughput_tasks_per_second.toFixed(1)}/s
                </p>
                <p className="text-sm text-gray-600">
                  {currentMetrics.performance_metrics.latency_p95_ms.toFixed(0)}ms P95
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Results */}
        {optimizationResults.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
              Optimization Results
            </h2>
            
            <div className="space-y-4">
              {optimizationResults.slice(0, 3).map((result) => (
                <div key={result.optimization_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {result.optimization_type.toUpperCase()} Optimization
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(result.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Accuracy</p>
                      <p className="text-lg font-bold text-gray-900">
                        {((result.after_metrics.accuracy - result.before_metrics.accuracy) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Latency</p>
                      <p className="text-lg font-bold text-gray-900">
                        {((result.after_metrics.latency_p95 - result.before_metrics.latency_p95) / result.before_metrics.latency_p95 * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Energy</p>
                      <p className="text-lg font-bold text-gray-900">
                        {((result.after_metrics.energy_per_task - result.before_metrics.energy_per_task) / result.before_metrics.energy_per_task * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Memory</p>
                      <p className="text-lg font-bold text-gray-900">
                        {((result.after_metrics.memory_usage - result.before_metrics.memory_usage) / result.before_metrics.memory_usage * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-medium text-gray-700 mb-2">Effect Sizes:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.effect_sizes.map((effect, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            effect.decision === 'keep' ? 'text-green-600 bg-green-100' :
                            effect.decision === 'revert' ? 'text-red-600 bg-red-100' :
                            'text-yellow-600 bg-yellow-100'
                          }`}
                        >
                          {effect.factor}: {effect.delta_at_op.toFixed(3)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Efficiency Report */}
        {efficiencyReport && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-500" />
              Efficiency Report
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Inferences:</span>
                    <span className="font-mono">{efficiencyReport.summary.total_inferences.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Energy:</span>
                    <span className="font-mono">{efficiencyReport.summary.total_energy_kwh.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-mono">${efficiencyReport.summary.total_cost_usd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbon Footprint:</span>
                    <span className="font-mono">{efficiencyReport.summary.total_carbon_kg.toFixed(2)} kg CO₂</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Trends</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Energy:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(efficiencyReport.trends.energy_trend)}`}>
                      {efficiencyReport.trends.energy_trend.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cost:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(efficiencyReport.trends.cost_trend)}`}>
                      {efficiencyReport.trends.cost_trend.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(efficiencyReport.trends.performance_trend)}`}>
                      {efficiencyReport.trends.performance_trend.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {efficiencyReport.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {efficiencyReport.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Carbon Footprint Analysis */}
        {carbonFootprint && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Leaf className="w-6 h-6 mr-2 text-green-500" />
              Environmental Impact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Carbon Footprint</h3>
                <p className="text-3xl font-bold text-green-600">
                  {carbonFootprint.carbon_footprint_kg_co2.toFixed(2)} kg CO₂
                </p>
                <p className="text-sm text-gray-600">
                  {carbonFootprint.total_energy_kwh.toFixed(2)} kWh consumed
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Car Miles Equivalent</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {carbonFootprint.equivalent_car_miles.toFixed(1)} miles
                </p>
                <p className="text-sm text-gray-600">
                  Average car emissions
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tree className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Trees to Offset</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {carbonFootprint.equivalent_trees_planted.toFixed(1)} trees
                </p>
                <p className="text-sm text-gray-600">
                  Annual sequestration
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Thermometer className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Carbon Intensity</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {carbonFootprint.carbon_intensity_g_co2_per_kwh} g/kWh
                </p>
                <p className="text-sm text-gray-600">
                  Grid average
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Device Profiles */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Cpu className="w-6 h-6 mr-2 text-blue-500" />
            Device Profiles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deviceProfiles.map((profile) => (
              <div key={profile.device_name} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{profile.device_name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span className="font-mono">{profile.memory_gb}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Power Limit:</span>
                    <span className="font-mono">{profile.power_limit_w}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precision:</span>
                    <span className="font-mono">{profile.optimization_settings.precision.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Latency:</span>
                    <span className="font-mono">{profile.optimization_settings.max_latency_ms}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batch Size:</span>
                    <span className="font-mono">{profile.optimization_settings.batch_size}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-green-500" />
            Efficiency Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Model Optimization</h3>
              <p className="text-sm text-gray-600">Adapters, quantization, pruning with effect size analysis</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Energy Tracking</h3>
              <p className="text-sm text-gray-600">Real-time energy consumption and efficiency monitoring</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Carbon Footprint</h3>
              <p className="text-sm text-gray-600">Environmental impact tracking and offset calculations</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cost Analysis</h3>
              <p className="text-sm text-gray-600">Per-inference cost tracking and optimization</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Device Profiles</h3>
              <p className="text-sm text-gray-600">Hardware-specific optimization and constraints</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Efficiency Reports</h3>
              <p className="text-sm text-gray-600">Comprehensive efficiency analysis and recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing Tree icon - using Leaf instead
const Tree = Leaf
