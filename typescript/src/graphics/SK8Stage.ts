/**
 * SK8Stage - Canvas manager and container for actors
 *
 * In SK8, a Stage is like a window that contains actors.
 * This implementation uses an HTML canvas element.
 */

import { SK8Object } from '../core/SK8Object.js';
import { SK8Actor } from './SK8Actor.js';
import { Color, ColorUtils, Rect, RectUtils } from './types.js';
import { SK8MouseEvent, SK8KeyboardEvent, SK8TouchEvent, TouchPoint } from '../events/SK8Event.js';
import { DragDropManager, DragConstraints } from '../events/drag-drop.js';
import { GestureRecognizer, GestureData } from '../events/gestures.js';
import { RenderOptimizer } from './render-optimizer.js';
import { performanceMonitor } from '../runtime/performance-monitor.js';

export class SK8Stage extends SK8Object {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private actors: SK8Actor[] = [];
  private backgroundColor: Color = ColorUtils.White;
  private needsRender: boolean = true;
  private animationFrameId: number | null = null;

  // Dirty rectangle tracking
  private dirtyRects: Rect[] = [];
  private dirtyActors = new Set<SK8Actor>();
  private useDirtyRectOptimization: boolean = false;

  // Performance tracking
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  // Render optimizer
  private renderOptimizer: RenderOptimizer;
  private useRenderOptimizer: boolean = true;
  private spatialIndexDirty: boolean = true;

  // Adaptive quality
  private adaptiveQuality: boolean = false;
  private qualityLevel: number = 1.0; // 1.0 = full quality, 0.5 = half quality
  private lowFpsFrames: number = 0;
  private lowFpsThreshold: number = 30;

  // Event management
  private dragDropManager = new DragDropManager();
  private gestureRecognizer = new GestureRecognizer();
  private focusedActor: SK8Actor | null = null;
  private hoveredActor: SK8Actor | null = null;

  constructor(canvas: HTMLCanvasElement | string, name?: string) {
    super(undefined, name || 'Stage');

    // Get canvas element
    if (typeof canvas === 'string') {
      const element = document.getElementById(canvas) as HTMLCanvasElement;
      if (!element) {
        throw new Error(`Canvas element '${canvas}' not found`);
      }
      this.canvas = element;
    } else {
      this.canvas = canvas;
    }

    // Get 2D context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Set up event listeners
    this.setupEventListeners();

    // Initialize render optimizer
    this.renderOptimizer = new RenderOptimizer({
      left: 0,
      top: 0,
      right: this.canvas.width,
      bottom: this.canvas.height,
    });

    // Define properties
    this.defineProperty('backgroundColor', {
      getter: () => this.getBackgroundColor(),
      setter: (value: Color) => this.setBackgroundColor(value),
    });
  }

  // Background color

  getBackgroundColor(): Color {
    return this.backgroundColor;
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = color;
    this.setNeedsRender();
  }

  // Actor management

  addActor(actor: SK8Actor): void {
    if (!this.actors.includes(actor)) {
      this.actors.push(actor);
      this.markActorDirty(actor);
      this.spatialIndexDirty = true;
      this.setNeedsRender();
    }
  }

  removeActor(actor: SK8Actor): void {
    const index = this.actors.indexOf(actor);
    if (index !== -1) {
      this.actors.splice(index, 1);
      this.spatialIndexDirty = true;
      this.setNeedsRender();
    }
  }

  getActors(): SK8Actor[] {
    return [...this.actors];
  }

  clearActors(): void {
    this.actors = [];
    this.setNeedsRender();
  }

  // Z-order management

  bringToFront(actor: SK8Actor): void {
    this.removeActor(actor);
    this.actors.push(actor);
    this.setNeedsRender();
  }

  sendToBack(actor: SK8Actor): void {
    this.removeActor(actor);
    this.actors.unshift(actor);
    this.setNeedsRender();
  }

  // Hit testing

