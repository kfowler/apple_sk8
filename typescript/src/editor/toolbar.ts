/**
 * SK8Toolbar - Tool selection and management UI
 *
 * Features:
 * - Tool definitions: select, rectangle, circle, text, etc.
 * - Tool activation and deactivation
 * - Tool-specific cursors
 * - Keyboard shortcuts
 * - Visual feedback for active tool
 */

import { SK8Editor, ToolType, EditorTool } from './editor.js';
import { SK8Rectangle, SK8RoundRect, SK8Circle, SK8Line, SK8Text } from '../graphics/shapes.js';
import { SK8Arrow } from '../actors/Arrow.js';
import { SK8Star } from '../actors/Star.js';
import { SK8Polygon } from '../graphics/advanced-shapes.js';
import { AddActorCommand } from './editor.js';
import { ColorUtils } from '../graphics/types.js';

/**
 * Tool button configuration
 */
export interface ToolButton {
  tool: EditorTool;
  element?: HTMLElement;
}

/**
 * Toolbar UI
 */
export class SK8Toolbar {
  private container: HTMLElement;
  private editor: SK8Editor;
  private toolButtons: Map<ToolType, ToolButton> = new Map();

  constructor(editor: SK8Editor, container: HTMLElement) {
    this.editor = editor;
    this.container = container;
    this.setupTools();
    this.render();
    this.setupEventListeners();
  }

  /**
   * Setup tool implementations
   */
  private setupTools(): void {
    const tools = this.editor.getTools();

    for (const tool of tools) {
      // Add tool behavior
      this.enhanceToolWithBehavior(tool);
      this.toolButtons.set(tool.type, { tool });
    }
  }

  /**
   * Enhance tool with drawing behavior
   */
  private enhanceToolWithBehavior(tool: EditorTool): void {
    switch (tool.type) {
      case 'rectangle':
        this.addRectangleTool(tool);
        break;
      case 'roundrect':
        this.addRoundRectTool(tool);
        break;
      case 'circle':
        this.addCircleTool(tool);
        break;
      case 'line':
        this.addLineTool(tool);
        break;
      case 'text':
        this.addTextTool(tool);
        break;
      case 'arrow':
        this.addArrowTool(tool);
        break;
      case 'star':
        this.addStarTool(tool);
        break;
      case 'polygon':
        this.addPolygonTool(tool);
        break;
    }
  }

  /**
   * Add rectangle tool behavior
   */
  private addRectangleTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      // Create rectangle
      const rect = new SK8Rectangle();
      rect.setBoundsRect({ left: x, top: y, right: x, bottom: y });
      rect.setFillColor(ColorUtils.fromRGB(100, 150, 255));
      rect.setFrameColor(ColorUtils.Black);

