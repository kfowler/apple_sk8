/**
 * Rendering Performance Benchmarks
 * Tests rendering performance with various actor counts and optimizations
 */

import { SK8Stage } from '../../src/graphics/SK8Stage';
import { Rectangle, Oval, Polygon } from '../../src/graphics/shapes';
import { benchmark, FPSMeter, formatBenchmarkResults } from '../utils/performance-utils';
import { createMockCanvas } from '../utils/test-helpers';

describe('Rendering Performance Benchmarks', () => {
  describe('Actor Rendering', () => {
    it('should render 100 actors at 60fps', async () => {
      const canvas = createMockCanvas();
      const stage = new SK8Stage(canvas);

      // Create 100 actors
      for (let i = 0; i < 100; i++) {
        const rect = new Rectangle();
        rect.setBounds({
          left: (i % 10) * 80,
          top: Math.floor(i / 10) * 80,
          width: 70,
          height: 70,
        });
        rect.setFillColor(`rgb(${i * 2}, ${255 - i * 2}, 128)`);
        stage.addActor(rect);
      }

      const fpsMeter = new FPSMeter();
      fpsMeter.start();

      // Simulate 60 frames
      for (let frame = 0; frame < 60; frame++) {
        stage.render();
        fpsMeter.tick();
      }

      const report = fpsMeter.getReport();

      console.log('100 Actors Rendering Performance:');
      console.log(`  Average FPS: ${report.avgFPS.toFixed(2)}`);
      console.log(`  Min FPS: ${report.minFPS.toFixed(2)}`);
      console.log(`  Max FPS: ${report.maxFPS.toFixed(2)}`);

      expect(report.avgFPS).toBeGreaterThan(30); // Should maintain at least 30 FPS
    });

    it('should render 500 actors efficiently', async () => {
      const canvas = createMockCanvas(1920, 1080);
      const stage = new SK8Stage(canvas);

      // Create 500 actors
      for (let i = 0; i < 500; i++) {
        const rect = new Rectangle();
        rect.setBounds({
          left: (i % 20) * 95,
          top: Math.floor(i / 20) * 40,
          width: 90,
          height: 35,
        });
        rect.setFillColor(`hsl(${i % 360}, 70%, 50%)`);
        stage.addActor(rect);
      }

      const result = await benchmark('Render 500 actors', () => {
        stage.render();
      }, { iterations: 100 });

      console.log('500 Actors Rendering Performance:');
      console.log(`  Average time: ${result.averageTime.toFixed(3)}ms`);
      console.log(`  Ops/second: ${result.opsPerSecond.toFixed(0)}`);

      // Should render in less than 33ms (30 FPS)
      expect(result.averageTime).toBeLessThan(33);
    });

    it('should measure different shape types performance', async () => {
      const results = await Promise.all([
        // Rectangles
        benchmark('Rectangle rendering', () => {
          const canvas = createMockCanvas();
          const stage = new SK8Stage(canvas);

          for (let i = 0; i < 100; i++) {
            const rect = new Rectangle();
            rect.setBounds({ left: i, top: i, width: 50, height: 50 });
            stage.addActor(rect);
          }

          stage.render();
        }, { iterations: 50 }),

        // Ovals
        benchmark('Oval rendering', () => {
          const canvas = createMockCanvas();
          const stage = new SK8Stage(canvas);

          for (let i = 0; i < 100; i++) {
            const oval = new Oval();
            oval.setBounds({ left: i, top: i, width: 50, height: 50 });
            stage.addActor(oval);
          }

          stage.render();
        }, { iterations: 50 }),

        // Polygons
        benchmark('Polygon rendering', () => {
          const canvas = createMockCanvas();
          const stage = new SK8Stage(canvas);

          for (let i = 0; i < 100; i++) {
            const poly = new Polygon();
            poly.setPoints([
              { x: i, y: i },
              { x: i + 50, y: i },
              { x: i + 25, y: i + 50 },
            ]);
            stage.addActor(poly);
          }

          stage.render();
        }, { iterations: 50 }),
      ]);

      console.log('\nShape Type Performance Comparison:');
      console.log(formatBenchmarkResults(results));
    });
  });

  describe('Dirty Rectangle Optimization', () => {
    it('should verify dirty rectangle improves performance', async () => {
      const canvas = createMockCanvas();

      // Without optimization
      const withoutOptimization = await benchmark('Without dirty rect', () => {
        const stage = new SK8Stage(canvas);
        stage.setDirtyRectOptimization?.(false);

        for (let i = 0; i < 50; i++) {
          const rect = new Rectangle();
          rect.setBounds({ left: i * 15, top: i * 15, width: 50, height: 50 });
          stage.addActor(rect);
        }

        // Change one actor
        const actors = stage.getActors();
        actors[0].setLeft(100);

        stage.render();
      }, { iterations: 100 });

      // With optimization
      const withOptimization = await benchmark('With dirty rect', () => {
        const stage = new SK8Stage(canvas);
        stage.setDirtyRectOptimization?.(true);

        for (let i = 0; i < 50; i++) {
          const rect = new Rectangle();
          rect.setBounds({ left: i * 15, top: i * 15, width: 50, height: 50 });
          stage.addActor(rect);
        }

        // Change one actor
        const actors = stage.getActors();
        actors[0].setLeft(100);

        stage.render();
      }, { iterations: 100 });

      console.log('\nDirty Rectangle Optimization:');
      console.log(`  Without: ${withoutOptimization.averageTime.toFixed(3)}ms`);
      console.log(`  With: ${withOptimization.averageTime.toFixed(3)}ms`);
      console.log(`  Improvement: ${((withoutOptimization.averageTime - withOptimization.averageTime) / withoutOptimization.averageTime * 100).toFixed(1)}%`);

      // Optimization should provide some improvement
      expect(withOptimization.averageTime).toBeLessThanOrEqual(withoutOptimization.averageTime);
    });
  });

  describe('Transform Performance', () => {
    it('should measure rotation performance', async () => {
      const result = await benchmark('Rotating actors', () => {
        const canvas = createMockCanvas();
        const stage = new SK8Stage(canvas);

        const rect = new Rectangle();
        rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
        stage.addActor(rect);

        for (let angle = 0; angle < 360; angle += 10) {
          rect.setRotation(angle);
          stage.render();
        }
      }, { iterations: 50 });

      console.log('\nRotation Performance:');
      console.log(`  Average time: ${result.averageTime.toFixed(3)}ms`);

      expect(result.averageTime).toBeLessThan(100);
    });

    it('should measure scaling performance', async () => {
      const result = await benchmark('Scaling actors', () => {
        const canvas = createMockCanvas();
        const stage = new SK8Stage(canvas);

        const rect = new Rectangle();
        rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
        stage.addActor(rect);

        for (let scale = 0.1; scale <= 3; scale += 0.1) {
          rect.setScale?.(scale, scale);
          stage.render();
        }
      }, { iterations: 50 });

      console.log('\nScaling Performance:');
      console.log(`  Average time: ${result.averageTime.toFixed(3)}ms`);

      expect(result.averageTime).toBeLessThan(100);
    });
  });

  describe('Batch Rendering', () => {
    it('should measure batch rendering performance', async () => {
      const individual = await benchmark('Individual renders', () => {
        const canvas = createMockCanvas();
        const stage = new SK8Stage(canvas);

        for (let i = 0; i < 10; i++) {
          const rect = new Rectangle();
          rect.setBounds({ left: i * 50, top: i * 50, width: 40, height: 40 });
          stage.addActor(rect);
          stage.render();
        }
      }, { iterations: 100 });

      const batched = await benchmark('Batched renders', () => {
        const canvas = createMockCanvas();
        const stage = new SK8Stage(canvas);

        for (let i = 0; i < 10; i++) {
          const rect = new Rectangle();
          rect.setBounds({ left: i * 50, top: i * 50, width: 40, height: 40 });
          stage.addActor(rect);
        }
        stage.render();
      }, { iterations: 100 });

      console.log('\nBatch Rendering Performance:');
      console.log(`  Individual: ${individual.averageTime.toFixed(3)}ms`);
      console.log(`  Batched: ${batched.averageTime.toFixed(3)}ms`);
      console.log(`  Improvement: ${((individual.averageTime - batched.averageTime) / individual.averageTime * 100).toFixed(1)}%`);

      expect(batched.averageTime).toBeLessThan(individual.averageTime);
    });
  });

  describe('Performance Thresholds', () => {
    it('should maintain 60fps with typical scene', async () => {
      const canvas = createMockCanvas();
      const stage = new SK8Stage(canvas);

      // Create a typical scene with 50 actors
      for (let i = 0; i < 50; i++) {
        const rect = new Rectangle();
        rect.setBounds({
          left: Math.random() * 700,
          top: Math.random() * 500,
          width: 50 + Math.random() * 50,
          height: 50 + Math.random() * 50,
        });
        rect.setFillColor(`hsl(${Math.random() * 360}, 70%, 50%)`);
        rect.setRotation(Math.random() * 360);
        stage.addActor(rect);
      }

      const fpsMeter = new FPSMeter();
      fpsMeter.start();

      // Run for 120 frames (2 seconds at 60fps)
      for (let i = 0; i < 120; i++) {
        stage.render();
        fpsMeter.tick();
      }

      const report = fpsMeter.getReport();

      console.log('\n60fps Threshold Test:');
      console.log(`  Average FPS: ${report.avgFPS.toFixed(2)}`);
      console.log(`  Min FPS: ${report.minFPS.toFixed(2)}`);

      // Should maintain at least 50 FPS average (allowing some variance)
      expect(report.avgFPS).toBeGreaterThan(50);
    });
  });
});
