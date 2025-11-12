/**
 * Advanced text styling for SK8
 *
 * Provides rich text formatting options including font, alignment,
 * line height, letter spacing, and text decorations
 */

/**
 * Text alignment options
 */
export type TextAlign = 'left' | 'center' | 'right' | 'start' | 'end';

/**
 * Text baseline options
 */
export type TextBaseline = 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';

/**
 * Font weight options
 */
export type FontWeight = 'normal' | 'bold' | 'lighter' | 'bolder' | number;

/**
 * Font style options
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * Text decoration options
 */
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through';

/**
 * TextStyle class for advanced text formatting
 */
export class TextStyle {
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private fontSize: number = 16;
  private fontWeight: FontWeight = 'normal';
  private fontStyle: FontStyle = 'normal';
  private textAlign: TextAlign = 'left';
  private textBaseline: TextBaseline = 'top';
  private lineHeight: number = 1.2;
  private letterSpacing: number = 0;
  private textDecoration: TextDecoration = 'none';
  private wordWrap: boolean = false;
  private maxWidth?: number;

  constructor(options?: Partial<TextStyle>) {
    if (options) {
      Object.assign(this, options);
    }
  }

  // Font family

  getFontFamily(): string {
    return this.fontFamily;
  }

  setFontFamily(family: string): this {
    this.fontFamily = family;
    return this;
  }

  // Font size

  getFontSize(): number {
    return this.fontSize;
  }

  setFontSize(size: number): this {
    this.fontSize = size;
    return this;
  }

  // Font weight

  getFontWeight(): FontWeight {
    return this.fontWeight;
  }

  setFontWeight(weight: FontWeight): this {
    this.fontWeight = weight;
    return this;
  }

  // Font style

  getFontStyle(): FontStyle {
    return this.fontStyle;
  }

  setFontStyle(style: FontStyle): this {
    this.fontStyle = style;
    return this;
  }

  // Text alignment

  getTextAlign(): TextAlign {
    return this.textAlign;
  }

  setTextAlign(align: TextAlign): this {
    this.textAlign = align;
    return this;
  }

  // Text baseline

  getTextBaseline(): TextBaseline {
    return this.textBaseline;
  }

  setTextBaseline(baseline: TextBaseline): this {
    this.textBaseline = baseline;
    return this;
  }

  // Line height

  getLineHeight(): number {
    return this.lineHeight;
  }

  setLineHeight(height: number): this {
    this.lineHeight = height;
    return this;
  }

  // Letter spacing

  getLetterSpacing(): number {
    return this.letterSpacing;
  }

  setLetterSpacing(spacing: number): this {
    this.letterSpacing = spacing;
    return this;
  }

  // Text decoration

  getTextDecoration(): TextDecoration {
    return this.textDecoration;
  }

  setTextDecoration(decoration: TextDecoration): this {
    this.textDecoration = decoration;
    return this;
  }

  // Word wrap

  getWordWrap(): boolean {
    return this.wordWrap;
  }

  setWordWrap(wrap: boolean): this {
    this.wordWrap = wrap;
    return this;
  }

  // Max width

  getMaxWidth(): number | undefined {
    return this.maxWidth;
  }

  setMaxWidth(width: number | undefined): this {
    this.maxWidth = width;
    return this;
  }

