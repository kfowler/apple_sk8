/**
 * SK8Editor - Visual editor for SK8 objects
 *
 * Provides:
 * - Selection management (single/multi-select)
 * - Undo/redo with command pattern
 * - Tool system (select, create shapes, etc.)
 * - Event handling for editor interactions
 */

import { SK8Stage } from '../graphics/SK8Stage.js';
import { SK8Actor } from '../graphics/SK8Actor.js';
import { SK8Object, PropertyValue } from '../core/SK8Object.js';

/**
 * Command interface for undo/redo system
 */
export interface EditorCommand {
  execute(): void;
  undo(): void;
  redo(): void;
  canMerge?(other: EditorCommand): boolean;
  merge?(other: EditorCommand): void;
  description: string;
}

/**
 * Base command class
 */
export abstract class BaseCommand implements EditorCommand {
  abstract execute(): void;
  abstract undo(): void;
  abstract description: string;

  redo(): void {
    this.execute();
  }

  canMerge(_other: EditorCommand): boolean {
    return false;
  }

  merge(_other: EditorCommand): void {
    // Override in subclasses that support merging
  }
}

/**
 * Command to set a property on an object
 */
export class SetPropertyCommand extends BaseCommand {
  private oldValue: PropertyValue;
  private mergeTimeMs = 500; // Merge commands within 500ms
  private timestamp = Date.now();

  constructor(
    private target: SK8Object,
    private propertyName: string,
    private newValue: PropertyValue
  ) {
    super();
    this.oldValue = target.get(propertyName);
  }

  get description(): string {
    return `Set ${this.propertyName} to ${this.newValue}`;
  }

  execute(): void {
    this.target.set(this.propertyName, this.newValue);
  }

  undo(): void {
    this.target.set(this.propertyName, this.oldValue);
  }

  canMerge(other: EditorCommand): boolean {
    if (!(other instanceof SetPropertyCommand)) return false;
    if (other.target !== this.target) return false;
    if (other.propertyName !== this.propertyName) return false;
    if (Date.now() - this.timestamp > this.mergeTimeMs) return false;
    return true;
  }

  merge(other: EditorCommand): void {
    if (other instanceof SetPropertyCommand) {
      this.newValue = other.newValue;
      this.timestamp = other.timestamp;
    }
  }
}

/**
 * Command to move actors
 */
export class MoveActorsCommand extends BaseCommand {
  private positions: Map<SK8Actor, { x: number; y: number }> = new Map();

  constructor(
    private actors: SK8Actor[],
    private dx: number,
    private dy: number
  ) {
    super();
    // Store original positions
    for (const actor of actors) {
      this.positions.set(actor, {
        x: actor.getLeft(),
        y: actor.getTop(),
      });
    }
  }

  get description(): string {
    return `Move ${this.actors.length} actor(s)`;
  }

  execute(): void {
    for (const actor of this.actors) {
      actor.moveBy(this.dx, this.dy);
    }
  }

  undo(): void {
    for (const actor of this.actors) {
      const pos = this.positions.get(actor);
      if (pos) {
        actor.moveTo(pos.x, pos.y);
      }
    }
  }
}

/**
 * Command to resize an actor
 */
export class ResizeActorCommand extends BaseCommand {
  private oldBounds: { left: number; top: number; right: number; bottom: number };

  constructor(
    private actor: SK8Actor,
    private newLeft: number,
    private newTop: number,
    private newRight: number,
    private newBottom: number
  ) {
    super();
    const bounds = actor.getBoundsRect();
    this.oldBounds = {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
    };
  }

  get description(): string {
    return `Resize actor`;
  }

  execute(): void {
    this.actor.setBoundsRect({
      left: this.newLeft,
      top: this.newTop,
      right: this.newRight,
      bottom: this.newBottom,
    });
  }

  undo(): void {
    this.actor.setBoundsRect(this.oldBounds);
  }
}

/**
 * Command to delete actors
 */
export class DeleteActorsCommand extends BaseCommand {
  private actorData: Array<{ actor: SK8Actor; index: number }> = [];

  constructor(
    private stage: SK8Stage,
    private actors: SK8Actor[]
  ) {
    super();
    // Store actors and their positions
    const allActors = stage.getActors();
    for (const actor of actors) {
      const index = allActors.indexOf(actor);
      this.actorData.push({ actor, index });
    }
  }

  get description(): string {
    return `Delete ${this.actors.length} actor(s)`;
  }

