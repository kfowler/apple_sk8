/**
 * SK8Toolbar - Toolbar widget with buttons
 *
 * A horizontal toolbar with icon buttons, text labels,
 * separators, spacers, and overflow menu support.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type ToolbarItemType = 'button' | 'separator' | 'spacer';
export type ToolbarMode = 'docked' | 'floating';

export interface ToolbarItem {
  type: ToolbarItemType;
  id?: string;
  label?: string;
  icon?: string;
  enabled?: boolean;
  tooltip?: string;
  width?: number;
}

export class SK8Toolbar extends SK8Actor {
  private items: ToolbarItem[] = [];
  private mode: ToolbarMode = 'docked';
  private showOverflowMenu: boolean = false;
  private overflowItems: ToolbarItem[] = [];
  private hoveredItemId: string | null = null;
  private pressedItemId: string | null = null;

  // Visual properties
  private itemHeight: number = 36;
  private defaultButtonWidth: number = 40;
  private separatorWidth: number = 1;
  private spacerWidth: number = 10;
  private padding: number = 4;
  private iconSize: number = 20;
  private fontSize: number = 11;
  private fontFamily: string = 'Geneva, Arial, sans-serif';

  // Colors
  private backgroundColor: Color = { r: 245, g: 245, b: 245, a: 1.0 };
  private buttonHoverColor: Color = { r: 230, g: 230, b: 230, a: 1.0 };
  private buttonPressedColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private disabledColor: Color = { r: 250, g: 250, b: 250, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledTextColor: Color = { r: 150, g: 150, b: 150, a: 1.0 };
  private borderColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private separatorColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Toolbar');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 400, bottom: 40 });

    // Define properties
    this.defineProperty('mode', {
      getter: () => this.getMode(),
      setter: (value: ToolbarMode) => this.setMode(value),
    });

    this.defineProperty('itemHeight', {
      getter: () => this.getItemHeight(),
      setter: (value: number) => this.setItemHeight(value),
    });
  }

  // Mode
  getMode(): ToolbarMode {
    return this.mode;
  }

  setMode(mode: ToolbarMode): void {
    this.mode = mode;
    this.setNeedsDraw();
  }

  // Item height
  getItemHeight(): number {
    return this.itemHeight;
  }

  setItemHeight(height: number): void {
    this.itemHeight = height;
    this.setNeedsDraw();
  }

  // Items management
  getItems(): ToolbarItem[] {
    return [...this.items];
  }

  setItems(items: ToolbarItem[]): void {
    this.items = items.map((item) => this.initializeItem(item));
    this.updateOverflow();
    this.setNeedsDraw();
  }

  addItem(item: ToolbarItem): void {
    this.items.push(this.initializeItem(item));
    this.updateOverflow();
    this.setNeedsDraw();
  }

  removeItem(itemId: string): void {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index >= 0) {
      this.items.splice(index, 1);
      this.updateOverflow();
      this.setNeedsDraw();
    }
  }

  clearItems(): void {
    this.items = [];
    this.overflowItems = [];
    this.setNeedsDraw();
  }

  private initializeItem(item: ToolbarItem): ToolbarItem {
    return {
      ...item,
      id: item.id || `item-${Date.now()}-${Math.random()}`,
      enabled: item.enabled ?? true,
    };
  }

  // Helper: Calculate item width
  private getItemWidth(item: ToolbarItem): number {
    if (item.width) return item.width;

    switch (item.type) {
      case 'separator':
        return this.separatorWidth + this.padding * 2;
      case 'spacer':
        return item.width || this.spacerWidth;
      case 'button':
        if (item.label) {
          // Estimate text width (rough approximation)
          return Math.max(this.defaultButtonWidth, item.label.length * 7 + 20);
        }
        return this.defaultButtonWidth;
      default:
        return this.defaultButtonWidth;
    }
  }

  // Helper: Update overflow items
  private updateOverflow(): void {
    const availableWidth = this.getWidth() - 50; // Reserve space for overflow button
    let currentWidth = 0;
    const visibleItems: ToolbarItem[] = [];
    const overflowItems: ToolbarItem[] = [];

    for (const item of this.items) {
      const itemWidth = this.getItemWidth(item) + this.padding * 2;

      if (currentWidth + itemWidth <= availableWidth) {
        visibleItems.push(item);
        currentWidth += itemWidth;
      } else {
        overflowItems.push(item);
      }
    }

    this.overflowItems = overflowItems;
  }

  // Helper: Get item bounds
  private getItemBounds(item: ToolbarItem): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null {
    const bounds = this.getBoundsRect();
    let currentX = bounds.left + this.padding;

    // Find the item and calculate its bounds
    for (const toolbarItem of this.items) {
      const itemWidth = this.getItemWidth(toolbarItem);

      if (toolbarItem.id === item.id) {
        return {
          left: currentX,
          top: bounds.top + this.padding,
          right: currentX + itemWidth,
          bottom: bounds.top + this.padding + this.itemHeight,
        };
      }

      currentX += itemWidth + this.padding * 2;

      // Stop if we've reached overflow
      if (this.overflowItems.some((oi) => oi.id === toolbarItem.id)) {
        break;
      }
    }

    return null;
  }

  // Helper: Get overflow button bounds
  private getOverflowButtonBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null {
    if (this.overflowItems.length === 0) return null;

    const bounds = this.getBoundsRect();
    const buttonWidth = 30;

    return {
      left: bounds.right - buttonWidth - this.padding,
      top: bounds.top + this.padding,
      right: bounds.right - this.padding,
      bottom: bounds.top + this.padding + this.itemHeight,
    };
  }

  // Helper: Get item at point
  private getItemAtPoint(x: number, y: number): ToolbarItem | null {
    // Check overflow button first
    if (this.overflowItems.length > 0) {
      const overflowBounds = this.getOverflowButtonBounds();
      if (
        overflowBounds &&
        x >= overflowBounds.left &&
        x <= overflowBounds.right &&
        y >= overflowBounds.top &&
        y <= overflowBounds.bottom
      ) {
        return { type: 'button', id: 'overflow-menu' };
      }
    }

    // Check visible items
    for (const item of this.items) {
      if (this.overflowItems.some((oi) => oi.id === item.id)) {
        continue;
      }

      const itemBounds = this.getItemBounds(item);
      if (
        itemBounds &&
        x >= itemBounds.left &&
        x <= itemBounds.right &&
        y >= itemBounds.top &&
        y <= itemBounds.bottom
      ) {
        return item;
      }
    }

    return null;
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    const item = this.getItemAtPoint(x, y);

    if (item) {
      // Handle overflow menu
      if (item.id === 'overflow-menu') {
        this.showOverflowMenu = !this.showOverflowMenu;
        this.setNeedsDraw();
        super.onClick(x, y);
        return;
      }

      // Handle button click
      if (item.type === 'button' && item.enabled !== false) {
        this.dispatchEvent(
          new SK8CustomEvent('buttonClicked', {
            itemId: item.id,
            item,
          })
        );
      }
    } else {
      // Click outside - close overflow menu
      if (this.showOverflowMenu) {
        this.showOverflowMenu = false;
        this.setNeedsDraw();
      }
    }

    super.onClick(x, y);
  }

  override onMouseDown(x: number, y: number): void {
    const item = this.getItemAtPoint(x, y);
    if (item && item.type === 'button' && item.enabled !== false) {
      this.pressedItemId = item.id || null;
      this.setNeedsDraw();
    }
    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    if (this.pressedItemId) {
      this.pressedItemId = null;
      this.setNeedsDraw();
    }
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    const item = this.getItemAtPoint(x, y);
    const newHoverId = item?.id || null;

    if (this.hoveredItemId !== newHoverId) {
      this.hoveredItemId = newHoverId;
      this.setNeedsDraw();
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

    // Draw items
    let currentX = bounds.left + this.padding;

    for (const item of this.items) {
      // Skip if in overflow
      if (this.overflowItems.some((oi) => oi.id === item.id)) {
        break;
      }

      const itemWidth = this.getItemWidth(item);
      this.drawItem(ctx, item, currentX, bounds.top + this.padding, itemWidth);
      currentX += itemWidth + this.padding * 2;
    }

    // Draw overflow button if needed
    if (this.overflowItems.length > 0) {
      this.drawOverflowButton(ctx);
    }

    // Draw overflow menu
    if (this.showOverflowMenu) {
      this.drawOverflowMenu(ctx);
    }
  }

  private drawItem(
    ctx: CanvasRenderingContext2D,
    item: ToolbarItem,
    x: number,
    y: number,
    width: number
  ): void {
    const isHovered = item.id === this.hoveredItemId;
    const isPressed = item.id === this.pressedItemId;
    const isEnabled = item.enabled !== false;

    switch (item.type) {
      case 'separator':
        // Draw separator line
        ctx.strokeStyle = ColorUtils.toCSS(this.separatorColor);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2, y + this.itemHeight);
        ctx.stroke();
        break;

      case 'spacer':
        // Spacers are invisible
        break;

      case 'button':
        // Draw button background
        if (!isEnabled) {
          ctx.fillStyle = ColorUtils.toCSS(this.disabledColor);
        } else if (isPressed) {
          ctx.fillStyle = ColorUtils.toCSS(this.buttonPressedColor);
        } else if (isHovered) {
          ctx.fillStyle = ColorUtils.toCSS(this.buttonHoverColor);
        } else {
          ctx.fillStyle = 'transparent';
        }

        if (ctx.fillStyle !== 'transparent') {
          ctx.fillRect(x, y, width, this.itemHeight);
        }

        // Draw button border on hover/press
        if ((isHovered || isPressed) && isEnabled) {
          ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, width, this.itemHeight);
        }

        // Draw icon (emoji as placeholder)
        if (item.icon) {
          ctx.font = `${this.iconSize}px ${this.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = ColorUtils.toCSS(
            isEnabled ? this.textColor : this.disabledTextColor
          );

          const iconY = item.label ? y + this.iconSize / 2 + 2 : y + this.itemHeight / 2;
          ctx.fillText(item.icon, x + width / 2, iconY);
        }

        // Draw label
        if (item.label) {
          ctx.font = `${this.fontSize}px ${this.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = ColorUtils.toCSS(
            isEnabled ? this.textColor : this.disabledTextColor
          );

          const labelY = y + this.itemHeight - 2;
          ctx.fillText(item.label, x + width / 2, labelY);
        }
        break;
    }
  }

  private drawOverflowButton(ctx: CanvasRenderingContext2D): void {
    const overflowBounds = this.getOverflowButtonBounds();
    if (!overflowBounds) return;

    const isHovered = this.hoveredItemId === 'overflow-menu';
    const isPressed = this.pressedItemId === 'overflow-menu';

    // Draw button background
    if (isPressed) {
      ctx.fillStyle = ColorUtils.toCSS(this.buttonPressedColor);
    } else if (isHovered) {
      ctx.fillStyle = ColorUtils.toCSS(this.buttonHoverColor);
    } else {
      ctx.fillStyle = 'transparent';
    }

    if (ctx.fillStyle !== 'transparent') {
      ctx.fillRect(
        overflowBounds.left,
        overflowBounds.top,
        overflowBounds.right - overflowBounds.left,
        overflowBounds.bottom - overflowBounds.top
      );
    }

    // Draw border
    if (isHovered || isPressed) {
      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        overflowBounds.left,
        overflowBounds.top,
        overflowBounds.right - overflowBounds.left,
        overflowBounds.bottom - overflowBounds.top
      );
    }

    // Draw three dots
    const centerX =
      (overflowBounds.left + overflowBounds.right) / 2;
    const centerY = (overflowBounds.top + overflowBounds.bottom) / 2;
    const dotRadius = 2;
    const dotSpacing = 6;

    ctx.fillStyle = ColorUtils.toCSS(this.textColor);

    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(centerX + i * dotSpacing, centerY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawOverflowMenu(ctx: CanvasRenderingContext2D): void {
    const overflowBounds = this.getOverflowButtonBounds();
    if (!overflowBounds) return;

    const menuWidth = 150;
    const menuItemHeight = 30;
    const menuHeight = this.overflowItems.length * menuItemHeight;
    const menuX = overflowBounds.left;
    const menuY = overflowBounds.bottom + 2;

    // Draw menu background
    ctx.fillStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1.0 });
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Draw menu border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Draw menu items
    for (let i = 0; i < this.overflowItems.length; i++) {
      const item = this.overflowItems[i];
      const itemY = menuY + i * menuItemHeight;

      // Draw item
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ColorUtils.toCSS(
        item.enabled === false ? this.disabledTextColor : this.textColor
      );

      const label = item.label || item.id || '';
      const icon = item.icon || '';
      const text = icon ? `${icon} ${label}` : label;

      ctx.fillText(text, menuX + 10, itemY + menuItemHeight / 2);

      // Draw separator between items
      if (i > 0) {
        ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(menuX, itemY);
        ctx.lineTo(menuX + menuWidth, itemY);
        ctx.stroke();
      }
    }
  }
}
