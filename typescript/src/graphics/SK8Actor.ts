/**
 * SK8Actor - Base class for all visual objects
 *
 * In SK8, everything visual is an Actor that lives on a Stage.
 * This implements the core actor functionality.
 */

import { SK8Object } from '../core/SK8Object.js';
import { Rect, Color, RectUtils, ColorUtils } from './types.js';
import { Gradient } from './gradients.js';
import {
  SK8Event,
  EventListener,
  EventListenerOptions,
  EventListenerEntry,
} from '../events/SK8Event.js';

export abstract class SK8Actor extends SK8Object {
  private bounds: Rect;
  private visible: boolean = true;
  private fillColor: Color | Gradient | null = null;
  private frameColor: Color | null = null;
  private lineWidth: number = 1;

  // Transform properties
  private transformMatrix: DOMMatrix = new DOMMatrix();
  private rotation: number = 0;
  private scaleX: number = 1;
  private scaleY: number = 1;
  private skewX: number = 0;
  private skewY: number = 0;

  // Visual effects
  private opacity: number = 1.0; // 0 to 1
  private shadowColor: Color | null = null;
  private shadowBlur: number = 0;
  private shadowOffsetX: number = 0;
  private shadowOffsetY: number = 0;

  // Event handling
  eventListeners = new Map<string, EventListenerEntry[]>();

  // Drag and drop properties
  private _draggable: boolean = false;
  private _droppable: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Actor');
    this.bounds = { left: 0, top: 0, right: 100, bottom: 100 };

    // Set up default properties using the property system
    this.defineProperty('boundsRect', {
      getter: () => this.getBoundsRect(),
      setter: (value: Rect) => this.setBoundsRect(value),
    });

    this.defineProperty('visible', {
      getter: () => this.getVisible(),
      setter: (value: boolean) => this.setVisible(value),
    });

    this.defineProperty('fillColor', {
      getter: () => this.getFillColor(),
      setter: (value: Color) => this.setFillColor(value),
    });

    this.defineProperty('frameColor', {
      getter: () => this.getFrameColor(),
      setter: (value: Color) => this.setFrameColor(value),
    });

    this.defineProperty('draggable', {
      getter: () => this.getDraggable(),
      setter: (value: boolean) => this.setDraggable(value),
    });

    this.defineProperty('droppable', {
      getter: () => this.getDroppable(),
      setter: (value: boolean) => this.setDroppable(value),
    });

