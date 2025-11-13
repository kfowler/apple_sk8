/**
 * Graphics types and utilities for SK8
 */

/**
 * Rectangle (like QuickDraw Rect)
 */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Point (like QuickDraw Point)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Color (RGB or named)
 */
export type Color = string | { r: number; g: number; b: number; a?: number };

/**
 * Type guard to check if a value is a Color
 */
export function isColor(value: unknown): value is Color {
  if (typeof value === 'string') return true;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.r === 'number' &&
      typeof obj.g === 'number' &&
      typeof obj.b === 'number' &&
      (obj.a === undefined || typeof obj.a === 'number')
    );
  }
  return false;
}

/**
 * Helper functions for rectangles
 */
export class RectUtils {
  static create(left: number, top: number, right: number, bottom: number): Rect {
    return { left, top, right, bottom };
  }

  static fromXYWH(x: number, y: number, width: number, height: number): Rect {
    return {
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
    };
  }

  static width(rect: Rect): number {
    return rect.right - rect.left;
  }

  static height(rect: Rect): number {
    return rect.bottom - rect.top;
  }

  static centerX(rect: Rect): number {
    return rect.left + RectUtils.width(rect) / 2;
  }

  static centerY(rect: Rect): number {
    return rect.top + RectUtils.height(rect) / 2;
  }

  static contains(rect: Rect, x: number, y: number): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  static intersects(a: Rect, b: Rect): boolean {
    return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
  }

  static union(a: Rect, b: Rect): Rect {
    return {
      left: Math.min(a.left, b.left),
      top: Math.min(a.top, b.top),
      right: Math.max(a.right, b.right),
      bottom: Math.max(a.bottom, b.bottom),
    };
  }

  static isEmpty(rect: Rect): boolean {
    return rect.right <= rect.left || rect.bottom <= rect.top;
  }

  static equals(a: Rect, b: Rect): boolean {
    return a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;
  }
}

/**
 * Helper functions for colors
 */
export class ColorUtils {
  static toCSS(color: Color): string {
    if (typeof color === 'string') {
      return color;
    }
    const { r, g, b, a = 1 } = color;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  static fromRGB(r: number, g: number, b: number, a: number = 1): Color {
    return { r, g, b, a };
  }

  static toHex(color: Color): string {
    if (typeof color === 'string') {
      return color;
    }
    const { r, g, b } = color;
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  static fromHex(hex: string): Color {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b, a: 1 };
  }

  // Named colors (like SK8's color constants)
  static readonly Black = 'black';
  static readonly White = 'white';
  static readonly Red = 'red';
  static readonly Green = 'green';
  static readonly Blue = 'blue';
  static readonly Yellow = 'yellow';
  static readonly Cyan = 'cyan';
  static readonly Magenta = 'magenta';
  static readonly Gray = 'gray';
  static readonly LightGray = 'lightgray';
  static readonly DarkGray = 'darkgray';
}

/**
 * Transfer modes (like QuickDraw modes)
 */
export enum TransferMode {
  Copy = 'source-over',
  Or = 'lighter',
  Xor = 'xor',
  Blend = 'multiply',
  Transparent = 'destination-over',
}