  actorAtPoint(x: number, y: number): SK8Actor | null {
    // Use render optimizer for efficient hit testing
    if (this.useRenderOptimizer) {
      // Rebuild spatial index if needed
      if (this.spatialIndexDirty) {
        this.renderOptimizer.rebuildSpatialIndex(this.actors);
        this.spatialIndexDirty = false;
      }
      return this.renderOptimizer.actorAtPoint(this.actors, x, y);
    }

    // Fallback: check actors in reverse order (front to back)
    for (let i = this.actors.length - 1; i >= 0; i--) {
      const actor = this.actors[i];
      if (actor.getVisible() && actor.containsPoint(x, y)) {
        return actor;
      }
    }
    return null;
  }

  // Rendering

  setNeedsRender(): void {
    this.needsRender = true;
  }

  /**
   * Mark an actor as dirty (needs redrawing)
   */
  markActorDirty(actor: SK8Actor): void {
    if (this.useDirtyRectOptimization) {
      this.dirtyActors.add(actor);
      const bounds = actor.getBoundsRect();
      this.dirtyRects.push(bounds);
    }
    this.needsRender = true;
  }

  /**
   * Enable or disable dirty rectangle optimization
   */
  setUseDirtyRectOptimization(enabled: boolean): void {
    this.useDirtyRectOptimization = enabled;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.currentFps;
  }

  render(): void {
    // Performance monitoring
    performanceMonitor.mark('render-start');

    // Update FPS counter
    this.updateFPS();

    // Record frame for performance monitoring
    performanceMonitor.recordFrame();

    // Rebuild spatial index if needed
    if (this.spatialIndexDirty && this.useRenderOptimizer) {
      performanceMonitor.mark('spatial-rebuild-start');
      this.renderOptimizer.rebuildSpatialIndex(this.actors);
      this.spatialIndexDirty = false;
      performanceMonitor.mark('spatial-rebuild-end');
      performanceMonitor.measure('spatial-rebuild', 'spatial-rebuild-start', 'spatial-rebuild-end');
    }

    // Adaptive quality adjustment
    if (this.adaptiveQuality) {
      this.adjustQuality();
    }

    if (this.useDirtyRectOptimization && this.dirtyRects.length > 0) {
      // Render only dirty regions
      this.renderDirtyRects();
    } else {
      // Full render
      this.renderFull();
    }

    this.needsRender = false;
    this.dirtyRects = [];
    this.dirtyActors.clear();

    // Performance monitoring
    performanceMonitor.mark('render-end');
    performanceMonitor.measure('render', 'render-start', 'render-end');

    // Update metrics
    performanceMonitor.setMetric('actors', this.actors.length);
    const stats = this.renderOptimizer.getStats();
    performanceMonitor.setMetric('culled-actors', stats.culledActors);
    performanceMonitor.setMetric('rendered-actors', stats.renderedActors);
  }

  /**
   * Render the entire stage (full redraw)
   */
  private renderFull(): void {
    // Clear canvas
    this.ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Get viewport for culling
    const viewport: Rect = {
      left: 0,
      top: 0,
      right: this.canvas.width,
      bottom: this.canvas.height,
    };

    // Cull off-screen actors if optimizer is enabled
    let actorsToRender = this.actors;
    if (this.useRenderOptimizer) {
      actorsToRender = this.renderOptimizer.cullActors(this.actors, viewport);
    }

    // Apply quality scaling if needed
    if (this.qualityLevel < 1.0) {
      this.ctx.imageSmoothingEnabled = false;
    }

    // Render all visible actors
    for (const actor of actorsToRender) {
      if (actor.getVisible()) {
        this.ctx.save();
        // Apply actor's transform (if any)
        const transform = actor.getTransformMatrix?.();
        if (transform) {
          this.ctx.transform(
            transform.a,
            transform.b,
            transform.c,
            transform.d,
            transform.e,
            transform.f
          );
        }
        actor.render(this.ctx);
        this.ctx.restore();
      }
    }

    // Restore quality
    if (this.qualityLevel < 1.0) {
      this.ctx.imageSmoothingEnabled = true;
    }
  }

