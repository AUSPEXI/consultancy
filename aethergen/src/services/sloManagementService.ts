export interface SLOConfig {
  utility: {
    operating_point: string
    min_threshold: number
    tolerance_band: number
    confidence_interval: [number, number]
  }
  stability: {
    max_delta_across_segments: number
    segment_bands: Record<string, number>
    drift_threshold: number
  }
  latency: {
    p95_ms: number
    p99_ms: number
    capacity_target: number
  }
  privacy: {
    probe_thresholds: {
      membership_advantage: number
      attribute_disclosure: number
      reid_risk: number
    }
    dp_budgets?: {
      epsilon: number
      delta: number
    }
  }
  // Optional on-device SLOs
  ondevice?: {
    enabled: boolean
    max_fallback_rate?: number // fraction 0..1
    max_battery_mwh?: number   // approximate budget per inference
    max_temp_delta_c?: number  // degrees C over baseline
  }
}

export interface SLOStatus {
  slo_type: 'utility' | 'stability' | 'latency' | 'privacy'
  current_value: number
  threshold: number
  status: 'pass' | 'warning' | 'breach'
  breach_severity: 'low' | 'medium' | 'high' | 'critical'
  last_updated: string
  evidence_snapshot: string
}

export interface SLOBreach {
  id: string
  slo_type: string
  breach_time: string
  current_value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact_assessment: string
  mitigation_actions: string[]
  rollback_triggered: boolean
  evidence_bundle_id: string
}

export interface ShadowEvaluation {
  candidate_model_id: string
  live_model_id: string
  evaluation_start: string
  evaluation_end?: string
  status: 'running' | 'completed' | 'failed'
  metrics: {
    utility_delta: number
    stability_delta: number
    latency_delta: number
    privacy_delta: number
  }
  promotion_approved: boolean
  evidence_bundle_id: string
}

export interface DriftMetrics {
  psi_score: number
  ks_statistic: number
  drift_severity: 'low' | 'medium' | 'high'
  affected_segments: string[]
  time_windows: {
    '7d': number
    '14d': number
    '28d': number
  }
  recommendations: string[]
}

export interface TestMatrix {
  time_windows: number[]
  segments: string[]
  corruptions: string[]
  faults: string[]
  gates: {
    utility_budget: string
    stability: string
    latency: string
  }
}

class SLOManagementService {
  private sloConfigs: Map<string, SLOConfig> = new Map()
  private sloStatus: Map<string, SLOStatus[]> = new Map()
  private breaches: Map<string, SLOBreach> = new Map()
  private shadowEvaluations: Map<string, ShadowEvaluation> = new Map()
  private driftMetrics: Map<string, DriftMetrics> = new Map()
  // Hysteresis/smoothing to reduce status flapping
  private samples: Map<string, number[]> = new Map()
  private breachStreaks: Map<string, number> = new Map()

  async configureSLO(modelId: string, config: SLOConfig): Promise<void> {
    this.sloConfigs.set(modelId, config)
    console.log(`SLO configured for model ${modelId}`)
  }

