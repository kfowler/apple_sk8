/**
 * SK8TabPanel - Tabbed panel widget
 *
 * A panel with multiple tabs for organizing content into sections.
 * Supports tab switching, closeable tabs, and drag-to-reorder.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type TabOrientation = 'horizontal' | 'vertical';

export interface Tab {
  label: string;
  content: SK8Actor | null;
  closeable?: boolean;
  enabled?: boolean;
  id?: string;
}

export class SK8TabPanel extends SK8Actor {
  private tabs: Tab[] = [];
  private selectedIndex: number = 0;
  private orientation: TabOrientation = 'horizontal';
  private tabHeight: number = 32;
  private tabWidth: number = 120;
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private hoveredTabIndex: number = -1;
  private draggedTabIndex: number = -1;
  private dragOverTabIndex: number = -1;
  private closeButtonHoverIndex: number = -1;

  // Colors
  private tabBackgroundColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private selectedTabColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private hoverTabColor: Color = { r: 230, g: 230, b: 230, a: 1.0 };
  private disabledTabColor: Color = { r: 250, g: 250, b: 250, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private disabledTextColor: Color = { r: 150, g: 150, b: 150, a: 1.0 };
  private borderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private contentBackgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'TabPanel');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 400, bottom: 300 });

    // Define properties
    this.defineProperty('selectedIndex', {
      getter: () => this.getSelectedIndex(),
      setter: (value: number) => this.setSelectedIndex(value),
    });

    this.defineProperty('orientation', {
      getter: () => this.getOrientation(),
      setter: (value: TabOrientation) => this.setOrientation(value),
    });

    this.defineProperty('tabHeight', {
      getter: () => this.getTabHeight(),
      setter: (value: number) => this.setTabHeight(value),
    });
  }

  // Tabs management
  getTabs(): Tab[] {
    return [...this.tabs];
  }

  addTab(tab: Tab): void {
    this.tabs.push({
      ...tab,
      id: tab.id || `tab-${Date.now()}-${Math.random()}`,
      closeable: tab.closeable ?? false,
      enabled: tab.enabled ?? true,
    });
    if (this.tabs.length === 1) {
      this.selectedIndex = 0;
    }
    this.setNeedsDraw();
  }

  removeTab(index: number): void {
    if (index >= 0 && index < this.tabs.length) {
      const tab = this.tabs[index];
      this.tabs.splice(index, 1);

      // Adjust selected index
      if (this.selectedIndex >= this.tabs.length) {
        this.selectedIndex = Math.max(0, this.tabs.length - 1);
      }

      this.setNeedsDraw();

      // Dispatch tabClosed event
      this.dispatchEvent(
        new SK8CustomEvent('tabClosed', { index, tab })
      );
    }
  }

  clearTabs(): void {
    this.tabs = [];
    this.selectedIndex = 0;
    this.setNeedsDraw();
  }

  // Selected index
  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  setSelectedIndex(index: number): void {
    if (index >= 0 && index < this.tabs.length) {
      const oldIndex = this.selectedIndex;
      this.selectedIndex = index;
      this.setNeedsDraw();

      // Dispatch tabChanged event
      if (oldIndex !== index) {
        this.dispatchEvent(
          new SK8CustomEvent('tabChanged', {
            oldIndex,
            newIndex: index,
            tab: this.tabs[index],
          })
        );
      }
    }
  }

  getSelectedTab(): Tab | null {
    return this.tabs[this.selectedIndex] || null;
  }

  // Orientation
  getOrientation(): TabOrientation {
    return this.orientation;
  }

  setOrientation(orientation: TabOrientation): void {
    this.orientation = orientation;
    this.setNeedsDraw();
  }

  // Tab height
  getTabHeight(): number {
    return this.tabHeight;
  }

  setTabHeight(height: number): void {
    this.tabHeight = height;
    this.setNeedsDraw();
  }

  // Helper: Get tab bounds
  private getTabBounds(index: number): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null {
    if (index < 0 || index >= this.tabs.length) return null;

    const bounds = this.getBoundsRect();

    if (this.orientation === 'horizontal') {
      const left = bounds.left + index * this.tabWidth;
      return {
        left,
        top: bounds.top,
        right: left + this.tabWidth,
        bottom: bounds.top + this.tabHeight,
      };
    } else {
      const top = bounds.top + index * this.tabHeight;
      return {
        left: bounds.left,
        top,
        right: bounds.left + this.tabWidth,
        bottom: top + this.tabHeight,
      };
    }
  }

  // Helper: Get close button bounds
  private getCloseButtonBounds(index: number): {
    x: number;
    y: number;
    size: number;
  } | null {
    const tabBounds = this.getTabBounds(index);
    if (!tabBounds) return null;

    const size = 14;
    const padding = 6;

    return {
      x: tabBounds.right - size - padding,
      y: (tabBounds.top + tabBounds.bottom) / 2,
      size,
    };
  }

  // Helper: Get tab at point
  private getTabAtPoint(x: number, y: number): number {
    for (let i = 0; i < this.tabs.length; i++) {
      const tabBounds = this.getTabBounds(i);
      if (
        tabBounds &&
        x >= tabBounds.left &&
        x <= tabBounds.right &&
        y >= tabBounds.top &&
        y <= tabBounds.bottom
      ) {
        return i;
      }
    }
    return -1;
  }

  // Helper: Check if point is on close button
  private isPointOnCloseButton(x: number, y: number, index: number): boolean {
    const tab = this.tabs[index];
    if (!tab?.closeable) return false;

    const closeBtn = this.getCloseButtonBounds(index);
    if (!closeBtn) return false;

    const dx = x - closeBtn.x;
    const dy = y - closeBtn.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= closeBtn.size / 2;
  }

  // Helper: Get content area bounds
  private getContentBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const bounds = this.getBoundsRect();

    if (this.orientation === 'horizontal') {
      return {
        left: bounds.left,
        top: bounds.top + this.tabHeight,
        right: bounds.right,
        bottom: bounds.bottom,
      };
    } else {
      return {
        left: bounds.left + this.tabWidth,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
      };
    }
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    const tabIndex = this.getTabAtPoint(x, y);

    if (tabIndex >= 0) {
      const tab = this.tabs[tabIndex];

      // Check if clicking close button
      if (this.isPointOnCloseButton(x, y, tabIndex)) {
        this.removeTab(tabIndex);
        return;
      }

      // Select tab if enabled
      if (tab.enabled !== false) {
        this.setSelectedIndex(tabIndex);
      }
    }

    super.onClick(x, y);
  }

  override onMouseDown(x: number, y: number): void {
    const tabIndex = this.getTabAtPoint(x, y);
    if (tabIndex >= 0 && !this.isPointOnCloseButton(x, y, tabIndex)) {
      this.draggedTabIndex = tabIndex;
    }
    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    // Handle drag-to-reorder
    if (this.draggedTabIndex >= 0 && this.dragOverTabIndex >= 0) {
      if (this.draggedTabIndex !== this.dragOverTabIndex) {
        // Reorder tabs
        const draggedTab = this.tabs[this.draggedTabIndex];
        this.tabs.splice(this.draggedTabIndex, 1);
        this.tabs.splice(this.dragOverTabIndex, 0, draggedTab);

        // Update selected index if needed
        if (this.selectedIndex === this.draggedTabIndex) {
          this.selectedIndex = this.dragOverTabIndex;
        } else if (
          this.draggedTabIndex < this.selectedIndex &&
          this.dragOverTabIndex >= this.selectedIndex
        ) {
          this.selectedIndex--;
        } else if (
          this.draggedTabIndex > this.selectedIndex &&
          this.dragOverTabIndex <= this.selectedIndex
        ) {
          this.selectedIndex++;
        }

        this.setNeedsDraw();
      }
    }

    this.draggedTabIndex = -1;
    this.dragOverTabIndex = -1;
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    const tabIndex = this.getTabAtPoint(x, y);

    // Update hovered tab
    if (this.hoveredTabIndex !== tabIndex) {
      this.hoveredTabIndex = tabIndex;
      this.setNeedsDraw();
    }

    // Update close button hover
    const closeHoverIndex = tabIndex >= 0 && this.isPointOnCloseButton(x, y, tabIndex)
      ? tabIndex
      : -1;

    if (this.closeButtonHoverIndex !== closeHoverIndex) {
      this.closeButtonHoverIndex = closeHoverIndex;
      this.setNeedsDraw();
    }

    // Update drag over tab
    if (this.draggedTabIndex >= 0 && tabIndex >= 0) {
      if (this.dragOverTabIndex !== tabIndex) {
        this.dragOverTabIndex = tabIndex;
        this.setNeedsDraw();
      }
    }

    super.onMouseMove(x, y);
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const contentBounds = this.getContentBounds();

    // Draw content area background
    ctx.fillStyle = ColorUtils.toCSS(this.contentBackgroundColor);
    ctx.fillRect(
      contentBounds.left,
      contentBounds.top,
      contentBounds.right - contentBounds.left,
      contentBounds.bottom - contentBounds.top
    );

    // Draw content area border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      contentBounds.left,
      contentBounds.top,
      contentBounds.right - contentBounds.left,
      contentBounds.bottom - contentBounds.top
    );

    // Draw tabs
    for (let i = 0; i < this.tabs.length; i++) {
      this.drawTab(ctx, i);
    }

    // Draw selected tab content
    const selectedTab = this.getSelectedTab();
    if (selectedTab?.content) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        contentBounds.left,
        contentBounds.top,
        contentBounds.right - contentBounds.left,
        contentBounds.bottom - contentBounds.top
      );
      ctx.clip();
      selectedTab.content.render(ctx);
      ctx.restore();
    }
  }

  private drawTab(ctx: CanvasRenderingContext2D, index: number): void {
    const tab = this.tabs[index];
    const tabBounds = this.getTabBounds(index);
    if (!tabBounds) return;

    const isSelected = index === this.selectedIndex;
    const isHovered = index === this.hoveredTabIndex;
    const isDragged = index === this.draggedTabIndex;
    const isDragOver = index === this.dragOverTabIndex;

    // Determine background color
    let bgColor: Color;
    if (tab.enabled === false) {
      bgColor = this.disabledTabColor;
    } else if (isSelected) {
      bgColor = this.selectedTabColor;
    } else if (isHovered || isDragOver) {
      bgColor = this.hoverTabColor;
    } else {
      bgColor = this.tabBackgroundColor;
    }

    // Draw tab background
    ctx.fillStyle = ColorUtils.toCSS(bgColor);
    ctx.fillRect(
      tabBounds.left,
      tabBounds.top,
      tabBounds.right - tabBounds.left,
      tabBounds.bottom - tabBounds.top
    );

    // Draw tab border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      tabBounds.left,
      tabBounds.top,
      tabBounds.right - tabBounds.left,
      tabBounds.bottom - tabBounds.top
    );

    // Draw drag indicator
    if (isDragOver && this.draggedTabIndex >= 0 && index !== this.draggedTabIndex) {
      ctx.strokeStyle = ColorUtils.toCSS({ r: 0, g: 120, b: 215, a: 1.0 });
      ctx.lineWidth = 3;
      if (this.orientation === 'horizontal') {
        const x = index < this.draggedTabIndex ? tabBounds.left : tabBounds.right;
        ctx.beginPath();
        ctx.moveTo(x, tabBounds.top);
        ctx.lineTo(x, tabBounds.bottom);
        ctx.stroke();
      } else {
        const y = index < this.draggedTabIndex ? tabBounds.top : tabBounds.bottom;
        ctx.beginPath();
        ctx.moveTo(tabBounds.left, y);
        ctx.lineTo(tabBounds.right, y);
        ctx.stroke();
      }
    }

    // Draw tab label
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textColor = tab.enabled === false ? this.disabledTextColor : this.textColor;
    ctx.fillStyle = ColorUtils.toCSS(textColor);

    const textX = tabBounds.left + 10;
    const textY = (tabBounds.top + tabBounds.bottom) / 2;
    const maxTextWidth = tabBounds.right - tabBounds.left - 20 - (tab.closeable ? 20 : 0);

    // Truncate text if needed
    let labelText = tab.label;
    const textWidth = ctx.measureText(labelText).width;
    if (textWidth > maxTextWidth) {
      while (ctx.measureText(labelText + '...').width > maxTextWidth && labelText.length > 0) {
        labelText = labelText.slice(0, -1);
      }
      labelText += '...';
    }

    ctx.fillText(labelText, textX, textY);

    // Draw close button if closeable
    if (tab.closeable) {
      const closeBtn = this.getCloseButtonBounds(index);
      if (closeBtn) {
        const isCloseHovered = this.closeButtonHoverIndex === index;

        // Draw close button circle
        ctx.beginPath();
        ctx.arc(closeBtn.x, closeBtn.y, closeBtn.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = isCloseHovered
          ? ColorUtils.toCSS({ r: 220, g: 220, b: 220, a: 1.0 })
          : ColorUtils.toCSS({ r: 240, g: 240, b: 240, a: 1.0 });
        ctx.fill();

        // Draw X
        const xSize = 4;
        ctx.strokeStyle = ColorUtils.toCSS({ r: 100, g: 100, b: 100, a: 1.0 });
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(closeBtn.x - xSize, closeBtn.y - xSize);
        ctx.lineTo(closeBtn.x + xSize, closeBtn.y + xSize);
        ctx.moveTo(closeBtn.x + xSize, closeBtn.y - xSize);
        ctx.lineTo(closeBtn.x - xSize, closeBtn.y + xSize);
        ctx.stroke();
      }
    }

    // Draw opacity overlay if being dragged
    if (isDragged) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(
        tabBounds.left,
        tabBounds.top,
        tabBounds.right - tabBounds.left,
        tabBounds.bottom - tabBounds.top
      );
    }
  }
}