  execute(): void {
    for (const actor of this.actors) {
      this.stage.removeActor(actor);
    }
  }

  undo(): void {
    // Restore actors at their original positions
    const sorted = this.actorData.sort((a, b) => a.index - b.index);
    for (const { actor } of sorted) {
      this.stage.addActor(actor);
    }
  }
}

/**
 * Command to add an actor
 */
export class AddActorCommand extends BaseCommand {
  constructor(
    private stage: SK8Stage,
    private actor: SK8Actor
  ) {
    super();
  }

  get description(): string {
    return `Add actor`;
  }

  execute(): void {
    this.stage.addActor(this.actor);
  }

  undo(): void {
    this.stage.removeActor(this.actor);
  }
}

/**
 * Editor tool types
 */
export type ToolType =
  | 'select'
  | 'rectangle'
  | 'roundrect'
  | 'circle'
  | 'line'
  | 'text'
  | 'arrow'
  | 'star'
  | 'polygon';

/**
 * Tool interface
 */
export interface EditorTool {
  type: ToolType;
  name: string;
  cursor: string;
  hotkey?: string;
  onMouseDown?(editor: SK8Editor, x: number, y: number): void;
  onMouseMove?(editor: SK8Editor, x: number, y: number): void;
  onMouseUp?(editor: SK8Editor, x: number, y: number): void;
  onActivate?(editor: SK8Editor): void;
  onDeactivate?(editor: SK8Editor): void;
}

/**
 * Editor event types
 */
export type EditorEventType =
  | 'selection-change'
  | 'tool-change'
  | 'command-executed'
  | 'command-undone'
  | 'command-redone'
  | 'actor-created'
  | 'actor-deleted';

export type EditorEventListener = (data: any) => void;

/**
 * SK8Editor - Main editor class
 */
export class SK8Editor {
  private stage: SK8Stage;
  private selectedActors: Set<SK8Actor> = new Set();
  private currentTool: ToolType = 'select';
  private tools: Map<ToolType, EditorTool> = new Map();

  // Undo/redo system
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private maxUndoStackSize = 100;

  // Event system
  private eventListeners: Map<EditorEventType, EditorEventListener[]> = new Map();

  // Tool state
  private toolState: {
    isDrawing: boolean;
    startX: number;
    startY: number;
    currentActor?: SK8Actor;
  } = {
    isDrawing: false,
    startX: 0,
    startY: 0,
  };

  constructor(stage: SK8Stage) {
    this.stage = stage;
    this.registerDefaultTools();
  }

  // Selection management

  /**
   * Get selected actors
   */
  getSelection(): SK8Actor[] {
    return Array.from(this.selectedActors);
  }

  /**
   * Set selected actors
   */
  setSelection(actors: SK8Actor[]): void {
    this.selectedActors.clear();
    for (const actor of actors) {
      this.selectedActors.add(actor);
    }
    this.emit('selection-change', this.getSelection());
  }

  /**
   * Select a single actor
   */
  select(actor: SK8Actor, addToSelection = false): void {
    if (!addToSelection) {
      this.selectedActors.clear();
    }
    this.selectedActors.add(actor);
    this.emit('selection-change', this.getSelection());
  }

  /**
   * Deselect an actor
   */
  deselect(actor: SK8Actor): void {
    this.selectedActors.delete(actor);
    this.emit('selection-change', this.getSelection());
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedActors.clear();
    this.emit('selection-change', this.getSelection());
  }

  /**
   * Check if actor is selected
   */
  isSelected(actor: SK8Actor): boolean {
    return this.selectedActors.has(actor);
  }

  /**
   * Select actors in a rectangular area
   */
  selectInRect(left: number, top: number, right: number, bottom: number): void {
    this.selectedActors.clear();
    const actors = this.stage.getActors();
    for (const actor of actors) {
      const bounds = actor.getBoundsRect();
      if (
        bounds.left >= left &&
        bounds.right <= right &&
        bounds.top >= top &&
        bounds.bottom <= bottom
      ) {
        this.selectedActors.add(actor);
      }
    }
    this.emit('selection-change', this.getSelection());
  }

  // Tool management

  /**
   * Get current tool
   */
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  /**
   * Set current tool
   */
  setTool(toolType: ToolType): void {
    const oldTool = this.tools.get(this.currentTool);
    if (oldTool?.onDeactivate) {
      oldTool.onDeactivate(this);
    }

    this.currentTool = toolType;

    const newTool = this.tools.get(toolType);
    if (newTool?.onActivate) {
      newTool.onActivate(this);
    }

    this.emit('tool-change', toolType);
  }

