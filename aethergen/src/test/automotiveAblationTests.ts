// Automotive Quality Ablation Testing Suite
// This systematically tests different components to understand their contribution to success

import EnhancedSyntheticDataGenerator from '../services/enhancedSyntheticDataGenerator';
import { automotiveQualitySchema } from '../types/automotiveQualitySchema';

export interface AblationTestConfig {
  name: string;
  description: string;
  config: {
    targetRecords: number;
    qualityThreshold: number;
    businessRuleCompliance: number;
    rarePatternGeneration: boolean;
    domainExpertiseWeight: number;
    statisticalFidelity: number;
  };
  disabledComponents?: string[];
  expectedImpact: string;
}

export interface AblationTestResult {
  testName: string;
  config: any;
  metrics: {
    totalRecords: number;
    qualityCompliance: number;
    businessRuleCompliance: number;
    rarePatternAccuracy: number;
    statisticalFidelity: number;
    generationTime: number;
  };
  performance: {
    recordsPerSecond: number;
    qualityVsSpeedRatio: number;
    memoryUsage?: number;
  };
  analysis: {
    qualityImpact: 'positive' | 'negative' | 'neutral';
    performanceImpact: 'positive' | 'negative' | 'neutral';
    businessValueImpact: 'positive' | 'negative' | 'neutral';
    recommendations: string[];
  };
}

export const ablationTestConfigs: AblationTestConfig[] = [
  // Baseline Test (Full System)
  {
    name: 'Baseline - Full System',
    description: 'Complete system with all components enabled',
    config: {
      targetRecords: 10000, // 10K for faster testing
      qualityThreshold: 85,
      businessRuleCompliance: 80,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.9
    },
    expectedImpact: 'Baseline performance and quality metrics'
  },
  
  // Business Rules Ablation
  {
    name: 'No Business Rules',
    description: 'System without business rule validation',
    config: {
      targetRecords: 10000,
      qualityThreshold: 85,
      businessRuleCompliance: 0, // Disable business rules
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.9
    },
    expectedImpact: 'Lower business rule compliance, potential quality degradation'
  },
  
  // Domain Expertise Ablation
  {
    name: 'No Domain Expertise',
    description: 'System without domain expertise integration',
    config: {
      targetRecords: 10000,
      qualityThreshold: 85,
      businessRuleCompliance: 80,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.0, // Disable domain expertise
      statisticalFidelity: 0.9
    },
    expectedImpact: 'Reduced domain-specific quality, generic patterns'
  },
  
  // Rare Pattern Generation Ablation
  {
    name: 'No Rare Patterns',
    description: 'System without rare pattern generation',
    config: {
      targetRecords: 10000,
      qualityThreshold: 85,
      businessRuleCompliance: 80,
      rarePatternGeneration: false, // Disable rare patterns
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.9
    },
    expectedImpact: 'Missing rare events, reduced realism'
  },
  
  // Statistical Fidelity Ablation
  {
    name: 'Low Statistical Fidelity',
    description: 'System with reduced statistical accuracy',
    config: {
      targetRecords: 10000,
      qualityThreshold: 85,
      businessRuleCompliance: 80,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.5 // Reduce statistical fidelity
    },
    expectedImpact: 'Less realistic distributions, potential quality issues'
  },
  
  // Quality Threshold Ablation
  {
    name: 'Lower Quality Threshold',
    description: 'System with relaxed quality standards',
    config: {
      targetRecords: 10000,
      qualityThreshold: 70, // Lower quality threshold
      businessRuleCompliance: 80,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.9
    },
    expectedImpact: 'Higher pass rate, lower quality data'
  },
  
  // High Performance Configuration
  {
    name: 'High Performance Mode',
    description: 'Optimized for speed over quality',
    config: {
      targetRecords: 10000,
      qualityThreshold: 80, // Slightly lower threshold
      businessRuleCompliance: 70, // Relaxed compliance
      rarePatternGeneration: false, // Disable for speed
      domainExpertiseWeight: 0.5, // Reduce complexity
      statisticalFidelity: 0.7 // Balance speed vs accuracy
    },
    expectedImpact: 'Faster generation, slightly lower quality'
  },
  
  // Ultra Quality Configuration
  {
    name: 'Ultra Quality Mode',
    description: 'Maximum quality with slower generation',
    config: {
      targetRecords: 10000,
      qualityThreshold: 95, // Very high threshold
      businessRuleCompliance: 95, // Very high compliance
      rarePatternGeneration: true,
      domainExpertiseWeight: 1.0, // Maximum domain expertise
      statisticalFidelity: 0.99 // Maximum statistical accuracy
    },
    expectedImpact: 'Highest quality, slower generation'
  }
];

