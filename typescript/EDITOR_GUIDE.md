# SK8 Visual Editor Guide

**Phase 4: Visual IDE Foundation**

This guide covers the SK8 Visual Editor system, providing a comprehensive IDE for creating and editing SK8 applications.

## Overview

The SK8 Visual Editor is a complete visual development environment that includes:

- **Editor Infrastructure**: Selection management, undo/redo, tool system
- **Property Inspector**: Live property editing with type-specific editors
- **Object Tree**: Hierarchical view of stage and actors with drag-reorder
- **Toolbar**: Tool palette for creating shapes and selecting objects
- **Selection Handles**: Visual handles for moving, resizing, and rotating actors

## Table of Contents

- [Quick Start](#quick-start)
- [Editor Core](#editor-core)
- [Property Inspector](#property-inspector)
- [Object Tree](#object-tree)
- [Toolbar System](#toolbar-system)
- [Selection Handles](#selection-handles)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Custom Tools](#custom-tools)
- [Commands](#commands)
- [Examples](#examples)

## Quick Start

```typescript
import {
  SK8Stage,
  SK8Editor,
  SK8PropertyInspector,
  SK8ObjectTree,
  SK8Toolbar,
  SK8SelectionHandles,
} from './sk8.js';

// Create stage
const canvas = document.getElementById('canvas');
const stage = new SK8Stage(canvas);

// Create editor
const editor = new SK8Editor(stage);

// Setup UI components
const toolbar = new SK8Toolbar(editor, document.getElementById('toolbar'));
const inspector = new SK8PropertyInspector(editor, document.getElementById('inspector'));
const tree = new SK8ObjectTree(editor, document.getElementById('tree'));
const handles = new SK8SelectionHandles(editor, canvas);

// Start rendering
stage.startRendering();

// Render selection handles in your render loop
function renderLoop() {
  const ctx = canvas.getContext('2d');
  stage.render();
  handles.render(ctx);
  requestAnimationFrame(renderLoop);
}
renderLoop();
```

## Editor Core

### Creating an Editor

```typescript
const editor = new SK8Editor(stage);
```

### Selection Management

```typescript
// Select a single actor
editor.select(actor);

// Add to selection
editor.select(actor, true);

// Deselect an actor
editor.deselect(actor);

// Clear selection
editor.clearSelection();

// Set selection to multiple actors
editor.setSelection([actor1, actor2, actor3]);

// Get current selection
const selection = editor.getSelection();

// Check if actor is selected
if (editor.isSelected(actor)) {
  // ...
}

// Select actors in a rectangle
editor.selectInRect(left, top, right, bottom);
```

### Tool Management

```typescript
// Get current tool
const currentTool = editor.getCurrentTool(); // 'select', 'rectangle', etc.

// Set tool
editor.setTool('rectangle');

// Get tool definition
const tool = editor.getTool('rectangle');

// Get all tools
const tools = editor.getTools();
```

### Undo/Redo

```typescript
// Execute a command
editor.executeCommand(new SetPropertyCommand(actor, 'fillColor', ColorUtils.Red));

// Undo
editor.undo();

// Redo
editor.redo();

// Check if can undo/redo
if (editor.canUndo()) {
  editor.undo();
}

if (editor.canRedo()) {
  editor.redo();
}

// Get undo/redo descriptions
const undoDesc = editor.getUndoDescription(); // "Set fillColor to red"
const redoDesc = editor.getRedoDescription();

// Clear history
editor.clearHistory();
```

### Events

```typescript
// Listen for selection changes
editor.on('selection-change', (actors) => {
  console.log('Selection changed:', actors);
});

// Listen for tool changes
editor.on('tool-change', (toolType) => {
  console.log('Tool changed to:', toolType);
});

// Listen for commands
editor.on('command-executed', (command) => {
  console.log('Command executed:', command.description);
});

editor.on('command-undone', (command) => {
  console.log('Command undone:', command.description);
});

editor.on('command-redone', (command) => {
  console.log('Command redone:', command.description);
});

// Remove listener
editor.off('selection-change', listener);
```

## Property Inspector

### Creating an Inspector

```typescript
const container = document.getElementById('inspector');
const inspector = new SK8PropertyInspector(editor, container);
```

### Showing Properties

```typescript
// Show properties for actors (automatically updates on selection change)
inspector.showProperties([actor1, actor2]);

// Refresh display
inspector.refresh();
```

### Custom Properties

```typescript
// Add custom property definition
inspector.addPropertyDefinition({
  name: 'customProp',
  displayName: 'Custom Property',
  type: 'number',
  group: 'custom',
  min: 0,
  max: 100,
  step: 1,
});

// Remove property definition
inspector.removePropertyDefinition('customProp');
```

### Property Types

The inspector supports various property types:

- **string**: Text input
- **number**: Number input with optional min/max/step
- **boolean**: Checkbox
- **color**: Color picker
- **enum**: Dropdown select with options

### Property Groups

Properties are organized into groups:

- **identity**: Name and identifying information
- **appearance**: Fill color, frame color, opacity, visibility
- **layout**: Position (left, top) and size (width, height)
- **transform**: Rotation, scale, skew
- **behavior**: Draggable, droppable, etc.

## Object Tree

### Creating a Tree

```typescript
const container = document.getElementById('tree');
const tree = new SK8ObjectTree(editor, container);
```

### Tree Operations

```typescript
// Refresh tree display
tree.refresh();

// Expand/collapse all nodes
tree.expandAll();
tree.collapseAll();

// Filter tree by search term
tree.filter('rectangle');
```

### Tree Features

- **Click to select**: Click on a node to select the actor
- **Multi-select**: Shift+click or Ctrl/Cmd+click for multi-select
- **Double-click to focus**: Centers view on actor (TODO)
- **Drag to reorder**: Drag and drop nodes to change z-order
- **Visibility toggle**: Eye icon to show/hide actors
- **Type indicators**: Icons show actor type

## Toolbar System

### Creating a Toolbar

```typescript
const container = document.getElementById('toolbar');
const toolbar = new SK8Toolbar(editor, container);
```

### Built-in Tools

- **select** (V): Selection tool
- **rectangle** (R): Draw rectangles
- **roundrect** (U): Draw rounded rectangles
- **circle** (C): Draw circles
- **line** (L): Draw lines
- **text** (T): Create text objects
- **arrow** (A): Draw arrows
- **star** (S): Draw stars
- **polygon** (P): Draw polygons

### Tool Lifecycle

When a drawing tool is active:

1. **mousedown**: Creates the actor and starts drawing
2. **mousemove**: Updates the actor's size as you drag
3. **mouseup**: Finalizes the actor and switches back to select tool

### Custom Tools

```typescript
// Add custom tool
const customTool = {
  type: 'custom',
  name: 'Custom Tool',
  cursor: 'crosshair',
  hotkey: 'X',
  onMouseDown: (editor, x, y) => {
    // Create custom actor
  },
  onMouseMove: (editor, x, y) => {
    // Update during drag
  },
  onMouseUp: (editor, x, y) => {
    // Finalize
  },
  onActivate: (editor) => {
    // Tool activated
  },
  onDeactivate: (editor) => {
    // Tool deactivated
  },
};

toolbar.addTool(customTool);

// Remove tool
toolbar.removeTool('custom');

// Refresh toolbar
toolbar.refresh();
```

## Selection Handles

### Creating Handles

```typescript
const handles = new SK8SelectionHandles(editor, canvas);
```

### Rendering Handles

```typescript
function renderLoop() {
  const ctx = canvas.getContext('2d');
  stage.render();
  handles.render(ctx);
  requestAnimationFrame(renderLoop);
}
```

### Handle Types

- **Corner handles**: Resize from corners (8 total)
- **Edge handles**: Resize from edges
- **Rotation handle**: Rotate actor (above top center)

### Handle Features

- **Drag to move**: Click and drag selected actors
- **Drag handles to resize**: Click and drag resize handles
- **Maintain aspect ratio**: Hold Shift while resizing
- **Snap to grid**: Enable snap-to-grid mode

### Configuration

```typescript
// Enable/disable handles
handles.setEnabled(true);

// Enable snap to grid
handles.setSnapToGrid(true, 20); // 20px grid

// Disable snap to grid
handles.setSnapToGrid(false);

// Change handle size
handles.setHandleSize(10);

// Get settings
const snapEnabled = handles.getSnapToGrid();
const gridSize = handles.getGridSize();
```

## Keyboard Shortcuts

### Editor Shortcuts

- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Shift + Z**: Redo
- **Ctrl/Cmd + Y**: Redo (alternative)
- **Delete / Backspace**: Delete selection
- **Ctrl/Cmd + A**: Select all

### Tool Shortcuts

- **V**: Select tool
- **R**: Rectangle tool
- **U**: Rounded rectangle tool
- **C**: Circle tool
- **L**: Line tool
- **T**: Text tool
- **A**: Arrow tool
- **S**: Star tool
- **P**: Polygon tool

### Handle Shortcuts

- **Shift + Drag**: Maintain aspect ratio while resizing

### Implementing Shortcuts

```typescript
document.addEventListener('keydown', (e) => {
  const handled = editor.handleKeyDown(e);
  if (handled) {
    e.preventDefault();
  }
});
```

## Commands

Commands implement the command pattern for undo/redo functionality.

### Built-in Commands

```typescript
// Set property
new SetPropertyCommand(actor, 'fillColor', ColorUtils.Red);

// Move actors
new MoveActorsCommand([actor1, actor2], dx, dy);

// Resize actor
new ResizeActorCommand(actor, left, top, right, bottom);

// Delete actors
new DeleteActorsCommand(stage, [actor1, actor2]);

// Add actor
new AddActorCommand(stage, actor);
```

### Custom Commands

```typescript
import { BaseCommand } from './sk8.js';

class CustomCommand extends BaseCommand {
  constructor(private target: any, private data: any) {
    super();
  }

  get description(): string {
    return 'Custom operation';
  }

  execute(): void {
    // Perform the operation
    // Store any state needed for undo
  }

  undo(): void {
    // Reverse the operation
  }

  // Optional: merge with similar commands
  canMerge(other: EditorCommand): boolean {
    return other instanceof CustomCommand && other.target === this.target;
  }

  merge(other: EditorCommand): void {
    // Merge with other command
  }
}

// Use custom command
editor.executeCommand(new CustomCommand(target, data));
```

## Examples

### Basic Editor Setup

```typescript
import {
  SK8Stage,
  SK8Editor,
  SK8PropertyInspector,
  SK8ObjectTree,
  SK8Toolbar,
  SK8SelectionHandles,
  SK8Rectangle,
  ColorUtils,
} from './sk8.js';

// Setup
const canvas = document.getElementById('canvas');
const stage = new SK8Stage(canvas);
const editor = new SK8Editor(stage);

// UI Components
const toolbar = new SK8Toolbar(editor, document.getElementById('toolbar'));
const inspector = new SK8PropertyInspector(editor, document.getElementById('inspector'));
const tree = new SK8ObjectTree(editor, document.getElementById('tree'));
const handles = new SK8SelectionHandles(editor, canvas);

// Add some objects
const rect = new SK8Rectangle();
rect.setBoundsRect({ left: 100, top: 100, right: 200, bottom: 200 });
rect.setFillColor(ColorUtils.Blue);
rect.setProperty('name', 'My Rectangle');
stage.addActor(rect);

// Start rendering
stage.startRendering();

function renderLoop() {
  const ctx = canvas.getContext('2d');
  stage.render();
  handles.render(ctx);
  requestAnimationFrame(renderLoop);
}
renderLoop();
```

### Interactive Canvas

```typescript
// Handle canvas interactions
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const currentTool = editor.getCurrentTool();

  if (currentTool === 'select') {
    const actor = stage.actorAtPoint(x, y);
    if (actor) {
      editor.select(actor, e.shiftKey || e.metaKey || e.ctrlKey);
    } else {
      editor.clearSelection();
    }
  } else {
    const tool = editor.getTool(currentTool);
    if (tool?.onMouseDown) {
      tool.onMouseDown(editor, x, y);
      tree.refresh();
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const tool = editor.getTool(editor.getCurrentTool());
  if (tool?.onMouseMove) {
    tool.onMouseMove(editor, x, y);
  }
});

canvas.addEventListener('mouseup', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const tool = editor.getTool(editor.getCurrentTool());
  if (tool?.onMouseUp) {
    tool.onMouseUp(editor, x, y);
    tree.refresh();
  }
});
```

### Undo/Redo UI

```typescript
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

function updateUndoRedoButtons() {
  undoBtn.disabled = !editor.canUndo();
  redoBtn.disabled = !editor.canRedo();

  const undoDesc = editor.getUndoDescription();
  const redoDesc = editor.getRedoDescription();

  undoBtn.textContent = undoDesc ? `Undo: ${undoDesc}` : 'Undo';
  redoBtn.textContent = redoDesc ? `Redo: ${redoDesc}` : 'Redo';
}

undoBtn.addEventListener('click', () => {
  editor.undo();
  updateUndoRedoButtons();
});

redoBtn.addEventListener('click', () => {
  editor.redo();
  updateUndoRedoButtons();
});

editor.on('command-executed', updateUndoRedoButtons);
editor.on('command-undone', updateUndoRedoButtons);
editor.on('command-redone', updateUndoRedoButtons);
```

### Status Bar Updates

```typescript
editor.on('selection-change', (actors) => {
  const statusEl = document.getElementById('status');
  if (actors.length === 0) {
    statusEl.textContent = 'No selection';
  } else if (actors.length === 1) {
    statusEl.textContent = `Selected: ${actors[0].constructor.name}`;
  } else {
    statusEl.textContent = `Selected: ${actors.length} actors`;
  }
});

editor.on('tool-change', (tool) => {
  const toolEl = document.getElementById('tool-status');
  toolEl.textContent = `Tool: ${tool}`;
});
```

## Architecture

### Component Relationships

```
SK8Editor (Core)
├── Selection Management
├── Tool System
├── Command System (Undo/Redo)
└── Event System

SK8PropertyInspector
└── Listens to: selection-change

SK8ObjectTree
├── Listens to: selection-change
└── Listens to: actor-created, actor-deleted

SK8Toolbar
└── Listens to: tool-change

SK8SelectionHandles
└── Listens to: selection-change
```

### Data Flow

1. **User Action** → Canvas event
2. **Editor** → Updates selection/tool state
3. **Command** → Executes operation
4. **Event** → Emitted to listeners
5. **UI Components** → Update displays

### Command Pattern

Commands encapsulate operations and enable undo/redo:

1. User performs action
2. Command is created and executed
3. Command is added to undo stack
4. Redo stack is cleared
5. User undoes → Command is moved to redo stack
6. User redoes → Command is moved back to undo stack

## Best Practices

### Performance

- Use dirty rectangle optimization for rendering
- Batch property updates when possible
- Limit undo stack size (default: 100)
- Command merging for rapid property changes

### Extensibility

- Create custom commands for complex operations
- Add custom tools for specialized drawing
- Extend property inspector with custom properties
- Use event system for loose coupling

### User Experience

- Provide visual feedback for all actions
- Show undo/redo descriptions
- Implement keyboard shortcuts
- Support multi-select operations
- Auto-switch to select tool after creating objects

## Testing

Run the test suite:

```bash
npm test tests/editor.test.ts
```

The test suite includes 40+ tests covering:

- Selection management
- Tool switching
- Command execution and undo/redo
- Property updates
- Event handling
- UI component integration

## Demo

Open the demo in your browser:

```bash
# Build the project first
npm run build

# Open demo
open demo/sk8-editor.html
```

The demo includes:

- Full editor UI with toolbar, tree, inspector
- Pre-populated with sample objects
- All keyboard shortcuts enabled
- Undo/redo with descriptions
- Status bar with live updates

## Future Enhancements

Potential improvements for Phase 5+:

- **Multi-layer support**: Layer management and z-ordering
- **Grid and guides**: Visual grid and alignment guides
- **Grouping**: Group/ungroup actors
- **Copy/paste**: Clipboard operations
- **History panel**: Visual undo/redo history
- **Zoom and pan**: Canvas navigation
- **Rulers**: Measurement rulers
- **Alignment tools**: Align and distribute actors
- **Smart guides**: Show distances and alignment
- **Property animation**: Animate property changes

## Conclusion

The SK8 Visual Editor provides a complete foundation for building visual applications. It combines powerful editing capabilities with an intuitive interface, making it easy to create and manipulate SK8 objects visually.

For more information, see:
- [SK8 README](../README.md)
- [Phase 4 Implementation](./PHASE_4_SUMMARY.md)
- [API Documentation](./docs/)

---

**SK8 TypeScript Port v0.4.0**
Phase 4: Visual IDE Foundation Complete
