/**
 * Event Dispatcher - Handles event propagation and delegation
 *
 * Implements three-phase event propagation:
 * 1. Capturing phase - from stage to target
 * 2. Target phase - at the target
 * 3. Bubbling phase - from target back to stage
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import {
  SK8Event,
  EventPhase,
  EventListener,
  EventListenerEntry,
  EventListenerOptions,
} from './SK8Event.js';

/**
 * Event target interface - objects that can handle events
 */
export interface EventTarget {
  addEventListener(
    type: string,
    listener: EventListener,
    options?: EventListenerOptions
  ): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: SK8Event): boolean;
}

/**
 * Event dispatcher mixin for SK8 objects
 */
export class EventDispatcher {
  private eventListeners = new Map<string, EventListenerEntry[]>();

  /**
   * Add an event listener
   */
  addEventListener(
    type: string,
    listener: EventListener,
    options: EventListenerOptions = {}
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }

    const listeners = this.eventListeners.get(type)!;

    // Don't add the same listener twice
    if (listeners.some((entry) => entry.listener === listener)) {
      return;
    }

    listeners.push({
      listener,
      options: { capture: false, once: false, ...options },
    });
  }

  /**
   * Remove an event listener
   */
  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(type);
    if (!listeners) return;

    const index = listeners.findIndex((entry) => entry.listener === listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatch an event with full propagation
   */
  dispatchEvent(event: SK8Event, target?: SK8Actor): boolean {
    if (!target) return false;

    // Set the target
    event.target = target;

    // Build the propagation path from target to root
    const path: SK8Actor[] = [];
    let current: SK8Actor | null = target;
    while (current) {
      path.unshift(current);
      current = current.getParent() as SK8Actor | null;
    }

    // Capturing phase (from root to target)
    event.phase = EventPhase.CAPTURING;
    for (let i = 0; i < path.length - 1 && !event.propagationStopped; i++) {
      event.currentTarget = path[i];
      this.invokeListeners(path[i], event, true);
    }

    // Target phase
    if (!event.propagationStopped) {
      event.phase = EventPhase.AT_TARGET;
      event.currentTarget = target;
      this.invokeListeners(target, event, false);
    }

    // Bubbling phase (from target back to root)
    if (!event.propagationStopped) {
      event.phase = EventPhase.BUBBLING;
      for (let i = path.length - 2; i >= 0 && !event.propagationStopped; i--) {
        event.currentTarget = path[i];
        this.invokeListeners(path[i], event, false);
      }
    }

    return !event.defaultPrevented;
  }

  /**
   * Invoke listeners on a specific target
   */
  private invokeListeners(
    target: any,
    event: SK8Event,
    capturePhase: boolean
  ): void {
    if (!target.eventListeners) return;

    const listeners = target.eventListeners.get(event.type);
    if (!listeners) return;

    // Create a copy to avoid issues if listeners are removed during dispatch
    const listenersCopy = [...listeners];

    for (const entry of listenersCopy) {
      // Skip if wrong phase
      if (entry.options.capture !== capturePhase) continue;

      // Check if immediate propagation was stopped
      if (event.immediatePropagationStopped) break;

      // Invoke the listener
      try {
        entry.listener.call(target, event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }

      // Remove if "once" option was set
      if (entry.options.once) {
        target.removeEventListener(event.type, entry.listener);
      }
    }
  }

  /**
   * Check if there are listeners for an event type
   */
  hasEventListener(type: string): boolean {
    const listeners = this.eventListeners.get(type);
    return listeners !== undefined && listeners.length > 0;
  }

  /**
   * Get all event types that have listeners
   */
  getEventTypes(): string[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Clear all event listeners
   */
  clearEventListeners(type?: string): void {
    if (type) {
      this.eventListeners.delete(type);
    } else {
      this.eventListeners.clear();
    }
  }
}
