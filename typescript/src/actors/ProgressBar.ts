/**
 * SK8ProgressBar - A progress bar widget
 *
 * Features:
 * - Horizontal and vertical orientations
 * - Customizable colors for bar and background
 * - Optional text display showing percentage
 * - Smooth animated value changes
 * - Value range: 0-100
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export type ProgressBarOrientation = 'horizontal' | 'vertical';

export class SK8ProgressBar extends SK8Actor {
  private value: number = 0; // 0 to 100
  private targetValue: number = 0;
  private animationSpeed: number = 0.1; // 0 to 1, higher = faster
  private orientation: ProgressBarOrientation = 'horizontal';
  private showText: boolean = true;
  private backgroundColor: Color = { r: 200, g: 200, b: 200 };
  private barColor: Color = { r: 76, g: 175, b: 80 }; // Green
  private animating: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'ProgressBar');

    // Define properties
    this.defineProperty('value', {
      getter: () => this.getValue(),
      setter: (value: number) => this.setValue(value),
    });

    this.defineProperty('orientation', {
      getter: () => this.getOrientation(),
      setter: (value: ProgressBarOrientation) => this.setOrientation(value),
    });

    this.defineProperty('showText', {
      getter: () => this.getShowText(),
      setter: (value: boolean) => this.setShowText(value),
    });

    this.defineProperty('backgroundColor', {
      getter: () => this.getBackgroundColor(),
      setter: (value: Color) => this.setBackgroundColor(value),
    });

    this.defineProperty('barColor', {
      getter: () => this.getBarColor(),
      setter: (value: Color) => this.setBarColor(value),
    });

    this.defineProperty('animationSpeed', {
      getter: () => this.getAnimationSpeed(),
      setter: (value: number) => this.setAnimationSpeed(value),
    });
  }

  getValue(): number {
    return Math.round(this.targetValue);
  }

  setValue(value: number, animate: boolean = true): void {
    this.targetValue = Math.max(0, Math.min(100, value));

    if (!animate) {
      this.value = this.targetValue;
    } else if (!this.animating && Math.abs(this.value - this.targetValue) > 0.1) {
      this.animating = true;
      this.animateValue();
    }

    this.setNeedsDraw();
  }

  /**
   * Get the current animated value (may differ from target during animation)
   */
  getCurrentValue(): number {
    return this.value;
  }

  getOrientation(): ProgressBarOrientation {
    return this.orientation;
  }

  setOrientation(orientation: ProgressBarOrientation): void {
    this.orientation = orientation;
    this.setNeedsDraw();
  }

  getShowText(): boolean {
    return this.showText;
  }

  setShowText(show: boolean): void {
    this.showText = show;
    this.setNeedsDraw();
  }

  getBackgroundColor(): Color {
    return typeof this.backgroundColor === 'string'
      ? this.backgroundColor
      : { ...this.backgroundColor };
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = typeof color === 'string' ? color : { ...color };
    this.setNeedsDraw();
  }

  getBarColor(): Color {
    return typeof this.barColor === 'string' ? this.barColor : { ...this.barColor };
  }

  setBarColor(color: Color): void {
    this.barColor = typeof color === 'string' ? color : { ...color };
    this.setNeedsDraw();
  }

  getAnimationSpeed(): number {
    return this.animationSpeed;
  }

  setAnimationSpeed(speed: number): void {
    this.animationSpeed = Math.max(0, Math.min(1, speed));
  }

  /**
   * Animate the value change
   */
  private animateValue(): void {
    if (!this.animating) return;

    const diff = this.targetValue - this.value;

    if (Math.abs(diff) < 0.1) {
      this.value = this.targetValue;
      this.animating = false;
    } else {
      this.value += diff * this.animationSpeed;
      this.setNeedsDraw();

      // Continue animation
      requestAnimationFrame(() => this.animateValue());
    }
  }

  /**
   * Increment the progress by a given amount
   */
  increment(amount: number = 1): void {
    this.setValue(this.targetValue + amount);
  }

  /**
   * Decrement the progress by a given amount
   */
  decrement(amount: number = 1): void {
    this.setValue(this.targetValue - amount);
  }

  /**
   * Reset progress to 0
   */
  reset(): void {
    this.setValue(0, false);
  }

  /**
   * Complete the progress (set to 100)
   */
  complete(): void {
    this.setValue(100);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    ctx.fillRect(x, y, width, height);

    // Draw border if frameColor is set
    const frameColor = this.getFrameColor();
    if (frameColor) {
      ctx.strokeStyle = ColorUtils.toCSS(frameColor);
      ctx.lineWidth = this.getLineWidth();
      ctx.strokeRect(x, y, width, height);
    }

    // Calculate progress bar dimensions
    const progress = this.value / 100;
    let barX: number, barY: number, barWidth: number, barHeight: number;

    if (this.orientation === 'horizontal') {
      barX = x;
      barY = y;
      barWidth = width * progress;
      barHeight = height;
    } else {
      // Vertical - fill from bottom
      barX = x;
      barHeight = height * progress;
      barY = y + height - barHeight;
      barWidth = width;
    }

    // Draw progress bar
    ctx.fillStyle = ColorUtils.toCSS(this.barColor);
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw text if enabled
    if (this.showText) {
      this.drawProgressText(ctx, bounds);
    }
  }

  /**
   * Draw the progress text
   */
  private drawProgressText(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): void {
    const percentage = `${Math.round(this.value)}%`;

    // Configure text
    const fontSize = Math.min(RectUtils.height(bounds) * 0.6, 16);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = RectUtils.centerX(bounds);
    const centerY = RectUtils.centerY(bounds);

    // Draw text with shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Choose text color based on background
    let brightness = 128;
    if (typeof this.barColor !== 'string') {
      brightness = (this.barColor.r * 299 + this.barColor.g * 587 + this.barColor.b * 114) / 1000;
    }
    ctx.fillStyle = brightness > 128 ? '#000' : '#fff';

    ctx.fillText(percentage, centerX, centerY);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Create a determinate progress bar (standard)
   */
  static createDeterminate(x: number, y: number, width: number, height: number): SK8ProgressBar {
    const bar = new SK8ProgressBar();
    bar.setBoundsRect({ left: x, top: y, right: x + width, bottom: y + height });
    return bar;
  }

  /**
   * Create a vertical progress bar
   */
  static createVertical(x: number, y: number, width: number, height: number): SK8ProgressBar {
    const bar = new SK8ProgressBar();
    bar.setBoundsRect({ left: x, top: y, right: x + width, bottom: y + height });
    bar.setOrientation('vertical');
    return bar;
  }

  /**
   * Create a styled progress bar with custom colors
   */
  static createStyled(
    x: number,
    y: number,
    width: number,
    height: number,
    barColor: Color,
    backgroundColor?: Color
  ): SK8ProgressBar {
    const bar = new SK8ProgressBar();
    bar.setBoundsRect({ left: x, top: y, right: x + width, bottom: y + height });
    bar.setBarColor(barColor);
    if (backgroundColor) {
      bar.setBackgroundColor(backgroundColor);
    }
    return bar;
  }
}
