/**
 * SK8ObjectTree - Hierarchical view of stage and actors
 *
 * Features:
 * - Hierarchical display of stage/actors
 * - Expandable/collapsible nodes
 * - Show actor type and name
 * - Click to select
 * - Drag to reorder
 * - Visual indicators (visibility, locked)
 */

import { SK8Stage } from '../graphics/SK8Stage.js';
import { SK8Actor } from '../graphics/SK8Actor.js';
import { SK8Editor } from './editor.js';

/**
 * Tree node data
 */
export interface TreeNode {
  id: string;
  actor: SK8Actor;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  children?: TreeNode[];
}

/**
 * Object tree viewer
 */
export class SK8ObjectTree {
  private container: HTMLElement;
  private editor: SK8Editor;
  private stage: SK8Stage;
  private rootElement: HTMLElement | null = null;
  private draggedNode: TreeNode | null = null;

  constructor(editor: SK8Editor, container: HTMLElement) {
    this.editor = editor;
    this.stage = editor.getStage();
    this.container = container;
    this.setupEventListeners();
    this.render();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.editor.on('selection-change', () => {
      this.render();
    });

    this.editor.on('actor-created', () => {
      this.render();
    });

    this.editor.on('actor-deleted', () => {
      this.render();
    });
  }

  /**
   * Build tree structure from stage
   */
  private buildTree(): TreeNode[] {
    const actors = this.stage.getActors();
    const nodes: TreeNode[] = [];

    for (const actor of actors) {
      nodes.push(this.createTreeNode(actor));
    }

    return nodes;
  }

  /**
   * Create tree node from actor
   */
  private createTreeNode(actor: SK8Actor): TreeNode {
    return {
      id: this.getActorId(actor),
      actor,
      name: this.getActorName(actor),
      type: actor.constructor.name,
      visible: actor.getVisible(),
      locked: false, // TODO: Add locked property to SK8Actor
    };
  }

  /**
   * Get actor ID (use object identity)
   */
  private getActorId(actor: SK8Actor): string {
    const name = actor.get('name');
    return name?.toString() || actor.constructor.name;
  }

  /**
   * Get actor name for display
   */
  private getActorName(actor: SK8Actor): string {
    const name = actor.get('name');
    if (name) return name.toString();
    return actor.constructor.name;
  }

  /**
   * Render the tree
   */
  render(): void {
    this.container.innerHTML = '';

    // Create root element
    this.rootElement = document.createElement('div');
    this.rootElement.className = 'sk8-tree-root';

    // Add stage node
    const stageNode = this.createStageElement();
    this.rootElement.appendChild(stageNode);

    // Add actor nodes
    const tree = this.buildTree();
    for (const node of tree) {
      const nodeEl = this.createNodeElement(node);
      this.rootElement.appendChild(nodeEl);
    }

    this.container.appendChild(this.rootElement);
  }

  /**
   * Create stage element
   */
  private createStageElement(): HTMLElement {
    const stageEl = document.createElement('div');
    stageEl.className = 'sk8-tree-node sk8-tree-stage';

    const labelEl = document.createElement('div');
    labelEl.className = 'sk8-tree-node-label';
    labelEl.innerHTML = `
      <span class="sk8-tree-icon">📱</span>
      <span class="sk8-tree-name">Stage</span>
    `;

    labelEl.onclick = () => {
      this.editor.clearSelection();
    };

    stageEl.appendChild(labelEl);

    return stageEl;
  }

  /**
   * Create node element
   */
  private createNodeElement(node: TreeNode, depth = 0): HTMLElement {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'sk8-tree-node';
    nodeEl.style.paddingLeft = `${depth * 20}px`;

    // Check if selected
    const isSelected = this.editor.isSelected(node.actor);
    if (isSelected) {
      nodeEl.classList.add('sk8-tree-node-selected');
    }

    // Node label
    const labelEl = document.createElement('div');
    labelEl.className = 'sk8-tree-node-label';
    labelEl.draggable = true;

    // Icon based on type
    const icon = this.getIconForType(node.type);

    // Build label HTML
    labelEl.innerHTML = `
      <span class="sk8-tree-icon">${icon}</span>
      <span class="sk8-tree-name">${node.name}</span>
      <span class="sk8-tree-type">${this.getShortTypeName(node.type)}</span>
    `;

    // Add visibility toggle
    const visibilityBtn = document.createElement('button');
    visibilityBtn.className = 'sk8-tree-visibility-btn';
    visibilityBtn.textContent = node.visible ? '👁' : '👁‍🗨';
    visibilityBtn.title = node.visible ? 'Hide' : 'Show';
    visibilityBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleVisibility(node);
    };
    labelEl.appendChild(visibilityBtn);