  async evaluateSLO(modelId: string, currentMetrics: any): Promise<SLOStatus[]> {
    const config = this.sloConfigs.get(modelId)
    if (!config) {
      throw new Error(`No SLO configuration found for model ${modelId}`)
    }

    const statuses: SLOStatus[] = []

    // Utility SLO
    const utilKey = `${modelId}:utility`
    const smUtility = this.smooth(utilKey, currentMetrics.utility || 0)
    const utilityStatus: SLOStatus = {
      slo_type: 'utility',
      current_value: smUtility,
      threshold: config.utility.min_threshold,
      status: this.applyHysteresis(utilKey, this.calculateStatus(smUtility, config.utility.min_threshold, config.utility.tolerance_band)),
      breach_severity: this.calculateSeverity(smUtility, config.utility.min_threshold),
      last_updated: new Date().toISOString(),
      evidence_snapshot: `evidence-${modelId}-${Date.now()}`
    }
    statuses.push(utilityStatus)

    // Stability SLO
    const stabKey = `${modelId}:stability`
    const smStability = this.smooth(stabKey, currentMetrics.stability_delta || 0)
    const stabilityStatus: SLOStatus = {
      slo_type: 'stability',
      current_value: smStability,
      threshold: config.stability.max_delta_across_segments,
      status: this.applyHysteresis(stabKey, this.calculateStatus(smStability, config.stability.max_delta_across_segments, 0.01, true)),
      breach_severity: this.calculateSeverity(smStability, config.stability.max_delta_across_segments),
      last_updated: new Date().toISOString(),
      evidence_snapshot: `evidence-${modelId}-${Date.now()}`
    }
    statuses.push(stabilityStatus)

    // Latency SLO
    const latKey = `${modelId}:latency`
    const smLatency = this.smooth(latKey, currentMetrics.p95_latency || 0)
    const latencyStatus: SLOStatus = {
      slo_type: 'latency',
      current_value: smLatency,
      threshold: config.latency.p95_ms,
      status: this.applyHysteresis(latKey, this.calculateStatus(smLatency, config.latency.p95_ms, 0, true)),
      breach_severity: this.calculateSeverity(smLatency, config.latency.p95_ms),
      last_updated: new Date().toISOString(),
      evidence_snapshot: `evidence-${modelId}-${Date.now()}`
    }
    statuses.push(latencyStatus)

    // Privacy SLO
    const prvKey = `${modelId}:privacy`
    const smPrivacy = this.smooth(prvKey, currentMetrics.membership_advantage || 0)
    const privacyStatus: SLOStatus = {
      slo_type: 'privacy',
      current_value: smPrivacy,
      threshold: config.privacy.probe_thresholds.membership_advantage,
      status: this.applyHysteresis(prvKey, this.calculateStatus(smPrivacy, config.privacy.probe_thresholds.membership_advantage, 0, true)),
      breach_severity: this.calculateSeverity(smPrivacy, config.privacy.probe_thresholds.membership_advantage),
      last_updated: new Date().toISOString(),
      evidence_snapshot: `evidence-${modelId}-${Date.now()}`
    }
    statuses.push(privacyStatus)

    // On-device optional SLOs
    if (config.ondevice?.enabled) {
      if (Number.isFinite(config.ondevice.max_fallback_rate)) {
        const key = `${modelId}:fallback_rate`
        const sm = this.smooth(key, currentMetrics.fallback_rate ?? 0)
        statuses.push({
          slo_type: 'latency', // reuse card styling; type list is fixed
          current_value: sm,
          threshold: config.ondevice.max_fallback_rate!,
          status: this.applyHysteresis(key, this.calculateStatus(sm, config.ondevice.max_fallback_rate!, 0, true)),
          breach_severity: this.calculateSeverity(sm, config.ondevice.max_fallback_rate!),
          last_updated: new Date().toISOString(),
          evidence_snapshot: `evidence-${modelId}-${Date.now()}`
        })
      }
      if (Number.isFinite(config.ondevice.max_battery_mwh)) {
        const key = `${modelId}:battery_mwh`
        const sm = this.smooth(key, currentMetrics.energy_mwh ?? 0)
        statuses.push({
          slo_type: 'latency',
          current_value: sm,
          threshold: config.ondevice.max_battery_mwh!,
          status: this.applyHysteresis(key, this.calculateStatus(sm, config.ondevice.max_battery_mwh!, 0, true)),
          breach_severity: this.calculateSeverity(sm, config.ondevice.max_battery_mwh!),
          last_updated: new Date().toISOString(),
          evidence_snapshot: `evidence-${modelId}-${Date.now()}`
        })
      }
      if (Number.isFinite(config.ondevice.max_temp_delta_c)) {
        const key = `${modelId}:temp_delta`
        const sm = this.smooth(key, currentMetrics.temp_delta_c ?? 0)
        statuses.push({
          slo_type: 'latency',
          current_value: sm,
          threshold: config.ondevice.max_temp_delta_c!,
          status: this.applyHysteresis(key, this.calculateStatus(sm, config.ondevice.max_temp_delta_c!, 0, true)),
          breach_severity: this.calculateSeverity(sm, config.ondevice.max_temp_delta_c!),
          last_updated: new Date().toISOString(),
          evidence_snapshot: `evidence-${modelId}-${Date.now()}`
        })
      }
    }

    this.sloStatus.set(modelId, statuses)

    // Check for breaches and trigger alerts
    statuses.forEach(status => {
      if (status.status === 'breach') {
        this.handleSLOBreach(modelId, status)
      }
    })

    return statuses
  }

  // Simple moving average over last 3 samples
  private smooth(key: string, value: number): number {
    const arr = this.samples.get(key) || []
    arr.push(value)
    if (arr.length > 3) arr.shift()
    this.samples.set(key, arr)
    const sum = arr.reduce((a,b)=>a+b,0)
    return sum / arr.length
  }

  // Require 2 consecutive breaches to emit breach; otherwise downgrade to warning
  private applyHysteresis(key: string, status: 'pass'|'warning'|'breach'): 'pass'|'warning'|'breach' {
    if (status !== 'breach') {
      this.breachStreaks.set(key, 0)
      return status
    }
    const streak = (this.breachStreaks.get(key) || 0) + 1
    this.breachStreaks.set(key, streak)
    return streak >= 2 ? 'breach' : 'warning'
  }