    this.defineProperty('opacity', {
      getter: () => this.getOpacity(),
      setter: (value: number) => this.setOpacity(value),
    });
  }

  // Bounds management (like SK8's boundsRect)

  getBoundsRect(): Rect {
    return { ...this.bounds };
  }

  setBoundsRect(rect: Rect): void {
    this.bounds = { ...rect };
    this.setNeedsDraw();
  }

  getLeft(): number {
    return this.bounds.left;
  }
  getTop(): number {
    return this.bounds.top;
  }
  getRight(): number {
    return this.bounds.right;
  }
  getBottom(): number {
    return this.bounds.bottom;
  }

  getWidth(): number {
    return RectUtils.width(this.bounds);
  }
  getHeight(): number {
    return RectUtils.height(this.bounds);
  }

  setLeft(value: number): void {
    const width = this.getWidth();
    this.bounds.left = value;
    this.bounds.right = value + width;
    this.setNeedsDraw();
  }

  setTop(value: number): void {
    const height = this.getHeight();
    this.bounds.top = value;
    this.bounds.bottom = value + height;
    this.setNeedsDraw();
  }

  setWidth(value: number): void {
    this.bounds.right = this.bounds.left + value;
    this.setNeedsDraw();
  }

  setHeight(value: number): void {
    this.bounds.bottom = this.bounds.top + value;
    this.setNeedsDraw();
  }

  // Position shortcuts

  moveTo(x: number, y: number): void {
    const width = this.getWidth();
    const height = this.getHeight();
    this.bounds = RectUtils.fromXYWH(x, y, width, height);
    this.setNeedsDraw();
  }

  moveBy(dx: number, dy: number): void {
    this.bounds.left += dx;
    this.bounds.top += dy;
    this.bounds.right += dx;
    this.bounds.bottom += dy;
    this.setNeedsDraw();
  }

  // Visibility

  getVisible(): boolean {
    return this.visible;
  }

  setVisible(value: boolean): void {
    this.visible = value;
    this.setNeedsDraw();
  }

  // Colors

  getFillColor(): Color | Gradient | null {
    return this.fillColor;
  }

  setFillColor(color: Color | Gradient | null): void {
    this.fillColor = color;
    this.setNeedsDraw();
  }

  getFrameColor(): Color | null {
    return this.frameColor;
  }

  setFrameColor(color: Color | null): void {
    this.frameColor = color;
    this.setNeedsDraw();
  }

  getLineWidth(): number {
    return this.lineWidth;
  }

  setLineWidth(width: number): void {
    this.lineWidth = width;
    this.setNeedsDraw();
  }

  // Opacity

  getOpacity(): number {
    return this.opacity;
  }

  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.setNeedsDraw();
  }

  /**
   * Fade in animation helper
   */
  fadeIn(duration: number = 300): void {
    const startOpacity = this.opacity;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.setOpacity(startOpacity + (1 - startOpacity) * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Fade out animation helper
   */
  fadeOut(duration: number = 300): void {
    const startOpacity = this.opacity;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.setOpacity(startOpacity * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Shadow effects

  /**
   * Set shadow effect
   */
  setShadow(
    color: Color,
    blur: number = 4,
    offsetX: number = 2,
    offsetY: number = 2
  ): void {
    this.shadowColor = color;
    this.shadowBlur = blur;
    this.shadowOffsetX = offsetX;
    this.shadowOffsetY = offsetY;
    this.setNeedsDraw();
  }

  /**
   * Clear shadow effect
   */
  clearShadow(): void {
    this.shadowColor = null;
    this.shadowBlur = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.setNeedsDraw();
  }

  getShadowColor(): Color | null {
    return this.shadowColor;
  }

  getShadowBlur(): number {
    return this.shadowBlur;
  }

  getShadowOffsetX(): number {
    return this.shadowOffsetX;
  }

  getShadowOffsetY(): number {
    return this.shadowOffsetY;
  }

  /**
   * Check if shadow is enabled
   */
  hasShadow(): boolean {
    return this.shadowColor !== null;
  }

  // Transformations

  /**
   * Rotate the actor around its center
   * @param angle Rotation angle in degrees
   */
  rotate(angle: number): void {
    this.rotation = angle;
    this.updateTransformMatrix();
    this.setNeedsDraw();
  }

  /**
   * Get the rotation angle in degrees
   */
  getRotation(): number {
    return this.rotation;
  }

  /**
   * Scale the actor
   * @param sx Scale factor in X direction
   * @param sy Scale factor in Y direction (defaults to sx)
   */
  scale(sx: number, sy?: number): void {
    this.scaleX = sx;
    this.scaleY = sy !== undefined ? sy : sx;
    this.updateTransformMatrix();
    this.setNeedsDraw();
  }

  /**
   * Get the scale factors
   */
  getScale(): { x: number; y: number } {
    return { x: this.scaleX, y: this.scaleY };
  }

  /**
   * Skew the actor
   * @param ax Skew angle in X direction (degrees)
   * @param ay Skew angle in Y direction (degrees)
   */
  skew(ax: number, ay: number): void {
    this.skewX = ax;
    this.skewY = ay;
    this.updateTransformMatrix();
    this.setNeedsDraw();
  }

  /**
   * Get the skew angles
   */
  getSkew(): { x: number; y: number } {
    return { x: this.skewX, y: this.skewY };
  }

  /**
   * Reset all transformations
   */
  resetTransform(): void {
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.skewX = 0;
    this.skewY = 0;
    this.transformMatrix = new DOMMatrix();
    this.setNeedsDraw();
  }

  /**
   * Update the internal transform matrix
   */
  private updateTransformMatrix(): void {
    // Start with identity matrix
    this.transformMatrix = new DOMMatrix();

    // Get center point for transforms
    const centerX = RectUtils.centerX(this.bounds);
    const centerY = RectUtils.centerY(this.bounds);

    // Apply transforms in order: translate to origin, scale, rotate, skew, translate back
    this.transformMatrix = this.transformMatrix
      .translate(centerX, centerY)
      .rotate(this.rotation)
      .scale(this.scaleX, this.scaleY)
      .skewX((this.skewX * Math.PI) / 180)
      .skewY((this.skewY * Math.PI) / 180)
      .translate(-centerX, -centerY);
  }

  /**
   * Get the transform matrix
   */
  getTransformMatrix(): DOMMatrix {
    // Create a copy of the matrix
    const m = this.transformMatrix;
    const copy = new DOMMatrix();
    copy.a = m.a;
    copy.b = m.b;
    copy.c = m.c;
    copy.d = m.d;
    copy.e = m.e;
    copy.f = m.f;
    return copy;
  }

  /**
   * Apply the actor's transform to a canvas context
   */
  protected applyTransform(ctx: CanvasRenderingContext2D): void {
    if (
      this.rotation !== 0 ||
      this.scaleX !== 1 ||
      this.scaleY !== 1 ||
      this.skewX !== 0 ||
      this.skewY !== 0
    ) {
      const m = this.transformMatrix;
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    }
  }

  /**
   * Apply visual effects (opacity and shadow) to a canvas context
   */
  protected applyVisualEffects(ctx: CanvasRenderingContext2D): void {
    // Apply opacity
    if (this.opacity < 1) {
      ctx.globalAlpha = this.opacity;
    }

    // Apply shadow
    if (this.shadowColor) {
      ctx.shadowColor = ColorUtils.toCSS(this.shadowColor);
      ctx.shadowBlur = this.shadowBlur;
      ctx.shadowOffsetX = this.shadowOffsetX;
      ctx.shadowOffsetY = this.shadowOffsetY;
    }
  }

  /**
   * Clear visual effects from canvas context
   */
  protected clearVisualEffects(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Hit testing

  containsPoint(x: number, y: number): boolean {
    // If there are transforms, we need to transform the point
    if (
      this.rotation !== 0 ||
      this.scaleX !== 1 ||
      this.scaleY !== 1 ||
      this.skewX !== 0 ||
      this.skewY !== 0
    ) {
      // Apply inverse transform to the point
      try {
        const inverse = this.transformMatrix.inverse();
        const point = new DOMPoint(x, y);
        const transformed = point.matrixTransform(inverse);
        return RectUtils.contains(this.bounds, transformed.x, transformed.y);
      } catch {
        // If matrix is not invertible, fall back to simple bounds check
        return RectUtils.contains(this.bounds, x, y);
      }
    }
    return RectUtils.contains(this.bounds, x, y);
  }

  // Drawing

  /**
   * Mark this actor as needing to be redrawn
   */
  protected setNeedsDraw(): void {
    // In a full implementation, this would notify the stage
    // For now, it's a placeholder
  }

  /**
   * Render this actor to a canvas context
   * Subclasses must implement this
   */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Helper method to apply fill color before drawing
   */
  protected applyFillStyle(ctx: CanvasRenderingContext2D): void {
    if (this.fillColor) {
      if (this.fillColor instanceof Gradient) {
        this.fillColor.applyToContext(ctx, this.bounds);
      } else {
        ctx.fillStyle = ColorUtils.toCSS(this.fillColor);
      }
    }
  }

  /**
   * Helper method to apply frame color before drawing
   */
  protected applyFrameStyle(ctx: CanvasRenderingContext2D): void {
    if (this.frameColor) {
      ctx.strokeStyle = ColorUtils.toCSS(this.frameColor);
      ctx.lineWidth = this.lineWidth;
    }
  }

  /**
   * Draw fill if fillColor is set
   */
  protected drawFill(ctx: CanvasRenderingContext2D): void {
    if (this.fillColor) {
      this.applyFillStyle(ctx);
      ctx.fill();
    }
  }

  /**
   * Draw frame if frameColor is set
   */
  protected drawFrame(ctx: CanvasRenderingContext2D): void {
    if (this.frameColor) {
      this.applyFrameStyle(ctx);
      ctx.stroke();
    }
  }

  // Drag and drop

  getDraggable(): boolean {
    return this._draggable;
  }

  setDraggable(value: boolean): void {
    this._draggable = value;
  }

  getDroppable(): boolean {
    return this._droppable;
  }

  setDroppable(value: boolean): void {
    this._droppable = value;
  }

  // Event handling

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
   * Dispatch an event
   */
  dispatchEvent(event: SK8Event): boolean {
    event.target = this;
    event.currentTarget = this;

    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      const listenersCopy = [...listeners];
      for (const entry of listenersCopy) {
        if (event.immediatePropagationStopped) break;

        try {
          entry.listener.call(this, event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }

        if (entry.options.once) {
          this.removeEventListener(event.type, entry.listener);
        }
      }
    }

    return !event.defaultPrevented;
  }

  /**
   * Legacy event handlers for backward compatibility
   */
  onClick(x: number, y: number): void {
    // Override in subclasses or use handler system
    if (this.hasHandler('click')) {
      this.callHandler('click', x, y);
    }
  }

  onMouseDown(x: number, y: number): void {
    if (this.hasHandler('mouseDown')) {
      this.callHandler('mouseDown', x, y);
    }
  }

  onMouseUp(x: number, y: number): void {
    if (this.hasHandler('mouseUp')) {
      this.callHandler('mouseUp', x, y);
    }
  }

  onMouseMove(x: number, y: number): void {
    if (this.hasHandler('mouseMove')) {
      this.callHandler('mouseMove', x, y);
    }
  }
}
