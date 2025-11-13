/**
 * SK8SelectionHandles - Visual selection and manipulation handles
 *
 * Features:
 * - Visual selection box around selected actors
 * - 8 resize handles (corners + midpoints)
 * - Rotation handle
 * - Drag to move, drag handles to resize
 * - Maintain aspect ratio (shift key)
 * - Snap to grid (optional)
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { SK8Editor, ResizeActorCommand } from './editor.js';
import { Rect, RectUtils, ColorUtils } from '../graphics/types.js';

/**
 * Handle types
 */
export type HandleType =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'rotate';

/**
 * Handle definition
 */
export interface Handle {
  type: HandleType;
  x: number;
  y: number;
  cursor: string;
}

/**
 * Selection handles renderer and interaction
 */
export class SK8SelectionHandles {
  private editor: SK8Editor;
  private canvas: HTMLCanvasElement;
  private enabled: boolean = true;

  // Handle state
  private handles: Handle[] = [];
  private activeHandle: Handle | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private originalBounds: Rect | null = null;

  // Visual settings
  private handleSize = 8;
  private handleColor = ColorUtils.fromRGB(0, 120, 255);
  private selectionColor = ColorUtils.fromRGB(0, 120, 255);
  private selectionLineWidth = 2;

  // Options
  private snapToGrid: boolean = false;
  private gridSize: number = 10;
  private maintainAspectRatio: boolean = false;

