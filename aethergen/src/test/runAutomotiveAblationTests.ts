import { runRecipeLocally, summarizeAblationResults } from '../services/ablationService';
import { automotiveQualitySchema } from '../types/automotiveQualitySchema';
import EnhancedSyntheticDataGenerator from '../services/enhancedSyntheticDataGenerator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatible path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load our ablation recipe
const ABLATION_RECIPE_PATH = path.join(__dirname, '../../docs/ABLATION_RECIPES_AUTOMOTIVE_QUALITY.json');

async function runAutomotiveAblationTests() {
  console.log('🚗 AUTOMOTIVE QUALITY ABLATION TESTING 🚗');
  console.log('🔬 Diagnosing Model Collapse Risk...\n');

  try {
    // Step 1: Load the ablation recipe
    console.log('📋 Loading ablation recipe...');
    const recipeData = fs.readFileSync(ABLATION_RECIPE_PATH, 'utf8');
    const recipe = JSON.parse(recipeData);
    console.log(`✅ Loaded recipe with ${recipe.ablations.length} test configurations\n`);

    // Step 2: Generate test data using our enhanced generator
    console.log('⚡ Generating test data for ablation testing...');
    const generator = new EnhancedSyntheticDataGenerator(automotiveQualitySchema, {
      targetRecords: 1000, // Smaller batch for testing
      qualityThreshold: 95, // Percentage, not decimal
      businessRuleCompliance: 90, // Required field
      rarePatternGeneration: true, // Required field
      domainExpertiseWeight: 0.8, // Required field
      statisticalFidelity: 0.95 // Required field
    });

    const { data: testData, metrics: generationMetrics } = await generator.generateEnhancedData();
    console.log(`✅ Generated ${testData.length} test records`);
    console.log(`📊 Generation Quality: ${generationMetrics.qualityCompliance.toFixed(2)}%`);
    console.log(`⚡ Generation Speed: ${(testData.length / generationMetrics.generationTime).toFixed(0)} records/sec\n`);

    // Step 3: Run all ablation tests
    console.log('🧪 Running ablation tests...');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    const ablationResults = await runRecipeLocally(recipe, testData, automotiveQualitySchema);
    const totalTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Completed ${ablationResults.length} ablation tests in ${totalTime.toFixed(2)}s\n`);

    // Step 4: Analyze results
    console.log('📊 ABLATION TEST RESULTS ANALYSIS');
    console.log('=' .repeat(60));

    const summary = summarizeAblationResults(ablationResults);
    
    // Display results for each ablation
    for (const [ablationName, metrics] of Object.entries(summary)) {
      console.log(`\n🔍 ${ablationName.toUpperCase()}`);
      console.log('-'.repeat(ablationName.length + 2));
      
      if (metrics.__flags) {
        console.log(`🚩 Active Modules: ${metrics.__flags.join(', ')}`);
      }
      
      // Display key metrics
      const keyMetrics = ['accuracy', 'privacyScore', 'utilityScore', 'generationSpeed', 'modelCollapseRisk', 'dataQualityScore'];
      for (const metric of keyMetrics) {
        if (metrics[metric] !== undefined) {
          const value = metrics[metric];
          const emoji = metric === 'modelCollapseRisk' ? (value > 0.7 ? '🔴' : value > 0.4 ? '🟡' : '🟢') : '📊';
          console.log(`${emoji} ${metric}: ${value.toFixed(4)}`);
        }
      }
    }

    // Step 5: Identify critical issues
    console.log('\n🚨 CRITICAL ISSUE ANALYSIS');
    console.log('=' .repeat(60));
    
    let hasModelCollapseRisk = false;
    let bestConfiguration = '';
    let bestScore = 0;

    for (const [ablationName, metrics] of Object.entries(summary)) {
      if (metrics.modelCollapseRisk !== undefined) {
        if (metrics.modelCollapseRisk > 0.7) {
          hasModelCollapseRisk = true;
          console.log(`🔴 HIGH RISK: ${ablationName} - Model Collapse Risk: ${(metrics.modelCollapseRisk * 100).toFixed(1)}%`);
        }
        
        // Track best configuration
        const overallScore = (metrics.accuracy || 0) + (metrics.dataQualityScore || 0) - (metrics.modelCollapseRisk || 0);
        if (overallScore > bestScore) {
          bestScore = overallScore;
          bestConfiguration = ablationName;
        }
      }
    }

    if (!hasModelCollapseRisk) {
      console.log('🟢 No critical model collapse risk detected in any configuration');
    }

    if (bestConfiguration) {
      console.log(`\n🏆 BEST CONFIGURATION: ${bestConfiguration}`);
      console.log(`📈 Overall Score: ${bestScore.toFixed(4)}`);
    }

    // Step 6: Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    if (hasModelCollapseRisk) {
      console.log('🔴 IMMEDIATE ACTIONS REQUIRED:');
      console.log('1. Investigate high-risk module combinations');
      console.log('2. Test with larger datasets to confirm scale issues');
      console.log('3. Optimize module parameters for stability');
      console.log('4. Consider reducing innovation module complexity');
    } else {
      console.log('🟢 SYSTEM APPEARS STABLE:');
      console.log('1. Proceed with confidence testing');
      console.log('2. Test with larger datasets (10K+ records)');
      console.log('3. Monitor for degradation over time');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run scale testing with 10K+ records');
    console.log('2. Monitor quality degradation curves');
    console.log('3. Optimize module combinations based on results');
    console.log('4. Generate evidence bundles for enterprise clients');

    // Step 7: Save detailed results
    const resultsPath = path.join(__dirname, '../../docs/automotive_ablation_results.json');
    const detailedResults = {
      timestamp: new Date().toISOString(),
      recipe: recipe,
      testData: {
        count: testData.length,
        generationMetrics: generationMetrics
      },
      ablationResults: ablationResults,
      summary: summary,
      analysis: {
        hasModelCollapseRisk,
        bestConfiguration,
        bestScore,
        totalTestTime: totalTime
      }
    };

    fs.writeFileSync(resultsPath, JSON.stringify(detailedResults, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);

  } catch (error) {
    console.error('❌ ERROR during ablation testing:', error);
    throw error;
  }
}

// Run the tests
runAutomotiveAblationTests()
  .then(() => {
    console.log('\n🎉 Automotive ablation testing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Ablation testing failed:', error);
    process.exit(1);
  });

export { runAutomotiveAblationTests };