  private calculateStatus(value: number, threshold: number, tolerance: number, lowerIsBetter: boolean = false): 'pass' | 'warning' | 'breach' {
    if (lowerIsBetter) {
      if (value <= threshold) return 'pass'
      if (value <= threshold + tolerance) return 'warning'
      return 'breach'
    } else {
      if (value >= threshold) return 'pass'
      if (value >= threshold - tolerance) return 'warning'
      return 'breach'
    }
  }

  private calculateSeverity(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const delta = Math.abs(value - threshold) / threshold
    if (delta <= 0.05) return 'low'
    if (delta <= 0.15) return 'medium'
    if (delta <= 0.30) return 'high'
    return 'critical'
  }

  private async handleSLOBreach(modelId: string, status: SLOStatus): Promise<void> {
    const breach: SLOBreach = {
      id: `breach-${modelId}-${Date.now()}`,
      slo_type: status.slo_type,
      breach_time: new Date().toISOString(),
      current_value: status.current_value,
      threshold: status.threshold,
      severity: status.breach_severity,
      impact_assessment: this.assessImpact(status),
      mitigation_actions: this.generateMitigationActions(status),
      rollback_triggered: status.breach_severity === 'high' || status.breach_severity === 'critical',
      evidence_bundle_id: status.evidence_snapshot
    }

    this.breaches.set(breach.id, breach)

    // Trigger automated rollback for high/critical breaches
    if (breach.rollback_triggered) {
      await this.triggerAutomatedRollback(modelId, breach)
    }

    // Send alerts
    await this.sendBreachAlert(breach)
  }

  private assessImpact(status: SLOStatus): string {
    switch (status.slo_type) {
      case 'utility':
        return `Model performance dropped by ${((status.threshold - status.current_value) / status.threshold * 100).toFixed(1)}%`
      case 'stability':
        return `Stability breach detected across segments, potential for inconsistent predictions`
      case 'latency':
        return `Response time exceeded SLO by ${((status.current_value - status.threshold) / status.threshold * 100).toFixed(1)}%`
      case 'privacy':
        return `Privacy probe exceeded threshold, potential data exposure risk`
      default:
        return 'Unknown impact'
    }
  }

  private generateMitigationActions(status: SLOStatus): string[] {
    const actions = []
    
    switch (status.slo_type) {
      case 'utility':
        actions.push('Review recent model changes')
        actions.push('Check for data drift')
        actions.push('Consider model retraining')
        break
      case 'stability':
        actions.push('Analyze segment-specific performance')
        actions.push('Check for distribution shifts')
        actions.push('Review feature engineering')
        break
      case 'latency':
        actions.push('Optimize model inference')
        actions.push('Check infrastructure resources')
        actions.push('Review caching strategies')
        break
      case 'privacy':
        actions.push('Review data processing pipeline')
        actions.push('Check differential privacy settings')
        actions.push('Audit data access patterns')
        break
    }

    return actions
  }

  private async triggerAutomatedRollback(modelId: string, breach: SLOBreach): Promise<void> {
    console.log(`🚨 AUTOMATED ROLLBACK TRIGGERED for model ${modelId}`)
    console.log(`Breach: ${breach.slo_type} - ${breach.severity} severity`)
    console.log(`Evidence: ${breach.evidence_bundle_id}`)
    
    // In a real implementation, this would:
    // 1. Revert to last good model artifact
    // 2. Update routing to use previous model
    // 3. Log the rollback event
    // 4. Notify stakeholders
  }

  private async sendBreachAlert(breach: SLOBreach): Promise<void> {
    console.log(`🚨 SLO BREACH ALERT: ${breach.slo_type}`)
    console.log(`Severity: ${breach.severity}`)
    console.log(`Impact: ${breach.impact_assessment}`)
    console.log(`Actions: ${breach.mitigation_actions.join(', ')}`)
  }

  async startShadowEvaluation(candidateModelId: string, liveModelId: string): Promise<ShadowEvaluation> {
    const evaluation: ShadowEvaluation = {
      candidate_model_id: candidateModelId,
      live_model_id: liveModelId,
      evaluation_start: new Date().toISOString(),
      status: 'running',
      metrics: {
        utility_delta: 0,
        stability_delta: 0,
        latency_delta: 0,
        privacy_delta: 0
      },
      promotion_approved: false,
      evidence_bundle_id: `shadow-${candidateModelId}-${Date.now()}`
    }

    this.shadowEvaluations.set(evaluation.evidence_bundle_id, evaluation)
    return evaluation
  }