      state.currentActor = rect;
      editor.getStage().addActor(rect);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        // Add to undo stack
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));

        state.isDrawing = false;
        state.currentActor = undefined;

        // Auto-switch to select tool after creating
        editor.setTool('select');
      }
    };
  }

  /**
   * Add round rect tool behavior
   */
  private addRoundRectTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      const roundRect = new SK8RoundRect();
      roundRect.setBoundsRect({ left: x, top: y, right: x, bottom: y });
      roundRect.setFillColor(ColorUtils.fromRGB(100, 150, 255));
      roundRect.setFrameColor(ColorUtils.Black);

      state.currentActor = roundRect;
      editor.getStage().addActor(roundRect);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));
        state.isDrawing = false;
        state.currentActor = undefined;
        editor.setTool('select');
      }
    };
  }

  /**
   * Add circle tool behavior
   */
  private addCircleTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      const circle = new SK8Circle();
      circle.setBoundsRect({ left: x, top: y, right: x, bottom: y });
      circle.setFillColor(ColorUtils.fromRGB(255, 100, 150));
      circle.setFrameColor(ColorUtils.Black);

      state.currentActor = circle;
      editor.getStage().addActor(circle);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));
        state.isDrawing = false;
        state.currentActor = undefined;
        editor.setTool('select');
      }
    };
  }

  /**
   * Add line tool behavior
   */
  private addLineTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      const line = new SK8Line();
      line.setBoundsRect({ left: x, top: y, right: x, bottom: y });
      line.setFrameColor(ColorUtils.Black);

      state.currentActor = line;
      editor.getStage().addActor(line);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));
        state.isDrawing = false;
        state.currentActor = undefined;
        editor.setTool('select');
      }
    };
  }

  /**
   * Add text tool behavior
   */
  private addTextTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const text = new SK8Text();
      text.setBoundsRect({ left: x, top: y, right: x + 100, bottom: y + 30 });
      text.setText('Text');
      text.setFillColor(ColorUtils.Black);

      editor.executeCommand(new AddActorCommand(editor.getStage(), text));
      editor.setTool('select');
    };
  }

  /**
   * Add arrow tool behavior
   */
  private addArrowTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      const arrow = new SK8Arrow();
      arrow.setBoundsRect({ left: x, top: y, right: x + 100, bottom: y + 50 });
      arrow.setFillColor(ColorUtils.fromRGB(150, 200, 100));
      arrow.setFrameColor(ColorUtils.Black);

      state.currentActor = arrow;
      editor.getStage().addActor(arrow);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));
        state.isDrawing = false;
        state.currentActor = undefined;
        editor.setTool('select');
      }
    };
  }

  /**
   * Add star tool behavior
   */
  private addStarTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      const star = new SK8Star();
      star.setBoundsRect({ left: x, top: y, right: x + 100, bottom: y + 100 });
      star.setFillColor(ColorUtils.fromRGB(255, 215, 0));
      star.setFrameColor(ColorUtils.Black);

      state.currentActor = star;
      editor.getStage().addActor(star);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));
        state.isDrawing = false;
        state.currentActor = undefined;
        editor.setTool('select');
      }
    };
  }

  /**
   * Add polygon tool behavior
   */
  private addPolygonTool(tool: EditorTool): void {
    tool.onMouseDown = (editor, x, y) => {
      const state = editor.getToolState();
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      // Create a pentagon as default polygon
      const polygon = new SK8Polygon();
      const points = [
        { x: 50, y: 0 },
        { x: 100, y: 38 },
        { x: 82, y: 100 },
        { x: 18, y: 100 },
        { x: 0, y: 38 },
      ];
      polygon.setPoints(points);
      polygon.setBoundsRect({ left: x, top: y, right: x + 100, bottom: y + 100 });
      polygon.setFillColor(ColorUtils.fromRGB(200, 100, 200));
      polygon.setFrameColor(ColorUtils.Black);

      state.currentActor = polygon;
      editor.getStage().addActor(polygon);
    };

    tool.onMouseMove = (editor, x, y) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        const left = Math.min(state.startX, x);
        const top = Math.min(state.startY, y);
        const right = Math.max(state.startX, x);
        const bottom = Math.max(state.startY, y);

        state.currentActor.setBoundsRect({ left, top, right, bottom });
      }
    };

    tool.onMouseUp = (editor) => {
      const state = editor.getToolState();
      if (state.isDrawing && state.currentActor) {
        editor.executeCommand(new AddActorCommand(editor.getStage(), state.currentActor));
        state.isDrawing = false;
        state.currentActor = undefined;
        editor.setTool('select');
      }
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.editor.on('tool-change', (toolType: ToolType) => {
      this.updateActiveButton(toolType);
    });
  }

  /**
   * Render toolbar
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'sk8-toolbar';

    for (const button of this.toolButtons.values()) {
      const buttonEl = this.createToolButton(button.tool);
      button.element = buttonEl;
      this.container.appendChild(buttonEl);
    }

    // Set initial active button
    this.updateActiveButton(this.editor.getCurrentTool());
  }

  /**
   * Create tool button
   */
  private createToolButton(tool: EditorTool): HTMLElement {
    const button = document.createElement('button');
    button.className = 'sk8-toolbar-button';
    button.title = `${tool.name}${tool.hotkey ? ` (${tool.hotkey})` : ''}`;

    // Icon
    const icon = this.getToolIcon(tool.type);
    button.innerHTML = `<span class="sk8-toolbar-icon">${icon}</span>`;

    // Click handler
    button.onclick = () => {
      this.editor.setTool(tool.type);
    };

    return button;
  }

  /**
   * Get icon for tool
   */
  private getToolIcon(toolType: ToolType): string {
    const icons: Record<ToolType, string> = {
      select: '↖',
      rectangle: '▭',
      roundrect: '▢',
      circle: '⭕',
      line: '╱',
      text: '𝐓',
      arrow: '→',
      star: '⭐',
      polygon: '⬡',
    };

    return icons[toolType] || '?';
  }

  /**
   * Update active button
   */
  private updateActiveButton(toolType: ToolType): void {
    // Remove active class from all buttons
    for (const button of this.toolButtons.values()) {
      button.element?.classList.remove('sk8-toolbar-button-active');
    }

    // Add active class to current button
    const currentButton = this.toolButtons.get(toolType);
    if (currentButton?.element) {
      currentButton.element.classList.add('sk8-toolbar-button-active');
    }
  }

  /**
   * Add custom tool
   */
  addTool(tool: EditorTool): void {
    this.editor.registerTool(tool);
    this.enhanceToolWithBehavior(tool);
    this.toolButtons.set(tool.type, { tool });
    this.render();
  }

  /**
   * Remove tool
   */
  removeTool(toolType: ToolType): void {
    this.toolButtons.delete(toolType);
    this.render();
  }

  /**
   * Refresh toolbar
   */
  refresh(): void {
    this.render();
  }
}
