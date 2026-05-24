export interface EfficiencyMetrics {
  model_id: string
  timestamp: string
  energy_metrics: {
    energy_per_task_joules: number
    energy_per_day_kwh: number
    carbon_footprint_kg_co2: number
    power_draw_watts: number
    thermal_temp_celsius: number
  }
  cost_metrics: {
    cost_per_inference_usd: number
    cost_per_day_usd: number
    cost_per_month_usd: number
    compute_cost_per_hour: number
    memory_cost_per_gb: number
  }
  resource_metrics: {
    cpu_utilization_percent: number
    gpu_utilization_percent: number
    memory_utilization_percent: number
    network_throughput_mbps: number
    disk_io_mbps: number
  }
  performance_metrics: {
    throughput_tasks_per_second: number
    latency_p50_ms: number
    latency_p95_ms: number
    latency_p99_ms: number
    accuracy_percent: number
  }
  device_profile: string
  optimization_status: 'baseline' | 'optimized' | 'degraded'
}

export interface EfficiencyTargets {
  max_energy_per_task: number
  max_cost_per_inference: number
  max_carbon_footprint_per_day: number
  min_throughput: number
  max_latency_p95: number
  max_resource_utilization: number
}

export interface EfficiencyReport {
  report_id: string
  model_id: string
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  summary: {
    total_inferences: number
    total_energy_kwh: number
    total_cost_usd: number
    total_carbon_kg: number
    average_throughput: number
    average_latency: number
  }
  trends: {
    energy_trend: 'improving' | 'stable' | 'degrading'
    cost_trend: 'improving' | 'stable' | 'degrading'
    performance_trend: 'improving' | 'stable' | 'degrading'
  }
  recommendations: string[]
  alerts: EfficiencyAlert[]
}

export interface EfficiencyAlert {
  alert_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'energy' | 'cost' | 'performance' | 'resource'
  message: string
  threshold: number
  current_value: number
  timestamp: string
  action_required: boolean
}

export interface CarbonFootprint {
  model_id: string
  date: string
  total_energy_kwh: number
  carbon_intensity_g_co2_per_kwh: number
  carbon_footprint_kg_co2: number
  equivalent_car_miles: number
  equivalent_trees_planted: number
}

class EfficiencyMetricsService {
  private metrics: Map<string, EfficiencyMetrics[]> = new Map()
  private reports: Map<string, EfficiencyReport> = new Map()
  private alerts: Map<string, EfficiencyAlert[]> = new Map()
  private targets: Map<string, EfficiencyTargets> = new Map()

