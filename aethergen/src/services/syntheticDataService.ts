import { DataSchema, SchemaField, SyntheticDataResult, ModelSelection } from '../types/schema';

export interface AIModel {
  name: string;
  type: 'T5-Small' | 'VAE' | 'ARIMA' | 'IsolationForest' | 'Node2Vec';
  description: string;
  bestFor: string[];
  privacyLevel: 'low' | 'medium' | 'high';
}

export const availableModels: AIModel[] = [
  {
    name: 'T5-Small',
    type: 'T5-Small',
    description: 'Text generation model for string fields',
    bestFor: ['names', 'descriptions', 'text', 'titles'],
    privacyLevel: 'high'
  },
  {
    name: 'VAE (Variational Autoencoder)',
    type: 'VAE',
    description: 'Neural network for continuous data generation',
    bestFor: ['ages', 'scores', 'measurements', 'percentages'],
    privacyLevel: 'medium'
  },
  {
    name: 'ARIMA',
    type: 'ARIMA',
    description: 'Time series model for sequential data',
    bestFor: ['prices', 'amounts', 'time-series', 'financial-data'],
    privacyLevel: 'medium'
  },
  {
    name: 'Isolation Forest',
    type: 'IsolationForest',
    description: 'Anomaly detection for outlier generation',
    bestFor: ['anomalies', 'outliers', 'fraud-detection'],
    privacyLevel: 'high'
  },
  {
    name: 'Node2Vec',
    type: 'Node2Vec',
    description: 'Graph-based model for relationship data',
    bestFor: ['relationships', 'networks', 'connections'],
    privacyLevel: 'medium'
  }
];

export class SyntheticDataService {
  private models: Map<string, any> = new Map();
  private trainingMetrics: Map<string, any> = new Map();

  async selectModels(schema: DataSchema, seedData: any[]): Promise<ModelSelection[]> {
    const selections: ModelSelection[] = [];
    
    schema.fields.forEach(field => {
      const bestModel = this.findBestModel(field, seedData);
      selections.push({
        fieldName: field.name,
        selectedModel: bestModel.name,
        confidence: bestModel.confidence,
        reasoning: bestModel.reasoning
      });
    });
    
    return selections;
  }

