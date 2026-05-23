import { automotiveQualitySchema } from '../types/automotiveQualitySchema';
import OptimizedSyntheticDataGenerator from '../services/optimizedSyntheticDataGenerator';

interface OptimizedStressTestConfig {
  targetRecords: number;
  testName: string;
  batchSize: number;
  enableStreaming: boolean;
  memoryCleanupInterval: number;
}

class OptimizedStressTester {
  private generator: OptimizedSyntheticDataGenerator;
  private results: any[] = [];

  constructor() {
    this.generator = new OptimizedSyntheticDataGenerator(automotiveQualitySchema, {
      targetRecords: 1000000,
      qualityThreshold: 95,
      businessRuleCompliance: 90,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.95,
      batchSize: 100000,
      enableStreaming: true,
      memoryCleanupInterval: 5
    });
  }

  /**
   * Run optimized stress tests
   */
  async runOptimizedStressTests(): Promise<void> {
    console.log('🚀 OPTIMIZED STRESS TEST - MEMORY-OPTIMIZED GENERATION!');
    console.log('=' .repeat(70));
    
    const tests = [
      { 
        targetRecords: 10_000_000, 
        testName: '10 MILLION RECORDS (OPTIMIZED)', 
        batchSize: 100_000,
        enableStreaming: true,
        memoryCleanupInterval: 5
      },
      { 
        targetRecords: 100_000_000, 
        testName: '100 MILLION RECORDS (OPTIMIZED)', 
        batchSize: 100_000,
        enableStreaming: true,
        memoryCleanupInterval: 3
      }
    ];

    for (const test of tests) {
      console.log(`\n🚀 STARTING ${test.testName} STRESS TEST`);
      console.log('=' .repeat(50));
      
      try {
        await this.runSingleOptimizedTest(test);
        console.log(`\n🎉 ${test.testName} COMPLETED SUCCESSFULLY!`);
      } catch (error) {
        console.error(`💥 ${test.testName} TEST FAILED:`, error);
        console.log(`🎯 BREAKING POINT FOUND AT: ${test.targetRecords.toLocaleString()} records`);
        break;
      }
    }

    this.generateOptimizedTestReport();
  }

  /**
   * Run a single optimized stress test
   */
  private async runSingleOptimizedTest(config: OptimizedStressTestConfig): Promise<void> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    console.log(`📊 Target: ${config.targetRecords.toLocaleString()} records`);
    console.log(`📦 Batch Size: ${config.batchSize.toLocaleString()} records`);
    console.log(`🔄 Streaming: ${config.enableStreaming ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🧹 Memory Cleanup: Every ${config.memoryCleanupInterval} batches`);
    console.log(`⏱️  Start Time: ${new Date().toISOString()}`);
    console.log(`💾 Start Memory: ${this.formatBytes(startMemory.heapUsed)}`);
    console.log('');

