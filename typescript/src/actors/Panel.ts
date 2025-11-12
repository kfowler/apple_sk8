/**
 * SK8Panel - Panel widget with title bar
 *
 * A panel with a title bar, optional close button, and content area
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export class SK8Panel extends SK8Actor {
  private title: string = 'Panel';
  private children: SK8Actor[] = [];
  private showCloseButton: boolean = true;
  private collapsible: boolean = false;
  private collapsed: boolean = false;
  private titleBarHeight: number = 30;
  private padding: number = 10;
  private cornerRadius: number = 6;

  // Visual properties
  private titleBarColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private borderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private titleColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private closeButtonColor: Color = { r: 220, g: 53, b: 69, a: 1.0 };

  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private fontWeight: string = 'bold';

  private closeButtonHover: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Panel');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 300, bottom: 200 });

    // Define properties
    this.defineProperty('title', {
      getter: () => this.getTitle(),
      setter: (value: string) => this.setTitle(value),
    });

    this.defineProperty('showCloseButton', {
      getter: () => this.getShowCloseButton(),
      setter: (value: boolean) => this.setShowCloseButton(value),
    });

    this.defineProperty('collapsible', {
      getter: () => this.getCollapsible(),
      setter: (value: boolean) => this.setCollapsible(value),
    });

    this.defineProperty('collapsed', {
      getter: () => this.getCollapsed(),
      setter: (value: boolean) => this.setCollapsed(value),
    });

    this.defineProperty('titleBarHeight', {
      getter: () => this.getTitleBarHeight(),
      setter: (value: number) => this.setTitleBarHeight(value),
    });
  }

  // Title
  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
    this.setNeedsDraw();
  }

  // Show close button
  getShowCloseButton(): boolean {
    return this.showCloseButton;
  }

  setShowCloseButton(show: boolean): void {
    this.showCloseButton = show;
    this.setNeedsDraw();
  }

  // Collapsible
  getCollapsible(): boolean {
    return this.collapsible;
  }

  setCollapsible(collapsible: boolean): void {
    this.collapsible = collapsible;
    this.setNeedsDraw();
  }

  // Collapsed
  getCollapsed(): boolean {
    return this.collapsed;
  }

  setCollapsed(collapsed: boolean): void {
    if (this.collapsible) {
      this.collapsed = collapsed;
      this.setNeedsDraw();
    }
  }

  // Title bar height
  getTitleBarHeight(): number {
    return this.titleBarHeight;
  }

  setTitleBarHeight(height: number): void {
    this.titleBarHeight = height;
    this.setNeedsDraw();
  }

  // Children management
  addChild(child: SK8Actor): void {
    if (!this.children.includes(child)) {
      this.children.push(child);
      this.setNeedsDraw();
    }
  }

  removeChild(child: SK8Actor): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
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

  // Helper: Get close button bounds
  private getCloseButtonBounds(): { x: number; y: number; size: number } {
    const bounds = this.getBoundsRect();
    const size = 16;
    const margin = (this.titleBarHeight - size) / 2;
    return {
      x: bounds.right - margin - size,
      y: bounds.top + margin,
      size,
    };
  }

  // Helper: Check if point is in close button
  private isPointInCloseButton(x: number, y: number): boolean {
    if (!this.showCloseButton) return false;
    const btn = this.getCloseButtonBounds();
    return x >= btn.x && x <= btn.x + btn.size && y >= btn.y && y <= btn.y + btn.size;
  }

  // Helper: Check if point is in title bar
  private isPointInTitleBar(x: number, y: number): boolean {
    const bounds = this.getBoundsRect();
    return (
      x >= bounds.left &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.top + this.titleBarHeight
    );
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    if (this.isPointInCloseButton(x, y)) {
      // Close button clicked
      if (this.hasHandler('close')) {
        this.callHandler('close');
      } else {
        this.setVisible(false); // Default: hide panel
      }
      return;
    }

    if (this.collapsible && this.isPointInTitleBar(x, y)) {
      // Toggle collapse
      this.setCollapsed(!this.collapsed);
      return;
    }

    // Delegate to children if not collapsed
    if (!this.collapsed) {
      for (let i = this.children.length - 1; i >= 0; i--) {
        const child = this.children[i];
        if (child.getVisible() && child.containsPoint(x, y)) {
          child.onClick(x, y);
          return;
        }
      }
    }

    super.onClick(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    // Check close button hover
    const wasHovering = this.closeButtonHover;
    this.closeButtonHover = this.isPointInCloseButton(x, y);
    if (wasHovering !== this.closeButtonHover) {
      this.setNeedsDraw();
    }

    // Delegate to children if not collapsed
    if (!this.collapsed) {
      for (const child of this.children) {
        if (child.getVisible()) {
          child.onMouseMove(x, y);
        }
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
    const height = this.collapsed ? this.titleBarHeight : RectUtils.height(bounds);
    const radius = this.cornerRadius;

    // Draw panel background
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

    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw title bar
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + this.titleBarHeight);
    ctx.lineTo(x, y + this.titleBarHeight);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = ColorUtils.toCSS(this.titleBarColor);
    ctx.fill();

    // Draw title text
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.titleColor);

    const titleX = x + this.padding;
    const titleY = y + this.titleBarHeight / 2;

    // Add collapse indicator if collapsible
    if (this.collapsible) {
      const arrow = this.collapsed ? '▶' : '▼';
      ctx.fillText(arrow, titleX, titleY);
      ctx.fillText(this.title, titleX + 20, titleY);
    } else {
      ctx.fillText(this.title, titleX, titleY);
    }

    // Draw close button if enabled
    if (this.showCloseButton) {
      const btn = this.getCloseButtonBounds();

      // Draw button background
      if (this.closeButtonHover) {
        const hoverColor: Color = typeof this.closeButtonColor === 'string'
          ? this.closeButtonColor
          : { r: this.closeButtonColor.r, g: this.closeButtonColor.g, b: this.closeButtonColor.b, a: 0.2 };
        ctx.fillStyle = ColorUtils.toCSS(hoverColor);
        ctx.fillRect(btn.x - 2, btn.y - 2, btn.size + 4, btn.size + 4);
      }

      // Draw X
      ctx.strokeStyle = ColorUtils.toCSS(this.closeButtonColor);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(btn.x + 4, btn.y + 4);
      ctx.lineTo(btn.x + btn.size - 4, btn.y + btn.size - 4);
      ctx.moveTo(btn.x + btn.size - 4, btn.y + 4);
      ctx.lineTo(btn.x + 4, btn.y + btn.size - 4);
      ctx.stroke();
    }

    // Render children if not collapsed
    if (!this.collapsed) {
      ctx.save();
      // Clip to content area
      ctx.beginPath();
      ctx.rect(x, y + this.titleBarHeight, width, height - this.titleBarHeight);
      ctx.clip();

      for (const child of this.children) {
        if (child.getVisible()) {
          ctx.save();
          child.render(ctx);
          ctx.restore();
        }
      }

      ctx.restore();
    }
  }
}