  constructor(editor: SK8Editor, canvas: HTMLCanvasElement) {
    this.editor = editor;
    this.canvas = canvas;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for selection changes
    this.editor.on('selection-change', () => {
      this.updateHandles();
    });

    // Mouse events on canvas
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // Keyboard events for modifiers
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey) {
        this.maintainAspectRatio = true;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!e.shiftKey) {
        this.maintainAspectRatio = false;
      }
    });
  }

  /**
   * Update handles based on current selection
   */
  private updateHandles(): void {
    this.handles = [];

    const selection = this.editor.getSelection();
    if (selection.length === 0) return;

    // Get bounds of selection
    const bounds = this.getSelectionBounds(selection);

    // Create handles
    this.handles = [
      {
        type: 'top-left',
        x: bounds.left,
        y: bounds.top,
        cursor: 'nwse-resize',
      },
      {
        type: 'top',
        x: (bounds.left + bounds.right) / 2,
        y: bounds.top,
        cursor: 'ns-resize',
      },
      {
        type: 'top-right',
        x: bounds.right,
        y: bounds.top,
        cursor: 'nesw-resize',
      },
      {
        type: 'right',
        x: bounds.right,
        y: (bounds.top + bounds.bottom) / 2,
        cursor: 'ew-resize',
      },
      {
        type: 'bottom-right',
        x: bounds.right,
        y: bounds.bottom,
        cursor: 'nwse-resize',
      },
      {
        type: 'bottom',
        x: (bounds.left + bounds.right) / 2,
        y: bounds.bottom,
        cursor: 'ns-resize',
      },
      {
        type: 'bottom-left',
        x: bounds.left,
        y: bounds.bottom,
        cursor: 'nesw-resize',
      },
      {
        type: 'left',
        x: bounds.left,
        y: (bounds.top + bounds.bottom) / 2,
        cursor: 'ew-resize',
      },
      {
        type: 'rotate',
        x: (bounds.left + bounds.right) / 2,
        y: bounds.top - 30,
        cursor: 'crosshair',
      },
    ];
  }

  /**
   * Get bounds of selection
   */
  private getSelectionBounds(selection: SK8Actor[]): Rect {
    if (selection.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    let bounds = selection[0].getBoundsRect();

    for (let i = 1; i < selection.length; i++) {
      const actorBounds = selection[i].getBoundsRect();
      bounds = RectUtils.union(bounds, actorBounds);
    }

    return bounds;
  }

  /**
   * Render selection handles
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    const selection = this.editor.getSelection();
    if (selection.length === 0) return;

    // Only show handles for select tool
    if (this.editor.getCurrentTool() !== 'select') return;

    ctx.save();

    // Draw selection box
    const bounds = this.getSelectionBounds(selection);
    this.drawSelectionBox(ctx, bounds);

    // Draw handles
    for (const handle of this.handles) {
      this.drawHandle(ctx, handle);
    }

    ctx.restore();
  }

  /**
   * Draw selection box
   */
  private drawSelectionBox(ctx: CanvasRenderingContext2D, bounds: Rect): void {
    ctx.strokeStyle = ColorUtils.toCSS(this.selectionColor);
    ctx.lineWidth = this.selectionLineWidth;
    ctx.setLineDash([5, 5]);

    ctx.strokeRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      RectUtils.height(bounds)
    );

    ctx.setLineDash([]);
  }

  /**
   * Draw a handle
   */
  private drawHandle(ctx: CanvasRenderingContext2D, handle: Handle): void {
    const halfSize = this.handleSize / 2;

    // Fill
    ctx.fillStyle = ColorUtils.toCSS(this.handleColor);
    ctx.fillRect(
      handle.x - halfSize,
      handle.y - halfSize,
      this.handleSize,
      this.handleSize
    );

    // Border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      handle.x - halfSize,
      handle.y - halfSize,
      this.handleSize,
      this.handleSize
    );
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    if (this.editor.getCurrentTool() !== 'select') return;

    const pos = this.getMousePos(e);

    // Check if clicking on a handle
    const handle = this.getHandleAtPoint(pos.x, pos.y);
    if (handle) {
      this.activeHandle = handle;
      this.isDragging = true;
      this.dragStartX = pos.x;
      this.dragStartY = pos.y;

      // Store original bounds
      const selection = this.editor.getSelection();
      if (selection.length === 1) {
        this.originalBounds = selection[0].getBoundsRect();
      }

      e.preventDefault();
      return;
    }

    // Check if clicking on selected actor (for moving)
    const selection = this.editor.getSelection();
    for (const actor of selection) {
      if (actor.containsPoint(pos.x, pos.y)) {
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        e.preventDefault();
        return;
      }
    }
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);

    if (this.isDragging) {
      const dx = pos.x - this.dragStartX;
      const dy = pos.y - this.dragStartY;

      if (this.activeHandle) {
        // Resizing
        this.handleResize(dx, dy);
      } else {
        // Moving
        this.handleMove(dx, dy);
      }

      this.dragStartX = pos.x;
      this.dragStartY = pos.y;

      return;
    }

    // Update cursor based on handle
    const handle = this.getHandleAtPoint(pos.x, pos.y);
    if (handle) {
      this.canvas.style.cursor = handle.cursor;
    } else {
      // Check if over selected actor
      const selection = this.editor.getSelection();
      let overActor = false;
      for (const actor of selection) {
        if (actor.containsPoint(pos.x, pos.y)) {
          this.canvas.style.cursor = 'move';
          overActor = true;
          break;
        }
      }
      if (!overActor) {
        this.canvas.style.cursor = 'default';
      }
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(_e: MouseEvent): void {
    if (this.isDragging) {
      // Create undo command if we were resizing
      if (this.activeHandle && this.originalBounds) {
        const selection = this.editor.getSelection();
        if (selection.length === 1) {
          const actor = selection[0];
          const newBounds = actor.getBoundsRect();

          // Only create command if bounds changed
          if (!RectUtils.equals(this.originalBounds, newBounds)) {
            const command = new ResizeActorCommand(
              actor,
              newBounds.left,
              newBounds.top,
              newBounds.right,
              newBounds.bottom
            );
            // Note: We already executed the resize interactively, so we add to undo stack manually
            this.editor['undoStack'].push(command);
          }
        }
      }

      this.isDragging = false;
      this.activeHandle = null;
      this.originalBounds = null;
    }
  }

  /**
   * Handle resize
   */
  private handleResize(dx: number, dy: number): void {
    if (!this.activeHandle || !this.originalBounds) return;

    const selection = this.editor.getSelection();
    if (selection.length !== 1) return;

    const actor = selection[0];
    const bounds = actor.getBoundsRect();

    let newBounds = { ...bounds };

    // Apply resize based on handle type
    switch (this.activeHandle.type) {
      case 'top-left':
        newBounds.left += dx;
        newBounds.top += dy;
        break;
      case 'top':
        newBounds.top += dy;
        break;
      case 'top-right':
        newBounds.right += dx;
        newBounds.top += dy;
        break;
      case 'right':
        newBounds.right += dx;
        break;
      case 'bottom-right':
        newBounds.right += dx;
        newBounds.bottom += dy;
        break;
      case 'bottom':
        newBounds.bottom += dy;
        break;
      case 'bottom-left':
        newBounds.left += dx;
        newBounds.bottom += dy;
        break;
      case 'left':
        newBounds.left += dx;
        break;
      case 'rotate':
        // TODO: Implement rotation
        return;
    }

    // Maintain aspect ratio if shift is held
    if (this.maintainAspectRatio) {
      newBounds = this.constrainAspectRatio(newBounds, this.originalBounds);
    }

    // Snap to grid
    if (this.snapToGrid) {
      newBounds = this.snapBoundsToGrid(newBounds);
    }

    // Ensure minimum size
    const minSize = 10;
    if (RectUtils.width(newBounds) < minSize) {
      if (newBounds.left !== bounds.left) {
        newBounds.left = newBounds.right - minSize;
      } else {
        newBounds.right = newBounds.left + minSize;
      }
    }
    if (RectUtils.height(newBounds) < minSize) {
      if (newBounds.top !== bounds.top) {
        newBounds.top = newBounds.bottom - minSize;
      } else {
        newBounds.bottom = newBounds.top + minSize;
      }
    }

    // Apply new bounds
    actor.setBoundsRect(newBounds);
    this.updateHandles();
  }

  /**
   * Handle move
   */
  private handleMove(dx: number, dy: number): void {
    const selection = this.editor.getSelection();

    // Snap movement to grid
    if (this.snapToGrid) {
      dx = Math.round(dx / this.gridSize) * this.gridSize;
      dy = Math.round(dy / this.gridSize) * this.gridSize;
    }

    // Move all selected actors
    for (const actor of selection) {
      actor.moveBy(dx, dy);
    }

    this.updateHandles();
  }

  /**
   * Constrain aspect ratio
   */
  private constrainAspectRatio(newBounds: Rect, originalBounds: Rect): Rect {
    const originalRatio =
      RectUtils.width(originalBounds) / RectUtils.height(originalBounds);

    const width = RectUtils.width(newBounds);
    const height = RectUtils.height(newBounds);
    const newRatio = width / height;

    if (Math.abs(newRatio - originalRatio) > 0.01) {
      // Adjust to maintain ratio
      if (newRatio > originalRatio) {
        // Width is too large, adjust it
        const correctWidth = height * originalRatio;
        newBounds.right = newBounds.left + correctWidth;
      } else {
        // Height is too large, adjust it
        const correctHeight = width / originalRatio;
        newBounds.bottom = newBounds.top + correctHeight;
      }
    }

    return newBounds;
  }

  /**
   * Snap bounds to grid
   */
  private snapBoundsToGrid(bounds: Rect): Rect {
    return {
      left: Math.round(bounds.left / this.gridSize) * this.gridSize,
      top: Math.round(bounds.top / this.gridSize) * this.gridSize,
      right: Math.round(bounds.right / this.gridSize) * this.gridSize,
      bottom: Math.round(bounds.bottom / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Get handle at point
   */
  private getHandleAtPoint(x: number, y: number): Handle | null {
    const threshold = this.handleSize;

    for (const handle of this.handles) {
      const dx = Math.abs(x - handle.x);
      const dy = Math.abs(y - handle.y);

      if (dx <= threshold && dy <= threshold) {
        return handle;
      }
    }

    return null;
  }

  /**
   * Get mouse position relative to canvas
   */
  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  /**
   * Enable/disable handles
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Enable/disable snap to grid
   */
  setSnapToGrid(enabled: boolean, gridSize?: number): void {
    this.snapToGrid = enabled;
    if (gridSize !== undefined) {
      this.gridSize = gridSize;
    }
  }

  /**
   * Set handle size
   */
  setHandleSize(size: number): void {
    this.handleSize = size;
    this.updateHandles();
  }

  /**
   * Get snap to grid setting
   */
  getSnapToGrid(): boolean {
    return this.snapToGrid;
  }

  /**
   * Get grid size
   */
  getGridSize(): number {
    return this.gridSize;
  }
}
