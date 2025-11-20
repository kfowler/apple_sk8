/**
 * Animation Performance Tests
 *
 * Tests to ensure animation performance meets targets
 */

import { animations } from '../../src/runtime/animation.js';
import { Rectangle } from '../../src/graphics/shapes.js';
import { performanceMonitor } from '../../src/runtime/performance-monitor.js';

describe('Animation Performance', () => {
  beforeEach(() => {
    animations.cancelAll();
    performanceMonitor.reset();
  });

  afterEach(() => {
    animations.cancelAll();
  });

  test('should handle 50 simultaneous animations at 60 FPS', async () => {
    // Create actors
    const actors: Rectangle[] = [];
    for (let i = 0; i < 50; i++) {
      const rect = new Rectangle();
      rect.setLeft(Math.random() * 800);
      rect.setTop(Math.random() * 600);
      actors.push(rect);
    }

    // Start animations
    for (const actor of actors) {
      animations.animate(actor, 'left', Math.random() * 800, 1000);
      animations.animate(actor, 'top', Math.random() * 600, 1000);
    }

    // Wait for animations to run
    const startTime = Date.now();
    while (Date.now() - startTime < 2000) {
      await new Promise(resolve => setTimeout(resolve, 16));
      performanceMonitor.recordFrame();
    }

    // Check FPS
    const fps = performanceMonitor.getFPS();
    expect(fps).toBeGreaterThanOrEqual(55);
  });

  test('should reuse animation objects (pool)', async () => {
    const rect = new Rectangle();

    // Start and complete many animations
    for (let i = 0; i < 20; i++) {
      animations.animate(rect, 'left', Math.random() * 800, 100);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Check pool stats
    const poolStats = (animations as any).getPoolStats();
    expect(poolStats.reuseRate).toBeGreaterThan(0.5); // >50% reuse
  });

  test('should handle 100 animations without memory leaks', async () => {
    const actors: Rectangle[] = [];
    for (let i = 0; i < 100; i++) {
      const rect = new Rectangle();
      actors.push(rect);
    }

    // Get initial memory
    const initialMemory = performanceMonitor.getMemoryInfo()?.usedJSHeapSize || 0;

    // Run many animation cycles
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const actor of actors) {
        animations.animate(actor, 'left', Math.random() * 800, 100);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
      animations.cancelAll();
    }

    // Get final memory
    const finalMemory = performanceMonitor.getMemoryInfo()?.usedJSHeapSize || 0;

    // Memory should not grow significantly
    const memoryGrowth = finalMemory - initialMemory;
    const growthPercent = (memoryGrowth / initialMemory) * 100;

    expect(growthPercent).toBeLessThan(50); // <50% growth
  });

  test('should coalesce render calls', async () => {
    const actors: Rectangle[] = [];
    for (let i = 0; i < 10; i++) {
      const rect = new Rectangle();
      actors.push(rect);
    }

    let renderCalls = 0;
    actors.forEach(actor => {
      actor.setNeedsRender = () => renderCalls++;
    });

    // Start multiple animations simultaneously
    for (const actor of actors) {
      animations.animate(actor, 'left', 100, 100);
      animations.animate(actor, 'top', 100, 100);
    }

    // Wait for one animation frame
    await new Promise(resolve => setTimeout(resolve, 20));

    // Render calls should be coalesced (much less than 20)
    expect(renderCalls).toBeLessThan(20);
  });
});
