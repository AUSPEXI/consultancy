import JSZip from 'jszip'
import { generateAirGappedBundle, AirGappedOptions } from './edgePackagingService'

export interface MarketplaceAsset {
  id: string
  name: string
  type: 'dataset' | 'model' | 'evidence_bundle'
  description: string
  version: string
  author: string
  created: Date
  updated: Date
  status: 'draft' | 'published' | 'archived'
  platform: 'databricks' | 'azure' | 'internal' | 'universal'
  metadata: AssetMetadata
  evidence: EvidenceBundle
  pricing: PricingTier[]
  trials: TrialConfig
  tags: string[]
}

export interface AssetMetadata {
  schema?: DatasetSchema
  modelInfo?: ModelInfo
  fileSize: number
  checksum: string
  dependencies: string[]
  requirements: string[]
  license: LicenseInfo
  usage: UsagePolicy
}

export interface DatasetSchema {
  fields: SchemaField[]
  constraints: SchemaConstraint[]
  sampleData: any[]
  rowCount: number
  format: 'delta' | 'parquet' | 'csv' | 'json'
}

export interface SchemaField {
  name: string
  type: string
  description: string
  nullable: boolean
  constraints?: string[]
}

export interface SchemaConstraint {
  name: string
  type: 'unique' | 'foreign_key' | 'check' | 'not_null'
  expression: string
}

export interface ModelInfo {
  framework: string
  format: 'mlflow' | 'onnx' | 'gguf' | 'pytorch' | 'tensorflow'
  architecture: string
  parameters: number
  inputShape: number[]
  outputShape: number[]
  deviceRequirements: string[]
  inferenceLatency: number
  accuracy: number
}

export interface LicenseInfo {
  type: string
  terms: string
  restrictions: string[]
  attribution: string
  commercial: boolean
}

export interface UsagePolicy {
  allowedUse: string[]
  prohibitedUse: string[]
  redistribution: boolean
  modification: boolean
  retention: string
}

export interface EvidenceBundle {
  metrics: Metric[]
  plots: Plot[]
  ablation: AblationResult[]
  privacy: PrivacyInfo
  reproducibility: ReproducibilityInfo
  stability: StabilityMetrics
}

export interface Metric {
  name: string
  value: number
  confidenceInterval: [number, number]
  unit: string
  description: string
}

export interface Plot {
  type: 'line' | 'bar' | 'scatter' | 'heatmap' | 'histogram'
  title: string
  data: any
  config: any
}

export interface AblationResult {
  component: string
  baseline: number
  ablated: number
  impact: number
  significance: 'high' | 'medium' | 'low'
}

export interface PrivacyInfo {
  synthetic: boolean
  differentialPrivacy?: DifferentialPrivacy
  privacyMetrics: PrivacyMetric[]
}

export interface DifferentialPrivacy {
  epsilon: number
  delta: number
  mechanism: string
}

export interface PrivacyMetric {
  name: string
  value: number
  threshold: number
  passed: boolean
}

export interface ReproducibilityInfo {
  seeds: number[]
  config: any
  hash: string
  environment: string
}

export interface StabilityMetrics {
  crossValidation: number
  segmentStability: number
  temporalStability: number
  robustness: number
}

export interface PricingTier {
  name: string
  price: number
  currency: string
  period: 'monthly' | 'annual' | 'one_time'
  features: string[]
  limits: UsageLimits
}

export interface UsageLimits {
  users: number
  requests: number
  storage: number
  compute: number
}

export interface TrialConfig {
  enabled: boolean
  duration: number // days
  features: string[]
  limits: UsageLimits
  conversionTriggers: string[]
}

export interface Listing {
  id: string
  assetId: string
  title: string
  description: string
  platform: string
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  metadata: ListingMetadata
  content: ListingContent
}

export interface ListingMetadata {
  category: string
  tags: string[]
  targetAudience: string[]
  useCases: string[]
  requirements: string[]
}

export interface ListingContent {
  readme: string
  samples: Sample[]
  notebooks: Notebook[]
  documentation: Documentation[]
}

export interface Sample {
  name: string
  description: string
  data: any
  format: string
}

export interface Notebook {
  name: string
  description: string
  content: string
  language: 'python' | 'r' | 'sql' | 'scala'
}

export interface Documentation {
  title: string
  content: string
  type: 'guide' | 'api' | 'tutorial' | 'reference'
}

export interface Trial {
  id: string
  assetId: string
  userId: string
  status: 'active' | 'expired' | 'converted' | 'cancelled'
  startDate: Date
  endDate: Date
  usage: TrialUsage
  conversionData?: ConversionData
}