    // Click to select
    labelEl.onclick = (e) => {
      if (e.shiftKey) {
        // Add to selection
        this.editor.select(node.actor, true);
      } else if (e.metaKey || e.ctrlKey) {
        // Toggle selection
        if (isSelected) {
          this.editor.deselect(node.actor);
        } else {
          this.editor.select(node.actor, true);
        }
      } else {
        // Single select
        this.editor.select(node.actor, false);
      }
    };

    // Double-click to focus/zoom
    labelEl.ondblclick = (e) => {
      e.stopPropagation();
      this.focusOnActor(node.actor);
    };

    // Drag and drop
    labelEl.ondragstart = (e) => {
      this.draggedNode = node;
      e.dataTransfer!.effectAllowed = 'move';
      labelEl.classList.add('sk8-tree-node-dragging');
    };

    labelEl.ondragend = () => {
      this.draggedNode = null;
      labelEl.classList.remove('sk8-tree-node-dragging');
    };

    labelEl.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      labelEl.classList.add('sk8-tree-node-drop-target');
    };

    labelEl.ondragleave = () => {
      labelEl.classList.remove('sk8-tree-node-drop-target');
    };

    labelEl.ondrop = (e) => {
      e.preventDefault();
      labelEl.classList.remove('sk8-tree-node-drop-target');

      if (this.draggedNode && this.draggedNode !== node) {
        this.reorderActors(this.draggedNode, node);
      }
    };

    nodeEl.appendChild(labelEl);

    // Add children if any
    if (node.children && node.children.length > 0) {
      const childrenEl = document.createElement('div');
      childrenEl.className = 'sk8-tree-children';

      for (const child of node.children) {
        const childEl = this.createNodeElement(child, depth + 1);
        childrenEl.appendChild(childEl);
      }

      nodeEl.appendChild(childrenEl);
    }

    return nodeEl;
  }

  /**
   * Get icon for actor type
   */
  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      SK8Rectangle: '▭',
      SK8RoundRect: '▢',
      SK8Circle: '⭕',
      SK8Text: '𝐓',
      SK8Line: '╱',
      SK8Arrow: '→',
      SK8Star: '⭐',
      SK8Button: '🔘',
      SK8CheckBox: '☑',
      SK8Slider: '─',
      SK8EditText: '📝',
      SK8Label: '🏷',
      SK8Image: '🖼',
      SK8Group: '📁',
    };

    return icons[type] || '◻';
  }

  /**
   * Get short type name
   */
  private getShortTypeName(type: string): string {
    return type.replace('SK8', '');
  }

  /**
   * Toggle actor visibility
   */
  private toggleVisibility(node: TreeNode): void {
    const newVisible = !node.visible;
    node.actor.setVisible(newVisible);
    this.render();
  }

  /**
   * Focus on actor (center view on it)
   */
  private focusOnActor(actor: SK8Actor): void {
    // TODO: Add pan/zoom to center on actor
    console.log('Focus on actor:', actor);
  }

  /**
   * Reorder actors (drag and drop)
   */
  private reorderActors(draggedNode: TreeNode, targetNode: TreeNode): void {
    const actors = this.stage.getActors();
    const draggedIndex = actors.indexOf(draggedNode.actor);
    const targetIndex = actors.indexOf(targetNode.actor);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged actor
    this.stage.removeActor(draggedNode.actor);

    // Get updated actors list
    const updatedActors = this.stage.getActors();

    // Calculate new index (target might have shifted)
    let newIndex = updatedActors.indexOf(targetNode.actor);
    if (draggedIndex < targetIndex) {
      newIndex++; // Insert after target
    }

    // Reinsert at new position
    const allActors = this.stage.getActors();
    this.stage.clearActors();

    for (let i = 0; i < allActors.length; i++) {
      if (i === newIndex) {
        this.stage.addActor(draggedNode.actor);
      }
      this.stage.addActor(allActors[i]);
    }

    // If newIndex is at the end
    if (newIndex >= allActors.length) {
      this.stage.addActor(draggedNode.actor);
    }

    this.render();
  }

  /**
   * Expand all nodes
   */
  expandAll(): void {
    // TODO: Implement expandable nodes
    this.render();
  }

  /**
   * Collapse all nodes
   */
  collapseAll(): void {
    // TODO: Implement collapsible nodes
    this.render();
  }

  /**
   * Filter tree by search term
   */
  filter(searchTerm: string): void {
    if (!searchTerm) {
      this.render();
      return;
    }

    // TODO: Implement filtering
    this.render();
  }

  /**
   * Refresh the tree
   */
  refresh(): void {
    this.render();
  }
}
