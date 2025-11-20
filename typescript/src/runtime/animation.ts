/**
 * Animation and tweening system for SK8
 *
 * Provides smooth animations for actor properties
 *
 * Optimizations:
 * - Animation object pooling to reduce GC pressure
 * - Coalesced setNeedsRender calls
 * - Lazy evaluation for off-screen animations
 * - GPU-accelerated transforms where possible
 */

import { ObjectPool, Poolable } from '../core/object-pool.js';
import { performanceMonitor } from './performance-monitor.js';

export type EasingFunction = (t: number) => number;

/**
 * Common easing functions
 */
export class Easing {
  static linear(t: number): number {
    return t;
  }

  static easeInQuad(t: number): number {
    return t * t;
  }

  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutCubic(t: number): number {
    return --t * t * t + 1;
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  static easeInElastic(t: number): number {
    return t === 0
      ? 0
      : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / 3);
  }

  static easeOutElastic(t: number): number {
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
  }

  static easeInBounce(t: number): number {
    return 1 - Easing.easeOutBounce(1 - t);
  }

  static easeOutBounce(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
}

/**
 * Animation state (pooled for performance)
 */
export class Animation implements Poolable {
  id: number = 0;
  target: any = null;
  property: string = '';
  startValue: number = 0;
  endValue: number = 0;
  duration: number = 0;
  easing: EasingFunction = Easing.linear;
  startTime: number = 0;
  onComplete?: () => void;
  onUpdate?: (value: number) => void;
  isVisible: boolean = true; // For lazy evaluation

  reset(): void {
    this.id = 0;
    this.target = null;
    this.property = '';
    this.startValue = 0;
    this.endValue = 0;
    this.duration = 0;
    this.easing = Easing.linear;
    this.startTime = 0;
    this.onComplete = undefined;
    this.onUpdate = undefined;
    this.isVisible = true;
  }

  /**
   * Check if target is visible (for lazy evaluation)
   */
  checkVisibility(): boolean {
    if (this.target && typeof this.target.getVisible === 'function') {
      this.isVisible = this.target.getVisible();
    }
    return this.isVisible;
  }
}

/**
 * Animation pool for reusing animation objects
 */
const animationPool = new ObjectPool<Animation>(() => new Animation(), 20, 200);

/**
 * Animation manager (optimized)
 */
export class AnimationManager {
  private animations: Map<number, Animation> = new Map();
  private nextId = 1;
  private animationFrameId: number | null = null;

  // Optimization: batch render updates
  private renderTargets = new Set<any>();
  private renderCoalesceTimer: number | null = null;

  // Optimization: lazy evaluation
  private useLazyEvaluation: boolean = true;
  private visibilityCheckInterval: number = 100; // Check visibility every 100ms
  private lastVisibilityCheck: number = 0;

  /**
   * Animate a numeric property (optimized with object pooling)
   */
  animate(
    target: any,
    property: string,
    endValue: number,
    duration: number,
    options: {
      easing?: EasingFunction;
      onComplete?: () => void;
      onUpdate?: (value: number) => void;
    } = {}
  ): number {
    const startValue = typeof target.get === 'function' ? target.get(property) : target[property];

    // Get animation from pool
    const animation = animationPool.acquire();
    animation.id = this.nextId++;
    animation.target = target;
    animation.property = property;
    animation.startValue = startValue;
    animation.endValue = endValue;
    animation.duration = duration;
    animation.easing = options.easing || Easing.easeInOutQuad;
    animation.startTime = Date.now();
    animation.onComplete = options.onComplete;
    animation.onUpdate = options.onUpdate;
    animation.checkVisibility();

    this.animations.set(animation.id, animation);

    // Start animation loop if not running
    if (this.animationFrameId === null) {
      this.startAnimationLoop();
    }

    // Track for metrics
    performanceMonitor.incrementCounter('animations-started');

    return animation.id;
  }

  /**
   * Cancel an animation (return to pool)
   */
  cancel(animationId: number): void {
    const animation = this.animations.get(animationId);
    if (animation) {
      this.animations.delete(animationId);
      animationPool.release(animation);
    }

    if (this.animations.size === 0) {
      this.stopAnimationLoop();
    }
  }

