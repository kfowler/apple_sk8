/**
 * Test helper utilities
 * Provides factory functions and common utilities for creating test fixtures
 */

import { SK8Object } from '../../src/core/SK8Object';
import { SK8Actor } from '../../src/graphics/SK8Actor';
import { SK8Stage } from '../../src/graphics/SK8Stage';
import { Rectangle } from '../../src/graphics/shapes';
import type { Color, Point, Rect } from '../../src/graphics/types';

/**
 * Creates a mock canvas context for testing
 */
export function createMockCanvas(width: number = 800, height: number = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Creates a mock CanvasRenderingContext2D with all required methods
 */
export function createMockContext(): CanvasRenderingContext2D {
  const canvas = createMockCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }
  return ctx;
}

/**
 * Creates a test stage with optional configuration
 */
export function createTestStage(options: {
  width?: number;
  height?: number;
  canvas?: HTMLCanvasElement;
} = {}): SK8Stage {
  const canvas = options.canvas || createMockCanvas(options.width, options.height);
  const stage = new SK8Stage(canvas);
  return stage;
}

/**
 * Creates a test actor with common defaults
 */
export function createTestActor(props: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fillColor?: Color;
  name?: string;
} = {}): SK8Actor {
  const actor = new SK8Actor();
  actor.setBounds({
    left: props.left ?? 100,
    top: props.top ?? 100,
    width: props.width ?? 200,
    height: props.height ?? 150,
  });
  if (props.fillColor) {
    actor.setFillColor(props.fillColor);
  }
  if (props.name) {
    actor.setProperty('objectName', props.name);
  }
  return actor;
}

/**
 * Creates a test rectangle shape
 */
export function createTestRectangle(props: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fillColor?: Color;
} = {}): Rectangle {
  const rect = new Rectangle();
  rect.setBounds({
    left: props.left ?? 50,
    top: props.top ?? 50,
    width: props.width ?? 100,
    height: props.height ?? 100,
  });
  if (props.fillColor) {
    rect.setFillColor(props.fillColor);
  }
  return rect;
}

/**
 * Waits for a condition to become true within a timeout
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout exceeded');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Simulates a mouse event at a specific position
 */
export function simulateMouseEvent(
  target: HTMLElement,
  type: string,
  options: {
    clientX?: number;
    clientY?: number;
    button?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  } = {}
): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    button: options.button ?? 0,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
  });
  target.dispatchEvent(event);
  return event;
}

/**
 * Simulates a keyboard event
 */
export function simulateKeyboardEvent(
  target: HTMLElement,
  type: string,
  options: {
    key?: string;
    code?: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key: options.key ?? '',
    code: options.code ?? '',
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
  });
  target.dispatchEvent(event);
  return event;
}

/**
 * Creates a promise that resolves after a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mocks animation frame for testing
 */
export class AnimationFrameMock {
  private callbacks: Map<number, FrameRequestCallback> = new Map();
  private nextId = 1;
  private currentTime = 0;

  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  cancelAnimationFrame(id: number): void {
    this.callbacks.delete(id);
  }

  tick(deltaTime: number = 16): void {
    this.currentTime += deltaTime;
    const callbacks = Array.from(this.callbacks.entries());
    this.callbacks.clear();
    for (const [, callback] of callbacks) {
      callback(this.currentTime);
    }
  }

  install(): void {
    (global as any).requestAnimationFrame = this.requestAnimationFrame.bind(this);
    (global as any).cancelAnimationFrame = this.cancelAnimationFrame.bind(this);
  }

  uninstall(): void {
    (global as any).requestAnimationFrame = undefined;
    (global as any).cancelAnimationFrame = undefined;
  }
}

/**
 * Measures the execution time of a function
 */
export async function measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  return { result, time };
}

/**
 * Generates random test data
 */
export const random = {
  int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  float(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  boolean(): boolean {
    return Math.random() < 0.5;
  },

  string(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[this.int(0, chars.length - 1)]).join('');
  },

  color(): Color {
    return `rgb(${this.int(0, 255)}, ${this.int(0, 255)}, ${this.int(0, 255)})`;
  },

  point(maxX: number = 800, maxY: number = 600): Point {
    return { x: this.float(0, maxX), y: this.float(0, maxY) };
  },

  rect(maxWidth: number = 800, maxHeight: number = 600): Rect {
    const left = this.float(0, maxWidth - 100);
    const top = this.float(0, maxHeight - 100);
    return {
      left,
      top,
      width: this.float(10, maxWidth - left),
      height: this.float(10, maxHeight - top),
    };
  },
};

/**
 * Creates a spy function that tracks calls
 */
export class Spy<T extends (...args: any[]) => any> {
  public calls: Array<{ args: Parameters<T>; result: ReturnType<T> | Error }> = [];
  private implementation?: T;

  constructor(implementation?: T) {
    this.implementation = implementation;
  }

  fn = ((...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = this.implementation ? this.implementation(...args) : undefined;
      this.calls.push({ args, result });
      return result;
    } catch (error) {
      this.calls.push({ args, result: error as Error });
      throw error;
    }
  }) as T;

  wasCalled(): boolean {
    return this.calls.length > 0;
  }

  wasCalledWith(...args: Parameters<T>): boolean {
    return this.calls.some((call) => JSON.stringify(call.args) === JSON.stringify(args));
  }

  callCount(): number {
    return this.calls.length;
  }

  reset(): void {
    this.calls = [];
  }
}
