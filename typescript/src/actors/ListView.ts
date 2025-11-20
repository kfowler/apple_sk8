/**
 * SK8ListView - Multi-column list widget
 *
 * A scrollable list view with columns, sorting, selection,
 * and virtual rendering for large datasets.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type SelectionMode = 'single' | 'multi' | 'none';
export type SortDirection = 'asc' | 'desc' | 'none';

export interface Column {
  label: string;
  key: string;
  width: number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  renderer?: (value: any, item: any) => string;
}

export interface ListItem {
  id?: string;
  [key: string]: any;
}

export class SK8ListView extends SK8Actor {
  private columns: Column[] = [];
  private items: ListItem[] = [];
  private displayedItems: ListItem[] = [];
  private selectedIds: Set<string> = new Set();
  private selectionMode: SelectionMode = 'single';
  private sortColumn: string | null = null;
  private sortDirection: SortDirection = 'none';
  private hoveredItemId: string | null = null;
  private hoveredColumnIndex: number = -1;

  // Visual properties
  private headerHeight: number = 28;
  private rowHeight: number = 24;
  private fontSize: number = 13;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private scrollOffset: number = 0;
  private scrollbarWidth: number = 12;

  // Colors
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private headerBackgroundColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private selectedColor: Color = { r: 0, g: 120, b: 215, a: 0.3 };
  private hoverColor: Color = { r: 0, g: 120, b: 215, a: 0.1 };
  private alternateRowColor: Color = { r: 248, g: 248, b: 248, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private headerTextColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private borderColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private scrollbarColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'ListView');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 400, bottom: 300 });

    // Define properties
    this.defineProperty('selectionMode', {
      getter: () => this.getSelectionMode(),
      setter: (value: SelectionMode) => this.setSelectionMode(value),
    });

    this.defineProperty('rowHeight', {
      getter: () => this.getRowHeight(),
      setter: (value: number) => this.setRowHeight(value),
    });

    this.defineProperty('scrollOffset', {
      getter: () => this.getScrollOffset(),
      setter: (value: number) => this.setScrollOffset(value),
    });
  }

  // Columns
  getColumns(): Column[] {
    return [...this.columns];
  }

  setColumns(columns: Column[]): void {
    this.columns = columns.map((col) => ({
      ...col,
      sortable: col.sortable ?? true,
      align: col.align || 'left',
    }));
    this.setNeedsDraw();
  }

  addColumn(column: Column): void {
    this.columns.push({
      ...column,
      sortable: column.sortable ?? true,
      align: column.align || 'left',
    });
    this.setNeedsDraw();
  }

  // Items
  getItems(): ListItem[] {
    return [...this.items];
  }

  setItems(items: ListItem[]): void {
    this.items = items.map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${Date.now()}`,
    }));
    this.updateDisplayedItems();
    this.setNeedsDraw();
  }

  addItem(item: ListItem): void {
    this.items.push({
      ...item,
      id: item.id || `item-${this.items.length}-${Date.now()}`,
    });
    this.updateDisplayedItems();
    this.setNeedsDraw();
  }

  removeItem(itemId: string): void {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index >= 0) {
      this.items.splice(index, 1);
      this.selectedIds.delete(itemId);
      this.updateDisplayedItems();
      this.setNeedsDraw();
    }
  }

  clearItems(): void {
    this.items = [];
    this.displayedItems = [];
    this.selectedIds.clear();
    this.setNeedsDraw();
  }

  // Selection
  getSelectionMode(): SelectionMode {
    return this.selectionMode;
  }

  setSelectionMode(mode: SelectionMode): void {
    this.selectionMode = mode;
    if (mode === 'none') {
      this.selectedIds.clear();
    } else if (mode === 'single' && this.selectedIds.size > 1) {
      const first = Array.from(this.selectedIds)[0];
      this.selectedIds.clear();
      this.selectedIds.add(first);
    }
    this.setNeedsDraw();
  }

  getSelectedItemIds(): string[] {
    return Array.from(this.selectedIds);
  }

  getSelectedItems(): ListItem[] {
    return this.displayedItems.filter((item) => item.id && this.selectedIds.has(item.id));
  }

  selectItem(itemId: string, addToSelection: boolean = false): void {
    if (this.selectionMode === 'none') return;

    const wasSelected = this.selectedIds.has(itemId);

    if (this.selectionMode === 'single' || !addToSelection) {
      this.selectedIds.clear();
    }

    if (!wasSelected) {
      this.selectedIds.add(itemId);
    }

    this.setNeedsDraw();

    // Dispatch itemSelected event
    const item = this.displayedItems.find((i) => i.id === itemId);
    if (item) {
      this.dispatchEvent(
        new SK8CustomEvent('itemSelected', {
          itemId,
          item,
          selected: Array.from(this.selectedIds),
        })
      );
    }
  }

  deselectItem(itemId: string): void {
    if (this.selectedIds.has(itemId)) {
      this.selectedIds.delete(itemId);
      this.setNeedsDraw();
    }
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.setNeedsDraw();
  }

  // Sorting
  sortBy(columnKey: string, direction?: SortDirection): void {
    const column = this.columns.find((col) => col.key === columnKey);
    if (!column || column.sortable === false) return;

    // Toggle direction if not specified
    if (!direction) {
      if (this.sortColumn === columnKey) {
        if (this.sortDirection === 'asc') {
          direction = 'desc';
        } else if (this.sortDirection === 'desc') {
          direction = 'none';
        } else {
          direction = 'asc';
        }
      } else {
        direction = 'asc';
      }
    }

    this.sortColumn = direction === 'none' ? null : columnKey;
    this.sortDirection = direction;

    this.updateDisplayedItems();
    this.setNeedsDraw();

    // Dispatch sortChanged event
    this.dispatchEvent(
      new SK8CustomEvent('sortChanged', {
        column: columnKey,
        direction,
      })
    );
  }

  private updateDisplayedItems(): void {
    this.displayedItems = [...this.items];

    // Apply sorting
    if (this.sortColumn && this.sortDirection !== 'none') {
      const column = this.columns.find((col) => col.key === this.sortColumn);
      if (column) {
        this.displayedItems.sort((a, b) => {
          const aVal = a[column.key];
          const bVal = b[column.key];

          let comparison = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          } else {
            comparison = String(aVal).localeCompare(String(bVal));
          }

          return this.sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }
  }

  // Scrolling
  getScrollOffset(): number {
    return this.scrollOffset;
  }

  setScrollOffset(offset: number): void {
    const maxScroll = Math.max(0, this.getTotalContentHeight() - this.getContentHeight());
    this.scrollOffset = Math.max(0, Math.min(offset, maxScroll));
    this.setNeedsDraw();
  }

  getRowHeight(): number {
    return this.rowHeight;
  }

  setRowHeight(height: number): void {
    this.rowHeight = height;
    this.setNeedsDraw();
  }

  private getTotalContentHeight(): number {
    return this.displayedItems.length * this.rowHeight;
  }

  private getContentHeight(): number {
    return this.getHeight() - this.headerHeight;
  }

  // Helper: Get item at point
  private getItemAtPoint(x: number, y: number): ListItem | null {
    const bounds = this.getBoundsRect();
    if (
      x < bounds.left ||
      x > bounds.right - this.scrollbarWidth ||
      y < bounds.top + this.headerHeight ||
      y > bounds.bottom
    ) {
      return null;
    }

    const relativeY = y - bounds.top - this.headerHeight + this.scrollOffset;
    const itemIndex = Math.floor(relativeY / this.rowHeight);

    if (itemIndex >= 0 && itemIndex < this.displayedItems.length) {
      return this.displayedItems[itemIndex];
    }

    return null;
  }

  // Helper: Get column at point
  private getColumnAtPoint(x: number): number {
    const bounds = this.getBoundsRect();
    let currentX = bounds.left;

    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      if (x >= currentX && x < currentX + col.width) {
        return i;
      }
      currentX += col.width;
    }

    return -1;
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    const bounds = this.getBoundsRect();

    // Check if clicking header
    if (y >= bounds.top && y < bounds.top + this.headerHeight) {
      const columnIndex = this.getColumnAtPoint(x);
      if (columnIndex >= 0) {
        const column = this.columns[columnIndex];
        if (column.sortable !== false) {
          this.sortBy(column.key);
        }
      }
      super.onClick(x, y);
      return;
    }

    // Check if clicking item
    const item = this.getItemAtPoint(x, y);
    if (item?.id && this.selectionMode !== 'none') {
      this.selectItem(item.id, this.selectionMode === 'multi');
    }

    super.onClick(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    const bounds = this.getBoundsRect();

    // Update hovered column
    if (y >= bounds.top && y < bounds.top + this.headerHeight) {
      const columnIndex = this.getColumnAtPoint(x);
      if (this.hoveredColumnIndex !== columnIndex) {
        this.hoveredColumnIndex = columnIndex;
        this.setNeedsDraw();
      }
    } else {
      if (this.hoveredColumnIndex !== -1) {
        this.hoveredColumnIndex = -1;
        this.setNeedsDraw();
      }
    }

    // Update hovered item
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

    // Draw header
    this.drawHeader(ctx);

    // Clip to content area
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      bounds.left,
      bounds.top + this.headerHeight,
      RectUtils.width(bounds) - this.scrollbarWidth,
      this.getContentHeight()
    );
    ctx.clip();

    // Draw items (virtual rendering)
    this.drawItems(ctx);

    ctx.restore();

    // Draw scrollbar
    this.drawScrollbar(ctx);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();
    let currentX = bounds.left;

    // Draw header background
    ctx.fillStyle = ColorUtils.toCSS(this.headerBackgroundColor);
    ctx.fillRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      this.headerHeight
    );

    // Draw columns
    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      const isHovered = i === this.hoveredColumnIndex;
      const isSorted = col.key === this.sortColumn;

      // Draw hover background
      if (isHovered && col.sortable !== false) {
        ctx.fillStyle = ColorUtils.toCSS(this.hoverColor);
        ctx.fillRect(currentX, bounds.top, col.width, this.headerHeight);
      }

      // Draw column label
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = ColorUtils.toCSS(this.headerTextColor);
      ctx.textBaseline = 'middle';

      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(
          col.label,
          currentX + col.width / 2,
          bounds.top + this.headerHeight / 2
        );
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(
          col.label,
          currentX + col.width - 10,
          bounds.top + this.headerHeight / 2
        );
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(
          col.label,
          currentX + 8,
          bounds.top + this.headerHeight / 2
        );
      }

      // Draw sort indicator
      if (isSorted && this.sortDirection !== 'none') {
        const arrowX = currentX + col.width - 15;
        const arrowY = bounds.top + this.headerHeight / 2;
        const arrowSize = 4;

        ctx.fillStyle = ColorUtils.toCSS(this.headerTextColor);
        ctx.beginPath();

        if (this.sortDirection === 'asc') {
          // Up arrow
          ctx.moveTo(arrowX, arrowY + arrowSize / 2);
          ctx.lineTo(arrowX - arrowSize, arrowY - arrowSize / 2);
          ctx.lineTo(arrowX + arrowSize, arrowY - arrowSize / 2);
        } else {
          // Down arrow
          ctx.moveTo(arrowX, arrowY - arrowSize / 2);
          ctx.lineTo(arrowX - arrowSize, arrowY + arrowSize / 2);
          ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize / 2);
        }

        ctx.closePath();
        ctx.fill();
      }

      // Draw column separator
      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(currentX + col.width, bounds.top);
      ctx.lineTo(currentX + col.width, bounds.top + this.headerHeight);
      ctx.stroke();

      currentX += col.width;
    }

    // Draw header bottom border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounds.left, bounds.top + this.headerHeight);
    ctx.lineTo(bounds.right, bounds.top + this.headerHeight);
    ctx.stroke();
  }

  private drawItems(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();
    const contentHeight = this.getContentHeight();

    // Calculate visible range (virtual rendering)
    const firstVisibleIndex = Math.floor(this.scrollOffset / this.rowHeight);
    const lastVisibleIndex = Math.min(
      this.displayedItems.length - 1,
      Math.ceil((this.scrollOffset + contentHeight) / this.rowHeight)
    );

    // Draw visible items
    for (let i = firstVisibleIndex; i <= lastVisibleIndex; i++) {
      const item = this.displayedItems[i];
      const y = bounds.top + this.headerHeight + i * this.rowHeight - this.scrollOffset;

      this.drawItem(ctx, item, i, y);
    }
  }

  private drawItem(ctx: CanvasRenderingContext2D, item: ListItem, index: number, y: number): void {
    const bounds = this.getBoundsRect();
    const isSelected = item.id ? this.selectedIds.has(item.id) : false;
    const isHovered = item.id === this.hoveredItemId;

    // Draw row background
    if (isSelected) {
      ctx.fillStyle = ColorUtils.toCSS(this.selectedColor);
      ctx.fillRect(bounds.left, y, RectUtils.width(bounds), this.rowHeight);
    } else if (isHovered) {
      ctx.fillStyle = ColorUtils.toCSS(this.hoverColor);
      ctx.fillRect(bounds.left, y, RectUtils.width(bounds), this.rowHeight);
    } else if (index % 2 === 1) {
      ctx.fillStyle = ColorUtils.toCSS(this.alternateRowColor);
      ctx.fillRect(bounds.left, y, RectUtils.width(bounds), this.rowHeight);
    }

    // Draw cells
    let currentX = bounds.left;
    for (const col of this.columns) {
      const value = item[col.key];
      const displayValue = col.renderer ? col.renderer(value, item) : String(value || '');

      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = ColorUtils.toCSS(this.textColor);
      ctx.textBaseline = 'middle';

      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(displayValue, currentX + col.width / 2, y + this.rowHeight / 2);
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(displayValue, currentX + col.width - 10, y + this.rowHeight / 2);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(displayValue, currentX + 8, y + this.rowHeight / 2);
      }

      // Draw cell separator
      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(currentX + col.width, y);
      ctx.lineTo(currentX + col.width, y + this.rowHeight);
      ctx.stroke();

      currentX += col.width;
    }
  }

  private drawScrollbar(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();
    const contentHeight = this.getContentHeight();
    const totalHeight = this.getTotalContentHeight();

    if (totalHeight <= contentHeight) return; // No scrollbar needed

    const scrollbarX = bounds.right - this.scrollbarWidth;
    const scrollbarY = bounds.top + this.headerHeight;
    const scrollbarHeight = contentHeight;

    // Draw scrollbar track
    ctx.fillStyle = ColorUtils.toCSS({ r: 240, g: 240, b: 240, a: 1.0 });
    ctx.fillRect(scrollbarX, scrollbarY, this.scrollbarWidth, scrollbarHeight);

    // Draw scrollbar thumb
    const thumbHeight = Math.max(20, (contentHeight / totalHeight) * scrollbarHeight);
    const thumbY = scrollbarY + (this.scrollOffset / totalHeight) * scrollbarHeight;

    ctx.fillStyle = ColorUtils.toCSS(this.scrollbarColor);
    ctx.fillRect(scrollbarX + 2, thumbY, this.scrollbarWidth - 4, thumbHeight);
  }
}
