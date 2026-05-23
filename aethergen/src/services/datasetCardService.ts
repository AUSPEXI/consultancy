import JSZip from 'jszip'
import { generateAirGappedBundle, AirGappedOptions } from './edgePackagingService'

export interface DatasetSchema {
  entities: string[]
  relations: Array<{
    from: string
    to: string
    cardinality: string
  }>
  fields: Record<string, {
    type: string
    description?: string
    constraints?: string[]
    vocabulary?: string[]
  }>
}

export interface DatasetQuality {
  coverage: Record<string, number>
  nulls: Record<string, number>
  ranges: Record<string, { min: number; max: number }>
  constraints: Record<string, string[]>
  data_health_score: number
}

export interface DatasetFidelity {
  marginals: Record<string, number>
  joints: Record<string, number>
  alignment_score: number
  utility_baseline: Record<string, number>
}

export interface DatasetPrivacy {
  probes: {
    reid_risk: number
    attribute_disclosure: number
    membership_inference: number
  }
  budgets?: {
    epsilon: number
    delta: number
  }
  non_goals: string[]
}

export interface DatasetCard {
  name: string
  version: string
  purpose: string
  domain: string
  target_tasks: string[]
  schema: DatasetSchema
  quality: DatasetQuality
  fidelity: DatasetFidelity
  privacy: DatasetPrivacy
  packaging: {
    format: string
    unity_catalog?: string
    file_size: number
    record_count: number
  }
  evidence: {
    metrics: string[]
    plots: string[]
    manifest: string
    checksums: Record<string, string>
  }
  limits: {
    intended_use: string[]
    failure_modes: string[]
    caveats: string[]
  }
  support: {
    refresh_cadence: string
    contact: string
    slas: Record<string, string>
  }
  created_at: string
  updated_at: string
}

export interface DatasetCardOptions {
  name: string
  version: string
  purpose: string
  domain: string
  target_tasks: string[]
  schema: DatasetSchema
  quality_metrics: DatasetQuality
  fidelity_metrics: DatasetFidelity
  privacy_config: DatasetPrivacy
  packaging_config: {
    format: string
    unity_catalog?: string
    file_size: number
    record_count: number
  }
  evidence_artifacts: {
    metrics_files: string[]
    plot_files: string[]
    manifest_file: string
  }
  limits: {
    intended_use: string[]
    failure_modes: string[]
    caveats: string[]
  }
  support: {
    refresh_cadence: string
    contact: string
    slas: Record<string, string>
  }
}

class DatasetCardService {
  private cards: Map<string, DatasetCard> = new Map()

