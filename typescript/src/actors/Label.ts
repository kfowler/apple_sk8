/**
 * SK8Label - Static text label widget
 *
 * A simple text label with alignment and styling options
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils } from '../graphics/types.js';

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export class SK8Label extends SK8Actor {
  private text: string = 'Label';
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private fontWeight: string = 'normal';
  private fontStyle: string = 'normal';
  private textAlign: TextAlign = 'left';
  private verticalAlign: VerticalAlign = 'top';
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private wordWrap: boolean = false;
  private lineHeight: number = 1.2;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Label');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 100, bottom: 20 });

    // Define properties
    this.defineProperty('text', {
      getter: () => this.getText(),
      setter: (value: string) => this.setText(value),
    });

    this.defineProperty('fontSize', {
      getter: () => this.getFontSize(),
      setter: (value: number) => this.setFontSize(value),
    });

    this.defineProperty('fontFamily', {
      getter: () => this.getFontFamily(),
      setter: (value: string) => this.setFontFamily(value),
    });

    this.defineProperty('fontWeight', {
      getter: () => this.getFontWeight(),
      setter: (value: string) => this.setFontWeight(value),
    });

    this.defineProperty('fontStyle', {
      getter: () => this.getFontStyle(),
      setter: (value: string) => this.setFontStyle(value),
    });

    this.defineProperty('textAlign', {
      getter: () => this.getTextAlign(),
      setter: (value: TextAlign) => this.setTextAlign(value),
    });

    this.defineProperty('verticalAlign', {
      getter: () => this.getVerticalAlign(),
      setter: (value: VerticalAlign) => this.setVerticalAlign(value),
    });

    this.defineProperty('textColor', {
      getter: () => this.getTextColor(),
      setter: (value: Color) => this.setTextColor(value),
    });

    this.defineProperty('wordWrap', {
      getter: () => this.getWordWrap(),
      setter: (value: boolean) => this.setWordWrap(value),
    });
  }

  // Text
  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
    this.setNeedsDraw();
  }

  // Font size
  getFontSize(): number {
    return this.fontSize;
  }

  setFontSize(size: number): void {
    this.fontSize = size;
    this.setNeedsDraw();
  }

  // Font family
  getFontFamily(): string {
    return this.fontFamily;
  }

  setFontFamily(family: string): void {
    this.fontFamily = family;
    this.setNeedsDraw();
  }

  // Font weight
  getFontWeight(): string {
    return this.fontWeight;
  }

  setFontWeight(weight: string): void {
    this.fontWeight = weight;
    this.setNeedsDraw();
  }

  // Font style
  getFontStyle(): string {
    return this.fontStyle;
  }

  setFontStyle(style: string): void {
    this.fontStyle = style;
    this.setNeedsDraw();
  }

  // Text align
  getTextAlign(): TextAlign {
    return this.textAlign;
  }

  setTextAlign(align: TextAlign): void {
    this.textAlign = align;
    this.setNeedsDraw();
  }

  // Vertical align
  getVerticalAlign(): VerticalAlign {
    return this.verticalAlign;
  }

  setVerticalAlign(align: VerticalAlign): void {
    this.verticalAlign = align;
    this.setNeedsDraw();
  }

  // Text color
  getTextColor(): Color {
    return this.textColor;
  }

  setTextColor(color: Color): void {
    this.textColor = color;
    this.setNeedsDraw();
  }

  // Word wrap
  getWordWrap(): boolean {
    return this.wordWrap;
  }

  setWordWrap(wrap: boolean): void {
    this.wordWrap = wrap;
    this.setNeedsDraw();
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;

    // Set font
    const fontSpec = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.font = fontSpec;
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);

    // Calculate text position based on alignment
    let textX: number;
    switch (this.textAlign) {
      case 'center':
        textX = x + width / 2;
        ctx.textAlign = 'center';
        break;
      case 'right':
        textX = x + width;
        ctx.textAlign = 'right';
        break;
      default:
        textX = x;
        ctx.textAlign = 'left';
    }

    let textY: number;
    switch (this.verticalAlign) {
      case 'middle':
        textY = y + height / 2;
        ctx.textBaseline = 'middle';
        break;
      case 'bottom':
        textY = y + height;
        ctx.textBaseline = 'bottom';
        break;
      default:
        textY = y;
        ctx.textBaseline = 'top';
    }

    // Draw text (with word wrap if enabled)
    if (this.wordWrap) {
      this.drawWrappedText(ctx, this.text, textX, textY, width);
    } else {
      ctx.fillText(this.text, textX, textY);
    }
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number
  ): void {
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

    // Draw each line
    const lineHeightPx = this.fontSize * this.lineHeight;
    for (let i = 0; i < lines.length; i++) {
      const lineY = y + i * lineHeightPx;
      ctx.fillText(lines[i], x, lineY);
    }
  }
}
