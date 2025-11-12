/**
 * SK8EditText - Interactive text input widget
 *
 * A text input field with keyboard support, cursor, and selection
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';

export class SK8EditText extends SK8Actor {
  private text: string = '';
  private placeholder: string = 'Enter text...';
  private readonly: boolean = false;
  private maxLength: number = -1; // -1 means no limit
  private cursorPosition: number = 0;
  private selectionStart: number = -1;
  private selectionEnd: number = -1;
  private focused: boolean = false;
  private cursorVisible: boolean = true;

  // Visual properties
  private fontSize: number = 14;
  private fontFamily: string = 'Geneva, Monaco, monospace';
  private padding: number = 8;
  private cornerRadius: number = 4;

  // Colors
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private borderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private focusBorderColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private placeholderColor: Color = { r: 160, g: 160, b: 160, a: 1.0 };
  private cursorColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private selectionColor: Color = { r: 0, g: 120, b: 215, a: 0.3 };
  private disabledBackground: Color = { r: 245, g: 245, b: 245, a: 1.0 };
  private disabledText: Color = { r: 160, g: 160, b: 160, a: 1.0 };

  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'EditText');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 200, bottom: 30 });

    // Define properties
    this.defineProperty('text', {
      getter: () => this.getText(),
      setter: (value: string) => this.setText(value),
    });

    this.defineProperty('placeholder', {
      getter: () => this.getPlaceholder(),
      setter: (value: string) => this.setPlaceholder(value),
    });

    this.defineProperty('readonly', {
      getter: () => this.getReadonly(),
      setter: (value: boolean) => this.setReadonly(value),
    });

    this.defineProperty('maxLength', {
      getter: () => this.getMaxLength(),
      setter: (value: number) => this.setMaxLength(value),
    });

    this.defineProperty('focused', {
      getter: () => this.getFocused(),
      setter: (value: boolean) => this.setFocused(value),
    });

    // Start cursor blink timer
    this.startCursorBlink();
  }

  // Text
  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    if (this.maxLength >= 0) {
      text = text.substring(0, this.maxLength);
    }
    this.text = text;
    this.cursorPosition = Math.min(this.cursorPosition, text.length);
    this.clearSelection();
    this.setNeedsDraw();
    if (this.hasHandler('change')) {
      this.callHandler('change', text);
    }
  }

  // Placeholder
  getPlaceholder(): string {
    return this.placeholder;
  }

  setPlaceholder(placeholder: string): void {
    this.placeholder = placeholder;
    this.setNeedsDraw();
  }

  // Readonly
  getReadonly(): boolean {
    return this.readonly;
  }

  setReadonly(readonly: boolean): void {
    this.readonly = readonly;
    this.setNeedsDraw();
  }

  // Max length
  getMaxLength(): number {
    return this.maxLength;
  }

  setMaxLength(length: number): void {
    this.maxLength = length;
    if (length >= 0 && this.text.length > length) {
      this.setText(this.text.substring(0, length));
    }
  }

  // Focus
  getFocused(): boolean {
    return this.focused;
  }

  setFocused(focused: boolean): void {
    if (this.focused !== focused) {
      this.focused = focused;
      if (focused) {
        this.attachKeyboardHandler();
      } else {
        this.detachKeyboardHandler();
        this.clearSelection();
      }
      this.setNeedsDraw();
    }
  }

  // Cursor and selection
  private clearSelection(): void {
    this.selectionStart = -1;
    this.selectionEnd = -1;
  }

  private hasSelection(): boolean {
    return this.selectionStart >= 0 && this.selectionEnd >= 0 && this.selectionStart !== this.selectionEnd;
  }

  private deleteSelection(): void {
    if (this.hasSelection()) {
      const start = Math.min(this.selectionStart, this.selectionEnd);
      const end = Math.max(this.selectionStart, this.selectionEnd);
      this.text = this.text.substring(0, start) + this.text.substring(end);
      this.cursorPosition = start;
      this.clearSelection();
      this.setNeedsDraw();
    }
  }

  // Cursor blink
  private startCursorBlink(): void {
    setInterval(() => {
      if (this.focused) {
        this.cursorVisible = !this.cursorVisible;
        this.setNeedsDraw();
      }
    }, 500);
  }

  // Keyboard handling
  private attachKeyboardHandler(): void {
    if (this.keyboardHandler) return;

    this.keyboardHandler = (e: KeyboardEvent) => {
      if (!this.focused || this.readonly) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (this.hasSelection()) {
          this.deleteSelection();
        } else if (this.cursorPosition > 0) {
          this.text = this.text.substring(0, this.cursorPosition - 1) + this.text.substring(this.cursorPosition);
          this.cursorPosition--;
          this.setNeedsDraw();
          if (this.hasHandler('change')) {
            this.callHandler('change', this.text);
          }
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (this.hasSelection()) {
          this.deleteSelection();
        } else if (this.cursorPosition < this.text.length) {
          this.text = this.text.substring(0, this.cursorPosition) + this.text.substring(this.cursorPosition + 1);
          this.setNeedsDraw();
          if (this.hasHandler('change')) {
            this.callHandler('change', this.text);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (this.cursorPosition > 0) {
          this.cursorPosition--;
          this.clearSelection();
          this.cursorVisible = true;
          this.setNeedsDraw();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (this.cursorPosition < this.text.length) {
          this.cursorPosition++;
          this.clearSelection();
          this.cursorVisible = true;
          this.setNeedsDraw();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.cursorPosition = 0;
        this.clearSelection();
        this.cursorVisible = true;
        this.setNeedsDraw();
      } else if (e.key === 'End') {
        e.preventDefault();
        this.cursorPosition = this.text.length;
        this.clearSelection();
        this.cursorVisible = true;
        this.setNeedsDraw();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.hasHandler('enter')) {
          this.callHandler('enter', this.text);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Regular character
        e.preventDefault();
        if (this.hasSelection()) {
          this.deleteSelection();
        }
        if (this.maxLength < 0 || this.text.length < this.maxLength) {
          this.text = this.text.substring(0, this.cursorPosition) + e.key + this.text.substring(this.cursorPosition);
          this.cursorPosition++;
          this.cursorVisible = true;
          this.setNeedsDraw();
          if (this.hasHandler('change')) {
            this.callHandler('change', this.text);
          }
        }
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  private detachKeyboardHandler(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    if (!this.readonly) {
      this.setFocused(true);

      // Position cursor based on click position
      const bounds = this.getBoundsRect();
      const textX = bounds.left + this.padding;
      const clickX = x - textX;

      // Measure text to find cursor position
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;

      let bestPos = 0;
      let bestDist = Math.abs(clickX);

      for (let i = 0; i <= this.text.length; i++) {
        const width = ctx.measureText(this.text.substring(0, i)).width;
        const dist = Math.abs(clickX - width);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = i;
        }
      }

      this.cursorPosition = bestPos;
      this.clearSelection();
      this.cursorVisible = true;
      this.setNeedsDraw();
    }

    super.onClick(x, y);
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

    // Draw background
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

    const bgColor = this.readonly ? this.disabledBackground : this.backgroundColor;
    ctx.fillStyle = ColorUtils.toCSS(bgColor);
    ctx.fill();

    // Draw border
    const borderColor = this.focused ? this.focusBorderColor : this.borderColor;
    ctx.strokeStyle = ColorUtils.toCSS(borderColor);
    ctx.lineWidth = this.focused ? 2 : 1;
    ctx.stroke();

    // Set up text rendering
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'middle';

    const textX = x + this.padding;
    const textY = y + height / 2;

    // Draw selection
    if (this.hasSelection()) {
      const start = Math.min(this.selectionStart, this.selectionEnd);
      const end = Math.max(this.selectionStart, this.selectionEnd);
      const beforeText = this.text.substring(0, start);
      const selectedText = this.text.substring(start, end);
      const beforeWidth = ctx.measureText(beforeText).width;
      const selectedWidth = ctx.measureText(selectedText).width;

      ctx.fillStyle = ColorUtils.toCSS(this.selectionColor);
      ctx.fillRect(textX + beforeWidth, y + 2, selectedWidth, height - 4);
    }

    // Draw text or placeholder
    if (this.text.length > 0) {
      ctx.fillStyle = ColorUtils.toCSS(this.readonly ? this.disabledText : this.textColor);
      ctx.fillText(this.text, textX, textY);
    } else if (!this.focused) {
      ctx.fillStyle = ColorUtils.toCSS(this.placeholderColor);
      ctx.fillText(this.placeholder, textX, textY);
    }

    // Draw cursor
    if (this.focused && this.cursorVisible && !this.readonly) {
      const beforeCursor = this.text.substring(0, this.cursorPosition);
      const cursorX = textX + ctx.measureText(beforeCursor).width;

      ctx.strokeStyle = ColorUtils.toCSS(this.cursorColor);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, y + 4);
      ctx.lineTo(cursorX, y + height - 4);
      ctx.stroke();
    }
  }

  // Cleanup
  destroy(): void {
    this.detachKeyboardHandler();
  }
}
