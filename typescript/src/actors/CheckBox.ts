/**
 * SK8CheckBox - Interactive checkbox widget
 *
 * A checkbox with label, checked state, and toggle handling
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export class SK8CheckBox extends SK8Actor {
  private checked: boolean = false;
  private label: string = 'CheckBox';
  private enabled: boolean = true;
  private boxSize: number = 16;
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private labelGap: number = 8;

  // Colors
  private boxColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private borderColor: Color = { r: 120, g: 120, b: 120, a: 1.0 };
  private checkColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private hoverBorderColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };

  private isHovering: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'CheckBox');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 120, bottom: 20 });

    // Define properties
    this.defineProperty('checked', {
      getter: () => this.getChecked(),
      setter: (value: boolean) => this.setChecked(value),
    });

    this.defineProperty('label', {
      getter: () => this.getLabel(),
      setter: (value: string) => this.setLabel(value),
    });

    this.defineProperty('enabled', {
      getter: () => this.getEnabled(),
      setter: (value: boolean) => this.setEnabled(value),
    });

    this.defineProperty('boxSize', {
      getter: () => this.getBoxSize(),
      setter: (value: number) => this.setBoxSize(value),
    });
  }

  // Checked state
  getChecked(): boolean {
    return this.checked;
  }

  setChecked(checked: boolean): void {
    this.checked = checked;
    this.setNeedsDraw();
  }

  toggle(): void {
    this.setChecked(!this.checked);
    if (this.hasHandler('toggle')) {
      this.callHandler('toggle', this.checked);
    }
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
    this.setNeedsDraw();
  }

  // Box size
  getBoxSize(): number {
    return this.boxSize;
  }

  setBoxSize(size: number): void {
    this.boxSize = size;
    this.setNeedsDraw();
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    if (this.enabled) {
      this.toggle();
      super.onClick(x, y);
    }
  }

  override onMouseMove(x: number, y: number): void {
    if (this.enabled) {
      const wasHovering = this.isHovering;
      this.isHovering = this.containsPoint(x, y);
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
    const height = RectUtils.height(bounds);

    // Calculate box position (vertically centered)
    const boxY = y + (height - this.boxSize) / 2;

    // Draw checkbox box
    ctx.fillStyle = ColorUtils.toCSS(
      this.enabled ? this.boxColor : { r: 245, g: 245, b: 245, a: 1.0 }
    );
    ctx.fillRect(x, boxY, this.boxSize, this.boxSize);

    // Draw border
    const borderColor = this.isHovering && this.enabled ? this.hoverBorderColor : this.borderColor;
    ctx.strokeStyle = ColorUtils.toCSS(this.enabled ? borderColor : this.disabledColor);
    ctx.lineWidth = this.isHovering && this.enabled ? 2 : 1;
    ctx.strokeRect(x, boxY, this.boxSize, this.boxSize);

    // Draw checkmark if checked
    if (this.checked) {
      ctx.strokeStyle = ColorUtils.toCSS(this.enabled ? this.checkColor : this.disabledColor);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw checkmark path
      ctx.beginPath();
      ctx.moveTo(x + this.boxSize * 0.2, boxY + this.boxSize * 0.5);
      ctx.lineTo(x + this.boxSize * 0.4, boxY + this.boxSize * 0.7);
      ctx.lineTo(x + this.boxSize * 0.8, boxY + this.boxSize * 0.3);
      ctx.stroke();
    }

    // Draw label text
    const textX = x + this.boxSize + this.labelGap;
    const textY = y + height / 2;

    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.textColor : this.disabledColor);
    ctx.fillText(this.label, textX, textY);
  }
}
