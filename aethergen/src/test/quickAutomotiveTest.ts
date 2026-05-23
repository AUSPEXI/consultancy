// Quick Test Script for Enhanced Synthetic Data Generation
// This generates 1K records to quickly validate the system

import EnhancedSyntheticDataGenerator from '../services/enhancedSyntheticDataGenerator';
import { automotiveQualitySchema } from '../types/automotiveQualitySchema';

async function quickTest() {
  console.log('🚗 QUICK AUTOMOTIVE QUALITY TEST 🚗');
  console.log('=====================================');
  console.log('');
  
  // Quick test configuration
  const config = {
    targetRecords: 1000, // 1K records for quick test
    qualityThreshold: 85,
    businessRuleCompliance: 80,
    rarePatternGeneration: true,
    domainExpertiseWeight: 0.8,
    statisticalFidelity: 0.9
  };
  
  console.log('📊 Quick Test Configuration:');
  console.log(`   Target Records: ${config.targetRecords.toLocaleString()}`);
  console.log(`   Quality Threshold: ${config.qualityThreshold}%`);
  console.log('');
  
  const generator = new EnhancedSyntheticDataGenerator(automotiveQualitySchema, config);
  
  try {
    console.log('🔄 Starting Quick Test...');
    const startTime = Date.now();
    const result = await generator.generateEnhancedData();
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('✅ Quick Test Complete!');
    console.log('=======================');
    console.log('');
    
    console.log('📈 Results:');
    console.log(`   Records: ${result.metrics.totalRecords.toLocaleString()}`);
    console.log(`   Quality: ${result.metrics.qualityCompliance.toFixed(2)}%`);
    console.log(`   Compliance: ${result.metrics.businessRuleCompliance.toFixed(2)}%`);
    console.log(`   Time: ${totalTime.toFixed(2)}s`);
    console.log('');
    
    console.log('📋 Sample Record:');
    const sample = result.data[0];
    console.log(`   Part ID: ${sample.part_id}`);
    console.log(`   Quality Score: ${sample.quality_score}`);
    console.log(`   Defect Type: ${sample.defect_type}`);
    console.log(`   Supplier: ${sample.supplier_id}`);
    console.log(`   Production Line: ${sample.production_line}`);
    console.log('');
    
    console.log('🎯 System Ready for Full Test! 🚀');
    
    return result;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    throw error;
  }
}

// Export for use in other tests
export { quickTest };

// For ES module compatibility, we'll run this directly
// Remove the require.main check for ES modules
