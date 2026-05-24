import OptimizedSyntheticDataGenerator, { OptimizedGenerationConfig } from './optimizedSyntheticDataGenerator';
import { AutomotiveQualitySchema } from '../types/automotiveQualitySchema';

export default class EnhancedSyntheticDataGenerator {
  private schema: AutomotiveQualitySchema;
  private config: OptimizedGenerationConfig;

  constructor(schema: AutomotiveQualitySchema, config: OptimizedGenerationConfig) {
    this.schema = schema;
    this.config = config;
  }

  async generateEnhancedData() {
    // Ensure in-memory data is returned for compatibility with quick tests
    const generator = new OptimizedSyntheticDataGenerator(this.schema, {
      enableStreaming: false,
      batchSize: Math.max(this.config.targetRecords || 1000, 1000),
      ...this.config,
    });
    return await generator.generateOptimizedData();
  }
}


