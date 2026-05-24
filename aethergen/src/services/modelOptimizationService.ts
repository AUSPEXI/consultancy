export interface OptimizationConfig {
  model_id: string
  optimization_type: 'adapter' | 'quantization' | 'pruning' | 'architecture'
  target_device: string
  constraints: {
    max_latency_ms: number
    max_energy_joules: number
    max_memory_mb: number
    min_accuracy: number
  }
  operating_point: {
    target_fpr: number
    target_tpr: number
    budget_alerts_per_day: number
  }
}

export interface EffectSize {
  factor: string
  delta_at_op: number
  ci_low: number
  ci_high: number
  decision: 'keep' | 'revert' | 'investigate'
  reasoning: string
  trade_offs?: {
    speed_change: number
    cost_change: number
    energy_change: number
  }
}

export interface OptimizationResult {
  optimization_id: string
  model_id: string
  optimization_type: string
  before_metrics: {
    accuracy: number
    latency_p95: number
    energy_per_task: number
    memory_usage: number
    cost_per_inference: number
  }
  after_metrics: {
    accuracy: number
    latency_p95: number
    energy_per_task: number
    memory_usage: number
    cost_per_inference: number
  }
  effect_sizes: EffectSize[]
  device_profile: DeviceProfile
  evidence_bundle_id: string
  created_at: string
}

export interface DeviceProfile {
  device_name: string
  compute_capability: string
  memory_gb: number
  power_limit_w: number
  thermal_throttle_temp: number
  optimization_settings: {
    precision: 'fp32' | 'fp16' | 'int8' | 'q4'
    batch_size: number
    max_latency_ms: number
    fallback_profile?: string
  }
}

export interface AdapterConfig {
  adapter_type: 'lora' | 'qlora' | 'prefix' | 'prompt'
  rank: number
  alpha: number
  dropout: number
  target_modules: string[]
  learning_rate: number
  max_steps: number
}

export interface QuantizationConfig {
  precision: 'int8' | 'q4' | 'fp16'
  calibration_method: 'minmax' | 'kl_divergence' | 'percentile'
  calibration_samples: number
  symmetric: boolean
  per_channel: boolean
}

export interface PruningConfig {
  pruning_method: 'magnitude' | 'structured' | 'unstructured'
  sparsity_ratio: number
  target_layers: string[]
  min_accuracy_threshold: number
}

class ModelOptimizationService {
  private optimizations: Map<string, OptimizationResult> = new Map()
  private deviceProfiles: Map<string, DeviceProfile> = new Map()

  constructor() {
    this.initializeDefaultDeviceProfiles()
  }

  private initializeDefaultDeviceProfiles() {
    // Edge devices
    this.deviceProfiles.set('jetson-orin-nx', {
      device_name: 'Jetson Orin NX',
      compute_capability: '8.7',
      memory_gb: 8,
      power_limit_w: 30,
      thermal_throttle_temp: 85,
      optimization_settings: {
        precision: 'int8',
        batch_size: 1,
        max_latency_ms: 25
      }
    })

    this.deviceProfiles.set('rtx-a2000', {
      device_name: 'RTX A2000',
      compute_capability: '8.6',
      memory_gb: 12,
      power_limit_w: 70,
      thermal_throttle_temp: 88,
      optimization_settings: {
        precision: 'fp16',
        batch_size: 2,
        max_latency_ms: 18
      }
    })

    this.deviceProfiles.set('arm-sbc', {
      device_name: 'ARM SBC',
      compute_capability: '7.5',
      memory_gb: 4,
      power_limit_w: 15,
      thermal_throttle_temp: 80,
      optimization_settings: {
        precision: 'q4',
        batch_size: 1,
        max_latency_ms: 40,
        fallback_profile: 'fp16'
      }
    })
  }

  async optimizeModel(config: OptimizationConfig): Promise<OptimizationResult> {
    console.log(`🚀 Starting ${config.optimization_type} optimization for model ${config.model_id}`)
    
    // Simulate optimization process
    const beforeMetrics = await this.getCurrentMetrics(config.model_id)
    const deviceProfile = this.deviceProfiles.get(config.target_device)
    
    if (!deviceProfile) {
      throw new Error(`Device profile not found for ${config.target_device}`)
    }

    // Apply optimization based on type
    let afterMetrics
    let effectSizes: EffectSize[] = []

    switch (config.optimization_type) {
      case 'adapter':
        afterMetrics = await this.applyAdapterOptimization(config, beforeMetrics)
        effectSizes = this.calculateEffectSizes('adapter', beforeMetrics, afterMetrics)
        break
      case 'quantization':
        afterMetrics = await this.applyQuantizationOptimization(config, beforeMetrics)
        effectSizes = this.calculateEffectSizes('quantization', beforeMetrics, afterMetrics)
        break
      case 'pruning':
        afterMetrics = await this.applyPruningOptimization(config, beforeMetrics)
        effectSizes = this.calculateEffectSizes('pruning', beforeMetrics, afterMetrics)
        break
      case 'architecture':
        afterMetrics = await this.applyArchitectureOptimization(config, beforeMetrics)
        effectSizes = this.calculateEffectSizes('architecture', beforeMetrics, afterMetrics)
        break
    }

    const result: OptimizationResult = {
      optimization_id: `opt-${config.model_id}-${Date.now()}`,
      model_id: config.model_id,
      optimization_type: config.optimization_type,
      before_metrics: beforeMetrics,
      after_metrics: afterMetrics,
      effect_sizes: effectSizes,
      device_profile: deviceProfile,
      evidence_bundle_id: `evidence-${config.model_id}-${Date.now()}`,
      created_at: new Date().toISOString()
    }

    this.optimizations.set(result.optimization_id, result)
    return result
  }

