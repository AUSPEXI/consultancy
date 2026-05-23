import { ProcessedData } from '../types';

// Schema Management Design Tool for Enterprise Data Infrastructure
export interface SchemaDefinition {
  name: string;
  fields: SchemaField[];
  constraints: SchemaConstraint[];
  metadata: SchemaMetadata;
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'mixed';
  required: boolean;
  description: string;
  validation: FieldValidation;
  source: string;
  harmonization: HarmonizationRule;
}

export interface SchemaConstraint {
  type: 'unique' | 'foreign_key' | 'check' | 'not_null';
  fields: string[];
  condition?: string;
  message?: string;
}

export interface SchemaMetadata {
  version: string;
  created: string;
  modified: string;
  owner: string;
  domain: string;
  tags: string[];
  description: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  enum?: any[];
  custom?: string;
}

export interface HarmonizationRule {
  targetField: string;
  transformation: 'direct' | 'mapping' | 'calculation' | 'aggregation';
  parameters: Record<string, any>;
  fallback?: any;
}

export interface SchemaHarmonizationPlan {
  sourceSchemas: SchemaDefinition[];
  targetSchema: SchemaDefinition;
  fieldMappings: FieldMapping[];
  transformations: TransformationRule[];
  validationRules: ValidationRule[];
  estimatedEffort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface FieldMapping {
  sourceField: string;
  sourceSchema: string;
  targetField: string;
  confidence: number;
  transformation?: string;
}

export interface TransformationRule {
  sourceFields: string[];
  targetField: string;
  operation: 'concat' | 'split' | 'calculate' | 'format' | 'custom';
  parameters: Record<string, any>;
}

export interface ValidationRule {
  field: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

// Schema Management Service
export class SchemaManagementService {
  private schemas: Map<string, SchemaDefinition> = new Map();
  private harmonizationPlans: Map<string, SchemaHarmonizationPlan> = new Map();

