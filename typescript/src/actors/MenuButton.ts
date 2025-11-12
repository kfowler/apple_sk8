/**
 * SK8MenuButton - Button with dropdown menu
 *
 * A button that displays a dropdown menu when clicked
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export interface MenuItem {
  label: string;
  value: string;
  enabled?: boolean;
  separator?: boolean;
}

export class SK8MenuButton extends SK8Actor {
  private label: string = 'Menu';
  private menuItems: MenuItem[] = [];
  private menuOpen: boolean = false;
  private hoveredItemIndex: number = -1;
  private enabled: boolean = true;

  // Visual properties
  private cornerRadius: number = 6;
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private padding: number = 10;
  private menuItemHeight: number = 28;
  private menuWidth: number = 150;

  // Colors
  private normalColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private hoverColor: Color = { r: 230, g: 230, b: 230, a: 1.0 };
  private pressedColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private disabledColor: Color = { r: 250, g: 250, b: 250, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledTextColor: Color = { r: 150, g: 150, b: 150, a: 1.0 };
  private borderColor: Color = { r: 120, g: 120, b: 120, a: 1.0 };
  private menuBackgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private menuHoverColor: Color = { r: 0, g: 120, b: 215, a: 0.1 };
  private separatorColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };

  private buttonHover: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'MenuButton');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 120, bottom: 30 });

    // Define properties
    this.defineProperty('label', {
      getter: () => this.getLabel(),
      setter: (value: string) => this.setLabel(value),
    });

    this.defineProperty('enabled', {
      getter: () => this.getEnabled(),
      setter: (value: boolean) => this.setEnabled(value),
    });

    this.defineProperty('menuOpen', {
      getter: () => this.getMenuOpen(),
      setter: (value: boolean) => this.setMenuOpen(value),
    });

    this.defineProperty('menuWidth', {
      getter: () => this.getMenuWidth(),
      setter: (value: number) => this.setMenuWidth(value),
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
      this.menuOpen = false;
    }
    this.setNeedsDraw();
  }

  // Menu open
  getMenuOpen(): boolean {
    return this.menuOpen;
  }

  setMenuOpen(open: boolean): void {
    if (this.enabled) {
      this.menuOpen = open;
      this.hoveredItemIndex = -1;
      this.setNeedsDraw();
    }
  }

  // Menu width
  getMenuWidth(): number {
    return this.menuWidth;
  }

  setMenuWidth(width: number): void {
    this.menuWidth = width;
    this.setNeedsDraw();
  }

  // Menu items
  getMenuItems(): MenuItem[] {
    return [...this.menuItems];
  }

  setMenuItems(items: MenuItem[]): void {
    this.menuItems = items;
    this.setNeedsDraw();
  }

  addMenuItem(item: MenuItem): void {
    this.menuItems.push(item);
    this.setNeedsDraw();
  }

  clearMenuItems(): void {
    this.menuItems = [];
    this.setNeedsDraw();
  }

  // Helper: Get menu bounds
  private getMenuBounds(): { x: number; y: number; width: number; height: number } {
    const bounds = this.getBoundsRect();
    const height = this.menuItems.length * this.menuItemHeight;

    return {
      x: bounds.left,
      y: bounds.bottom,
      width: this.menuWidth,
      height,
    };
  }

  // Helper: Get menu item at point
  private getMenuItemAtPoint(x: number, y: number): number {
    if (!this.menuOpen) return -1;

    const menuBounds = this.getMenuBounds();
    if (
      x < menuBounds.x ||
      x > menuBounds.x + menuBounds.width ||
      y < menuBounds.y ||
      y > menuBounds.y + menuBounds.height
    ) {
      return -1;
    }

    const index = Math.floor((y - menuBounds.y) / this.menuItemHeight);
    return index >= 0 && index < this.menuItems.length ? index : -1;
  }

  // Override containsPoint to include menu area
  override containsPoint(x: number, y: number): boolean {
    // Check button bounds
    if (super.containsPoint(x, y)) {
      return true;
    }

    // Check menu bounds if open
    if (this.menuOpen) {
      const menuBounds = this.getMenuBounds();
      return (
        x >= menuBounds.x &&
        x <= menuBounds.x + menuBounds.width &&
        y >= menuBounds.y &&
        y <= menuBounds.y + menuBounds.height
      );
    }

    return false;
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    if (!this.enabled) return;

    const bounds = this.getBoundsRect();

    // Check if clicking button
    if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
      this.setMenuOpen(!this.menuOpen);
      super.onClick(x, y);
      return;
    }

    // Check if clicking menu item
    if (this.menuOpen) {
      const itemIndex = this.getMenuItemAtPoint(x, y);
      if (itemIndex >= 0) {
        const item = this.menuItems[itemIndex];
        if (!item.separator && item.enabled !== false) {
          this.setMenuOpen(false);
          if (this.hasHandler('menuSelect')) {
            this.callHandler('menuSelect', item);
          }
        }
      } else {
        // Clicked outside menu - close it
        this.setMenuOpen(false);
      }
    }
  }

  override onMouseMove(x: number, y: number): void {
    if (!this.enabled) return;

    const bounds = this.getBoundsRect();

    // Check button hover
    const wasHovering = this.buttonHover;
    this.buttonHover = x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;

    // Check menu item hover
    const wasHoveredIndex = this.hoveredItemIndex;
    this.hoveredItemIndex = this.getMenuItemAtPoint(x, y);

    if (wasHovering !== this.buttonHover || wasHoveredIndex !== this.hoveredItemIndex) {
      this.setNeedsDraw();
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

    // Determine background color
    let bgColor: Color;
    if (!this.enabled) {
      bgColor = this.disabledColor;
    } else if (this.menuOpen) {
      bgColor = this.pressedColor;
    } else if (this.buttonHover) {
      bgColor = this.hoverColor;
    } else {
      bgColor = this.normalColor;
    }

    // Draw button background
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

    ctx.fillStyle = ColorUtils.toCSS(bgColor);
    ctx.fill();

    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw button label
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textX = x + this.padding;
    const textY = y + height / 2;
    const labelColor = this.enabled ? this.textColor : this.disabledTextColor;

    ctx.fillStyle = ColorUtils.toCSS(labelColor);
    ctx.fillText(this.label, textX, textY);

    // Draw dropdown arrow
    const arrowX = x + width - this.padding - 8;
    const arrowY = y + height / 2;
    const arrowSize = 4;

    ctx.fillStyle = ColorUtils.toCSS(labelColor);
    ctx.beginPath();
    ctx.moveTo(arrowX - arrowSize, arrowY - arrowSize / 2);
    ctx.lineTo(arrowX + arrowSize, arrowY - arrowSize / 2);
    ctx.lineTo(arrowX, arrowY + arrowSize / 2);
    ctx.closePath();
    ctx.fill();

    // Draw menu if open
    if (this.menuOpen) {
      const menuBounds = this.getMenuBounds();
      const menuX = menuBounds.x;
      const menuY = menuBounds.y;
      const menuW = menuBounds.width;
      const menuH = menuBounds.height;

      // Draw menu background
      ctx.fillStyle = ColorUtils.toCSS(this.menuBackgroundColor);
      ctx.fillRect(menuX, menuY, menuW, menuH);

      // Draw menu border
      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.strokeRect(menuX, menuY, menuW, menuH);

      // Draw menu items
      for (let i = 0; i < this.menuItems.length; i++) {
        const item = this.menuItems[i];
        const itemY = menuY + i * this.menuItemHeight;

        // Draw separator
        if (item.separator) {
          const sepY = itemY + this.menuItemHeight / 2;
          ctx.strokeStyle = ColorUtils.toCSS(this.separatorColor);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(menuX + 5, sepY);
          ctx.lineTo(menuX + menuW - 5, sepY);
          ctx.stroke();
          continue;
        }

        // Draw hover background
        if (i === this.hoveredItemIndex && item.enabled !== false) {
          ctx.fillStyle = ColorUtils.toCSS(this.menuHoverColor);
          ctx.fillRect(menuX, itemY, menuW, this.menuItemHeight);
        }

        // Draw item text
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const itemTextX = menuX + this.padding;
        const itemTextY = itemY + this.menuItemHeight / 2;
        const itemTextColor = item.enabled === false ? this.disabledTextColor : this.textColor;

        ctx.fillStyle = ColorUtils.toCSS(itemTextColor);
        ctx.fillText(item.label, itemTextX, itemTextY);
      }
    }
  }
}
