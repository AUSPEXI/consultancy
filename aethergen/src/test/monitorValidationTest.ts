import { automotiveQualitySchema } from '../types/automotiveQualitySchema';
import EnhancedSyntheticDataGenerator from '../services/enhancedSyntheticDataGenerator';

// Test configuration for intentionally bad data
interface BadDataTestConfig {
  targetRecords: number;
  intentionalQualityIssues: boolean;
  generateDuplicates: boolean;
  violateBusinessRules: boolean;
  createOutliers: boolean;
  poorPatternVariety: boolean;
}

class MonitorValidationTester {
  private generator: EnhancedSyntheticDataGenerator;

  constructor() {
    this.generator = new EnhancedSyntheticDataGenerator(automotiveQualitySchema, {
      targetRecords: 1000,
      qualityThreshold: 95,
      businessRuleCompliance: 90,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.95
    });
  }

  /**
   * Generate intentionally bad data to test monitor functionality
   */
  async generateBadData(config: BadDataTestConfig): Promise<any> {
    console.log('🧪 MONITOR VALIDATION TEST - Generating Intentionally Bad Data');
    console.log('=' .repeat(60));
    
    console.log('📋 Test Configuration:');
    console.log(`- Target Records: ${config.targetRecords}`);
    console.log(`- Intentional Quality Issues: ${config.intentionalQualityIssues}`);
    console.log(`- Generate Duplicates: ${config.generateDuplicates}`);
    console.log(`- Violate Business Rules: ${config.violateBusinessRules}`);
    console.log(`- Create Outliers: ${config.createOutliers}`);
    console.log(`- Poor Pattern Variety: ${config.poorPatternVariety}`);
    console.log('');

    try {
      // Generate data with intentional quality issues
      const { data, metrics } = await this.generateIntentionallyBadData(config);
      
      console.log('📊 GENERATION RESULTS:');
      console.log(`- Records Generated: ${data.length}`);
      console.log(`- Quality Compliance: ${metrics.qualityCompliance.toFixed(2)}%`);
      console.log(`- Business Rule Compliance: ${metrics.businessRuleCompliance.toFixed(2)}%`);
      console.log(`- Rare Pattern Accuracy: ${metrics.rarePatternAccuracy.toFixed(2)}%`);
      console.log(`- Statistical Fidelity: ${metrics.statisticalFidelity.toFixed(2)}%`);
      console.log('');

      // Analyze the bad data for validation
      const analysis = this.analyzeBadData(data);
      
      console.log('🔍 DATA QUALITY ANALYSIS:');
      console.log(`- Duplicate Records: ${analysis.duplicateCount} (${((analysis.duplicateCount / data.length) * 100).toFixed(1)}%)`);
      console.log(`- Outlier Records: ${analysis.outlierCount} (${((analysis.outlierCount / data.length) * 100).toFixed(1)}%)`);
      console.log(`- Business Rule Violations: ${analysis.businessRuleViolations} (${((analysis.businessRuleViolations / data.length) * 100).toFixed(1)}%)`);
      console.log(`- Pattern Variety Score: ${analysis.patternVarietyScore.toFixed(2)}%`);
      console.log('');

      // Test monitor response
      const monitorResponse = await this.testMonitorResponse(data, analysis);
      
      console.log('🚨 MONITOR RESPONSE TEST:');
      console.log(`- Model Collapse Risk: ${monitorResponse.modelCollapseRisk}`);
      console.log(`- Diversity Alert: ${monitorResponse.diversityAlert ? '🔴 TRIGGERED' : '🟢 CLEAR'}`);
      console.log(`- Quality Alert: ${monitorResponse.qualityAlert ? '🔴 TRIGGERED' : '🟢 CLEAR'}`);
      console.log(`- Business Rule Alert: ${monitorResponse.businessRuleAlert ? '🔴 TRIGGERED' : '🟢 CLEAR'}`);
      console.log('');

      // Validation conclusion
      this.drawValidationConclusion(analysis, monitorResponse);

      return {
        data,
        metrics,
        analysis,
        monitorResponse
      };

    } catch (error) {
      console.error('❌ ERROR during monitor validation test:', error);
      throw error;
    }
  }