export interface TrialUsage {
  requests: number
  storage: number
  compute: number
  lastAccess: Date
}

export interface ConversionData {
  convertedAt: Date
  tier: string
  revenue: number
  trigger: string
}

export interface ConversionMetrics {
  assetId: string
  totalTrials: number
  conversions: number
  conversionRate: number
  averageTimeToConvert: number
  revenue: number
  topTriggers: string[]
}

class MarketplaceAssetService {
  private assets: Map<string, MarketplaceAsset> = new Map()
  private listings: Map<string, Listing> = new Map()
  private trials: Map<string, Trial> = new Map()

  async createAsset(asset: Omit<MarketplaceAsset, 'id' | 'created' | 'updated'>): Promise<MarketplaceAsset> {
    const newAsset: MarketplaceAsset = {
      ...asset,
      id: this.generateId(),
      created: new Date(),
      updated: new Date()
    }
    
    this.assets.set(newAsset.id, newAsset)
    return newAsset
  }

  async getAsset(assetId: string): Promise<MarketplaceAsset | null> {
    return this.assets.get(assetId) || null
  }

  async updateAsset(assetId: string, updates: Partial<MarketplaceAsset>): Promise<MarketplaceAsset | null> {
    const asset = this.assets.get(assetId)
    if (!asset) return null

    const updatedAsset: MarketplaceAsset = {
      ...asset,
      ...updates,
      updated: new Date()
    }

    this.assets.set(assetId, updatedAsset)
    return updatedAsset
  }

  async generateListing(asset: MarketplaceAsset): Promise<Listing> {
    const listing: Listing = {
      id: this.generateId(),
      assetId: asset.id,
      title: asset.name,
      description: asset.description,
      platform: asset.platform,
      status: 'draft',
      metadata: {
        category: this.inferCategory(asset),
        tags: asset.tags,
        targetAudience: this.inferAudience(asset),
        useCases: this.generateUseCases(asset),
        requirements: asset.metadata.requirements
      },
      content: await this.generateListingContent(asset)
    }

    this.listings.set(listing.id, listing)
    return listing
  }

