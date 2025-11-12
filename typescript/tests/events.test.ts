/**
 * Tests for SK8 Event System
 *
 * Comprehensive tests covering:
 * - Event propagation (bubbling/capturing)
 * - Mouse, keyboard, touch events
 * - Drag and drop
 * - Gestures
 * - Event utilities
 */

import {
  SK8MouseEvent,
  SK8KeyboardEvent,
  SK8TouchEvent,
  SK8DragEvent,
  SK8CustomEvent,
  MouseButton,
} from '../src/events/SK8Event';
import { DragDropManager, DragConstraints } from '../src/events/drag-drop';
import { GestureRecognizer } from '../src/events/gestures';
import {
  debounce,
  throttle,
  once,
  EventSimulator,
  createCustomEvent,
} from '../src/events/event-utils';
import { SK8Rectangle } from '../src/graphics/shapes';

describe('SK8Event Base Class', () => {
  test('creates event with type and timestamp', () => {
    const event = new SK8MouseEvent('click', 10, 20);
    expect(event.type).toBe('click');
    expect(event.timestamp).toBeGreaterThan(0);
  });

  test('stopPropagation prevents further propagation', () => {
    const event = new SK8MouseEvent('click', 10, 20);
    expect(event.propagationStopped).toBe(false);

    event.stopPropagation();
    expect(event.propagationStopped).toBe(true);
  });

  test('stopImmediatePropagation prevents immediate propagation', () => {
    const event = new SK8MouseEvent('click', 10, 20);
    expect(event.immediatePropagationStopped).toBe(false);

    event.stopImmediatePropagation();
    expect(event.immediatePropagationStopped).toBe(true);
    expect(event.propagationStopped).toBe(true);
  });

  test('preventDefault marks event as prevented', () => {
    const event = new SK8MouseEvent('click', 10, 20);
    expect(event.defaultPrevented).toBe(false);

    event.preventDefault();
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('SK8MouseEvent', () => {
  test('creates mouse event with position', () => {
    const event = new SK8MouseEvent('click', 100, 200);
    expect(event.type).toBe('click');
    expect(event.x).toBe(100);
    expect(event.y).toBe(200);
  });

  test('includes modifier keys from native event', () => {
    const nativeEvent = new MouseEvent('click', {
      clientX: 100,
      clientY: 200,
      shiftKey: true,
      ctrlKey: false,
      altKey: true,
      metaKey: false,
    });

    const event = new SK8MouseEvent('click', 100, 200, nativeEvent);
    expect(event.shiftKey).toBe(true);
    expect(event.ctrlKey).toBe(false);
    expect(event.altKey).toBe(true);
    expect(event.metaKey).toBe(false);
  });

  test('includes button information', () => {
    const nativeEvent = new MouseEvent('mousedown', {
      button: MouseButton.RIGHT,
    });

    const event = new SK8MouseEvent('mousedown', 0, 0, nativeEvent);
    expect(event.button).toBe(MouseButton.RIGHT);
  });
});

describe('SK8KeyboardEvent', () => {
  test('creates keyboard event from native event', () => {
    const nativeEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      shiftKey: false,
      ctrlKey: false,
    });

    const event = new SK8KeyboardEvent('keydown', nativeEvent);
    expect(event.type).toBe('keydown');
    expect(event.key).toBe('a');
    expect(event.code).toBe('KeyA');
  });

  test('includes modifier keys', () => {
    const nativeEvent = new KeyboardEvent('keydown', {
      key: 'A',
      code: 'KeyA',
      shiftKey: true,
      ctrlKey: true,
      altKey: false,
      metaKey: false,
    });

    const event = new SK8KeyboardEvent('keydown', nativeEvent);
    expect(event.shiftKey).toBe(true);
    expect(event.ctrlKey).toBe(true);
    expect(event.altKey).toBe(false);
    expect(event.metaKey).toBe(false);
  });
});

describe('SK8TouchEvent', () => {
  test('creates touch event with touch points', () => {
    const touches = [
      { identifier: 1, x: 10, y: 20, clientX: 10, clientY: 20 },
      { identifier: 2, x: 30, y: 40, clientX: 30, clientY: 40 },
    ];

    const event = new SK8TouchEvent('touchstart', touches, touches);
    expect(event.type).toBe('touchstart');
    expect(event.touches).toHaveLength(2);
    expect(event.touches[0].x).toBe(10);
    expect(event.touches[1].x).toBe(30);
  });
});

describe('SK8DragEvent', () => {
  test('creates drag event with actor and delta', () => {
    const actor = new SK8Rectangle();
    const event = new SK8DragEvent('drag', 100, 100, 10, 15, actor);

    expect(event.type).toBe('drag');
    expect(event.x).toBe(100);
    expect(event.y).toBe(100);
    expect(event.deltaX).toBe(10);
    expect(event.deltaY).toBe(15);
    expect(event.draggedActor).toBe(actor);
  });
});

describe('SK8CustomEvent', () => {
  test('creates custom event with detail data', () => {
    const detail = { foo: 'bar', count: 42 };
    const event = new SK8CustomEvent('myevent', detail);

    expect(event.type).toBe('myevent');
    expect(event.detail).toEqual(detail);
  });
});

describe('Event Listeners and Dispatching', () => {
  let actor: SK8Rectangle;

  beforeEach(() => {
    actor = new SK8Rectangle();
  });

  test('addEventListener adds listener', () => {
    const handler = jest.fn();
    actor.addEventListener('click', handler);

    const event = new SK8MouseEvent('click', 10, 10);
    actor.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  test('removeEventListener removes listener', () => {
    const handler = jest.fn();
    actor.addEventListener('click', handler);
    actor.removeEventListener('click', handler);

    const event = new SK8MouseEvent('click', 10, 10);
    actor.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  test('once option removes listener after first call', () => {
    const handler = jest.fn();
    actor.addEventListener('click', handler, { once: true });

    const event1 = new SK8MouseEvent('click', 10, 10);
    const event2 = new SK8MouseEvent('click', 20, 20);

    actor.dispatchEvent(event1);
    actor.dispatchEvent(event2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event1);
  });

  test('multiple listeners are called in order', () => {
    const calls: number[] = [];
    const handler1 = jest.fn(() => calls.push(1));
    const handler2 = jest.fn(() => calls.push(2));
    const handler3 = jest.fn(() => calls.push(3));

    actor.addEventListener('click', handler1);
    actor.addEventListener('click', handler2);
    actor.addEventListener('click', handler3);

    const event = new SK8MouseEvent('click', 10, 10);
    actor.dispatchEvent(event);

    expect(calls).toEqual([1, 2, 3]);
  });

  test('stopImmediatePropagation prevents other listeners', () => {
    const handler1 = jest.fn((e) => e.stopImmediatePropagation());
    const handler2 = jest.fn();

    actor.addEventListener('click', handler1);
    actor.addEventListener('click', handler2);

    const event = new SK8MouseEvent('click', 10, 10);
    actor.dispatchEvent(event);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});

describe('Drag and Drop System', () => {
  let dragDropManager: DragDropManager;
  let actor: SK8Rectangle;

  beforeEach(() => {
    dragDropManager = new DragDropManager();
    actor = new SK8Rectangle();
    actor.setDraggable(true);
    actor.moveTo(50, 50);
    actor.setWidth(100);
    actor.setHeight(100);
  });

  test('starts drag on draggable actor', () => {
    const handler = jest.fn();
    actor.addEventListener('dragstart', handler);

    dragDropManager.startDrag(actor, 75, 75);

    expect(dragDropManager.isDragging()).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  test('does not start drag on non-draggable actor', () => {
    actor.setDraggable(false);
    dragDropManager.startDrag(actor, 75, 75);

    expect(dragDropManager.isDragging()).toBe(false);
  });

  test('updates drag position', () => {
    const dragHandler = jest.fn();
    actor.addEventListener('drag', dragHandler);

    dragDropManager.startDrag(actor, 75, 75);
    dragDropManager.updateDrag(85, 95);

    expect(dragHandler).toHaveBeenCalled();
    const bounds = actor.getBoundsRect();
    expect(bounds.left).toBe(60); // Moved 10 pixels right
    expect(bounds.top).toBe(70); // Moved 20 pixels down
  });

  test('ends drag', () => {
    const endHandler = jest.fn();
    actor.addEventListener('dragend', endHandler);

    dragDropManager.startDrag(actor, 75, 75);
    dragDropManager.endDrag(85, 95);

    expect(dragDropManager.isDragging()).toBe(false);
    expect(endHandler).toHaveBeenCalled();
  });

  test('cancels drag and returns to original position', () => {
    dragDropManager.startDrag(actor, 75, 75);
    dragDropManager.updateDrag(100, 100);
    dragDropManager.cancelDrag();

    const bounds = actor.getBoundsRect();
    expect(bounds.left).toBe(50); // Back to original
    expect(bounds.top).toBe(50);
    expect(dragDropManager.isDragging()).toBe(false);
  });

  test('constrains drag to horizontal only', () => {
    const constraints: DragConstraints = { horizontal: true };
    dragDropManager.startDrag(actor, 75, 75, constraints);
    dragDropManager.updateDrag(100, 100);

    const bounds = actor.getBoundsRect();
    expect(bounds.left).toBe(75); // Moved horizontally
    expect(bounds.top).toBe(50); // No vertical movement
  });

  test('constrains drag to vertical only', () => {
    const constraints: DragConstraints = { vertical: true };
    dragDropManager.startDrag(actor, 75, 75, constraints);
    dragDropManager.updateDrag(100, 100);

    const bounds = actor.getBoundsRect();
    expect(bounds.left).toBe(50); // No horizontal movement
    expect(bounds.top).toBe(75); // Moved vertically
  });

  test('snap to grid constraint', () => {
    const constraints: DragConstraints = { snapToGrid: 20 };
    dragDropManager.startDrag(actor, 75, 75, constraints);
    dragDropManager.updateDrag(87, 92); // Would be 62, 67 without snap

    const bounds = actor.getBoundsRect();
    expect(bounds.left).toBe(60); // Snapped to 20px grid
    expect(bounds.top).toBe(60);
  });

  test('drop on drop target', () => {
    const dropTarget = new SK8Rectangle();
    dropTarget.setDroppable(true);
    dropTarget.moveTo(200, 200);
    dropTarget.setWidth(100);
    dropTarget.setHeight(100);

    dragDropManager.registerDropTarget(dropTarget);

    const dropHandler = jest.fn();
    dropTarget.addEventListener('drop', dropHandler);

    dragDropManager.startDrag(actor, 75, 75);
    dragDropManager.endDrag(250, 250); // Inside drop target

    expect(dropHandler).toHaveBeenCalled();
  });

  test('dragEnter and dragLeave events', () => {
    const dropTarget = new SK8Rectangle();
    dropTarget.setDroppable(true);
    dropTarget.moveTo(200, 200);
    dropTarget.setWidth(100);
    dropTarget.setHeight(100);

    dragDropManager.registerDropTarget(dropTarget);

    const enterHandler = jest.fn();
    const leaveHandler = jest.fn();
    dropTarget.addEventListener('dragenter', enterHandler);
    dropTarget.addEventListener('dragleave', leaveHandler);

    dragDropManager.startDrag(actor, 75, 75);
    dragDropManager.updateDrag(250, 250); // Enter drop target
    expect(enterHandler).toHaveBeenCalled();

    dragDropManager.updateDrag(100, 100); // Leave drop target
    expect(leaveHandler).toHaveBeenCalled();
  });
});

describe('Gesture Recognition', () => {
  let recognizer: GestureRecognizer;
  let gestures: any[] = [];

  beforeEach(() => {
    recognizer = new GestureRecognizer();
    gestures = [];
    recognizer.onGesture((gesture) => gestures.push(gesture));
  });

  test('recognizes tap gesture', (done) => {
    const touch = { identifier: 1, x: 100, y: 100, clientX: 100, clientY: 100 };

    recognizer.touchStart([touch]);

    setTimeout(() => {
      recognizer.touchEnd([touch], []);

      expect(gestures).toHaveLength(1);
      expect(gestures[0].type).toBe('tap');
      expect(gestures[0].x).toBe(100);
      expect(gestures[0].y).toBe(100);
      done();
    }, 100);
  });

  test('recognizes double-tap gesture', (done) => {
    const touch = { identifier: 1, x: 100, y: 100, clientX: 100, clientY: 100 };

    // First tap
    recognizer.touchStart([touch]);
    setTimeout(() => {
      recognizer.touchEnd([touch], []);

      // Second tap
      setTimeout(() => {
        recognizer.touchStart([touch]);
        setTimeout(() => {
          recognizer.touchEnd([touch], []);

          const doubleTaps = gestures.filter((g) => g.type === 'doubletap');
          expect(doubleTaps).toHaveLength(1);
          done();
        }, 50);
      }, 50);
    }, 50);
  });

  test('recognizes long press gesture', (done) => {
    const touch = { identifier: 1, x: 100, y: 100, clientX: 100, clientY: 100 };

    recognizer.touchStart([touch]);

    setTimeout(() => {
      expect(gestures).toHaveLength(1);
      expect(gestures[0].type).toBe('longpress');
      done();
    }, 600); // Longer than LONG_PRESS_THRESHOLD
  });

  test('recognizes swipe gesture', (done) => {
    const touch = { identifier: 1, x: 100, y: 100, clientX: 100, clientY: 100 };

    recognizer.touchStart([touch]);

    setTimeout(() => {
      touch.x = 200; // Move right
      recognizer.touchEnd([touch], []);

      const swipes = gestures.filter((g) => g.type === 'swipe');
      expect(swipes).toHaveLength(1);
      expect(swipes[0].direction).toBe('right');
      done();
    }, 100);
  });

  test('recognizes pinch gesture', () => {
    const touch1 = { identifier: 1, x: 100, y: 100, clientX: 100, clientY: 100 };
    const touch2 = { identifier: 2, x: 200, y: 100, clientX: 200, clientY: 100 };

    recognizer.touchStart([touch1, touch2]);

    // Move fingers closer (pinch in)
    touch1.x = 120;
    touch2.x = 180;
    recognizer.touchMove([touch1, touch2]);

    const pinches = gestures.filter((g) => g.type === 'pinch');
    expect(pinches.length).toBeGreaterThan(0);
    expect(pinches[0].scale).toBeLessThan(1); // Pinching in
  });

  test('recognizes rotate gesture', () => {
    const touch1 = { identifier: 1, x: 100, y: 100, clientX: 100, clientY: 100 };
    const touch2 = { identifier: 2, x: 200, y: 100, clientX: 200, clientY: 100 };

    recognizer.touchStart([touch1, touch2]);

    // Rotate touches
    touch1.y = 150;
    touch2.y = 50;
    recognizer.touchMove([touch1, touch2]);

    const rotations = gestures.filter((g) => g.type === 'rotate');
    expect(rotations.length).toBeGreaterThan(0);
    expect(rotations[0].rotation).toBeDefined();
  });
});

describe('Event Utilities', () => {
  describe('debounce', () => {
    jest.useFakeTimers();

    test('delays execution until after quiet period', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    test('limits execution rate', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  describe('once', () => {
    test('executes handler only once', () => {
      const fn = jest.fn();
      const onceHandler = once(fn);

      const event1 = new SK8MouseEvent('click', 10, 10);
      const event2 = new SK8MouseEvent('click', 20, 20);

      onceHandler(event1);
      onceHandler(event2);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(event1);
    });
  });

  describe('EventSimulator', () => {
    test('simulates mouse event', () => {
      const event = EventSimulator.simulateMouseEvent('click', 100, 200);

      expect(event.type).toBe('click');
      expect(event.x).toBe(100);
      expect(event.y).toBe(200);
    });

    test('simulates keyboard event', () => {
      const event = EventSimulator.simulateKeyboardEvent(
        'keydown',
        'a',
        'KeyA',
        { shift: true }
      );

      expect(event.type).toBe('keydown');
      expect(event.key).toBe('a');
      expect(event.code).toBe('KeyA');
      expect(event.shiftKey).toBe(true);
    });

    test('simulates click sequence', () => {
      const events = EventSimulator.simulateClick(100, 200);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('mousedown');
      expect(events[1].type).toBe('mouseup');
      expect(events[2].type).toBe('click');
    });

    test('simulates drag operation', () => {
      const events = EventSimulator.simulateDrag(0, 0, 100, 100, 5);

      expect(events[0].type).toBe('mousedown');
      expect(events[events.length - 1].type).toBe('mouseup');

      // Check intermediate positions
      const moveEvents = events.filter((e) => e.type === 'mousemove');
      expect(moveEvents.length).toBeGreaterThan(0);
    });

    test('simulates swipe gesture', () => {
      const events = EventSimulator.simulateSwipe(0, 0, 100, 0, 300);

      expect(events[0].type).toBe('touchstart');
      expect(events[events.length - 1].type).toBe('touchend');

      const moveEvents = events.filter((e) => e.type === 'touchmove');
      expect(moveEvents.length).toBeGreaterThan(0);
    });

    test('simulates pinch gesture', () => {
      const events = EventSimulator.simulatePinch(100, 100, 100, 50, 5);

      expect(events[0].type).toBe('touchstart');
      expect(events[0].touches).toHaveLength(2);
      expect(events[events.length - 1].type).toBe('touchend');
    });
  });

  describe('createCustomEvent', () => {
    test('creates custom event with detail', () => {
      const detail = { message: 'Hello' };
      const event = createCustomEvent('myevent', detail);

      expect(event.type).toBe('myevent');
      expect(event.detail).toEqual(detail);
    });
  });
});

describe('Event Integration Tests', () => {
  test('complete drag-and-drop workflow', () => {
    const actor = new SK8Rectangle();
    actor.setDraggable(true);
    actor.moveTo(0, 0);
    actor.setWidth(50);
    actor.setHeight(50);

    const dropTarget = new SK8Rectangle();
    dropTarget.setDroppable(true);
    dropTarget.moveTo(100, 100);
    dropTarget.setWidth(50);
    dropTarget.setHeight(50);

    const manager = new DragDropManager();
    manager.registerDropTarget(dropTarget);

    const dragStarted = jest.fn();
    const dragging = jest.fn();
    const dragEnded = jest.fn();
    const dropped = jest.fn();

    actor.addEventListener('dragstart', dragStarted);
    actor.addEventListener('drag', dragging);
    actor.addEventListener('dragend', dragEnded);
    dropTarget.addEventListener('drop', dropped);

    // Start drag
    manager.startDrag(actor, 25, 25);
    expect(dragStarted).toHaveBeenCalled();

    // Drag to drop target
    manager.updateDrag(125, 125);
    expect(dragging).toHaveBeenCalled();

    // Drop
    manager.endDrag(125, 125);
    expect(dragEnded).toHaveBeenCalled();
    expect(dropped).toHaveBeenCalled();
  });

  test('keyboard navigation with arrow keys', () => {
    const actor = new SK8Rectangle();
    actor.moveTo(100, 100);

    const moveHandler = jest.fn((e) => {
      const keyEvent = e as SK8KeyboardEvent;
      switch (keyEvent.key) {
        case 'ArrowLeft':
          actor.moveBy(-10, 0);
          break;
        case 'ArrowRight':
          actor.moveBy(10, 0);
          break;
        case 'ArrowUp':
          actor.moveBy(0, -10);
          break;
        case 'ArrowDown':
          actor.moveBy(0, 10);
          break;
      }
    });

    actor.addEventListener('keydown', moveHandler);

    // Simulate arrow key presses
    const leftKey = EventSimulator.simulateKeyboardEvent(
      'keydown',
      'ArrowLeft',
      'ArrowLeft'
    );
    const rightKey = EventSimulator.simulateKeyboardEvent(
      'keydown',
      'ArrowRight',
      'ArrowRight'
    );

    actor.dispatchEvent(leftKey);
    expect(actor.getLeft()).toBe(90);

    actor.dispatchEvent(rightKey);
    expect(actor.getLeft()).toBe(100);
  });
});
