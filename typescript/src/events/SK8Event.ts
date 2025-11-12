/**
 * SK8Event - Base event class for the SK8 event system
 *
 * Provides comprehensive event handling with bubbling, capturing, and target phases.
 * Inspired by DOM Event API but tailored for SK8.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';

/**
 * Event phases during propagation
 */
export enum EventPhase {
  NONE = 0,
  CAPTURING = 1,
  AT_TARGET = 2,
  BUBBLING = 3,
}

/**
 * Base class for all SK8 events
 */
export abstract class SK8Event {
  readonly type: string;
  readonly timestamp: number;

  target: SK8Actor | null = null;
  currentTarget: SK8Actor | null = null;
  phase: EventPhase = EventPhase.NONE;

  private _propagationStopped = false;
  private _immediatePropagationStopped = false;
  private _defaultPrevented = false;

  protected constructor(type: string) {
    this.type = type;
    this.timestamp = Date.now();
  }

  /**
   * Stop event propagation (prevents bubbling/capturing to parent/children)
   */
  stopPropagation(): void {
    this._propagationStopped = true;
  }

  /**
   * Stop immediate propagation (also prevents other handlers on current target)
   */
  stopImmediatePropagation(): void {
    this._propagationStopped = true;
    this._immediatePropagationStopped = true;
  }

  /**
   * Prevent default action
   */
  preventDefault(): void {
    this._defaultPrevented = true;
  }

  /**
   * Check if propagation was stopped
   */
  get propagationStopped(): boolean {
    return this._propagationStopped;
  }

  /**
   * Check if immediate propagation was stopped
   */
  get immediatePropagationStopped(): boolean {
    return this._immediatePropagationStopped;
  }

  /**
   * Check if default was prevented
   */
  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }
}

/**
 * Mouse button enumeration
 */
export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
  BACK = 3,
  FORWARD = 4,
}

/**
 * Mouse event
 */
export class SK8MouseEvent extends SK8Event {
  readonly x: number;
  readonly y: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly button: MouseButton;
  readonly buttons: number;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;

  constructor(type: string, x: number, y: number, nativeEvent?: MouseEvent) {
    super(type);
    this.x = x;
    this.y = y;
    this.clientX = nativeEvent?.clientX ?? x;
    this.clientY = nativeEvent?.clientY ?? y;
    this.button = nativeEvent?.button ?? MouseButton.LEFT;
    this.buttons = nativeEvent?.buttons ?? 0;
    this.shiftKey = nativeEvent?.shiftKey ?? false;
    this.ctrlKey = nativeEvent?.ctrlKey ?? false;
    this.altKey = nativeEvent?.altKey ?? false;
    this.metaKey = nativeEvent?.metaKey ?? false;
  }
}

/**
 * Keyboard event
 */
export class SK8KeyboardEvent extends SK8Event {
  readonly key: string;
  readonly code: string;
  readonly keyCode: number;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly repeat: boolean;

  constructor(type: string, nativeEvent: KeyboardEvent) {
    super(type);
    this.key = nativeEvent.key;
    this.code = nativeEvent.code;
    this.keyCode = nativeEvent.keyCode;
    this.shiftKey = nativeEvent.shiftKey;
    this.ctrlKey = nativeEvent.ctrlKey;
    this.altKey = nativeEvent.altKey;
    this.metaKey = nativeEvent.metaKey;
    this.repeat = nativeEvent.repeat;
  }
}

/**
 * Touch point information
 */
export interface TouchPoint {
  identifier: number;
  x: number;
  y: number;
  clientX: number;
  clientY: number;
}

/**
 * Touch event
 */
export class SK8TouchEvent extends SK8Event {
  readonly touches: TouchPoint[];
  readonly changedTouches: TouchPoint[];
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;

  constructor(
    type: string,
    touches: TouchPoint[],
    changedTouches: TouchPoint[],
    nativeEvent?: TouchEvent
  ) {
    super(type);
    this.touches = touches;
    this.changedTouches = changedTouches;
    this.shiftKey = nativeEvent?.shiftKey ?? false;
    this.ctrlKey = nativeEvent?.ctrlKey ?? false;
    this.altKey = nativeEvent?.altKey ?? false;
    this.metaKey = nativeEvent?.metaKey ?? false;
  }
}

/**
 * Drag event
 */
export class SK8DragEvent extends SK8Event {
  readonly x: number;
  readonly y: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly draggedActor: SK8Actor;

  constructor(
    type: string,
    x: number,
    y: number,
    deltaX: number,
    deltaY: number,
    draggedActor: SK8Actor
  ) {
    super(type);
    this.x = x;
    this.y = y;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.draggedActor = draggedActor;
  }
}

/**
 * Custom event with arbitrary data
 */
export class SK8CustomEvent<T = any> extends SK8Event {
  readonly detail: T;

  constructor(type: string, detail: T) {
    super(type);
    this.detail = detail;
  }
}

/**
 * Event listener function type
 */
export type EventListener = (event: SK8Event) => void;

/**
 * Event listener options
 */
export interface EventListenerOptions {
  capture?: boolean;
  once?: boolean;
}

/**
 * Internal event listener entry
 */
export interface EventListenerEntry {
  listener: EventListener;
  options: EventListenerOptions;
}
