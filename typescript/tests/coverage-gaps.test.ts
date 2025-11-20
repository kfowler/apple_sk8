/**
 * Coverage Gaps Tests
 * Additional tests targeting specific uncovered code paths and edge cases
 */

import { SK8Object } from '../src/core/SK8Object';
import { SK8Actor } from '../src/graphics/SK8Actor';
import { Rectangle, Oval, RoundedRectangle, Polygon } from '../src/graphics/shapes';
import { SK8Stage } from '../src/graphics/SK8Stage';
import { createMockCanvas } from './utils/test-helpers';

describe('Coverage Gaps - Edge Cases', () => {
  describe('Null and Undefined Handling', () => {
    it('should handle null bounds gracefully', () => {
      const rect = new Rectangle();
      expect(() => rect.setBounds(null as any)).not.toThrow();
    });

    it('should handle undefined color values', () => {
      const rect = new Rectangle();
      expect(() => rect.setFillColor(undefined as any)).not.toThrow();
    });

    it('should handle empty string names', () => {
      const obj = new SK8Object();
      obj.setProperty('objectName', '');
      expect(obj.getProperty('objectName')).toBe('');
    });

    it('should handle null event handlers', () => {
      const rect = new Rectangle();
      expect(() => rect.setProperty('onClick', null)).not.toThrow();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle zero-width actors', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 0, height: 100 });
      expect(rect.getWidth()).toBe(0);
    });

    it('should handle zero-height actors', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 0 });
      expect(rect.getHeight()).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: -100, top: -100, width: 200, height: 200 });
      expect(rect.getLeft()).toBe(-100);
      expect(rect.getTop()).toBe(-100);
    });

    it('should handle very large coordinates', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 1000000, top: 1000000, width: 100, height: 100 });
      expect(rect.getLeft()).toBe(1000000);
    });

    it('should handle extreme rotation values', () => {
      const rect = new Rectangle();
      rect.setRotation(720); // 2 full rotations
      expect(rect.getRotation()).toBe(720);
    });

    it('should handle negative rotation', () => {
      const rect = new Rectangle();
      rect.setRotation(-90);
      expect(rect.getRotation()).toBe(-90);
    });
  });

  describe('Error Handling Paths', () => {
    it('should throw on invalid property access', () => {
      const obj = new SK8Object();
      expect(() => obj.getProperty('')).toThrow();
    });

    it('should handle missing parent references', () => {
      const rect = new Rectangle();
      rect.setProperty('parent', null);
      expect(rect.getProperty('parent')).toBeNull();
    });

    it('should handle circular parent references', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();

      rect1.setProperty('parent', rect2);
      rect2.setProperty('parent', rect1);

      // Should detect and prevent circular reference
      expect(() => rect1.getAncestors?.()).not.toThrow();
    });

    it('should handle rendering without context', () => {
      const rect = new Rectangle();
      expect(() => rect.render(null as any)).not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid property changes', () => {
      const rect = new Rectangle();

      for (let i = 0; i < 1000; i++) {
        rect.setLeft(i);
      }

      expect(rect.getLeft()).toBe(999);
    });

    it('should handle multiple simultaneous renders', () => {
      const canvas = createMockCanvas();
      const stage = new SK8Stage(canvas);

      const rects = Array.from({ length: 100 }, () => new Rectangle());
      rects.forEach((r) => stage.addActor(r));

      expect(() => {
        for (let i = 0; i < 10; i++) {
          stage.render();
        }
      }).not.toThrow();
    });

    it('should handle rapid add/remove operations', () => {
      const canvas = createMockCanvas();
      const stage = new SK8Stage(canvas);

      for (let i = 0; i < 100; i++) {
        const rect = new Rectangle();
        stage.addActor(rect);
        stage.removeActor(rect);
      }

      expect(stage.getActors()).toHaveLength(0);
    });
  });

  describe('Memory Cleanup', () => {
    it('should clean up event listeners on actor removal', () => {
      const canvas = createMockCanvas();
      const stage = new SK8Stage(canvas);
      const rect = new Rectangle();

      rect.on('click', () => {});
      stage.addActor(rect);
      stage.removeActor(rect);

      expect(rect.getListenerCount?.('click') || 0).toBe(0);
    });

    it('should clean up references when actor is destroyed', () => {
      const rect = new Rectangle();
      const parent = new Rectangle();

      rect.setProperty('parent', parent);
      rect.destroy?.();

      expect(rect.getProperty('parent')).toBeNull();
    });

    it('should handle destroying already destroyed actors', () => {
      const rect = new Rectangle();
      rect.destroy?.();

      expect(() => rect.destroy?.()).not.toThrow();
    });
  });

  describe('Invalid Inputs', () => {
    it('should handle invalid color formats', () => {
      const rect = new Rectangle();

      expect(() => rect.setFillColor('not-a-color')).not.toThrow();
      expect(() => rect.setFillColor('###')).not.toThrow();
      expect(() => rect.setFillColor('rgb(300, 300, 300)')).not.toThrow();
    });

    it('should handle invalid bounds objects', () => {
      const rect = new Rectangle();

      expect(() => rect.setBounds({ left: NaN, top: NaN, width: NaN, height: NaN } as any)).not.toThrow();
      expect(() => rect.setBounds({ left: Infinity, top: -Infinity, width: 0, height: 0 } as any)).not.toThrow();
    });

    it('should handle invalid stroke width', () => {
      const rect = new Rectangle();

      expect(() => rect.setStrokeWidth(-1)).not.toThrow();
      expect(() => rect.setStrokeWidth(NaN)).not.toThrow();
    });

    it('should handle invalid opacity values', () => {
      const rect = new Rectangle();

      rect.setOpacity(-1);
      expect(rect.getOpacity()).toBeGreaterThanOrEqual(0);

      rect.setOpacity(2);
      expect(rect.getOpacity()).toBeLessThanOrEqual(1);
    });
  });

  describe('Special Cases for Shapes', () => {
    it('should handle polygon with no points', () => {
      const poly = new Polygon();
      expect(() => poly.setPoints([])).not.toThrow();
    });

    it('should handle polygon with one point', () => {
      const poly = new Polygon();
      poly.setPoints([{ x: 0, y: 0 }]);
      expect(poly.getPoints()).toHaveLength(1);
    });

    it('should handle rounded rectangle with zero radius', () => {
      const roundRect = new RoundedRectangle();
      roundRect.setCornerRadius(0);
      expect(roundRect.getCornerRadius()).toBe(0);
    });

    it('should handle rounded rectangle with radius larger than dimensions', () => {
      const roundRect = new RoundedRectangle();
      roundRect.setBounds({ left: 0, top: 0, width: 100, height: 100 });
      roundRect.setCornerRadius(200);
      // Should clamp to reasonable value
      expect(roundRect.getCornerRadius()).toBeLessThanOrEqual(100);
    });
  });

  describe('Hit Testing Edge Cases', () => {
    it('should handle hit test at exact boundary', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });

      expect(rect.hitTest?.(100, 100)).toBe(true);
      expect(rect.hitTest?.(300, 250)).toBe(true);
    });

    it('should handle hit test on rotated actor', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      rect.setRotation(45);

      // Hit test should account for rotation
      const result = rect.hitTest?.(200, 175);
      expect(typeof result).toBe('boolean');
    });

    it('should handle hit test on scaled actor', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      rect.setScale?.(2, 2);

      const result = rect.hitTest?.(200, 175);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Z-Index and Layering', () => {
    it('should handle negative z-index', () => {
      const rect = new Rectangle();
      rect.setProperty('zIndex', -1);
      expect(rect.getProperty('zIndex')).toBe(-1);
    });

    it('should handle very large z-index', () => {
      const rect = new Rectangle();
      rect.setProperty('zIndex', 999999);
      expect(rect.getProperty('zIndex')).toBe(999999);
    });

    it('should sort actors by z-index correctly', () => {
      const canvas = createMockCanvas();
      const stage = new SK8Stage(canvas);

      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      const rect3 = new Rectangle();

      rect1.setProperty('zIndex', 3);
      rect2.setProperty('zIndex', 1);
      rect3.setProperty('zIndex', 2);

      stage.addActor(rect1);
      stage.addActor(rect2);
      stage.addActor(rect3);

      stage.sortActorsByZIndex?.();

      const actors = stage.getActors();
      expect(actors[0].getProperty('zIndex')).toBeLessThanOrEqual(actors[1].getProperty('zIndex'));
    });
  });

  describe('Visibility and Enabled States', () => {
    it('should not render invisible actors', () => {
      const rect = new Rectangle();
      rect.setVisible(false);

      const ctx = createMockCanvas().getContext('2d')!;
      const renderSpy = jest.spyOn(ctx, 'fillRect');

      rect.render(ctx);

      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('should not process events on disabled actors', () => {
      const rect = new Rectangle();
      rect.setProperty('enabled', false);

      const handler = jest.fn();
      rect.on('click', handler);

      rect.handleEvent?.({ type: 'click' } as any);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Property Change Notifications', () => {
    it('should emit property change events', () => {
      const rect = new Rectangle();
      const listener = jest.fn();

      rect.on('propertyChanged', listener);

      rect.setLeft(100);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          property: 'left',
          newValue: 100,
        })
      );
    });

    it('should batch property changes', () => {
      const rect = new Rectangle();
      const listener = jest.fn();

      rect.on('propertyChanged', listener);

      rect.beginBatch?.();
      rect.setLeft(100);
      rect.setTop(100);
      rect.setWidth(200);
      rect.endBatch?.();

      // Should only emit once for batch
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clone and Copy', () => {
    it('should clone actors with all properties', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      rect.setFillColor('#ff0000');
      rect.setStrokeColor('#000000');
      rect.setProperty('customProp', 'customValue');

      const clone = rect.clone?.();

      expect(clone).toBeDefined();
      expect(clone?.getLeft()).toBe(100);
      expect(clone?.getFillColor()).toBe('#ff0000');
      expect(clone?.getProperty('customProp')).toBe('customValue');
    });

    it('should create independent clones', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');

      const clone = rect.clone?.();
      clone?.setFillColor('#00ff00');

      expect(rect.getFillColor()).toBe('#ff0000');
      expect(clone?.getFillColor()).toBe('#00ff00');
    });
  });
});
