/**
 * Editor Integration Tests
 * Tests interaction between Editor, PropertyInspector, ObjectTree, and Canvas
 */

import { SK8Editor } from '../../src/editor/editor';
import { SK8Stage } from '../../src/graphics/SK8Stage';
import { Rectangle, Oval } from '../../src/graphics/shapes';
import { createMockCanvas, createTestActor, simulateMouseEvent } from '../utils/test-helpers';

describe('Editor Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;
  let editor: SK8Editor;

  beforeEach(() => {
    canvas = createMockCanvas();
    stage = new SK8Stage(canvas);
    editor = new SK8Editor(stage);
  });

  afterEach(() => {
    editor.destroy?.();
  });

  describe('Selection Synchronization', () => {
    it('should update property inspector when actor is selected', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      rect.setFillColor('#ff0000');
      stage.addActor(rect);

      editor.selectActor(rect);

      const selected = editor.getSelectedActors();
      expect(selected).toHaveLength(1);
      expect(selected[0]).toBe(rect);
    });

    it('should update all panels when selection changes', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.selectActor(rect1);
      expect(editor.getSelectedActors()).toContain(rect1);

      editor.selectActor(rect2);
      expect(editor.getSelectedActors()).toContain(rect2);
      expect(editor.getSelectedActors()).not.toContain(rect1);
    });

    it('should support multi-selection', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      const rect3 = new Rectangle();
      stage.addActor(rect1);
      stage.addActor(rect2);
      stage.addActor(rect3);

      editor.selectActor(rect1);
      editor.addToSelection(rect2);
      editor.addToSelection(rect3);

      const selected = editor.getSelectedActors();
      expect(selected).toHaveLength(3);
      expect(selected).toContain(rect1);
      expect(selected).toContain(rect2);
      expect(selected).toContain(rect3);
    });

    it('should clear selection', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      editor.selectActor(rect);
      expect(editor.getSelectedActors()).toHaveLength(1);

      editor.clearSelection();
      expect(editor.getSelectedActors()).toHaveLength(0);
    });

    it('should emit selection changed events', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const listener = jest.fn();
      editor.on('selectionChanged', listener);

      editor.selectActor(rect);
      expect(listener).toHaveBeenCalledTimes(1);

      editor.clearSelection();
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Property Editing Integration', () => {
    it('should update actor when property is changed', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');
      expect(rect.getFillColor()).toBe('#00ff00');
    });

    it('should reflect property changes in canvas', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      const renderSpy = jest.spyOn(stage, 'render');

      editor.selectActor(rect);
      editor.setProperty(rect, 'left', 200);

      expect(rect.getLeft()).toBe(200);
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should batch property updates', () => {
      const rect = new Rectangle();
      stage.addActor(rect);
      editor.selectActor(rect);

      const renderSpy = jest.spyOn(stage, 'render');
      renderSpy.mockClear();

      editor.beginPropertyBatch();
      editor.setProperty(rect, 'left', 100);
      editor.setProperty(rect, 'top', 100);
      editor.setProperty(rect, 'width', 200);
      editor.setProperty(rect, 'height', 150);
      editor.endPropertyBatch();

      // Should only render once after batch
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should validate property values', () => {
      const rect = new Rectangle();
      stage.addActor(rect);
      editor.selectActor(rect);

      // Negative dimensions should be rejected or corrected
      expect(() => {
        editor.setProperty(rect, 'width', -100);
      }).toThrow();
    });

    it('should support property types (number, string, color, boolean)', () => {
      const rect = new Rectangle();
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'left', 100); // number
      expect(rect.getLeft()).toBe(100);

      editor.setProperty(rect, 'objectName', 'TestRect'); // string
      expect(rect.getProperty('objectName')).toBe('TestRect');

      editor.setProperty(rect, 'fillColor', '#ff0000'); // color
      expect(rect.getFillColor()).toBe('#ff0000');

      editor.setProperty(rect, 'visible', false); // boolean
      expect(rect.getVisible()).toBe(false);
    });
  });

  describe('Undo/Redo Integration', () => {
    it('should undo property changes', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');
      expect(rect.getFillColor()).toBe('#00ff00');

      editor.undo();
      expect(rect.getFillColor()).toBe('#ff0000');
    });

    it('should redo property changes', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');
      editor.undo();
      editor.redo();

      expect(rect.getFillColor()).toBe('#00ff00');
    });

    it('should undo actor creation', () => {
      const initialCount = stage.getActors().length;

      const rect = editor.createActor('Rectangle');
      expect(stage.getActors()).toHaveLength(initialCount + 1);

      editor.undo();
      expect(stage.getActors()).toHaveLength(initialCount);
    });

    it('should undo actor deletion', () => {
      const rect = new Rectangle();
      stage.addActor(rect);
      const initialCount = stage.getActors().length;

      editor.selectActor(rect);
      editor.deleteSelected();
      expect(stage.getActors()).toHaveLength(initialCount - 1);

      editor.undo();
      expect(stage.getActors()).toHaveLength(initialCount);
    });

    it('should support multiple undo levels', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');
      editor.setProperty(rect, 'fillColor', '#0000ff');
      editor.setProperty(rect, 'fillColor', '#ffff00');

      expect(rect.getFillColor()).toBe('#ffff00');

      editor.undo();
      expect(rect.getFillColor()).toBe('#0000ff');

      editor.undo();
      expect(rect.getFillColor()).toBe('#00ff00');

      editor.undo();
      expect(rect.getFillColor()).toBe('#ff0000');
    });
  });

  describe('Save/Load Integration', () => {
    it('should save and restore editor state', async () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      rect.setFillColor('#ff0000');
      rect.setProperty('objectName', 'MyRect');
      stage.addActor(rect);

      const savedState = await editor.saveState();
      expect(savedState).toBeDefined();
      expect(savedState.actors).toHaveLength(1);

      // Clear and restore
      stage.removeAllActors();
      expect(stage.getActors()).toHaveLength(0);

      await editor.loadState(savedState);
      expect(stage.getActors()).toHaveLength(1);

      const restored = stage.getActors()[0] as Rectangle;
      expect(restored.getLeft()).toBe(100);
      expect(restored.getTop()).toBe(100);
      expect(restored.getWidth()).toBe(200);
      expect(restored.getHeight()).toBe(150);
      expect(restored.getFillColor()).toBe('#ff0000');
      expect(restored.getProperty('objectName')).toBe('MyRect');
    });

    it('should preserve selection after save/load', async () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      rect1.setProperty('objectName', 'Rect1');
      rect2.setProperty('objectName', 'Rect2');
      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.selectActor(rect1);

      const savedState = await editor.saveState();
      await editor.loadState(savedState);

      const selected = editor.getSelectedActors();
      expect(selected).toHaveLength(1);
      expect(selected[0].getProperty('objectName')).toBe('Rect1');
    });

    it('should save undo history', async () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');
      editor.setProperty(rect, 'fillColor', '#0000ff');

      const savedState = await editor.saveState();

      expect(savedState.undoStack).toBeDefined();
      expect(savedState.undoStack.length).toBeGreaterThan(0);
    });
  });

  describe('Object Tree Integration', () => {
    it('should reflect stage hierarchy in object tree', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      const oval = new Oval();

      rect1.setProperty('objectName', 'Rect1');
      rect2.setProperty('objectName', 'Rect2');
      oval.setProperty('objectName', 'Oval1');

      stage.addActor(rect1);
      stage.addActor(rect2);
      stage.addActor(oval);

      const tree = editor.getObjectTree();
      expect(tree.getItems()).toHaveLength(3);
    });

    it('should update object tree when actors are added', () => {
      const tree = editor.getObjectTree();
      const initialCount = tree.getItems().length;

      const rect = editor.createActor('Rectangle');
      expect(tree.getItems()).toHaveLength(initialCount + 1);
    });

    it('should update object tree when actors are removed', () => {
      const rect = new Rectangle();
      stage.addActor(rect);

      const tree = editor.getObjectTree();
      const initialCount = tree.getItems().length;

      editor.selectActor(rect);
      editor.deleteSelected();

      expect(tree.getItems()).toHaveLength(initialCount - 1);
    });

    it('should sync selection between tree and canvas', () => {
      const rect = new Rectangle();
      rect.setProperty('objectName', 'TestRect');
      stage.addActor(rect);

      const tree = editor.getObjectTree();
      tree.selectItem(rect);

      expect(editor.getSelectedActors()).toContain(rect);
    });
  });

  describe('Drag and Drop Integration', () => {
    it('should move actors by dragging on canvas', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      editor.selectActor(rect);

      // Simulate drag
      simulateMouseEvent(canvas, 'mousedown', { clientX: 150, clientY: 150 });
      simulateMouseEvent(canvas, 'mousemove', { clientX: 250, clientY: 250 });
      simulateMouseEvent(canvas, 'mouseup', { clientX: 250, clientY: 250 });

      // Position should have changed
      const newLeft = rect.getLeft();
      const newTop = rect.getTop();

      expect(newLeft).not.toBe(100);
      expect(newTop).not.toBe(100);
    });

    it('should support dragging multiple selected actors', () => {
      const rect1 = new Rectangle();
      const rect2 = new Rectangle();
      rect1.setBounds({ left: 100, top: 100, width: 100, height: 100 });
      rect2.setBounds({ left: 300, top: 100, width: 100, height: 100 });
      stage.addActor(rect1);
      stage.addActor(rect2);

      editor.selectActor(rect1);
      editor.addToSelection(rect2);

      const initialLeft1 = rect1.getLeft();
      const initialLeft2 = rect2.getLeft();

      // Drag first rect
      simulateMouseEvent(canvas, 'mousedown', { clientX: 150, clientY: 150 });
      simulateMouseEvent(canvas, 'mousemove', { clientX: 200, clientY: 200 });
      simulateMouseEvent(canvas, 'mouseup', { clientX: 200, clientY: 200 });

      // Both should have moved by the same delta
      const deltaLeft1 = rect1.getLeft() - initialLeft1;
      const deltaLeft2 = rect2.getLeft() - initialLeft2;

      expect(deltaLeft1).toBe(deltaLeft2);
    });

    it('should show selection handles during drag', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      editor.selectActor(rect);

      const handles = editor.getSelectionHandles();
      expect(handles).toBeDefined();
      expect(handles.isVisible()).toBe(true);
    });

    it('should support resize handles', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);

      editor.selectActor(rect);

      const handles = editor.getSelectionHandles();
      const bottomRight = handles.getHandle('bottom-right');

      // Drag bottom-right handle
      const handlePos = bottomRight.getPosition();
      simulateMouseEvent(canvas, 'mousedown', { clientX: handlePos.x, clientY: handlePos.y });
      simulateMouseEvent(canvas, 'mousemove', { clientX: handlePos.x + 50, clientY: handlePos.y + 50 });
      simulateMouseEvent(canvas, 'mouseup', { clientX: handlePos.x + 50, clientY: handlePos.y + 50 });

      expect(rect.getWidth()).toBeGreaterThan(200);
      expect(rect.getHeight()).toBeGreaterThan(150);
    });
  });

  describe('Tool Integration', () => {
    it('should create actors using tool palette', () => {
      const toolbar = editor.getToolbar();
      toolbar.selectTool('Rectangle');

      const initialCount = stage.getActors().length;

      // Click to create
      simulateMouseEvent(canvas, 'mousedown', { clientX: 100, clientY: 100 });
      simulateMouseEvent(canvas, 'mousemove', { clientX: 300, clientY: 250 });
      simulateMouseEvent(canvas, 'mouseup', { clientX: 300, clientY: 250 });

      expect(stage.getActors()).toHaveLength(initialCount + 1);

      const newRect = stage.getActors()[stage.getActors().length - 1] as Rectangle;
      expect(newRect).toBeInstanceOf(Rectangle);
    });

    it('should switch between selection and creation tools', () => {
      const toolbar = editor.getToolbar();

      toolbar.selectTool('Selection');
      expect(toolbar.getCurrentTool()).toBe('Selection');

      toolbar.selectTool('Oval');
      expect(toolbar.getCurrentTool()).toBe('Oval');

      toolbar.selectTool('Selection');
      expect(toolbar.getCurrentTool()).toBe('Selection');
    });

    it('should cancel tool operation on escape', () => {
      const toolbar = editor.getToolbar();
      toolbar.selectTool('Rectangle');

      // Start creating
      simulateMouseEvent(canvas, 'mousedown', { clientX: 100, clientY: 100 });
      simulateMouseEvent(canvas, 'mousemove', { clientX: 200, clientY: 200 });

      // Press escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      canvas.dispatchEvent(escapeEvent);

      // Should cancel and return to selection tool
      expect(toolbar.getCurrentTool()).toBe('Selection');
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should delete selected actors with Delete key', () => {
      const rect = new Rectangle();
      stage.addActor(rect);
      editor.selectActor(rect);

      const initialCount = stage.getActors().length;

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      expect(stage.getActors()).toHaveLength(initialCount - 1);
    });

    it('should undo with Ctrl+Z', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');

      const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      document.dispatchEvent(undoEvent);

      expect(rect.getFillColor()).toBe('#ff0000');
    });

    it('should redo with Ctrl+Y', () => {
      const rect = new Rectangle();
      rect.setFillColor('#ff0000');
      stage.addActor(rect);
      editor.selectActor(rect);

      editor.setProperty(rect, 'fillColor', '#00ff00');
      editor.undo();

      const redoEvent = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
      document.dispatchEvent(redoEvent);

      expect(rect.getFillColor()).toBe('#00ff00');
    });

    it('should copy with Ctrl+C and paste with Ctrl+V', () => {
      const rect = new Rectangle();
      rect.setBounds({ left: 100, top: 100, width: 200, height: 150 });
      stage.addActor(rect);
      editor.selectActor(rect);

      const initialCount = stage.getActors().length;

      // Copy
      const copyEvent = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      document.dispatchEvent(copyEvent);

      // Paste
      const pasteEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      document.dispatchEvent(pasteEvent);

      expect(stage.getActors()).toHaveLength(initialCount + 1);
    });
  });
});
