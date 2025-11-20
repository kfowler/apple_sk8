/**
 * Performance testing utilities
 * Provides benchmarking and performance measurement tools
 */

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  trackMemory?: boolean;
  minTime?: number; // Minimum time to run benchmark (ms)
}

/**
 * Runs a benchmark test
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 1000,
    warmupIterations = 10,
    trackMemory = false,
    minTime = 1000,
  } = options;

  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Measure memory before
  const memoryBefore = trackMemory && (performance as any).memory
    ? (performance as any).memory.usedJSHeapSize
    : undefined;

  // Run benchmark
  const times: number[] = [];
  let totalIterations = 0;
  const startTime = performance.now();

  while (totalIterations < iterations || performance.now() - startTime < minTime) {
    const iterStart = performance.now();
    await fn();
    const iterEnd = performance.now();
    times.push(iterEnd - iterStart);
    totalIterations++;
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;

  // Measure memory after
  const memoryAfter = trackMemory && (performance as any).memory
    ? (performance as any).memory.usedJSHeapSize
    : undefined;

  // Calculate statistics
  const minTime_result = Math.min(...times);
  const maxTime = Math.max(...times);
  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  const opsPerSecond = (totalIterations / totalTime) * 1000;

  return {
    name,
    iterations: totalIterations,
    totalTime,
    averageTime,
    minTime: minTime_result,
    maxTime,
    opsPerSecond,
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryBefore && memoryAfter ? memoryAfter - memoryBefore : undefined,
  };
}

/**
 * Runs multiple benchmarks and compares results
 */
export async function compareBenchmarks(
  benchmarks: Array<{ name: string; fn: () => void | Promise<void> }>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const { name, fn } of benchmarks) {
    const result = await benchmark(name, fn, options);
    results.push(result);
  }

  return results;
}

/**
 * Formats benchmark results as a table
 */
export function formatBenchmarkResults(results: BenchmarkResult[]): string {
  const rows = results.map((r) => [
    r.name,
    r.iterations.toString(),
    `${r.averageTime.toFixed(3)}ms`,
    `${r.minTime.toFixed(3)}ms`,
    `${r.maxTime.toFixed(3)}ms`,
    `${r.opsPerSecond.toFixed(0)} ops/s`,
  ]);

  const headers = ['Name', 'Iterations', 'Avg Time', 'Min Time', 'Max Time', 'Ops/Sec'];
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));

  const formatRow = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ');

  const separator = colWidths.map((w) => '-'.repeat(w)).join('-+-');

  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}

/**
 * Measures frame rate over a period of time
 */
export class FPSMeter {
  private frames = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private maxSamples = 60;

  start(): void {
    this.frames = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameTimes = [];
  }

  tick(): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
    this.lastFrameTime = now;
    this.frames++;
  }

  getFPS(): number {
    const elapsed = (performance.now() - this.startTime) / 1000;
    return this.frames / elapsed;
  }

  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return 1000 / avgFrameTime;
  }

  getMinFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const maxFrameTime = Math.max(...this.frameTimes);
    return 1000 / maxFrameTime;
  }

  getMaxFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const minFrameTime = Math.min(...this.frameTimes);
    return 1000 / minFrameTime;
  }

  getReport(): {
    frames: number;
    fps: number;
    avgFPS: number;
    minFPS: number;
    maxFPS: number;
  } {
    return {
      frames: this.frames,
      fps: this.getFPS(),
      avgFPS: this.getAverageFPS(),
      minFPS: this.getMinFPS(),
      maxFPS: this.getMaxFPS(),
    };
  }
}

/**
 * Measures memory usage
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ((performance as any).memory) {
    return {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Tracks memory leaks by checking heap growth
 */
export class MemoryLeakDetector {
  private baseline: number | null = null;
  private threshold: number;

  constructor(thresholdMB: number = 10) {
    this.threshold = thresholdMB * 1024 * 1024; // Convert to bytes
  }

  setBaseline(): void {
    const mem = getMemoryUsage();
    this.baseline = mem ? mem.usedJSHeapSize : null;
  }

  check(): { leaked: boolean; delta: number; percentage: number } {
    if (this.baseline === null) {
      throw new Error('Baseline not set. Call setBaseline() first.');
    }

    const mem = getMemoryUsage();
    if (!mem) {
      return { leaked: false, delta: 0, percentage: 0 };
    }

    const delta = mem.usedJSHeapSize - this.baseline;
    const percentage = (delta / this.baseline) * 100;
    const leaked = delta > this.threshold;

    return { leaked, delta, percentage };
  }

  reset(): void {
    this.baseline = null;
  }
}

/**
 * Performance assertion helpers
 */
export const performanceAssert = {
  /**
   * Asserts that an operation completes within a time limit
   */
  async completesWithin<T>(
    fn: () => T | Promise<T>,
    maxTime: number,
    message?: string
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const elapsed = performance.now() - start;

    if (elapsed > maxTime) {
      throw new Error(
        message || `Operation took ${elapsed.toFixed(2)}ms, expected < ${maxTime}ms`
      );
    }

    return result;
  },

  /**
   * Asserts that FPS stays above a threshold
   */
  maintainsFPS(fpsReport: ReturnType<FPSMeter['getReport']>, minFPS: number): void {
    if (fpsReport.avgFPS < minFPS) {
      throw new Error(
        `Average FPS ${fpsReport.avgFPS.toFixed(2)} is below minimum ${minFPS}`
      );
    }
  },

  /**
   * Asserts no memory leak occurred
   */
  noMemoryLeak(detector: MemoryLeakDetector, maxPercentage: number = 10): void {
    const result = detector.check();
    if (result.leaked) {
      throw new Error(
        `Memory leak detected: ${(result.delta / 1024 / 1024).toFixed(2)}MB increase (${result.percentage.toFixed(1)}%)`
      );
    }
  },
};