  private findBestModel(field: SchemaField, seedData: any[]): {
    name: string;
    confidence: number;
    reasoning: string;
  } {
    const fieldValues = seedData.map(row => row[field.name]).filter(v => v !== undefined);
    
    if (fieldValues.length === 0) {
      return {
        name: 'T5-Small',
        confidence: 0.5,
        reasoning: 'No data available, using default model'
      };
    }

    const sampleValue = fieldValues[0];
    const fieldType = typeof sampleValue;
    const fieldName = field.name.toLowerCase();

    // Analyze field characteristics
    const isText = fieldType === 'string' && sampleValue.length > 3;
    const isNumeric = fieldType === 'number';
    const isDate = sampleValue instanceof Date || (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)));
    const isBoolean = fieldType === 'boolean';
    const isObject = fieldType === 'object' && sampleValue !== null;

    // Select model based on characteristics
    if (isText) {
      if (fieldName.includes('name') || fieldName.includes('title')) {
        return {
          name: 'T5-Small',
          confidence: 0.9,
          reasoning: 'Text field with name/title characteristics'
        };
      } else if (fieldName.includes('description') || fieldName.includes('text')) {
        return {
          name: 'T5-Small',
          confidence: 0.85,
          reasoning: 'Long text field suitable for T5 generation'
        };
      }
    }

    if (isNumeric) {
      if (fieldName.includes('age') || fieldName.includes('score')) {
        return {
          name: 'VAE',
          confidence: 0.9,
          reasoning: 'Continuous numeric data suitable for VAE'
        };
      } else if (fieldName.includes('amount') || fieldName.includes('price')) {
        return {
          name: 'ARIMA',
          confidence: 0.8,
          reasoning: 'Financial/time-series data suitable for ARIMA'
        };
      }
    }

    if (isDate) {
      return {
        name: 'ARIMA',
        confidence: 0.85,
        reasoning: 'Date/time data suitable for time series model'
      };
    }

    if (isBoolean) {
      return {
        name: 'VAE',
        confidence: 0.7,
        reasoning: 'Boolean data can be handled by VAE'
      };
    }

    if (isObject) {
      return {
        name: 'Node2Vec',
        confidence: 0.8,
        reasoning: 'Object data suitable for graph-based model'
      };
    }

    // Default fallback
    return {
      name: 'T5-Small',
      confidence: 0.6,
      reasoning: 'Default model for unknown field type'
    };
  }

  async trainFieldModels(schema: DataSchema, seedData: any[]): Promise<{
    fieldModels: Record<string, any>;
    trainingMetrics: any;
  }> {
    const fieldModels: Record<string, any> = {};
    const trainingMetrics: any = {};

    for (const field of schema.fields) {
      const fieldData = seedData.map(row => row[field.name]).filter(v => v !== undefined);
      
      if (fieldData.length === 0) continue;

      const modelSelection = this.findBestModel(field, seedData);
      const model = await this.trainModel(field, fieldData, modelSelection.selectedModel);
      
      fieldModels[field.name] = model;
      trainingMetrics[field.name] = {
        modelType: modelSelection.selectedModel,
        confidence: modelSelection.confidence,
        dataSize: fieldData.length,
        trainingTime: Date.now() // Simplified for demo
      };
    }

    return { fieldModels, trainingMetrics };
  }

  private async trainModel(field: SchemaField, data: any[], modelType: string): Promise<any> {
    // Simulate model training
    const model = {
      type: modelType,
      field: field.name,
      trained: true,
      parameters: this.generateModelParameters(field, data, modelType),
      privacyLevel: field.privacyLevel
    };

    this.models.set(`${field.name}_${modelType}`, model);
    return model;
  }

  private generateModelParameters(field: SchemaField, data: any[], modelType: string): any {
    const sampleValue = data[0];
    
    switch (modelType) {
      case 'T5-Small':
        return {
          maxLength: 50,
          temperature: 0.7,
          topP: 0.9,
          vocabulary: this.extractVocabulary(data)
        };
      
      case 'VAE':
        return {
          latentDim: 32,
          hiddenDim: 64,
          learningRate: 0.001,
          batchSize: 32,
          distribution: this.analyzeDistribution(data)
        };
      
      case 'ARIMA':
        return {
          p: 1,
          d: 1,
          q: 1,
          seasonal: false,
          trend: this.analyzeTrend(data)
        };
      
      case 'IsolationForest':
        return {
          contamination: 0.1,
          nEstimators: 100,
          maxSamples: 'auto',
          anomalyThreshold: this.calculateAnomalyThreshold(data)
        };
      
      case 'Node2Vec':
        return {
          dimensions: 128,
          walkLength: 80,
          numWalks: 10,
          windowSize: 10,
          graphStructure: this.analyzeGraphStructure(data)
        };
      
      default:
        return {
          type: 'default',
          parameters: {}
        };
    }
  }

  private extractVocabulary(data: any[]): string[] {
    const words = new Set<string>();
    data.forEach(item => {
      if (typeof item === 'string') {
        item.split(' ').forEach(word => words.add(word.toLowerCase()));
      }
    });
    return Array.from(words).slice(0, 1000); // Limit vocabulary size
  }

  private analyzeDistribution(data: any[]): any {
    const numericData = data.filter(d => typeof d === 'number');
    if (numericData.length === 0) return { type: 'unknown' };

    const sorted = numericData.sort((a, b) => a - b);
    const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
    const variance = numericData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericData.length;
    const std = Math.sqrt(variance);

    return {
      type: 'normal',
      mean,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      quartiles: {
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q2: sorted[Math.floor(sorted.length * 0.5)],
        q3: sorted[Math.floor(sorted.length * 0.75)]
      }
    };
  }

  private analyzeTrend(data: any[]): string {
    if (data.length < 2) return 'none';
    
    const numericData = data.filter(d => typeof d === 'number');
    if (numericData.length < 2) return 'none';

    const firstHalf = numericData.slice(0, Math.floor(numericData.length / 2));
    const secondHalf = numericData.slice(Math.floor(numericData.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private calculateAnomalyThreshold(data: any[]): number {
    const numericData = data.filter(d => typeof d === 'number');
    if (numericData.length === 0) return 0;

    const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
    const variance = numericData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericData.length;
    const std = Math.sqrt(variance);

    return mean + 2 * std; // 2 standard deviations
  }

  private analyzeGraphStructure(data: any[]): any {
    // Simplified graph analysis
    return {
      nodes: data.length,
      edges: Math.floor(data.length * 0.1), // Assume 10% connectivity
      density: 0.1,
      clustering: 0.3
    };
  }

  async generateData(schema: DataSchema, volume: number): Promise<SyntheticDataResult> {
    const startTime = Date.now();
    const records: any[] = [];
    const errors: string[] = [];

    try {
      // Generate records in batches
      const batchSize = 100;
      const totalBatches = Math.ceil(volume / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const currentBatchSize = Math.min(batchSize, volume - batch * batchSize);
        
        for (let i = 0; i < currentBatchSize; i++) {
          const record: any = {};
          
          schema.fields.forEach(field => {
            try {
              record[field.name] = this.generateFieldValue(field);
            } catch (error) {
              errors.push(`Error generating field ${field.name}: ${error}`);
              record[field.name] = this.generateDefaultValue(field.type);
            }
          });
          
          records.push(record);
        }
      }

      const generationTime = Date.now() - startTime;
      const privacyScore = this.calculatePrivacyScore(records, schema);
      const utilityScore = this.calculateUtilityScore(records, schema);

      return {
        success: errors.length === 0,
        records,
        metrics: {
          privacyScore,
          utilityScore,
          generationTime,
          recordsPerSecond: Math.round(records.length / (generationTime / 1000))
        },
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        records: [],
        metrics: {
          privacyScore: 0,
          utilityScore: 0,
          generationTime: Date.now() - startTime,
          recordsPerSecond: 0
        },
        errors: [`Generation failed: ${error}`]
      };
    }
  }

  private generateFieldValue(field: SchemaField): any {
    const model = this.models.get(`${field.name}_${field.aiModel || 'T5-Small'}`);
    
    if (!model) {
      return this.generateDefaultValue(field.type);
    }

    // Apply privacy transformations based on privacy level
    let value = this.generateValueByModel(model, field);
    
    if (field.privacyLevel === 'high') {
      value = this.applyHighPrivacyTransformation(value, field.type);
    } else if (field.privacyLevel === 'medium') {
      value = this.applyMediumPrivacyTransformation(value, field.type);
    }

    return value;
  }

  private generateValueByModel(model: any, field: SchemaField): any {
    switch (model.type) {
      case 'T5-Small':
        return this.generateTextValue(field);
      
      case 'VAE':
        return this.generateNumericValue(field, model.parameters);
      
      case 'ARIMA':
        return this.generateTimeSeriesValue(field, model.parameters);
      
      case 'IsolationForest':
        return this.generateAnomalyValue(field, model.parameters);
      
      case 'Node2Vec':
        return this.generateGraphValue(field, model.parameters);
      
      default:
        return this.generateDefaultValue(field.type);
    }
  }

  private generateTextValue(field: SchemaField): string {
    const templates = [
      'synthetic_${field}_${id}',
      'generated_${field}_${id}',
      'data_${field}_${id}',
      'sample_${field}_${id}'
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    const id = Math.random().toString(36).substr(2, 9);
    
    return template.replace('${field}', field.name).replace('${id}', id);
  }

  private generateNumericValue(field: SchemaField, parameters: any): number {
    const { mean, std, min, max } = parameters.distribution;
    
    // Generate value within distribution bounds
    let value = mean + (Math.random() - 0.5) * 2 * std;
    
    // Clamp to min/max bounds
    value = Math.max(min, Math.min(max, value));
    
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  }

  private generateTimeSeriesValue(field: SchemaField, parameters: any): Date {
    const now = new Date();
    const daysOffset = Math.floor(Math.random() * 365);
    const hoursOffset = Math.floor(Math.random() * 24);
    
    return new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000);
  }

  private generateAnomalyValue(field: SchemaField, parameters: any): any {
    // Generate occasional anomalies
    if (Math.random() < parameters.contamination) {
      return this.generateAnomalousValue(field, parameters);
    }
    
    return this.generateNormalValue(field, parameters);
  }

  private generateAnomalousValue(field: SchemaField, parameters: any): any {
    const threshold = parameters.anomalyThreshold;
    
    if (field.type === 'number') {
      return threshold * (1 + Math.random() * 2); // Above threshold
    }
    
    return `ANOMALY_${field.name}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNormalValue(field: SchemaField, parameters: any): any {
    return this.generateDefaultValue(field.type);
  }

  private generateGraphValue(field: SchemaField, parameters: any): any {
    // Generate graph-like structure
    return {
      nodeId: Math.floor(Math.random() * parameters.graphStructure.nodes),
      connections: Math.floor(Math.random() * 5),
      weight: Math.random(),
      synthetic: true
    };
  }

  private generateDefaultValue(type: string): any {
    switch (type) {
      case 'string':
        return `default_${Math.random().toString(36).substr(2, 9)}`;
      case 'number':
        return Math.floor(Math.random() * 1000);
      case 'boolean':
        return Math.random() > 0.5;
      case 'date':
        return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      case 'json':
        return { default: true, timestamp: Date.now() };
      default:
        return null;
    }
  }

  private applyHighPrivacyTransformation(value: any, type: string): any {
    switch (type) {
      case 'string':
        return `anon_${Math.random().toString(36).substr(2, 12)}`;
      case 'number':
        return Math.floor(Math.random() * 1000);
      case 'date':
        return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      default:
        return value;
    }
  }

  private applyMediumPrivacyTransformation(value: any, type: string): any {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? `${value}_syn` : value;
      case 'number':
        return typeof value === 'number' ? value + (Math.random() - 0.5) * 10 : value;
      default:
        return value;
    }
  }

  private calculatePrivacyScore(records: any[], schema: DataSchema): number {
    // Calculate privacy score based on uniqueness and transformations
    const uniqueRecords = new Set(records.map(r => JSON.stringify(r))).size;
    const totalRecords = records.length;
    const uniquenessRatio = uniqueRecords / totalRecords;
    
    // Higher uniqueness = higher privacy
    return Math.round(uniquenessRatio * 100);
  }

  private calculateUtilityScore(records: any[], schema: DataSchema): number {
    // Calculate utility score based on data quality and completeness
    let validRecords = 0;
    
    records.forEach(record => {
      const hasAllFields = schema.fields.every(field => 
        record[field.name] !== undefined && record[field.name] !== null
      );
      
      if (hasAllFields) {
        validRecords++;
      }
    });
    
    return Math.round((validRecords / records.length) * 100);
  }
}

export const syntheticDataService = new SyntheticDataService(); 