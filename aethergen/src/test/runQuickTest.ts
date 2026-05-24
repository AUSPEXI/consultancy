// Simple test runner for quick automotive test
import { quickTest } from './quickAutomotiveTest';

async function runTest() {
  try {
    console.log('🚀 Starting Quick Automotive Quality Test...');
    await quickTest();
    console.log('✅ Quick test completed successfully!');
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    process.exit(1);
  }
}

runTest();
