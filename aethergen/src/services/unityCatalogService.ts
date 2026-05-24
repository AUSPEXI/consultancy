import JSZip from 'jszip'
import { DatasetCard } from './datasetCardService'
import { ModelCard } from './modelCardService'

export interface UnityCatalogConfig {
  workspace_url: string
  catalog_name: string
  schema_name: string
  api_token: string
}

export interface UnityCatalogAsset {
  name: string
  type: 'table' | 'model' | 'function'
  catalog: string
  schema: string
  path: string
  description: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UnityCatalogGrant {
  principal: string
  privileges: string[]
  catalog?: string
  schema?: string
  table?: string
  model?: string
}

export interface UnityCatalogLineage {
  asset_id: string
  upstream_assets: string[]
  downstream_assets: string[]
  transformation_type: string
  metadata: Record<string, any>
}

export interface UnityCatalogExport {
  format: 'html' | 'pdf' | 'json'
  include_evidence: boolean
  include_lineage: boolean
  include_grants: boolean
}

class UnityCatalogService {
  private config: UnityCatalogConfig | null = null
  private assets: Map<string, UnityCatalogAsset> = new Map()
  private grants: Map<string, UnityCatalogGrant> = new Map()
  private lineage: Map<string, UnityCatalogLineage> = new Map()

  async configure(config: UnityCatalogConfig): Promise<void> {
    this.config = config
    // In a real implementation, this would validate the connection
    console.log('Unity Catalog configured:', config.workspace_url)
  }

