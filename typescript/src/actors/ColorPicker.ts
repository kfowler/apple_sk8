/**
 * SK8ColorPicker - Color selection widget
 *
 * A color picker with HSV color wheel, RGB sliders,
 * hex input field, opacity slider, and preset swatches.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export interface HSV {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

export class SK8ColorPicker extends SK8Actor {
  private selectedColor: Color = { r: 255, g: 0, b: 0, a: 1.0 };
  private hsv: HSV = { h: 0, s: 1, v: 1 };
  private presets: Color[] = [];
  private hexInput: string = '#FF0000';
  private isDraggingWheel: boolean = false;
  private isDraggingSlider: string | null = null;

  // Visual properties
  private wheelSize: number = 150;
  private sliderWidth: number = 200;
  private sliderHeight: number = 16;
  private sliderSpacing: number = 10;
  private presetSize: number = 24;
  private presetSpacing: number = 4;
  private fontSize: number = 12;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private padding: number = 10;

  // Colors
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private borderColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private sliderBorderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'ColorPicker');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 280, bottom: 420 });

    // Define properties
    this.defineProperty('selectedColor', {
      getter: () => this.getSelectedColor(),
      setter: (value: Color) => this.setSelectedColor(value),
    });

    // Initialize with default presets
    this.setPresetColors([
      { r: 255, g: 0, b: 0, a: 1 },
      { r: 255, g: 128, b: 0, a: 1 },
      { r: 255, g: 255, b: 0, a: 1 },
      { r: 0, g: 255, b: 0, a: 1 },
      { r: 0, g: 255, b: 255, a: 1 },
      { r: 0, g: 0, b: 255, a: 1 },
      { r: 255, g: 0, b: 255, a: 1 },
      { r: 255, g: 255, b: 255, a: 1 },
      { r: 0, g: 0, b: 0, a: 1 },
      { r: 128, g: 128, b: 128, a: 1 },
    ]);
  }

  // Selected color
  getSelectedColor(): Color {
    return { ...this.selectedColor };
  }

  setSelectedColor(color: Color): void {
    this.selectedColor = { ...color };
    this.hsv = this.rgbToHsv(color);
    this.hexInput = this.colorToHex(color);
    this.setNeedsDraw();

    // Dispatch colorChanged event
    this.dispatchEvent(
      new SK8CustomEvent('colorChanged', {
        color: this.selectedColor,
        hex: this.hexInput,
      })
    );
  }

  // Preset colors
  getPresetColors(): Color[] {
    return [...this.presets];
  }

  setPresetColors(colors: Color[]): void {
    this.presets = colors.map((c) => ({ ...c }));
    this.setNeedsDraw();
  }

  addPresetColor(color: Color): void {
    this.presets.push({ ...color });
    this.setNeedsDraw();
  }

  // Color conversion: RGB to HSV
  private rgbToHsv(color: Color): HSV {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;

    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }

    return { h: h * 360, s, v };
  }

  // Color conversion: HSV to RGB
  private hsvToRgb(hsv: HSV): Color {
    const h = hsv.h / 360;
    const s = hsv.s;
    const v = hsv.v;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r, g, b;

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
      default:
        r = g = b = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: this.selectedColor.a,
    };
  }

  // Color conversion: Color to Hex
  private colorToHex(color: Color): string {
    const r = color.r.toString(16).padStart(2, '0');
    const g = color.g.toString(16).padStart(2, '0');
    const b = color.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // Color conversion: Hex to Color
  private hexToColor(hex: string): Color | null {
    const match = hex.match(/^#?([a-f0-9]{6})$/i);
    if (!match) return null;

    const hexValue = match[1];
    return {
      r: parseInt(hexValue.substr(0, 2), 16),
      g: parseInt(hexValue.substr(2, 2), 16),
      b: parseInt(hexValue.substr(4, 2), 16),
      a: this.selectedColor.a,
    };
  }

  // Helper: Get color wheel bounds
  private getWheelBounds(): { x: number; y: number; radius: number } {
    const bounds = this.getBoundsRect();
    return {
      x: bounds.left + this.padding + this.wheelSize / 2,
      y: bounds.top + this.padding + this.wheelSize / 2,
      radius: this.wheelSize / 2,
    };
  }

  // Helper: Get slider bounds
  private getSliderBounds(
    type: 'r' | 'g' | 'b' | 'a'
  ): { left: number; top: number; right: number; bottom: number } {
    const bounds = this.getBoundsRect();
    const wheelBounds = this.getWheelBounds();
    const startY = wheelBounds.y + wheelBounds.radius + this.padding * 2;

    const sliderIndex = { r: 0, g: 1, b: 2, a: 3 }[type];
    const y = startY + sliderIndex * (this.sliderHeight + this.sliderSpacing);

    return {
      left: bounds.left + this.padding + 30,
      top: y,
      right: bounds.left + this.padding + 30 + this.sliderWidth,
      bottom: y + this.sliderHeight,
    };
  }

  // Helper: Get preset swatch bounds
  private getPresetSwatchBounds(index: number): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null {
    const bounds = this.getBoundsRect();
    const sliderBounds = this.getSliderBounds('a');
    const startY = sliderBounds.bottom + this.padding * 2;

    const cols = Math.floor((RectUtils.width(bounds) - this.padding * 2) / (this.presetSize + this.presetSpacing));
    const row = Math.floor(index / cols);
    const col = index % cols;

    const x = bounds.left + this.padding + col * (this.presetSize + this.presetSpacing);
    const y = startY + row * (this.presetSize + this.presetSpacing);

    return {
      left: x,
      top: y,
      right: x + this.presetSize,
      bottom: y + this.presetSize,
    };
  }

  // Helper: Check if point is in wheel
  private isPointInWheel(x: number, y: number): boolean {
    const wheel = this.getWheelBounds();
    const dx = x - wheel.x;
    const dy = y - wheel.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= wheel.radius;
  }

  // Helper: Point to HSV from wheel
  private pointToHSV(x: number, y: number): HSV {
    const wheel = this.getWheelBounds();
    const dx = x - wheel.x;
    const dy = y - wheel.y;
    const distance = Math.min(wheel.radius, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);

    const h = ((angle + Math.PI) / (Math.PI * 2)) * 360;
    const s = distance / wheel.radius;

    return { h, s, v: this.hsv.v };
  }

  // Helper: Get slider value at point
  private getSliderValue(x: number, type: 'r' | 'g' | 'b' | 'a'): number {
    const sliderBounds = this.getSliderBounds(type);
    const ratio = Math.max(
      0,
      Math.min(1, (x - sliderBounds.left) / (sliderBounds.right - sliderBounds.left))
    );
    return Math.round(ratio * 255);
  }

  // Helper: Get preset at point
  private getPresetAtPoint(x: number, y: number): number {
    for (let i = 0; i < this.presets.length; i++) {
      const bounds = this.getPresetSwatchBounds(i);
      if (
        bounds &&
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      ) {
        return i;
      }
    }
    return -1;
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    // Check preset swatches
    const presetIndex = this.getPresetAtPoint(x, y);
    if (presetIndex >= 0) {
      this.setSelectedColor(this.presets[presetIndex]);
      super.onClick(x, y);
      return;
    }

    super.onClick(x, y);
  }

  override onMouseDown(x: number, y: number): void {
    // Check color wheel
    if (this.isPointInWheel(x, y)) {
      this.isDraggingWheel = true;
      this.hsv = this.pointToHSV(x, y);
      this.selectedColor = this.hsvToRgb(this.hsv);
      this.hexInput = this.colorToHex(this.selectedColor);
      this.setNeedsDraw();
      this.dispatchEvent(
        new SK8CustomEvent('colorChanged', {
          color: this.selectedColor,
          hex: this.hexInput,
        })
      );
      super.onMouseDown(x, y);
      return;
    }

    // Check sliders
    for (const type of ['r', 'g', 'b', 'a'] as const) {
      const sliderBounds = this.getSliderBounds(type);
      if (
        x >= sliderBounds.left &&
        x <= sliderBounds.right &&
        y >= sliderBounds.top &&
        y <= sliderBounds.bottom
      ) {
        this.isDraggingSlider = type;
        const value = this.getSliderValue(x, type);

        if (type === 'a') {
          this.selectedColor.a = value / 255;
        } else {
          this.selectedColor[type] = value;
          this.hsv = this.rgbToHsv(this.selectedColor);
        }

        this.hexInput = this.colorToHex(this.selectedColor);
        this.setNeedsDraw();
        this.dispatchEvent(
          new SK8CustomEvent('colorChanged', {
            color: this.selectedColor,
            hex: this.hexInput,
          })
        );
        super.onMouseDown(x, y);
        return;
      }
    }

    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    this.isDraggingWheel = false;
    this.isDraggingSlider = null;
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    // Handle wheel dragging
    if (this.isDraggingWheel && this.isPointInWheel(x, y)) {
      this.hsv = this.pointToHSV(x, y);
      this.selectedColor = this.hsvToRgb(this.hsv);
      this.hexInput = this.colorToHex(this.selectedColor);
      this.setNeedsDraw();
      this.dispatchEvent(
        new SK8CustomEvent('colorChanged', {
          color: this.selectedColor,
          hex: this.hexInput,
        })
      );
    }

    // Handle slider dragging
    if (this.isDraggingSlider) {
      const type = this.isDraggingSlider;
      const value = this.getSliderValue(x, type);

      if (type === 'a') {
        this.selectedColor.a = value / 255;
      } else {
        this.selectedColor[type] = value;
        this.hsv = this.rgbToHsv(this.selectedColor);
      }

      this.hexInput = this.colorToHex(this.selectedColor);
      this.setNeedsDraw();
      this.dispatchEvent(
        new SK8CustomEvent('colorChanged', {
          color: this.selectedColor,
          hex: this.hexInput,
        })
      );
    }

    super.onMouseMove(x, y);
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    ctx.fillRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      RectUtils.height(bounds)
    );

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      RectUtils.height(bounds)
    );

    // Draw color wheel
    this.drawColorWheel(ctx);

    // Draw sliders
    this.drawSlider(ctx, 'r');
    this.drawSlider(ctx, 'g');
    this.drawSlider(ctx, 'b');
    this.drawSlider(ctx, 'a');

    // Draw hex input display
    this.drawHexInput(ctx);

    // Draw color preview
    this.drawColorPreview(ctx);

    // Draw preset swatches
    this.drawPresetSwatches(ctx);
  }

  private drawColorWheel(ctx: CanvasRenderingContext2D): void {
    const wheel = this.getWheelBounds();

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 90) * Math.PI) / 180;
      const endAngle = ((angle + 1 - 90) * Math.PI) / 180;

      const gradient = ctx.createRadialGradient(
        wheel.x,
        wheel.y,
        0,
        wheel.x,
        wheel.y,
        wheel.radius
      );

      const hue = angle;
      const centerColor = this.hsvToRgb({ h: hue, s: 0, v: this.hsv.v });
      const edgeColor = this.hsvToRgb({ h: hue, s: 1, v: this.hsv.v });

      gradient.addColorStop(0, ColorUtils.toCSS(centerColor));
      gradient.addColorStop(1, ColorUtils.toCSS(edgeColor));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(wheel.x, wheel.y);
      ctx.arc(wheel.x, wheel.y, wheel.radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
    }

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wheel.x, wheel.y, wheel.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw current selection indicator
    const hueAngle = ((this.hsv.h - 90) * Math.PI) / 180;
    const distance = this.hsv.s * wheel.radius;
    const indicatorX = wheel.x + Math.cos(hueAngle) * distance;
    const indicatorY = wheel.y + Math.sin(hueAngle) * distance;

    ctx.strokeStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1 });
    ctx.fillStyle = ColorUtils.toCSS(this.selectedColor);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawSlider(ctx: CanvasRenderingContext2D, type: 'r' | 'g' | 'b' | 'a'): void {
    const sliderBounds = this.getSliderBounds(type);
    const bounds = this.getBoundsRect();

    // Draw label
    const label = { r: 'R', g: 'G', b: 'B', a: 'A' }[type];
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(label, bounds.left + this.padding + 25, (sliderBounds.top + sliderBounds.bottom) / 2);

    // Draw slider gradient
    const gradient = ctx.createLinearGradient(
      sliderBounds.left,
      sliderBounds.top,
      sliderBounds.right,
      sliderBounds.top
    );

    if (type === 'a') {
      // Alpha slider with checkerboard pattern
      const color = { ...this.selectedColor, a: 0 };
      gradient.addColorStop(0, ColorUtils.toCSS(color));
      color.a = 1;
      gradient.addColorStop(1, ColorUtils.toCSS(color));
    } else {
      const startColor = { ...this.selectedColor };
      const endColor = { ...this.selectedColor };
      startColor[type] = 0;
      endColor[type] = 255;
      gradient.addColorStop(0, ColorUtils.toCSS(startColor));
      gradient.addColorStop(1, ColorUtils.toCSS(endColor));
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(
      sliderBounds.left,
      sliderBounds.top,
      sliderBounds.right - sliderBounds.left,
      sliderBounds.bottom - sliderBounds.top
    );

    // Draw slider border
    ctx.strokeStyle = ColorUtils.toCSS(this.sliderBorderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      sliderBounds.left,
      sliderBounds.top,
      sliderBounds.right - sliderBounds.left,
      sliderBounds.bottom - sliderBounds.top
    );

    // Draw slider thumb
    const value = type === 'a' ? this.selectedColor.a * 255 : this.selectedColor[type];
    const thumbX =
      sliderBounds.left + (value / 255) * (sliderBounds.right - sliderBounds.left);

    ctx.strokeStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1 });
    ctx.fillStyle = ColorUtils.toCSS({ r: 0, g: 0, b: 0, a: 1 });
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(thumbX - 3, sliderBounds.top - 2, 6, this.sliderHeight + 4);
    ctx.fill();
    ctx.stroke();

    // Draw value
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    const displayValue = type === 'a' ? Math.round(value / 255 * 100) + '%' : Math.round(value).toString();
    ctx.fillText(
      displayValue,
      sliderBounds.right + 10,
      (sliderBounds.top + sliderBounds.bottom) / 2
    );
  }

  private drawHexInput(ctx: CanvasRenderingContext2D): void {
    const wheel = this.getWheelBounds();
    const x = wheel.x + wheel.radius + this.padding;
    const y = wheel.y - wheel.radius / 2;

    // Draw label
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText('Hex:', x, y);

    // Draw value
    ctx.fillText(this.hexInput, x, y + 18);
  }

  private drawColorPreview(ctx: CanvasRenderingContext2D): void {
    const wheel = this.getWheelBounds();
    const size = 40;
    const x = wheel.x + wheel.radius + this.padding;
    const y = wheel.y;

    // Draw preview
    ctx.fillStyle = ColorUtils.toCSS(this.selectedColor);
    ctx.fillRect(x, y, size, size);

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  private drawPresetSwatches(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.presets.length; i++) {
      const bounds = this.getPresetSwatchBounds(i);
      if (!bounds) continue;

      const color = this.presets[i];

      // Draw swatch
      ctx.fillStyle = ColorUtils.toCSS(color);
      ctx.fillRect(
        bounds.left,
        bounds.top,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top
      );

      // Draw border
      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        bounds.left,
        bounds.top,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top
      );
    }
  }
}
