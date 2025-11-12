/**
 * SK8Slider - Interactive slider widget
 *
 * A slider with draggable thumb, value display, and constraints
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export type SliderOrientation = 'horizontal' | 'vertical';

export class SK8Slider extends SK8Actor {
  private value: number = 50;
  private min: number = 0;
  private max: number = 100;
  private step: number = 1;
  private orientation: SliderOrientation = 'horizontal';
  private showValue: boolean = true;
  private enabled: boolean = true;

  // Visual properties
  private trackHeight: number = 4;
  private thumbSize: number = 16;
  private fontSize: number = 12;
  private fontFamily: string = 'Geneva, Arial, sans-serif';

  // Colors
  private trackColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private trackFillColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };
  private thumbColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private thumbBorderColor: Color = { r: 120, g: 120, b: 120, a: 1.0 };
  private thumbHoverColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledColor: Color = { r: 220, g: 220, b: 220, a: 1.0 };

  private isDragging: boolean = false;
  private isHovering: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Slider');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 200, bottom: 40 });

    // Define properties
    this.defineProperty('value', {
      getter: () => this.getValue(),
      setter: (value: number) => this.setValue(value),
    });

    this.defineProperty('min', {
      getter: () => this.getMin(),
      setter: (value: number) => this.setMin(value),
    });

    this.defineProperty('max', {
      getter: () => this.getMax(),
      setter: (value: number) => this.setMax(value),
    });

    this.defineProperty('step', {
      getter: () => this.getStep(),
      setter: (value: number) => this.setStep(value),
    });

    this.defineProperty('orientation', {
      getter: () => this.getOrientation(),
      setter: (value: SliderOrientation) => this.setOrientation(value),
    });

    this.defineProperty('showValue', {
      getter: () => this.getShowValue(),
      setter: (value: boolean) => this.setShowValue(value),
    });

    this.defineProperty('enabled', {
      getter: () => this.getEnabled(),
      setter: (value: boolean) => this.setEnabled(value),
    });
  }

  // Value
  getValue(): number {
    return this.value;
  }

  setValue(value: number): void {
    // Constrain to min/max
    value = Math.max(this.min, Math.min(this.max, value));

    // Apply step
    if (this.step > 0) {
      value = Math.round(value / this.step) * this.step;
    }

    if (this.value !== value) {
      this.value = value;
      this.setNeedsDraw();
      if (this.hasHandler('change')) {
        this.callHandler('change', value);
      }
    }
  }

  // Min/Max
  getMin(): number {
    return this.min;
  }

  setMin(min: number): void {
    this.min = min;
    if (this.value < min) {
      this.setValue(min);
    }
    this.setNeedsDraw();
  }

  getMax(): number {
    return this.max;
  }

  setMax(max: number): void {
    this.max = max;
    if (this.value > max) {
      this.setValue(max);
    }
    this.setNeedsDraw();
  }

  // Step
  getStep(): number {
    return this.step;
  }

  setStep(step: number): void {
    this.step = Math.max(0, step);
    this.setValue(this.value); // Re-apply step
  }

  // Orientation
  getOrientation(): SliderOrientation {
    return this.orientation;
  }

  setOrientation(orientation: SliderOrientation): void {
    this.orientation = orientation;
    this.setNeedsDraw();
  }

  // Show value
  getShowValue(): boolean {
    return this.showValue;
  }

  setShowValue(show: boolean): void {
    this.showValue = show;
    this.setNeedsDraw();
  }

  // Enabled
  getEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.isDragging = false;
    }
    this.setNeedsDraw();
  }

  // Helper: Convert position to value
  private positionToValue(x: number, y: number): number {
    const bounds = this.getBoundsRect();
    let ratio: number;

    if (this.orientation === 'horizontal') {
      const trackLeft = bounds.left + this.thumbSize / 2;
      const trackRight = bounds.right - this.thumbSize / 2;
      const trackWidth = trackRight - trackLeft;
      ratio = (x - trackLeft) / trackWidth;
    } else {
      const trackTop = bounds.top + this.thumbSize / 2;
      const trackBottom = bounds.bottom - this.thumbSize / 2;
      const trackHeight = trackBottom - trackTop;
      ratio = 1 - (y - trackTop) / trackHeight; // Inverted for vertical
    }

    ratio = Math.max(0, Math.min(1, ratio));
    return this.min + ratio * (this.max - this.min);
  }

  // Helper: Get thumb position
  private getThumbPosition(): { x: number; y: number } {
    const bounds = this.getBoundsRect();
    const ratio = (this.value - this.min) / (this.max - this.min);

    if (this.orientation === 'horizontal') {
      const trackLeft = bounds.left + this.thumbSize / 2;
      const trackRight = bounds.right - this.thumbSize / 2;
      const trackWidth = trackRight - trackLeft;
      const x = trackLeft + ratio * trackWidth;
      const y = bounds.top + RectUtils.height(bounds) / 2;
      return { x, y };
    } else {
      const trackTop = bounds.top + this.thumbSize / 2;
      const trackBottom = bounds.bottom - this.thumbSize / 2;
      const trackHeight = trackBottom - trackTop;
      const x = bounds.left + RectUtils.width(bounds) / 2;
      const y = trackTop + (1 - ratio) * trackHeight; // Inverted
      return { x, y };
    }
  }

  // Event handlers
  override onMouseDown(x: number, y: number): void {
    if (this.enabled) {
      this.isDragging = true;
      this.setValue(this.positionToValue(x, y));
      super.onMouseDown(x, y);
    }
  }

  override onMouseUp(x: number, y: number): void {
    if (this.enabled) {
      this.isDragging = false;
      super.onMouseUp(x, y);
    }
  }

  override onMouseMove(x: number, y: number): void {
    if (this.enabled) {
      const thumbPos = this.getThumbPosition();
      const dx = x - thumbPos.x;
      const dy = y - thumbPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const wasHovering = this.isHovering;
      this.isHovering = distance <= this.thumbSize / 2;

      if (this.isDragging) {
        this.setValue(this.positionToValue(x, y));
      }

      if (wasHovering !== this.isHovering) {
        this.setNeedsDraw();
      }
    }
    super.onMouseMove(x, y);
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);

    const thumbPos = this.getThumbPosition();

    if (this.orientation === 'horizontal') {
      // Draw track
      const trackY = y + height / 2 - this.trackHeight / 2;
      ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.trackColor : this.disabledColor);
      ctx.fillRect(x, trackY, width, this.trackHeight);

      // Draw filled portion
      if (this.enabled) {
        const fillWidth = thumbPos.x - x;
        ctx.fillStyle = ColorUtils.toCSS(this.trackFillColor);
        ctx.fillRect(x, trackY, fillWidth, this.trackHeight);
      }
    } else {
      // Draw track
      const trackX = x + width / 2 - this.trackHeight / 2;
      ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.trackColor : this.disabledColor);
      ctx.fillRect(trackX, y, this.trackHeight, height);

      // Draw filled portion
      if (this.enabled) {
        const fillHeight = y + height - thumbPos.y;
        ctx.fillStyle = ColorUtils.toCSS(this.trackFillColor);
        ctx.fillRect(trackX, thumbPos.y, this.trackHeight, fillHeight);
      }
    }

    // Draw thumb
    ctx.beginPath();
    ctx.arc(thumbPos.x, thumbPos.y, this.thumbSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.thumbColor : this.disabledColor);
    ctx.fill();

    const borderColor = this.isHovering || this.isDragging ? this.thumbHoverColor : this.thumbBorderColor;
    ctx.strokeStyle = ColorUtils.toCSS(this.enabled ? borderColor : this.disabledColor);
    ctx.lineWidth = this.isHovering || this.isDragging ? 2 : 1;
    ctx.stroke();

    // Draw value
    if (this.showValue) {
      const valueText = this.value.toFixed(this.step < 1 ? 1 : 0);
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.textColor : this.disabledColor);

      if (this.orientation === 'horizontal') {
        ctx.fillText(valueText, x + width / 2, y + height - this.fontSize - 2);
      } else {
        ctx.fillText(valueText, x + width / 2, y);
      }
    }
  }
}
