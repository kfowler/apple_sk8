/**
 * SK8Scroller - Scrollable content widget
 *
 * A scrollable container with vertical and/or horizontal scrollbars
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export class SK8Scroller extends SK8Actor {
  private content: SK8Actor | null = null;
  private scrollX: number = 0;
  private scrollY: number = 0;
  private showHorizontalScrollbar: boolean = true;
  private showVerticalScrollbar: boolean = true;
  private scrollbarWidth: number = 12;
  private contentWidth: number = 0;
  private contentHeight: number = 0;

  // Visual properties
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private borderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private scrollbarColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private scrollbarThumbColor: Color = { r: 120, g: 120, b: 120, a: 1.0 };
  private scrollbarHoverColor: Color = { r: 100, g: 100, b: 100, a: 1.0 };

  private isDraggingVertical: boolean = false;
  private isDraggingHorizontal: boolean = false;
  private verticalThumbHover: boolean = false;
  private horizontalThumbHover: boolean = false;
  private dragStartY: number = 0;
  private dragStartX: number = 0;
  private dragStartScrollY: number = 0;
  private dragStartScrollX: number = 0;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Scroller');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 300, bottom: 200 });

    // Define properties
    this.defineProperty('scrollX', {
      getter: () => this.getScrollX(),
      setter: (value: number) => this.setScrollX(value),
    });

    this.defineProperty('scrollY', {
      getter: () => this.getScrollY(),
      setter: (value: number) => this.setScrollY(value),
    });

    this.defineProperty('showHorizontalScrollbar', {
      getter: () => this.getShowHorizontalScrollbar(),
      setter: (value: boolean) => this.setShowHorizontalScrollbar(value),
    });

    this.defineProperty('showVerticalScrollbar', {
      getter: () => this.getShowVerticalScrollbar(),
      setter: (value: boolean) => this.setShowVerticalScrollbar(value),
    });

    this.defineProperty('contentWidth', {
      getter: () => this.getContentWidth(),
      setter: (value: number) => this.setContentWidth(value),
    });

    this.defineProperty('contentHeight', {
      getter: () => this.getContentHeight(),
      setter: (value: number) => this.setContentHeight(value),
    });
  }

  // Content
  getContent(): SK8Actor | null {
    return this.content;
  }

  setContent(content: SK8Actor | null): void {
    this.content = content;
    if (content) {
      const contentBounds = content.getBoundsRect();
      this.contentWidth = RectUtils.width(contentBounds);
      this.contentHeight = RectUtils.height(contentBounds);
    }
    this.setNeedsDraw();
  }

  // Scroll position
  getScrollX(): number {
    return this.scrollX;
  }

  setScrollX(x: number): void {
    const maxScrollX = Math.max(0, this.contentWidth - this.getViewportWidth());
    this.scrollX = Math.max(0, Math.min(maxScrollX, x));
    this.setNeedsDraw();
  }

  getScrollY(): number {
    return this.scrollY;
  }

  setScrollY(y: number): void {
    const maxScrollY = Math.max(0, this.contentHeight - this.getViewportHeight());
    this.scrollY = Math.max(0, Math.min(maxScrollY, y));
    this.setNeedsDraw();
  }

  // Content size
  getContentWidth(): number {
    return this.contentWidth;
  }

  setContentWidth(width: number): void {
    this.contentWidth = width;
    this.setScrollX(this.scrollX); // Re-constrain
    this.setNeedsDraw();
  }

  getContentHeight(): number {
    return this.contentHeight;
  }

  setContentHeight(height: number): void {
    this.contentHeight = height;
    this.setScrollY(this.scrollY); // Re-constrain
    this.setNeedsDraw();
  }

  // Scrollbar visibility
  getShowHorizontalScrollbar(): boolean {
    return this.showHorizontalScrollbar;
  }

  setShowHorizontalScrollbar(show: boolean): void {
    this.showHorizontalScrollbar = show;
    this.setNeedsDraw();
  }

  getShowVerticalScrollbar(): boolean {
    return this.showVerticalScrollbar;
  }

  setShowVerticalScrollbar(show: boolean): void {
    this.showVerticalScrollbar = show;
    this.setNeedsDraw();
  }

  // Helper methods
  private getViewportWidth(): number {
    const bounds = this.getBoundsRect();
    let width = RectUtils.width(bounds);
    if (this.showVerticalScrollbar) {
      width -= this.scrollbarWidth;
    }
    return width;
  }

  private getViewportHeight(): number {
    const bounds = this.getBoundsRect();
    let height = RectUtils.height(bounds);
    if (this.showHorizontalScrollbar) {
      height -= this.scrollbarWidth;
    }
    return height;
  }

  private getVerticalThumbBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this.showVerticalScrollbar || this.contentHeight <= this.getViewportHeight()) {
      return null;
    }

    const bounds = this.getBoundsRect();
    const viewportHeight = this.getViewportHeight();
    const scrollbarHeight = viewportHeight;
    const thumbHeight = Math.max(20, (viewportHeight / this.contentHeight) * scrollbarHeight);
    const maxScrollY = this.contentHeight - viewportHeight;
    const thumbY = bounds.top + (this.scrollY / maxScrollY) * (scrollbarHeight - thumbHeight);

    return {
      x: bounds.right - this.scrollbarWidth,
      y: thumbY,
      width: this.scrollbarWidth,
      height: thumbHeight,
    };
  }

  private getHorizontalThumbBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
    if (!this.showHorizontalScrollbar || this.contentWidth <= this.getViewportWidth()) {
      return null;
    }

    const bounds = this.getBoundsRect();
    const viewportWidth = this.getViewportWidth();
    const scrollbarWidth = viewportWidth;
    const thumbWidth = Math.max(20, (viewportWidth / this.contentWidth) * scrollbarWidth);
    const maxScrollX = this.contentWidth - viewportWidth;
    const thumbX = bounds.left + (this.scrollX / maxScrollX) * (scrollbarWidth - thumbWidth);

    return {
      x: thumbX,
      y: bounds.bottom - this.scrollbarWidth,
      width: thumbWidth,
      height: this.scrollbarWidth,
    };
  }

  // Event handlers
  override onMouseDown(x: number, y: number): void {
    // Check vertical scrollbar thumb
    const vThumb = this.getVerticalThumbBounds();
    if (
      vThumb &&
      x >= vThumb.x &&
      x <= vThumb.x + vThumb.width &&
      y >= vThumb.y &&
      y <= vThumb.y + vThumb.height
    ) {
      this.isDraggingVertical = true;
      this.dragStartY = y;
      this.dragStartScrollY = this.scrollY;
      return;
    }

    // Check horizontal scrollbar thumb
    const hThumb = this.getHorizontalThumbBounds();
    if (
      hThumb &&
      x >= hThumb.x &&
      x <= hThumb.x + hThumb.width &&
      y >= hThumb.y &&
      y <= hThumb.y + hThumb.height
    ) {
      this.isDraggingHorizontal = true;
      this.dragStartX = x;
      this.dragStartScrollX = this.scrollX;
      return;
    }

    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    this.isDraggingVertical = false;
    this.isDraggingHorizontal = false;
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    // Handle vertical scrollbar dragging
    if (this.isDraggingVertical) {
      const deltaY = y - this.dragStartY;
      const viewportHeight = this.getViewportHeight();
      const scrollbarHeight = viewportHeight;
      const vThumb = this.getVerticalThumbBounds();
      if (vThumb) {
        const maxScrollY = this.contentHeight - viewportHeight;
        const ratio = deltaY / (scrollbarHeight - vThumb.height);
        this.setScrollY(this.dragStartScrollY + ratio * maxScrollY);
      }
      return;
    }

    // Handle horizontal scrollbar dragging
    if (this.isDraggingHorizontal) {
      const deltaX = x - this.dragStartX;
      const viewportWidth = this.getViewportWidth();
      const scrollbarWidth = viewportWidth;
      const hThumb = this.getHorizontalThumbBounds();
      if (hThumb) {
        const maxScrollX = this.contentWidth - viewportWidth;
        const ratio = deltaX / (scrollbarWidth - hThumb.width);
        this.setScrollX(this.dragStartScrollX + ratio * maxScrollX);
      }
      return;
    }

    // Check hover states
    const vThumb = this.getVerticalThumbBounds();
    const wasVHovering = this.verticalThumbHover;
    this.verticalThumbHover =
      vThumb !== null &&
      x >= vThumb.x &&
      x <= vThumb.x + vThumb.width &&
      y >= vThumb.y &&
      y <= vThumb.y + vThumb.height;

    const hThumb = this.getHorizontalThumbBounds();
    const wasHHovering = this.horizontalThumbHover;
    this.horizontalThumbHover =
      hThumb !== null &&
      x >= hThumb.x &&
      x <= hThumb.x + hThumb.width &&
      y >= hThumb.y &&
      y <= hThumb.y + hThumb.height;

    if (wasVHovering !== this.verticalThumbHover || wasHHovering !== this.horizontalThumbHover) {
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

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    ctx.fillRect(x, y, width, height);

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Draw content (clipped to viewport)
    if (this.content) {
      ctx.save();

      const viewportWidth = this.getViewportWidth();
      const viewportHeight = this.getViewportHeight();

      ctx.beginPath();
      ctx.rect(x, y, viewportWidth, viewportHeight);
      ctx.clip();

      ctx.translate(-this.scrollX, -this.scrollY);
      this.content.render(ctx);

      ctx.restore();
    }

    // Draw vertical scrollbar
    const vThumb = this.getVerticalThumbBounds();
    if (vThumb) {
      // Draw scrollbar track
      ctx.fillStyle = ColorUtils.toCSS(this.scrollbarColor);
      ctx.fillRect(vThumb.x, y, vThumb.width, this.getViewportHeight());

      // Draw thumb
      const thumbColor =
        this.verticalThumbHover || this.isDraggingVertical
          ? this.scrollbarHoverColor
          : this.scrollbarThumbColor;
      ctx.fillStyle = ColorUtils.toCSS(thumbColor);
      ctx.fillRect(vThumb.x, vThumb.y, vThumb.width, vThumb.height);
    }

    // Draw horizontal scrollbar
    const hThumb = this.getHorizontalThumbBounds();
    if (hThumb) {
      // Draw scrollbar track
      ctx.fillStyle = ColorUtils.toCSS(this.scrollbarColor);
      ctx.fillRect(x, hThumb.y, this.getViewportWidth(), hThumb.height);

      // Draw thumb
      const thumbColor =
        this.horizontalThumbHover || this.isDraggingHorizontal
          ? this.scrollbarHoverColor
          : this.scrollbarThumbColor;
      ctx.fillStyle = ColorUtils.toCSS(thumbColor);
      ctx.fillRect(hThumb.x, hThumb.y, hThumb.width, hThumb.height);
    }
  }
}
