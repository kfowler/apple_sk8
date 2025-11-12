/**
 * SK8Star - A star shape with configurable points
 *
 * Creates a star with a specified number of points, inner and outer radius.
 * Center-based positioning for easy placement.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Point, RectUtils } from '../graphics/types.js';

export class SK8Star extends SK8Actor {
  private numPoints: number = 5;
  private innerRadius: number = 20;
  private outerRadius: number = 50;
  private centerX: number = 0;
  private centerY: number = 0;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Star');

    // Initialize with default center
    this.updateCenter();

    // Define properties
    this.defineProperty('numPoints', {
      getter: () => this.getNumPoints(),
      setter: (value: number) => this.setNumPoints(value),
    });

    this.defineProperty('innerRadius', {
      getter: () => this.getInnerRadius(),
      setter: (value: number) => this.setInnerRadius(value),
    });

    this.defineProperty('outerRadius', {
      getter: () => this.getOuterRadius(),
      setter: (value: number) => this.setOuterRadius(value),
    });

    this.defineProperty('centerX', {
      getter: () => this.getCenterX(),
      setter: (value: number) => this.setCenterX(value),
    });

    this.defineProperty('centerY', {
      getter: () => this.getCenterY(),
      setter: (value: number) => this.setCenterY(value),
    });
  }

  getNumPoints(): number {
    return this.numPoints;
  }

  setNumPoints(points: number): void {
    this.numPoints = Math.max(3, Math.floor(points));
    this.updateBounds();
    this.setNeedsDraw();
  }

  getInnerRadius(): number {
    return this.innerRadius;
  }

  setInnerRadius(radius: number): void {
    this.innerRadius = Math.max(0, radius);
    this.updateBounds();
    this.setNeedsDraw();
  }

  getOuterRadius(): number {
    return this.outerRadius;
  }

  setOuterRadius(radius: number): void {
    this.outerRadius = Math.max(0, radius);
    this.updateBounds();
    this.setNeedsDraw();
  }

  getCenterX(): number {
    return this.centerX;
  }

  setCenterX(x: number): void {
    this.centerX = x;
    this.updateBounds();
    this.setNeedsDraw();
  }

  getCenterY(): number {
    return this.centerY;
  }

  setCenterY(y: number): void {
    this.centerY = y;
    this.updateBounds();
    this.setNeedsDraw();
  }

  /**
   * Set the center point of the star
   */
  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.updateBounds();
    this.setNeedsDraw();
  }

  /**
   * Update center from bounds
   */
  private updateCenter(): void {
    const bounds = this.getBoundsRect();
    this.centerX = RectUtils.centerX(bounds);
    this.centerY = RectUtils.centerY(bounds);
  }

  /**
   * Update bounds from center and radii
   */
  private updateBounds(): void {
    this.setBoundsRect({
      left: this.centerX - this.outerRadius,
      top: this.centerY - this.outerRadius,
      right: this.centerX + this.outerRadius,
      bottom: this.centerY + this.outerRadius,
    });
  }

  /**
   * Calculate the points of the star
   */
  private calculatePoints(): Point[] {
    const points: Point[] = [];
    const angleStep = (Math.PI * 2) / this.numPoints;

    for (let i = 0; i < this.numPoints * 2; i++) {
      const angle = (i * angleStep) / 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      points.push({ x, y });
    }

    return points;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const points = this.calculatePoints();

    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.closePath();

    this.drawFill(ctx);
    this.drawFrame(ctx);
  }

  /**
   * Check if a point is inside the star
   */
  containsPoint(x: number, y: number): boolean {
    const points = this.calculatePoints();

    // Point-in-polygon test using ray casting algorithm
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Override setBoundsRect to maintain aspect ratio and center
   */
  setBoundsRect(rect: { left: number; top: number; right: number; bottom: number }): void {
    super.setBoundsRect(rect);
    this.updateCenter();
  }
}
