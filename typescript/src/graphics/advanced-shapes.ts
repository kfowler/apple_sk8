/**
 * Advanced shape actors - Polygon, Image, Group
 */

import { SK8Actor } from './SK8Actor.js';
import { Point, RectUtils } from './types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

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
      setter: (value: Point[]) => this.setPoints(value),
    });

    this.defineProperty('closed', {
      getter: () => this.getClosed(),
      setter: (value: boolean) => this.setClosed(value),
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
      bottom: maxY,
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

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }
}

/**
 * Image cache to avoid reloading the same images
 */
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Image fit modes
 */
export enum ImageFitMode {
  FILL = 'fill', // Fill the bounds, may distort
  CONTAIN = 'contain', // Fit within bounds, maintain aspect ratio
  COVER = 'cover', // Cover bounds, maintain aspect ratio, may crop
  NONE = 'none', // Original size, centered
  STRETCH = 'stretch', // Same as FILL
}

/**
 * Image transformation options
 */
export interface ImageTransform {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  cropRect?: { x: number; y: number; width: number; height: number };
}

/**
 * Image effect options
 */
export interface ImageEffects {
  brightness?: number; // 0-2, default 1
  contrast?: number; // 0-2, default 1
  grayscale?: boolean;
  blur?: number; // pixels
  opacity?: number; // 0-1, default 1
}

/**
 * SK8Image - An enhanced image actor with caching, transformations, and effects
 */
export class SK8Image extends SK8Actor {
  private image: HTMLImageElement | null = null;
  private imageUrl: string | null = null;
  private loaded: boolean = false;
  private loading: boolean = false;
  private error: Error | null = null;

  // Transform and effects
  private fitMode: ImageFitMode = ImageFitMode.FILL;
  private maintainAspectRatio: boolean = true;
  private transform: ImageTransform = {};
  private effects: ImageEffects = {};

  // Caching
  private static useCache: boolean = true;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Image');

    this.defineProperty('src', {
      getter: () => this.getSource(),
      setter: (value: string) => this.setSource(value),
    });

    this.defineProperty('loaded', {
      getter: () => this.isLoaded(),
    });

    this.defineProperty('loading', {
      getter: () => this.isLoading(),
    });

    this.defineProperty('fitMode', {
      getter: () => this.getFitMode(),
      setter: (value: ImageFitMode) => this.setFitMode(value),
    });

