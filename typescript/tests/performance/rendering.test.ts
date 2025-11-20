/**
 * Rendering Performance Tests
 *
 * Tests to ensure rendering performance meets targets
 */

import { SK8Stage } from '../../src/graphics/SK8Stage.js';
import { Rectangle } from '../../src/graphics/shapes.js';
import { ColorUtils } from '../../src/graphics/types.js';
import { performanceMonitor } from '../../src/runtime/performance-monitor.js';

describe('Rendering Performance', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    stage = new SK8Stage(canvas);
    performanceMonitor.reset();
  });

  afterEach(() => {
    stage.destroy();
  });

  test('should maintain 60 FPS with 100 actors', async () => {
    // Create 100 actors
    for (let i = 0; i < 100; i++) {
      const rect = new Rectangle();
      rect.setLeft(Math.random() * 800);
      rect.setTop(Math.random() * 600);
      rect.setWidth(50);
      rect.setHeight(50);
      rect.setFillColor(ColorUtils.Red);
      stage.addActor(rect);
    }

    // Start rendering
    stage.startRendering();

    // Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stop rendering
    stage.stopRendering();

    // Check FPS
    const fps = performanceMonitor.getFPS();
    expect(fps).toBeGreaterThanOrEqual(55); // Allow 5 FPS margin
  });

  test('should maintain 60 FPS with 500 actors (optimized)', async () => {
    stage.setUseRenderOptimizer(true);

    // Create 500 actors
    for (let i = 0; i < 500; i++) {
      const rect = new Rectangle();
      rect.setLeft(Math.random() * 800);
      rect.setTop(Math.random() * 600);
      rect.setWidth(30);
      rect.setHeight(30);
      rect.setFillColor(ColorUtils.fromRGB(
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255)
      ));
      stage.addActor(rect);
    }

    // Start rendering
    stage.startRendering();

    // Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stop rendering
    stage.stopRendering();

    // Check FPS
    const fps = performanceMonitor.getFPS();
    expect(fps).toBeGreaterThanOrEqual(50); // Target: 60 FPS, allow 10 FPS margin
  });

  test('should cull off-screen actors', async () => {
    stage.setUseRenderOptimizer(true);

    // Create actors (half off-screen)
    for (let i = 0; i < 200; i++) {
      const rect = new Rectangle();
      rect.setLeft(i < 100 ? Math.random() * 800 : 1000 + Math.random() * 800);
      rect.setTop(Math.random() * 600);
      rect.setWidth(50);
      rect.setHeight(50);
      rect.setFillColor(ColorUtils.Blue);
      stage.addActor(rect);
    }

    // Render one frame
    stage.render();

    // Check culling stats
    const stats = stage.getRenderStats();
    expect(stats.culledActors).toBeGreaterThan(50); // At least half should be culled
  });

  test('should have average frame time < 16.67ms with 100 actors', async () => {
    // Create 100 actors
    for (let i = 0; i < 100; i++) {
      const rect = new Rectangle();
      rect.setLeft(Math.random() * 800);
      rect.setTop(Math.random() * 600);
      rect.setWidth(50);
      rect.setHeight(50);
      rect.setFillColor(ColorUtils.Green);
      stage.addActor(rect);
    }

    // Start rendering
    stage.startRendering();

    // Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stop rendering
    stage.stopRendering();

    // Check frame time
    const avgFrameTime = performanceMonitor.getAverageFrameTime();
    expect(avgFrameTime).toBeLessThan(16.67); // 60 FPS = 16.67ms per frame
  });
});
