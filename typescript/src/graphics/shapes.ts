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
      setter: (value: number) => this.setCornerRadius(value),
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
 * SK8Text - A text actor with advanced styling
 */
export class SK8Text extends SK8Actor {
  private text: string = '';
  private textStyle: import('./text-style.js').TextStyle;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Text');

    // Import TextStyle dynamically to avoid circular dependencies
    const { TextStyle } = require('./text-style.js');
    this.textStyle = new TextStyle();

    // Define text properties
    this.defineProperty('text', {
      getter: () => this.getText(),
      setter: (value: string) => this.setText(value),
    });

    this.defineProperty('fontSize', {
      getter: () => this.getTextStyle().getFontSize(),
      setter: (value: number) => this.getTextStyle().setFontSize(value),
    });

    this.defineProperty('fontFamily', {
      getter: () => this.getTextStyle().getFontFamily(),
      setter: (value: string) => this.getTextStyle().setFontFamily(value),
    });
  }

  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
    this.setNeedsDraw();
  }

  /**
   * Get the text style
   */
  getTextStyle(): import('./text-style.js').TextStyle {
    return this.textStyle;
  }

  /**
   * Set the text style
   */
  setTextStyle(style: import('./text-style.js').TextStyle): void {
    this.textStyle = style;
    this.setNeedsDraw();
  }

  /**
   * Legacy methods for compatibility
   */
  getFontSize(): number {
    return this.textStyle.getFontSize();
  }

  setFontSize(size: number): void {
    this.textStyle.setFontSize(size);
    this.setNeedsDraw();
  }

  getFontFamily(): string {
    return this.textStyle.getFontFamily();
  }

  setFontFamily(family: string): void {
    this.textStyle.setFontFamily(family);
    this.setNeedsDraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;

    // Apply text style
    this.textStyle.applyToContext(ctx);

    // Handle multi-line text
    const maxWidth = this.textStyle.getMaxWidth() || RectUtils.width(bounds);
    const lines = this.textStyle.getWordWrap()
      ? this.wrapText(ctx, this.text, maxWidth)
      : this.text.split('\n');

    const lineHeight = this.textStyle.getLineHeightPixels();

    // Render each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineY = y + i * lineHeight;

      // Draw fill (text color)
      if (this.getFillColor()) {
        this.applyFillStyle(ctx);
        ctx.fillText(line, x, lineY);

        // Draw text decoration
        this.drawTextDecoration(ctx, line, x, lineY);
      }

      // Draw frame (outline)
      if (this.getFrameColor()) {
        this.applyFrameStyle(ctx);
        ctx.strokeText(line, x, lineY);
      }
    }
  }

  /**
   * Wrap text to fit within a given width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Draw text decoration (underline, overline, line-through)
   */
  private drawTextDecoration(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    const decoration = this.textStyle.getTextDecoration();
    if (decoration === 'none') return;

    const metrics = ctx.measureText(text);
    const width = metrics.width;

    ctx.save();
    ctx.lineWidth = Math.max(1, this.textStyle.getFontSize() / 12);

    let lineY = y;
    if (decoration === 'underline') {
      lineY = y + this.textStyle.getFontSize();
    } else if (decoration === 'overline') {
      lineY = y;
    } else if (decoration === 'line-through') {
      lineY = y + this.textStyle.getFontSize() / 2;
    }

    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + width, lineY);
    ctx.stroke();
    ctx.restore();
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
      setter: (value: number) => this.setStartX(value),
    });

    this.defineProperty('startY', {
      getter: () => this.getStartY(),
      setter: (value: number) => this.setStartY(value),
    });

    this.defineProperty('endX', {
      getter: () => this.getEndX(),
      setter: (value: number) => this.setEndX(value),
    });

    this.defineProperty('endY', {
      getter: () => this.getEndY(),
      setter: (value: number) => this.setEndY(value),
    });
  }

  getStartX(): number {
    return this.startX;
  }
  setStartX(value: number): void {
    this.startX = value;
    this.setNeedsDraw();
  }

  getStartY(): number {
    return this.startY;
  }
  setStartY(value: number): void {
    this.startY = value;
    this.setNeedsDraw();
  }

  getEndX(): number {
    return this.endX;
  }
  setEndX(value: number): void {
    this.endX = value;
    this.setNeedsDraw();
  }

  getEndY(): number {
    return this.endY;
  }
  setEndY(value: number): void {
    this.endY = value;
    this.setNeedsDraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);

    this.drawFrame(ctx);
  }
}
