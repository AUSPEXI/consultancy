// Ablation Test Runner for Automotive Quality System
import AutomotiveAblationTester from './automotiveAblationTests';
import { automotiveQualitySchema } from '../types/automotiveQualitySchema';

async function runAblationTests() {
  try {
    console.log('🚀 Starting Automotive Quality Ablation Testing...');
    console.log('==================================================');
    console.log('');
    
    // Initialize ablation tester
    const tester = new AutomotiveAblationTester(automotiveQualitySchema);
    
    // Run all ablation tests
    console.log('🧪 Running 8 different ablation test configurations...');
    console.log('   This will systematically test each component\'s contribution');
    console.log('');
    
    const results = await tester.runAllAblationTests();
    
    console.log('✅ All ablation tests completed!');
    console.log('================================');
    console.log('');
    
    // Generate comprehensive analysis report
    tester.generateAnalysisReport();
    
    console.log('🎯 Ablation testing complete!');
    console.log('   We now understand what drives our success!');
    
    return results;
    
  } catch (error) {
    console.error('❌ Ablation testing failed:', error);
    throw error;
  }
}

// Run the ablation tests
runAblationTests()
  .then(() => {
    console.log('✅ Ablation testing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ablation testing failed:', error);
    process.exit(1);
  });
