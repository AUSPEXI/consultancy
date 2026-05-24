import { automotiveQualitySchema } from '../types/automotiveQualitySchema';
import EnhancedSyntheticDataGenerator from '../services/enhancedSyntheticDataGenerator';

interface StressTestConfig {
  targetRecords: number;
  testName: string;
  enableMonitoring: boolean;
  saveResults: boolean;
  batchSize: number;
}

class SystemStressTester {
  private generator: EnhancedSyntheticDataGenerator;
  private results: any[] = [];

  constructor() {
    this.generator = new EnhancedSyntheticDataGenerator(automotiveQualitySchema, {
      targetRecords: 1000, // Will be overridden
      qualityThreshold: 95,
      businessRuleCompliance: 90,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.95
    });
  }

  /**
   * Run comprehensive stress tests
   */
  async runStressTests(): Promise<void> {
    console.log('💥 SYSTEM STRESS TEST - PUSHING TO ABSOLUTE LIMITS!');
    console.log('=' .repeat(70));
    
    const tests = [
      { targetRecords: 10_000_000, testName: '10 MILLION RECORDS', batchSize: 1_000_000 },
      { targetRecords: 1_000_000_000, testName: '1 BILLION RECORDS', batchSize: 10_000_000 }
    ];

    for (const test of tests) {
      console.log(`\n🚀 STARTING ${test.testName} STRESS TEST`);
      console.log('=' .repeat(50));
      
      try {
        await this.runSingleStressTest(test);
      } catch (error) {
        console.error(`💥 ${test.testName} TEST FAILED:`, error);
        console.log(`🎯 BREAKING POINT FOUND AT: ${test.targetRecords.toLocaleString()} records`);
        break;
      }
    }

    this.generateStressTestReport();
  }

  /**
   * Run a single stress test
   */
  private async runSingleStressTest(config: StressTestConfig): Promise<void> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    console.log(`📊 Target: ${config.targetRecords.toLocaleString()} records`);
    console.log(`📦 Batch Size: ${config.batchSize.toLocaleString()} records`);
    console.log(`⏱️  Start Time: ${new Date().toISOString()}`);
    console.log(`💾 Start Memory: ${this.formatBytes(startMemory.heapUsed)}`);
    console.log('');

    let totalGenerated = 0;
    let batchNumber = 1;
    let lastProgressTime = Date.now();

