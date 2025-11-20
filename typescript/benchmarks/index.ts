/**
 * Main Benchmark Runner
 *
 * Runs all performance benchmarks and generates a report
 */

import {
  runRenderingBenchmarks,
  printResults as printRenderingResults,
} from './rendering.bench.js';
import {
  runAnimationBenchmarks,
  printResults as printAnimationResults,
} from './animation.bench.js';
import {
  runSK8ScriptBenchmarks,
  printResults as printSK8ScriptResults,
} from './sk8script.bench.js';

/**
 * Run all benchmarks
 */
async function runAllBenchmarks(): Promise<void> {
  console.log('========================================');
  console.log('   SK8 TypeScript Performance Benchmarks');
  console.log('========================================\n');

  try {
    // SK8Script benchmarks (synchronous, quick)
    const sk8scriptResults = runSK8ScriptBenchmarks();
    printSK8ScriptResults(sk8scriptResults);

    // Animation benchmarks
    const animationResults = await runAnimationBenchmarks();
    printAnimationResults(animationResults);

    // Rendering benchmarks (slowest)
    const renderingResults = await runRenderingBenchmarks();
    printRenderingResults(renderingResults);

    console.log('\n========================================');
    console.log('   Benchmarks Complete!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Benchmark error:', error);
    process.exit(1);
  }
}

// Run benchmarks if executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runAllBenchmarks().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  // Browser environment
  console.log('SK8 Benchmarks loaded. Call runAllBenchmarks() to start.');
  (window as any).runAllBenchmarks = runAllBenchmarks;
}

export { runAllBenchmarks };