  /**
   * Apply this text style to a canvas context
   */
  applyToContext(ctx: CanvasRenderingContext2D): void {
    // Build font string
    const fontParts: string[] = [];
    if (this.fontStyle !== 'normal') {
      fontParts.push(this.fontStyle);
    }
    if (this.fontWeight !== 'normal') {
      fontParts.push(String(this.fontWeight));
    }
    fontParts.push(`${this.fontSize}px`);
    fontParts.push(this.fontFamily);

    ctx.font = fontParts.join(' ');
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    // Letter spacing is supported in modern browsers
    if (this.letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${this.letterSpacing}px`;
    }
  }

  /**
   * Measure text with this style
   */
  measureText(ctx: CanvasRenderingContext2D, text: string): TextMetrics {
    this.applyToContext(ctx);
    return ctx.measureText(text);
  }

  /**
   * Get the computed line height in pixels
   */
  getLineHeightPixels(): number {
    return this.fontSize * this.lineHeight;
  }

  /**
   * Clone this text style
   */
  clone(): TextStyle {
    const cloned = new TextStyle();
    cloned.fontFamily = this.fontFamily;
    cloned.fontSize = this.fontSize;
    cloned.fontWeight = this.fontWeight;
    cloned.fontStyle = this.fontStyle;
    cloned.textAlign = this.textAlign;
    cloned.textBaseline = this.textBaseline;
    cloned.lineHeight = this.lineHeight;
    cloned.letterSpacing = this.letterSpacing;
    cloned.textDecoration = this.textDecoration;
    cloned.wordWrap = this.wordWrap;
    cloned.maxWidth = this.maxWidth;
    return cloned;
  }

  /**
   * Create a bold variant of this style
   */
  bold(): TextStyle {
    const clone = this.clone();
    clone.setFontWeight('bold');
    return clone;
  }

  /**
   * Create an italic variant of this style
   */
  italic(): TextStyle {
    const clone = this.clone();
    clone.setFontStyle('italic');
    return clone;
  }

  /**
   * Create a larger variant of this style
   */
  larger(factor: number = 1.2): TextStyle {
    const clone = this.clone();
    clone.setFontSize(this.fontSize * factor);
    return clone;
  }

  /**
   * Create a smaller variant of this style
   */
  smaller(factor: number = 0.8): TextStyle {
    const clone = this.clone();
    clone.setFontSize(this.fontSize * factor);
    return clone;
  }
}

/**
 * Text measurement utilities
 */
export class TextMeasure {
  /**
   * Measure the width of text with a given style
   */
  static measureWidth(
    ctx: CanvasRenderingContext2D,
    text: string,
    style: TextStyle
  ): number {
    const metrics = style.measureText(ctx, text);
    return metrics.width;
  }

  /**
   * Measure the height of text with a given style
   */
  static measureHeight(style: TextStyle): number {
    return style.getLineHeightPixels();
  }

  /**
   * Break text into lines that fit within a given width
   */
  static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    style: TextStyle
  ): string[] {
    style.applyToContext(ctx);

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
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
   * Get the bounding box for multi-line text
   */
  static measureMultilineText(
    ctx: CanvasRenderingContext2D,
    text: string,
    style: TextStyle,
    maxWidth?: number
  ): { width: number; height: number } {
    const lines = maxWidth
      ? this.wrapText(ctx, text, maxWidth, style)
      : text.split('\n');

    let maxLineWidth = 0;
    for (const line of lines) {
      const width = this.measureWidth(ctx, line, style);
      maxLineWidth = Math.max(maxLineWidth, width);
    }

    const height = lines.length * style.getLineHeightPixels();

    return { width: maxLineWidth, height };
  }
}

/**
 * Helper function to render multi-line text
 */
export function renderMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: TextStyle,
  fillStyle?: string | CanvasGradient | CanvasPattern,
  strokeStyle?: string | CanvasGradient | CanvasPattern
): void {
  style.applyToContext(ctx);

  const maxWidth = style.getMaxWidth();
  const lines = style.getWordWrap() && maxWidth !== undefined
    ? TextMeasure.wrapText(ctx, text, maxWidth, style)
    : text.split('\n');

  const lineHeight = style.getLineHeightPixels();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineY = y + i * lineHeight;

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fillText(line, x, lineY);

      // Draw text decoration
      if (style.getTextDecoration() !== 'none') {
        drawTextDecoration(ctx, line, x, lineY, style);
      }
    }

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.strokeText(line, x, lineY);
    }
  }
}

/**
 * Draw text decoration (underline, overline, line-through)
 */
function drawTextDecoration(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: TextStyle
): void {
  const metrics = ctx.measureText(text);
  const width = metrics.width;
  const decoration = style.getTextDecoration();

  if (decoration === 'none') return;

  ctx.save();
  ctx.lineWidth = Math.max(1, style.getFontSize() / 12);

  let lineY = y;
  if (decoration === 'underline') {
    lineY = y + style.getFontSize();
  } else if (decoration === 'overline') {
    lineY = y;
  } else if (decoration === 'line-through') {
    lineY = y + style.getFontSize() / 2;
  }

  ctx.beginPath();
  ctx.moveTo(x, lineY);
  ctx.lineTo(x + width, lineY);
  ctx.stroke();
  ctx.restore();
}