  async updateShadowEvaluation(evaluationId: string, metrics: any): Promise<ShadowEvaluation> {
    const evaluation = this.shadowEvaluations.get(evaluationId)
    if (!evaluation) {
      throw new Error(`Shadow evaluation ${evaluationId} not found`)
    }

    evaluation.metrics = metrics
    evaluation.evaluation_end = new Date().toISOString()
    evaluation.status = 'completed'

    // Check if promotion should be approved
    const config = this.sloConfigs.get(evaluation.candidate_model_id)
    if (config) {
      evaluation.promotion_approved = 
        Math.abs(metrics.utility_delta) < 0.05 &&
        Math.abs(metrics.stability_delta) < 0.03 &&
        Math.abs(metrics.latency_delta) < 0.1 &&
        Math.abs(metrics.privacy_delta) < 0.02
    }

    return evaluation
  }

  async calculateDriftMetrics(modelId: string, currentData: any[], baselineData: any[]): Promise<DriftMetrics> {
    // Calculate PSI (Population Stability Index)
    const psiScore = this.calculatePSI(currentData, baselineData)
    
    // Calculate KS statistic
    const ksStatistic = this.calculateKS(currentData, baselineData)
    
    // Determine drift severity
    const driftSeverity = psiScore > 0.25 ? 'high' : psiScore > 0.1 ? 'medium' : 'low'
    
    // Calculate time window drifts
    const timeWindows = {
      '7d': this.calculateTimeWindowDrift(currentData, baselineData, 7),
      '14d': this.calculateTimeWindowDrift(currentData, baselineData, 14),
      '28d': this.calculateTimeWindowDrift(currentData, baselineData, 28)
    }

    const driftMetrics: DriftMetrics = {
      psi_score: psiScore,
      ks_statistic: ksStatistic,
      drift_severity: driftSeverity,
      affected_segments: this.identifyAffectedSegments(currentData, baselineData),
      time_windows: timeWindows,
      recommendations: this.generateDriftRecommendations(driftSeverity, psiScore, ksStatistic)
    }

    this.driftMetrics.set(modelId, driftMetrics)
    return driftMetrics
  }

  private calculatePSI(current: any[], baseline: any[]): number {
    // Simplified PSI calculation
    // In real implementation, this would calculate population stability index
    return Math.random() * 0.3 // Placeholder
  }

  private calculateKS(current: any[], baseline: any[]): number {
    // Simplified KS statistic calculation
    // In real implementation, this would calculate Kolmogorov-Smirnov statistic
    return Math.random() * 0.2 // Placeholder
  }

  private calculateTimeWindowDrift(current: any[], baseline: any[], days: number): number {
    // Calculate drift over specific time windows
    return Math.random() * 0.15 // Placeholder
  }

  private identifyAffectedSegments(current: any[], baseline: any[]): string[] {
    // Identify which segments are most affected by drift
    const segments = ['region', 'product', 'lifecycle']
    return segments.filter(() => Math.random() > 0.5)
  }

  private generateDriftRecommendations(severity: string, psi: number, ks: number): string[] {
    const recommendations = []
    
    if (severity === 'high') {
      recommendations.push('Immediate model retraining recommended')
      recommendations.push('Review data pipeline for changes')
      recommendations.push('Consider feature engineering updates')
    } else if (severity === 'medium') {
      recommendations.push('Monitor drift trends closely')
      recommendations.push('Prepare for potential retraining')
    } else {
      recommendations.push('Continue monitoring')
    }

    return recommendations
  }

  async getTestMatrix(): Promise<TestMatrix> {
    return {
      time_windows: [7, 14, 28],
      segments: ['product', 'region', 'lifecycle'],
      corruptions: ['gaussian_noise', 'occlusion', 'typos'],
      faults: ['missing_feature_X', 'skewed_distribution_Y'],
      gates: {
        utility_budget: '>= target with CI',
        stability: '<= delta_max',
        latency: 'p95 <= SLO'
      }
    }
  }

  async getSLOStatus(modelId: string): Promise<SLOStatus[]> {
    return this.sloStatus.get(modelId) || []
  }

  async getBreaches(modelId?: string): Promise<SLOBreach[]> {
    const allBreaches = Array.from(this.breaches.values())
    if (modelId) {
      return allBreaches.filter(breach => breach.id.includes(modelId))
    }
    return allBreaches
  }

  async getShadowEvaluations(): Promise<ShadowEvaluation[]> {
    return Array.from(this.shadowEvaluations.values())
  }

  async getDriftMetrics(modelId: string): Promise<DriftMetrics | null> {
    return this.driftMetrics.get(modelId) || null
  }
}

export const sloManagementService = new SLOManagementService()