  private async getCurrentMetrics(modelId: string) {
    // Simulate current model metrics
    return {
      accuracy: 0.85 + Math.random() * 0.1,
      latency_p95: 50 + Math.random() * 30,
      energy_per_task: 0.5 + Math.random() * 0.3,
      memory_usage: 2048 + Math.random() * 1024,
      cost_per_inference: 0.001 + Math.random() * 0.002
    }
  }

  private async applyAdapterOptimization(config: OptimizationConfig, beforeMetrics: any) {
    // Simulate adapter training and optimization
    return {
      accuracy: beforeMetrics.accuracy + 0.02, // Small improvement
      latency_p95: beforeMetrics.latency_p95 * 0.95, // Slight improvement
      energy_per_task: beforeMetrics.energy_per_task * 0.98,
      memory_usage: beforeMetrics.memory_usage + 100, // Adapter overhead
      cost_per_inference: beforeMetrics.cost_per_inference * 0.99
    }
  }

  private async applyQuantizationOptimization(config: OptimizationConfig, beforeMetrics: any) {
    // Simulate quantization effects
    const precision = config.target_device.includes('jetson') ? 'int8' : 'fp16'
    const speedup = precision === 'int8' ? 0.7 : 0.85
    const accuracyDrop = precision === 'int8' ? 0.01 : 0.005

    return {
      accuracy: beforeMetrics.accuracy - accuracyDrop,
      latency_p95: beforeMetrics.latency_p95 * speedup,
      energy_per_task: beforeMetrics.energy_per_task * 0.8,
      memory_usage: beforeMetrics.memory_usage * 0.5,
      cost_per_inference: beforeMetrics.cost_per_inference * 0.7
    }
  }

  private async applyPruningOptimization(config: OptimizationConfig, beforeMetrics: any) {
    // Simulate pruning effects
    const sparsityRatio = 0.3 // 30% sparsity
    const accuracyDrop = sparsityRatio * 0.02

    return {
      accuracy: beforeMetrics.accuracy - accuracyDrop,
      latency_p95: beforeMetrics.latency_p95 * 0.8,
      energy_per_task: beforeMetrics.energy_per_task * 0.85,
      memory_usage: beforeMetrics.memory_usage * 0.7,
      cost_per_inference: beforeMetrics.cost_per_inference * 0.8
    }
  }

  private async applyArchitectureOptimization(config: OptimizationConfig, beforeMetrics: any) {
    // Simulate architectural changes
    return {
      accuracy: beforeMetrics.accuracy + 0.015,
      latency_p95: beforeMetrics.latency_p95 * 0.9,
      energy_per_task: beforeMetrics.energy_per_task * 0.9,
      memory_usage: beforeMetrics.memory_usage * 0.9,
      cost_per_inference: beforeMetrics.cost_per_inference * 0.85
    }
  }

  private calculateEffectSizes(optimizationType: string, before: any, after: any): EffectSize[] {
    const effectSizes: EffectSize[] = []

    // Accuracy effect
    const accuracyDelta = after.accuracy - before.accuracy
    const accuracyCI = this.calculateConfidenceInterval(accuracyDelta, 0.01)
    effectSizes.push({
      factor: `${optimizationType}_accuracy`,
      delta_at_op: accuracyDelta,
      ci_low: accuracyCI[0],
      ci_high: accuracyCI[1],
      decision: accuracyDelta > 0.01 ? 'keep' : accuracyDelta < -0.01 ? 'revert' : 'investigate',
      reasoning: accuracyDelta > 0 ? 'Accuracy improved' : 'Accuracy degraded'
    })

    // Latency effect
    const latencyDelta = (after.latency_p95 - before.latency_p95) / before.latency_p95
    const latencyCI = this.calculateConfidenceInterval(latencyDelta, 0.05)
    effectSizes.push({
      factor: `${optimizationType}_latency`,
      delta_at_op: latencyDelta,
      ci_low: latencyCI[0],
      ci_high: latencyCI[1],
      decision: latencyDelta < -0.05 ? 'keep' : latencyDelta > 0.05 ? 'revert' : 'investigate',
      reasoning: latencyDelta < 0 ? 'Latency improved' : 'Latency degraded',
      trade_offs: {
        speed_change: -latencyDelta * 100,
        cost_change: 0,
        energy_change: 0
      }
    })

    // Energy effect
    const energyDelta = (after.energy_per_task - before.energy_per_task) / before.energy_per_task
    const energyCI = this.calculateConfidenceInterval(energyDelta, 0.05)
    effectSizes.push({
      factor: `${optimizationType}_energy`,
      delta_at_op: energyDelta,
      ci_low: energyCI[0],
      ci_high: energyCI[1],
      decision: energyDelta < -0.1 ? 'keep' : energyDelta > 0.1 ? 'revert' : 'investigate',
      reasoning: energyDelta < 0 ? 'Energy efficiency improved' : 'Energy usage increased',
      trade_offs: {
        speed_change: 0,
        cost_change: energyDelta * 100,
        energy_change: energyDelta * 100
      }
    })

    return effectSizes
  }