  async recordMetrics(modelId: string, metrics: Partial<EfficiencyMetrics>): Promise<EfficiencyMetrics> {
    const timestamp = new Date().toISOString()
    
    const fullMetrics: EfficiencyMetrics = {
      model_id: modelId,
      timestamp,
      energy_metrics: {
        energy_per_task_joules: metrics.energy_metrics?.energy_per_task_joules || 0.5 + Math.random() * 0.3,
        energy_per_day_kwh: metrics.energy_metrics?.energy_per_day_kwh || 2.4 + Math.random() * 1.2,
        carbon_footprint_kg_co2: metrics.energy_metrics?.carbon_footprint_kg_co2 || 1.2 + Math.random() * 0.6,
        power_draw_watts: metrics.energy_metrics?.power_draw_watts || 100 + Math.random() * 50,
        thermal_temp_celsius: metrics.energy_metrics?.thermal_temp_celsius || 45 + Math.random() * 20
      },
      cost_metrics: {
        cost_per_inference_usd: metrics.cost_metrics?.cost_per_inference_usd || 0.001 + Math.random() * 0.002,
        cost_per_day_usd: metrics.cost_metrics?.cost_per_day_usd || 2.4 + Math.random() * 1.2,
        cost_per_month_usd: metrics.cost_metrics?.cost_per_month_usd || 72 + Math.random() * 36,
        compute_cost_per_hour: metrics.cost_metrics?.compute_cost_per_hour || 0.1 + Math.random() * 0.05,
        memory_cost_per_gb: metrics.cost_metrics?.memory_cost_per_gb || 0.02 + Math.random() * 0.01
      },
      resource_metrics: {
        cpu_utilization_percent: metrics.resource_metrics?.cpu_utilization_percent || 60 + Math.random() * 30,
        gpu_utilization_percent: metrics.resource_metrics?.gpu_utilization_percent || 80 + Math.random() * 15,
        memory_utilization_percent: metrics.resource_metrics?.memory_utilization_percent || 70 + Math.random() * 25,
        network_throughput_mbps: metrics.resource_metrics?.network_throughput_mbps || 100 + Math.random() * 50,
        disk_io_mbps: metrics.resource_metrics?.disk_io_mbps || 50 + Math.random() * 30
      },
      performance_metrics: {
        throughput_tasks_per_second: metrics.performance_metrics?.throughput_tasks_per_second || 10 + Math.random() * 5,
        latency_p50_ms: metrics.performance_metrics?.latency_p50_ms || 20 + Math.random() * 10,
        latency_p95_ms: metrics.performance_metrics?.latency_p95_ms || 50 + Math.random() * 20,
        latency_p99_ms: metrics.performance_metrics?.latency_p99_ms || 100 + Math.random() * 50,
        accuracy_percent: metrics.performance_metrics?.accuracy_percent || 85 + Math.random() * 10
      },
      device_profile: metrics.device_profile || 'default',
      optimization_status: metrics.optimization_status || 'baseline'
    }

    if (!this.metrics.has(modelId)) {
      this.metrics.set(modelId, [])
    }
    this.metrics.get(modelId)!.push(fullMetrics)

    // Check for alerts
    await this.checkAlerts(modelId, fullMetrics)

    return fullMetrics
  }

  private async checkAlerts(modelId: string, metrics: EfficiencyMetrics) {
    const targets = this.targets.get(modelId)
    if (!targets) return

    const alerts: EfficiencyAlert[] = []

    // Energy alerts
    if (metrics.energy_metrics.energy_per_task_joules > targets.max_energy_per_task) {
      alerts.push({
        alert_id: `energy-${Date.now()}`,
        severity: 'high',
        type: 'energy',
        message: `Energy per task (${metrics.energy_metrics.energy_per_task_joules.toFixed(3)}J) exceeds target (${targets.max_energy_per_task}J)`,
        threshold: targets.max_energy_per_task,
        current_value: metrics.energy_metrics.energy_per_task_joules,
        timestamp: metrics.timestamp,
        action_required: true
      })
    }

    // Cost alerts
    if (metrics.cost_metrics.cost_per_inference_usd > targets.max_cost_per_inference) {
      alerts.push({
        alert_id: `cost-${Date.now()}`,
        severity: 'medium',
        type: 'cost',
        message: `Cost per inference ($${metrics.cost_metrics.cost_per_inference_usd.toFixed(4)}) exceeds target ($${targets.max_cost_per_inference.toFixed(4)})`,
        threshold: targets.max_cost_per_inference,
        current_value: metrics.cost_metrics.cost_per_inference_usd,
        timestamp: metrics.timestamp,
        action_required: true
      })
    }

    // Performance alerts
    if (metrics.performance_metrics.latency_p95_ms > targets.max_latency_p95) {
      alerts.push({
        alert_id: `performance-${Date.now()}`,
        severity: 'high',
        type: 'performance',
        message: `P95 latency (${metrics.performance_metrics.latency_p95_ms.toFixed(1)}ms) exceeds target (${targets.max_latency_p95}ms)`,
        threshold: targets.max_latency_p95,
        current_value: metrics.performance_metrics.latency_p95_ms,
        timestamp: metrics.timestamp,
        action_required: true
      })
    }

    // Resource utilization alerts
    if (metrics.resource_metrics.gpu_utilization_percent > targets.max_resource_utilization) {
      alerts.push({
        alert_id: `resource-${Date.now()}`,
        severity: 'medium',
        type: 'resource',
        message: `GPU utilization (${metrics.resource_metrics.gpu_utilization_percent.toFixed(1)}%) exceeds target (${targets.max_resource_utilization}%)`,
        threshold: targets.max_resource_utilization,
        current_value: metrics.resource_metrics.gpu_utilization_percent,
        timestamp: metrics.timestamp,
        action_required: false
      })
    }

    if (alerts.length > 0) {
      if (!this.alerts.has(modelId)) {
        this.alerts.set(modelId, [])
      }
      this.alerts.get(modelId)!.push(...alerts)
    }
  }

