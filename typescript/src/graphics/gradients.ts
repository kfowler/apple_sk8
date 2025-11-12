/**
 * Gradient support for SK8 graphics
 *
 * Provides linear and radial gradients for filling shapes
 */

import { Color, ColorUtils } from './types.js';

/**
 * Color stop for gradients
 */
export interface ColorStop {
  offset: number; // 0 to 1
  color: Color;
}

/**
 * Base gradient class
 */
export abstract class Gradient {
  protected colorStops: ColorStop[] = [];

  /**
   * Add a color stop to the gradient
   */
  addColorStop(offset: number, color: Color): this {
    if (offset < 0 || offset > 1) {
      throw new Error('Color stop offset must be between 0 and 1');
    }
    this.colorStops.push({ offset, color });
    // Sort by offset
    this.colorStops.sort((a, b) => a.offset - b.offset);
    return this;
  }

  /**
   * Remove all color stops
   */
  clearColorStops(): void {
    this.colorStops = [];
  }

  /**
   * Get all color stops
   */
  getColorStops(): ColorStop[] {
    return [...this.colorStops];
  }

  /**
   * Create a canvas gradient object
   */
  abstract createCanvasGradient(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): CanvasGradient;

  /**
   * Apply this gradient to a canvas context
   */
  applyToContext(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): void {
    const canvasGradient = this.createCanvasGradient(ctx, bounds);

    // Add color stops
    for (const stop of this.colorStops) {
      canvasGradient.addColorStop(stop.offset, ColorUtils.toCSS(stop.color));
    }

    ctx.fillStyle = canvasGradient;
  }
}

/**
 * Linear gradient
 */
export class LinearGradient extends Gradient {
  private x0Ratio: number = 0;  // Start X as ratio of width
  private y0Ratio: number = 0;  // Start Y as ratio of height
  private x1Ratio: number = 1;  // End X as ratio of width
  private y1Ratio: number = 0;  // End Y as ratio of height

  /**
   * Create a linear gradient
   * @param x0 Start X (0 to 1 as ratio of bounds)
   * @param y0 Start Y (0 to 1 as ratio of bounds)
   * @param x1 End X (0 to 1 as ratio of bounds)
   * @param y1 End Y (0 to 1 as ratio of bounds)
   */
  constructor(x0: number = 0, y0: number = 0, x1: number = 1, y1: number = 0) {
    super();
    this.x0Ratio = x0;
    this.y0Ratio = y0;
    this.x1Ratio = x1;
    this.y1Ratio = y1;
  }

  /**
   * Set the gradient direction
   */
  setDirection(x0: number, y0: number, x1: number, y1: number): this {
    this.x0Ratio = x0;
    this.y0Ratio = y0;
    this.x1Ratio = x1;
    this.y1Ratio = y1;
    return this;
  }

  createCanvasGradient(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): CanvasGradient {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;

    const x0 = bounds.left + width * this.x0Ratio;
    const y0 = bounds.top + height * this.y0Ratio;
    const x1 = bounds.left + width * this.x1Ratio;
    const y1 = bounds.top + height * this.y1Ratio;

    return ctx.createLinearGradient(x0, y0, x1, y1);
  }

  /**
   * Create a horizontal gradient (left to right)
   */
  static horizontal(): LinearGradient {
    return new LinearGradient(0, 0.5, 1, 0.5);
  }

  /**
   * Create a vertical gradient (top to bottom)
   */
  static vertical(): LinearGradient {
    return new LinearGradient(0.5, 0, 0.5, 1);
  }

  /**
   * Create a diagonal gradient (top-left to bottom-right)
   */
  static diagonal(): LinearGradient {
    return new LinearGradient(0, 0, 1, 1);
  }
}

/**
 * Radial gradient
 */
export class RadialGradient extends Gradient {
  private x0Ratio: number = 0.5;  // Center X as ratio of width
  private y0Ratio: number = 0.5;  // Center Y as ratio of height
  private r0Ratio: number = 0;    // Inner radius as ratio of bounds
  private x1Ratio: number = 0.5;  // Outer center X as ratio of width
  private y1Ratio: number = 0.5;  // Outer center Y as ratio of height
  private r1Ratio: number = 0.5;  // Outer radius as ratio of bounds

  /**
   * Create a radial gradient
   * @param x0 Inner circle center X (0 to 1 as ratio of bounds)
   * @param y0 Inner circle center Y (0 to 1 as ratio of bounds)
   * @param r0 Inner circle radius (0 to 1 as ratio of bounds)
   * @param x1 Outer circle center X (0 to 1 as ratio of bounds)
   * @param y1 Outer circle center Y (0 to 1 as ratio of bounds)
   * @param r1 Outer circle radius (0 to 1 as ratio of bounds)
   */
  constructor(
    x0: number = 0.5,
    y0: number = 0.5,
    r0: number = 0,
    x1: number = 0.5,
    y1: number = 0.5,
    r1: number = 0.5
  ) {
    super();
    this.x0Ratio = x0;
    this.y0Ratio = y0;
    this.r0Ratio = r0;
    this.x1Ratio = x1;
    this.y1Ratio = y1;
    this.r1Ratio = r1;
  }

  /**
   * Set the gradient parameters
   */
  setParameters(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): this {
    this.x0Ratio = x0;
    this.y0Ratio = y0;
    this.r0Ratio = r0;
    this.x1Ratio = x1;
    this.y1Ratio = y1;
    this.r1Ratio = r1;
    return this;
  }

  createCanvasGradient(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): CanvasGradient {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const size = Math.max(width, height);

    const x0 = bounds.left + width * this.x0Ratio;
    const y0 = bounds.top + height * this.y0Ratio;
    const r0 = size * this.r0Ratio;

    const x1 = bounds.left + width * this.x1Ratio;
    const y1 = bounds.top + height * this.y1Ratio;
    const r1 = size * this.r1Ratio;

    return ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  /**
   * Create a centered radial gradient
   */
  static centered(): RadialGradient {
    return new RadialGradient(0.5, 0.5, 0, 0.5, 0.5, 0.5);
  }

  /**
   * Create a spotlight effect (off-center)
   */
  static spotlight(x: number = 0.3, y: number = 0.3): RadialGradient {
    return new RadialGradient(x, y, 0, 0.5, 0.5, 0.7);
  }
}