    this.defineProperty('maintainAspectRatio', {
      getter: () => this.getMaintainAspectRatio(),
      setter: (value: boolean) => this.setMaintainAspectRatio(value),
    });
  }

  getSource(): string | null {
    return this.imageUrl;
  }

  setSource(url: string): void {
    this.imageUrl = url;
    this.loaded = false;
    this.loading = true;
    this.error = null;

    // Check cache first
    if (SK8Image.useCache && imageCache.has(url)) {
      this.image = imageCache.get(url)!;
      this.onImageLoaded();
      return;
    }

    this.image = new Image();

    // Enable CORS for cross-origin images
    this.image.crossOrigin = 'anonymous';

    this.image.onload = () => {
      this.onImageLoaded();

      // Add to cache
      if (SK8Image.useCache && this.image) {
        imageCache.set(url, this.image);
      }
    };

    this.image.onerror = (event) => {
      this.loading = false;
      this.error = new Error(`Failed to load image: ${url}`);
      console.error(this.error.message);

      // Call error handler if defined
      if (this.hasHandler('error')) {
        this.callHandler('error', url, event);
      }

      // Dispatch error event
      this.dispatchEvent(
        new SK8CustomEvent('imageError', {
          detail: { url, error: this.error },
        })
      );

      this.setNeedsDraw();
    };

    this.image.onprogress = (event: ProgressEvent) => {
      if (this.hasHandler('progress')) {
        this.callHandler('progress', event.loaded, event.total);
      }
    };

    this.image.src = url;
  }

  private onImageLoaded(): void {
    this.loaded = true;
    this.loading = false;

    // Auto-size to image dimensions if bounds are default
    const bounds = this.getBoundsRect();
    if (RectUtils.width(bounds) === 100 && RectUtils.height(bounds) === 100 && this.image) {
      this.setWidth(this.image.naturalWidth);
      this.setHeight(this.image.naturalHeight);
    }

    this.setNeedsDraw();

    // Call loaded handler if defined
    if (this.hasHandler('loaded')) {
      this.callHandler('loaded');
    }

    // Dispatch load event
    this.dispatchEvent(
      new SK8CustomEvent('imageLoad', {
        detail: { url: this.imageUrl },
      })
    );
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  isLoading(): boolean {
    return this.loading;
  }

  getError(): Error | null {
    return this.error;
  }

  // Fit mode
  getFitMode(): ImageFitMode {
    return this.fitMode;
  }

  setFitMode(mode: ImageFitMode): void {
    this.fitMode = mode;
    this.setNeedsDraw();
  }

  getMaintainAspectRatio(): boolean {
    return this.maintainAspectRatio;
  }

  setMaintainAspectRatio(value: boolean): void {
    this.maintainAspectRatio = value;
    this.setNeedsDraw();
  }

  // Transformations
  setFlipHorizontal(flip: boolean): void {
    this.transform.flipHorizontal = flip;
    this.setNeedsDraw();
  }

  setFlipVertical(flip: boolean): void {
    this.transform.flipVertical = flip;
    this.setNeedsDraw();
  }

  setCrop(x: number, y: number, width: number, height: number): void {
    this.transform.cropRect = { x, y, width, height };
    this.setNeedsDraw();
  }

  clearCrop(): void {
    this.transform.cropRect = undefined;
    this.setNeedsDraw();
  }

  // Effects
  setBrightness(value: number): void {
    this.effects.brightness = Math.max(0, Math.min(2, value));
    this.setNeedsDraw();
  }

  setContrast(value: number): void {
    this.effects.contrast = Math.max(0, Math.min(2, value));
    this.setNeedsDraw();
  }

  setGrayscale(enabled: boolean): void {
    this.effects.grayscale = enabled;
    this.setNeedsDraw();
  }

  setBlur(pixels: number): void {
    this.effects.blur = Math.max(0, pixels);
    this.setNeedsDraw();
  }

  setOpacity(value: number): void {
    this.effects.opacity = Math.max(0, Math.min(1, value));
    this.setNeedsDraw();
  }

  /**
   * Get natural image dimensions
   */
  getNaturalWidth(): number {
    return this.image?.naturalWidth ?? 0;
  }

  getNaturalHeight(): number {
    return this.image?.naturalHeight ?? 0;
  }

  /**
   * Calculate draw rectangle based on fit mode
   */
  private calculateDrawRect(bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }): { x: number; y: number; width: number; height: number } {
    const bWidth = RectUtils.width(bounds);
    const bHeight = RectUtils.height(bounds);

    if (!this.image || !this.maintainAspectRatio || this.fitMode === ImageFitMode.FILL) {
      return {
        x: bounds.left,
        y: bounds.top,
        width: bWidth,
        height: bHeight,
      };
    }

    const imgWidth = this.image.naturalWidth;
    const imgHeight = this.image.naturalHeight;
    const imgAspect = imgWidth / imgHeight;
    const boundsAspect = bWidth / bHeight;

    let drawWidth = bWidth;
    let drawHeight = bHeight;
    let drawX = bounds.left;
    let drawY = bounds.top;

    switch (this.fitMode) {
      case ImageFitMode.CONTAIN:
        if (imgAspect > boundsAspect) {
          drawHeight = bWidth / imgAspect;
          drawY = bounds.top + (bHeight - drawHeight) / 2;
        } else {
          drawWidth = bHeight * imgAspect;
          drawX = bounds.left + (bWidth - drawWidth) / 2;
        }
        break;

      case ImageFitMode.COVER:
        if (imgAspect > boundsAspect) {
          drawWidth = bHeight * imgAspect;
          drawX = bounds.left + (bWidth - drawWidth) / 2;
        } else {
          drawHeight = bWidth / imgAspect;
          drawY = bounds.top + (bHeight - drawHeight) / 2;
        }
        break;

      case ImageFitMode.NONE:
        drawWidth = imgWidth;
        drawHeight = imgHeight;
        drawX = bounds.left + (bWidth - imgWidth) / 2;
        drawY = bounds.top + (bHeight - imgHeight) / 2;
        break;
    }

    return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
  }

  /**
   * Apply image effects using canvas filters
   */
  private applyEffects(ctx: CanvasRenderingContext2D): void {
    const filters: string[] = [];

    if (this.effects.brightness !== undefined && this.effects.brightness !== 1) {
      filters.push(`brightness(${this.effects.brightness})`);
    }

    if (this.effects.contrast !== undefined && this.effects.contrast !== 1) {
      filters.push(`contrast(${this.effects.contrast})`);
    }

    if (this.effects.grayscale) {
      filters.push('grayscale(100%)');
    }

    if (this.effects.blur && this.effects.blur > 0) {
      filters.push(`blur(${this.effects.blur}px)`);
    }

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    if (this.effects.opacity !== undefined && this.effects.opacity !== 1) {
      ctx.globalAlpha = this.effects.opacity;
    }
  }

  /**
   * Reset effects
   */
  private resetEffects(ctx: CanvasRenderingContext2D): void {
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
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
      ctx.save();

      // Apply effects
      this.applyEffects(ctx);

      const drawRect = this.calculateDrawRect(bounds);

      // Handle transformations
      if (this.transform.flipHorizontal || this.transform.flipVertical) {
        ctx.translate(drawRect.x + drawRect.width / 2, drawRect.y + drawRect.height / 2);
        ctx.scale(
          this.transform.flipHorizontal ? -1 : 1,
          this.transform.flipVertical ? -1 : 1
        );
        ctx.translate(-(drawRect.x + drawRect.width / 2), -(drawRect.y + drawRect.height / 2));
      }

      // Handle cropping
      if (this.transform.cropRect) {
        const crop = this.transform.cropRect;
        ctx.drawImage(
          this.image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          drawRect.x,
          drawRect.y,
          drawRect.width,
          drawRect.height
        );
      } else {
        ctx.drawImage(this.image, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
      }

      this.resetEffects(ctx);
      ctx.restore();
    } else if (this.loading) {
      // Draw loading placeholder
      if (this.getFillColor()) {
        this.applyFillStyle(ctx);
        ctx.fillRect(x, y, width, height);
      }

      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', x + width / 2, y + height / 2);
    } else if (this.error) {
      // Draw error placeholder
      ctx.fillStyle = '#fee';
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = '#c00';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error loading image', x + width / 2, y + height / 2);
    }
  }

  /**
   * Convert image to canvas for further manipulation
   */
  toCanvas(): HTMLCanvasElement | null {
    if (!this.image || !this.loaded) return null;

    const canvas = document.createElement('canvas');
    const bounds = this.getBoundsRect();
    canvas.width = RectUtils.width(bounds);
    canvas.height = RectUtils.height(bounds);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.render(ctx);
    }

    return canvas;
  }

  /**
   * Static methods for cache management
   */
  static clearCache(): void {
    imageCache.clear();
  }

  static getCacheSize(): number {
    return imageCache.size;
  }

  static removeFromCache(url: string): boolean {
    return imageCache.delete(url);
  }

  static setCacheEnabled(enabled: boolean): void {
    SK8Image.useCache = enabled;
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
      getter: () => this.getChildren(),
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
      bottom: maxY,
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
      ctx.rect(bounds.left, bounds.top, RectUtils.width(bounds), RectUtils.height(bounds));
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
    const angle = (i * angleStep) / 2 - Math.PI / 2;
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
