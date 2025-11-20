/**
 * SK8Script Integration Tests
 * Tests SK8Script integration with Actors, Events, and the runtime
 */

import { Evaluator } from '../../src/sk8script/evaluator/evaluator';
import { tokenize } from '../../src/sk8script/lexer/lexer';
import { parse } from '../../src/sk8script/parser/parser';
import { evaluate } from '../../src/sk8script/evaluator/evaluator';
import { SK8Stage } from '../../src/graphics/SK8Stage';
import { Rectangle, Oval } from '../../src/graphics/shapes';
import { createMockCanvas } from '../utils/test-helpers';

describe('SK8Script Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let evaluator: Evaluator;

  beforeEach(() => {
    canvas = createMockCanvas();
    stage = new SK8Stage(canvas);
    evaluator = new Evaluator();
  });

  describe('Actor Manipulation', () => {
    it('should create actors from scripts', () => {
      const script = `
        set myRect to new Rectangle
        set the left of myRect to 100
        set the top of myRect to 100
        set the width of myRect to 200
        set the height of myRect to 150
      `;

      evaluator.execute(script);

      const myRect = evaluator.getVariable('myRect');
      expect(myRect).toBeDefined();
      expect(myRect.getLeft()).toBe(100);
      expect(myRect.getTop()).toBe(100);
      expect(myRect.getWidth()).toBe(200);
      expect(myRect.getHeight()).toBe(150);
    });

    it('should modify actor properties', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      evaluator.setVariable('rect', rect);

      const script = `
        set the fillColor of rect to "#ff0000"
        set the left of rect to 200
      `;

      evaluator.execute(script);

      expect(rect.getFillColor()).toBe('#ff0000');
      expect(rect.getLeft()).toBe(200);
    });

    it('should call actor methods', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      evaluator.setVariable('rect', rect);

      const script = `
        call setFillColor of rect with "#00ff00"
        call setBounds of rect with {left: 50, top: 50, width: 100, height: 100}
      `;

      evaluator.execute(script);

      expect(rect.getFillColor()).toBe('#00ff00');
      expect(rect.getLeft()).toBe(50);
    });
  });

  describe('Event Handler Integration', () => {
    it('should execute event handlers on events', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const handler = `
        function onClick() {
          set the fillColor of this to "#ff0000"
        }
      `;

      rect.setProperty('onClick', handler);
      evaluator.execute(handler);

      // Simulate click event
      rect.setProperty('fillColor', '#000000');
      evaluator.setVariable('this', rect);
      evaluator.executeFunction('onClick');

      expect(rect.getFillColor()).toBe('#ff0000');
    });

    it('should access event data in handlers', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const handler = `
        function onMouseMove(event) {
          set result to event.x + event.y
          return result
        }
      `;

      evaluator.execute(handler);

      const result = evaluator.executeFunction('onMouseMove', { x: 100, y: 200 });
      expect(result).toBe(300);
    });

    it('should support multiple event handlers', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      evaluator.setVariable('rect', rect);
      evaluator.setVariable('clickCount', 0);

      const script = `
        function onClick() {
          set clickCount to clickCount + 1
        }

        function onMouseEnter() {
          set the fillColor of rect to "#00ff00"
        }

        function onMouseLeave() {
          set the fillColor of rect to "#ff0000"
        }
      `;

      evaluator.execute(script);

      evaluator.executeFunction('onClick');
      evaluator.executeFunction('onClick');
      expect(evaluator.getVariable('clickCount')).toBe(2);

      evaluator.executeFunction('onMouseEnter');
      expect(rect.getFillColor()).toBe('#00ff00');

      evaluator.executeFunction('onMouseLeave');
      expect(rect.getFillColor()).toBe('#ff0000');
    });
  });

  describe('Closure Integration', () => {
    it('should create closures that capture actor references', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });

      evaluator.setVariable('rect', rect);

      const script = `
        function makeAnimator(actor) {
          set startX to the left of actor
          function animate() {
            set the left of actor to startX + 50
          }
          return animate
        }

        set animator to makeAnimator(rect)
      `;

      evaluator.execute(script);

      const animator = evaluator.getVariable('animator');
      expect(typeof animator).toBe('function');

      animator();
      expect(rect.getLeft()).toBe(150);
    });

    it('should maintain closure scope across calls', () => {
      const script = `
        function makeCounter() {
          set count to 0
          function increment() {
            set count to count + 1
            return count
          }
          return increment
        }

        set counter1 to makeCounter()
        set counter2 to makeCounter()
      `;

      evaluator.execute(script);

      const counter1 = evaluator.getVariable('counter1');
      const counter2 = evaluator.getVariable('counter2');

      expect(counter1()).toBe(1);
      expect(counter1()).toBe(2);
      expect(counter2()).toBe(1);
      expect(counter1()).toBe(3);
    });
  });

  describe('Error Handling in Scripts', () => {
    it('should catch and handle runtime errors', () => {
      const script = `
        try {
          set result to 10 / 0
        } catch (error) {
          set errorCaught to true
        }
      `;

      evaluator.execute(script);

      expect(evaluator.getVariable('errorCaught')).toBe(true);
    });

    it('should provide error information', () => {
      const script = `
        try {
          call nonExistentFunction()
        } catch (error) {
          set errorMessage to error.message
        }
      `;

      evaluator.execute(script);

      const errorMessage = evaluator.getVariable('errorMessage');
      expect(errorMessage).toBeDefined();
      expect(typeof errorMessage).toBe('string');
    });

    it('should continue execution after handled errors', () => {
      const script = `
        set count to 0

        try {
          set result to 10 / 0
        } catch (error) {
          set count to 1
        }

        set count to count + 1
      `;

      evaluator.execute(script);

      expect(evaluator.getVariable('count')).toBe(2);
    });
  });

  describe('Standard Library Integration', () => {
    it('should use math functions with actors', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });

      evaluator.setVariable('rect', rect);

      const script = `
        set angle to 45
        set radians to toRadians(angle)
        set newX to cos(radians) * 100
        set newY to sin(radians) * 100
        set the left of rect to newX
        set the top of rect to newY
      `;

      evaluator.execute(script);

      const expectedX = Math.cos((45 * Math.PI) / 180) * 100;
      const expectedY = Math.sin((45 * Math.PI) / 180) * 100;

      expect(rect.getLeft()).toBeCloseTo(expectedX, 2);
      expect(rect.getTop()).toBeCloseTo(expectedY, 2);
    });

    it('should use string functions for object names', () => {
      const rect = new Rectangle();
      rect.setProperty('objectName', 'my_rectangle');

      evaluator.setVariable('rect', rect);

      const script = `
        set name to the objectName of rect
        set upperName to toUpperCase(name)
        set the objectName of rect to upperName
      `;

      evaluator.execute(script);

      expect(rect.getProperty('objectName')).toBe('MY_RECTANGLE');
    });

    it('should use collection functions with multiple actors', () => {
      const rects = [
        new Rectangle(),
        new Rectangle(),
        new Rectangle(),
      ];

      rects.forEach((rect, i) => {
        rect.setProperty('value', i * 10);
        stage.addActor(rect);
      });

      evaluator.setVariable('rects', rects);

      const script = `
        set values to map(rects, function(r) { return the value of r })
        set sum to reduce(values, function(a, b) { return a + b }, 0)
      `;

      evaluator.execute(script);

      expect(evaluator.getVariable('sum')).toBe(30);
    });
  });

  describe('Complex Scripting Scenarios', () => {
    it('should create and manipulate multiple actors', () => {
      const script = `
        set actors to []

        repeat with i from 1 to 5 {
          set rect to new Rectangle
          set the left of rect to i * 100
          set the top of rect to 100
          set the width of rect to 80
          set the height of rect to 80
          append rect to actors
        }

        set count to length(actors)
      `;

      evaluator.execute(script);

      const actors = evaluator.getVariable('actors');
      const count = evaluator.getVariable('count');

      expect(Array.isArray(actors)).toBe(true);
      expect(count).toBe(5);
      expect(actors.every((a: any) => a instanceof Rectangle)).toBe(true);
    });

    it('should implement animation logic in scripts', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 0, top: 0, width: 100, height: 100 });

      evaluator.setVariable('rect', rect);

      const script = `
        function animateRect(time) {
          set progress to time / 1000
          set newX to progress * 500
          set the left of rect to newX
        }
      `;

      evaluator.execute(script);

      const animateRect = evaluator.getVariable('animateRect');

      animateRect(500);
      expect(rect.getLeft()).toBe(250);

      animateRect(1000);
      expect(rect.getLeft()).toBe(500);
    });

    it('should implement collision detection in scripts', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();

      rect1.setBounds({ left: 100, top: 100, width: 100, height: 100 });
      rect2.setBounds({ left: 150, top: 150, width: 100, height: 100 });

      evaluator.setVariable('rect1', rect1);
      evaluator.setVariable('rect2', rect2);

      const script = `
        function checkCollision(r1, r2) {
          set x1 to the left of r1
          set y1 to the top of r1
          set w1 to the width of r1
          set h1 to the height of r1

          set x2 to the left of r2
          set y2 to the top of r2
          set w2 to the width of r2
          set h2 to the height of r2

          if x1 < x2 + w2 and x1 + w1 > x2 and y1 < y2 + h2 and y1 + h1 > y2 {
            return true
          } else {
            return false
          }
        }

        set collision to checkCollision(rect1, rect2)
      `;

      evaluator.execute(script);

      expect(evaluator.getVariable('collision')).toBe(true);
    });
  });

  describe('Performance with Scripts', () => {
    it('should execute large scripts efficiently', () => {
      const script = `
        set sum to 0
        repeat with i from 1 to 1000 {
          set sum to sum + i
        }
      `;

      const startTime = performance.now();
      evaluator.execute(script);
      const elapsed = performance.now() - startTime;

      expect(evaluator.getVariable('sum')).toBe(500500);
      expect(elapsed).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle recursive functions', () => {
      const script = `
        function factorial(n) {
          if n <= 1 {
            return 1
          } else {
            return n * factorial(n - 1)
          }
        }

        set result to factorial(10)
      `;

      evaluator.execute(script);

      expect(evaluator.getVariable('result')).toBe(3628800);
    });
  });

  describe('Script Context Management', () => {
    it('should isolate script contexts', () => {
      const evaluator1 = new Evaluator();
      const evaluator2 = new Evaluator();

      evaluator1.execute('set x to 10');
      evaluator2.execute('set x to 20');

      expect(evaluator1.getVariable('x')).toBe(10);
      expect(evaluator2.getVariable('x')).toBe(20);
    });

    it('should share global context when needed', () => {
      const globalContext = { sharedValue: 42 };

      const evaluator1 = new Evaluator(globalContext);
      const evaluator2 = new Evaluator(globalContext);

      evaluator1.execute('set sharedValue to 100');

      expect(evaluator2.getVariable('sharedValue')).toBe(100);
    });
  });
});