  /**
   * Register a tool
   */
  registerTool(tool: EditorTool): void {
    this.tools.set(tool.type, tool);
  }

  /**
   * Get a tool by type
   */
  getTool(type: ToolType): EditorTool | undefined {
    return this.tools.get(type);
  }

  /**
   * Get all registered tools
   */
  getTools(): EditorTool[] {
    return Array.from(this.tools.values());
  }

  // Command management (Undo/Redo)

  /**
   * Execute a command
   */
  executeCommand(command: EditorCommand): void {
    command.execute();

    // Try to merge with last command
    if (this.undoStack.length > 0) {
      const lastCommand = this.undoStack[this.undoStack.length - 1];
      if (lastCommand.canMerge && lastCommand.canMerge(command)) {
        lastCommand.merge?.(command);
        this.emit('command-executed', command);
        return;
      }
    }

    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack when new command is executed

    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoStackSize) {
      this.undoStack.shift();
    }

    this.emit('command-executed', command);
  }

  /**
   * Undo last command
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      this.emit('command-undone', command);
      return true;
    }
    return false;
  }

  /**
   * Redo last undone command
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
      this.emit('command-redone', command);
      return true;
    }
    return false;
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear undo/redo history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get undo stack description
   */
  getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  /**
   * Get redo stack description
   */
  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }

  // Event system

  /**
   * Add event listener
   */
  on(eventType: EditorEventType, listener: EditorEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: EditorEventType, listener: EditorEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  private emit(eventType: EditorEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  // Stage access

  /**
   * Get the stage
   */
  getStage(): SK8Stage {
    return this.stage;
  }

  // Tool state access

  /**
   * Get tool state (for tools to store temporary data)
   */
  getToolState(): any {
    return this.toolState;
  }

  /**
   * Set tool state
   */
  setToolState(state: any): void {
    this.toolState = { ...this.toolState, ...state };
  }

  // Default tools registration

  private registerDefaultTools(): void {
    // Select tool
    this.registerTool({
      type: 'select',
      name: 'Select',
      cursor: 'default',
      hotkey: 'V',
    });

    // Rectangle tool
    this.registerTool({
      type: 'rectangle',
      name: 'Rectangle',
      cursor: 'crosshair',
      hotkey: 'R',
    });

    // RoundRect tool
    this.registerTool({
      type: 'roundrect',
      name: 'Rounded Rectangle',
      cursor: 'crosshair',
      hotkey: 'U',
    });

    // Circle tool
    this.registerTool({
      type: 'circle',
      name: 'Circle',
      cursor: 'crosshair',
      hotkey: 'C',
    });

    // Line tool
    this.registerTool({
      type: 'line',
      name: 'Line',
      cursor: 'crosshair',
      hotkey: 'L',
    });

    // Text tool
    this.registerTool({
      type: 'text',
      name: 'Text',
      cursor: 'text',
      hotkey: 'T',
    });

    // Arrow tool
    this.registerTool({
      type: 'arrow',
      name: 'Arrow',
      cursor: 'crosshair',
      hotkey: 'A',
    });

    // Star tool
    this.registerTool({
      type: 'star',
      name: 'Star',
      cursor: 'crosshair',
      hotkey: 'S',
    });

    // Polygon tool
    this.registerTool({
      type: 'polygon',
      name: 'Polygon',
      cursor: 'crosshair',
      hotkey: 'P',
    });
  }

  // Keyboard shortcuts

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Undo: Cmd/Ctrl + Z
    if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
      if (this.canUndo()) {
        this.undo();
        return true;
      }
    }

    // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
    if (
      ((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) ||
      ((event.metaKey || event.ctrlKey) && event.key === 'y')
    ) {
      if (this.canRedo()) {
        this.redo();
        return true;
      }
    }

    // Delete: Delete or Backspace
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selected = this.getSelection();
      if (selected.length > 0) {
        this.executeCommand(new DeleteActorsCommand(this.stage, selected));
        this.clearSelection();
        return true;
      }
    }

    // Select All: Cmd/Ctrl + A
    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      this.setSelection(this.stage.getActors());
      return true;
    }

    // Tool hotkeys
    const key = event.key.toUpperCase();
    for (const tool of this.tools.values()) {
      if (tool.hotkey && tool.hotkey.toUpperCase() === key) {
        this.setTool(tool.type);
        return true;
      }
    }

    return false;
  }
}
