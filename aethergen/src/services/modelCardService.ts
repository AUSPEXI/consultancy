import JSZip from 'jszip'
import { generateAirGappedBundle, AirGappedOptions } from './edgePackagingService'

export interface OperatingPoint {
  name: string
  threshold: number
  metrics: {
    tp: number
    fp: number
    tn: number
    fn: number
    precision: number
    recall: number
    f1: number
    auc: number
  }
  confidence_intervals: {
    precision: [number, number]
    recall: [number, number]
    f1: [number, number]
  }
  business_impact: {
    alerts_per_day: number
    cost_savings: number
    analyst_capacity: number
  }
}

export interface StabilityMetrics {
  region_delta: number
  specialty_delta: number
  time_delta: number
  segment_stability: Record<string, number>
  drift_sensitivity: {
    feature_importance: Record<string, number>
    drift_threshold: number
    rollback_trigger: string
  }
}

export interface CalibrationConfig {
  method: 'threshold_sweep' | 'isotonic' | 'platt' | 'temperature_scaling'
  target: 'analyst_capacity' | 'cost_optimization' | 'precision_focus'
  thresholds: Record<string, number>
  trade_offs: {
    precision_vs_recall: number
    cost_vs_accuracy: number
    speed_vs_quality: number
  }
}

export interface RobustnessTest {
  corruption_type: 'noise' | 'missing_values' | 'outliers' | 'adversarial'
  performance_delta: number
  failure_analysis: {
    vulnerable_features: string[]
    mitigation_strategies: string[]
    fallback_mechanism: string
  }
}

export interface ModelCard {
  name: string
  version: string
  intended_use: string
  problem_scope: string
  training_data: {
    sources: string[]
    synthetic_notes?: string
    constraints: string[]
    dataset_card_reference: string
  }
  evaluation: {
    operating_points: OperatingPoint[]
    stability: StabilityMetrics
    drift_sensitivity: number
  }
  calibration: CalibrationConfig
  robustness: RobustnessTest[]
  limits: {
    out_of_scope_inputs: string[]
    known_weaknesses: string[]
    failure_modes: string[]
  }
  packaging: {
    format: 'mlflow' | 'onnx' | 'gguf' | 'pytorch' | 'tensorflow'
    device_profiles: string[]
    example_notebooks: string[]
    unity_catalog_path?: string
  }
  evidence: {
    signed_bundle_manifest: string
    sbom: string
    lineage: string
    checksums: Record<string, string>
  }
  governance: {
    change_control: string[]
    rollback_triggers: string[]
    audit_hooks: string[]
    version_policy: string
  }
  created_at: string
  updated_at: string
}

export interface ModelCardOptions {
  name: string
  version: string
  intended_use: string
  problem_scope: string
  training_data: {
    sources: string[]
    synthetic_notes?: string
    constraints: string[]
    dataset_card_reference: string
  }
  evaluation_metrics: {
    operating_points: OperatingPoint[]
    stability: StabilityMetrics
    drift_sensitivity: number
  }
  calibration_config: CalibrationConfig
  robustness_tests: RobustnessTest[]
  limits: {
    out_of_scope_inputs: string[]
    known_weaknesses: string[]
    failure_modes: string[]
  }
  packaging_config: {
    format: 'mlflow' | 'onnx' | 'gguf' | 'pytorch' | 'tensorflow'
    device_profiles: string[]
    example_notebooks: string[]
    unity_catalog_path?: string
  }
  evidence_artifacts: {
    signed_bundle_manifest: string
    sbom: string
    lineage: string
  }
  governance_config: {
    change_control: string[]
    rollback_triggers: string[]
    audit_hooks: string[]
    version_policy: string
  }
}

class ModelCardService {
  private cards: Map<string, ModelCard> = new Map()

