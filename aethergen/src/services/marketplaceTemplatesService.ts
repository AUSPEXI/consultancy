import { MarketplaceAsset, Listing, ListingContent } from './marketplaceAssetService'

export interface MarketplaceTemplate {
  id: string
  name: string
  type: 'dataset' | 'model' | 'evidence_bundle'
  platform: 'databricks' | 'azure' | 'internal' | 'universal'
  template: TemplateContent
  metadata: TemplateMetadata
}

export interface TemplateContent {
  readme: string
  pricing: string
  trial: string
  evidence: string
  documentation: string
  samples: string
  notebooks: string
}

export interface TemplateMetadata {
  version: string
  author: string
  created: Date
  updated: Date
  tags: string[]
  description: string
}

export interface TemplateVariable {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  defaultValue?: any
}

export interface TemplateConfig {
  variables: TemplateVariable[]
  sections: string[]
  platforms: string[]
}

class MarketplaceTemplatesService {
  private templates: Map<string, MarketplaceTemplate> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
  }

  private initializeDefaultTemplates() {
    // Dataset Template
    const datasetTemplate: MarketplaceTemplate = {
      id: 'dataset_template',
      name: 'Dataset Listing Template',
      type: 'dataset',
      platform: 'universal',
      template: {
        readme: this.generateDatasetReadme(),
        pricing: this.generatePricingTemplate(),
        trial: this.generateTrialTemplate(),
        evidence: this.generateEvidenceTemplate(),
        documentation: this.generateDocumentationTemplate(),
        samples: this.generateSamplesTemplate(),
        notebooks: this.generateNotebooksTemplate()
      },
      metadata: {
        version: '1.0.0',
        author: 'Aethergen',
        created: new Date(),
        updated: new Date(),
        tags: ['dataset', 'template', 'universal'],
        description: 'Standard template for dataset marketplace listings'
      }
    }

    // Model Template
    const modelTemplate: MarketplaceTemplate = {
      id: 'model_template',
      name: 'Model Listing Template',
      type: 'model',
      platform: 'universal',
      template: {
        readme: this.generateModelReadme(),
        pricing: this.generatePricingTemplate(),
        trial: this.generateTrialTemplate(),
        evidence: this.generateEvidenceTemplate(),
        documentation: this.generateDocumentationTemplate(),
        samples: this.generateSamplesTemplate(),
        notebooks: this.generateNotebooksTemplate()
      },
      metadata: {
        version: '1.0.0',
        author: 'Aethergen',
        created: new Date(),
        updated: new Date(),
        tags: ['model', 'template', 'universal'],
        description: 'Standard template for model marketplace listings'
      }
    }

    this.templates.set(datasetTemplate.id, datasetTemplate)
    this.templates.set(modelTemplate.id, modelTemplate)
  }

  async generateListingFromTemplate(
    templateId: string,
    asset: MarketplaceAsset,
    variables: Record<string, any>
  ): Promise<Listing> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const content = await this.populateTemplate(template.template, asset, variables)
    
    const listing: Listing = {
      id: `listing_${Date.now()}`,
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
      content: {
        readme: content.readme,
        samples: this.parseSamples(content.samples),
        notebooks: this.parseNotebooks(content.notebooks),
        documentation: this.parseDocumentation(content.documentation)
      }
    }

    return listing
  }

  async generatePlatformSpecificTemplate(
    baseTemplateId: string,
    platform: 'databricks' | 'azure' | 'internal',
    asset: MarketplaceAsset
  ): Promise<MarketplaceTemplate> {
    const baseTemplate = this.templates.get(baseTemplateId)
    if (!baseTemplate) {
      throw new Error(`Base template ${baseTemplateId} not found`)
    }

    const platformSpecificTemplate: MarketplaceTemplate = {
      id: `${baseTemplateId}_${platform}`,
      name: `${baseTemplate.name} (${platform})`,
      type: baseTemplate.type,
      platform,
      template: await this.adaptTemplateForPlatform(baseTemplate.template, platform, asset),
      metadata: {
        ...baseTemplate.metadata,
        version: `${baseTemplate.metadata.version}-${platform}`,
        updated: new Date(),
        tags: [...baseTemplate.metadata.tags, platform]
      }
    }

    return platformSpecificTemplate
  }

  async getTemplate(templateId: string): Promise<MarketplaceTemplate | null> {
    return this.templates.get(templateId) || null
  }

  async getAllTemplates(): Promise<MarketplaceTemplate[]> {
    return Array.from(this.templates.values())
  }

  async createCustomTemplate(template: Omit<MarketplaceTemplate, 'id' | 'metadata'>): Promise<MarketplaceTemplate> {
    const customTemplate: MarketplaceTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      metadata: {
        version: '1.0.0',
        author: 'Custom',
        created: new Date(),
        updated: new Date(),
        tags: ['custom'],
        description: 'Custom marketplace template'
      }
    }

    this.templates.set(customTemplate.id, customTemplate)
    return customTemplate
  }

  private generateDatasetReadme(): string {
    return `# {{ASSET_NAME}}

{{ASSET_DESCRIPTION}}

## Overview

This dataset provides {{DATASET_PURPOSE}} with {{ROW_COUNT}} records and {{COLUMN_COUNT}} features.

## Features

- **Data Quality**: {{DATA_QUALITY_SCORE}}% quality score
- **Format**: {{DATA_FORMAT}} format
- **Size**: {{DATA_SIZE}} MB
- **License**: {{LICENSE_TYPE}}

## Evidence

- **Accuracy**: {{ACCURACY}}% ({{ACCURACY_CI}})
- **Privacy**: {{PRIVACY_SCORE}}% privacy score
- **Stability**: {{STABILITY_SCORE}}% cross-validation stability

## Quick Start

\`\`\`python
import pandas as pd

# Load the dataset
df = pd.read_parquet('{{ASSET_NAME}}.parquet')

# Basic exploration
print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(df.head())
\`\`\`

## Pricing

{{PRICING_TABLE}}

## Trial

{{TRIAL_INFO}}

## Support

{{SUPPORT_INFO}}
`
  }

  private generateModelReadme(): string {
    return `# {{ASSET_NAME}}

{{ASSET_DESCRIPTION}}

## Overview

This model provides {{MODEL_PURPOSE}} with {{PARAMETER_COUNT}} parameters.

## Features

- **Framework**: {{FRAMEWORK}}
- **Format**: {{MODEL_FORMAT}}
- **Architecture**: {{ARCHITECTURE}}
- **License**: {{LICENSE_TYPE}}

## Evidence

- **Accuracy**: {{ACCURACY}}% ({{ACCURACY_CI}})
- **Latency**: {{LATENCY}}ms inference time
- **Stability**: {{STABILITY_SCORE}}% cross-validation stability

## Quick Start

\`\`\`python
import {{FRAMEWORK_LIBRARY}}

# Load the model
model = {{MODEL_LOAD_CODE}}

# Run inference
predictions = model.predict({{SAMPLE_INPUT}})
print(f"Predictions: {predictions}")
\`\`\`

## Pricing

{{PRICING_TABLE}}

## Trial

{{TRIAL_INFO}}

## Support

{{SUPPORT_INFO}}
`
  }

  private generatePricingTemplate(): string {
    return `## Pricing Tiers

### Self-Service
- **Price**: ${{SELF_SERVICE_PRICE}}/month
- **Features**: {{SELF_SERVICE_FEATURES}}
- **Limits**: {{SELF_SERVICE_LIMITS}}

### Assisted
- **Price**: ${{ASSISTED_PRICE}}/month
- **Features**: {{ASSISTED_FEATURES}}
- **Limits**: {{ASSISTED_LIMITS}}

### Full-Service
- **Price**: ${{FULL_SERVICE_PRICE}}/month
- **Features**: {{FULL_SERVICE_FEATURES}}
- **Limits**: {{FULL_SERVICE_LIMITS}}

## Compute Ownership

{{COMPUTE_OWNERSHIP_INFO}}
`
  }

  private generateTrialTemplate(): string {
    return `## Trial Information

### Trial Duration
{{TRIAL_DURATION}} days

### Trial Features
{{TRIAL_FEATURES}}

### Trial Limits
{{TRIAL_LIMITS}}

### Conversion Triggers
{{CONVERSION_TRIGGERS}}

### How to Start
{{TRIAL_START_INSTRUCTIONS}}
`
  }

  private generateEvidenceTemplate(): string {
    return `## Evidence Bundle

### Metrics Summary
{{METRICS_SUMMARY}}

### Ablation Studies
{{ABLATION_STUDIES}}

### Privacy Analysis
{{PRIVACY_ANALYSIS}}

### Reproducibility
{{REPRODUCIBILITY_INFO}}

### Stability Analysis
{{STABILITY_ANALYSIS}}
`
  }

  private generateDocumentationTemplate(): string {
    return `## Documentation

### Getting Started
{{GETTING_STARTED_GUIDE}}

### API Reference
{{API_REFERENCE}}

### Examples
{{EXAMPLES}}

### Troubleshooting
{{TROUBLESHOOTING}}

### FAQ
{{FAQ}}
`
  }

  private generateSamplesTemplate(): string {
    return `## Sample Data

### Sample Records
{{SAMPLE_RECORDS}}

### Sample Queries
{{SAMPLE_QUERIES}}

### Sample Analysis
{{SAMPLE_ANALYSIS}}
`
  }

  private generateNotebooksTemplate(): string {
    return `## Notebooks

### Getting Started Notebook
{{GETTING_STARTED_NOTEBOOK}}

### Advanced Usage Notebook
{{ADVANCED_USAGE_NOTEBOOK}}

### Evaluation Notebook
{{EVALUATION_NOTEBOOK}}
`
  }

  private async populateTemplate(
    template: TemplateContent,
    asset: MarketplaceAsset,
    variables: Record<string, any>
  ): Promise<TemplateContent> {
    const populated: TemplateContent = {
      readme: this.replaceVariables(template.readme, { ...this.getAssetVariables(asset), ...variables }),
      pricing: this.replaceVariables(template.pricing, { ...this.getPricingVariables(asset), ...variables }),
      trial: this.replaceVariables(template.trial, { ...this.getTrialVariables(asset), ...variables }),
      evidence: this.replaceVariables(template.evidence, { ...this.getEvidenceVariables(asset), ...variables }),
      documentation: this.replaceVariables(template.documentation, { ...this.getDocumentationVariables(asset), ...variables }),
      samples: this.replaceVariables(template.samples, { ...this.getSampleVariables(asset), ...variables }),
      notebooks: this.replaceVariables(template.notebooks, { ...this.getNotebookVariables(asset), ...variables })
    }

    return populated
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key.toUpperCase()}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    }
    return result
  }

  private getAssetVariables(asset: MarketplaceAsset): Record<string, any> {
    return {
      ASSET_NAME: asset.name,
      ASSET_DESCRIPTION: asset.description,
      ASSET_TYPE: asset.type,
      ASSET_VERSION: asset.version,
      ASSET_AUTHOR: asset.author,
      LICENSE_TYPE: asset.metadata.license.type
    }
  }

  private getPricingVariables(asset: MarketplaceAsset): Record<string, any> {
    const selfService = asset.pricing.find(p => p.name === 'self-service')
    const assisted = asset.pricing.find(p => p.name === 'assisted')
    const fullService = asset.pricing.find(p => p.name === 'full-service')

    return {
      SELF_SERVICE_PRICE: selfService?.price || 99,
      SELF_SERVICE_FEATURES: selfService?.features.join(', ') || 'basic access',
      SELF_SERVICE_LIMITS: `${selfService?.limits.users || 5} users, ${selfService?.limits.requests || 1000} requests`,
      ASSISTED_PRICE: assisted?.price || 299,
      ASSISTED_FEATURES: assisted?.features.join(', ') || 'priority support',
      ASSISTED_LIMITS: `${assisted?.limits.users || 20} users, ${assisted?.limits.requests || 5000} requests`,
      FULL_SERVICE_PRICE: fullService?.price || 999,
      FULL_SERVICE_FEATURES: fullService?.features.join(', ') || 'custom features',
      FULL_SERVICE_LIMITS: `${fullService?.limits.users || 100} users, ${fullService?.limits.requests || 10000} requests`,
      COMPUTE_OWNERSHIP_INFO: 'Buyer pays for inference/ETL; we price by rights and refresh'
    }
  }

  private getTrialVariables(asset: MarketplaceAsset): Record<string, any> {
    return {
      TRIAL_DURATION: asset.trials.duration,
      TRIAL_FEATURES: asset.trials.features.join(', '),
      TRIAL_LIMITS: `${asset.trials.limits.users} users, ${asset.trials.limits.requests} requests`,
      CONVERSION_TRIGGERS: asset.trials.conversionTriggers.join(', '),
      TRIAL_START_INSTRUCTIONS: 'Click "Start Trial" button to begin your evaluation'
    }
  }

  private getEvidenceVariables(asset: MarketplaceAsset): Record<string, any> {
    const accuracy = asset.evidence.metrics.find(m => m.name === 'accuracy')
    const privacy = asset.evidence.privacy.privacyMetrics[0]

    return {
      METRICS_SUMMARY: asset.evidence.metrics.map(m => `${m.name}: ${m.value}${m.unit}`).join(', '),
      ABLATION_STUDIES: asset.evidence.ablation.map(a => `${a.component}: ${a.impact} impact`).join(', '),
      PRIVACY_ANALYSIS: `Privacy score: ${privacy?.value || 0}%`,
      REPRODUCIBILITY_INFO: `Hash: ${asset.evidence.reproducibility.hash}`,
      STABILITY_ANALYSIS: `Cross-validation: ${asset.evidence.stability.crossValidation}%`
    }
  }

  private getDocumentationVariables(asset: MarketplaceAsset): Record<string, any> {
    return {
      GETTING_STARTED_GUIDE: 'Follow the quick start guide above',
      API_REFERENCE: 'See the API documentation for detailed usage',
      EXAMPLES: 'Check the sample notebooks for examples',
      TROUBLESHOOTING: 'Common issues and solutions',
      FAQ: 'Frequently asked questions'
    }
  }

  private getSampleVariables(asset: MarketplaceAsset): Record<string, any> {
    if (asset.type === 'dataset' && asset.metadata.schema) {
      return {
        SAMPLE_RECORDS: JSON.stringify(asset.metadata.schema.sampleData, null, 2),
        SAMPLE_QUERIES: 'SELECT * FROM dataset LIMIT 10',
        SAMPLE_ANALYSIS: 'Basic statistical analysis of the dataset'
      }
    }
    return {
      SAMPLE_RECORDS: 'Sample model outputs',
      SAMPLE_QUERIES: 'Sample inference calls',
      SAMPLE_ANALYSIS: 'Model performance analysis'
    }
  }

  private getNotebookVariables(asset: MarketplaceAsset): Record<string, any> {
    if (asset.type === 'dataset') {
      return {
        GETTING_STARTED_NOTEBOOK: 'explore_dataset.ipynb',
        ADVANCED_USAGE_NOTEBOOK: 'advanced_analysis.ipynb',
        EVALUATION_NOTEBOOK: 'evaluate_dataset.ipynb'
      }
    } else {
      return {
        GETTING_STARTED_NOTEBOOK: 'model_inference.ipynb',
        ADVANCED_USAGE_NOTEBOOK: 'fine_tuning.ipynb',
        EVALUATION_NOTEBOOK: 'model_evaluation.ipynb'
      }
    }
  }

  private async adaptTemplateForPlatform(
    template: TemplateContent,
    platform: 'databricks' | 'azure' | 'internal',
    asset: MarketplaceAsset
  ): Promise<TemplateContent> {
    const platformSpecific = { ...template }

    switch (platform) {
      case 'databricks':
        platformSpecific.readme = this.addDatabricksSpecificContent(template.readme, asset)
        platformSpecific.notebooks = this.addDatabricksNotebooks(template.notebooks, asset)
        break
      case 'azure':
        platformSpecific.readme = this.addAzureSpecificContent(template.readme, asset)
        platformSpecific.notebooks = this.addAzureNotebooks(template.notebooks, asset)
        break
      case 'internal':
        platformSpecific.readme = this.addInternalSpecificContent(template.readme, asset)
        platformSpecific.notebooks = this.addInternalNotebooks(template.notebooks, asset)
        break
    }

    return platformSpecific
  }

  private addDatabricksSpecificContent(readme: string, asset: MarketplaceAsset): string {
    const databricksSection = `

## Databricks Integration

### Unity Catalog Setup
\`\`\`sql
CREATE CATALOG IF NOT EXISTS {{CATALOG_NAME}};
CREATE SCHEMA IF NOT EXISTS {{CATALOG_NAME}}.{{SCHEMA_NAME}};
CREATE TABLE {{CATALOG_NAME}}.{{SCHEMA_NAME}}.{{TABLE_NAME}} USING DELTA AS SELECT * FROM {{TEMP_TABLE}};
\`\`\`

### Workspace Access
- **Workspace URL**: {{WORKSPACE_URL}}
- **Cluster Requirements**: {{CLUSTER_REQUIREMENTS}}
- **Permissions**: {{PERMISSIONS}}

### Marketplace Listing
- **Listing ID**: {{LISTING_ID}}
- **Publisher**: {{PUBLISHER_NAME}}
- **Category**: {{CATEGORY}}
`

    return readme + databricksSection
  }

  private addAzureSpecificContent(readme: string, asset: MarketplaceAsset): string {
    const azureSection = `

## Azure Integration

### Azure ML Workspace Setup
\`\`\`python
from azureml.core import Workspace, Dataset

ws = Workspace.from_config()
dataset = Dataset.get_by_name(ws, name='{{DATASET_NAME}}')
\`\`\`

### Azure Marketplace
- **Offer ID**: {{OFFER_ID}}
- **Plan ID**: {{PLAN_ID}}
- **Publisher**: {{PUBLISHER_NAME}}

### Resource Requirements
- **Compute**: {{COMPUTE_REQUIREMENTS}}
- **Storage**: {{STORAGE_REQUIREMENTS}}
- **Network**: {{NETWORK_REQUIREMENTS}}
`

    return readme + azureSection
  }

  private addInternalSpecificContent(readme: string, asset: MarketplaceAsset): string {
    const internalSection = `

## Internal Platform Integration

### API Access
\`\`\`python
import aethergen

client = aethergen.Client(api_key='{{API_KEY}}')
asset = client.get_asset('{{ASSET_ID}}')
\`\`\`

### Platform Features
- **Evidence Tracking**: {{EVIDENCE_TRACKING}}
- **Trial Management**: {{TRIAL_MANAGEMENT}}
- **Usage Analytics**: {{USAGE_ANALYTICS}}

### Support
- **Documentation**: {{DOCUMENTATION_URL}}
- **Support Portal**: {{SUPPORT_PORTAL}}
- **Community**: {{COMMUNITY_URL}}
`

    return readme + internalSection
  }

  private addDatabricksNotebooks(notebooks: string, asset: MarketplaceAsset): string {
    const databricksNotebooks = `

### Databricks Notebooks

#### Unity Catalog Integration
\`\`\`python
# Databricks Unity Catalog Integration
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("{{ASSET_NAME}}").getOrCreate()

# Load from Unity Catalog
df = spark.table("{{CATALOG_NAME}}.{{SCHEMA_NAME}}.{{TABLE_NAME}}")

# Display sample data
display(df.limit(10))
\`\`\`

#### MLflow Integration
\`\`\`python
# MLflow Model Integration
import mlflow

# Load model from MLflow
model = mlflow.pyfunc.load_model("models:/{{MODEL_NAME}}/{{MODEL_VERSION}}")

# Run inference
predictions = model.predict({{SAMPLE_DATA}})
print(predictions)
\`\`\`
`

    return notebooks + databricksNotebooks
  }

  private addAzureNotebooks(notebooks: string, asset: MarketplaceAsset): string {
    const azureNotebooks = `

### Azure ML Notebooks

#### Azure ML Workspace Integration
\`\`\`python
# Azure ML Workspace Integration
from azureml.core import Workspace, Dataset

# Connect to workspace
ws = Workspace.from_config()

# Get dataset
dataset = Dataset.get_by_name(ws, name='{{DATASET_NAME}}')
df = dataset.to_pandas_dataframe()

# Display sample data
print(df.head())
\`\`\`

#### Azure ML Model Integration
\`\`\`python
# Azure ML Model Integration
from azureml.core import Model

# Get model from registry
model = Model(ws, name='{{MODEL_NAME}}', version='{{MODEL_VERSION}}')

# Deploy model
service = model.deploy(ws, '{{SERVICE_NAME}}', inference_config)
\`\`\`
`

    return notebooks + azureNotebooks
  }

  private addInternalNotebooks(notebooks: string, asset: MarketplaceAsset): string {
    const internalNotebooks = `

### Internal Platform Notebooks

#### Aethergen Platform Integration
\`\`\`python
# Aethergen Platform Integration
import aethergen

# Initialize client
client = aethergen.Client(api_key='{{API_KEY}}')

# Get asset
asset = client.get_asset('{{ASSET_ID}}')

# Load data
data = asset.load_data()
print(data.head())
\`\`\`

#### Evidence Tracking
\`\`\`python
# Evidence Tracking
evidence = client.get_evidence('{{ASSET_ID}}')

# View metrics
print(f"Accuracy: {evidence.metrics['accuracy']}")
print(f"Privacy Score: {evidence.privacy['score']}")

# Track usage
client.track_usage('{{ASSET_ID}}', usage_data)
\`\`\`
`

    return notebooks + internalNotebooks
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

  private parseSamples(samplesTemplate: string): any[] {
    // Parse samples from template
    return []
  }

  private parseNotebooks(notebooksTemplate: string): any[] {
    // Parse notebooks from template
    return []
  }

  private parseDocumentation(documentationTemplate: string): any[] {
    // Parse documentation from template
    return []
  }
}

export const marketplaceTemplatesService = new MarketplaceTemplatesService()