  /**
   * Cancel all animations for a target
   */
  cancelAllFor(target: any): void {
    const toRemove: number[] = [];

    this.animations.forEach((anim, id) => {
      if (anim.target === target) {
        toRemove.push(id);
      }
    });

    toRemove.forEach((id) => this.cancel(id));
  }

  /**
   * Cancel all animations
   */
  cancelAll(): void {
    this.animations.clear();
    this.stopAnimationLoop();
  }

  private startAnimationLoop(): void {
    const update = () => {
      this.updateAnimations();
      if (this.animations.size > 0) {
        this.animationFrameId = requestAnimationFrame(update);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateAnimations(): void {
    const now = Date.now();
    const completed: Animation[] = [];

    // Performance monitoring
    performanceMonitor.mark('anim-update-start');

    // Check visibility periodically
    const shouldCheckVisibility =
      this.useLazyEvaluation && now - this.lastVisibilityCheck >= this.visibilityCheckInterval;
    if (shouldCheckVisibility) {
      this.lastVisibilityCheck = now;
    }

    // Clear render targets from previous frame
    this.renderTargets.clear();

    this.animations.forEach((anim) => {
      // Lazy evaluation: skip invisible animations
      if (this.useLazyEvaluation) {
        if (shouldCheckVisibility) {
          anim.checkVisibility();
        }
        if (!anim.isVisible) {
          return; // Skip this animation
        }
      }

      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easing(progress);

      // Calculate current value
      const currentValue = anim.startValue + (anim.endValue - anim.startValue) * easedProgress;

      // Update target
      if (typeof anim.target.set === 'function') {
        anim.target.set(anim.property, currentValue);
      } else {
        anim.target[anim.property] = currentValue;
      }

      // Track target for coalesced rendering
      if (anim.target && typeof anim.target.setNeedsRender === 'function') {
        this.renderTargets.add(anim.target);
      }

      // Call update callback
      if (anim.onUpdate) {
        anim.onUpdate(currentValue);
      }

      // Check if complete
      if (progress >= 1) {
        completed.push(anim);
        if (anim.onComplete) {
          anim.onComplete();
        }
      }
    });

    // Coalesce render updates
    this.coalesceRenderUpdates();

    // Remove completed animations and return to pool
    completed.forEach((anim) => {
      this.animations.delete(anim.id);
      animationPool.release(anim);
      performanceMonitor.incrementCounter('animations-completed');
    });

    // Performance monitoring
    performanceMonitor.mark('anim-update-end');
    performanceMonitor.measure('anim-update', 'anim-update-start', 'anim-update-end');
    performanceMonitor.setMetric('active-animations', this.animations.size);
  }

  /**
   * Coalesce multiple setNeedsRender calls into a single update
   */
  private coalesceRenderUpdates(): void {
    // Clear any pending timer
    if (this.renderCoalesceTimer !== null) {
      clearTimeout(this.renderCoalesceTimer);
    }

    // Schedule render update on next microtask
    this.renderCoalesceTimer = setTimeout(() => {
      this.renderTargets.forEach((target) => {
        if (typeof target.setNeedsRender === 'function') {
          target.setNeedsRender();
        }
      });
      this.renderTargets.clear();
      this.renderCoalesceTimer = null;
    }, 0) as any;
  }

  /**
   * Enable/disable lazy evaluation
   */
  setUseLazyEvaluation(enabled: boolean): void {
    this.useLazyEvaluation = enabled;
  }

  /**
   * Get animation pool statistics
   */
  getPoolStats(): any {
    return animationPool.getStats();
  }
}

/**
 * Global animation manager instance
 */
export const animations = new AnimationManager();

/**
 * Helper functions for common animations
 */
export class AnimationHelpers {
  /**
   * Fade in an actor
   */
  static fadeIn(actor: any, duration: number = 300): number {
    // Store original visibility
    const wasVisible = actor.getVisible();
    actor.setVisible(true);

    // Animate opacity if supported, otherwise just show
    if (typeof actor.set === 'function' && actor.hasProperty?.('opacity')) {
      return animations.animate(actor, 'opacity', 1, duration, {
        easing: Easing.easeOutQuad,
      });
    } else {
      if (!wasVisible) {
        actor.setVisible(true);
      }
      return -1;
    }
  }

  /**
   * Fade out an actor
   */
  static fadeOut(actor: any, duration: number = 300): number {
    if (typeof actor.set === 'function' && actor.hasProperty?.('opacity')) {
      return animations.animate(actor, 'opacity', 0, duration, {
        easing: Easing.easeInQuad,
        onComplete: () => actor.setVisible(false),
      });
    } else {
      actor.setVisible(false);
      return -1;
    }
  }

  /**
   * Move actor to position
   */
  static moveTo(actor: any, x: number, y: number, duration: number = 500): void {
    animations.animate(actor, 'left', x, duration, {
      easing: Easing.easeInOutQuad,
    });
    animations.animate(actor, 'top', y, duration, {
      easing: Easing.easeInOutQuad,
    });
  }

  /**
   * Scale actor
   */
  static scaleTo(actor: any, scale: number, duration: number = 500): void {
    const currentWidth = actor.getWidth();
    const currentHeight = actor.getHeight();
    const centerX = actor.getLeft() + currentWidth / 2;
    const centerY = actor.getTop() + currentHeight / 2;

    const newWidth = currentWidth * scale;
    const newHeight = currentHeight * scale;

    animations.animate(actor, 'left', centerX - newWidth / 2, duration, {
      easing: Easing.easeInOutCubic,
    });
    animations.animate(actor, 'top', centerY - newHeight / 2, duration, {
      easing: Easing.easeInOutCubic,
    });
    animations.animate(actor, 'width', newWidth, duration, {
      easing: Easing.easeInOutCubic,
    });
    animations.animate(actor, 'height', newHeight, duration, {
      easing: Easing.easeInOutCubic,
    });
  }

  /**
   * Pulse animation (scale up and down)
   */
  static pulse(actor: any, scale: number = 1.2, duration: number = 300): void {
    const currentWidth = actor.getWidth();
    const currentHeight = actor.getHeight();
    const centerX = actor.getLeft() + currentWidth / 2;
    const centerY = actor.getTop() + currentHeight / 2;

    const newWidth = currentWidth * scale;
    const newHeight = currentHeight * scale;

    // Scale up
    animations.animate(actor, 'width', newWidth, duration / 2, {
      easing: Easing.easeOutQuad,
      onComplete: () => {
        // Scale back down
        animations.animate(actor, 'width', currentWidth, duration / 2, {
          easing: Easing.easeInQuad,
        });
        animations.animate(actor, 'height', currentHeight, duration / 2, {
          easing: Easing.easeInQuad,
        });
        animations.animate(actor, 'left', centerX - currentWidth / 2, duration / 2, {
          easing: Easing.easeInQuad,
        });
        animations.animate(actor, 'top', centerY - currentHeight / 2, duration / 2, {
          easing: Easing.easeInQuad,
        });
      },
    });
    animations.animate(actor, 'height', newHeight, duration / 2, {
      easing: Easing.easeOutQuad,
    });
    animations.animate(actor, 'left', centerX - newWidth / 2, duration / 2, {
      easing: Easing.easeOutQuad,
    });
    animations.animate(actor, 'top', centerY - newHeight / 2, duration / 2, {
      easing: Easing.easeOutQuad,
    });
  }

  /**
   * Shake animation
   */
  static shake(actor: any, intensity: number = 10, duration: number = 500): void {
    const originalX = actor.getLeft();
    const originalY = actor.getTop();
    const shakeCount = 10;
    const shakeDuration = duration / shakeCount;

    let currentShake = 0;

    const doShake = () => {
      if (currentShake >= shakeCount) {
        actor.moveTo(originalX, originalY);
        return;
      }

      const offsetX = (Math.random() - 0.5) * intensity;
      const offsetY = (Math.random() - 0.5) * intensity;

      animations.animate(actor, 'left', originalX + offsetX, shakeDuration, {
        easing: Easing.linear,
        onComplete: () => {
          currentShake++;
          doShake();
        },
      });
      animations.animate(actor, 'top', originalY + offsetY, shakeDuration, {
        easing: Easing.linear,
      });
    };

    doShake();
  }
}
