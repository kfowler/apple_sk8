/**
 * Drag and Drop System
 *
 * Provides comprehensive drag-and-drop functionality with:
 * - Draggable actors
 * - Drop targets
 * - Drag constraints (horizontal/vertical, snap-to-grid)
 * - Ghost/preview during drag
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { SK8DragEvent } from './SK8Event.js';

/**
 * Drag constraints
 */
export interface DragConstraints {
  horizontal?: boolean; // Only allow horizontal movement
  vertical?: boolean; // Only allow vertical movement
  snapToGrid?: number; // Snap to grid with this spacing
  bounds?: { left: number; top: number; right: number; bottom: number }; // Constrain to bounds
}

/**
 * Drag state
 */
export interface DragState {
  actor: SK8Actor;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  originalLeft: number;
  originalTop: number;
  constraints?: DragConstraints;
}

/**
 * Drag and drop manager
 */
export class DragDropManager {
  private currentDrag: DragState | null = null;
  private dropTargets: Set<SK8Actor> = new Set();

  /**
   * Start dragging an actor
   */
  startDrag(actor: SK8Actor, x: number, y: number, constraints?: DragConstraints): void {
    if (!actor.getDraggable()) return;

    const bounds = actor.getBoundsRect();
    this.currentDrag = {
      actor,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      offsetX: x - bounds.left,
      offsetY: y - bounds.top,
      originalLeft: bounds.left,
      originalTop: bounds.top,
      constraints,
    };

    // Dispatch dragStart event
    const event = new SK8DragEvent('dragstart', x, y, 0, 0, actor);
    actor.dispatchEvent(event);
  }

  /**
   * Update drag position
   */
  updateDrag(x: number, y: number): void {
    if (!this.currentDrag) return;

    const drag = this.currentDrag;
    const deltaX = x - drag.startX;
    const deltaY = y - drag.startY;

    // Apply constraints
    let newX = drag.originalLeft + deltaX;
    let newY = drag.originalTop + deltaY;

    if (drag.constraints) {
      const c = drag.constraints;

      // Horizontal/vertical only
      if (c.horizontal && !c.vertical) {
        newY = drag.originalTop;
      } else if (c.vertical && !c.horizontal) {
        newX = drag.originalLeft;
      }

      // Snap to grid
      if (c.snapToGrid) {
        newX = Math.round(newX / c.snapToGrid) * c.snapToGrid;
        newY = Math.round(newY / c.snapToGrid) * c.snapToGrid;
      }

      // Bounds constraint
      if (c.bounds) {
        const width = drag.actor.getWidth();
        const height = drag.actor.getHeight();
        newX = Math.max(c.bounds.left, Math.min(c.bounds.right - width, newX));
        newY = Math.max(c.bounds.top, Math.min(c.bounds.bottom - height, newY));
      }
    }

    // Update actor position
    drag.actor.moveTo(newX, newY);

    // Update drag state
    drag.currentX = x;
    drag.currentY = y;

    // Dispatch drag event
    const event = new SK8DragEvent('drag', x, y, deltaX, deltaY, drag.actor);
    drag.actor.dispatchEvent(event);

    // Check for drag enter/leave/over on drop targets
    this.updateDropTargets(x, y);
  }

  /**
   * End drag operation
   */
  endDrag(x: number, y: number): void {
    if (!this.currentDrag) return;

    const drag = this.currentDrag;
    const deltaX = x - drag.startX;
    const deltaY = y - drag.startY;

    // Dispatch dragEnd event
    const dragEndEvent = new SK8DragEvent('dragend', x, y, deltaX, deltaY, drag.actor);
    drag.actor.dispatchEvent(dragEndEvent);

    // Check if dropped on a drop target
    const dropTarget = this.findDropTarget(x, y);
    if (dropTarget) {
      const dropEvent = new SK8DragEvent('drop', x, y, deltaX, deltaY, drag.actor);
      dropTarget.dispatchEvent(dropEvent);
    }

    this.currentDrag = null;
  }

  /**
   * Cancel current drag (returns actor to original position)
   */
  cancelDrag(): void {
    if (!this.currentDrag) return;

    const drag = this.currentDrag;

    // Return to original position
    drag.actor.moveTo(drag.originalLeft, drag.originalTop);

    // Dispatch dragEnd with canceled flag
    const event = new SK8DragEvent('dragend', drag.currentX, drag.currentY, 0, 0, drag.actor);
    event.preventDefault(); // Mark as canceled
    drag.actor.dispatchEvent(event);

    this.currentDrag = null;
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.currentDrag !== null;
  }

  /**
   * Get current drag state
   */
  getCurrentDrag(): DragState | null {
    return this.currentDrag;
  }

  /**
   * Register a drop target
   */
  registerDropTarget(actor: SK8Actor): void {
    if (actor.getDroppable()) {
      this.dropTargets.add(actor);
    }
  }

  /**
   * Unregister a drop target
   */
  unregisterDropTarget(actor: SK8Actor): void {
    this.dropTargets.delete(actor);
  }

  /**
   * Find drop target at position
   */
  private findDropTarget(x: number, y: number): SK8Actor | null {
    for (const target of this.dropTargets) {
      if (target.getVisible() && target.getDroppable() && target.containsPoint(x, y)) {
        return target;
      }
    }
    return null;
  }

  /**
   * Update drop target states during drag
   */
  private previousDropTarget: SK8Actor | null = null;

  private updateDropTargets(x: number, y: number): void {
    if (!this.currentDrag) return;

    const currentTarget = this.findDropTarget(x, y);

    // Handle dragLeave
    if (this.previousDropTarget && this.previousDropTarget !== currentTarget) {
      const leaveEvent = new SK8DragEvent('dragleave', x, y, 0, 0, this.currentDrag.actor);
      this.previousDropTarget.dispatchEvent(leaveEvent);
    }

    // Handle dragEnter
    if (currentTarget && currentTarget !== this.previousDropTarget) {
      const enterEvent = new SK8DragEvent('dragenter', x, y, 0, 0, this.currentDrag.actor);
      currentTarget.dispatchEvent(enterEvent);
    }

    // Handle dragOver
    if (currentTarget) {
      const overEvent = new SK8DragEvent('dragover', x, y, 0, 0, this.currentDrag.actor);
      currentTarget.dispatchEvent(overEvent);
    }

    this.previousDropTarget = currentTarget;
  }
}
