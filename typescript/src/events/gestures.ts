/**
 * Gesture Recognition System
 *
 * Recognizes common touch gestures:
 * - Tap and double-tap
 * - Long press
 * - Swipe (with direction and velocity)
 * - Pinch (for zoom)
 * - Rotate (two-finger rotation)
 */

import { TouchPoint } from './SK8Event.js';

/**
 * Gesture types
 */
export type GestureType = 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pinch' | 'rotate';

/**
 * Swipe direction
 */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Gesture data
 */
export interface GestureData {
  type: GestureType;
  x: number;
  y: number;
  // Swipe-specific
  direction?: SwipeDirection;
  velocity?: number;
  distance?: number;
  // Pinch-specific
  scale?: number;
  // Rotate-specific
  rotation?: number; // in degrees
}

/**
 * Gesture recognizer
 */
export class GestureRecognizer {
  private tapTimeout: number | null = null;
  private longPressTimeout: number | null = null;
  private lastTapTime: number = 0;
  private lastTapX: number = 0;
  private lastTapY: number = 0;

  // Touch tracking
  private touchStartData: Map<number, { x: number; y: number; time: number }> = new Map();
  private initialPinchDistance: number = 0;
  private initialRotation: number = 0;

  // Configuration
  private readonly TAP_THRESHOLD = 300; // ms
  private readonly DOUBLE_TAP_THRESHOLD = 300; // ms between taps
  private readonly LONG_PRESS_THRESHOLD = 500; // ms
  private readonly SWIPE_THRESHOLD = 50; // pixels
  private readonly SWIPE_VELOCITY_THRESHOLD = 0.3; // pixels/ms
  private readonly TAP_MOVE_THRESHOLD = 10; // pixels

  private gestureCallback?: (gesture: GestureData) => void;

  /**
   * Set callback for gesture events
   */
  onGesture(callback: (gesture: GestureData) => void): void {
    this.gestureCallback = callback;
  }

  /**
   * Handle touch start
   */
  touchStart(touches: TouchPoint[]): void {
    const now = Date.now();

    // Store touch start info
    for (const touch of touches) {
      this.touchStartData.set(touch.identifier, {
        x: touch.x,
        y: touch.y,
        time: now,
      });
    }

    // Single touch - check for tap/longpress
    if (touches.length === 1) {
      const touch = touches[0];

      // Start long press timer
      this.longPressTimeout = window.setTimeout(() => {
        this.emitGesture({
          type: 'longpress',
          x: touch.x,
          y: touch.y,
        });
      }, this.LONG_PRESS_THRESHOLD);
    }

    // Two-finger gestures - initialize
    if (touches.length === 2) {
      this.cancelTimers();
      this.initialPinchDistance = this.getDistance(touches[0], touches[1]);
      this.initialRotation = this.getAngle(touches[0], touches[1]);
    }
  }

  /**
   * Handle touch move
   */
  touchMove(touches: TouchPoint[]): void {
    // Two-finger gestures
    if (touches.length === 2) {
      const currentDistance = this.getDistance(touches[0], touches[1]);
      const currentRotation = this.getAngle(touches[0], touches[1]);

      // Pinch gesture
      if (this.initialPinchDistance > 0) {
        const scale = currentDistance / this.initialPinchDistance;
        const centerX = (touches[0].x + touches[1].x) / 2;
        const centerY = (touches[0].y + touches[1].y) / 2;

        this.emitGesture({
          type: 'pinch',
          x: centerX,
          y: centerY,
          scale,
        });
      }

      // Rotate gesture
      if (this.initialRotation !== 0) {
        const rotation = currentRotation - this.initialRotation;
        const centerX = (touches[0].x + touches[1].x) / 2;
        const centerY = (touches[0].y + touches[1].y) / 2;

        this.emitGesture({
          type: 'rotate',
          x: centerX,
          y: centerY,
          rotation,
        });
      }

      return;
    }

    // Single touch - check if moved too much for tap
    if (touches.length === 1) {
      const touch = touches[0];
      const start = this.touchStartData.get(touch.identifier);

      if (start) {
        const distance = Math.hypot(touch.x - start.x, touch.y - start.y);
        if (distance > this.TAP_MOVE_THRESHOLD) {
          // Moved too much, cancel tap/longpress
          this.cancelTimers();
        }
      }
    }
  }

  /**
   * Handle touch end
   */
  touchEnd(touches: TouchPoint[], allTouches: TouchPoint[]): void {
    const now = Date.now();

    // Process ended touches
    for (const touch of touches) {
      const start = this.touchStartData.get(touch.identifier);
      if (!start) continue;

      const duration = now - start.time;
      const distance = Math.hypot(touch.x - start.x, touch.y - start.y);
      const velocity = distance / duration;

      // Check for swipe
      if (distance > this.SWIPE_THRESHOLD && velocity > this.SWIPE_VELOCITY_THRESHOLD) {
        const direction = this.getSwipeDirection(start.x, start.y, touch.x, touch.y);
        this.emitGesture({
          type: 'swipe',
          x: touch.x,
          y: touch.y,
          direction,
          velocity,
          distance,
        });
      }
      // Check for tap
      else if (duration < this.TAP_THRESHOLD && distance < this.TAP_MOVE_THRESHOLD) {
        // Check for double tap
        const timeSinceLastTap = now - this.lastTapTime;
        const distanceFromLastTap = Math.hypot(touch.x - this.lastTapX, touch.y - this.lastTapY);

        if (
          timeSinceLastTap < this.DOUBLE_TAP_THRESHOLD &&
          distanceFromLastTap < this.TAP_MOVE_THRESHOLD
        ) {
          this.emitGesture({
            type: 'doubletap',
            x: touch.x,
            y: touch.y,
          });
          this.lastTapTime = 0; // Reset
        } else {
          this.emitGesture({
            type: 'tap',
            x: touch.x,
            y: touch.y,
          });
          this.lastTapTime = now;
          this.lastTapX = touch.x;
          this.lastTapY = touch.y;
        }
      }

      this.touchStartData.delete(touch.identifier);
    }

    // Reset multi-touch state when all touches end
    if (allTouches.length === 0) {
      this.initialPinchDistance = 0;
      this.initialRotation = 0;
    }

    this.cancelTimers();
  }

  /**
   * Cancel all timers
   */
  private cancelTimers(): void {
    if (this.tapTimeout !== null) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
    if (this.longPressTimeout !== null) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  /**
   * Emit gesture event
   */
  private emitGesture(data: GestureData): void {
    if (this.gestureCallback) {
      this.gestureCallback(data);
    }
  }

  /**
   * Get distance between two touch points
   */
  private getDistance(t1: TouchPoint, t2: TouchPoint): number {
    return Math.hypot(t2.x - t1.x, t2.y - t1.y);
  }

  /**
   * Get angle between two touch points (in degrees)
   */
  private getAngle(t1: TouchPoint, t2: TouchPoint): number {
    return (Math.atan2(t2.y - t1.y, t2.x - t1.x) * 180) / Math.PI;
  }

  /**
   * Get swipe direction
   */
  private getSwipeDirection(x1: number, y1: number, x2: number, y2: number): SwipeDirection {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Reset recognizer state
   */
  reset(): void {
    this.cancelTimers();
    this.touchStartData.clear();
    this.initialPinchDistance = 0;
    this.initialRotation = 0;
    this.lastTapTime = 0;
  }
}
