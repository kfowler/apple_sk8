/**
 * SK8Dialog - Modal/modeless dialog window
 *
 * A draggable, resizable dialog window with title bar,
 * close button, OK/Cancel buttons, and z-order management.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type DialogMode = 'modal' | 'modeless';
export type DialogButton = 'ok' | 'cancel' | 'yes' | 'no' | 'close';

export interface DialogButtonConfig {
  type: DialogButton;
  label: string;
  enabled?: boolean;
}

export class SK8Dialog extends SK8Actor {
  private title: string = 'Dialog';
  private mode: DialogMode = 'modal';
  private content: SK8Actor | null = null;
  private buttons: DialogButtonConfig[] = [];
  private closeable: boolean = true;
  private resizable: boolean = true;
  private zIndex: number = 1000;

  // State
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private resizeHandle: string | null = null; // 'se', 'sw', 'ne', 'nw', 's', 'e', 'w', 'n'
  private hoveredButton: string | null = null;
  private hoveredCloseButton: boolean = false;

  // Visual properties
  private titleBarHeight: number = 32;
  private buttonBarHeight: number = 44;
  private buttonWidth: number = 80;
  private buttonHeight: number = 28;
  private buttonSpacing: number = 8;
  private fontSize: number = 13;
  private titleFontSize: number = 14;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private minWidth: number = 200;
  private minHeight: number = 150;
  private resizeHandleSize: number = 10;

  // Colors
  private titleBarColor: Color = { r: 230, g: 230, b: 230, a: 1.0 };
  private contentBackgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private buttonBackgroundColor: Color = { r: 245, g: 245, b: 245, a: 1.0 };
  private buttonHoverColor: Color = { r: 230, g: 230, b: 230, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private borderColor: Color = { r: 160, g: 160, b: 160, a: 1.0 };
  private modalOverlayColor: Color = { r: 0, g: 0, b: 0, a: 0.5 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Dialog');

    // Set default bounds
    this.setBoundsRect({ left: 100, top: 100, right: 400, bottom: 300 });

    // Set default shadow
    this.setShadow({ r: 0, g: 0, b: 0, a: 0.3 }, 8, 2, 2);

    // Define properties
    this.defineProperty('title', {
      getter: () => this.getTitle(),
      setter: (value: string) => this.setTitle(value),
    });

    this.defineProperty('mode', {
      getter: () => this.getMode(),
      setter: (value: DialogMode) => this.setMode(value),
    });

    this.defineProperty('zIndex', {
      getter: () => this.getZIndex(),
      setter: (value: number) => this.setZIndex(value),
    });

    this.defineProperty('closeable', {
      getter: () => this.getCloseable(),
      setter: (value: boolean) => this.setCloseable(value),
    });

    this.defineProperty('resizable', {
      getter: () => this.getResizable(),
      setter: (value: boolean) => this.setResizable(value),
    });

    // Set default buttons
    this.setButtons([
      { type: 'ok', label: 'OK' },
      { type: 'cancel', label: 'Cancel' },
    ]);
  }

  // Title
  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
    this.setNeedsDraw();
  }

  // Mode
  getMode(): DialogMode {
    return this.mode;
  }

  setMode(mode: DialogMode): void {
    this.mode = mode;
    this.setNeedsDraw();
  }

  // Z-index
  getZIndex(): number {
    return this.zIndex;
  }

  setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    this.setNeedsDraw();
  }

  // Closeable
  getCloseable(): boolean {
    return this.closeable;
  }

  setCloseable(closeable: boolean): void {
    this.closeable = closeable;
    this.setNeedsDraw();
  }

  // Resizable
  getResizable(): boolean {
    return this.resizable;
  }

  setResizable(resizable: boolean): void {
    this.resizable = resizable;
    this.setNeedsDraw();
  }

  // Content
  getContent(): SK8Actor | null {
    return this.content;
  }

  setContent(content: SK8Actor | null): void {
    this.content = content;
    this.setNeedsDraw();
  }

  // Buttons
  getButtons(): DialogButtonConfig[] {
    return [...this.buttons];
  }

  setButtons(buttons: DialogButtonConfig[]): void {
    this.buttons = buttons.map((btn) => ({
      ...btn,
      enabled: btn.enabled ?? true,
    }));
    this.setNeedsDraw();
  }

  // Helper: Get title bar bounds
  private getTitleBarBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const bounds = this.getBoundsRect();
    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.top + this.titleBarHeight,
    };
  }

  // Helper: Get close button bounds
  private getCloseButtonBounds(): {
    x: number;
    y: number;
    size: number;
  } {
    const bounds = this.getBoundsRect();
    const size = 16;
    const padding = 8;

    return {
      x: bounds.right - size - padding,
      y: bounds.top + this.titleBarHeight / 2,
      size,
    };
  }

  // Helper: Get content area bounds
  private getContentBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const bounds = this.getBoundsRect();
    return {
      left: bounds.left,
      top: bounds.top + this.titleBarHeight,
      right: bounds.right,
      bottom: bounds.bottom - this.buttonBarHeight,
    };
  }

  // Helper: Get button bar bounds
  private getButtonBarBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const bounds = this.getBoundsRect();
    return {
      left: bounds.left,
      top: bounds.bottom - this.buttonBarHeight,
      right: bounds.right,
      bottom: bounds.bottom,
    };
  }

  // Helper: Get button bounds
  private getButtonBounds(index: number): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null {
    if (index < 0 || index >= this.buttons.length) return null;

    const buttonBar = this.getButtonBarBounds();
    const totalButtonWidth =
      this.buttons.length * this.buttonWidth +
      (this.buttons.length - 1) * this.buttonSpacing;

    const startX = buttonBar.right - totalButtonWidth - this.buttonSpacing;
    const y = buttonBar.top + (this.buttonBarHeight - this.buttonHeight) / 2;

    const x = startX + index * (this.buttonWidth + this.buttonSpacing);

    return {
      left: x,
      top: y,
      right: x + this.buttonWidth,
      bottom: y + this.buttonHeight,
    };
  }

  // Helper: Get resize handle at point
  private getResizeHandleAtPoint(x: number, y: number): string | null {
    if (!this.resizable) return null;

    const bounds = this.getBoundsRect();
    const handleSize = this.resizeHandleSize;

    // Check corners first
    if (
      x >= bounds.right - handleSize &&
      x <= bounds.right &&
      y >= bounds.bottom - handleSize &&
      y <= bounds.bottom
    ) {
      return 'se';
    }
    if (
      x >= bounds.left &&
      x <= bounds.left + handleSize &&
      y >= bounds.bottom - handleSize &&
      y <= bounds.bottom
    ) {
      return 'sw';
    }
    if (
      x >= bounds.right - handleSize &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.top + handleSize
    ) {
      return 'ne';
    }
    if (
      x >= bounds.left &&
      x <= bounds.left + handleSize &&
      y >= bounds.top &&
      y <= bounds.top + handleSize
    ) {
      return 'nw';
    }

    // Check edges
    if (x >= bounds.left && x <= bounds.right && y >= bounds.bottom - handleSize && y <= bounds.bottom) {
      return 's';
    }
    if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.top + handleSize) {
      return 'n';
    }
    if (x >= bounds.right - handleSize && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
      return 'e';
    }
    if (x >= bounds.left && x <= bounds.left + handleSize && y >= bounds.top && y <= bounds.bottom) {
      return 'w';
    }

    return null;
  }

  // Helper: Check if point is on title bar
  private isPointOnTitleBar(x: number, y: number): boolean {
    const titleBar = this.getTitleBarBounds();
    return (
      x >= titleBar.left &&
      x <= titleBar.right &&
      y >= titleBar.top &&
      y <= titleBar.bottom
    );
  }

  // Helper: Check if point is on close button
  private isPointOnCloseButton(x: number, y: number): boolean {
    if (!this.closeable) return false;

    const closeBtn = this.getCloseButtonBounds();
    const dx = x - closeBtn.x;
    const dy = y - closeBtn.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= closeBtn.size / 2;
  }

  // Helper: Get button at point
  private getButtonAtPoint(x: number, y: number): number {
    for (let i = 0; i < this.buttons.length; i++) {
      const btnBounds = this.getButtonBounds(i);
      if (
        btnBounds &&
        x >= btnBounds.left &&
        x <= btnBounds.right &&
        y >= btnBounds.top &&
        y <= btnBounds.bottom
      ) {
        return i;
      }
    }
    return -1;
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    // Check close button
    if (this.isPointOnCloseButton(x, y)) {
      this.close();
      super.onClick(x, y);
      return;
    }

    // Check dialog buttons
    const buttonIndex = this.getButtonAtPoint(x, y);
    if (buttonIndex >= 0) {
      const button = this.buttons[buttonIndex];
      if (button.enabled !== false) {
        this.dispatchEvent(
          new SK8CustomEvent('buttonClicked', {
            button: button.type,
            buttonIndex,
          })
        );

        // Auto-close on OK/Cancel unless prevented
        if (button.type === 'ok' || button.type === 'cancel') {
          this.close();
        }
      }
      super.onClick(x, y);
      return;
    }

    super.onClick(x, y);
  }

  override onMouseDown(x: number, y: number): void {
    // Check for resize handle
    const handle = this.getResizeHandleAtPoint(x, y);
    if (handle) {
      this.isResizing = true;
      this.resizeHandle = handle;
      this.dragStartX = x;
      this.dragStartY = y;
      super.onMouseDown(x, y);
      return;
    }

    // Check for title bar drag
    if (this.isPointOnTitleBar(x, y) && !this.isPointOnCloseButton(x, y)) {
      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartY = y;
      super.onMouseDown(x, y);
      return;
    }

    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    // Handle dragging
    if (this.isDragging) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      this.moveBy(dx, dy);
      this.dragStartX = x;
      this.dragStartY = y;
      super.onMouseMove(x, y);
      return;
    }

    // Handle resizing
    if (this.isResizing && this.resizeHandle) {
      const bounds = this.getBoundsRect();
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      const newBounds = { ...bounds };

      switch (this.resizeHandle) {
        case 'se':
          newBounds.right = Math.max(bounds.left + this.minWidth, bounds.right + dx);
          newBounds.bottom = Math.max(bounds.top + this.minHeight, bounds.bottom + dy);
          break;
        case 'sw':
          newBounds.left = Math.min(bounds.right - this.minWidth, bounds.left + dx);
          newBounds.bottom = Math.max(bounds.top + this.minHeight, bounds.bottom + dy);
          break;
        case 'ne':
          newBounds.right = Math.max(bounds.left + this.minWidth, bounds.right + dx);
          newBounds.top = Math.min(bounds.bottom - this.minHeight, bounds.top + dy);
          break;
        case 'nw':
          newBounds.left = Math.min(bounds.right - this.minWidth, bounds.left + dx);
          newBounds.top = Math.min(bounds.bottom - this.minHeight, bounds.top + dy);
          break;
        case 's':
          newBounds.bottom = Math.max(bounds.top + this.minHeight, bounds.bottom + dy);
          break;
        case 'n':
          newBounds.top = Math.min(bounds.bottom - this.minHeight, bounds.top + dy);
          break;
        case 'e':
          newBounds.right = Math.max(bounds.left + this.minWidth, bounds.right + dx);
          break;
        case 'w':
          newBounds.left = Math.min(bounds.right - this.minWidth, bounds.left + dx);
          break;
      }

      this.setBoundsRect(newBounds);
      this.dragStartX = x;
      this.dragStartY = y;
      super.onMouseMove(x, y);
      return;
    }

    // Update hover state
    const wasHoveringClose = this.hoveredCloseButton;
    this.hoveredCloseButton = this.isPointOnCloseButton(x, y);

    const buttonIndex = this.getButtonAtPoint(x, y);
    const newHoveredButton = buttonIndex >= 0 ? this.buttons[buttonIndex].type : null;

    if (
      wasHoveringClose !== this.hoveredCloseButton ||
      this.hoveredButton !== newHoveredButton
    ) {
      this.hoveredButton = newHoveredButton;
      this.setNeedsDraw();
    }

    super.onMouseMove(x, y);
  }

  // Public methods
  close(): void {
    this.setVisible(false);
    this.dispatchEvent(new SK8CustomEvent('dialogClosed', {}));
  }

  show(): void {
    this.setVisible(true);
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    // Draw modal overlay if modal
    if (this.mode === 'modal') {
      // This would typically cover the entire stage
      // For now, we'll just draw a semi-transparent rectangle
      ctx.fillStyle = ColorUtils.toCSS(this.modalOverlayColor);
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const bounds = this.getBoundsRect();

    // Apply shadow
    this.applyVisualEffects(ctx);

    // Draw main background
    ctx.fillStyle = ColorUtils.toCSS(this.contentBackgroundColor);
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

    // Clear shadow for inner content
    this.clearVisualEffects(ctx);

    // Draw title bar
    this.drawTitleBar(ctx);

    // Draw content
    this.drawContent(ctx);

    // Draw button bar
    this.drawButtonBar(ctx);
  }

  private drawTitleBar(ctx: CanvasRenderingContext2D): void {
    const titleBar = this.getTitleBarBounds();

    // Draw title bar background
    ctx.fillStyle = ColorUtils.toCSS(this.titleBarColor);
    ctx.fillRect(
      titleBar.left,
      titleBar.top,
      titleBar.right - titleBar.left,
      titleBar.bottom - titleBar.top
    );

    // Draw title bar border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(titleBar.left, titleBar.bottom);
    ctx.lineTo(titleBar.right, titleBar.bottom);
    ctx.stroke();

    // Draw title
    ctx.font = `bold ${this.titleFontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(this.title, titleBar.left + 12, (titleBar.top + titleBar.bottom) / 2);

    // Draw close button
    if (this.closeable) {
      const closeBtn = this.getCloseButtonBounds();

      // Draw circle
      ctx.beginPath();
      ctx.arc(closeBtn.x, closeBtn.y, closeBtn.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.hoveredCloseButton
        ? ColorUtils.toCSS({ r: 220, g: 220, b: 220, a: 1.0 })
        : ColorUtils.toCSS({ r: 240, g: 240, b: 240, a: 1.0 });
      ctx.fill();
      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.stroke();

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

  private drawContent(ctx: CanvasRenderingContext2D): void {
    const contentBounds = this.getContentBounds();

    // Draw content background
    ctx.fillStyle = ColorUtils.toCSS(this.contentBackgroundColor);
    ctx.fillRect(
      contentBounds.left,
      contentBounds.top,
      contentBounds.right - contentBounds.left,
      contentBounds.bottom - contentBounds.top
    );

    // Draw content actor if present
    if (this.content) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        contentBounds.left,
        contentBounds.top,
        contentBounds.right - contentBounds.left,
        contentBounds.bottom - contentBounds.top
      );
      ctx.clip();
      this.content.render(ctx);
      ctx.restore();
    }
  }

  private drawButtonBar(ctx: CanvasRenderingContext2D): void {
    const buttonBar = this.getButtonBarBounds();

    // Draw button bar background
    ctx.fillStyle = ColorUtils.toCSS(this.buttonBackgroundColor);
    ctx.fillRect(
      buttonBar.left,
      buttonBar.top,
      buttonBar.right - buttonBar.left,
      buttonBar.bottom - buttonBar.top
    );

    // Draw button bar border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(buttonBar.left, buttonBar.top);
    ctx.lineTo(buttonBar.right, buttonBar.top);
    ctx.stroke();

    // Draw buttons
    for (let i = 0; i < this.buttons.length; i++) {
      this.drawButton(ctx, i);
    }
  }

  private drawButton(ctx: CanvasRenderingContext2D, index: number): void {
    const button = this.buttons[index];
    const btnBounds = this.getButtonBounds(index);
    if (!btnBounds) return;

    const isHovered = this.hoveredButton === button.type;
    const isEnabled = button.enabled !== false;

    // Draw button background
    if (!isEnabled) {
      ctx.fillStyle = ColorUtils.toCSS({ r: 250, g: 250, b: 250, a: 1.0 });
    } else if (isHovered) {
      ctx.fillStyle = ColorUtils.toCSS(this.buttonHoverColor);
    } else {
      ctx.fillStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1.0 });
    }

    ctx.fillRect(
      btnBounds.left,
      btnBounds.top,
      btnBounds.right - btnBounds.left,
      btnBounds.bottom - btnBounds.top
    );

    // Draw button border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      btnBounds.left,
      btnBounds.top,
      btnBounds.right - btnBounds.left,
      btnBounds.bottom - btnBounds.top
    );

    // Draw button label
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(
      isEnabled ? this.textColor : { r: 150, g: 150, b: 150, a: 1.0 }
    );
    ctx.fillText(
      button.label,
      (btnBounds.left + btnBounds.right) / 2,
      (btnBounds.top + btnBounds.bottom) / 2
    );
  }
}