  /**
   * Render only dirty rectangles (optimized)
   */
  private renderDirtyRects(): void {
    // Merge overlapping dirty rects for efficiency
    const mergedRects = this.mergeDirtyRects();

    for (const dirtyRect of mergedRects) {
      // Save context state
      this.ctx.save();

      // Clip to dirty region
      this.ctx.beginPath();
      this.ctx.rect(
        dirtyRect.left,
        dirtyRect.top,
        RectUtils.width(dirtyRect),
        RectUtils.height(dirtyRect)
      );
      this.ctx.clip();

      // Clear dirty region
      this.ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
      this.ctx.fillRect(
        dirtyRect.left,
        dirtyRect.top,
        RectUtils.width(dirtyRect),
        RectUtils.height(dirtyRect)
      );

      // Render actors that intersect with dirty region
      for (const actor of this.actors) {
        if (actor.getVisible()) {
          const actorBounds = actor.getBoundsRect();
          if (RectUtils.intersects(actorBounds, dirtyRect)) {
            this.ctx.save();
            const transform = actor.getTransformMatrix?.();
            if (transform) {
              this.ctx.transform(
                transform.a,
                transform.b,
                transform.c,
                transform.d,
                transform.e,
                transform.f
              );
            }
            actor.render(this.ctx);
            this.ctx.restore();
          }
        }
      }

      // Restore context state
      this.ctx.restore();
    }
  }

  /**
   * Merge overlapping dirty rectangles
   */
  private mergeDirtyRects(): Rect[] {
    if (this.dirtyRects.length === 0) return [];
    if (this.dirtyRects.length === 1) return this.dirtyRects;

    // Simple merging algorithm - merge all overlapping rects
    const merged: Rect[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < this.dirtyRects.length; i++) {
      if (processed.has(i)) continue;

      let currentRect = { ...this.dirtyRects[i] };
      let merged_any = true;

      while (merged_any) {
        merged_any = false;
        for (let j = i + 1; j < this.dirtyRects.length; j++) {
          if (processed.has(j)) continue;

          const otherRect = this.dirtyRects[j];
          if (RectUtils.intersects(currentRect, otherRect)) {
            currentRect = RectUtils.union(currentRect, otherRect);
            processed.add(j);
            merged_any = true;
          }
        }
      }

      merged.push(currentRect);
      processed.add(i);
    }

    return merged;
  }

