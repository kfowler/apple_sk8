# Visual IDE Guide

Learn to use SK8's visual development environment to create applications without writing code.

## Table of Contents

- [Introduction](#introduction)
- [Interface Overview](#interface-overview)
- [Creating Actors](#creating-actors)
- [Editing Actors](#editing-actors)
- [Animation in the IDE](#animation-in-the-ide)
- [Scripting](#scripting)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Tricks](#tips-and-tricks)

---

## Introduction

The SK8 Visual IDE lets you build interactive applications visually. Drag shapes, set properties, and add behaviors without writing code (though you can add SK8Script when you need it).

### Opening the Visual IDE

```bash
cd typescript
npm run dev
```

Then open `http://localhost:8080/demo/sk8-editor.html` in your browser.

### First Look

The IDE has four main areas:
- **Top**: Toolbar with shape tools and actions
- **Left**: Object tree showing all actors
- **Center**: Canvas where you design
- **Right**: Property inspector for selected actors
- **Bottom**: Status bar

---

## Interface Overview

### Toolbar

The toolbar contains shape-creation tools:

**Selection Tools:**
- **Select (V)**: Default tool for selecting and moving actors
- Click to activate, then click actors to select them

**Shape Tools:**
- **Rectangle (R)**: Draw rectangles
- **RoundRect (U)**: Draw rounded rectangles
- **Circle (C)**: Draw circles/ovals
- **Line (L)**: Draw lines
- **Text (T)**: Create text objects
- **Arrow (A)**: Draw arrows
- **Star (S)**: Draw stars
- **Polygon (P)**: Draw custom polygons

**Action Buttons:**
- **Undo**: Undo last action
- **Redo**: Redo undone action
- **Delete**: Delete selected actors

### Canvas (Stage)

The canvas is where you design your application:

- **White area**: Your application's visible area
- **Selection box**: Blue dashed box around selected actors
- **Handles**: Small squares for resizing
- **Rotation handle**: Circle above selection for rotating

### Property Inspector

The property inspector shows properties of selected actors:

**Property Groups:**
- **Identity**: name
- **Appearance**: fillColor, frameColor, opacity, visible
- **Layout**: left, top, width, height
- **Transform**: rotation (scale, skew planned)
- **Behavior**: draggable, droppable

**Property Types:**
- **Text**: Type directly
- **Number**: Use number input or slider
- **Color**: Click to open color picker
- **Checkbox**: Toggle on/off
- **Dropdown**: Select from options

### Object Tree

The object tree shows the hierarchy of your application:

- **Stage**: Root of the tree
- **Actors**: All objects on the stage
- **Type icons**: Visual indicators for actor types
- **Visibility**: Eye icon to toggle visibility
- **Drag to reorder**: Change Z-order (front/back)

### Status Bar

Shows helpful information:
- **Selection**: Number of selected actors
- **Active tool**: Current tool name
- **Position**: Mouse coordinates
- **Messages**: Helpful tips and notifications

---

## Creating Actors

### Using Shape Tools

**To create a rectangle:**
1. Click the **Rectangle** tool in toolbar (or press **R**)
2. Click and drag on the canvas
3. Release mouse to finish
4. Tool automatically switches back to **Select**

**To create a circle:**
1. Click the **Circle** tool (or press **C**)
2. Click and drag on the canvas
3. Oval width/height determined by drag direction
4. Hold **Shift** while dragging for perfect circle

**To create text:**
1. Click the **Text** tool (or press **T**)
2. Click on the canvas
3. A text object appears
4. Use Property Inspector to change text content

### Setting Initial Properties

After creating an actor, immediately set its properties:

1. With actor still selected, look at Property Inspector
2. Change **fillColor** by clicking the color box
3. Adjust **width** and **height** with number inputs
4. Set **name** for easy identification

### Quick Create

**Keyboard shortcut method:**
1. Press **R** for rectangle (or other shape key)
2. Drag on canvas
3. Immediately press **R** again for another rectangle
4. Repeat as needed

---

## Editing Actors

### Selecting Actors

**Single Selection:**
- Click the **Select** tool (or press **V**)
- Click an actor to select it
- Selected actor shows blue selection box

**Multi-Selection:**
- Hold **Shift** and click additional actors
- OR hold **Ctrl** and click to toggle selection
- OR drag a rectangle around multiple actors (area select)

**Select from Tree:**
- Click an actor in the Object Tree
- Hold **Shift**/**Ctrl** for multi-select in tree too

### Moving Actors

**Drag to move:**
1. Select actor(s)
2. Click and drag anywhere inside selection box
3. Selected actors move together

**Precise positioning:**
1. Select actor
2. In Property Inspector, set exact **left** and **top** values
3. Or use arrow keys for 1-pixel movements

**Align actors:**
- Select multiple actors
- Use alignment buttons (planned feature)
- OR manually set same **left** or **top** values

### Resizing Actors

**Drag handles:**
1. Select an actor
2. Small squares appear at corners and edges
3. Drag a corner to resize both width and height
4. Drag an edge to resize one dimension
5. Hold **Shift** to maintain aspect ratio

**Precise sizing:**
- Use **width** and **height** properties in inspector
- Enter exact pixel values

### Rotating Actors

**Rotation handle:**
1. Select an actor
2. Small circle appears above top edge
3. Drag the circle to rotate
4. Rotation snaps to 15° increments (hold **Shift** for free rotation)

**Precise rotation:**
- Set **rotation** property in inspector
- Enter exact degrees (0-360)

### Copy/Paste/Duplicate

**Duplicate:**
1. Select actor
2. Press **Ctrl+D** (or **Cmd+D** on Mac)
3. Duplicate appears slightly offset

**Copy/Paste** (planned):
1. Select actor
2. Press **Ctrl+C** to copy
3. Press **Ctrl+V** to paste
4. Pasted copy appears at same position

### Delete

**Delete actors:**
1. Select actor(s)
2. Press **Delete** key
3. Or click **Delete** button in toolbar
4. Or right-click and choose **Delete** (planned)

### Undo/Redo

**Undo last action:**
- Press **Ctrl+Z** (or **Cmd+Z**)
- OR click **Undo** button in toolbar

**Redo undone action:**
- Press **Ctrl+Y** (or **Cmd+Shift+Z**)
- OR click **Redo** button in toolbar

SK8 keeps history of last 100 actions.

---

## Animation in the IDE

### Timeline Panel (Planned)

The timeline editor lets you create animations visually:

**Opening timeline:**
1. Click **Window** > **Timeline**
2. Timeline panel appears at bottom

**Creating an animation:**
1. Select an actor
2. Move playhead to time 0
3. Set starting property values
4. Move playhead to time 1000ms (1 second)
5. Set ending property values
6. Keyframes automatically created

**Editing keyframes:**
1. Click and drag keyframes to adjust timing
2. Double-click between keyframes to edit easing curve
3. Right-click keyframe for options

**Playback:**
- Press **Space** to play/pause
- Drag playhead to scrub through time
- Loop button to repeat animation

### Animation Helpers

For now, add animations via scripting:

1. Select an actor
2. In Property Inspector, add a **click** handler
3. In the script editor, write:

```sk8script
on click()
    animate(this, "left", 500, 1000)
end click
```

---

## Scripting

### Adding Handlers

**Add a click handler:**
1. Select an actor in the IDE
2. In Property Inspector, scroll to **Handlers** section
3. Click **+ Add Handler**
4. Choose **click** from dropdown
5. Script editor opens

**Edit handler code:**
```sk8script
on click()
    -- Change color on click
    set the fillColor of this to "red"

    -- Animate
    animate(this, "left", 500, 1000)
end click
```

**Save handler:**
- Click **Save** or press **Ctrl+S**
- Handler is attached to actor
- Test by clicking actor in preview mode

### SK8Script Editor

The built-in script editor provides:

**Features:**
- **Syntax highlighting**: Keywords and values colored
- **Line numbers**: Easy reference
- **Auto-indent**: Keeps code tidy
- **Error checking**: Highlights syntax errors (planned)
- **Auto-complete**: Suggests functions and properties (planned)

**Using the editor:**
1. Type your SK8Script code
2. Press **Ctrl+S** to save
3. Press **Ctrl+R** to test (runs the handler)
4. Errors appear in output panel

### Testing and Debugging

**Preview mode:**
1. Click **Preview** button (or press **F5**)
2. IDE switches to preview mode
3. Interact with your application
4. Click **Edit** to return to edit mode

**Console output:**
- Use `print()` statements in your code
- Output appears in browser console (F12)
- Debug panel in IDE planned

**Common debugging:**
```sk8script
on click()
    print("Button was clicked!")
    print("Current left:", the left of this)

    set the fillColor of this to "blue"
    print("Color changed to blue")
end click
```

---

## Keyboard Shortcuts

### General

| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | New project |
| **Ctrl+O** | Open project |
| **Ctrl+S** | Save project |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Delete** | Delete selected |
| **Ctrl+D** | Duplicate |
| **Ctrl+A** | Select all |

### Tools

| Shortcut | Tool |
|----------|------|
| **V** | Select tool |
| **R** | Rectangle tool |
| **U** | Rounded rectangle tool |
| **C** | Circle tool |
| **L** | Line tool |
| **T** | Text tool |
| **A** | Arrow tool |
| **S** | Star tool |
| **P** | Polygon tool |

### Movement (with actor selected)

| Shortcut | Action |
|----------|--------|
| **↑** | Move up 1px |
| **↓** | Move down 1px |
| **←** | Move left 1px |
| **→** | Move right 1px |
| **Shift+↑↓←→** | Move 10px |

### Alignment (planned)

| Shortcut | Action |
|----------|--------|
| **Ctrl+Shift+L** | Align left |
| **Ctrl+Shift+R** | Align right |
| **Ctrl+Shift+T** | Align top |
| **Ctrl+Shift+B** | Align bottom |
| **Ctrl+Shift+H** | Align horizontal center |
| **Ctrl+Shift+V** | Align vertical center |

### View

| Shortcut | Action |
|----------|--------|
| **F5** | Preview mode |
| **Esc** | Exit preview |
| **Ctrl+0** | Zoom to fit |
| **Ctrl++** | Zoom in |
| **Ctrl+-** | Zoom out |

### Customization

You can customize keyboard shortcuts in **Preferences** (planned feature).

---

## Tips and Tricks

### Efficient Workflow

**1. Name your actors:**
- Give actors descriptive names
- Makes them easy to find in Object Tree
- Helps when writing scripts

**2. Use groups (planned):**
- Select multiple actors
- Press **Ctrl+G** to group
- Move/resize as one unit

**3. Use layers (planned):**
- Organize complex projects into layers
- Toggle layer visibility
- Lock layers to prevent editing

**4. Save often:**
- Press **Ctrl+S** frequently
- Auto-save runs every 5 minutes
- Keep backups of important versions

### Design Tips

**1. Grid and guides:**
- Enable **Snap to Grid** for aligned layouts
- Use guides for consistent spacing
- Grid size adjustable in preferences

**2. Color palette:**
- Create a palette of project colors
- Reuse colors for consistency
- Save palettes for future projects

**3. Component library (planned):**
- Save commonly used actor groups as components
- Reuse across projects
- Update all instances by editing component

### Performance

**1. Limit actors:**
- Too many actors = slower rendering
- Use images for complex static content
- Group actors when possible

**2. Optimize images:**
- Use appropriate resolution
- Compress images before importing
- Consider using sprite sheets

**3. Profile performance:**
- Use browser DevTools to find bottlenecks
- Monitor frame rate
- Optimize expensive operations

### Common Tasks

**Center an actor:**
1. Select actor
2. Set **left** to `(stage width - actor width) / 2`
3. Set **top** to `(stage height - actor height) / 2`

**Make actors same size:**
1. Select all actors
2. Set same **width** in inspector
3. Set same **height** in inspector

**Create a grid of actors:**
1. Create first actor
2. Duplicate (**Ctrl+D**)
3. Move to desired position
4. Repeat

**Create button with hover effect:**
1. Create rectangle
2. Add **mouseEnter** handler:
```sk8script
on mouseEnter()
    set the fillColor of this to "lightblue"
end mouseEnter
```
3. Add **mouseLeave** handler:
```sk8script
on mouseLeave()
    set the fillColor of this to "blue"
end mouseLeave
```

---

## Next Steps

- **[Getting Started](GETTING_STARTED.md)** - Learn SK8 basics
- **[Animation Tutorial](ANIMATION_TUTORIAL.md)** - Create animations
- **[SK8Script Tutorial](SK8SCRIPT_TUTORIAL.md)** - Add scripting
- **[Recipe Book](RECIPES.md)** - Complete examples

Build amazing applications visually with SK8's IDE!