  async generateDatasetCard(options: DatasetCardOptions): Promise<DatasetCard> {
    const card: DatasetCard = {
      name: options.name,
      version: options.version,
      purpose: options.purpose,
      domain: options.domain,
      target_tasks: options.target_tasks,
      schema: options.schema,
      quality: options.quality_metrics,
      fidelity: options.fidelity_metrics,
      privacy: options.privacy_config,
      packaging: options.packaging_config,
      evidence: {
        metrics: options.evidence_artifacts.metrics_files,
        plots: options.evidence_artifacts.plot_files,
        manifest: options.evidence_artifacts.manifest_file,
        checksums: await this.generateChecksums(options.evidence_artifacts)
      },
      limits: options.limits,
      support: options.support,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const cardId = `${options.name}-${options.version}`
    this.cards.set(cardId, card)
    return card
  }

  async generateDatasetCardTemplate(domain: string, purpose: string): Promise<DatasetCardOptions> {
    const templates = {
      healthcare: {
        entities: ['patient', 'provider', 'facility', 'claim', 'line_item', 'rx'],
        relations: [
          { from: 'patient', to: 'claim', cardinality: '1..*' },
          { from: 'claim', to: 'line_item', cardinality: '1..*' }
        ],
        fields: {
          claim: { type: 'date', description: 'Claim date' },
          pos: { type: 'code', description: 'Place of service' },
          amount_billed: { type: 'decimal', description: 'Billed amount' }
        }
      },
      financial: {
        entities: ['customer', 'account', 'transaction', 'merchant'],
        relations: [
          { from: 'customer', to: 'account', cardinality: '1..*' },
          { from: 'account', to: 'transaction', cardinality: '1..*' }
        ],
        fields: {
          transaction: { type: 'decimal', description: 'Transaction amount' },
          merchant: { type: 'string', description: 'Merchant name' },
          timestamp: { type: 'datetime', description: 'Transaction timestamp' }
        }
      },
      automotive: {
        entities: ['vehicle', 'part', 'defect', 'station', 'operator'],
        relations: [
          { from: 'vehicle', to: 'part', cardinality: '1..*' },
          { from: 'part', to: 'defect', cardinality: '0..*' }
        ],
        fields: {
          defect_type: { type: 'string', description: 'Type of defect' },
          severity: { type: 'integer', description: 'Defect severity' },
          timestamp: { type: 'datetime', description: 'Detection timestamp' }
        }
      }
    }

    const template = templates[domain as keyof typeof templates] || templates.healthcare

    return {
      name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Dataset`,
      version: '2025.01',
      purpose,
      domain,
      target_tasks: ['classification', 'detection', 'prediction'],
      schema: {
        entities: template.entities,
        relations: template.relations,
        fields: template.fields
      },
      quality_metrics: {
        coverage: { 'amount_billed': 100, 'timestamp': 99.7 },
        nulls: { 'amount_billed': 0, 'timestamp': 0.3 },
        ranges: { 'amount_billed': { min: 0, max: 100000 } },
        constraints: { 'amount_billed': ['>=0'] },
        data_health_score: 0.95
      },
      fidelity_metrics: {
        marginals: { 'amount_billed': 0.92, 'timestamp': 0.89 },
        joints: { 'amount_billed_timestamp': 0.87 },
        alignment_score: 0.91,
        utility_baseline: { 'baseline_rules@1%FPR': 0.15 }
      },
      privacy_config: {
        probes: {
          reid_risk: 0.01,
          attribute_disclosure: 0.02,
          membership_inference: 0.03
        },
        budgets: { epsilon: 0.8, delta: 1e-6 },
        non_goals: ['clinical diagnosis', 'personal identification']
      },
      packaging_config: {
        format: 'Delta/Parquet',
        unity_catalog: `catalog.${domain}.table`,
        file_size: 1024000,
        record_count: 100000
      },
      evidence_artifacts: {
        metrics_files: ['metrics/utility@op.json', 'metrics/quality.json'],
        plot_files: ['plots/roc_pr.html', 'plots/distribution.html'],
        manifest_file: 'manifest.json'
      },
      limits: {
        intended_use: ['prototyping', 'evaluation', 'research'],
        failure_modes: ['rare codes underrepresented', 'extreme values'],
        caveats: ['not for clinical diagnosis', 'synthetic data only']
      },
      support: {
        refresh_cadence: 'monthly',
        contact: 'sales@auspexi.com',
        slas: { 'response_time': '24h', 'refresh_time': '48h' }
      }
    }
  }

  async exportDatasetCardAsHTML(card: DatasetCard): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dataset Card: ${card.name}</title>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #2d3748; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2 { color: #2b6cb0; }
    .section { margin-bottom: 2rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
    .metric { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .evidence-link { color: #2b6cb0; text-decoration: none; }
    .evidence-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Dataset Card: ${card.name}</h1>
  <p><strong>Version:</strong> ${card.version}</p>
  <p><strong>Purpose:</strong> ${card.purpose}</p>
  <p><strong>Domain:</strong> ${card.domain}</p>
  
  <div class="section">
    <h2>Schema</h2>
    <p><strong>Entities:</strong> ${card.schema.entities.join(', ')}</p>
    <p><strong>Relations:</strong></p>
    <ul>
      ${card.schema.relations.map(r => `<li>${r.from} ${r.cardinality} ${r.to}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Quality Metrics</h2>
    <p><strong>Data Health Score:</strong> ${card.quality.data_health_score}</p>
    <p><strong>Coverage:</strong></p>
    <ul>
      ${Object.entries(card.quality.coverage).map(([field, value]) => `<li>${field}: ${value}%</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Fidelity & Utility</h2>
    <p><strong>Alignment Score:</strong> ${card.fidelity.alignment_score}</p>
    <p><strong>Utility Baseline:</strong></p>
    <ul>
      ${Object.entries(card.fidelity.utility_baseline).map(([metric, value]) => `<li>${metric}: +${value * 100}% lift</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Privacy</h2>
    <p><strong>Re-ID Risk:</strong> ${card.privacy.probes.reid_risk}</p>
    <p><strong>Attribute Disclosure:</strong> ${card.privacy.probes.attribute_disclosure}</p>
    <p><strong>Non-Goals:</strong> ${card.privacy.non_goals.join(', ')}</p>
  </div>

  <div class="section">
    <h2>Evidence</h2>
    <p><strong>Metrics:</strong></p>
    <ul>
      ${card.evidence.metrics.map(file => `<li><a href="${file}" class="evidence-link">${file}</a></li>`).join('')}
    </ul>
    <p><strong>Plots:</strong></p>
    <ul>
      ${card.evidence.plots.map(file => `<li><a href="${file}" class="evidence-link">${file}</a></li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Limits</h2>
    <p><strong>Intended Use:</strong> ${card.limits.intended_use.join(', ')}</p>
    <p><strong>Caveats:</strong> ${card.limits.caveats.join(', ')}</p>
  </div>

  <div class="section">
    <h2>Support</h2>
    <p><strong>Refresh Cadence:</strong> ${card.support.refresh_cadence}</p>
    <p><strong>Contact:</strong> ${card.support.contact}</p>
  </div>
</body>
</html>
    `
  }

  async exportDatasetCardAsJSON(card: DatasetCard): Promise<string> {
    return JSON.stringify(card, null, 2)
  }

  async generateChecksums(artifacts: { metrics_files: string[]; plot_files: string[]; manifest_file: string }): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {}
    
    // Simulate checksum generation
    const allFiles = [...artifacts.metrics_files, ...artifacts.plot_files, artifacts.manifest_file]
    for (const file of allFiles) {
      checksums[file] = `sha256:${Math.random().toString(36).substring(2, 15)}`
    }
    
    return checksums
  }

  async getDatasetCard(cardId: string): Promise<DatasetCard | null> {
    return this.cards.get(cardId) || null
  }

  async getAllDatasetCards(): Promise<DatasetCard[]> {
    return Array.from(this.cards.values())
  }

  async updateDatasetCard(cardId: string, updates: Partial<DatasetCard>): Promise<DatasetCard | null> {
    const card = this.cards.get(cardId)
    if (!card) return null

    const updatedCard = { ...card, ...updates, updated_at: new Date().toISOString() }
    this.cards.set(cardId, updatedCard)
    return updatedCard
  }

  async deleteDatasetCard(cardId: string): Promise<boolean> {
    return this.cards.delete(cardId)
  }
}

export const datasetCardService = new DatasetCardService()
