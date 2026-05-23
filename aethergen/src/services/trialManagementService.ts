import { MarketplaceAsset, Trial, TrialUsage, ConversionData, ConversionMetrics } from './marketplaceAssetService'

export interface TrialRequest {
  assetId: string
  userId: string
  userEmail: string
  company?: string
  useCase?: string
  requestedFeatures?: string[]
}

export interface TrialProvisioning {
  trialId: string
  assetId: string
  userId: string
  status: 'provisioning' | 'active' | 'failed'
  accessUrl?: string
  credentials?: TrialCredentials
  error?: string
}

export interface TrialCredentials {
  username: string
  password: string
  apiKey?: string
  workspaceUrl?: string
}

export interface TrialAnalytics {
  trialId: string
  assetId: string
  userId: string
  usage: TrialUsage
  engagement: EngagementMetrics
  conversionProbability: number
  recommendations: string[]
}

export interface EngagementMetrics {
  loginCount: number
  lastLogin: Date
  sessionDuration: number
  featureUsage: Record<string, number>
  notebookRuns: number
  dataDownloads: number
}

export interface TrialConversionTrigger {
  type: 'usage_threshold' | 'time_limit' | 'feature_usage' | 'manual'
  condition: string
  value: any
  triggered: boolean
  triggeredAt?: Date
}

export interface TrialWorkflow {
  id: string
  assetId: string
  steps: TrialWorkflowStep[]
  currentStep: number
  status: 'active' | 'completed' | 'failed'
}

export interface TrialWorkflowStep {
  id: string
  name: string
  description: string
  type: 'setup' | 'tutorial' | 'evaluation' | 'conversion'
  required: boolean
  completed: boolean
  completedAt?: Date
  data?: any
}

export interface TrialNotification {
  id: string
  trialId: string
  type: 'welcome' | 'reminder' | 'expiry_warning' | 'conversion_offer' | 'expired'
  subject: string
  message: string
  sentAt: Date
  readAt?: Date
}

class TrialManagementService {
  private trials: Map<string, Trial> = new Map()
  private analytics: Map<string, TrialAnalytics> = new Map()
  private workflows: Map<string, TrialWorkflow> = new Map()
  private notifications: Map<string, TrialNotification> = new Map()
  private conversionTriggers: Map<string, TrialConversionTrigger[]> = new Map()