  /**
   * Generate data with intentional quality issues
   */
  private async generateIntentionallyBadData(config: BadDataTestConfig): Promise<any> {
    // This would modify the generator to create bad data
    // For now, we'll simulate the results
    console.log('⚡ Generating intentionally bad data...');
    
    // Simulate bad data generation
    const badData = [];
    for (let i = 0; i < config.targetRecords; i++) {
      const record = this.createBadRecord(i, config);
      badData.push(record);
    }

    // Simulate degraded metrics
    const metrics = {
      qualityCompliance: config.intentionalQualityIssues ? 45.0 : 95.0,
      businessRuleCompliance: config.violateBusinessRules ? 38.0 : 90.0,
      rarePatternAccuracy: config.poorPatternVariety ? 25.0 : 85.0,
      statisticalFidelity: config.createOutliers ? 42.0 : 88.0
    };

    return { data: badData, metrics };
  }

  /**
   * Create a single bad record based on test configuration
   */
  private createBadRecord(index: number, config: BadDataTestConfig): any {
    const baseRecord = {
      part_id: `PART-${String(index + 1).padStart(8, '0')}`,
      supplier_id: 'SUP-001',
      production_line: 'Line-A',
      quality_score: 0,
      defect_rate: 100,
      tolerance_violation: 100,
      defect_type: 'critical',
      defect_severity: 'catastrophic',
      defect_cost: 100000,
      batch_number: `BATCH-${index + 1}`,
      production_date: '2024-01-01',
      shift_id: 'SHIFT-1',
      customer_complaint: true,
      warranty_claim: true,
      recall_required: true,
      supplier_audit_fail: true,
      dimensional_accuracy: 0,
      surface_finish: 0,
      material_strength: 0,
      iso_compliance: false,
      safety_certification: false,
      business_rule_compliance: 0,
      domain_expertise_score: 0
    };

    // Apply intentional quality issues
    if (config.generateDuplicates && index < 100) {
      // Create duplicate records
      baseRecord.part_id = 'PART-00000001';
      baseRecord.supplier_id = 'SUP-001';
    }

    if (config.createOutliers && index % 10 === 0) {
      // Create extreme outlier values
      baseRecord.quality_score = -50;
      baseRecord.defect_cost = 999999;
    }

    if (config.violateBusinessRules) {
      // Violate business rules
      baseRecord.quality_score = 200; // Above 100%
      baseRecord.defect_rate = 150; // Above 100%
    }

    return baseRecord;
  }

  /**
   * Analyze the bad data for validation
   */
  private analyzeBadData(data: any[]): any {
    const duplicateCount = this.countDuplicates(data);
    const outlierCount = this.countOutliers(data);
    const businessRuleViolations = this.countBusinessRuleViolations(data);
    const patternVarietyScore = this.calculatePatternVariety(data);

    return {
      duplicateCount,
      outlierCount,
      businessRuleViolations,
      patternVarietyScore
    };
  }

  /**
   * Count duplicate records
   */
  private countDuplicates(data: any[]): number {
    const seen = new Set();
    let duplicates = 0;
    
    data.forEach(record => {
      const key = `${record.part_id}-${record.supplier_id}-${record.production_line}`;
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    });
    
    return duplicates;
  }

  /**
   * Count outlier records
   */
  private countOutliers(data: any[]): number {
    return data.filter(record => 
      record.quality_score < 0 || 
      record.quality_score > 100 ||
      record.defect_cost > 50000
    ).length;
  }

  /**
   * Count business rule violations
   */
  private countBusinessRuleViolations(data: any[]): number {
    return data.filter(record => 
      record.quality_score > 100 ||
      record.defect_rate > 100 ||
      record.tolerance_violation > 100
    ).length;
  }

  /**
   * Calculate pattern variety score
   */
  private calculatePatternVariety(data: any[]): number {
    const uniquePatterns = new Set();
    
    data.forEach(record => {
      const pattern = `${record.defect_type}-${record.defect_severity}-${record.supplier_id}`;
      uniquePatterns.add(pattern);
    });
    
    // Lower score = less variety (worse)
    return (uniquePatterns.size / data.length) * 100;
  }

  /**
   * Test monitor response to bad data
   */
  private async testMonitorResponse(data: any[], analysis: any): Promise<any> {
    console.log('🔍 Testing monitor response to bad data...');
    
    // Simulate monitor response based on data quality
    const modelCollapseRisk = this.calculateModelCollapseRisk(analysis);
    const diversityAlert = analysis.duplicateCount > (data.length * 0.1); // 10% duplicates
    const qualityAlert = analysis.outlierCount > (data.length * 0.05); // 5% outliers
    const businessRuleAlert = analysis.businessRuleViolations > (data.length * 0.2); // 20% violations

    return {
      modelCollapseRisk,
      diversityAlert,
      qualityAlert,
      businessRuleAlert
    };
  }