  // Create a new schema definition
  async createSchema(definition: SchemaDefinition): Promise<SchemaDefinition> {
    console.log('Creating new schema:', definition.name);
    
    // Validate schema definition
    const validation = this.validateSchemaDefinition(definition);
    if (!validation.isValid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    // Add metadata
    definition.metadata = {
      ...definition.metadata,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    // Store schema
    this.schemas.set(definition.name, definition);
    
    console.log(`Schema '${definition.name}' created successfully`);
    return definition;
  }

  // Update existing schema
  async updateSchema(name: string, updates: Partial<SchemaDefinition>): Promise<SchemaDefinition> {
    const existing = this.schemas.get(name);
    if (!existing) {
      throw new Error(`Schema '${name}' not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        modified: new Date().toISOString()
      }
    };

    // Validate updated schema
    const validation = this.validateSchemaDefinition(updated);
    if (!validation.isValid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    this.schemas.set(name, updated);
    console.log(`Schema '${name}' updated successfully`);
    return updated;
  }

  // Get schema by name
  async getSchema(name: string): Promise<SchemaDefinition | null> {
    return this.schemas.get(name) || null;
  }

  // List all schemas
  async listSchemas(domain?: string): Promise<SchemaDefinition[]> {
    const allSchemas = Array.from(this.schemas.values());
    if (domain) {
      return allSchemas.filter(schema => schema.metadata.domain === domain);
    }
    return allSchemas;
  }

  // Create harmonization plan between schemas
  async createHarmonizationPlan(
    sourceSchemaNames: string[],
    targetSchemaName: string
  ): Promise<SchemaHarmonizationPlan> {
    console.log('Creating harmonization plan');
    
    const sourceSchemas = sourceSchemaNames.map(name => this.schemas.get(name)).filter(Boolean) as SchemaDefinition[];
    const targetSchema = this.schemas.get(targetSchemaName);
    
    if (!targetSchema) {
      throw new Error(`Target schema '${targetSchemaName}' not found`);
    }

    if (sourceSchemas.length === 0) {
      throw new Error('No valid source schemas provided');
    }

    // Analyze field similarities and create mappings
    const fieldMappings = this.analyzeFieldSimilarities(sourceSchemas, targetSchema);
    
    // Generate transformation rules
    const transformations = this.generateTransformations(sourceSchemas, targetSchema, fieldMappings);
    
    // Create validation rules
    const validationRules = this.generateValidationRules(targetSchema);
    
    // Estimate effort and timeline
    const estimatedEffort = this.estimateHarmonizationEffort(fieldMappings, transformations);
    const timeline = this.estimateTimeline(estimatedEffort);

    const plan: SchemaHarmonizationPlan = {
      sourceSchemas,
      targetSchema,
      fieldMappings,
      transformations,
      validationRules,
      estimatedEffort,
      timeline
    };

    const planId = `harmonization_${Date.now()}`;
    this.harmonizationPlans.set(planId, plan);
    
    console.log('Harmonization plan created successfully');
    return plan;
  }

  // Execute harmonization plan
  async executeHarmonizationPlan(planId: string, data: Record<string, any[]>): Promise<{
    harmonizedData: any[];
    qualityMetrics: any;
    evidence: any;
  }> {
    const plan = this.harmonizationPlans.get(planId);
    if (!plan) {
      throw new Error(`Harmonization plan '${planId}' not found`);
    }

    console.log('Executing harmonization plan:', planId);
    
    // Transform source data according to plan
    const harmonizedData = await this.transformData(data, plan);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(harmonizedData, plan.targetSchema);
    
    // Generate evidence bundle
    const evidence = {
      planId,
      executionTime: new Date().toISOString(),
      sourceDataCounts: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value.length])
      ),
      harmonizedDataCount: harmonizedData.length,
      qualityMetrics,
      fieldMappings: plan.fieldMappings,
      transformations: plan.transformations
    };

    return {
      harmonizedData,
      qualityMetrics,
      evidence
    };
  }

  // Private helper methods
  private validateSchemaDefinition(schema: SchemaDefinition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!schema.name) errors.push('Schema name is required');
    if (!schema.fields || schema.fields.length === 0) errors.push('Schema must have at least one field');
    
    // Validate field names are unique
    const fieldNames = schema.fields.map(f => f.name);
    const uniqueFieldNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueFieldNames.size) {
      errors.push('Field names must be unique');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private analyzeFieldSimilarities(
    sourceSchemas: SchemaDefinition[],
    targetSchema: SchemaDefinition
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    
    targetSchema.fields.forEach(targetField => {
      let bestMatch: FieldMapping | null = null;
      let bestConfidence = 0;
      
      sourceSchemas.forEach(sourceSchema => {
        sourceSchema.fields.forEach(sourceField => {
          const confidence = this.calculateFieldSimilarity(sourceField, targetField);
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = {
              sourceField: sourceField.name,
              sourceSchema: sourceSchema.name,
              targetField: targetField.name,
              confidence,
              transformation: confidence > 0.8 ? 'direct' : 'mapping'
            };
          }
        });
      });
      
      if (bestMatch && bestMatch.confidence > 0.5) {
        mappings.push(bestMatch);
      }
    });
    
    return mappings;
  }

  private calculateFieldSimilarity(sourceField: SchemaField, targetField: SchemaField): number {
    let score = 0;
    
    // Name similarity
    if (sourceField.name.toLowerCase() === targetField.name.toLowerCase()) {
      score += 0.4;
    } else if (sourceField.name.toLowerCase().includes(targetField.name.toLowerCase()) ||
               targetField.name.toLowerCase().includes(sourceField.name.toLowerCase())) {
      score += 0.2;
    }
    
    // Type compatibility
    if (sourceField.type === targetField.type) {
      score += 0.3;
    } else if (this.areTypesCompatible(sourceField.type, targetField.type)) {
      score += 0.15;
    }
    
    // Description similarity
    if (sourceField.description && targetField.description) {
      const descSimilarity = this.calculateTextSimilarity(
        sourceField.description.toLowerCase(),
        targetField.description.toLowerCase()
      );
      score += descSimilarity * 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  private areTypesCompatible(sourceType: string, targetType: string): boolean {
    const compatibilityMatrix: Record<string, string[]> = {
      'string': ['mixed'],
      'number': ['mixed'],
      'boolean': ['mixed'],
      'date': ['string', 'mixed'],
      'array': ['mixed'],
      'object': ['mixed'],
      'mixed': ['string', 'number', 'boolean', 'date', 'array', 'object']
    };
    
    return compatibilityMatrix[sourceType]?.includes(targetType) || false;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple text similarity calculation
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private generateTransformations(
    sourceSchemas: SchemaDefinition[],
    targetSchema: SchemaDefinition,
    fieldMappings: FieldMapping[]
  ): TransformationRule[] {
    const transformations: TransformationRule[] = [];
    
    // Generate transformations for fields that need calculation or formatting
    targetSchema.fields.forEach(targetField => {
      const mapping = fieldMappings.find(m => m.targetField === targetField.name);
      
      if (!mapping) {
        // Field has no direct mapping, might need calculation
        if (targetField.type === 'number') {
          transformations.push({
            sourceFields: ['field1', 'field2'], // Placeholder
            targetField: targetField.name,
            operation: 'calculate',
            parameters: { operation: 'add' }
          });
        }
      }
    });
    
    return transformations;
  }

  private generateValidationRules(targetSchema: SchemaDefinition): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    targetSchema.fields.forEach(field => {
      if (field.required) {
        rules.push({
          field: field.name,
          rule: 'not_null',
          severity: 'error',
          message: `${field.name} is required`
        });
      }
      
      if (field.validation.minLength) {
        rules.push({
          field: field.name,
          rule: 'min_length',
          severity: 'error',
          message: `${field.name} must be at least ${field.validation.minLength} characters`
        });
      }
      
      if (field.validation.pattern) {
        rules.push({
          field: field.name,
          rule: 'pattern',
          severity: 'error',
          message: `${field.name} must match pattern: ${field.validation.pattern}`
        });
      }
    });
    
    return rules;
  }

  private estimateHarmonizationEffort(
    fieldMappings: FieldMapping[],
    transformations: TransformationRule[]
  ): 'low' | 'medium' | 'high' {
    const directMappings = fieldMappings.filter(m => m.transformation === 'direct').length;
    const totalMappings = fieldMappings.length;
    const transformationCount = transformations.length;
    
    const directRatio = directMappings / totalMappings;
    
    if (directRatio > 0.8 && transformationCount < 5) return 'low';
    if (directRatio > 0.6 && transformationCount < 10) return 'medium';
    return 'high';
  }

  private estimateTimeline(effort: 'low' | 'medium' | 'high'): string {
    switch (effort) {
      case 'low': return '2-4 weeks';
      case 'medium': return '1-2 months';
      case 'high': return '2-3 months';
      default: return 'to be estimated';
    }
  }

  private async transformData(
    data: Record<string, any[]>,
    plan: SchemaHarmonizationPlan
  ): Promise<any[]> {
    // Implementation would transform source data according to the harmonization plan
    console.log('Transforming data according to harmonization plan');
    
    // Placeholder implementation
    const harmonizedData: any[] = [];
    const sourceData = Object.values(data).flat();
    
    sourceData.forEach(record => {
      const harmonizedRecord: any = {};
      
      plan.fieldMappings.forEach(mapping => {
        const sourceValue = record[mapping.sourceField];
        if (sourceValue !== undefined) {
          harmonizedRecord[mapping.targetField] = sourceValue;
        }
      });
      
      harmonizedData.push(harmonizedRecord);
    });
    
    return harmonizedData;
  }

  private calculateQualityMetrics(data: any[], schema: SchemaDefinition): any {
    // Calculate data quality metrics
    const totalRecords = data.length;
    const validRecords = data.filter(record => {
      return schema.fields.every(field => {
        if (field.required && record[field.name] === undefined) {
          return false;
        }
        return true;
      });
    }).length;
    
    return {
      completeness: validRecords / totalRecords,
      totalRecords,
      validRecords,
      schema: schema.name
    };
  }
}

// Export the service class
export default SchemaManagementService;