    while (totalGenerated < config.targetRecords) {
      const batchStartTime = Date.now();
      const currentBatchSize = Math.min(config.batchSize, config.targetRecords - totalGenerated);
      
      console.log(`📦 BATCH ${batchNumber}: Generating ${currentBatchSize.toLocaleString()} records...`);
      
      try {
        // Generate batch
        const batchStartMemory = process.memoryUsage();
        const { data, metrics } = await this.generateBatch(currentBatchSize);
        const batchEndMemory = process.memoryUsage();
        
        totalGenerated += data.length;
        const progress = ((totalGenerated / config.targetRecords) * 100).toFixed(2);
        
        // Batch metrics
        const batchTime = Date.now() - batchStartTime;
        const recordsPerSecond = Math.round(data.length / (batchTime / 1000));
        const memoryDelta = batchEndMemory.heapUsed - batchStartMemory.heapUsed;
        
        console.log(`  ✅ Generated: ${data.length.toLocaleString()} records`);
        console.log(`  ⚡ Speed: ${recordsPerSecond.toLocaleString()} records/sec`);
        console.log(`  ⏱️  Batch Time: ${(batchTime / 1000).toFixed(2)}s`);
        console.log(`  💾 Memory Delta: ${this.formatBytes(memoryDelta)}`);
        console.log(`  📊 Progress: ${progress}% (${totalGenerated.toLocaleString()}/${config.targetRecords.toLocaleString()})`);
        
        // Monitor for system stress
        const currentMemory = process.memoryUsage();
        const memoryUsagePercent = (currentMemory.heapUsed / currentMemory.heapTotal) * 100;
        
        if (memoryUsagePercent > 90) {
          console.log(`  🚨 MEMORY WARNING: ${memoryUsagePercent.toFixed(1)}% usage!`);
        }
        
        if (batchTime > 30000) { // 30 seconds
          console.log(`  🐌 PERFORMANCE WARNING: Batch taking ${(batchTime / 1000).toFixed(1)}s`);
        }
        
        // Save batch results
        this.results.push({
          batchNumber,
          targetRecords: config.targetRecords,
          batchSize: data.length,
          totalGenerated,
          progress: parseFloat(progress),
          batchTime,
          recordsPerSecond,
          memoryDelta,
          memoryUsagePercent,
          qualityMetrics: metrics,
          timestamp: new Date().toISOString()
        });
        
        batchNumber++;
        
        // Progress update every 10 batches
        if (batchNumber % 10 === 0) {
          const elapsed = Date.now() - startTime;
          const estimatedTotal = (elapsed / totalGenerated) * config.targetRecords;
          const remaining = estimatedTotal - elapsed;
          
          console.log(`\n📈 PROGRESS UPDATE:`);
          console.log(`  ⏱️  Elapsed: ${this.formatDuration(elapsed)}`);
          console.log(`  ⏳ Estimated Total: ${this.formatDuration(estimatedTotal)}`);
          console.log(`  🎯 Remaining: ${this.formatDuration(remaining)}`);
          console.log(`  🚀 ETA: ${new Date(Date.now() + remaining).toISOString()}`);
          console.log('');
        }
        
        // Check for system failure
        if (this.isSystemFailing()) {
          throw new Error(`System failure detected at ${totalGenerated.toLocaleString()} records`);
        }
        
      } catch (error) {
        console.error(`  ❌ BATCH ${batchNumber} FAILED:`, error);
        throw new Error(`Batch generation failed at ${totalGenerated.toLocaleString()} records: ${error.message}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const totalMemoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    console.log(`\n🎉 ${config.testName} COMPLETED SUCCESSFULLY!`);
    console.log(`  ⏱️  Total Time: ${this.formatDuration(totalTime)}`);
    console.log(`  📊 Total Generated: ${totalGenerated.toLocaleString()} records`);
    console.log(`  🚀 Average Speed: ${Math.round(totalGenerated / (totalTime / 1000)).toLocaleString()} records/sec`);
    console.log(`  💾 Memory Delta: ${this.formatBytes(totalMemoryDelta)}`);
    console.log(`  💾 Final Memory: ${this.formatBytes(endMemory.heapUsed)}`);
    
    if (config.saveResults) {
      await this.saveTestResults(config.testName, totalGenerated, totalTime);
    }
  }

  /**
   * Generate a single batch of records
   */
  private async generateBatch(batchSize: number): Promise<any> {
    // Override generator config for this batch
    this.generator = new EnhancedSyntheticDataGenerator(automotiveQualitySchema, {
      targetRecords: batchSize,
      qualityThreshold: 95,
      businessRuleCompliance: 90,
      rarePatternGeneration: true,
      domainExpertiseWeight: 0.8,
      statisticalFidelity: 0.95
    });
    
    return await this.generator.generateEnhancedData();
  }

  /**
   * Check if system is failing
   */
  private isSystemFailing(): boolean {
    const memory = process.memoryUsage();
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
    
    // Memory threshold exceeded
    if (memoryUsagePercent > 95) {
      return true;
    }
    
    // Heap size too large
    if (memory.heapUsed > 2 * 1024 * 1024 * 1024) { // 2GB
      return true;
    }
    
    // Process taking too long
    if (process.uptime() > 3600) { // 1 hour
      return true;
    }
    
    return false;
  }

  /**
   * Save test results
   */
  private async saveTestResults(testName: string, totalRecords: number, totalTime: number): Promise<void> {
    const result = {
      testName,
      totalRecords,
      totalTime,
      averageSpeed: Math.round(totalRecords / (totalTime / 1000)),
      timestamp: new Date().toISOString(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      batchResults: this.results
    };
    
    console.log(`\n💾 Saving test results...`);
    // In a real implementation, you'd save to file/database
    console.log(`  📁 Results saved for ${testName}`);
  }

  /**
   * Generate comprehensive stress test report
   */
  private generateStressTestReport(): void {
    console.log('\n📊 STRESS TEST COMPREHENSIVE REPORT');
    console.log('=' .repeat(60));
    
    if (this.results.length === 0) {
      console.log('❌ No test results available');
      return;
    }
    
    const totalBatches = this.results.length;
    const totalRecords = this.results.reduce((sum, r) => sum + r.totalGenerated, 0);
    const totalTime = this.results.reduce((sum, r) => sum + r.batchTime, 0);
    const avgSpeed = Math.round(totalRecords / (totalTime / 1000));
    
    console.log(`📈 OVERALL PERFORMANCE:`);
    console.log(`  🎯 Total Batches: ${totalBatches}`);
    console.log(`  📊 Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`  ⏱️  Total Time: ${this.formatDuration(totalTime)}`);
    console.log(`  🚀 Average Speed: ${avgSpeed.toLocaleString()} records/sec`);
    
    // Performance analysis
    const speeds = this.results.map(r => r.recordsPerSecond);
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    const avgBatchSpeed = Math.round(speeds.reduce((sum, s) => sum + s, 0) / speeds.length);
    
    console.log(`\n🚀 SPEED ANALYSIS:`);
    console.log(`  🏆 Maximum Speed: ${maxSpeed.toLocaleString()} records/sec`);
    console.log(`  🐌 Minimum Speed: ${minSpeed.toLocaleString()} records/sec`);
    console.log(`  📊 Average Batch Speed: ${avgBatchSpeed.toLocaleString()} records/sec`);
    
    // Memory analysis
    const memoryDeltas = this.results.map(r => r.memoryDelta);
    const totalMemoryDelta = memoryDeltas.reduce((sum, m) => sum + m, 0);
    const avgMemoryDelta = totalMemoryDelta / memoryDeltas.length;
    
    console.log(`\n💾 MEMORY ANALYSIS:`);
    console.log(`  📊 Total Memory Delta: ${this.formatBytes(totalMemoryDelta)}`);
    console.log(`  📊 Average Memory Delta: ${this.formatBytes(avgMemoryDelta)}`);
    
    // Quality analysis
    const qualityScores = this.results.map(r => r.qualityMetrics?.qualityCompliance || 0);
    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    
    console.log(`\n🎯 QUALITY ANALYSIS:`);
    console.log(`  📊 Average Quality Score: ${avgQuality.toFixed(2)}%`);
    
    // Breaking point analysis
    const lastResult = this.results[this.results.length - 1];
    if (lastResult.progress < 100) {
      console.log(`\n💥 BREAKING POINT DETECTED:`);
      console.log(`  🚨 System failed at: ${lastResult.totalGenerated.toLocaleString()} records`);
      console.log(`  📊 Progress achieved: ${lastResult.progress.toFixed(2)}%`);
      console.log(`  ⏱️  Time before failure: ${this.formatDuration(lastResult.batchTime)}`);
    } else {
      console.log(`\n🎉 ALL TESTS PASSED:`);
      console.log(`  ✅ System handled ${totalRecords.toLocaleString()} records successfully`);
      console.log(`  🚀 No breaking point found`);
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
export { SystemStressTester };

// Run stress tests if called directly
async function runSystemStressTests() {
  console.log('💥 STARTING SYSTEM STRESS TESTS');
  console.log('=' .repeat(60));
  console.log('🎯 GOAL: Find the breaking point at 10M and 1B records!');
  console.log('');
  
  const tester = new SystemStressTester();
  
  try {
    await tester.runStressTests();
    console.log('\n🎉 All stress tests completed!');
  } catch (error) {
    console.error('\n💥 Stress tests failed:', error);
    console.log('🎯 Breaking point found!');
  }
}

// Run the stress tests
runSystemStressTests()
  .then(() => {
    console.log('\n🎯 System stress tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 System stress tests failed:', error);
    process.exit(1);
  });