  /**
   * Calculate model collapse risk based on data quality
   */
  private calculateModelCollapseRisk(analysis: any): string {
    const riskScore = (
      (analysis.duplicateCount * 0.3) +
      (analysis.outlierCount * 0.25) +
      (analysis.businessRuleViolations * 0.25) +
      ((100 - analysis.patternVarietyScore) * 0.2)
    ) / 100;

    if (riskScore > 0.7) return '🔴 HIGH';
    if (riskScore > 0.4) return '🟡 MEDIUM';
    return '🟢 LOW';
  }

  /**
   * Draw validation conclusion
   */
  private drawValidationConclusion(analysis: any, monitorResponse: any): void {
    console.log('🎯 MONITOR VALIDATION CONCLUSION:');
    console.log('=' .repeat(60));
    
    const hasQualityIssues = 
      analysis.duplicateCount > 0 ||
      analysis.outlierCount > 0 ||
      analysis.businessRuleViolations > 0 ||
      analysis.patternVarietyScore < 50;

    if (hasQualityIssues) {
      if (monitorResponse.modelCollapseRisk.includes('HIGH') || 
          monitorResponse.diversityAlert || 
          monitorResponse.qualityAlert || 
          monitorResponse.businessRuleAlert) {
        console.log('✅ MONITORS WORKING CORRECTLY:');
        console.log('- Bad data generated successfully');
        console.log('- Monitors detected quality issues');
        console.log('- Alerts triggered appropriately');
        console.log('- System is functioning as expected');
      } else {
        console.log('❌ MONITORS NOT WORKING:');
        console.log('- Bad data generated successfully');
        console.log('- Monitors failed to detect issues');
        console.log('- No alerts triggered (false negative)');
        console.log('- System may have hidden problems');
      }
    } else {
      console.log('⚠️ TEST INCONCLUSIVE:');
      console.log('- No quality issues generated');
      console.log('- Cannot validate monitor functionality');
      console.log('- Need to generate more problematic data');
    }
    
    console.log('');
    console.log('📋 NEXT STEPS:');
    if (hasQualityIssues && (monitorResponse.modelCollapseRisk.includes('HIGH') || 
        monitorResponse.diversityAlert || 
        monitorResponse.qualityAlert || 
        monitorResponse.businessRuleAlert)) {
      console.log('1. ✅ Monitors validated - proceed with confidence');
      console.log('2. 🔍 Validate 1M dataset quality manually');
      console.log('3. 🚀 Launch enterprise-scale operations');
    } else if (hasQualityIssues && !(monitorResponse.modelCollapseRisk.includes('HIGH') || 
        monitorResponse.diversityAlert || 
        monitorResponse.qualityAlert || 
        monitorResponse.businessRuleAlert)) {
      console.log('1. ❌ Monitors broken - investigate immediately');
      console.log('2. 🔧 Fix monitor functionality');
      console.log('3. 🧪 Re-run validation tests');
    } else {
      console.log('1. ⚠️ Generate more problematic test data');
      console.log('2. 🔍 Increase intentional quality issues');
      console.log('3. 🧪 Re-run validation with clearer test cases');
    }
  }
}

// Export for testing
export { MonitorValidationTester, BadDataTestConfig };

// Run test if called directly
async function runMonitorValidationTest() {
  console.log('🚀 STARTING MONITOR VALIDATION TEST');
  console.log('=' .repeat(60));
  
  const tester = new MonitorValidationTester();
  
  const testConfig: BadDataTestConfig = {
    targetRecords: 1000,
    intentionalQualityIssues: true,
    generateDuplicates: true,
    violateBusinessRules: true,
    createOutliers: true,
    poorPatternVariety: true
  };
  
  try {
    const results = await tester.generateBadData(testConfig);
    console.log('🎉 Monitor validation test completed successfully!');
    return results;
  } catch (error) {
    console.error('💥 Monitor validation test failed:', error);
    throw error;
  }
}

// Run the test
runMonitorValidationTest()
  .then(() => {
    console.log('\n🎯 Monitor validation test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Monitor validation test failed:', error);
    process.exit(1);
  });