  async provisionTrial(request: TrialRequest): Promise<TrialProvisioning> {
    try {
      // Validate asset exists and trials are enabled
      const asset = await this.getAsset(request.assetId)
      if (!asset) {
        throw new Error('Asset not found')
      }
      if (!asset.trials.enabled) {
        throw new Error('Trials not enabled for this asset')
      }

      // Create trial record
      const trial: Trial = {
        id: this.generateId(),
        assetId: request.assetId,
        userId: request.userId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + asset.trials.duration * 24 * 60 * 60 * 1000),
        usage: {
          requests: 0,
          storage: 0,
          compute: 0,
          lastAccess: new Date()
        }
      }

      this.trials.set(trial.id, trial)

      // Initialize analytics
      const analytics: TrialAnalytics = {
        trialId: trial.id,
        assetId: request.assetId,
        userId: request.userId,
        usage: trial.usage,
        engagement: {
          loginCount: 0,
          lastLogin: new Date(),
          sessionDuration: 0,
          featureUsage: {},
          notebookRuns: 0,
          dataDownloads: 0
        },
        conversionProbability: 0.1,
        recommendations: ['Complete the getting started tutorial', 'Explore sample data']
      }

      this.analytics.set(trial.id, analytics)

      // Create trial workflow
      const workflow = this.createTrialWorkflow(trial.id, request.assetId)
      this.workflows.set(trial.id, workflow)

      // Setup conversion triggers
      const triggers = this.setupConversionTriggers(trial.id, asset)
      this.conversionTriggers.set(trial.id, triggers)

      // Send welcome notification
      await this.sendNotification(trial.id, 'welcome', {
        subject: `Welcome to your ${asset.name} trial!`,
        message: `Your trial is now active. You have ${asset.trials.duration} days to explore ${asset.name}.`
      })

      return {
        trialId: trial.id,
        assetId: request.assetId,
        userId: request.userId,
        status: 'active',
        accessUrl: this.generateAccessUrl(trial.id),
        credentials: this.generateCredentials(trial.id)
      }

    } catch (error) {
      return {
        trialId: this.generateId(),
        assetId: request.assetId,
        userId: request.userId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async trackTrialUsage(trialId: string, usage: Partial<TrialUsage>): Promise<void> {
    const trial = this.trials.get(trialId)
    const analytics = this.analytics.get(trialId)
    
    if (!trial || !analytics) return

    // Update trial usage
    trial.usage = { ...trial.usage, ...usage, lastAccess: new Date() }
    this.trials.set(trialId, trial)

    // Update analytics
    analytics.usage = trial.usage
    analytics.conversionProbability = this.calculateConversionProbability(analytics)
    this.analytics.set(trialId, analytics)

    // Check conversion triggers
    await this.checkConversionTriggers(trialId)
  }

  async trackEngagement(trialId: string, engagement: Partial<EngagementMetrics>): Promise<void> {
    const analytics = this.analytics.get(trialId)
    if (!analytics) return

    analytics.engagement = { ...analytics.engagement, ...engagement }
    analytics.conversionProbability = this.calculateConversionProbability(analytics)
    this.analytics.set(trialId, analytics)
  }

  async convertTrial(trialId: string, tier: string, trigger: string): Promise<void> {
    const trial = this.trials.get(trialId)
    if (!trial) return

    trial.status = 'converted'
    trial.conversionData = {
      convertedAt: new Date(),
      tier,
      revenue: this.calculateRevenue(tier),
      trigger
    }

    this.trials.set(trialId, trial)

    // Send conversion notification
    await this.sendNotification(trialId, 'conversion_offer', {
      subject: 'Congratulations! Your trial has been converted',
      message: `Your trial has been successfully converted to ${tier} tier.`
    })
  }

  async expireTrial(trialId: string): Promise<void> {
    const trial = this.trials.get(trialId)
    if (!trial) return

    trial.status = 'expired'
    this.trials.set(trialId, trial)

    // Send expiry notification
    await this.sendNotification(trialId, 'expired', {
      subject: 'Your trial has expired',
      message: 'Your trial period has ended. Consider upgrading to continue using the service.'
    })
  }

  async getTrialAnalytics(trialId: string): Promise<TrialAnalytics | null> {
    return this.analytics.get(trialId) || null
  }

  async getConversionMetrics(assetId: string): Promise<ConversionMetrics> {
    const assetTrials = Array.from(this.trials.values()).filter(t => t.assetId === assetId)
    const conversions = assetTrials.filter(t => t.status === 'converted')
    
    const conversionRate = assetTrials.length > 0 ? conversions.length / assetTrials.length : 0
    const averageTimeToConvert = conversions.length > 0 
      ? conversions.reduce((sum, t) => sum + (t.conversionData!.convertedAt.getTime() - t.startDate.getTime()), 0) / conversions.length
      : 0

    const revenue = conversions.reduce((sum, t) => sum + (t.conversionData?.revenue || 0), 0)
    const triggers = conversions.map(t => t.conversionData?.trigger || '').filter(Boolean)

    return {
      assetId,
      totalTrials: assetTrials.length,
      conversions: conversions.length,
      conversionRate,
      averageTimeToConvert,
      revenue,
      topTriggers: this.getTopTriggers(triggers)
    }
  }

  async getActiveTrials(): Promise<Trial[]> {
    return Array.from(this.trials.values()).filter(t => t.status === 'active')
  }

  async getExpiringTrials(daysThreshold: number = 3): Promise<Trial[]> {
    const threshold = Date.now() + daysThreshold * 24 * 60 * 60 * 1000
    return Array.from(this.trials.values()).filter(t => 
      t.status === 'active' && t.endDate.getTime() <= threshold
    )
  }

  async updateWorkflowStep(trialId: string, stepId: string, completed: boolean, data?: any): Promise<void> {
    const workflow = this.workflows.get(trialId)
    if (!workflow) return

    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) return

    step.completed = completed
    if (completed) {
      step.completedAt = new Date()
      step.data = data
    }

    // Update current step
    const nextStep = workflow.steps.find(s => !s.completed)
    if (nextStep) {
      workflow.currentStep = workflow.steps.indexOf(nextStep)
    } else {
      workflow.status = 'completed'
    }

    this.workflows.set(trialId, workflow)
  }

  async sendNotification(trialId: string, type: string, content: { subject: string; message: string }): Promise<void> {
    const notification: TrialNotification = {
      id: this.generateId(),
      trialId,
      type: type as any,
      subject: content.subject,
      message: content.message,
      sentAt: new Date()
    }

    this.notifications.set(notification.id, notification)
  }

  private async getAsset(assetId: string): Promise<MarketplaceAsset | null> {
    // This would typically come from the marketplace asset service
    // For now, return a mock asset
    return {
      id: assetId,
      name: 'Sample Asset',
      type: 'dataset',
      description: 'Sample dataset for trial',
      version: '1.0.0',
      author: 'Aethergen',
      created: new Date(),
      updated: new Date(),
      status: 'published',
      platform: 'universal',
      metadata: {
        fileSize: 1024,
        checksum: 'abc123',
        dependencies: [],
        requirements: [],
        license: {
          type: 'MIT',
          terms: 'MIT License',
          restrictions: [],
          attribution: 'Aethergen',
          commercial: true
        },
        usage: {
          allowedUse: ['research', 'commercial'],
          prohibitedUse: [],
          redistribution: false,
          modification: true,
          retention: '30 days'
        }
      },
      evidence: {
        metrics: [],
        plots: [],
        ablation: [],
        privacy: {
          synthetic: false,
          privacyMetrics: []
        },
        reproducibility: {
          seeds: [42],
          config: {},
          hash: 'abc123',
          environment: 'python 3.9'
        },
        stability: {
          crossValidation: 0.95,
          segmentStability: 0.92,
          temporalStability: 0.88,
          robustness: 0.90
        }
      },
      pricing: [
        {
          name: 'self-service',
          price: 99,
          currency: 'USD',
          period: 'monthly',
          features: ['basic access', 'support'],
          limits: {
            users: 5,
            requests: 1000,
            storage: 10,
            compute: 100
          }
        }
      ],
      trials: {
        enabled: true,
        duration: 14,
        features: ['full access', 'samples', 'documentation'],
        limits: {
          users: 1,
          requests: 100,
          storage: 1,
          compute: 10
        },
        conversionTriggers: ['usage_threshold', 'time_limit']
      },
      tags: ['sample', 'demo']
    }
  }

  private createTrialWorkflow(trialId: string, assetId: string): TrialWorkflow {
    return {
      id: this.generateId(),
      assetId,
      steps: [
        {
          id: 'setup',
          name: 'Setup Environment',
          description: 'Configure your trial environment',
          type: 'setup',
          required: true,
          completed: false
        },
        {
          id: 'tutorial',
          name: 'Getting Started Tutorial',
          description: 'Complete the getting started tutorial',
          type: 'tutorial',
          required: true,
          completed: false
        },
        {
          id: 'evaluation',
          name: 'Evaluate Features',
          description: 'Explore key features and capabilities',
          type: 'evaluation',
          required: false,
          completed: false
        },
        {
          id: 'conversion',
          name: 'Upgrade to Paid',
          description: 'Convert your trial to a paid subscription',
          type: 'conversion',
          required: false,
          completed: false
        }
      ],
      currentStep: 0,
      status: 'active'
    }
  }

  private setupConversionTriggers(trialId: string, asset: MarketplaceAsset): TrialConversionTrigger[] {
    return [
      {
        type: 'usage_threshold',
        condition: 'requests > 50',
        value: 50,
        triggered: false
      },
      {
        type: 'time_limit',
        condition: 'days_remaining < 3',
        value: 3,
        triggered: false
      },
      {
        type: 'feature_usage',
        condition: 'notebook_runs > 5',
        value: 5,
        triggered: false
      }
    ]
  }

  private async checkConversionTriggers(trialId: string): Promise<void> {
    const triggers = this.conversionTriggers.get(trialId)
    const analytics = this.analytics.get(trialId)
    
    if (!triggers || !analytics) return

    for (const trigger of triggers) {
      if (trigger.triggered) continue

      let shouldTrigger = false
      switch (trigger.type) {
        case 'usage_threshold':
          shouldTrigger = analytics.usage.requests >= trigger.value
          break
        case 'time_limit':
          const trial = this.trials.get(trialId)
          if (trial) {
            const daysRemaining = Math.ceil((trial.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            shouldTrigger = daysRemaining <= trigger.value
          }
          break
        case 'feature_usage':
          shouldTrigger = analytics.engagement.notebookRuns >= trigger.value
          break
      }

      if (shouldTrigger) {
        trigger.triggered = true
        trigger.triggeredAt = new Date()
        
        // Send conversion offer notification
        await this.sendNotification(trialId, 'conversion_offer', {
          subject: 'Special offer: Convert your trial now!',
          message: 'You\'ve reached a milestone in your trial. Consider upgrading to continue your work.'
        })
      }
    }
  }

  private calculateConversionProbability(analytics: TrialAnalytics): number {
    let probability = 0.1 // Base probability

    // Usage-based factors
    if (analytics.usage.requests > 50) probability += 0.2
    if (analytics.usage.storage > 5) probability += 0.1

    // Engagement-based factors
    if (analytics.engagement.loginCount > 5) probability += 0.2
    if (analytics.engagement.notebookRuns > 3) probability += 0.2
    if (analytics.engagement.sessionDuration > 3600) probability += 0.1

    // Time-based factors
    const trial = this.trials.get(analytics.trialId)
    if (trial) {
      const daysElapsed = (Date.now() - trial.startDate.getTime()) / (24 * 60 * 60 * 1000)
      if (daysElapsed > 7) probability += 0.1
    }

    return Math.min(probability, 0.9) // Cap at 90%
  }

  private calculateRevenue(tier: string): number {
    const tierMap: Record<string, number> = {
      'self-service': 99,
      'assisted': 299,
      'full-service': 999
    }
    return tierMap[tier] || 0
  }

  private getTopTriggers(triggers: string[]): string[] {
    const triggerCounts = triggers.reduce((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(triggerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trigger]) => trigger)
  }

  private generateId(): string {
    return `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAccessUrl(trialId: string): string {
    return `https://trial.aethergen.com/${trialId}`
  }

  private generateCredentials(trialId: string): TrialCredentials {
    return {
      username: `trial_${trialId}`,
      password: this.generatePassword(),
      apiKey: this.generateApiKey(),
      workspaceUrl: `https://workspace.aethergen.com/${trialId}`
    }
  }

  private generatePassword(): string {
    return Math.random().toString(36).substr(2, 12)
  }

  private generateApiKey(): string {
    return `aeg_${Math.random().toString(36).substr(2, 32)}`
  }
}

export const trialManagementService = new TrialManagementService()
