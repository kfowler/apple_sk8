/**
 * Event Utilities
 *
 * Helper functions for event handling:
 * - debounce: Delay execution until after a quiet period
 * - throttle: Limit execution rate
 * - once: Execute only once
 * - Event simulation utilities for testing
 */

import {
  SK8Event,
  SK8MouseEvent,
  SK8KeyboardEvent,
  SK8TouchEvent,
  TouchPoint,
  SK8CustomEvent,
  EventListener,
} from './SK8Event.js';

/**
 * Debounce function - delays execution until after wait period of inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle function - limits execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(context, args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * Create a one-time event listener wrapper
 */
export function once(listener: EventListener): EventListener {
  let called = false;

  return function (this: any, event: SK8Event) {
    if (!called) {
      called = true;
      listener.call(this, event);
    }
  };
}

/**
 * Event simulation utilities for testing
 */
export class EventSimulator {
  /**
   * Simulate a mouse event
   */
  static simulateMouseEvent(
    type: string,
    x: number,
    y: number,
    button: number = 0
  ): SK8MouseEvent {
    const nativeEvent = new MouseEvent(type, {
      clientX: x,
      clientY: y,
      button,
      bubbles: true,
      cancelable: true,
    });

    return new SK8MouseEvent(type, x, y, nativeEvent);
  }

  /**
   * Simulate a keyboard event
   */
  static simulateKeyboardEvent(
    type: string,
    key: string,
    code: string,
    modifiers: {
      shift?: boolean;
      ctrl?: boolean;
      alt?: boolean;
      meta?: boolean;
    } = {}
  ): SK8KeyboardEvent {
    const nativeEvent = new KeyboardEvent(type, {
      key,
      code,
      shiftKey: modifiers.shift || false,
      ctrlKey: modifiers.ctrl || false,
      altKey: modifiers.alt || false,
      metaKey: modifiers.meta || false,
      bubbles: true,
      cancelable: true,
    });

    return new SK8KeyboardEvent(type, nativeEvent);
  }

  /**
   * Simulate a touch event
   */
  static simulateTouchEvent(
    type: string,
    touches: Array<{ x: number; y: number; id?: number }>
  ): SK8TouchEvent {
    const touchPoints: TouchPoint[] = touches.map((t, index) => ({
      identifier: t.id ?? index,
      x: t.x,
      y: t.y,
      clientX: t.x,
      clientY: t.y,
    }));

    return new SK8TouchEvent(type, touchPoints, touchPoints);
  }

  /**
   * Simulate a click (mousedown + mouseup + click)
   */
  static simulateClick(x: number, y: number): SK8MouseEvent[] {
    return [
      this.simulateMouseEvent('mousedown', x, y),
      this.simulateMouseEvent('mouseup', x, y),
      this.simulateMouseEvent('click', x, y),
    ];
  }

  /**
   * Simulate a double-click
   */
  static simulateDoubleClick(x: number, y: number): SK8MouseEvent[] {
    return [
      ...this.simulateClick(x, y),
      ...this.simulateClick(x, y),
      this.simulateMouseEvent('dblclick', x, y),
    ];
  }

  /**
   * Simulate a drag operation
   */
  static simulateDrag(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    steps: number = 10
  ): SK8MouseEvent[] {
    const events: SK8MouseEvent[] = [];

    // Mouse down at start
    events.push(this.simulateMouseEvent('mousedown', startX, startY));

    // Mouse move in steps
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      events.push(this.simulateMouseEvent('mousemove', x, y));
    }

    // Mouse up at end
    events.push(this.simulateMouseEvent('mouseup', endX, endY));

    return events;
  }

  /**
   * Simulate a swipe gesture
   */
  static simulateSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 300
  ): SK8TouchEvent[] {
    const events: SK8TouchEvent[] = [];

    const touch = { x: startX, y: startY, id: 1 };

    // Touch start
    events.push(this.simulateTouchEvent('touchstart', [touch]));

    // Touch move (simulate 60fps)
    const steps = Math.ceil((duration / 1000) * 60);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      touch.x = startX + (endX - startX) * t;
      touch.y = startY + (endY - startY) * t;
      events.push(this.simulateTouchEvent('touchmove', [touch]));
    }

    // Touch end
    touch.x = endX;
    touch.y = endY;
    events.push(this.simulateTouchEvent('touchend', [touch]));

    return events;
  }

  /**
   * Simulate a pinch gesture
   */
  static simulatePinch(
    centerX: number,
    centerY: number,
    startDistance: number,
    endDistance: number,
    steps: number = 10
  ): SK8TouchEvent[] {
    const events: SK8TouchEvent[] = [];

    const touch1 = { x: centerX - startDistance / 2, y: centerY, id: 1 };
    const touch2 = { x: centerX + startDistance / 2, y: centerY, id: 2 };

    // Touch start
    events.push(this.simulateTouchEvent('touchstart', [touch1, touch2]));

    // Touch move
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const distance = startDistance + (endDistance - startDistance) * t;
      touch1.x = centerX - distance / 2;
      touch2.x = centerX + distance / 2;
      events.push(this.simulateTouchEvent('touchmove', [touch1, touch2]));
    }

    // Touch end
    events.push(this.simulateTouchEvent('touchend', [touch1, touch2]));

    return events;
  }
}

/**
 * Create a custom event
 */
export function createCustomEvent<T = any>(
  type: string,
  detail: T
): SK8CustomEvent<T> {
  return new SK8CustomEvent(type, detail);
}

/**
 * Wait for an event (returns a promise)
 */
export function waitForEvent(
  target: { addEventListener: any; removeEventListener: any },
  eventType: string,
  timeout?: number
): Promise<SK8Event> {
  return new Promise((resolve, reject) => {
    let timeoutId: number | null = null;

    const handler = (event: SK8Event) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      target.removeEventListener(eventType, handler);
      resolve(event);
    };

    target.addEventListener(eventType, handler);

    if (timeout) {
      timeoutId = window.setTimeout(() => {
        target.removeEventListener(eventType, handler);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);
    }
  });
}

/**
 * Delegate event handling to child elements
 */
export function delegate(
  selector: (target: any) => boolean,
  handler: EventListener
): EventListener {
  return function (this: any, event: SK8Event) {
    let target = event.target;

    while (target && target !== event.currentTarget) {
      if (selector(target)) {
        handler.call(target, event);
        return;
      }
      target = (target as any).getParent?.();
    }
  };
}
