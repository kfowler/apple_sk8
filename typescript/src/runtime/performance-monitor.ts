/**
 * Performance Monitor - Real-time performance tracking and metrics
 *
 * Tracks:
 * - FPS (frames per second)
 * - Frame time histogram
 * - Memory usage
 * - Slow frame detection
 * - Performance marks for profiling
 */

export interface PerformanceMetrics {
  fps: number;
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  slowFrameCount: number;
  totalFrames: number;
  memoryUsage?: MemoryInfo;
  customMetrics: Map<string, number>;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface FrameTimeHistogram {
  [key: string]: number; // Time bucket -> count
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private lastFrameTime: number = 0;

  // Frame time tracking
  private frameTimes: number[] = [];
  private maxFrameTimeHistory: number = 100;
  private slowFrameThreshold: number = 33.33; // 30 FPS
  private slowFrameCount: number = 0;

  // Frame time histogram (buckets in ms)
  private histogram: FrameTimeHistogram = {};
  private histogramBucketSize: number = 5; // 5ms buckets

  // Custom metrics
  private customMetrics = new Map<string, number>();
  private customCounters = new Map<string, number>();

  // Performance marks
  private marks = new Map<string, number>();
  private measures = new Map<string, { start: number; duration: number }[]>();

  // Memory tracking
  private memoryCheckInterval: number = 1000; // Check every second
  private lastMemoryCheck: number = 0;
  private currentMemory?: MemoryInfo;

  // Statistics
  private totalFrames: number = 0;
  private startTime: number = Date.now();

  constructor() {
    this.reset();
  }

  /**
   * Record a frame
   */
  recordFrame(): void {
    const now = performance.now();

    // Calculate frame time
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimes.push(frameTime);

      // Limit history
      if (this.frameTimes.length > this.maxFrameTimeHistory) {
        this.frameTimes.shift();
      }

      // Track slow frames
      if (frameTime > this.slowFrameThreshold) {
        this.slowFrameCount++;
      }

      // Update histogram
      const bucket = Math.floor(frameTime / this.histogramBucketSize) * this.histogramBucketSize;
      this.histogram[bucket] = (this.histogram[bucket] || 0) + 1;
    }

    this.lastFrameTime = now;
    this.frameCount++;
    this.totalFrames++;

    // Update FPS counter
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Check memory usage
    if (now - this.lastMemoryCheck >= this.memoryCheckInterval) {
      this.updateMemoryInfo();
      this.lastMemoryCheck = now;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Get min frame time
   */
  getMinFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return Math.min(...this.frameTimes);
  }

  /**
   * Get max frame time
   */
  getMaxFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return Math.max(...this.frameTimes);
  }

  /**
   * Get frame time histogram
   */
  getHistogram(): FrameTimeHistogram {
    return { ...this.histogram };
  }

  /**
   * Get number of slow frames
   */
  getSlowFrameCount(): number {
    return this.slowFrameCount;
  }

  /**
   * Get total frames rendered
   */
  getTotalFrames(): number {
    return this.totalFrames;
  }