  private calculateConfidenceInterval(delta: number, standardError: number): [number, number] {
    const zScore = 1.96 // 95% confidence interval
    const marginOfError = zScore * standardError
    return [delta - marginOfError, delta + marginOfError]
  }

  async getDeviceProfiles(): Promise<DeviceProfile[]> {
    return Array.from(this.deviceProfiles.values())
  }

  async getOptimizationHistory(modelId?: string): Promise<OptimizationResult[]> {
    const allOptimizations = Array.from(this.optimizations.values())
    if (modelId) {
      return allOptimizations.filter(opt => opt.model_id === modelId)
    }
    return allOptimizations
  }

  async getEffectSizeSummary(optimizationId: string): Promise<EffectSize[]> {
    const optimization = this.optimizations.get(optimizationId)
    if (!optimization) {
      throw new Error(`Optimization ${optimizationId} not found`)
    }
    return optimization.effect_sizes
  }

  async validateOptimization(optimizationId: string, constraints: any): Promise<boolean> {
    const optimization = this.optimizations.get(optimizationId)
    if (!optimization) {
      throw new Error(`Optimization ${optimizationId} not found`)
    }

    const { after_metrics } = optimization
    
    // Check if optimization meets all constraints
    return (
      after_metrics.latency_p95 <= constraints.max_latency_ms &&
      after_metrics.energy_per_task <= constraints.max_energy_joules &&
      after_metrics.memory_usage <= constraints.max_memory_mb &&
      after_metrics.accuracy >= constraints.min_accuracy
    )
  }

  async generateOptimizationReport(optimizationId: string): Promise<string> {
    const optimization = this.optimizations.get(optimizationId)
    if (!optimization) {
      throw new Error(`Optimization ${optimizationId} not found`)
    }

    const { before_metrics, after_metrics, effect_sizes, device_profile } = optimization
    
    const report = `
# Optimization Report: ${optimization.optimization_type}

## Device Profile
- Device: ${device_profile.device_name}
- Memory: ${device_profile.memory_gb}GB
- Power Limit: ${device_profile.power_limit_w}W

## Performance Comparison
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Accuracy | ${(before_metrics.accuracy * 100).toFixed(2)}% | ${(after_metrics.accuracy * 100).toFixed(2)}% | ${((after_metrics.accuracy - before_metrics.accuracy) * 100).toFixed(2)}% |
| Latency (P95) | ${before_metrics.latency_p95.toFixed(1)}ms | ${after_metrics.latency_p95.toFixed(1)}ms | ${((after_metrics.latency_p95 - before_metrics.latency_p95) / before_metrics.latency_p95 * 100).toFixed(1)}% |
| Energy/Task | ${before_metrics.energy_per_task.toFixed(3)}J | ${after_metrics.energy_per_task.toFixed(3)}J | ${((after_metrics.energy_per_task - before_metrics.energy_per_task) / before_metrics.energy_per_task * 100).toFixed(1)}% |
| Memory Usage | ${before_metrics.memory_usage.toFixed(0)}MB | ${after_metrics.memory_usage.toFixed(0)}MB | ${((after_metrics.memory_usage - before_metrics.memory_usage) / before_metrics.memory_usage * 100).toFixed(1)}% |

## Effect Sizes
${effect_sizes.map(es => `- **${es.factor}**: ${es.delta_at_op.toFixed(4)} [${es.ci_low.toFixed(4)}, ${es.ci_high.toFixed(4)}] - ${es.decision.toUpperCase()}`).join('\n')}

## Recommendations
${effect_sizes.filter(es => es.decision === 'keep').length > 0 ? '✅ Optimization successful - proceed with deployment' : '⚠️ Review optimization results before deployment'}
    `

    return report
  }
}

export const modelOptimizationService = new ModelOptimizationService()
