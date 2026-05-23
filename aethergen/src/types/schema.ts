export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  constraints: {
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
    unique?: boolean;
  };
  aiModel?: 'T5-Small' | 'VAE' | 'ARIMA' | 'IsolationForest' | 'Node2Vec';
  privacyLevel: 'low' | 'medium' | 'high';
  relationships?: {
    foreignKey?: string;
    joinTable?: string;
  };
}

export interface DataSchema {
  id: string;
  name: string;
  description: string;
  domain: string;
  fields: SchemaField[];
  targetVolume: number; // records/day
  privacySettings: {
    differentialPrivacy: boolean;
    epsilon: number;
    syntheticRatio: number; // % synthetic vs real
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ModelSelection {
  fieldName: string;
  selectedModel: string;
  confidence: number;
  reasoning: string;
}

export interface EnsembleModel {
  id: string;
  schemaId: string;
  models: Record<string, any>;
  trainingMetrics: any;
  createdAt: Date;
}

export interface DomainOptimization {
  domain: string;
  optimizations: {
    fieldOptimizations: Record<string, any>;
    privacySettings: any;
    performanceTweaks: any;
  };
}

export interface SyntheticDataResult {
  success: boolean;
  records: any[];
  metrics: {
    privacyScore: number;
    utilityScore: number;
    generationTime: number;
    recordsPerSecond: number;
  };
  errors?: string[];
}

export interface SeedDataUpload {
  id: string;
  schemaId: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  uploadDate: Date;
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationErrors?: string[];
} 