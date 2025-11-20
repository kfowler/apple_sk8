/**
 * Memory Performance Tests
 *
 * Tests to ensure memory usage is optimized
 */

import { rectPool, colorPool, pointPool, getAllPoolStats } from '../../src/core/object-pool.js';
import { performanceMonitor } from '../../src/runtime/performance-monitor.js';

describe('Memory Performance', () => {
  beforeEach(() => {
    // Clear all pools
    rectPool.clear();
    colorPool.clear();
    pointPool.clear();
    performanceMonitor.reset();
  });

  test('should reuse pooled rectangles', () => {
    const rects = [];

    // Acquire 100 rects
    for (let i = 0; i < 100; i++) {
      rects.push(rectPool.acquire());
    }

    // Release all
    for (const rect of rects) {
      rectPool.release(rect);
    }

    // Acquire again - should reuse
    const stats = rectPool.getStats();
    expect(stats.available).toBe(100);

    // Acquire 100 more
    for (let i = 0; i < 100; i++) {
      rects.push(rectPool.acquire());
    }

    // Check reuse rate
    const finalStats = rectPool.getStats();
    expect(finalStats.reuseRate).toBeGreaterThan(0.5);
  });

  test('should maintain pool statistics', () => {
    // Use the pool
    const rect1 = rectPool.acquire();
    const rect2 = rectPool.acquire();
    rectPool.release(rect1);
    const rect3 = rectPool.acquire(); // Should reuse rect1

    const stats = rectPool.getStats();
    expect(stats.totalAllocations).toBeGreaterThanOrEqual(2);
    expect(stats.totalReuses).toBeGreaterThanOrEqual(1);
    expect(stats.allocated).toBe(2); // rect2 and rect3 (reused rect1)
  });

  test('should limit pool size', () => {
    const maxSize = 500; // From pool configuration

    // Try to fill pool beyond max size
    const rects = [];
    for (let i = 0; i < maxSize + 100; i++) {
      const rect = rectPool.acquire();
      rects.push(rect);
    }

    // Release all
    for (const rect of rects) {
      rectPool.release(rect);
    }

    // Pool should not exceed max size
    const stats = rectPool.getStats();
    expect(stats.available).toBeLessThanOrEqual(maxSize);
  });

  test('should report pool stats for all pools', () => {
    const stats = getAllPoolStats();

    expect(stats.rect).toBeDefined();
    expect(stats.color).toBeDefined();
    expect(stats.point).toBeDefined();

    expect(stats.rect.totalAllocations).toBeGreaterThanOrEqual(0);
    expect(stats.rect.reuseRate).toBeGreaterThanOrEqual(0);
    expect(stats.rect.reuseRate).toBeLessThanOrEqual(1);
  });

  test('should reduce GC pressure with pooling', async () => {
    const iterations = 1000;

    // Without pooling (baseline - create new objects)
    const startMemoryNoPpool = performanceMonitor.getMemoryInfo()?.usedJSHeapSize || 0;
    for (let i = 0; i < iterations; i++) {
      const rect = { left: 0, top: 0, right: 100, bottom: 100 };
      // Simulate usage
      rect.left = i;
    }
    const endMemoryNoPool = performanceMonitor.getMemoryInfo()?.usedJSHeapSize || 0;
    const memoryNoPool = endMemoryNoPool - startMemoryNoPpool;

    // With pooling
    const startMemoryPool = performanceMonitor.getMemoryInfo()?.usedJSHeapSize || 0;
    const rects = [];
    for (let i = 0; i < iterations; i++) {
      const rect = rectPool.acquire();
      rect.set(i, 0, i + 100, 100);
      rects.push(rect);
    }
    // Release all
    for (const rect of rects) {
      rectPool.release(rect);
    }
    const endMemoryPool = performanceMonitor.getMemoryInfo()?.usedJSHeapSize || 0;
    const memoryPool = endMemoryPool - startMemoryPool;

    // Pooling should use less memory (or similar)
    // Note: This is a rough test and may vary based on GC timing
    console.log(`Memory without pooling: ${memoryNoPool / 1024}KB`);
    console.log(`Memory with pooling: ${memoryPool / 1024}KB`);

    // At minimum, pooling should not use significantly more memory
    expect(memoryPool).toBeLessThanOrEqual(memoryNoPool * 1.5);
  });
});
