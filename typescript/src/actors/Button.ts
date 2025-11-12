/**
 * SK8Button - Interactive button widget
 *
 * A button with label, visual states, and click handling
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export type ButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

export class SK8Button extends SK8Actor {
  private label: string = 'Button';
  private enabled: boolean = true;
  private state: ButtonState = 'normal';
  private cornerRadius: number = 6;
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';

  // Colors for different states
  private normalColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private hoverColor: Color = { r: 230, g: 230, b: 230, a: 1.0 };
  private pressedColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private disabledColor: Color = { r: 250, g: 250, b: 250, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledTextColor: Color = { r: 150, g: 150, b: 150, a: 1.0 };
  private borderColor: Color = { r: 120, g: 120, b: 120, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Button');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 100, bottom: 30 });

    // Define properties
    this.defineProperty('label', {
      getter: () => this.getLabel(),
      setter: (value: string) => this.setLabel(value),
    });

    this.defineProperty('enabled', {
      getter: () => this.getEnabled(),
      setter: (value: boolean) => this.setEnabled(value),
    });

    this.defineProperty('state', {
      getter: () => this.getState(),
      setter: (value: ButtonState) => this.setState(value),
    });

    this.defineProperty('cornerRadius', {
      getter: () => this.getCornerRadius(),
      setter: (value: number) => this.setCornerRadius(value),
    });

    this.defineProperty('fontSize', {
      getter: () => this.getFontSize(),
      setter: (value: number) => this.setFontSize(value),
    });
  }

  // Label
  getLabel(): string {
    return this.label;
  }

  setLabel(label: string): void {
    this.label = label;
    this.setNeedsDraw();
  }

  // Enabled
  getEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.state = 'disabled';
    } else if (this.state === 'disabled') {
      this.state = 'normal';
    }
    this.setNeedsDraw();
  }

  // State
  getState(): ButtonState {
    return this.state;
  }

  setState(state: ButtonState): void {
    if (!this.enabled && state !== 'disabled') {
      return; // Can't change state when disabled
    }
    this.state = state;
    this.setNeedsDraw();
  }

  // Corner radius
  getCornerRadius(): number {
    return this.cornerRadius;
  }

  setCornerRadius(radius: number): void {
    this.cornerRadius = radius;
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

  // Event handlers
  override onClick(x: number, y: number): void {
    if (this.enabled) {
      // Call registered handler if exists
      if (this.hasHandler('click')) {
        this.callHandler('click', x, y);
      }
    }
  }

  override onMouseDown(x: number, y: number): void {
    if (this.enabled) {
      this.setState('pressed');
      super.onMouseDown(x, y);
    }
  }

  override onMouseUp(x: number, y: number): void {
    if (this.enabled) {
      this.setState('normal');
      super.onMouseUp(x, y);
    }
  }

  override onMouseMove(x: number, y: number): void {
    if (this.enabled && this.state !== 'pressed') {
      if (this.containsPoint(x, y)) {
        this.setState('hover');
      } else {
        this.setState('normal');
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
    const radius = this.cornerRadius;

    // Determine background color based on state
    let bgColor: Color;
    switch (this.state) {
      case 'hover':
        bgColor = this.hoverColor;
        break;
      case 'pressed':
        bgColor = this.pressedColor;
        break;
      case 'disabled':
        bgColor = this.disabledColor;
        break;
      default:
        bgColor = this.normalColor;
    }

    // Draw rounded rectangle background
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

    // Fill background
    ctx.fillStyle = ColorUtils.toCSS(bgColor);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw label text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = x + width / 2;
    const textY = y + height / 2;
    const labelColor = this.enabled ? this.textColor : this.disabledTextColor;

    ctx.fillStyle = ColorUtils.toCSS(labelColor);
    ctx.fillText(this.label, textX, textY);
  }
}