  async registerDataset(datasetCard: DatasetCard, data_path: string): Promise<UnityCatalogAsset> {
    if (!this.config) {
      throw new Error('Unity Catalog not configured')
    }

    const asset: UnityCatalogAsset = {
      name: datasetCard.name.toLowerCase().replace(/\s+/g, '_'),
      type: 'table',
      catalog: this.config.catalog_name,
      schema: this.config.schema_name,
      path: `${this.config.catalog_name}.${this.config.schema_name}.${datasetCard.name.toLowerCase().replace(/\s+/g, '_')}`,
      description: datasetCard.purpose,
      metadata: {
        version: datasetCard.version,
        domain: datasetCard.domain,
        target_tasks: datasetCard.target_tasks,
        quality_score: datasetCard.quality.data_health_score,
        fidelity_score: datasetCard.fidelity.alignment_score,
        privacy_probes: datasetCard.privacy.probes,
        evidence_manifest: datasetCard.evidence.manifest,
        data_path: data_path,
        record_count: datasetCard.packaging.record_count,
        file_size: datasetCard.packaging.file_size,
        format: datasetCard.packaging.format
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const assetId = `${asset.catalog}.${asset.schema}.${asset.name}`
    this.assets.set(assetId, asset)

    // Add default grants
    await this.addGrant({
      principal: 'account users',
      privileges: ['SELECT'],
      catalog: asset.catalog,
      schema: asset.schema,
      table: asset.name
    })

    return asset
  }

  async registerModel(modelCard: ModelCard, model_path: string): Promise<UnityCatalogAsset> {
    if (!this.config) {
      throw new Error('Unity Catalog not configured')
    }

    const asset: UnityCatalogAsset = {
      name: modelCard.name.toLowerCase().replace(/\s+/g, '_'),
      type: 'model',
      catalog: this.config.catalog_name,
      schema: this.config.schema_name,
      path: `${this.config.catalog_name}.${this.config.schema_name}.${modelCard.name.toLowerCase().replace(/\s+/g, '_')}`,
      description: modelCard.intended_use,
      metadata: {
        version: modelCard.version,
        problem_scope: modelCard.problem_scope,
        intended_use: modelCard.intended_use,
        operating_points: modelCard.evaluation.operating_points,
        stability: modelCard.evaluation.stability,
        calibration: modelCard.calibration,
        robustness: modelCard.robustness,
        limits: modelCard.limits,
        packaging: modelCard.packaging,
        evidence_manifest: modelCard.evidence.signed_bundle_manifest,
        model_path: model_path,
        format: modelCard.packaging.format,
        device_profiles: modelCard.packaging.device_profiles
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const assetId = `${asset.catalog}.${asset.schema}.${asset.name}`
    this.assets.set(assetId, asset)

    // Add default grants
    await this.addGrant({
      principal: 'account users',
      privileges: ['EXECUTE'],
      catalog: asset.catalog,
      schema: asset.schema,
      model: asset.name
    })

    return asset
  }

  async addGrant(grant: UnityCatalogGrant): Promise<void> {
    const grantId = `${grant.principal}-${grant.catalog || '*'}-${grant.schema || '*'}-${grant.table || grant.model || '*'}`
    this.grants.set(grantId, grant)
  }

  async trackLineage(lineage: UnityCatalogLineage): Promise<void> {
    this.lineage.set(lineage.asset_id, lineage)
  }

  async exportCardAsHTML(
    card: DatasetCard | ModelCard,
    exportOptions: UnityCatalogExport
  ): Promise<string> {
    const isDataset = 'schema' in card
    const cardType = isDataset ? 'Dataset' : 'Model'
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cardType} Card: ${card.name} - Unity Catalog</title>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #2d3748; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2 { color: #2b6cb0; }
    .section { margin-bottom: 2rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
    .unity-info { background: #ebf8ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem; }
    .evidence-link { color: #2b6cb0; text-decoration: none; }
    .evidence-link:hover { text-decoration: underline; }
    .metric { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="unity-info">
    <h2>Unity Catalog Information</h2>
    <p><strong>Catalog:</strong> ${this.config?.catalog_name}</p>
    <p><strong>Schema:</strong> ${this.config?.schema_name}</p>
    <p><strong>Asset Path:</strong> ${this.config?.catalog_name}.${this.config?.schema_name}.${card.name.toLowerCase().replace(/\s+/g, '_')}</p>
    <p><strong>Asset Type:</strong> ${isDataset ? 'Table' : 'Model'}</p>
  </div>

  <h1>${cardType} Card: ${card.name}</h1>
  <p><strong>Version:</strong> ${card.version}</p>
`

    if (isDataset) {
      const datasetCard = card as DatasetCard
      html += `
  <p><strong>Purpose:</strong> ${datasetCard.purpose}</p>
  <p><strong>Domain:</strong> ${datasetCard.domain}</p>
  
  <div class="section">
    <h2>Schema</h2>
    <p><strong>Entities:</strong> ${datasetCard.schema.entities.join(', ')}</p>
    <p><strong>Relations:</strong></p>
    <ul>
      ${datasetCard.schema.relations.map(r => `<li>${r.from} ${r.cardinality} ${r.to}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Quality Metrics</h2>
    <p><strong>Data Health Score:</strong> ${datasetCard.quality.data_health_score}</p>
    <p><strong>Coverage:</strong></p>
    <ul>
      ${Object.entries(datasetCard.quality.coverage).map(([field, value]) => `<li>${field}: ${value}%</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Fidelity & Utility</h2>
    <p><strong>Alignment Score:</strong> ${datasetCard.fidelity.alignment_score}</p>
    <p><strong>Utility Baseline:</strong></p>
    <ul>
      ${Object.entries(datasetCard.fidelity.utility_baseline).map(([metric, value]) => `<li>${metric}: +${value * 100}% lift</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Privacy</h2>
    <p><strong>Re-ID Risk:</strong> ${datasetCard.privacy.probes.reid_risk}</p>
    <p><strong>Attribute Disclosure:</strong> ${datasetCard.privacy.probes.attribute_disclosure}</p>
    <p><strong>Non-Goals:</strong> ${datasetCard.privacy.non_goals.join(', ')}</p>
  </div>
`
    } else {
      const modelCard = card as ModelCard
      html += `
  <p><strong>Intended Use:</strong> ${modelCard.intended_use}</p>
  <p><strong>Problem Scope:</strong> ${modelCard.problem_scope}</p>
  
  <div class="section">
    <h2>Training Data</h2>
    <p><strong>Sources:</strong> ${modelCard.training_data.sources.join(', ')}</p>
    <p><strong>Constraints:</strong> ${modelCard.training_data.constraints.join(', ')}</p>
    <p><strong>Dataset Card:</strong> <a href="${modelCard.training_data.dataset_card_reference}" class="evidence-link">${modelCard.training_data.dataset_card_reference}</a></p>
  </div>

  <div class="section">
    <h2>Evaluation</h2>
    <h3>Operating Points</h3>
    ${modelCard.evaluation.operating_points.map(op => `
      <div class="operating-point">
        <h4>${op.name}</h4>
        <p><strong>Threshold:</strong> ${op.threshold}</p>
        <p><strong>Precision:</strong> ${op.metrics.precision} (${op.confidence_intervals.precision[0]}-${op.confidence_intervals.precision[1]})</p>
        <p><strong>Recall:</strong> ${op.metrics.recall} (${op.confidence_intervals.recall[0]}-${op.confidence_intervals.recall[1]})</p>
        <p><strong>F1:</strong> ${op.metrics.f1} (${op.confidence_intervals.f1[0]}-${op.confidence_intervals.f1[1]})</p>
        <p><strong>Business Impact:</strong> ${op.business_impact.alerts_per_day} alerts/day, $${op.business_impact.cost_savings} savings</p>
      </div>
    `).join('')}
    
    <h3>Stability</h3>
    <p><strong>Region Delta:</strong> ${modelCard.evaluation.stability.region_delta}</p>
    <p><strong>Specialty Delta:</strong> ${modelCard.evaluation.stability.specialty_delta}</p>
    <p><strong>Drift Sensitivity:</strong> ${modelCard.evaluation.drift_sensitivity}</p>
  </div>

  <div class="section">
    <h2>Calibration</h2>
    <p><strong>Method:</strong> ${modelCard.calibration.method}</p>
    <p><strong>Target:</strong> ${modelCard.calibration.target}</p>
    <p><strong>Trade-offs:</strong></p>
    <ul>
      <li>Precision vs Recall: ${modelCard.calibration.trade_offs.precision_vs_recall}</li>
      <li>Cost vs Accuracy: ${modelCard.calibration.trade_offs.cost_vs_accuracy}</li>
      <li>Speed vs Quality: ${modelCard.calibration.trade_offs.speed_vs_quality}</li>
    </ul>
  </div>

  <div class="section">
    <h2>Robustness</h2>
    ${modelCard.robustness.map(test => `
      <div class="operating-point">
        <h4>${test.corruption_type} Test</h4>
        <p><strong>Performance Delta:</strong> ${test.performance_delta}</p>
        <p><strong>Vulnerable Features:</strong> ${test.failure_analysis.vulnerable_features.join(', ')}</p>
        <p><strong>Mitigation:</strong> ${test.failure_analysis.mitigation_strategies.join(', ')}</p>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Limits</h2>
    <p><strong>Out of Scope:</strong> ${modelCard.limits.out_of_scope_inputs.join(', ')}</p>
    <p><strong>Known Weaknesses:</strong> ${modelCard.limits.known_weaknesses.join(', ')}</p>
    <p><strong>Failure Modes:</strong> ${modelCard.limits.failure_modes.join(', ')}</p>
  </div>

  <div class="section">
    <h2>Packaging</h2>
    <p><strong>Format:</strong> ${modelCard.packaging.format}</p>
    <p><strong>Device Profiles:</strong> ${modelCard.packaging.device_profiles.join(', ')}</p>
    <p><strong>Example Notebooks:</strong></p>
    <ul>
      ${modelCard.packaging.example_notebooks.map(notebook => `<li><a href="${notebook}" class="evidence-link">${notebook}</a></li>`).join('')}
    </ul>
  </div>
`
    }

    html += `
  <div class="section">
    <h2>Evidence</h2>
`

    if (isDataset) {
      const datasetCard = card as DatasetCard
      html += `
    <p><strong>Metrics:</strong></p>
    <ul>
      ${datasetCard.evidence.metrics.map(file => `<li><a href="${file}" class="evidence-link">${file}</a></li>`).join('')}
    </ul>
    <p><strong>Plots:</strong></p>
    <ul>
      ${datasetCard.evidence.plots.map(file => `<li><a href="${file}" class="evidence-link">${file}</a></li>`).join('')}
    </ul>
    <p><strong>Manifest:</strong> <a href="${datasetCard.evidence.manifest}" class="evidence-link">${datasetCard.evidence.manifest}</a></p>
`
    } else {
      const modelCard = card as ModelCard
      html += `
    <p><strong>Signed Bundle:</strong> <a href="${modelCard.evidence.signed_bundle_manifest}" class="evidence-link">${modelCard.evidence.signed_bundle_manifest}</a></p>
    <p><strong>SBOM:</strong> <a href="${modelCard.evidence.sbom}" class="evidence-link">${modelCard.evidence.sbom}</a></p>
    <p><strong>Lineage:</strong> <a href="${modelCard.evidence.lineage}" class="evidence-link">${modelCard.evidence.lineage}</a></p>
`
    }

    if (exportOptions.include_lineage) {
      const assetId = `${this.config?.catalog_name}.${this.config?.schema_name}.${card.name.toLowerCase().replace(/\s+/g, '_')}`
      const lineageInfo = this.lineage.get(assetId)
      if (lineageInfo) {
        html += `
  </div>

  <div class="section">
    <h2>Lineage</h2>
    <p><strong>Upstream Assets:</strong> ${lineageInfo.upstream_assets.join(', ')}</p>
    <p><strong>Downstream Assets:</strong> ${lineageInfo.downstream_assets.join(', ')}</p>
    <p><strong>Transformation Type:</strong> ${lineageInfo.transformation_type}</p>
  </div>
`
      }
    }

    if (exportOptions.include_grants) {
      const assetId = `${this.config?.catalog_name}.${this.config?.schema_name}.${card.name.toLowerCase().replace(/\s+/g, '_')}`
      const relevantGrants = Array.from(this.grants.values()).filter(grant => 
        grant.catalog === this.config?.catalog_name && 
        grant.schema === this.config?.schema_name &&
        (grant.table === card.name.toLowerCase().replace(/\s+/g, '_') || grant.model === card.name.toLowerCase().replace(/\s+/g, '_'))
      )
      
      if (relevantGrants.length > 0) {
        html += `
  </div>

  <div class="section">
    <h2>Grants</h2>
    <ul>
      ${relevantGrants.map(grant => `<li><strong>${grant.principal}:</strong> ${grant.privileges.join(', ')}</li>`).join('')}
    </ul>
  </div>
`
      }
    }

    html += `
</body>
</html>
`

    return html
  }

  async getAsset(assetId: string): Promise<UnityCatalogAsset | null> {
    return this.assets.get(assetId) || null
  }

  async getAllAssets(): Promise<UnityCatalogAsset[]> {
    return Array.from(this.assets.values())
  }

  async updateAsset(assetId: string, updates: Partial<UnityCatalogAsset>): Promise<UnityCatalogAsset | null> {
    const asset = this.assets.get(assetId)
    if (!asset) return null

    const updatedAsset = { ...asset, ...updates, updated_at: new Date().toISOString() }
    this.assets.set(assetId, updatedAsset)
    return updatedAsset
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    return this.assets.delete(assetId)
  }

  async getGrants(assetId?: string): Promise<UnityCatalogGrant[]> {
    if (assetId) {
      return Array.from(this.grants.values()).filter(grant => {
        const grantAssetId = `${grant.catalog || '*'}.${grant.schema || '*'}.${grant.table || grant.model || '*'}`
        return grantAssetId.includes(assetId)
      })
    }
    return Array.from(this.grants.values())
  }

  async getLineage(assetId: string): Promise<UnityCatalogLineage | null> {
    return this.lineage.get(assetId) || null
  }
}

export const unityCatalogService = new UnityCatalogService()
