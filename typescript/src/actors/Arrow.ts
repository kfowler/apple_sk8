/**
 * SK8Arrow - An arrow shape with customizable head
 *
 * Draws an arrow from a start point to an end point with an arrowhead.
 * The arrowhead can be at the start, end, or both ends.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Point } from '../graphics/types.js';

export type ArrowDirection = 'end' | 'start' | 'both' | 'none';

export class SK8Arrow extends SK8Actor {
  private startPoint: Point = { x: 0, y: 0 };
  private endPoint: Point = { x: 100, y: 0 };
  private headSize: number = 15;
  private headAngle: number = 30; // degrees
  private direction: ArrowDirection = 'end';

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Arrow');

    // Define properties
    this.defineProperty('startPoint', {
      getter: () => this.getStartPoint(),
      setter: (value: Point) => this.setStartPoint(value),
    });

    this.defineProperty('endPoint', {
      getter: () => this.getEndPoint(),
      setter: (value: Point) => this.setEndPoint(value),
    });

    this.defineProperty('headSize', {
      getter: () => this.getHeadSize(),
      setter: (value: number) => this.setHeadSize(value),
    });

    this.defineProperty('headAngle', {
      getter: () => this.getHeadAngle(),
      setter: (value: number) => this.setHeadAngle(value),
    });

    this.defineProperty('direction', {
      getter: () => this.getDirection(),
      setter: (value: ArrowDirection) => this.setDirection(value),
    });
  }

  getStartPoint(): Point {
    return { ...this.startPoint };
  }

  setStartPoint(point: Point): void {
    this.startPoint = { ...point };
    this.updateBounds();
    this.setNeedsDraw();
  }

  getEndPoint(): Point {
    return { ...this.endPoint };
  }

  setEndPoint(point: Point): void {
    this.endPoint = { ...point };
    this.updateBounds();
    this.setNeedsDraw();
  }

  getHeadSize(): number {
    return this.headSize;
  }

  setHeadSize(size: number): void {
    this.headSize = Math.max(0, size);
    this.updateBounds();
    this.setNeedsDraw();
  }

  getHeadAngle(): number {
    return this.headAngle;
  }

  setHeadAngle(angle: number): void {
    this.headAngle = Math.max(0, Math.min(90, angle));
    this.setNeedsDraw();
  }

  getDirection(): ArrowDirection {
    return this.direction;
  }

  setDirection(direction: ArrowDirection): void {
    this.direction = direction;
    this.setNeedsDraw();
  }

  /**
   * Convenience method to set start and end points
   */
  setPoints(startX: number, startY: number, endX: number, endY: number): void {
    this.startPoint = { x: startX, y: startY };
    this.endPoint = { x: endX, y: endY };
    this.updateBounds();
    this.setNeedsDraw();
  }

  /**
   * Update bounds based on start and end points
   */
  private updateBounds(): void {
    const minX = Math.min(this.startPoint.x, this.endPoint.x) - this.headSize;
    const minY = Math.min(this.startPoint.y, this.endPoint.y) - this.headSize;
    const maxX = Math.max(this.startPoint.x, this.endPoint.x) + this.headSize;
    const maxY = Math.max(this.startPoint.y, this.endPoint.y) + this.headSize;

    this.setBoundsRect({
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
    });
  }

  /**
   * Calculate arrowhead points
   */
  private calculateArrowHead(
    fromPoint: Point,
    toPoint: Point
  ): { left: Point; right: Point } {
    // Calculate angle of the line
    const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);

    // Calculate arrowhead angle in radians
    const headAngleRad = (this.headAngle * Math.PI) / 180;

    // Calculate the two points of the arrowhead
    const leftAngle = angle + Math.PI - headAngleRad;
    const rightAngle = angle + Math.PI + headAngleRad;

    const left: Point = {
      x: toPoint.x + this.headSize * Math.cos(leftAngle),
      y: toPoint.y + this.headSize * Math.sin(leftAngle),
    };

    const right: Point = {
      x: toPoint.x + this.headSize * Math.cos(rightAngle),
      y: toPoint.y + this.headSize * Math.sin(rightAngle),
    };

    return { left, right };
  }

  /**
   * Draw an arrowhead at a point
   */
  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    fromPoint: Point,
    toPoint: Point
  ): void {
    const { left, right } = this.calculateArrowHead(fromPoint, toPoint);

    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(toPoint.x, toPoint.y);
    ctx.lineTo(right.x, right.y);

    // Fill the arrowhead if fillColor is set
    if (this.getFillColor()) {
      ctx.closePath();
      this.drawFill(ctx);
    }

    // Stroke the arrowhead
    if (this.getFrameColor()) {
      this.drawFrame(ctx);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    // Draw the arrow shaft
    ctx.beginPath();
    ctx.moveTo(this.startPoint.x, this.startPoint.y);
    ctx.lineTo(this.endPoint.x, this.endPoint.y);
    this.drawFrame(ctx);

    // Draw arrowheads based on direction
    if (this.direction === 'end' || this.direction === 'both') {
      this.drawArrowHead(ctx, this.startPoint, this.endPoint);
    }

    if (this.direction === 'start' || this.direction === 'both') {
      this.drawArrowHead(ctx, this.endPoint, this.startPoint);
    }
  }

  /**
   * Check if a point is near the arrow line
   */
  containsPoint(x: number, y: number): boolean {
    // Calculate distance from point to line segment
    const A = x - this.startPoint.x;
    const B = y - this.startPoint.y;
    const C = this.endPoint.x - this.startPoint.x;
    const D = this.endPoint.y - this.startPoint.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
      xx = this.startPoint.x;
      yy = this.startPoint.y;
    } else if (param > 1) {
      xx = this.endPoint.x;
      yy = this.endPoint.y;
    } else {
      xx = this.startPoint.x + param * C;
      yy = this.startPoint.y + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Consider the line "hit" if within lineWidth + some tolerance
    const tolerance = Math.max(this.getLineWidth() * 2, 10);
    return distance <= tolerance;
  }
}