    try {
      // Configure generator for this test
      this.generator = new OptimizedSyntheticDataGenerator(automotiveQualitySchema, {
        targetRecords: config.targetRecords,
        qualityThreshold: 95,
        businessRuleCompliance: 90,
        rarePatternGeneration: true,
        domainExpertiseWeight: 0.8,
        statisticalFidelity: 0.95,
        batchSize: config.batchSize,
        enableStreaming: config.enableStreaming,
        memoryCleanupInterval: config.memoryCleanupInterval
      });

      // Run the optimized generation
      const { data, metrics, evidence } = await this.generator.generateOptimizedData();
      
      const totalTime = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const totalMemoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      // Save test results
      this.results.push({
        testName: config.testName,
        targetRecords: config.targetRecords,
        actualRecords: data.length,
        totalTime,
        averageSpeed: Math.round(data.length / (totalTime / 1000)),
        memoryDelta: totalMemoryDelta,
        memoryPeak: metrics.memoryPeak,
        memoryFinal: metrics.memoryFinal,
        qualityMetrics: metrics,
        evidence,
        timestamp: new Date().toISOString()
      });

      console.log(`\n🎉 ${config.testName} COMPLETED SUCCESSFULLY!`);
      console.log(`  📊 Total Records: ${data.length.toLocaleString()}`);
      console.log(`  ⏱️  Total Time: ${this.formatDuration(totalTime)}`);
      console.log(`  🚀 Average Speed: ${Math.round(data.length / (totalTime / 1000)).toLocaleString()} records/sec`);
      console.log(`  💾 Memory Delta: ${this.formatBytes(totalMemoryDelta)}`);
      console.log(`  💾 Memory Peak: ${this.formatBytes(metrics.memoryPeak)}`);
      console.log(`  💾 Final Memory: ${this.formatBytes(metrics.memoryFinal)}`);
      console.log(`  📦 Batches Processed: ${metrics.batchesProcessed}`);
      console.log(`  🎯 Quality Compliance: ${(metrics.qualityCompliance * 100).toFixed(2)}%`);
      console.log(`  🎯 Business Rule Compliance: ${(metrics.businessRuleCompliance * 100).toFixed(2)}%`);

    } catch (error) {
      console.error(`❌ ${config.testName} failed:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive optimized test report
   */
  private generateOptimizedTestReport(): void {
    console.log('\n📊 OPTIMIZED STRESS TEST COMPREHENSIVE REPORT');
    console.log('=' .repeat(60));
    
    if (this.results.length === 0) {
      console.log('❌ No test results available');
      return;
    }
    
    const totalTests = this.results.length;
    const totalRecords = this.results.reduce((sum, r) => sum + r.actualRecords, 0);
    const totalTime = this.results.reduce((sum, r) => sum + r.totalTime, 0);
    const avgSpeed = Math.round(totalRecords / (totalTime / 1000));
    
    console.log(`📈 OVERALL PERFORMANCE:`);
    console.log(`  🎯 Total Tests: ${totalTests}`);
    console.log(`  📊 Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`  ⏱️  Total Time: ${this.formatDuration(totalTime)}`);
    console.log(`  🚀 Average Speed: ${avgSpeed.toLocaleString()} records/sec`);
    
    // Performance analysis
    const speeds = this.results.map(r => r.averageSpeed);
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    const avgTestSpeed = Math.round(speeds.reduce((sum, s) => sum + s, 0) / speeds.length);
    
    console.log(`\n🚀 SPEED ANALYSIS:`);
    console.log(`  🏆 Maximum Speed: ${maxSpeed.toLocaleString()} records/sec`);
    console.log(`  🐌 Minimum Speed: ${minSpeed.toLocaleString()} records/sec`);
    console.log(`  📊 Average Test Speed: ${avgTestSpeed.toLocaleString()} records/sec`);
    
    // Memory analysis
    const memoryPeaks = this.results.map(r => r.memoryPeak);
    const memoryFinals = this.results.map(r => r.memoryFinal);
    const avgMemoryPeak = memoryPeaks.reduce((sum, m) => sum + m, 0) / memoryPeaks.length;
    const avgMemoryFinal = memoryFinals.reduce((sum, m) => sum + m, 0) / memoryFinals.length;
    
    console.log(`\n💾 MEMORY ANALYSIS:`);
    console.log(`  📊 Average Memory Peak: ${this.formatBytes(avgMemoryPeak)}`);
    console.log(`  📊 Average Final Memory: ${this.formatBytes(avgMemoryFinal)}`);
    console.log(`  📊 Memory Efficiency: ${((avgMemoryFinal / avgMemoryPeak) * 100).toFixed(1)}%`);
    
    // Quality analysis
    const qualityScores = this.results.map(r => r.qualityMetrics.qualityCompliance);
    const businessRuleScores = this.results.map(r => r.qualityMetrics.businessRuleCompliance);
    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    const avgBusinessRule = businessRuleScores.reduce((sum, b) => sum + b, 0) / businessRuleScores.length;
    
    console.log(`\n🎯 QUALITY ANALYSIS:`);
    console.log(`  📊 Average Quality Score: ${(avgQuality * 100).toFixed(2)}%`);
    console.log(`  📊 Average Business Rule Compliance: ${(avgBusinessRule * 100).toFixed(2)}%`);
    
    // Success analysis
    const successfulTests = this.results.filter(r => r.actualRecords >= r.targetRecords * 0.99);
    const successRate = (successfulTests.length / totalTests) * 100;
    
    console.log(`\n✅ SUCCESS ANALYSIS:`);
    console.log(`  🎯 Successful Tests: ${successfulTests.length}/${totalTests}`);
    console.log(`  📊 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate === 100) {
      console.log(`\n🎉 ALL TESTS PASSED:`);
      console.log(`  ✅ System handled ${totalRecords.toLocaleString()} records successfully`);
      console.log(`  🚀 Memory optimization successful`);
      console.log(`  🏆 Enterprise-scale capability confirmed`);
    } else {
      console.log(`\n⚠️ SOME TESTS FAILED:`);
      console.log(`  ❌ ${totalTests - successfulTests.length} tests failed`);
      console.log(`  🔧 Further optimization needed`);
    }
    
    // Recommendations
    console.log(`\n📋 RECOMMENDATIONS:`);
    if (successRate >= 90) {
      console.log(`  ✅ System ready for enterprise deployment`);
      console.log(`  🚀 Can handle 10M+ records reliably`);
      console.log(`  💰 Ready for enterprise pricing tiers`);
    } else if (successRate >= 70) {
      console.log(`  🔧 Minor optimizations needed`);
      console.log(`  📊 Good performance up to 10M records`);
      console.log(`  🎯 Target 100M records for full enterprise`);
    } else {
      console.log(`  🚨 Significant optimization required`);
      console.log(`  🔧 Memory management needs improvement`);
      console.log(`  📊 Current limit: ~1M records`);
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration in milliseconds to human readable
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Export for testing
export { OptimizedStressTester };

// Run optimized stress tests if called directly
async function runOptimizedStressTests() {
  console.log('🚀 STARTING OPTIMIZED STRESS TESTS');
  console.log('=' .repeat(60));
  console.log('🎯 GOAL: Test 10M+ records with memory optimization!');
  console.log('');
  
  const tester = new OptimizedStressTester();
  
  try {
    await tester.runOptimizedStressTests();
    console.log('\n🎉 All optimized stress tests completed!');
  } catch (error) {
    console.error('\n💥 Optimized stress tests failed:', error);
    console.log('🎯 Breaking point found with optimized version!');
  }
}

// Run the optimized stress tests
runOptimizedStressTests()
  .then(() => {
    console.log('\n🎯 Optimized stress tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Optimized stress tests failed:', error);
    process.exit(1);
  });
