/**
 * SK8Container - Container widget for holding other actors
 *
 * A container that can hold child actors and provides layout capabilities
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export type LayoutMode = 'none' | 'horizontal' | 'vertical' | 'grid';

export class SK8Container extends SK8Actor {
  private children: SK8Actor[] = [];
  private layoutMode: LayoutMode = 'none';
  private padding: number = 10;
  private spacing: number = 5;
  private gridColumns: number = 2;

  // Visual properties
  private showBorder: boolean = false;
  private cornerRadius: number = 4;
  private borderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private backgroundColor: Color | null = null;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Container');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 300, bottom: 200 });

    // Define properties
    this.defineProperty('layoutMode', {
      getter: () => this.getLayoutMode(),
      setter: (value: LayoutMode) => this.setLayoutMode(value),
    });

    this.defineProperty('padding', {
      getter: () => this.getPadding(),
      setter: (value: number) => this.setPadding(value),
    });

    this.defineProperty('spacing', {
      getter: () => this.getSpacing(),
      setter: (value: number) => this.setSpacing(value),
    });

    this.defineProperty('gridColumns', {
      getter: () => this.getGridColumns(),
      setter: (value: number) => this.setGridColumns(value),
    });

    this.defineProperty('showBorder', {
      getter: () => this.getShowBorder(),
      setter: (value: boolean) => this.setShowBorder(value),
    });

    this.defineProperty('backgroundColor', {
      getter: () => this.getBackgroundColor(),
      setter: (value: Color | null) => this.setBackgroundColor(value),
    });
  }

  // Children management
  addChild(child: SK8Actor): void {
    if (!this.children.includes(child)) {
      this.children.push(child);
      this.applyLayout();
      this.setNeedsDraw();
    }
  }

  removeChild(child: SK8Actor): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      this.applyLayout();
      this.setNeedsDraw();
    }
  }

  getChildren(): SK8Actor[] {
    return [...this.children];
  }

  clearChildren(): void {
    this.children = [];
    this.setNeedsDraw();
  }

  // Layout mode
  getLayoutMode(): LayoutMode {
    return this.layoutMode;
  }

  setLayoutMode(mode: LayoutMode): void {
    this.layoutMode = mode;
    this.applyLayout();
    this.setNeedsDraw();
  }

  // Padding
  getPadding(): number {
    return this.padding;
  }

  setPadding(padding: number): void {
    this.padding = padding;
    this.applyLayout();
    this.setNeedsDraw();
  }

  // Spacing
  getSpacing(): number {
    return this.spacing;
  }

  setSpacing(spacing: number): void {
    this.spacing = spacing;
    this.applyLayout();
    this.setNeedsDraw();
  }

  // Grid columns
  getGridColumns(): number {
    return this.gridColumns;
  }

  setGridColumns(columns: number): void {
    this.gridColumns = Math.max(1, columns);
    this.applyLayout();
    this.setNeedsDraw();
  }

  // Show border
  getShowBorder(): boolean {
    return this.showBorder;
  }

  setShowBorder(show: boolean): void {
    this.showBorder = show;
    this.setNeedsDraw();
  }

  // Background color
  getBackgroundColor(): Color | null {
    return this.backgroundColor;
  }

  setBackgroundColor(color: Color | null): void {
    this.backgroundColor = color;
    this.setNeedsDraw();
  }

  // Layout logic
  private applyLayout(): void {
    if (this.children.length === 0) return;

    const bounds = this.getBoundsRect();
    const contentWidth = RectUtils.width(bounds) - 2 * this.padding;
    const contentHeight = RectUtils.height(bounds) - 2 * this.padding;

    switch (this.layoutMode) {
      case 'horizontal':
        this.applyHorizontalLayout(contentWidth, contentHeight);
        break;
      case 'vertical':
        this.applyVerticalLayout(contentWidth, contentHeight);
        break;
      case 'grid':
        this.applyGridLayout(contentWidth, contentHeight);
        break;
      case 'none':
      default:
        // No automatic layout
        break;
    }
  }

  private applyHorizontalLayout(contentWidth: number, contentHeight: number): void {
    const bounds = this.getBoundsRect();
    const totalSpacing = (this.children.length - 1) * this.spacing;
    const childWidth = (contentWidth - totalSpacing) / this.children.length;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const x = bounds.left + this.padding + i * (childWidth + this.spacing);
      const y = bounds.top + this.padding;

      child.setBoundsRect({
        left: x,
        top: y,
        right: x + childWidth,
        bottom: y + contentHeight,
      });
    }
  }

  private applyVerticalLayout(contentWidth: number, contentHeight: number): void {
    const bounds = this.getBoundsRect();
    const totalSpacing = (this.children.length - 1) * this.spacing;
    const childHeight = (contentHeight - totalSpacing) / this.children.length;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const x = bounds.left + this.padding;
      const y = bounds.top + this.padding + i * (childHeight + this.spacing);

      child.setBoundsRect({
        left: x,
        top: y,
        right: x + contentWidth,
        bottom: y + childHeight,
      });
    }
  }

  private applyGridLayout(contentWidth: number, contentHeight: number): void {
    const bounds = this.getBoundsRect();
    const rows = Math.ceil(this.children.length / this.gridColumns);
    const totalHSpacing = (this.gridColumns - 1) * this.spacing;
    const totalVSpacing = (rows - 1) * this.spacing;
    const cellWidth = (contentWidth - totalHSpacing) / this.gridColumns;
    const cellHeight = (contentHeight - totalVSpacing) / rows;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const col = i % this.gridColumns;
      const row = Math.floor(i / this.gridColumns);

      const x = bounds.left + this.padding + col * (cellWidth + this.spacing);
      const y = bounds.top + this.padding + row * (cellHeight + this.spacing);

      child.setBoundsRect({
        left: x,
        top: y,
        right: x + cellWidth,
        bottom: y + cellHeight,
      });
    }
  }

  // Event handling - delegate to children
  override onClick(x: number, y: number): void {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onClick(x, y);
        return;
      }
    }
    super.onClick(x, y);
  }

  override onMouseDown(x: number, y: number): void {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onMouseDown(x, y);
        return;
      }
    }
    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.getVisible() && child.containsPoint(x, y)) {
        child.onMouseUp(x, y);
        return;
      }
    }
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.getVisible()) {
        child.onMouseMove(x, y);
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

    // Draw background if set
    if (this.backgroundColor) {
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

      ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
      ctx.fill();
    }

    // Draw border if enabled
    if (this.showBorder) {
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

      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Render children
    for (const child of this.children) {
      if (child.getVisible()) {
        ctx.save();
        child.render(ctx);
        ctx.restore();
      }
    }
  }
}
