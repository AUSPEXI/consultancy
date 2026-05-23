// Full test runner for automotive quality test (100K records)
import { testAutomotiveQualityGeneration } from './automotiveQualityTest';

async function runFullTest() {
  try {
    console.log('🚀 Starting Full Automotive Quality Test (100K Records)...');
    await testAutomotiveQualityGeneration();
    console.log('✅ Full test completed successfully!');
  } catch (error) {
    console.error('❌ Full test failed:', error);
    process.exit(1);
  }
}

runFullTest();