  /**
   * Update FPS counter
   */
  private updateFPS(): void {
    this.frameCount++;
    const now = Date.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  // Animation loop

  startRendering(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    const renderLoop = () => {
      if (this.needsRender) {
        this.render();
      }
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  stopRendering(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Focus management

  setFocus(actor: SK8Actor | null): void {
    if (this.focusedActor === actor) return;

    // Blur previous focused actor
    if (this.focusedActor) {
      const blurEvent = new SK8MouseEvent('blur', 0, 0);
      this.focusedActor.dispatchEvent(blurEvent);
    }

    this.focusedActor = actor;

    // Focus new actor
    if (this.focusedActor) {
      const focusEvent = new SK8MouseEvent('focus', 0, 0);
      this.focusedActor.dispatchEvent(focusEvent);
    }
  }

  getFocusedActor(): SK8Actor | null {
    return this.focusedActor;
  }

  // Event handling

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

    // Keyboard events - need tabindex to receive keyboard events
    this.canvas.tabIndex = 0;
    this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.canvas.addEventListener('keyup', (e) => this.handleKeyUp(e));
    this.canvas.addEventListener('keypress', (e) => this.handleKeyPress(e));

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));

    // Set up gesture recognizer
    this.gestureRecognizer.onGesture((gesture: GestureData) => {
      this.handleGesture(gesture);
    });
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private getTouchPoints(touches: TouchList): TouchPoint[] {
    const rect = this.canvas.getBoundingClientRect();
    const points: TouchPoint[] = [];

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      points.push({
        identifier: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }

    return points;
  }

  // Mouse event handlers

  private handleClick(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);

    if (actor) {
      // Set focus
      this.setFocus(actor);

      // Legacy handler
      actor.onClick(pos.x, pos.y);

      // New event system
      const event = new SK8MouseEvent('click', pos.x, pos.y, e);
      actor.dispatchEvent(event);
    } else {
      this.setFocus(null);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);

    if (actor) {
      // Legacy handler
      actor.onMouseDown(pos.x, pos.y);

      // New event system
      const event = new SK8MouseEvent('mousedown', pos.x, pos.y, e);
      actor.dispatchEvent(event);

      // Start drag if actor is draggable
      if (actor.getDraggable()) {
        this.dragDropManager.startDrag(actor, pos.x, pos.y);
      }
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const pos = this.getMousePos(e);

    // End drag if dragging
    if (this.dragDropManager.isDragging()) {
      this.dragDropManager.endDrag(pos.x, pos.y);
      this.setNeedsRender();
    }

    const actor = this.actorAtPoint(pos.x, pos.y);
    if (actor) {
      // Legacy handler
      actor.onMouseUp(pos.x, pos.y);

      // New event system
      const event = new SK8MouseEvent('mouseup', pos.x, pos.y, e);
      actor.dispatchEvent(event);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);

    // Update drag if dragging
    if (this.dragDropManager.isDragging()) {
      this.dragDropManager.updateDrag(pos.x, pos.y);
      this.setNeedsRender();
      return;
    }

    // Handle hover state
    const actor = this.actorAtPoint(pos.x, pos.y);

    if (actor !== this.hoveredActor) {
      // Mouse leave on previous actor
      if (this.hoveredActor) {
        const leaveEvent = new SK8MouseEvent('mouseleave', pos.x, pos.y, e);
        this.hoveredActor.dispatchEvent(leaveEvent);
      }

      // Mouse enter on new actor
      if (actor) {
        const enterEvent = new SK8MouseEvent('mouseenter', pos.x, pos.y, e);
        actor.dispatchEvent(enterEvent);
      }

      this.hoveredActor = actor;
    }

    if (actor) {
      // Legacy handler
      actor.onMouseMove(pos.x, pos.y);

      // New event system
      const event = new SK8MouseEvent('mousemove', pos.x, pos.y, e);
      actor.dispatchEvent(event);
    }
  }

  private handleMouseEnter(_e: MouseEvent): void {
    // Canvas entered
  }

  private handleMouseLeave(e: MouseEvent): void {
    // Clear hover state
    if (this.hoveredActor) {
      const pos = this.getMousePos(e);
      const leaveEvent = new SK8MouseEvent('mouseleave', pos.x, pos.y, e);
      this.hoveredActor.dispatchEvent(leaveEvent);
      this.hoveredActor = null;
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);

    if (actor) {
      const event = new SK8MouseEvent('contextmenu', pos.x, pos.y, e);
      actor.dispatchEvent(event);

      // Prevent default if event was handled
      if (event.defaultPrevented) {
        e.preventDefault();
      }
    }
  }

  // Keyboard event handlers

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.focusedActor) return;

    const event = new SK8KeyboardEvent('keydown', e);
    this.focusedActor.dispatchEvent(event);

    if (event.defaultPrevented) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.focusedActor) return;

    const event = new SK8KeyboardEvent('keyup', e);
    this.focusedActor.dispatchEvent(event);

    if (event.defaultPrevented) {
      e.preventDefault();
    }
  }

  private handleKeyPress(e: KeyboardEvent): void {
    if (!this.focusedActor) return;

    const event = new SK8KeyboardEvent('keypress', e);
    this.focusedActor.dispatchEvent(event);

    if (event.defaultPrevented) {
      e.preventDefault();
    }
  }

  // Touch event handlers

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault(); // Prevent mouse events

    const touches = this.getTouchPoints(e.touches);
    const changedTouches = this.getTouchPoints(e.changedTouches);

    // Pass to gesture recognizer
    this.gestureRecognizer.touchStart(changedTouches);

