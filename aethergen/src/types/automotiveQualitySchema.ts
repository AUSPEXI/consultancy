// Enhanced Automotive Quality Schema for Advanced Synthetic Data Generation
// This enables domain expertise integration and quality validation

export interface AutomotiveQualityField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  constraints: {
    min?: number;
    max?: number;
    range?: [number, number];
    unique?: boolean;
    categories?: string[];
    rarePattern?: number; // Probability of rare events
    required?: boolean;
  };
  domainExpertise?: {
    description: string;
    businessRule: string;
    qualityImpact: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AutomotiveQualitySchema {
  id: string;
  name: string;
  description: string;
  version: string;
  fields: AutomotiveQualityField[];
  businessRules: BusinessRule[];
  qualityMetrics: QualityMetric[];
  industryStandards: IndustryStandard[];
}

export interface BusinessRule {
  id: string;
  name: string;
  rule: string;
  probability: number; // Probability of rule violation
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  domainExpertise: string;
}

export interface QualityMetric {
  name: string;
  calculation: string;
  target: number;
  threshold: number;
  unit: string;
  description: string;
}

export interface IndustryStandard {
  name: string;
  version: string;
  requirements: string[];
  compliance: boolean;
  description: string;
}

// Enhanced Automotive Quality Schema with Domain Expertise Integration
export const automotiveQualitySchema: AutomotiveQualitySchema = {
  id: 'automotive-quality-v1',
  name: 'Automotive Quality Management Enhanced Schema',
  description: 'Advanced schema for automotive quality management with domain expertise integration',
  version: '1.0.0',
  
  fields: [
    // Core Quality Identifiers
    {
      name: 'part_id',
      type: 'string',
      constraints: { unique: true, required: true },
      domainExpertise: {
        description: 'Unique identifier for each automotive part',
        businessRule: 'Each part must have unique identifier for traceability',
        qualityImpact: 'critical'
      }
    },
    {
      name: 'supplier_id',
      type: 'string',
      constraints: { required: true },
      domainExpertise: {
        description: 'Supplier identification for quality tracking',
        businessRule: 'All parts must be traceable to approved suppliers',
        qualityImpact: 'high'
      }
    },
    {
      name: 'production_line',
      type: 'string',
      constraints: { required: true },
      domainExpertise: {
        description: 'Production line where part was manufactured',
        businessRule: 'Production line must be validated and certified',
        qualityImpact: 'high'
      }
    },
    
    // Quality Metrics
    {
      name: 'quality_score',
      type: 'number',
      constraints: { range: [0, 100], required: true },
      domainExpertise: {
        description: 'Overall quality score based on multiple factors',
        businessRule: 'Quality score must be above 85 for production release',
        qualityImpact: 'critical'
      }
    },
    {
      name: 'defect_rate',
      type: 'number',
      constraints: { range: [0, 0.1], required: true },
      domainExpertise: {
        description: 'Defect rate per thousand parts',
        businessRule: 'Defect rate must be below 0.05 for premium brands',
        qualityImpact: 'critical'
      }
    },
    {
      name: 'tolerance_violation',
      type: 'number',
      constraints: { range: [0, 1], required: true },
      domainExpertise: {
        description: 'Tolerance violation percentage',
        businessRule: 'Tolerance violations must be below 0.02 for safety parts',
        qualityImpact: 'critical'
      }
    },
    
    // Defect Classification
    {
      name: 'defect_type',
      type: 'string',
      constraints: { 
        categories: ['material', 'assembly', 'design', 'cosmetic', 'functional', 'safety'],
        required: true 
      },
      domainExpertise: {
        description: 'Classification of defect type for quality analysis',
        businessRule: 'Safety defects require immediate escalation and recall consideration',
        qualityImpact: 'critical'
      }
    },
    {
      name: 'defect_severity',
      type: 'number',
      constraints: { range: [1, 10], required: true },
      domainExpertise: {
        description: 'Severity rating of defect from 1 (minor) to 10 (critical)',
        businessRule: 'Severity 8+ defects require immediate production halt',
        qualityImpact: 'critical'
      }
    },
    {
      name: 'defect_cost',
      type: 'number',
      constraints: { range: [0, 10000], required: true },
      domainExpertise: {
        description: 'Estimated cost impact of defect',
        businessRule: 'Defects with cost > $5000 require management review',
        qualityImpact: 'high'
      }
    },
    
    // Production Context
    {
      name: 'batch_number',
      type: 'string',
      constraints: { required: true },
      domainExpertise: {
        description: 'Production batch for quality tracking',
        businessRule: 'Batch numbers must be sequential and traceable',
        qualityImpact: 'medium'
      }
    },
    {
      name: 'production_date',
      type: 'date',
      constraints: { required: true },
      domainExpertise: {
        description: 'Date of production for quality analysis',
        businessRule: 'Production dates must be within approved schedule',
        qualityImpact: 'medium'
      }
    },
    {
      name: 'shift_id',
      type: 'string',
      constraints: { required: true },
      domainExpertise: {
        description: 'Production shift for quality correlation',
        businessRule: 'Shift performance must be monitored for quality trends',
        qualityImpact: 'medium'
      }
    },
    
    // Quality Events (Rare Patterns)
    {
      name: 'customer_complaint',
      type: 'boolean',
      constraints: { rarePattern: 0.02, required: true },
      domainExpertise: {
        description: 'Customer complaint indicator for quality issues',
        businessRule: 'Customer complaints require immediate investigation and response',
        qualityImpact: 'high'
      }
    },
    {
      name: 'warranty_claim',
      type: 'boolean',
      constraints: { rarePattern: 0.01, required: true },
      domainExpertise: {
        description: 'Warranty claim indicator for quality failures',
        businessRule: 'Warranty claims require root cause analysis and corrective action',
        qualityImpact: 'high'
      }
    },
    {
      name: 'recall_required',
      type: 'boolean',
      constraints: { rarePattern: 0.001, required: true },
      domainExpertise: {
        description: 'Recall requirement indicator for critical defects',
        businessRule: 'Recalls require regulatory notification and customer communication',
        qualityImpact: 'critical'
      }
    },
    {
      name: 'supplier_audit_fail',
      type: 'boolean',
      constraints: { rarePattern: 0.03, required: true },
      domainExpertise: {
        description: 'Supplier audit failure indicator',
        businessRule: 'Failed supplier audits require corrective action plans',
        qualityImpact: 'high'
      }
    },
    
    // Advanced Quality Metrics
    {
      name: 'dimensional_accuracy',
      type: 'number',
      constraints: { range: [0, 100], required: true },
      domainExpertise: {
        description: 'Dimensional accuracy percentage',
        businessRule: 'Dimensional accuracy must be above 95% for precision parts',
        qualityImpact: 'high'
      }
    },
    {
      name: 'surface_finish',
      type: 'number',
      constraints: { range: [0, 100], required: true },
      domainExpertise: {
        description: 'Surface finish quality score',
        businessRule: 'Surface finish must meet aesthetic standards for visible parts',
        qualityImpact: 'medium'
      }
    },
    {
      name: 'material_strength',
      type: 'number',
      constraints: { range: [0, 100], required: true },
      domainExpertise: {
        description: 'Material strength validation score',
        businessRule: 'Material strength must meet safety requirements for structural parts',
        qualityImpact: 'critical'
      }
    },
    
    // Compliance and Standards
    {
      name: 'iso_compliance',
      type: 'boolean',
      constraints: { required: true },
      domainExpertise: {
        description: 'ISO standard compliance indicator',
        businessRule: 'All parts must meet ISO quality standards',
        qualityImpact: 'high'
      }
    },
    {
      name: 'safety_certification',
      type: 'boolean',
      constraints: { required: true },
      domainExpertise: {
        description: 'Safety certification indicator',
        businessRule: 'Safety-critical parts must have valid certifications',
        qualityImpact: 'critical'
      }
    }
  ],
  
  businessRules: [
    {
      id: 'br-001',
      name: 'Quality Score Threshold',
      rule: 'quality_score >= 85',
      probability: 0.05,
      impact: 'critical',
      description: 'Quality score must meet minimum threshold for production release',
      domainExpertise: 'Automotive industry standard for premium quality'
    },
    {
      id: 'br-002',
      name: 'Defect Rate Limit',
      rule: 'defect_rate <= 0.05',
      probability: 0.03,
      impact: 'critical',
      description: 'Defect rate must be below 0.05 for premium brands',
      domainExpertise: 'Six Sigma quality standard for automotive manufacturing'
    },
    {
      id: 'br-003',
      name: 'Severity Escalation',
      rule: 'defect_severity <= 7',
      probability: 0.02,
      impact: 'critical',
      description: 'High severity defects require immediate escalation',
      domainExpertise: 'Automotive safety and quality management protocol'
    },
    {
      id: 'br-004',
      name: 'Cost Impact Review',
      rule: 'defect_cost <= 5000',
      probability: 0.01,
      impact: 'high',
      description: 'High cost defects require management review',
      domainExpertise: 'Financial impact management in quality control'
    },
    {
      id: 'br-005',
      name: 'Customer Complaint Response',
      rule: 'customer_complaint = false OR response_time <= 24',
      probability: 0.02,
      impact: 'high',
      description: 'Customer complaints require immediate response',
      domainExpertise: 'Customer service excellence in automotive industry'
    }
  ],
  
  qualityMetrics: [
    {
      name: 'Overall Quality Score',
      calculation: 'weighted_average(quality_score, defect_rate, tolerance_violation)',
      target: 90,
      threshold: 85,
      unit: 'percentage',
      description: 'Composite quality score based on multiple factors'
    },
    {
      name: 'Defect Rate per Thousand',
      calculation: 'defect_rate * 1000',
      target: 50,
      threshold: 50,
      unit: 'parts per thousand',
      description: 'Defect rate normalized to per thousand parts'
    },
    {
      name: 'Quality Cost Index',
      calculation: 'defect_cost / total_production_value',
      target: 0.02,
      threshold: 0.05,
      unit: 'percentage',
      description: 'Quality cost as percentage of production value'
    }
  ],
  
  industryStandards: [
    {
      name: 'ISO 9001',
      version: '2015',
      requirements: ['Quality Management System', 'Process Control', 'Continuous Improvement'],
      compliance: true,
      description: 'International standard for quality management systems'
    },
    {
      name: 'IATF 16949',
      version: '2016',
      requirements: ['Automotive Quality Management', 'Supplier Management', 'Risk Management'],
      compliance: true,
      description: 'Automotive industry quality management standard'
    },
    {
      name: 'Six Sigma',
      version: 'DMAIC',
      requirements: ['Define', 'Measure', 'Analyze', 'Improve', 'Control'],
      compliance: true,
      description: 'Quality improvement methodology for defect reduction'
    }
  ]
};

export default automotiveQualitySchema;
