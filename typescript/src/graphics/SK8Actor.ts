/**
 * SK8Actor - Base class for all visual objects
 *
 * In SK8, everything visual is an Actor that lives on a Stage.
 * This implements the core actor functionality.
 */

import { SK8Object } from '../core/SK8Object.js';
import { Rect, Color, RectUtils, ColorUtils } from './types.js';

export abstract class SK8Actor extends SK8Object {
  private bounds: Rect;
  private visible: boolean = true;
  private fillColor: Color | null = null;
  private frameColor: Color | null = null;
  private lineWidth: number = 1;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Actor');
    this.bounds = { left: 0, top: 0, right: 100, bottom: 100 };

    // Set up default properties using the property system
    this.defineProperty('boundsRect', {
      getter: () => this.getBoundsRect(),
      setter: (value: Rect) => this.setBoundsRect(value)
    });

    this.defineProperty('visible', {
      getter: () => this.getVisible(),
      setter: (value: boolean) => this.setVisible(value)
    });

    this.defineProperty('fillColor', {
      getter: () => this.getFillColor(),
      setter: (value: Color) => this.setFillColor(value)
    });

    this.defineProperty('frameColor', {
      getter: () => this.getFrameColor(),
      setter: (value: Color) => this.setFrameColor(value)
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

  getLeft(): number { return this.bounds.left; }
  getTop(): number { return this.bounds.top; }
  getRight(): number { return this.bounds.right; }
  getBottom(): number { return this.bounds.bottom; }

  getWidth(): number { return RectUtils.width(this.bounds); }
  getHeight(): number { return RectUtils.height(this.bounds); }

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

  getFillColor(): Color | null {
    return this.fillColor;
  }

  setFillColor(color: Color | null): void {
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

  // Hit testing

  containsPoint(x: number, y: number): boolean {
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
      ctx.fillStyle = ColorUtils.toCSS(this.fillColor);
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

  // Event handling (simplified for now)

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
