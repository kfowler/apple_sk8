/**
 * SK8TreeView - Hierarchical tree widget
 *
 * Displays a hierarchical tree structure with expand/collapse,
 * selection, and drag-drop support.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type SelectionMode = 'single' | 'multi' | 'none';

export interface TreeNode {
  label: string;
  children?: TreeNode[];
  expanded?: boolean;
  selected?: boolean;
  data?: any;
  id?: string;
  icon?: string;
  // Lazy loading
  hasChildren?: boolean;
  childrenLoaded?: boolean;
}

export class SK8TreeView extends SK8Actor {
  private rootNodes: TreeNode[] = [];
  private selectionMode: SelectionMode = 'single';
  private selectedNodes: Set<string> = new Set();
  private expandedNodes: Set<string> = new Set();
  private hoveredNodeId: string | null = null;
  private draggedNodeId: string | null = null;
  private dropTargetNodeId: string | null = null;

  // Visual properties
  private rowHeight: number = 24;
  private indentSize: number = 20;
  private fontSize: number = 13;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private scrollOffset: number = 0;

  // Colors
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private selectedColor: Color = { r: 0, g: 120, b: 215, a: 0.3 };
  private hoverColor: Color = { r: 0, g: 120, b: 215, a: 0.1 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private selectedTextColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private borderColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private expandIconColor: Color = { r: 100, g: 100, b: 100, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'TreeView');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 250, bottom: 400 });

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

  // Node management
  getRootNodes(): TreeNode[] {
    return this.rootNodes;
  }

  setRootNodes(nodes: TreeNode[]): void {
    this.rootNodes = nodes.map((node) => this.initializeNode(node));
    this.setNeedsDraw();
  }

  addRootNode(node: TreeNode): void {
    this.rootNodes.push(this.initializeNode(node));
    this.setNeedsDraw();
  }

  clearNodes(): void {
    this.rootNodes = [];
    this.selectedNodes.clear();
    this.expandedNodes.clear();
    this.setNeedsDraw();
  }

  private initializeNode(node: TreeNode): TreeNode {
    return {
      ...node,
      id: node.id || `node-${Date.now()}-${Math.random()}`,
      expanded: node.expanded ?? false,
      selected: node.selected ?? false,
      children: node.children?.map((child) => this.initializeNode(child)),
      childrenLoaded: node.children ? true : node.childrenLoaded ?? false,
    };
  }

  // Selection
  getSelectionMode(): SelectionMode {
    return this.selectionMode;
  }

  setSelectionMode(mode: SelectionMode): void {
    this.selectionMode = mode;
    if (mode === 'none') {
      this.selectedNodes.clear();
    } else if (mode === 'single' && this.selectedNodes.size > 1) {
      const first = Array.from(this.selectedNodes)[0];
      this.selectedNodes.clear();
      this.selectedNodes.add(first);
    }
    this.setNeedsDraw();
  }

  getSelectedNodeIds(): string[] {
    return Array.from(this.selectedNodes);
  }

  selectNode(nodeId: string, addToSelection: boolean = false): void {
    if (this.selectionMode === 'none') return;

    const wasSelected = this.selectedNodes.has(nodeId);

    if (this.selectionMode === 'single' || !addToSelection) {
      this.selectedNodes.clear();
    }

    if (!wasSelected) {
      this.selectedNodes.add(nodeId);
    }

    this.setNeedsDraw();

    // Dispatch nodeSelected event
    const node = this.findNodeById(nodeId);
    if (node) {
      this.dispatchEvent(
        new SK8CustomEvent('nodeSelected', {
          nodeId,
          node,
          selected: Array.from(this.selectedNodes),
        })
      );
    }
  }

  deselectNode(nodeId: string): void {
    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId);
      this.setNeedsDraw();
    }
  }

  clearSelection(): void {
    this.selectedNodes.clear();
    this.setNeedsDraw();
  }

  // Expand/Collapse
  expandNode(nodeId: string): void {
    const node = this.findNodeById(nodeId);
    if (!node) return;

    if (!this.expandedNodes.has(nodeId)) {
      this.expandedNodes.add(nodeId);
      this.setNeedsDraw();

      // Dispatch nodeExpanded event
      this.dispatchEvent(
        new SK8CustomEvent('nodeExpanded', {
          nodeId,
          node,
          expanded: true,
        })
      );

      // Check if we need to lazy load children
      if (node.hasChildren && !node.childrenLoaded) {
        this.dispatchEvent(
          new SK8CustomEvent('loadChildren', {
            nodeId,
            node,
          })
        );
      }
    }
  }

  collapseNode(nodeId: string): void {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
      this.setNeedsDraw();

      // Dispatch nodeExpanded event with expanded: false
      const node = this.findNodeById(nodeId);
      if (node) {
        this.dispatchEvent(
          new SK8CustomEvent('nodeExpanded', {
            nodeId,
            node,
            expanded: false,
          })
        );
      }
    }
  }

  toggleNode(nodeId: string): void {
    if (this.expandedNodes.has(nodeId)) {
      this.collapseNode(nodeId);
    } else {
      this.expandNode(nodeId);
    }
  }

  isNodeExpanded(nodeId: string): boolean {
    return this.expandedNodes.has(nodeId);
  }

  // Scrolling
  getScrollOffset(): number {
    return this.scrollOffset;
  }

  setScrollOffset(offset: number): void {
    const maxScroll = Math.max(0, this.getTotalHeight() - this.getHeight());
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

  // Helper: Find node by ID
  findNodeById(nodeId: string, nodes: TreeNode[] = this.rootNodes): TreeNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = this.findNodeById(nodeId, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper: Get flattened visible nodes
  private getVisibleNodes(): Array<{ node: TreeNode; depth: number; index: number }> {
    const result: Array<{ node: TreeNode; depth: number; index: number }> = [];
    let index = 0;

    const traverse = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        result.push({ node, depth, index: index++ });

        if (node.id && this.expandedNodes.has(node.id) && node.children) {
          traverse(node.children, depth + 1);
        }
      }
    };

    traverse(this.rootNodes, 0);
    return result;
  }

  // Helper: Get total height
  private getTotalHeight(): number {
    return this.getVisibleNodes().length * this.rowHeight;
  }

  // Helper: Get node at point
  private getNodeAtPoint(x: number, y: number): TreeNode | null {
    const bounds = this.getBoundsRect();
    if (
      x < bounds.left ||
      x > bounds.right ||
      y < bounds.top ||
      y > bounds.bottom
    ) {
      return null;
    }

    const relativeY = y - bounds.top + this.scrollOffset;
    const nodeIndex = Math.floor(relativeY / this.rowHeight);
    const visibleNodes = this.getVisibleNodes();

    if (nodeIndex >= 0 && nodeIndex < visibleNodes.length) {
      return visibleNodes[nodeIndex].node;
    }

    return null;
  }

  // Helper: Check if point is on expand icon
  private isPointOnExpandIcon(x: number, y: number, nodeInfo: {
    node: TreeNode;
    depth: number;
    index: number;
  }): boolean {
    const bounds = this.getBoundsRect();
    const rowY = bounds.top + nodeInfo.index * this.rowHeight - this.scrollOffset;
    const iconX = bounds.left + 5 + nodeInfo.depth * this.indentSize;
    const iconY = rowY + this.rowHeight / 2;
    const iconSize = 8;

    const hasChildren = nodeInfo.node.children?.length || nodeInfo.node.hasChildren;
    if (!hasChildren) return false;

    return (
      x >= iconX - iconSize / 2 &&
      x <= iconX + iconSize &&
      y >= iconY - iconSize / 2 &&
      y <= iconY + iconSize / 2
    );
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    const node = this.getNodeAtPoint(x, y);
    if (!node || !node.id) {
      super.onClick(x, y);
      return;
    }

    const visibleNodes = this.getVisibleNodes();
    const nodeInfo = visibleNodes.find((n) => n.node.id === node.id);
    if (!nodeInfo) {
      super.onClick(x, y);
      return;
    }

    // Check if clicking expand icon
    if (this.isPointOnExpandIcon(x, y, nodeInfo)) {
      this.toggleNode(node.id);
      super.onClick(x, y);
      return;
    }

    // Select node
    if (this.selectionMode !== 'none') {
      this.selectNode(node.id, this.selectionMode === 'multi');
    }

    super.onClick(x, y);
  }

  override onMouseDown(x: number, y: number): void {
    const node = this.getNodeAtPoint(x, y);
    if (node?.id) {
      this.draggedNodeId = node.id;
    }
    super.onMouseDown(x, y);
  }

  override onMouseUp(x: number, y: number): void {
    // Handle drag-drop
    if (this.draggedNodeId && this.dropTargetNodeId) {
      this.dispatchEvent(
        new SK8CustomEvent('nodeDrop', {
          draggedNodeId: this.draggedNodeId,
          targetNodeId: this.dropTargetNodeId,
        })
      );
    }

    this.draggedNodeId = null;
    this.dropTargetNodeId = null;
    this.setNeedsDraw();
    super.onMouseUp(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    const node = this.getNodeAtPoint(x, y);
    const newHoverId = node?.id || null;

    // Update hover state
    if (this.hoveredNodeId !== newHoverId) {
      this.hoveredNodeId = newHoverId;
      this.setNeedsDraw();
    }

    // Update drop target
    if (this.draggedNodeId && newHoverId && newHoverId !== this.draggedNodeId) {
      this.dropTargetNodeId = newHoverId;
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

    // Clip to bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(bounds.left, bounds.top, RectUtils.width(bounds), RectUtils.height(bounds));
    ctx.clip();

    // Draw visible nodes
    const visibleNodes = this.getVisibleNodes();
    for (const nodeInfo of visibleNodes) {
      const rowY = bounds.top + nodeInfo.index * this.rowHeight - this.scrollOffset;

      // Skip if not visible
      if (rowY + this.rowHeight < bounds.top || rowY > bounds.bottom) {
        continue;
      }

      this.drawNode(ctx, nodeInfo, rowY);
    }

    ctx.restore();
  }

  private drawNode(
    ctx: CanvasRenderingContext2D,
    nodeInfo: { node: TreeNode; depth: number; index: number },
    y: number
  ): void {
    const bounds = this.getBoundsRect();
    const node = nodeInfo.node;
    const isSelected = node.id ? this.selectedNodes.has(node.id) : false;
    const isHovered = node.id === this.hoveredNodeId;
    const isDropTarget = node.id === this.dropTargetNodeId;

    // Draw selection/hover background
    if (isSelected) {
      ctx.fillStyle = ColorUtils.toCSS(this.selectedColor);
      ctx.fillRect(bounds.left, y, RectUtils.width(bounds), this.rowHeight);
    } else if (isHovered || isDropTarget) {
      ctx.fillStyle = ColorUtils.toCSS(this.hoverColor);
      ctx.fillRect(bounds.left, y, RectUtils.width(bounds), this.rowHeight);
    }

    // Calculate positions
    const indent = nodeInfo.depth * this.indentSize;
    const iconX = bounds.left + 5 + indent;
    const textX = iconX + 20;
    const textY = y + this.rowHeight / 2;

    // Draw expand/collapse icon
    const hasChildren = node.children?.length || node.hasChildren;
    if (hasChildren) {
      const isExpanded = node.id ? this.expandedNodes.has(node.id) : false;
      const iconSize = 8;

      ctx.fillStyle = ColorUtils.toCSS(this.expandIconColor);
      ctx.beginPath();

      if (isExpanded) {
        // Down arrow
        ctx.moveTo(iconX, textY - iconSize / 4);
        ctx.lineTo(iconX + iconSize, textY - iconSize / 4);
        ctx.lineTo(iconX + iconSize / 2, textY + iconSize / 4);
      } else {
        // Right arrow
        ctx.moveTo(iconX, textY - iconSize / 2);
        ctx.lineTo(iconX + iconSize / 2, textY);
        ctx.lineTo(iconX, textY + iconSize / 2);
      }

      ctx.closePath();
      ctx.fill();
    }

    // Draw icon if provided
    if (node.icon) {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = ColorUtils.toCSS(this.textColor);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.icon, textX - 18, textY);
    }

    // Draw label
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(
      isSelected ? this.selectedTextColor : this.textColor
    );
    ctx.fillText(node.label, textX, textY);
  }
}
