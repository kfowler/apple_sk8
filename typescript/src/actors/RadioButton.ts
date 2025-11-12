/**
 * SK8RadioButton - Interactive radio button widget
 *
 * A radio button with label, selected state, and group behavior
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

// Static registry for radio button groups
const radioGroups: Map<string, SK8RadioButton[]> = new Map();

export class SK8RadioButton extends SK8Actor {
  private selected: boolean = false;
  private label: string = 'Radio';
  private group: string = 'default';
  private enabled: boolean = true;
  private circleSize: number = 16;
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private labelGap: number = 8;

  // Colors
  private circleColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private borderColor: Color = { r: 120, g: 120, b: 120, a: 1.0 };
  private selectedColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private hoverBorderColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };

  private isHovering: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'RadioButton');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 120, bottom: 20 });

    // Register with group
    this.registerWithGroup();

    // Define properties
    this.defineProperty('selected', {
      getter: () => this.getSelected(),
      setter: (value: boolean) => this.setSelected(value),
    });

    this.defineProperty('label', {
      getter: () => this.getLabel(),
      setter: (value: string) => this.setLabel(value),
    });

    this.defineProperty('group', {
      getter: () => this.getGroup(),
      setter: (value: string) => this.setGroup(value),
    });

    this.defineProperty('enabled', {
      getter: () => this.getEnabled(),
      setter: (value: boolean) => this.setEnabled(value),
    });

    this.defineProperty('circleSize', {
      getter: () => this.getCircleSize(),
      setter: (value: number) => this.setCircleSize(value),
    });
  }

  // Group management
  private registerWithGroup(): void {
    if (!radioGroups.has(this.group)) {
      radioGroups.set(this.group, []);
    }
    const group = radioGroups.get(this.group)!;
    if (!group.includes(this)) {
      group.push(this);
    }
  }

  private unregisterFromGroup(): void {
    const group = radioGroups.get(this.group);
    if (group) {
      const index = group.indexOf(this);
      if (index !== -1) {
        group.splice(index, 1);
      }
      if (group.length === 0) {
        radioGroups.delete(this.group);
      }
    }
  }

  private deselectOthersInGroup(): void {
    const group = radioGroups.get(this.group);
    if (group) {
      for (const radio of group) {
        if (radio !== this && radio.selected) {
          radio.selected = false;
          radio.setNeedsDraw();
        }
      }
    }
  }

  // Selected state
  getSelected(): boolean {
    return this.selected;
  }

  setSelected(selected: boolean): void {
    if (selected && !this.selected) {
      this.deselectOthersInGroup();
      this.selected = true;
      this.setNeedsDraw();
      if (this.hasHandler('select')) {
        this.callHandler('select');
      }
    } else if (!selected && this.selected) {
      this.selected = false;
      this.setNeedsDraw();
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

  // Group
  getGroup(): string {
    return this.group;
  }

  setGroup(group: string): void {
    if (this.group !== group) {
      this.unregisterFromGroup();
      this.group = group;
      this.registerWithGroup();
      this.setNeedsDraw();
    }
  }

  // Enabled
  getEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.setNeedsDraw();
  }

  // Circle size
  getCircleSize(): number {
    return this.circleSize;
  }

  setCircleSize(size: number): void {
    this.circleSize = size;
    this.setNeedsDraw();
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    if (this.enabled && !this.selected) {
      this.setSelected(true);
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

    // Calculate circle position (vertically centered)
    const circleX = x + this.circleSize / 2;
    const circleY = y + height / 2;
    const radius = this.circleSize / 2;

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
    ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.circleColor : { r: 245, g: 245, b: 245, a: 1.0 });
    ctx.fill();

    // Draw border
    const borderColor = this.isHovering && this.enabled ? this.hoverBorderColor : this.borderColor;
    ctx.strokeStyle = ColorUtils.toCSS(this.enabled ? borderColor : this.disabledColor);
    ctx.lineWidth = this.isHovering && this.enabled ? 2 : 1;
    ctx.stroke();

    // Draw inner dot if selected
    if (this.selected) {
      ctx.beginPath();
      ctx.arc(circleX, circleY, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.selectedColor : this.disabledColor);
      ctx.fill();
    }

    // Draw label text
    const textX = x + this.circleSize + this.labelGap;
    const textY = y + height / 2;

    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.enabled ? this.textColor : this.disabledColor);
    ctx.fillText(this.label, textX, textY);
  }

  // Cleanup
  destroy(): void {
    this.unregisterFromGroup();
  }
}
