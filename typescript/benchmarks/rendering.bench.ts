/**
 * Rendering Performance Benchmarks
 *
 * Tests rendering performance with various actor counts
 */

import { SK8Stage } from '../src/graphics/SK8Stage.js';
import { SK8Actor } from '../src/graphics/SK8Actor.js';
import { ColorUtils } from '../src/graphics/types.js';
import { Rectangle } from '../src/actors/shapes.js';
import { performanceMonitor } from '../src/runtime/performance-monitor.js';

interface BenchmarkResult {
  name: string;
  actorCount: number;
  fps: number;
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  culledActors: number;
  renderedActors: number;
}

/**
 * Create a test canvas
 */
function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
}

/**
 * Create random actors
 */
function createActors(count: number): SK8Actor[] {
  const actors: SK8Actor[] = [];

  for (let i = 0; i < count; i++) {
    const rect = new Rectangle();
    rect.setLeft(Math.random() * 800);
    rect.setTop(Math.random() * 600);
    rect.setWidth(20 + Math.random() * 50);
    rect.setHeight(20 + Math.random() * 50);
    rect.setFillColor(ColorUtils.fromRGB(
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ));
    actors.push(rect);
  }

  return actors;
}

/**
 * Run rendering benchmark
 */
async function runRenderingBenchmark(
  actorCount: number,
  duration: number = 5000,
  useOptimizer: boolean = true
): Promise<BenchmarkResult> {
  const canvas = createCanvas();
  const stage = new SK8Stage(canvas, `Benchmark-${actorCount}`);

  // Configure optimizations
  stage.setUseRenderOptimizer(useOptimizer);

  // Create actors
  const actors = createActors(actorCount);
  actors.forEach((actor) => stage.addActor(actor));

  // Reset performance monitor
  performanceMonitor.reset();

  // Start rendering
  stage.startRendering();

  // Wait for duration
  await new Promise((resolve) => setTimeout(resolve, duration));

  // Stop rendering
  stage.stopRendering();

  // Get metrics
  const metrics = performanceMonitor.getMetrics();
  const renderStats = stage.getRenderStats();

  return {
    name: `Rendering ${actorCount} actors (optimizer: ${useOptimizer})`,
    actorCount,
    fps: metrics.fps,
    averageFrameTime: metrics.averageFrameTime,
    minFrameTime: metrics.minFrameTime,
    maxFrameTime: metrics.maxFrameTime,
    culledActors: renderStats.culledActors,
    renderedActors: renderStats.renderedActors,
  };
}

/**
 * Run all rendering benchmarks
 */
export async function runRenderingBenchmarks(): Promise<BenchmarkResult[]> {
  console.log('=== Rendering Benchmarks ===\n');

  const results: BenchmarkResult[] = [];
  const actorCounts = [10, 50, 100, 250, 500, 1000];

  for (const count of actorCounts) {
    console.log(`Testing ${count} actors...`);

    // With optimizer
    const resultWithOptimizer = await runRenderingBenchmark(count, 3000, true);
    results.push(resultWithOptimizer);
    console.log(`  With optimizer: ${resultWithOptimizer.fps} FPS`);

    // Without optimizer (for comparison)
    if (count <= 500) {
      // Skip large counts without optimizer
      const resultWithoutOptimizer = await runRenderingBenchmark(count, 3000, false);
      results.push(resultWithoutOptimizer);
      console.log(`  Without optimizer: ${resultWithoutOptimizer.fps} FPS`);
    }

    console.log('');
  }

  return results;
}

/**
 * Print benchmark results
 */
export function printResults(results: BenchmarkResult[]): void {
  console.log('\n=== Rendering Benchmark Results ===\n');
  console.log('Actor Count | FPS    | Avg Frame | Min Frame | Max Frame | Culled | Rendered');
  console.log('------------------------------------------------------------------------');

  for (const result of results) {
    console.log(
      `${result.actorCount.toString().padEnd(11)} | ` +
        `${result.fps.toString().padEnd(6)} | ` +
        `${result.averageFrameTime.toFixed(2).padEnd(9)} | ` +
        `${result.minFrameTime.toFixed(2).padEnd(9)} | ` +
        `${result.maxFrameTime.toFixed(2).padEnd(9)} | ` +
        `${result.culledActors.toString().padEnd(6)} | ` +
        `${result.renderedActors.toString().padEnd(8)}`
    );
  }

  console.log('');
}
