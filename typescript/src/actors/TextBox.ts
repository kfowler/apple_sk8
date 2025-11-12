/**
 * SK8TextBox - Multi-line text with automatic wrapping and scrolling
 *
 * Supports:
 * - Automatic text wrapping
 * - Multi-line display
 * - Configurable alignment (left, center, right)
 * - Scroll support for overflow
 * - Optional editable mode
 * - Line height adjustment
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { RectUtils, ColorUtils } from '../graphics/types.js';
import { TextStyle } from '../graphics/text-style.js';

export type TextAlignment = 'left' | 'center' | 'right';

export class SK8TextBox extends SK8Actor {
  private text: string = '';
  private textStyle: TextStyle;
  private alignment: TextAlignment = 'left';
  private lineHeight: number = 1.2; // Multiple of font size
  private padding: number = 5;
  private scrollOffset: number = 0;
  private maxLines: number = 0; // 0 = unlimited
  private editable: boolean = false;

  // Cached wrapped lines
  private wrappedLines: string[] = [];
  private linesDirty: boolean = true;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'TextBox');

    this.textStyle = new TextStyle();
    this.textStyle.setFontSize(14);

    // Define properties
    this.defineProperty('text', {
      getter: () => this.getText(),
      setter: (value: string) => this.setText(value),
    });

    this.defineProperty('alignment', {
      getter: () => this.getAlignment(),
      setter: (value: TextAlignment) => this.setAlignment(value),
    });

    this.defineProperty('lineHeight', {
      getter: () => this.getLineHeight(),
      setter: (value: number) => this.setLineHeight(value),
    });

    this.defineProperty('padding', {
      getter: () => this.getPadding(),
      setter: (value: number) => this.setPadding(value),
    });

    this.defineProperty('scrollOffset', {
      getter: () => this.getScrollOffset(),
      setter: (value: number) => this.setScrollOffset(value),
    });

    this.defineProperty('maxLines', {
      getter: () => this.getMaxLines(),
      setter: (value: number) => this.setMaxLines(value),
    });

    this.defineProperty('editable', {
      getter: () => this.getEditable(),
      setter: (value: boolean) => this.setEditable(value),
    });

    this.defineProperty('fontSize', {
      getter: () => this.getTextStyle().getFontSize(),
      setter: (value: number) => {
        this.getTextStyle().setFontSize(value);
        this.linesDirty = true;
      },
    });

    this.defineProperty('fontFamily', {
      getter: () => this.getTextStyle().getFontFamily(),
      setter: (value: string) => {
        this.getTextStyle().setFontFamily(value);
        this.linesDirty = true;
      },
    });
  }

  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
    this.linesDirty = true;
    this.setNeedsDraw();
  }

  getTextStyle(): TextStyle {
    return this.textStyle;
  }

  setTextStyle(style: TextStyle): void {
    this.textStyle = style;
    this.linesDirty = true;
    this.setNeedsDraw();
  }

  getAlignment(): TextAlignment {
    return this.alignment;
  }

  setAlignment(alignment: TextAlignment): void {
    this.alignment = alignment;
    this.setNeedsDraw();
  }

  getLineHeight(): number {
    return this.lineHeight;
  }

  setLineHeight(height: number): void {
    this.lineHeight = Math.max(0.5, height);
    this.setNeedsDraw();
  }

  getPadding(): number {
    return this.padding;
  }

  setPadding(padding: number): void {
    this.padding = Math.max(0, padding);
    this.linesDirty = true;
    this.setNeedsDraw();
  }

  getScrollOffset(): number {
    return this.scrollOffset;
  }

  setScrollOffset(offset: number): void {
    this.scrollOffset = Math.max(0, offset);
    this.setNeedsDraw();
  }

  getMaxLines(): number {
    return this.maxLines;
  }

  setMaxLines(lines: number): void {
    this.maxLines = Math.max(0, lines);
    this.setNeedsDraw();
  }

  getEditable(): boolean {
    return this.editable;
  }

  setEditable(editable: boolean): void {
    this.editable = editable;
    this.setNeedsDraw();
  }

  /**
   * Scroll up by one line
   */
  scrollUp(): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - 1);
    this.setNeedsDraw();
  }

  /**
   * Scroll down by one line
   */
  scrollDown(): void {
    const maxScroll = Math.max(0, this.wrappedLines.length - this.getVisibleLines());
    this.scrollOffset = Math.min(maxScroll, this.scrollOffset + 1);
    this.setNeedsDraw();
  }

  /**
   * Get the number of visible lines that can fit
   */
  private getVisibleLines(): number {
    const bounds = this.getBoundsRect();
    const availableHeight = RectUtils.height(bounds) - this.padding * 2;
    const lineHeightPixels = this.textStyle.getFontSize() * this.lineHeight;
    return Math.floor(availableHeight / lineHeightPixels);
  }

  /**
   * Wrap text to fit within the text box width
   */
  private wrapText(ctx: CanvasRenderingContext2D): string[] {
    if (!this.linesDirty && this.wrappedLines.length > 0) {
      return this.wrappedLines;
    }

    const bounds = this.getBoundsRect();
    const maxWidth = RectUtils.width(bounds) - this.padding * 2;

    // Split text into paragraphs
    const paragraphs = this.text.split('\n');
    const lines: string[] = [];

    this.textStyle.applyToContext(ctx);

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }

      const words = paragraph.split(' ');
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
    }

    this.wrappedLines = lines;
    this.linesDirty = false;

    return lines;
  }

  /**
   * Calculate X position based on alignment
   */
  private getAlignedX(ctx: CanvasRenderingContext2D, line: string, x: number, maxWidth: number): number {
    switch (this.alignment) {
      case 'center': {
        const metrics = ctx.measureText(line);
        return x + (maxWidth - metrics.width) / 2;
      }
      case 'right': {
        const metrics = ctx.measureText(line);
        return x + maxWidth - metrics.width;
      }
      case 'left':
      default:
        return x;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left + this.padding;
    const y = bounds.top + this.padding;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);

    // Draw background
    if (this.getFillColor()) {
      ctx.beginPath();
      ctx.rect(bounds.left, bounds.top, width, height);
      this.drawFill(ctx);
    }

    // Draw border
    if (this.getFrameColor()) {
      ctx.beginPath();
      ctx.rect(bounds.left, bounds.top, width, height);
      this.drawFrame(ctx);
    }

    // Set up clipping for text overflow
    ctx.save();
    ctx.beginPath();
    ctx.rect(bounds.left + this.padding, bounds.top + this.padding, width - this.padding * 2, height - this.padding * 2);
    ctx.clip();

    // Apply text style
    this.textStyle.applyToContext(ctx);

    // Wrap text
    const lines = this.wrapText(ctx);
    const lineHeightPixels = this.textStyle.getFontSize() * this.lineHeight;
    const maxWidth = width - this.padding * 2;

    // Determine visible lines
    const visibleLines = this.getVisibleLines();
    const startLine = Math.min(this.scrollOffset, Math.max(0, lines.length - visibleLines));
    const endLine = this.maxLines > 0
      ? Math.min(startLine + Math.min(visibleLines, this.maxLines), lines.length)
      : Math.min(startLine + visibleLines, lines.length);

    // Draw text
    const textColor = this.getFrameColor() || { r: 0, g: 0, b: 0 };
    ctx.fillStyle = ColorUtils.toCSS(textColor);

    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];
      const lineY = y + (i - startLine) * lineHeightPixels + this.textStyle.getFontSize();
      const lineX = this.getAlignedX(ctx, line, x, maxWidth);

      ctx.fillText(line, lineX, lineY);
    }

    ctx.restore();

    // Draw scroll indicator if needed
    if (lines.length > visibleLines) {
      this.drawScrollIndicator(ctx, bounds, startLine, lines.length, visibleLines);
    }

    // Draw cursor if editable
    if (this.editable) {
      this.drawCursor(ctx, x, y, lineHeightPixels);
    }
  }

  /**
   * Draw scroll indicator
   */
  private drawScrollIndicator(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number },
    scrollPos: number,
    totalLines: number,
    visibleLines: number
  ): void {
    const indicatorWidth = 6;
    const indicatorX = bounds.right - indicatorWidth - 2;
    const indicatorHeight = RectUtils.height(bounds) - 4;
    const indicatorY = bounds.top + 2;

    // Background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

    // Thumb
    const thumbHeight = Math.max(20, (visibleLines / totalLines) * indicatorHeight);
    const thumbY = indicatorY + (scrollPos / totalLines) * indicatorHeight;

    ctx.fillStyle = '#888';
    ctx.fillRect(indicatorX, thumbY, indicatorWidth, thumbHeight);
  }

  /**
   * Draw text cursor (simple blinking line)
   */
  private drawCursor(ctx: CanvasRenderingContext2D, x: number, y: number, lineHeight: number): void {
    // This is a simple implementation - a full editable text box would need
    // cursor position tracking, blinking animation, etc.
    const cursorX = x + ctx.measureText(this.text).width;
    const cursorY = y;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    ctx.lineTo(cursorX, cursorY + lineHeight);
    ctx.stroke();
  }

  /**
   * Override setBoundsRect to invalidate wrapped lines
   */
  setBoundsRect(rect: { left: number; top: number; right: number; bottom: number }): void {
    super.setBoundsRect(rect);
    this.linesDirty = true;
  }
}
