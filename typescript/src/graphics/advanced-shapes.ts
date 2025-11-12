/**
 * Advanced shape actors - Polygon, Image, Group
 */

import { SK8Actor } from './SK8Actor.js';
import { Point, RectUtils } from './types.js';

/**
 * SK8Polygon - A polygon defined by points
 */
export class SK8Polygon extends SK8Actor {
  private points: Point[] = [];
  private closed: boolean = true;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Polygon');

    this.defineProperty('points', {
      getter: () => this.getPoints(),
      setter: (value: Point[]) => this.setPoints(value)
    });

    this.defineProperty('closed', {
      getter: () => this.getClosed(),
      setter: (value: boolean) => this.setClosed(value)
    });
  }

  getPoints(): Point[] {
    return [...this.points];
  }

  setPoints(points: Point[]): void {
    this.points = [...points];
    this.updateBoundsFromPoints();
    this.setNeedsDraw();
  }

  addPoint(x: number, y: number): void {
    this.points.push({ x, y });
    this.updateBoundsFromPoints();
    this.setNeedsDraw();
  }

  removePointAt(index: number): void {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);
      this.updateBoundsFromPoints();
      this.setNeedsDraw();
    }
  }

  clearPoints(): void {
    this.points = [];
    this.setNeedsDraw();
  }

  getClosed(): boolean {
    return this.closed;
  }

  setClosed(closed: boolean): void {
    this.closed = closed;
    this.setNeedsDraw();
  }

  private updateBoundsFromPoints(): void {
    if (this.points.length === 0) {
      return;
    }

    let minX = this.points[0].x;
    let minY = this.points[0].y;
    let maxX = this.points[0].x;
    let maxY = this.points[0].y;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    this.setBoundsRect({
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible() || this.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    if (this.closed && this.points.length > 2) {
      ctx.closePath();
    }

    this.drawFill(ctx);
    this.drawFrame(ctx);
  }

  containsPoint(x: number, y: number): boolean {
    if (this.points.length < 3 || !this.closed) {
      // For open polygons or lines, just check bounding box
      return super.containsPoint(x, y);
    }

    // Point-in-polygon test using ray casting algorithm
    let inside = false;
    for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
      const xi = this.points[i].x;
      const yi = this.points[i].y;
      const xj = this.points[j].x;
      const yj = this.points[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }
}

/**
 * SK8Image - An image actor
 */
export class SK8Image extends SK8Actor {
  private image: HTMLImageElement | null = null;
  private imageUrl: string | null = null;
  private loaded: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Image');

    this.defineProperty('src', {
      getter: () => this.getSource(),
      setter: (value: string) => this.setSource(value)
    });

    this.defineProperty('loaded', {
      getter: () => this.isLoaded()
    });
  }

  getSource(): string | null {
    return this.imageUrl;
  }

  setSource(url: string): void {
    this.imageUrl = url;
    this.loaded = false;

    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;

      // Auto-size to image dimensions if bounds not set
      const bounds = this.getBoundsRect();
      if (RectUtils.width(bounds) === 100 && RectUtils.height(bounds) === 100) {
        this.setWidth(this.image!.naturalWidth);
        this.setHeight(this.image!.naturalHeight);
      }

      this.setNeedsDraw();

      // Call loaded handler if defined
      if (this.hasHandler('loaded')) {
        this.callHandler('loaded');
      }
    };

    this.image.onerror = () => {
      console.error(`Failed to load image: ${url}`);
      if (this.hasHandler('error')) {
        this.callHandler('error', url);
      }
    };

    this.image.src = url;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);

    // Draw frame first if set
    if (this.getFrameColor()) {
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      this.drawFrame(ctx);
    }

    // Draw image if loaded
    if (this.image && this.loaded) {
      ctx.drawImage(this.image, x, y, width, height);
    } else {
      // Draw placeholder
      if (this.getFillColor()) {
        this.applyFillStyle(ctx);
        ctx.fillRect(x, y, width, height);
      }

      // Draw "loading" text
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', x + width / 2, y + height / 2);
    }
  }
}

/**
 * SK8Group - A container for multiple actors
 */
export class SK8Group extends SK8Actor {
  private children: SK8Actor[] = [];

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Group');

    this.defineProperty('children', {
      getter: () => this.getChildren()
    });
  }

  getChildren(): SK8Actor[] {
    return [...this.children];
  }

  addChild(actor: SK8Actor): void {
    if (!this.children.includes(actor)) {
      this.children.push(actor);
      this.updateBoundsFromChildren();
      this.setNeedsDraw();
    }
  }

  removeChild(actor: SK8Actor): void {
    const index = this.children.indexOf(actor);
    if (index !== -1) {
      this.children.splice(index, 1);
      this.updateBoundsFromChildren();
      this.setNeedsDraw();
    }
  }

  clearChildren(): void {
    this.children = [];
    this.setNeedsDraw();
  }

  private updateBoundsFromChildren(): void {
    if (this.children.length === 0) {
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of this.children) {
      const bounds = child.getBoundsRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.right);
      maxY = Math.max(maxY, bounds.bottom);
    }

    this.setBoundsRect({
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    // Render all children
    for (const child of this.children) {
      if (child.getVisible()) {
        ctx.save();
        child.render(ctx);
        ctx.restore();
      }
    }

    // Optionally draw group bounds
    if (this.getFrameColor()) {
      const bounds = this.getBoundsRect();
      ctx.beginPath();
      ctx.rect(bounds.left, bounds.top,
               RectUtils.width(bounds),
               RectUtils.height(bounds));
      this.drawFrame(ctx);
    }
  }

  containsPoint(x: number, y: number): boolean {
    // Check if any child contains the point
    for (const child of this.children) {
      if (child.getVisible() && child.containsPoint(x, y)) {
        return true;
      }
    }
    return false;
  }

  // Propagate events to children
  onClick(x: number, y: number): void {
    for (const child of this.children) {
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onClick(x, y);
      }
    }
    super.onClick(x, y);
  }

  onMouseDown(x: number, y: number): void {
    for (const child of this.children) {
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onMouseDown(x, y);
      }
    }
    super.onMouseDown(x, y);
  }

  onMouseUp(x: number, y: number): void {
    for (const child of this.children) {
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onMouseUp(x, y);
      }
    }
    super.onMouseUp(x, y);
  }

  onMouseMove(x: number, y: number): void {
    for (const child of this.children) {
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onMouseMove(x, y);
      }
    }
    super.onMouseMove(x, y);
  }
}

/**
 * Helper functions for creating advanced shapes
 */

/**
 * Create a star polygon
 */
export function createStar(
  centerX: number,
  centerY: number,
  points: number,
  outerRadius: number,
  innerRadius: number
): SK8Polygon {
  const star = new SK8Polygon();
  const angleStep = (Math.PI * 2) / points;

  for (let i = 0; i < points * 2; i++) {
    const angle = i * angleStep / 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    star.addPoint(x, y);
  }

  return star;
}

/**
 * Create a regular polygon
 */
export function createRegularPolygon(
  centerX: number,
  centerY: number,
  sides: number,
  radius: number
): SK8Polygon {
  const poly = new SK8Polygon();
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    poly.addPoint(x, y);
  }

  return poly;
}
