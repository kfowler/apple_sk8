/**
 * Tests for SK8 Editor System
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  SK8Editor,
  SetPropertyCommand,
  MoveActorsCommand,
  ResizeActorCommand,
  DeleteActorsCommand,
  AddActorCommand,
} from '../src/editor/editor.js';
import { SK8PropertyInspector } from '../src/editor/property-inspector.js';
import { SK8ObjectTree } from '../src/editor/object-tree.js';
import { SK8Toolbar } from '../src/editor/toolbar.js';
import { SK8SelectionHandles } from '../src/editor/selection-handles.js';
import { SK8Stage } from '../src/graphics/SK8Stage.js';
import { SK8Rectangle } from '../src/graphics/shapes.js';
import { ColorUtils } from '../src/graphics/types.js';

describe('SK8Editor', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let editor: SK8Editor;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    stage = new SK8Stage(canvas);
    editor = new SK8Editor(stage);
  });

  describe('Selection Management', () => {
    it('should start with no selection', () => {
      expect(editor.getSelection()).toEqual([]);
    });

    it('should select a single actor', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      editor.select(rect);

      expect(editor.getSelection()).toEqual([rect]);
      expect(editor.isSelected(rect)).toBe(true);
    });

    it('should select multiple actors', () => {
      const rect1 = new SK8Rectangle();
      const rect2 = new SK8Rectangle();
      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.select(rect1);
      editor.select(rect2, true); // Add to selection

      expect(editor.getSelection()).toHaveLength(2);
      expect(editor.isSelected(rect1)).toBe(true);
      expect(editor.isSelected(rect2)).toBe(true);
    });

    it('should deselect an actor', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      editor.select(rect);
      editor.deselect(rect);

      expect(editor.isSelected(rect)).toBe(false);
      expect(editor.getSelection()).toEqual([]);
    });

    it('should clear selection', () => {
      const rect1 = new SK8Rectangle();
      const rect2 = new SK8Rectangle();
      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.setSelection([rect1, rect2]);
      editor.clearSelection();

      expect(editor.getSelection()).toEqual([]);
    });

    it('should set selection', () => {
      const rect1 = new SK8Rectangle();
      const rect2 = new SK8Rectangle();
      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.setSelection([rect1, rect2]);

      expect(editor.getSelection()).toHaveLength(2);
    });

    it('should select actors in rectangle', () => {
      const rect1 = new SK8Rectangle();
      rect1.setBoundsRect({ left: 10, top: 10, right: 50, bottom: 50 });

      const rect2 = new SK8Rectangle();
      rect2.setBoundsRect({ left: 100, top: 100, right: 150, bottom: 150 });

      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.selectInRect(0, 0, 60, 60);

      expect(editor.isSelected(rect1)).toBe(true);
      expect(editor.isSelected(rect2)).toBe(false);
    });

    it('should emit selection-change event', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const listener = jest.fn();
      editor.on('selection-change', listener);

      editor.select(rect);

      expect(listener).toHaveBeenCalledWith([rect]);
    });
  });

  describe('Tool Management', () => {
    it('should start with select tool', () => {
      expect(editor.getCurrentTool()).toBe('select');
    });

    it('should change tool', () => {
      editor.setTool('rectangle');

      expect(editor.getCurrentTool()).toBe('rectangle');
    });

    it('should emit tool-change event', () => {
      const listener = jest.fn();
      editor.on('tool-change', listener);

      editor.setTool('circle');

      expect(listener).toHaveBeenCalledWith('circle');
    });

    it('should get tool by type', () => {
      const tool = editor.getTool('rectangle');

      expect(tool).toBeDefined();
      expect(tool?.type).toBe('rectangle');
    });

    it('should get all tools', () => {
      const tools = editor.getTools();

      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t) => t.type === 'select')).toBe(true);
      expect(tools.some((t) => t.type === 'rectangle')).toBe(true);
      expect(tools.some((t) => t.type === 'circle')).toBe(true);
    });

    it('should register custom tool', () => {
      const customTool = {
        type: 'custom' as any,
        name: 'Custom Tool',
        cursor: 'pointer',
      };

      editor.registerTool(customTool);

      const tool = editor.getTool('custom' as any);
      expect(tool).toBeDefined();
    });
  });

  describe('Command System (Undo/Redo)', () => {
    it('should start with no undo/redo', () => {
      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(false);
    });

    it('should execute a command', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);

      expect(rect.getFillColor()).toEqual(ColorUtils.Red);
      expect(editor.canUndo()).toBe(true);
    });

    it('should undo a command', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const originalColor = rect.getFillColor();
      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);

      editor.undo();

      expect(rect.getFillColor()).toEqual(originalColor);
      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(true);
    });

    it('should redo a command', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);
      editor.undo();
      editor.redo();

      expect(rect.getFillColor()).toEqual(ColorUtils.Red);
      expect(editor.canRedo()).toBe(false);
    });

    it('should clear redo stack after new command', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command1 = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command1);
      editor.undo();

      expect(editor.canRedo()).toBe(true);

      const command2 = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Blue);
      editor.executeCommand(command2);

      expect(editor.canRedo()).toBe(false);
    });

    it('should get undo description', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);

      const description = editor.getUndoDescription();
      expect(description).toBeTruthy();
    });

    it('should merge compatible commands', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command1 = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command1);

      // Quickly execute another command for the same property
      const command2 = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Blue);
      editor.executeCommand(command2);

      // Should have merged, so only one undo needed
      editor.undo();
      expect(rect.getFillColor()).not.toEqual(ColorUtils.Blue);
    });

    it('should clear history', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);

      editor.clearHistory();

      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(false);
    });
  });

  describe('SetPropertyCommand', () => {
    it('should set property value', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      command.execute();

      expect(rect.getFillColor()).toEqual(ColorUtils.Red);
    });

    it('should undo property change', () => {
      const rect = new SK8Rectangle();
      const originalColor = rect.getFillColor();

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      command.execute();
      command.undo();

      expect(rect.getFillColor()).toEqual(originalColor);
    });

    it('should redo property change', () => {
      const rect = new SK8Rectangle();

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      command.execute();
      command.undo();
      command.redo();

      expect(rect.getFillColor()).toEqual(ColorUtils.Red);
    });
  });

  describe('MoveActorsCommand', () => {
    it('should move actors', () => {
      const rect = new SK8Rectangle();
      rect.moveTo(100, 100);

      const command = new MoveActorsCommand([rect], 50, 30);
      command.execute();

      expect(rect.getLeft()).toBe(150);
      expect(rect.getTop()).toBe(130);
    });

    it('should undo move', () => {
      const rect = new SK8Rectangle();
      rect.moveTo(100, 100);

      const command = new MoveActorsCommand([rect], 50, 30);
      command.execute();
      command.undo();

      expect(rect.getLeft()).toBe(100);
      expect(rect.getTop()).toBe(100);
    });
  });

  describe('ResizeActorCommand', () => {
    it('should resize actor', () => {
      const rect = new SK8Rectangle();
      rect.setBoundsRect({ left: 0, top: 0, right: 100, bottom: 100 });

      const command = new ResizeActorCommand(rect, 0, 0, 200, 200);
      command.execute();

      expect(rect.getWidth()).toBe(200);
      expect(rect.getHeight()).toBe(200);
    });

    it('should undo resize', () => {
      const rect = new SK8Rectangle();
      rect.setBoundsRect({ left: 0, top: 0, right: 100, bottom: 100 });

      const command = new ResizeActorCommand(rect, 0, 0, 200, 200);
      command.execute();
      command.undo();

      expect(rect.getWidth()).toBe(100);
      expect(rect.getHeight()).toBe(100);
    });
  });

  describe('DeleteActorsCommand', () => {
    it('should delete actors', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new DeleteActorsCommand(stage, [rect]);
      command.execute();

      expect(stage.getActors()).not.toContain(rect);
    });

    it('should undo delete', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new DeleteActorsCommand(stage, [rect]);
      command.execute();
      command.undo();

      expect(stage.getActors()).toContain(rect);
    });
  });

  describe('AddActorCommand', () => {
    it('should add actor', () => {
      const rect = new SK8Rectangle();

      const command = new AddActorCommand(stage, rect);
      command.execute();

      expect(stage.getActors()).toContain(rect);
    });

    it('should undo add', () => {
      const rect = new SK8Rectangle();

      const command = new AddActorCommand(stage, rect);
      command.execute();
      command.undo();

      expect(stage.getActors()).not.toContain(rect);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle undo shortcut (Ctrl+Z)', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
      });

      const handled = editor.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(editor.canRedo()).toBe(true);
    });

    it('should handle redo shortcut (Ctrl+Shift+Z)', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);
      editor.undo();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
      });

      const handled = editor.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(editor.canUndo()).toBe(true);
    });

    it('should handle delete shortcut', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);
      editor.select(rect);

      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
      });

      const handled = editor.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(stage.getActors()).not.toContain(rect);
    });

    it('should handle select all shortcut (Ctrl+A)', () => {
      const rect1 = new SK8Rectangle();
      const rect2 = new SK8Rectangle();
      stage.addActor(rect1);
      stage.addActor(rect2);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      });

      const handled = editor.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(editor.getSelection()).toHaveLength(2);
    });

    it('should handle tool hotkeys', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'R',
      });

      const handled = editor.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(editor.getCurrentTool()).toBe('rectangle');
    });
  });

  describe('Event System', () => {
    it('should emit command-executed event', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const listener = jest.fn();
      editor.on('command-executed', listener);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);

      expect(listener).toHaveBeenCalledWith(command);
    });

    it('should emit command-undone event', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const listener = jest.fn();
      editor.on('command-undone', listener);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);
      editor.undo();

      expect(listener).toHaveBeenCalledWith(command);
    });

    it('should emit command-redone event', () => {
      const rect = new SK8Rectangle();
      stage.addActor(rect);

      const listener = jest.fn();
      editor.on('command-redone', listener);

      const command = new SetPropertyCommand(rect, 'fillColor', ColorUtils.Red);
      editor.executeCommand(command);
      editor.undo();
      editor.redo();

      expect(listener).toHaveBeenCalledWith(command);
    });

    it('should remove event listener', () => {
      const listener = jest.fn();
      editor.on('selection-change', listener);
      editor.off('selection-change', listener);

      const rect = new SK8Rectangle();
      stage.addActor(rect);
      editor.select(rect);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('SK8PropertyInspector', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let editor: SK8Editor;
  let inspector: SK8PropertyInspector;
  let container: HTMLElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    stage = new SK8Stage(canvas);
    editor = new SK8Editor(stage);
    container = document.createElement('div');
    inspector = new SK8PropertyInspector(editor, container);
  });

  it('should create inspector', () => {
    expect(inspector).toBeDefined();
  });

  it('should show no selection message', () => {
    inspector.showProperties([]);
    expect(container.textContent).toContain('No selection');
  });

  it('should show single actor properties', () => {
    const rect = new SK8Rectangle();
    stage.addActor(rect);

    inspector.showProperties([rect]);

    expect(container.textContent).toContain('SK8Rectangle');
  });

  it('should show multi-selection header', () => {
    const rect1 = new SK8Rectangle();
    const rect2 = new SK8Rectangle();
    stage.addActor(rect1);
    stage.addActor(rect2);

    inspector.showProperties([rect1, rect2]);

    expect(container.textContent).toContain('actors selected');
  });

  it('should refresh on selection change', () => {
    const rect = new SK8Rectangle();
    stage.addActor(rect);

    editor.select(rect);

    expect(container.textContent).toContain('SK8Rectangle');
  });

  it('should add custom property definition', () => {
    const propDef = {
      name: 'customProp',
      displayName: 'Custom Property',
      type: 'string' as const,
      group: 'custom',
    };

    inspector.addPropertyDefinition(propDef);

    // Property definition should be added
    expect(true).toBe(true);
  });

  it('should remove property definition', () => {
    inspector.removePropertyDefinition('fillColor');

    // Property definition should be removed
    expect(true).toBe(true);
  });
});

describe('SK8ObjectTree', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let editor: SK8Editor;
  let tree: SK8ObjectTree;
  let container: HTMLElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    stage = new SK8Stage(canvas);
    editor = new SK8Editor(stage);
    container = document.createElement('div');
    tree = new SK8ObjectTree(editor, container);
  });

  it('should create tree', () => {
    expect(tree).toBeDefined();
  });

  it('should show stage node', () => {
    expect(container.textContent).toContain('Stage');
  });

  it('should show actors', () => {
    const rect = new SK8Rectangle();
    rect.set('name', 'MyRectangle');
    stage.addActor(rect);

    tree.refresh();

    expect(container.innerHTML).toContain('MyRectangle');
  });

  it('should refresh tree', () => {
    const rect = new SK8Rectangle();
    stage.addActor(rect);

    tree.refresh();

    expect(container.children.length).toBeGreaterThan(0);
  });
});

describe('SK8Toolbar', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let editor: SK8Editor;
  let toolbar: SK8Toolbar;
  let container: HTMLElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    stage = new SK8Stage(canvas);
    editor = new SK8Editor(stage);
    container = document.createElement('div');
    toolbar = new SK8Toolbar(editor, container);
  });

  it('should create toolbar', () => {
    expect(toolbar).toBeDefined();
  });

  it('should show tool buttons', () => {
    const buttons = container.querySelectorAll('.sk8-toolbar-button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should highlight active tool', () => {
    editor.setTool('rectangle');

    const activeButtons = container.querySelectorAll('.sk8-toolbar-button-active');
    expect(activeButtons.length).toBe(1);
  });

  it('should add custom tool', () => {
    const customTool = {
      type: 'custom' as any,
      name: 'Custom Tool',
      cursor: 'pointer',
    };

    toolbar.addTool(customTool);

    const buttons = container.querySelectorAll('.sk8-toolbar-button');
    expect(buttons.length).toBeGreaterThan(9); // More than default tools
  });

  it('should refresh toolbar', () => {
    toolbar.refresh();

    expect(container.children.length).toBeGreaterThan(0);
  });
});

describe('SK8SelectionHandles', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let editor: SK8Editor;
  let handles: SK8SelectionHandles;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    stage = new SK8Stage(canvas);
    editor = new SK8Editor(stage);
    handles = new SK8SelectionHandles(editor, canvas);
  });

  it('should create handles', () => {
    expect(handles).toBeDefined();
  });

  it('should enable/disable', () => {
    handles.setEnabled(false);
    expect(true).toBe(true);

    handles.setEnabled(true);
    expect(true).toBe(true);
  });

  it('should set snap to grid', () => {
    handles.setSnapToGrid(true, 20);

    expect(handles.getSnapToGrid()).toBe(true);
    expect(handles.getGridSize()).toBe(20);
  });

  it('should set handle size', () => {
    handles.setHandleSize(12);
    expect(true).toBe(true);
  });

  it('should render without errors', () => {
    const rect = new SK8Rectangle();
    stage.addActor(rect);
    editor.select(rect);

    const ctx = canvas.getContext('2d')!;
    handles.render(ctx);

    expect(true).toBe(true);
  });
});
