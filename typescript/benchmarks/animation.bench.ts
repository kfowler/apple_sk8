/**
 * Animation Performance Benchmarks
 *
 * Tests animation system performance with various animation counts
 */

import { animations, AnimationManager } from '../src/runtime/animation.js';
import { Rectangle } from '../src/actors/shapes.js';
import { performanceMonitor } from '../src/runtime/performance-monitor.js';

interface AnimationBenchmarkResult {
  name: string;
  animationCount: number;
  fps: number;
  averageFrameTime: number;
  poolStats: any;
}

/**
 * Run animation benchmark
 */
async function runAnimationBenchmark(
  animationCount: number,
  duration: number = 5000
): Promise<AnimationBenchmarkResult> {
  // Create targets
  const targets: Rectangle[] = [];
  for (let i = 0; i < animationCount; i++) {
    const rect = new Rectangle();
    rect.setLeft(Math.random() * 800);
    rect.setTop(Math.random() * 600);
    targets.push(rect);
  }

  // Reset performance monitor
  performanceMonitor.reset();

  // Start animations
  for (const target of targets) {
    animations.animate(target, 'left', Math.random() * 800, 1000);
    animations.animate(target, 'top', Math.random() * 600, 1000);
  }

  // Wait for duration
  const startTime = Date.now();
  while (Date.now() - startTime < duration) {
    await new Promise((resolve) => setTimeout(resolve, 16)); // ~60 FPS
    performanceMonitor.recordFrame();
  }

  // Get metrics
  const metrics = performanceMonitor.getMetrics();
  const poolStats = (animations as any).getPoolStats();

  // Clean up
  animations.cancelAll();

  return {
    name: `Animation ${animationCount} animations`,
    animationCount,
    fps: metrics.fps,
    averageFrameTime: metrics.averageFrameTime,
    poolStats,
  };
}

/**
 * Run all animation benchmarks
 */
export async function runAnimationBenchmarks(): Promise<AnimationBenchmarkResult[]> {
  console.log('=== Animation Benchmarks ===\n');

  const results: AnimationBenchmarkResult[] = [];
  const animationCounts = [10, 25, 50, 100, 200];

  for (const count of animationCounts) {
    console.log(`Testing ${count} animations...`);
    const result = await runAnimationBenchmark(count, 3000);
    results.push(result);
    console.log(`  FPS: ${result.fps}`);
    console.log(`  Pool reuse rate: ${(result.poolStats.reuseRate * 100).toFixed(2)}%`);
    console.log('');
  }

  return results;
}

/**
 * Print benchmark results
 */
export function printResults(results: AnimationBenchmarkResult[]): void {
  console.log('\n=== Animation Benchmark Results ===\n');
  console.log('Animation Count | FPS    | Avg Frame | Pool Reuse');
  console.log('----------------------------------------------------');

  for (const result of results) {
    console.log(
      `${result.animationCount.toString().padEnd(15)} | ` +
        `${result.fps.toString().padEnd(6)} | ` +
        `${result.averageFrameTime.toFixed(2).padEnd(9)} | ` +
        `${(result.poolStats.reuseRate * 100).toFixed(2)}%`
    );
  }

  console.log('');
}