  /**
   * Set custom metric
   */
  setMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
  }

  /**
   * Increment custom counter
   */
  incrementCounter(name: string, amount: number = 1): void {
    const current = this.customCounters.get(name) || 0;
    this.customCounters.set(name, current + amount);
  }

  /**
   * Get custom metric
   */
  getMetric(name: string): number | undefined {
    return this.customMetrics.get(name);
  }

  /**
   * Get custom counter
   */
  getCounter(name: string): number {
    return this.customCounters.get(name) || 0;
  }

  /**
   * Performance mark (like performance.mark)
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure duration between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (start === undefined) {
      console.warn(`Start mark '${startMark}' not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (end === undefined) {
      console.warn(`End mark '${endMark}' not found`);
      return 0;
    }

    const duration = end - start;

    // Store measure
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push({ start, duration });

    return duration;
  }

  /**
   * Get measures for a name
   */
  getMeasures(name: string): { start: number; duration: number }[] {
    return this.measures.get(name) || [];
  }

  /**
   * Get average measure duration
   */
  getAverageMeasure(name: string): number {
    const measures = this.getMeasures(name);
    if (measures.length === 0) return 0;

    const sum = measures.reduce((acc, m) => acc + m.duration, 0);
    return sum / measures.length;
  }

  /**
   * Update memory information
   */
  private updateMemoryInfo(): void {
    // Check if memory API is available
    if (performance.memory) {
      this.currentMemory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
  }

  /**
   * Get memory info
   */
  getMemoryInfo(): MemoryInfo | undefined {
    return this.currentMemory;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      averageFrameTime: this.getAverageFrameTime(),
      minFrameTime: this.getMinFrameTime(),
      maxFrameTime: this.getMaxFrameTime(),
      slowFrameCount: this.slowFrameCount,
      totalFrames: this.totalFrames,
      memoryUsage: this.currentMemory,
      customMetrics: new Map(this.customMetrics),
    };
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const metrics = this.getMetrics();
    const uptime = (Date.now() - this.startTime) / 1000;

    let report = '=== Performance Report ===\n\n';
    report += `Uptime: ${uptime.toFixed(2)}s\n`;
    report += `FPS: ${metrics.fps}\n`;
    report += `Average Frame Time: ${metrics.averageFrameTime.toFixed(2)}ms\n`;
    report += `Min Frame Time: ${metrics.minFrameTime.toFixed(2)}ms\n`;
    report += `Max Frame Time: ${metrics.maxFrameTime.toFixed(2)}ms\n`;
    report += `Total Frames: ${metrics.totalFrames}\n`;
    report += `Slow Frames: ${metrics.slowFrameCount} (${((metrics.slowFrameCount / metrics.totalFrames) * 100).toFixed(2)}%)\n`;

    if (metrics.memoryUsage) {
      report += `\nMemory Usage:\n`;
      report += `  Used: ${(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
      report += `  Total: ${(metrics.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
      report += `  Limit: ${(metrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB\n`;
    }

    if (this.customMetrics.size > 0) {
      report += `\nCustom Metrics:\n`;
      this.customMetrics.forEach((value, name) => {
        report += `  ${name}: ${value}\n`;
      });
    }

    if (this.customCounters.size > 0) {
      report += `\nCustom Counters:\n`;
      this.customCounters.forEach((value, name) => {
        report += `  ${name}: ${value}\n`;
      });
    }

    if (this.measures.size > 0) {
      report += `\nMeasures (average):\n`;
      this.measures.forEach((_, name) => {
        const avg = this.getAverageMeasure(name);
        report += `  ${name}: ${avg.toFixed(2)}ms\n`;
      });
    }

    return report;
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    console.log(this.getReport());
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.lastFrameTime = 0;
    this.frameTimes = [];
    this.slowFrameCount = 0;
    this.histogram = {};
    this.customMetrics.clear();
    this.customCounters.clear();
    this.marks.clear();
    this.measures.clear();
    this.totalFrames = 0;
    this.startTime = Date.now();
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    return this.fps < 30 || this.getAverageFrameTime() > 33.33;
  }

  /**
   * Get performance warnings
   */
  getWarnings(): string[] {
    const warnings: string[] = [];

    if (this.fps < 30) {
      warnings.push(`Low FPS: ${this.fps} (target: 60)`);
    }

    if (this.getAverageFrameTime() > 33.33) {
      warnings.push(`High average frame time: ${this.getAverageFrameTime().toFixed(2)}ms (target: <16.67ms)`);
    }

    if (this.slowFrameCount > this.totalFrames * 0.1) {
      warnings.push(`Too many slow frames: ${this.slowFrameCount} (${((this.slowFrameCount / this.totalFrames) * 100).toFixed(2)}%)`);
    }

    if (this.currentMemory) {
      const usagePercent =
        (this.currentMemory.usedJSHeapSize / this.currentMemory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        warnings.push(`High memory usage: ${usagePercent.toFixed(2)}%`);
      }
    }

    return warnings;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