    // Dispatch touch event to actors
    if (changedTouches.length > 0) {
      const touch = changedTouches[0];
      const actor = this.actorAtPoint(touch.x, touch.y);

      if (actor) {
        const event = new SK8TouchEvent('touchstart', touches, changedTouches, e);
        actor.dispatchEvent(event);
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    const touches = this.getTouchPoints(e.touches);
    const changedTouches = this.getTouchPoints(e.changedTouches);

    // Pass to gesture recognizer
    this.gestureRecognizer.touchMove(changedTouches);

    // Dispatch touch event
    if (changedTouches.length > 0) {
      const touch = changedTouches[0];
      const actor = this.actorAtPoint(touch.x, touch.y);

      if (actor) {
        const event = new SK8TouchEvent('touchmove', touches, changedTouches, e);
        actor.dispatchEvent(event);
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    const touches = this.getTouchPoints(e.touches);
    const changedTouches = this.getTouchPoints(e.changedTouches);

    // Pass to gesture recognizer
    this.gestureRecognizer.touchEnd(changedTouches, touches);

    // Dispatch touch event
    if (changedTouches.length > 0) {
      const touch = changedTouches[0];
      const actor = this.actorAtPoint(touch.x, touch.y);

      if (actor) {
        const event = new SK8TouchEvent('touchend', touches, changedTouches, e);
        actor.dispatchEvent(event);
      }
    }
  }

  private handleTouchCancel(_e: TouchEvent): void {
    this.gestureRecognizer.reset();
  }

  // Gesture handler

  private handleGesture(gesture: GestureData): void {
    const actor = this.actorAtPoint(gesture.x, gesture.y);

    if (actor) {
      const event = new SK8MouseEvent(gesture.type, gesture.x, gesture.y);
      (event as any).gesture = gesture; // Attach full gesture data
      actor.dispatchEvent(event);
    }
  }

  // Drag and drop helpers

  setDragConstraints(constraints: DragConstraints): void {
    const drag = this.dragDropManager.getCurrentDrag();
    if (drag) {
      drag.constraints = constraints;
    }
  }

  cancelDrag(): void {
    this.dragDropManager.cancelDrag();
    this.setNeedsRender();
  }

  registerDropTarget(actor: SK8Actor): void {
    this.dragDropManager.registerDropTarget(actor);
  }

  unregisterDropTarget(actor: SK8Actor): void {
    this.dragDropManager.unregisterDropTarget(actor);
  }

  // Canvas properties

  getWidth(): number {
    return this.canvas.width;
  }

  getHeight(): number {
    return this.canvas.height;
  }

  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.spatialIndexDirty = true;
    this.setNeedsRender();
  }

  /**
   * Enable/disable render optimizer
   */
  setUseRenderOptimizer(enabled: boolean): void {
    this.useRenderOptimizer = enabled;
    if (enabled) {
      this.spatialIndexDirty = true;
    }
  }

  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveQuality(enabled: boolean): void {
    this.adaptiveQuality = enabled;
  }

  /**
   * Adjust quality based on performance
   */
  private adjustQuality(): void {
    const fps = performanceMonitor.getFPS();

    if (fps < this.lowFpsThreshold) {
      this.lowFpsFrames++;
      // If we've had 10 consecutive low FPS frames, reduce quality
      if (this.lowFpsFrames >= 10 && this.qualityLevel > 0.5) {
        this.qualityLevel = Math.max(0.5, this.qualityLevel - 0.1);
        console.warn(`Reduced quality to ${(this.qualityLevel * 100).toFixed(0)}% due to low FPS`);
      }
    } else if (fps >= 55) {
      // If FPS is good, gradually restore quality
      this.lowFpsFrames = 0;
      if (this.qualityLevel < 1.0) {
        this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
      }
    }
  }

  /**
   * Get render optimizer statistics
   */
  getRenderStats(): any {
    return this.renderOptimizer.getStats();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return performanceMonitor.getMetrics();
  }

  // Cleanup

  destroy(): void {
    this.stopRendering();
    this.clearActors();
  }
}