export class AutomotiveAblationTester {
  private schema: any;
  private results: AblationTestResult[] = [];

  constructor(schema: any) {
    this.schema = schema;
  }

  /**
   * Run all ablation tests
   */
  async runAllAblationTests(): Promise<AblationTestResult[]> {
    console.log('🧪 AUTOMOTIVE QUALITY ABLATION TESTING SUITE 🧪');
    console.log('================================================');
    console.log('');
    
    for (const testConfig of ablationTestConfigs) {
      console.log(`🔄 Running: ${testConfig.name}`);
      console.log(`   Description: ${testConfig.description}`);
      console.log(`   Expected Impact: ${testConfig.expectedImpact}`);
      console.log('');
      
      const result = await this.runSingleAblationTest(testConfig);
      this.results.push(result);
      
      console.log(`✅ Completed: ${testConfig.name}`);
      console.log(`   Quality: ${result.metrics.qualityCompliance.toFixed(2)}%`);
      console.log(`   Compliance: ${result.metrics.businessRuleCompliance.toFixed(2)}%`);
      console.log(`   Speed: ${result.performance.recordsPerSecond.toFixed(0)} records/sec`);
      console.log(`   Quality Impact: ${result.analysis.qualityImpact}`);
      console.log('');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return this.results;
  }

  /**
   * Run a single ablation test
   */
  private async runSingleAblationTest(testConfig: AblationTestConfig): Promise<AblationTestResult> {
    const startTime = Date.now();
    
    try {
      // Create generator with test configuration
      const generator = new EnhancedSyntheticDataGenerator(this.schema, testConfig.config);
      
      // Generate data
      const result = await generator.generateEnhancedData();
      const totalTime = (Date.now() - startTime) / 1000;
      
      // Calculate performance metrics
      const recordsPerSecond = result.metrics.totalRecords / result.metrics.generationTime;
      const qualityVsSpeedRatio = result.metrics.qualityCompliance / recordsPerSecond * 1000;
      
      // Analyze impact
      const analysis = this.analyzeTestImpact(testConfig, result.metrics, recordsPerSecond);
      
      return {
        testName: testConfig.name,
        config: testConfig.config,
        metrics: result.metrics,
        performance: {
          recordsPerSecond,
          qualityVsSpeedRatio
        },
        analysis
      };
      
    } catch (error) {
      console.error(`❌ Ablation test failed: ${testConfig.name}`, error);
      
      // Return failed test result
      return {
        testName: testConfig.name,
        config: testConfig.config,
        metrics: {
          totalRecords: 0,
          qualityCompliance: 0,
          businessRuleCompliance: 0,
          rarePatternAccuracy: 0,
          statisticalFidelity: 0,
          generationTime: 0
        },
        performance: {
          recordsPerSecond: 0,
          qualityVsSpeedRatio: 0
        },
        analysis: {
          qualityImpact: 'negative',
          performanceImpact: 'negative',
          businessValueImpact: 'negative',
          recommendations: [`Test failed: ${error}`]
        }
      };
    }
  }

  /**
   * Analyze the impact of test configuration
   */
  private analyzeTestImpact(
    testConfig: AblationTestConfig,
    metrics: any,
    recordsPerSecond: number
  ): AblationTestResult['analysis'] {
    const recommendations: string[] = [];
    
    // Quality impact analysis
    let qualityImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (metrics.qualityCompliance >= 95) qualityImpact = 'positive';
    else if (metrics.qualityCompliance < 85) qualityImpact = 'negative';
    
    // Performance impact analysis
    let performanceImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (recordsPerSecond >= 50000) performanceImpact = 'positive';
    else if (recordsPerSecond < 30000) performanceImpact = 'negative';
    
    // Business value impact analysis
    let businessValueImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (metrics.businessRuleCompliance >= 90 && metrics.qualityCompliance >= 90) {
      businessValueImpact = 'positive';
    } else if (metrics.businessRuleCompliance < 70 || metrics.qualityCompliance < 80) {
      businessValueImpact = 'negative';
    }
    
    // Generate recommendations based on test results
    if (testConfig.name.includes('No Business Rules') && metrics.businessRuleCompliance < 50) {
      recommendations.push('Business rules are critical for quality - keep enabled');
    }
    
    if (testConfig.name.includes('No Domain Expertise') && metrics.qualityCompliance < 90) {
      recommendations.push('Domain expertise significantly improves quality - maintain high weight');
    }
    
    if (testConfig.name.includes('High Performance') && metrics.qualityCompliance < 85) {
      recommendations.push('Performance optimization reduces quality - balance needed');
    }
    
    if (testConfig.name.includes('Ultra Quality') && recordsPerSecond < 20000) {
      recommendations.push('Ultra quality mode significantly reduces speed - consider balanced approach');
    }
    
    if (metrics.rarePatternAccuracy < 80) {
      recommendations.push('Rare pattern generation improves data realism - keep enabled');
    }
    
    if (metrics.statisticalFidelity < 90) {
      recommendations.push('Statistical fidelity is important for data quality - maintain high values');
    }
    
    return {
      qualityImpact,
      performanceImpact,
      businessValueImpact,
      recommendations
    };
  }

  /**
   * Generate comprehensive analysis report
   */
  generateAnalysisReport(): string {
    console.log('📊 ABLATION TESTING ANALYSIS REPORT 📊');
    console.log('======================================');
    console.log('');
    
    // Find best performing configurations
    const bestQuality = this.results.reduce((best, current) => 
      current.metrics.qualityCompliance > best.metrics.qualityCompliance ? current : best
    );
    
    const bestPerformance = this.results.reduce((best, current) => 
      current.performance.recordsPerSecond > best.performance.recordsPerSecond ? current : best
    );
    
    const bestBusinessValue = this.results.reduce((best, current) => {
      const currentScore = current.metrics.qualityCompliance * current.metrics.businessRuleCompliance;
      const bestScore = best.metrics.qualityCompliance * best.metrics.businessRuleCompliance;
      return currentScore > bestScore ? current : best;
    });
    
    console.log('🏆 BEST PERFORMING CONFIGURATIONS:');
    console.log(`   Best Quality: ${bestQuality.testName} (${bestQuality.metrics.qualityCompliance.toFixed(2)}%)`);
    console.log(`   Best Performance: ${bestPerformance.testName} (${bestPerformance.performance.recordsPerSecond.toFixed(0)} records/sec)`);
    console.log(`   Best Business Value: ${bestBusinessValue.testName} (Quality: ${bestBusinessValue.metrics.qualityCompliance.toFixed(2)}%, Compliance: ${bestBusinessValue.metrics.businessRuleCompliance.toFixed(2)}%)`);
    console.log('');
    
    // Component impact analysis
    console.log('🔍 COMPONENT IMPACT ANALYSIS:');
    console.log('==============================');
    
    const businessRulesImpact = this.analyzeComponentImpact('Business Rules');
    const domainExpertiseImpact = this.analyzeComponentImpact('Domain Expertise');
    const rarePatternsImpact = this.analyzeComponentImpact('Rare Patterns');
    const statisticalFidelityImpact = this.analyzeComponentImpact('Statistical Fidelity');
    
    console.log(`   Business Rules: ${businessRulesImpact}`);
    console.log(`   Domain Expertise: ${domainExpertiseImpact}`);
    console.log(`   Rare Patterns: ${rarePatternsImpact}`);
    console.log(`   Statistical Fidelity: ${statisticalFidelityImpact}`);
    console.log('');
    
    // Optimization recommendations
    console.log('💡 OPTIMIZATION RECOMMENDATIONS:');
    console.log('=================================');
    
    const allRecommendations = this.results.flatMap(r => r.analysis.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    uniqueRecommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('');
    
    return 'Analysis complete';
  }

  /**
   * Analyze impact of specific component
   */
  private analyzeComponentImpact(componentName: string): string {
    const testsWithComponent = this.results.filter(r => 
      !r.testName.toLowerCase().includes(`no ${componentName.toLowerCase()}`) &&
      !r.testName.toLowerCase().includes(`low ${componentName.toLowerCase()}`)
    );
    
    const testsWithoutComponent = this.results.filter(r => 
      r.testName.toLowerCase().includes(`no ${componentName.toLowerCase()}`) ||
      r.testName.toLowerCase().includes(`low ${componentName.toLowerCase()}`)
    );
    
    if (testsWithComponent.length === 0 || testsWithoutComponent.length === 0) {
      return 'Insufficient data for analysis';
    }
    
    const avgQualityWith = testsWithComponent.reduce((sum, r) => sum + r.metrics.qualityCompliance, 0) / testsWithComponent.length;
    const avgQualityWithout = testsWithoutComponent.reduce((sum, r) => sum + r.metrics.qualityCompliance, 0) / testsWithoutComponent.length;
    
    const impact = avgQualityWith - avgQualityWithout;
    
    if (impact > 5) return `High Positive Impact (+${impact.toFixed(1)}%)`;
    if (impact > 2) return `Moderate Positive Impact (+${impact.toFixed(1)}%)`;
    if (impact > -2) return `Minimal Impact (${impact.toFixed(1)}%)`;
    if (impact > -5) return `Moderate Negative Impact (${impact.toFixed(1)}%)`;
    return `High Negative Impact (${impact.toFixed(1)}%)`;
  }
}

export default AutomotiveAblationTester;
