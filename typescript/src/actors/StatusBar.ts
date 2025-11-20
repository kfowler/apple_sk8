/**
 * SK8StatusBar - Status bar widget
 *
 * A bottom-aligned information bar with multiple segments,
 * icon support, progress bar integration, and tooltips.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type SegmentAlignment = 'left' | 'center' | 'right';

export interface StatusSegment {
  id: string;
  text: string;
  alignment?: SegmentAlignment;
  icon?: string;
  tooltip?: string;
  width?: number;
  progress?: number; // 0-1 for progress bar
  clickable?: boolean;
}

export class SK8StatusBar extends SK8Actor {
  private segments: StatusSegment[] = [];
  private hoveredSegmentId: string | null = null;
  private showTooltip: boolean = false;
  private tooltipText: string = '';
  private tooltipX: number = 0;
  private tooltipY: number = 0;

  // Visual properties
  private barHeight: number = 24;
  private fontSize: number = 12;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private padding: number = 6;
  private segmentSpacing: number = 1;
  private tooltipPadding: number = 6;

  // Colors
  private backgroundColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private hoverColor: Color = { r: 220, g: 220, b: 220, a: 1.0 };
  private borderColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private separatorColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private progressBackgroundColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private progressFillColor: Color = { r: 0, g: 120, b: 215, a: 1.0 };
  private tooltipBackgroundColor: Color = { r: 255, g: 255, b: 220, a: 1.0 };
  private tooltipBorderColor: Color = { r: 100, g: 100, b: 100, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'StatusBar');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 600, bottom: 24 });

    // Define properties
    this.defineProperty('barHeight', {
      getter: () => this.getBarHeight(),
      setter: (value: number) => this.setBarHeight(value),
    });
  }

  // Bar height
  getBarHeight(): number {
    return this.barHeight;
  }

  setBarHeight(height: number): void {
    this.barHeight = height;
    const bounds = this.getBoundsRect();
    this.setBoundsRect({
      ...bounds,
      bottom: bounds.top + height,
    });
    this.setNeedsDraw();
  }

  // Segments
  getSegments(): StatusSegment[] {
    return [...this.segments];
  }

  setSegments(segments: StatusSegment[]): void {
    this.segments = segments.map((seg) => ({
      ...seg,
      alignment: seg.alignment || 'left',
      clickable: seg.clickable ?? false,
    }));
    this.setNeedsDraw();
  }

  addSegment(segment: StatusSegment): void {
    this.segments.push({
      ...segment,
      alignment: segment.alignment || 'left',
      clickable: segment.clickable ?? false,
    });
    this.setNeedsDraw();
  }

  removeSegment(segmentId: string): void {
    const index = this.segments.findIndex((seg) => seg.id === segmentId);
    if (index >= 0) {
      this.segments.splice(index, 1);
      this.setNeedsDraw();
    }
  }

  updateSegment(segmentId: string, updates: Partial<StatusSegment>): void {
    const segment = this.segments.find((seg) => seg.id === segmentId);
    if (segment) {
      Object.assign(segment, updates);
      this.setNeedsDraw();
    }
  }

  clearSegments(): void {
    this.segments = [];
    this.setNeedsDraw();
  }

  // Helper: Get segment bounds
  private getSegmentBounds(segment: StatusSegment): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null {
    const bounds = this.getBoundsRect();
    const alignment = segment.alignment || 'left';

    // Group segments by alignment
    const leftSegments = this.segments.filter((s) => (s.alignment || 'left') === 'left');
    const centerSegments = this.segments.filter((s) => s.alignment === 'center');
    const rightSegments = this.segments.filter((s) => s.alignment === 'right');

    let x = bounds.left;
    const width = segment.width || 100;

    if (alignment === 'left') {
      const index = leftSegments.indexOf(segment);
      if (index < 0) return null;

      x = bounds.left;
      for (let i = 0; i < index; i++) {
        x += (leftSegments[i].width || 100) + this.segmentSpacing;
      }
    } else if (alignment === 'center') {
      const index = centerSegments.indexOf(segment);
      if (index < 0) return null;

      const totalCenterWidth = centerSegments.reduce(
        (sum, s) => sum + (s.width || 100) + this.segmentSpacing,
        -this.segmentSpacing
      );

      x = bounds.left + (RectUtils.width(bounds) - totalCenterWidth) / 2;
      for (let i = 0; i < index; i++) {
        x += (centerSegments[i].width || 100) + this.segmentSpacing;
      }
    } else {
      // right
      const index = rightSegments.indexOf(segment);
      if (index < 0) return null;

      x = bounds.right;
      for (let i = rightSegments.length - 1; i > index; i--) {
        x -= (rightSegments[i].width || 100) + this.segmentSpacing;
      }
      x -= width;
    }

    return {
      left: x,
      top: bounds.top,
      right: x + width,
      bottom: bounds.bottom,
    };
  }

  // Helper: Get segment at point
  private getSegmentAtPoint(x: number, y: number): StatusSegment | null {
    for (const segment of this.segments) {
      const segBounds = this.getSegmentBounds(segment);
      if (
        segBounds &&
        x >= segBounds.left &&
        x <= segBounds.right &&
        y >= segBounds.top &&
        y <= segBounds.bottom
      ) {
        return segment;
      }
    }
    return null;
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    const segment = this.getSegmentAtPoint(x, y);
    if (segment?.clickable) {
      this.dispatchEvent(
        new SK8CustomEvent('segmentClicked', {
          segmentId: segment.id,
          segment,
        })
      );
    }

    super.onClick(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    const segment = this.getSegmentAtPoint(x, y);
    const newHoverId = segment?.id || null;

    if (this.hoveredSegmentId !== newHoverId) {
      this.hoveredSegmentId = newHoverId;

      // Update tooltip
      if (segment?.tooltip) {
        this.showTooltip = true;
        this.tooltipText = segment.tooltip;
        this.tooltipX = x;
        this.tooltipY = y - 30; // Show above cursor
      } else {
        this.showTooltip = false;
      }

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

    // Draw top border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounds.left, bounds.top);
    ctx.lineTo(bounds.right, bounds.top);
    ctx.stroke();

    // Draw segments
    for (const segment of this.segments) {
      this.drawSegment(ctx, segment);
    }

    // Draw tooltip
    if (this.showTooltip && this.tooltipText) {
      this.drawTooltip(ctx);
    }
  }

  private drawSegment(ctx: CanvasRenderingContext2D, segment: StatusSegment): void {
    const segBounds = this.getSegmentBounds(segment);
    if (!segBounds) return;

    const isHovered = segment.id === this.hoveredSegmentId;

    // Draw hover background
    if (isHovered && segment.clickable) {
      ctx.fillStyle = ColorUtils.toCSS(this.hoverColor);
      ctx.fillRect(
        segBounds.left,
        segBounds.top,
        segBounds.right - segBounds.left,
        segBounds.bottom - segBounds.top
      );
    }

    // Draw separator (except for first segment)
    const index = this.segments.indexOf(segment);
    if (index > 0) {
      ctx.strokeStyle = ColorUtils.toCSS(this.separatorColor);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(segBounds.left - this.segmentSpacing / 2, segBounds.top + 2);
      ctx.lineTo(
        segBounds.left - this.segmentSpacing / 2,
        segBounds.bottom - 2
      );
      ctx.stroke();
    }

    // Draw progress bar if progress is set
    if (segment.progress !== undefined) {
      this.drawProgressBar(ctx, segBounds, segment.progress);
      return;
    }

    // Draw icon
    let textX = segBounds.left + this.padding;
    if (segment.icon) {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ColorUtils.toCSS(this.textColor);
      ctx.fillText(
        segment.icon,
        textX,
        (segBounds.top + segBounds.bottom) / 2
      );
      textX += 20;
    }

    // Draw text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);

    // Truncate text if needed
    const maxTextWidth =
      segBounds.right - textX - this.padding;
    let displayText = segment.text;
    const textWidth = ctx.measureText(displayText).width;

    if (textWidth > maxTextWidth) {
      while (
        ctx.measureText(displayText + '...').width > maxTextWidth &&
        displayText.length > 0
      ) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }

    ctx.fillText(
      displayText,
      textX,
      (segBounds.top + segBounds.bottom) / 2
    );
  }

  private drawProgressBar(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number },
    progress: number
  ): void {
    const barPadding = 4;
    const barHeight = 8;
    const barY = (bounds.top + bounds.bottom - barHeight) / 2;
    const barX = bounds.left + barPadding;
    const barWidth = bounds.right - bounds.left - barPadding * 2;

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.progressBackgroundColor);
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw progress
    const progressWidth = barWidth * Math.max(0, Math.min(1, progress));
    ctx.fillStyle = ColorUtils.toCSS(this.progressFillColor);
    ctx.fillRect(barX, barY, progressWidth, barHeight);

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw percentage text
    const percentText = `${Math.round(progress * 100)}%`;
    ctx.font = `${this.fontSize - 2}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(
      percentText,
      barX + barWidth / 2,
      barY + barHeight / 2
    );
  }

  private drawTooltip(ctx: CanvasRenderingContext2D): void {
    // Measure tooltip text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    const textWidth = ctx.measureText(this.tooltipText).width;
    const tooltipWidth = textWidth + this.tooltipPadding * 2;
    const tooltipHeight = this.fontSize + this.tooltipPadding * 2;

    // Position tooltip
    let x = this.tooltipX - tooltipWidth / 2;
    let y = this.tooltipY;

    // Ensure tooltip stays on screen
    const bounds = this.getBoundsRect();
    if (x < bounds.left) x = bounds.left;
    if (x + tooltipWidth > bounds.right) x = bounds.right - tooltipWidth;
    if (y < bounds.top) y = this.tooltipY + 30; // Show below if no room above

    // Draw tooltip background
    ctx.fillStyle = ColorUtils.toCSS(this.tooltipBackgroundColor);
    ctx.fillRect(x, y, tooltipWidth, tooltipHeight);

    // Draw tooltip border
    ctx.strokeStyle = ColorUtils.toCSS(this.tooltipBorderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, tooltipWidth, tooltipHeight);

    // Draw tooltip text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(
      this.tooltipText,
      x + tooltipWidth / 2,
      y + tooltipHeight / 2
    );
  }
}
