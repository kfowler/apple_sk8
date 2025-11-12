/**
 * Concrete shape classes - Rectangle, RoundRect, Circle, Text
 */

import { SK8Actor } from './SK8Actor.js';
import { RectUtils } from './types.js';

/**
 * SK8Rectangle - A rectangular actor
 */
export class SK8Rectangle extends SK8Actor {
  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Rectangle');
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);

    ctx.beginPath();
    ctx.rect(x, y, width, height);

    this.drawFill(ctx);
    this.drawFrame(ctx);
  }
}

/**
 * SK8RoundRect - A rectangle with rounded corners
 */
export class SK8RoundRect extends SK8Actor {
  private cornerRadius: number = 10;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'RoundRect');

    this.defineProperty('cornerRadius', {
      getter: () => this.getCornerRadius(),
      setter: (value: number) => this.setCornerRadius(value)
    });
  }

  getCornerRadius(): number {
    return this.cornerRadius;
  }

  setCornerRadius(radius: number): void {
    this.cornerRadius = radius;
    this.setNeedsDraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);
    const radius = this.cornerRadius;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    this.drawFill(ctx);
    this.drawFrame(ctx);
  }
}

/**
 * SK8Circle - A circular actor (actually an oval that fits in bounds)
 */
export class SK8Circle extends SK8Actor {
  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Circle');
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const centerX = RectUtils.centerX(bounds);
    const centerY = RectUtils.centerY(bounds);
    const radiusX = RectUtils.width(bounds) / 2;
    const radiusY = RectUtils.height(bounds) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

    this.drawFill(ctx);
    this.drawFrame(ctx);
  }
}

/**
 * SK8Text - A text actor
 */
export class SK8Text extends SK8Actor {
  private text: string = '';
  private fontSize: number = 16;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private textAlign: CanvasTextAlign = 'left';
  private textBaseline: CanvasTextBaseline = 'top';

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Text');

    // Define text properties
    this.defineProperty('text', {
      getter: () => this.getText(),
      setter: (value: string) => this.setText(value)
    });

    this.defineProperty('fontSize', {
      getter: () => this.getFontSize(),
      setter: (value: number) => this.setFontSize(value)
    });

    this.defineProperty('fontFamily', {
      getter: () => this.getFontFamily(),
      setter: (value: string) => this.setFontFamily(value)
    });
  }

  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
    this.setNeedsDraw();
  }

  getFontSize(): number {
    return this.fontSize;
  }

  setFontSize(size: number): void {
    this.fontSize = size;
    this.setNeedsDraw();
  }

  getFontFamily(): string {
    return this.fontFamily;
  }

  setFontFamily(family: string): void {
    this.fontFamily = family;
    this.setNeedsDraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;

    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    // Draw fill (text color)
    if (this.getFillColor()) {
      this.applyFillStyle(ctx);
      ctx.fillText(this.text, x, y);
    }

    // Draw frame (outline)
    if (this.getFrameColor()) {
      this.applyFrameStyle(ctx);
      ctx.strokeText(this.text, x, y);
    }
  }
}

/**
 * SK8Line - A line actor
 */
export class SK8Line extends SK8Actor {
  private startX: number = 0;
  private startY: number = 0;
  private endX: number = 100;
  private endY: number = 100;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Line');

    this.defineProperty('startX', {
      getter: () => this.getStartX(),
      setter: (value: number) => this.setStartX(value)
    });

    this.defineProperty('startY', {
      getter: () => this.getStartY(),
      setter: (value: number) => this.setStartY(value)
    });

    this.defineProperty('endX', {
      getter: () => this.getEndX(),
      setter: (value: number) => this.setEndX(value)
    });

    this.defineProperty('endY', {
      getter: () => this.getEndY(),
      setter: (value: number) => this.setEndY(value)
    });
  }

  getStartX(): number { return this.startX; }
  setStartX(value: number): void { this.startX = value; this.setNeedsDraw(); }

  getStartY(): number { return this.startY; }
  setStartY(value: number): void { this.startY = value; this.setNeedsDraw(); }

  getEndX(): number { return this.endX; }
  setEndX(value: number): void { this.endX = value; this.setNeedsDraw(); }

  getEndY(): number { return this.endY; }
  setEndY(value: number): void { this.endY = value; this.setNeedsDraw(); }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);

    this.drawFrame(ctx);
  }
}
