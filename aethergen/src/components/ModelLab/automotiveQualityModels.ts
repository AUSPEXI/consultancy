// Automotive Quality Model Templates for Enhanced Synthetic Data Training
// These models use domain expertise and business rules for quality monitoring

export interface AutomotiveQualityModel {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'anomaly_detection';
  targetField: string;
  features: string[];
  businessValue: string;
  roiMetrics: string[];
  useCase: string;
  targetAccuracy: number;
  costSavings: string;
}

export const automotiveQualityModels: AutomotiveQualityModel[] = [
  {
    id: 'defect-classification-v1',
    name: 'Defect Classification Model',
    description: 'Classifies automotive part defects into material, assembly, design, cosmetic, functional, or safety categories',
    type: 'classification',
    targetField: 'defect_type',
    features: [
      'quality_score',
      'defect_rate',
      'tolerance_violation',
      'dimensional_accuracy',
      'surface_finish',
      'material_strength'
    ],
    businessValue: 'Automated defect classification reduces manual inspection time by 60% and improves quality consistency',
    roiMetrics: [
      '60% reduction in manual inspection time',
      '40% improvement in defect classification accuracy',
      '30% reduction in quality control costs'
    ],
    useCase: 'Production line quality monitoring, supplier quality assessment, warranty claim analysis',
    targetAccuracy: 0.92,
    costSavings: '$50K - $200K annually per production line'
  },
  
  {
    id: 'defect-severity-prediction-v1',
    name: 'Defect Severity Prediction',
    description: 'Predicts defect severity (1-10 scale) based on quality metrics and production context',
    type: 'regression',
    targetField: 'defect_severity',
    features: [
      'quality_score',
      'defect_rate',
      'tolerance_violation',
      'defect_type',
      'supplier_id',
      'production_line',
      'shift_id'
    ],
    businessValue: 'Early severity prediction enables proactive quality management and reduces high-severity defect costs',
    roiMetrics: [
      '50% reduction in high-severity defects',
      '25% improvement in production planning',
      '40% reduction in warranty costs'
    ],
    useCase: 'Quality risk assessment, production planning, supplier performance monitoring',
    targetAccuracy: 0.88,
    costSavings: '$100K - $500K annually through defect prevention'
  },
  
  {
    id: 'quality-score-prediction-v1',
    name: 'Quality Score Prediction',
    description: 'Predicts overall quality score based on individual quality metrics and production parameters',
    type: 'regression',
    targetField: 'quality_score',
    features: [
      'defect_rate',
      'tolerance_violation',
      'dimensional_accuracy',
      'surface_finish',
      'material_strength',
      'supplier_id',
      'production_line'
    ],
    businessValue: 'Real-time quality score prediction enables immediate quality intervention and process optimization',
    roiMetrics: [
      '30% improvement in quality consistency',
      '25% reduction in quality-related production delays',
      '35% improvement in customer satisfaction scores'
    ],
    useCase: 'Real-time quality monitoring, process optimization, customer quality assurance',
    targetAccuracy: 0.90,
    costSavings: '$75K - $300K annually through quality improvement'
  },
  
  {
    id: 'customer-complaint-prediction-v1',
    name: 'Customer Complaint Prediction',
    description: 'Predicts likelihood of customer complaints based on quality metrics and production parameters',
    type: 'classification',
    targetField: 'customer_complaint',
    features: [
      'quality_score',
      'defect_rate',
      'defect_severity',
      'defect_type',
      'surface_finish',
      'dimensional_accuracy',
      'supplier_id'
    ],
    businessValue: 'Predicting customer complaints enables proactive quality improvement and reduces customer service costs',
    roiMetrics: [
      '45% reduction in customer complaints',
      '30% improvement in customer satisfaction',
      '25% reduction in customer service costs'
    ],
    useCase: 'Customer quality assurance, proactive quality improvement, warranty cost reduction',
    targetAccuracy: 0.85,
    costSavings: '$25K - $100K annually through complaint prevention'
  },
  
  {
    id: 'warranty-claim-prediction-v1',
    name: 'Warranty Claim Prediction',
    description: 'Predicts likelihood of warranty claims based on quality metrics and production context',
    type: 'classification',
    targetField: 'warranty_claim',
    features: [
      'quality_score',
      'defect_rate',
      'defect_severity',
      'defect_type',
      'material_strength',
      'dimensional_accuracy',
      'supplier_id',
      'production_line'
    ],
    businessValue: 'Warranty claim prediction enables proactive quality management and reduces warranty costs',
    roiMetrics: [
      '40% reduction in warranty claims',
      '35% improvement in quality planning',
      '30% reduction in warranty costs'
    ],
    useCase: 'Warranty cost management, quality planning, supplier performance monitoring',
    targetAccuracy: 0.87,
    costSavings: '$150K - $600K annually through warranty cost reduction'
  },
  
  {
    id: 'recall-risk-assessment-v1',
    name: 'Recall Risk Assessment',
    description: 'Assesses risk of product recall based on quality metrics and safety indicators',
    type: 'classification',
    targetField: 'recall_required',
    features: [
      'quality_score',
      'defect_rate',
      'defect_severity',
      'defect_type',
      'material_strength',
      'safety_certification',
      'iso_compliance',
      'supplier_id'
    ],
    businessValue: 'Recall risk assessment enables proactive safety management and reduces recall costs',
    roiMetrics: [
      '60% reduction in recall risk',
      '50% improvement in safety management',
      '40% reduction in recall costs'
    ],
    useCase: 'Safety management, regulatory compliance, risk assessment',
    targetAccuracy: 0.95,
    costSavings: '$500K - $2M annually through recall prevention'
  },
  
  {
    id: 'supplier-quality-monitoring-v1',
    name: 'Supplier Quality Monitoring',
    description: 'Monitors supplier quality performance and predicts quality issues',
    type: 'anomaly_detection',
    targetField: 'supplier_audit_fail',
    features: [
      'quality_score',
      'defect_rate',
      'defect_severity',
      'defect_cost',
      'iso_compliance',
      'safety_certification',
      'dimensional_accuracy',
      'material_strength'
    ],
    businessValue: 'Supplier quality monitoring enables proactive supplier management and reduces quality risks',
    roiMetrics: [
      '35% improvement in supplier quality',
      '25% reduction in supplier-related defects',
      '30% improvement in supplier performance'
    ],
    useCase: 'Supplier management, quality risk assessment, procurement optimization',
    targetAccuracy: 0.89,
    costSavings: '$100K - $400K annually through supplier quality improvement'
  },
  
  {
    id: 'production-line-optimization-v1',
    name: 'Production Line Optimization',
    description: 'Optimizes production line performance based on quality metrics and operational parameters',
    type: 'regression',
    targetField: 'quality_score',
    features: [
      'defect_rate',
      'tolerance_violation',
      'dimensional_accuracy',
      'surface_finish',
      'material_strength',
      'shift_id',
      'batch_number',
      'supplier_id'
    ],
    businessValue: 'Production line optimization improves quality consistency and reduces production costs',
    roiMetrics: [
      '25% improvement in production efficiency',
      '30% reduction in quality-related delays',
      '20% improvement in quality consistency'
    ],
    useCase: 'Production optimization, quality management, operational efficiency',
    targetAccuracy: 0.88,
    costSavings: '$200K - $800K annually through production optimization'
  }
];

export default automotiveQualityModels;