  async generateModelCard(options: ModelCardOptions): Promise<ModelCard> {
    const card: ModelCard = {
      name: options.name,
      version: options.version,
      intended_use: options.intended_use,
      problem_scope: options.problem_scope,
      training_data: options.training_data,
      evaluation: options.evaluation_metrics,
      calibration: options.calibration_config,
      robustness: options.robustness_tests,
      limits: options.limits,
      packaging: options.packaging_config,
      evidence: {
        signed_bundle_manifest: options.evidence_artifacts.signed_bundle_manifest,
        sbom: options.evidence_artifacts.sbom,
        lineage: options.evidence_artifacts.lineage,
        checksums: await this.generateChecksums(options.evidence_artifacts)
      },
      governance: options.governance_config,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const cardId = `${options.name}-${options.version}`
    this.cards.set(cardId, card)
    return card
  }

  async generateModelCardTemplate(domain: string, task: string): Promise<ModelCardOptions> {
    const templates = {
      healthcare: {
        fraud_detection: {
          intended_use: 'Claims fraud triage and analyst prioritization',
          problem_scope: 'Healthcare insurance claims fraud detection',
          operating_points: [
            {
              name: 'op_1%fpr',
              threshold: 0.01,
              metrics: {
                tp: 850, fp: 100, tn: 9900, fn: 150,
                precision: 0.895, recall: 0.850, f1: 0.872, auc: 0.92
              },
              confidence_intervals: {
                precision: [0.875, 0.915],
                recall: [0.830, 0.870],
                f1: [0.852, 0.892]
              },
              business_impact: {
                alerts_per_day: 100,
                cost_savings: 50000,
                analyst_capacity: 0.8
              }
            }
          ]
        },
        clinical_prediction: {
          intended_use: 'Clinical outcome prediction and risk assessment',
          problem_scope: 'Patient outcome prediction from clinical data',
          operating_points: [
            {
              name: 'op_high_precision',
              threshold: 0.8,
              metrics: {
                tp: 720, fp: 80, tn: 920, fn: 280,
                precision: 0.900, recall: 0.720, f1: 0.800, auc: 0.88
              },
              confidence_intervals: {
                precision: [0.880, 0.920],
                recall: [0.700, 0.740],
                f1: [0.780, 0.820]
              },
              business_impact: {
                alerts_per_day: 80,
                cost_savings: 75000,
                analyst_capacity: 0.9
              }
            }
          ]
        }
      },
      financial: {
        fraud_detection: {
          intended_use: 'Transaction fraud detection and alerting',
          problem_scope: 'Financial transaction fraud detection',
          operating_points: [
            {
              name: 'op_0.5%fpr',
              threshold: 0.005,
              metrics: {
                tp: 950, fp: 50, tn: 9950, fn: 50,
                precision: 0.950, recall: 0.950, f1: 0.950, auc: 0.95
              },
              confidence_intervals: {
                precision: [0.930, 0.970],
                recall: [0.930, 0.970],
                f1: [0.930, 0.970]
              },
              business_impact: {
                alerts_per_day: 50,
                cost_savings: 100000,
                analyst_capacity: 0.95
              }
            }
          ]
        }
      },
      automotive: {
        defect_detection: {
          intended_use: 'Manufacturing defect detection and quality control',
          problem_scope: 'Automotive part defect detection',
          operating_points: [
            {
              name: 'op_2%fpr',
              threshold: 0.02,
              metrics: {
                tp: 880, fp: 120, tn: 9880, fn: 120,
                precision: 0.880, recall: 0.880, f1: 0.880, auc: 0.90
              },
              confidence_intervals: {
                precision: [0.860, 0.900],
                recall: [0.860, 0.900],
                f1: [0.860, 0.900]
              },
              business_impact: {
                alerts_per_day: 120,
                cost_savings: 25000,
                analyst_capacity: 0.85
              }
            }
          ]
        }
      }
    }

    const template = templates[domain as keyof typeof templates]?.[task as keyof any] || templates.healthcare.fraud_detection

    return {
      name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${task.charAt(0).toUpperCase() + task.slice(1)} Model`,
      version: '2025.01',
      intended_use: template.intended_use,
      problem_scope: template.problem_scope,
      training_data: {
        sources: [`${domain}_synthetic_corpus`],
        synthetic_notes: 'Generated using AethergenPlatform with differential privacy',
        constraints: ['no PHI/PII', 'synthetic data only'],
        dataset_card_reference: `${domain}_dataset_card_2025.01`
      },
      evaluation_metrics: {
        operating_points: template.operating_points,
        stability: {
          region_delta: 0.03,
          specialty_delta: 0.05,
          time_delta: 0.02,
          segment_stability: { 'region': 0.74, 'product': 0.77 },
          drift_sensitivity: {
            feature_importance: { 'amount': 0.4, 'frequency': 0.3, 'patterns': 0.3 },
            drift_threshold: 0.1,
            rollback_trigger: 'drift > 0.1 for 3 consecutive days'
          }
        },
        drift_sensitivity: 0.05
      },
      calibration_config: {
        method: 'threshold_sweep',
        target: 'analyst_capacity',
        thresholds: { 'high_precision': 0.8, 'balanced': 0.5, 'high_recall': 0.2 },
        trade_offs: {
          precision_vs_recall: 0.15,
          cost_vs_accuracy: 0.25,
          speed_vs_quality: 0.1
        }
      },
      robustness_tests: [
        {
          corruption_type: 'noise',
          performance_delta: 0.05,
          failure_analysis: {
            vulnerable_features: ['amount', 'frequency'],
            mitigation_strategies: ['robust scaling', 'outlier detection'],
            fallback_mechanism: 'rule-based baseline'
          }
        }
      ],
      limits: {
        out_of_scope_inputs: ['clinical outcomes', 'extreme rare codes', 'adversarial examples'],
        known_weaknesses: ['rare patterns', 'edge cases', 'data drift'],
        failure_modes: ['model drift', 'data corruption', 'adversarial attacks']
      },
      packaging_config: {
        format: 'mlflow',
        device_profiles: ['cpu', 'gpu', 'edge'],
        example_notebooks: ['notebooks/infer.ipynb', 'notebooks/calibrate.ipynb'],
        unity_catalog_path: `catalog.${domain}.model`
      },
      evidence_artifacts: {
        signed_bundle_manifest: 'evidence-2025.01/manifest.json',
        sbom: 'evidence-2025.01/sbom.json',
        lineage: 'evidence-2025.01/lineage.json'
      },
      governance_config: {
        change_control: ['ticket_refs', 'approval_workflow'],
        rollback_triggers: ['performance_drop > 5%', 'drift > 0.1'],
        audit_hooks: ['model_registry', 'performance_monitoring'],
        version_policy: 'semantic_versioning'
      }
    }
  }

  async exportModelCardAsHTML(card: ModelCard): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Model Card: ${card.name}</title>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #2d3748; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2 { color: #2b6cb0; }
    .section { margin-bottom: 2rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
    .metric { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .evidence-link { color: #2b6cb0; text-decoration: none; }
    .evidence-link:hover { text-decoration: underline; }
    .operating-point { background: #f7fafc; padding: 1rem; margin: 1rem 0; border-radius: 0.5rem; }
  </style>
</head>
<body>
  <h1>Model Card: ${card.name}</h1>
  <p><strong>Version:</strong> ${card.version}</p>
  <p><strong>Intended Use:</strong> ${card.intended_use}</p>
  <p><strong>Problem Scope:</strong> ${card.problem_scope}</p>
  
  <div class="section">
    <h2>Training Data</h2>
    <p><strong>Sources:</strong> ${card.training_data.sources.join(', ')}</p>
    <p><strong>Constraints:</strong> ${card.training_data.constraints.join(', ')}</p>
    <p><strong>Dataset Card:</strong> <a href="${card.training_data.dataset_card_reference}" class="evidence-link">${card.training_data.dataset_card_reference}</a></p>
  </div>

  <div class="section">
    <h2>Evaluation</h2>
    <h3>Operating Points</h3>
    ${card.evaluation.operating_points.map(op => `
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
    <p><strong>Region Delta:</strong> ${card.evaluation.stability.region_delta}</p>
    <p><strong>Specialty Delta:</strong> ${card.evaluation.stability.specialty_delta}</p>
    <p><strong>Drift Sensitivity:</strong> ${card.evaluation.drift_sensitivity}</p>
  </div>

  <div class="section">
    <h2>Calibration</h2>
    <p><strong>Method:</strong> ${card.calibration.method}</p>
    <p><strong>Target:</strong> ${card.calibration.target}</p>
    <p><strong>Trade-offs:</strong></p>
    <ul>
      <li>Precision vs Recall: ${card.calibration.trade_offs.precision_vs_recall}</li>
      <li>Cost vs Accuracy: ${card.calibration.trade_offs.cost_vs_accuracy}</li>
      <li>Speed vs Quality: ${card.calibration.trade_offs.speed_vs_quality}</li>
    </ul>
  </div>

  <div class="section">
    <h2>Robustness</h2>
    ${card.robustness.map(test => `
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
    <p><strong>Out of Scope:</strong> ${card.limits.out_of_scope_inputs.join(', ')}</p>
    <p><strong>Known Weaknesses:</strong> ${card.limits.known_weaknesses.join(', ')}</p>
    <p><strong>Failure Modes:</strong> ${card.limits.failure_modes.join(', ')}</p>
  </div>

  <div class="section">
    <h2>Packaging</h2>
    <p><strong>Format:</strong> ${card.packaging.format}</p>
    <p><strong>Device Profiles:</strong> ${card.packaging.device_profiles.join(', ')}</p>
    <p><strong>Example Notebooks:</strong></p>
    <ul>
      ${card.packaging.example_notebooks.map(notebook => `<li><a href="${notebook}" class="evidence-link">${notebook}</a></li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Evidence</h2>
    <p><strong>Signed Bundle:</strong> <a href="${card.evidence.signed_bundle_manifest}" class="evidence-link">${card.evidence.signed_bundle_manifest}</a></p>
    <p><strong>SBOM:</strong> <a href="${card.evidence.sbom}" class="evidence-link">${card.evidence.sbom}</a></p>
    <p><strong>Lineage:</strong> <a href="${card.evidence.lineage}" class="evidence-link">${card.evidence.lineage}</a></p>
  </div>

  <div class="section">
    <h2>Governance</h2>
    <p><strong>Change Control:</strong> ${card.governance.change_control.join(', ')}</p>
    <p><strong>Rollback Triggers:</strong> ${card.governance.rollback_triggers.join(', ')}</p>
    <p><strong>Version Policy:</strong> ${card.governance.version_policy}</p>
  </div>
</body>
</html>
    `
  }

  async exportModelCardAsJSON(card: ModelCard): Promise<string> {
    return JSON.stringify(card, null, 2)
  }

  async generateChecksums(artifacts: { signed_bundle_manifest: string; sbom: string; lineage: string }): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {}
    
    // Simulate checksum generation
    Object.entries(artifacts).forEach(([key, file]) => {
      checksums[file] = `sha256:${Math.random().toString(36).substring(2, 15)}`
    })
    
    return checksums
  }

  async getModelCard(cardId: string): Promise<ModelCard | null> {
    return this.cards.get(cardId) || null
  }

  async getAllModelCards(): Promise<ModelCard[]> {
    return Array.from(this.cards.values())
  }

  async updateModelCard(cardId: string, updates: Partial<ModelCard>): Promise<ModelCard | null> {
    const card = this.cards.get(cardId)
    if (!card) return null

    const updatedCard = { ...card, ...updates, updated_at: new Date().toISOString() }
    this.cards.set(cardId, updatedCard)
    return updatedCard
  }

  async deleteModelCard(cardId: string): Promise<boolean> {
    return this.cards.delete(cardId)
  }
}

export const modelCardService = new ModelCardService()