  async setEfficiencyTargets(modelId: string, targets: EfficiencyTargets): Promise<void> {
    this.targets.set(modelId, targets)
    console.log(`🎯 Set efficiency targets for model ${modelId}`)
  }

  async getEfficiencyTargets(modelId: string): Promise<EfficiencyTargets | null> {
    return this.targets.get(modelId) || null
  }

  async getMetricsHistory(modelId: string, hours: number = 24): Promise<EfficiencyMetrics[]> {
    const modelMetrics = this.metrics.get(modelId) || []
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return modelMetrics.filter(metric => 
      new Date(metric.timestamp) >= cutoffTime
    )
  }

  async generateEfficiencyReport(modelId: string, period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<EfficiencyReport> {
    const modelMetrics = this.metrics.get(modelId) || []
    if (modelMetrics.length === 0) {
      throw new Error(`No metrics found for model ${modelId}`)
    }

    const now = new Date()
    const startDate = this.getStartDate(now, period)
    const endDate = now.toISOString()

    const periodMetrics = modelMetrics.filter(metric => 
      new Date(metric.timestamp) >= startDate
    )

    const summary = this.calculateSummary(periodMetrics)
    const trends = this.calculateTrends(periodMetrics)
    const recommendations = this.generateRecommendations(summary, trends)
    const alerts = this.alerts.get(modelId) || []

    const report: EfficiencyReport = {
      report_id: `report-${modelId}-${Date.now()}`,
      model_id: modelId,
      period,
      start_date: startDate.toISOString(),
      end_date: endDate,
      summary,
      trends,
      recommendations,
      alerts: alerts.filter(alert => 
        new Date(alert.timestamp) >= startDate
      )
    }

    this.reports.set(report.report_id, report)
    return report
  }

  private getStartDate(now: Date, period: string): Date {
    const startDate = new Date(now)
    switch (period) {
      case 'hourly':
        startDate.setHours(now.getHours() - 1)
        break
      case 'daily':
        startDate.setDate(now.getDate() - 1)
        break
      case 'weekly':
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    return startDate
  }

  private calculateSummary(metrics: EfficiencyMetrics[]) {
    if (metrics.length === 0) {
      return {
        total_inferences: 0,
        total_energy_kwh: 0,
        total_cost_usd: 0,
        total_carbon_kg: 0,
        average_throughput: 0,
        average_latency: 0
      }
    }

    const totalInferences = metrics.length * 1000 // Assume 1000 inferences per metric
    const totalEnergy = metrics.reduce((sum, m) => sum + m.energy_metrics.energy_per_day_kwh, 0)
    const totalCost = metrics.reduce((sum, m) => sum + m.cost_metrics.cost_per_day_usd, 0)
    const totalCarbon = metrics.reduce((sum, m) => sum + m.energy_metrics.carbon_footprint_kg_co2, 0)
    const avgThroughput = metrics.reduce((sum, m) => sum + m.performance_metrics.throughput_tasks_per_second, 0) / metrics.length
    const avgLatency = metrics.reduce((sum, m) => sum + m.performance_metrics.latency_p95_ms, 0) / metrics.length

    return {
      total_inferences: totalInferences,
      total_energy_kwh: totalEnergy,
      total_cost_usd: totalCost,
      total_carbon_kg: totalCarbon,
      average_throughput: avgThroughput,
      average_latency: avgLatency
    }
  }

  private calculateTrends(metrics: EfficiencyMetrics[]) {
    if (metrics.length < 2) {
      return {
        energy_trend: 'stable' as const,
        cost_trend: 'stable' as const,
        performance_trend: 'stable' as const
      }
    }

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2))
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2))

    const firstEnergy = firstHalf.reduce((sum, m) => sum + m.energy_metrics.energy_per_task_joules, 0) / firstHalf.length
    const secondEnergy = secondHalf.reduce((sum, m) => sum + m.energy_metrics.energy_per_task_joules, 0) / secondHalf.length

    const firstCost = firstHalf.reduce((sum, m) => sum + m.cost_metrics.cost_per_inference_usd, 0) / firstHalf.length
    const secondCost = secondHalf.reduce((sum, m) => sum + m.cost_metrics.cost_per_inference_usd, 0) / secondHalf.length

    const firstLatency = firstHalf.reduce((sum, m) => sum + m.performance_metrics.latency_p95_ms, 0) / firstHalf.length
    const secondLatency = secondHalf.reduce((sum, m) => sum + m.performance_metrics.latency_p95_ms, 0) / secondHalf.length

    return {
      energy_trend: secondEnergy < firstEnergy * 0.95 ? 'improving' : secondEnergy > firstEnergy * 1.05 ? 'degrading' : 'stable',
      cost_trend: secondCost < firstCost * 0.95 ? 'improving' : secondCost > firstCost * 1.05 ? 'degrading' : 'stable',
      performance_trend: secondLatency < firstLatency * 0.95 ? 'improving' : secondLatency > firstLatency * 1.05 ? 'degrading' : 'stable'
    }
  }

  private generateRecommendations(summary: any, trends: any): string[] {
    const recommendations: string[] = []

    if (trends.energy_trend === 'degrading') {
      recommendations.push('Consider model quantization to reduce energy consumption')
    }

    if (trends.cost_trend === 'degrading') {
      recommendations.push('Review compute resources and consider optimization')
    }

    if (trends.performance_trend === 'degrading') {
      recommendations.push('Investigate performance bottlenecks and consider model optimization')
    }

    if (summary.average_latency > 100) {
      recommendations.push('High latency detected - consider batch processing or model optimization')
    }

    if (summary.total_carbon_kg > 10) {
      recommendations.push('High carbon footprint - consider energy-efficient hardware or optimization')
    }

    return recommendations
  }

  async getCarbonFootprint(modelId: string, date: string): Promise<CarbonFootprint> {
    const modelMetrics = this.metrics.get(modelId) || []
    const dayMetrics = modelMetrics.filter(m => 
      m.timestamp.startsWith(date)
    )

    const totalEnergy = dayMetrics.reduce((sum, m) => sum + m.energy_metrics.energy_per_day_kwh, 0)
    const carbonIntensity = 400 // g CO2 per kWh (typical grid average)
    const carbonFootprint = totalEnergy * carbonIntensity / 1000 // Convert to kg
    const carMiles = carbonFootprint * 2.3 // kg CO2 to car miles equivalent
    const treesPlanted = carbonFootprint * 0.5 // kg CO2 to trees equivalent

    return {
      model_id: modelId,
      date,
      total_energy_kwh: totalEnergy,
      carbon_intensity_g_co2_per_kwh: carbonIntensity,
      carbon_footprint_kg_co2: carbonFootprint,
      equivalent_car_miles: carMiles,
      equivalent_trees_planted: treesPlanted
    }
  }

  async getAlerts(modelId: string, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<EfficiencyAlert[]> {
    const modelAlerts = this.alerts.get(modelId) || []
    if (severity) {
      return modelAlerts.filter(alert => alert.severity === severity)
    }
    return modelAlerts
  }

  async getReports(modelId?: string): Promise<EfficiencyReport[]> {
    const allReports = Array.from(this.reports.values())
    if (modelId) {
      return allReports.filter(report => report.model_id === modelId)
    }
    return allReports
  }
}

export const efficiencyMetricsService = new EfficiencyMetricsService()
