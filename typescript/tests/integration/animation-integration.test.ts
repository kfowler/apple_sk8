/**
 * Animation Integration Tests
 * Tests interaction between Timeline, Actors, Animation system, and Stage
 */

import { Timeline } from '../../src/editor/timeline/timeline-model';
import { AnimationController } from '../../src/runtime/animation';
import { SK8Stage } from '../../src/graphics/SK8Stage';
import { Rectangle, Oval } from '../../src/graphics/shapes';
import { createMockCanvas, AnimationFrameMock, delay } from '../utils/test-helpers';

describe('Animation Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let animFrame: AnimationFrameMock;

  beforeEach(() => {
    canvas = createMockCanvas();
    stage = new SK8Stage(canvas);
    animFrame = new AnimationFrameMock();
    animFrame.install();
  });

  afterEach(() => {
    animFrame.uninstall();
  });

  describe('Timeline and Actor Synchronization', () => {
    it('should animate actor position using timeline', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({
        time: 0,
        property: 'left',
        value: 100,
        easing: 'linear',
      });
      timeline.addKeyframe({
        time: 1000,
        property: 'left',
        value: 300,
        easing: 'linear',
      });

      timeline.play();

      // Midway through animation
      timeline.setTime(500);
      expect(rect.getLeft()).toBeCloseTo(200, 0);

      // End of animation
      timeline.setTime(1000);
      expect(rect.getLeft()).toBe(300);
    });

    it('should animate multiple properties simultaneously', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);

      // Animate left
      timeline.addKeyframe({ time: 0, property: 'left', value: 100, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 300, easing: 'linear' });

      // Animate top
      timeline.addKeyframe({ time: 0, property: 'top', value: 100, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'top', value: 200, easing: 'linear' });

      timeline.play();
      timeline.setTime(500);

      expect(rect.getLeft()).toBeCloseTo(200, 0);
      expect(rect.getTop()).toBeCloseTo(150, 0);
    });

    it('should handle different easing functions', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const easingFunctions = ['linear', 'easeIn', 'easeOut', 'easeInOut'];

      for (const easing of easingFunctions) {
        const timeline = new Timeline(rect);
        timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing });
        timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing });

        timeline.play();
        timeline.setTime(500);

        const midValue = rect.getLeft();
        expect(midValue).toBeGreaterThanOrEqual(0);
        expect(midValue).toBeLessThanOrEqual(100);
      }
    });

    it('should trigger stage render when animation updates', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      const renderSpy = jest.spyOn(stage, 'render');

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 100, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 300, easing: 'linear' });

      timeline.play();
      animFrame.tick();

      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Multiple Actor Animation', () => {
    it('should animate multiple actors independently', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      rect1.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      rect2.setBounds({ left: 0, top: 100, width: 100, height: 100 });
      stage.addActor(rect1);
      stage.addActor(rect2);

      const timeline1 = new Timeline(rect1);
      timeline1.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline1.addKeyframe({ time: 1000, property: 'left', value: 200, easing: 'linear' });

      const timeline2 = new Timeline(rect2);
      timeline2.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline2.addKeyframe({ time: 1000, property: 'left', value: 400, easing: 'linear' });

      timeline1.play();
      timeline2.play();

      timeline1.setTime(500);
      timeline2.setTime(500);

      expect(rect1.getLeft()).toBeCloseTo(100, 0);
      expect(rect2.getLeft()).toBeCloseTo(200, 0);
    });

    it('should support synchronized animation of multiple actors', () => {
      const actors = Array.from({ length: 5 }, () => {
        const rect = new Rectangle();
        rect.setBounds({ left: 0, top: 0, width: 50, height: 50 });
        stage.addActor(rect);
        return rect;
      });

      const timelines = actors.map((actor, index) => {
        const timeline = new Timeline(actor);
        timeline.addKeyframe({
          time: 0,
          property: 'left',
          value: 0,
          easing: 'linear',
        });
        timeline.addKeyframe({
          time: 1000,
          property: 'left',
          value: 100 + index * 50,
          easing: 'linear',
        });
        return timeline;
      });

      // Start all at same time
      timelines.forEach((t) => t.play());
      timelines.forEach((t) => t.setTime(500));

      actors.forEach((actor, index) => {
        expect(actor.getLeft()).toBeCloseTo(50 + index * 25, 0);
      });
    });
  });

  describe('Animation Playback Control', () => {
    it('should play animation from start to end', async () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 100, property: 'left', value: 100, easing: 'linear' });

      timeline.play();

      // Simulate animation frames
      for (let i = 0; i <= 100; i += 16) {
        timeline.setTime(i);
        animFrame.tick(16);
      }

      expect(rect.getLeft()).toBe(100);
      expect(timeline.isPlaying()).toBe(false);
    });

    it('should pause and resume animation', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      timeline.play();
      timeline.setTime(500);
      const midValue = rect.getLeft();

      timeline.pause();
      expect(timeline.isPlaying()).toBe(false);

      timeline.setTime(800);
      expect(rect.getLeft()).toBe(midValue); // Should not have moved

      timeline.play();
      timeline.setTime(800);
      expect(rect.getLeft()).toBeGreaterThan(midValue);
    });

    it('should stop and reset animation', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      timeline.play();
      timeline.setTime(500);
      expect(rect.getLeft()).toBeCloseTo(50, 0);

      timeline.stop();
      expect(timeline.getCurrentTime()).toBe(0);
      expect(rect.getLeft()).toBe(0);
    });

    it('should loop animation', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.setLoop(true);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      timeline.play();
      timeline.setTime(1000);
      expect(rect.getLeft()).toBe(100);

      timeline.setTime(1001);
      expect(timeline.getCurrentTime()).toBeLessThan(100);
      expect(rect.getLeft()).toBeLessThan(10);
    });

    it('should reverse animation', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      timeline.setDirection('reverse');
      timeline.play();
      timeline.setTime(500);

      expect(rect.getLeft()).toBeCloseTo(50, 0);
    });
  });

  describe('Keyframe Management', () => {
    it('should add keyframes at specific times', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);

      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 500, property: 'left', value: 50, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      const keyframes = timeline.getKeyframes('left');
      expect(keyframes).toHaveLength(3);
    });

    it('should remove keyframes', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      const kf1 = timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      const kf2 = timeline.addKeyframe({ time: 500, property: 'left', value: 50, easing: 'linear' });

      expect(timeline.getKeyframes('left')).toHaveLength(2);

      timeline.removeKeyframe(kf2);
      expect(timeline.getKeyframes('left')).toHaveLength(1);
    });

    it('should update keyframe values', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      const kf = timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });

      timeline.updateKeyframe(kf, { value: 100 });

      timeline.play();
      timeline.setTime(0);
      expect(rect.getLeft()).toBe(100);
    });

    it('should move keyframes in time', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      const kf = timeline.addKeyframe({ time: 500, property: 'left', value: 50, easing: 'linear' });

      timeline.moveKeyframe(kf, 1000);

      const keyframes = timeline.getKeyframes('left');
      expect(keyframes.find((k) => k.time === 1000)).toBeDefined();
      expect(keyframes.find((k) => k.time === 500)).toBeUndefined();
    });
  });

  describe('Animation Events', () => {
    it('should emit play event', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      const listener = jest.fn();
      timeline.on('play', listener);

      timeline.play();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit pause event', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.play();

      const listener = jest.fn();
      timeline.on('pause', listener);

      timeline.pause();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit stop event', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.play();

      const listener = jest.fn();
      timeline.on('stop', listener);

      timeline.stop();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit complete event when animation finishes', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 100, property: 'left', value: 100, easing: 'linear' });

      const listener = jest.fn();
      timeline.on('complete', listener);

      timeline.play();
      timeline.setTime(100);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit update event during playback', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      const listener = jest.fn();
      timeline.on('update', listener);

      timeline.play();
      timeline.setTime(500);

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Export and Replay', () => {
    it('should export animation data', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });
      timeline.addKeyframe({ time: 0, property: 'top', value: 0, easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'top', value: 200, easing: 'linear' });

      const exported = timeline.export();

      expect(exported).toBeDefined();
      expect(exported.keyframes).toBeDefined();
      expect(exported.duration).toBe(1000);
    });

    it('should import and replay animation', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline1 = new Timeline(rect);
      timeline1.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
      timeline1.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'linear' });

      const exported = timeline1.export();

      const timeline2 = new Timeline(rect);
      timeline2.import(exported);

      timeline2.play();
      timeline2.setTime(500);

      expect(rect.getLeft()).toBeCloseTo(50, 0);
    });

    it('should preserve easing functions on export/import', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const timeline1 = new Timeline(rect);
      timeline1.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'easeInOut' });
      timeline1.addKeyframe({ time: 1000, property: 'left', value: 100, easing: 'easeInOut' });

      const exported = timeline1.export();
      const timeline2 = new Timeline(rect);
      timeline2.import(exported);

      timeline2.play();
      timeline2.setTime(500);

      const value1 = rect.getLeft();

      rect.setLeft(0);
      timeline1.play();
      timeline1.setTime(500);

      const value2 = rect.getLeft();

      expect(value1).toBeCloseTo(value2, 0);
    });
  });

  describe('Color Animation', () => {
    it('should animate color properties', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000'); // Red
      stage.addActor(rect);

      const timeline = new Timeline(rect);
      timeline.addKeyframe({ time: 0, property: 'fillColor', value: '#ff0000', easing: 'linear' });
      timeline.addKeyframe({ time: 1000, property: 'fillColor', value: '#0000ff', easing: 'linear' });

      timeline.play();
      timeline.setTime(500);

      // Should be a purple-ish color midway
      const color = rect.getFillColor();
      expect(color).toBeDefined();
      expect(color).not.toBe('#ff0000');
      expect(color).not.toBe('#0000ff');
    });
  });

  describe('Performance with Many Animations', () => {
    it('should handle 50 simultaneous animations efficiently', () => {
      const actors = Array.from({ length: 50 }, (_, i) => {
        const rect = new Rectangle();
        rect.setBounds({
          left: i * 10,
          top: i * 10,
          width: 50,
          height: 50,
        });
        stage.addActor(rect);
        return rect;
      });

      const timelines = actors.map((actor) => {
        const timeline = new Timeline(actor);
        timeline.addKeyframe({ time: 0, property: 'left', value: 0, easing: 'linear' });
        timeline.addKeyframe({ time: 1000, property: 'left', value: 500, easing: 'linear' });
        timeline.addKeyframe({ time: 0, property: 'top', value: 0, easing: 'linear' });
        timeline.addKeyframe({ time: 1000, property: 'top', value: 500, easing: 'linear' });
        return timeline;
      });

      const startTime = performance.now();

      timelines.forEach((t) => t.play());
      timelines.forEach((t) => t.setTime(500));

      const elapsed = performance.now() - startTime;

      // Should complete in reasonable time (< 100ms for 50 animations)
      expect(elapsed).toBeLessThan(100);
    });
  });
});