  async provisionTrial(asset: MarketplaceAsset, userId: string): Promise<Trial> {
    if (!asset.trials.enabled) {
      throw new Error('Trials not enabled for this asset')
    }

    const trial: Trial = {
      id: this.generateId(),
      assetId: asset.id,
      userId,
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
    return trial
  }

  async trackTrialUsage(trialId: string, usage: Partial<TrialUsage>): Promise<void> {
    const trial = this.trials.get(trialId)
    if (!trial) return

    trial.usage = { ...trial.usage, ...usage, lastAccess: new Date() }
    this.trials.set(trialId, trial)
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
  }

  async trackConversions(assetId: string): Promise<ConversionMetrics> {
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

  async generateMarketplacePackage(asset: MarketplaceAsset, platform: string): Promise<Blob> {
    const listing = await this.generateListing(asset)
    
    const packageData = {
      asset,
      listing,
      evidence: asset.evidence,
      samples: await this.generateSamples(asset),
      notebooks: await this.generateNotebooks(asset),
      documentation: await this.generateDocumentation(asset)
    }

    const zip = new JSZip()
    
    // Add asset files
    zip.file('asset.json', JSON.stringify(asset, null, 2))
    zip.file('listing.json', JSON.stringify(listing, null, 2))
    zip.file('evidence.json', JSON.stringify(asset.evidence, null, 2))
    
    // Add samples
    const samplesFolder = zip.folder('samples')
    packageData.samples.forEach(sample => {
      samplesFolder?.file(`${sample.name}.${sample.format}`, JSON.stringify(sample.data))
    })
    
    // Add notebooks
    const notebooksFolder = zip.folder('notebooks')
    packageData.notebooks.forEach(notebook => {
      notebooksFolder?.file(`${notebook.name}.${notebook.language}`, notebook.content)
    })
    
    // Add documentation
    const docsFolder = zip.folder('documentation')
    packageData.documentation.forEach(doc => {
      docsFolder?.file(`${doc.title}.md`, doc.content)
    })

    return await zip.generateAsync({ type: 'blob' })
  }

  private generateId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private inferCategory(asset: MarketplaceAsset): string {
    if (asset.type === 'dataset') {
      return asset.tags.includes('synthetic') ? 'synthetic-data' : 'datasets'
    } else if (asset.type === 'model') {
      return asset.metadata.modelInfo?.framework === 'llm' ? 'llm-models' : 'ml-models'
    }
    return 'evidence-bundles'
  }

  private inferAudience(asset: MarketplaceAsset): string[] {
    const audiences = []
    if (asset.tags.includes('finance')) audiences.push('financial-services')
    if (asset.tags.includes('healthcare')) audiences.push('healthcare')
    if (asset.tags.includes('manufacturing')) audiences.push('manufacturing')
    if (asset.tags.includes('retail')) audiences.push('retail')
    return audiences.length > 0 ? audiences : ['general']
  }

  private generateUseCases(asset: MarketplaceAsset): string[] {
    const useCases = []
    if (asset.type === 'dataset') {
      useCases.push('training', 'validation', 'testing')
    } else if (asset.type === 'model') {
      useCases.push('inference', 'fine-tuning', 'evaluation')
    }
    return useCases
  }

  private async generateListingContent(asset: MarketplaceAsset): Promise<ListingContent> {
    const readme = this.generateReadme(asset)
    const samples = await this.generateSamples(asset)
    const notebooks = await this.generateNotebooks(asset)
    const documentation = await this.generateDocumentation(asset)

    return { readme, samples, notebooks, documentation }
  }

  private generateReadme(asset: MarketplaceAsset): string {
    return `# ${asset.name}

${asset.description}

## Features
${asset.metadata.requirements.map(req => `- ${req}`).join('\n')}

## Evidence
- Accuracy: ${asset.evidence.metrics.find(m => m.name === 'accuracy')?.value || 'N/A'}
- Stability: ${asset.evidence.stability.crossValidation}
- Privacy: ${asset.evidence.privacy.synthetic ? 'Synthetic data' : 'Real data'}

## Pricing
${asset.pricing.map(tier => `- ${tier.name}: ${tier.price} ${tier.currency}/${tier.period}`).join('\n')}

## Trial
${asset.trials.enabled ? `Free ${asset.trials.duration}-day trial available` : 'No trial available'}
`
  }

  private async generateSamples(asset: MarketplaceAsset): Promise<Sample[]> {
    if (asset.type === 'dataset' && asset.metadata.schema) {
      return [{
        name: 'sample_data',
        description: 'Sample data from the dataset',
        data: asset.metadata.schema.sampleData,
        format: 'json'
      }]
    }
    return []
  }

  private async generateNotebooks(asset: MarketplaceAsset): Promise<Notebook[]> {
    const notebooks = []
    
    if (asset.type === 'dataset') {
      notebooks.push({
        name: 'explore_dataset',
        description: 'Notebook to explore the dataset',
        content: this.generateDatasetNotebook(asset),
        language: 'python'
      })
    } else if (asset.type === 'model') {
      notebooks.push({
        name: 'model_inference',
        description: 'Notebook for model inference',
        content: this.generateModelNotebook(asset),
        language: 'python'
      })
    }
    
    return notebooks
  }

  private generateDatasetNotebook(asset: MarketplaceAsset): string {
    return `# Explore ${asset.name}

import pandas as pd
import matplotlib.pyplot as plt

# Load the dataset
df = pd.read_parquet('${asset.name}.parquet')

# Basic exploration
print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

# Sample data
print(df.head())

# Basic statistics
print(df.describe())
`
  }

  private generateModelNotebook(asset: MarketplaceAsset): string {
    return `# ${asset.name} Inference

import mlflow
import numpy as np

# Load the model
model = mlflow.pyfunc.load_model('${asset.name}')

# Prepare input data
input_data = np.random.random(${asset.metadata.modelInfo?.inputShape || [1, 10]})

# Run inference
predictions = model.predict(input_data)
print(f"Predictions: {predictions}")
`
  }

  private async generateDocumentation(asset: MarketplaceAsset): Promise<Documentation[]> {
    return [
      {
        title: 'Getting Started',
        content: `# Getting Started with ${asset.name}

This guide will help you get started with ${asset.name}.

## Installation
\`\`\`bash
pip install ${asset.name}
\`\`\`

## Quick Start
\`\`\`python
import ${asset.name.replace('-', '_')}
# Your code here
\`\`\`
`,
        type: 'guide'
      },
      {
        title: 'API Reference',
        content: `# API Reference

## Functions

### main_function()
Main function for ${asset.name}

**Parameters:**
- param1: Description
- param2: Description

**Returns:**
- Description of return value
`,
        type: 'reference'
      }
    ]
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
}

export const marketplaceAssetService = new MarketplaceAssetService()
