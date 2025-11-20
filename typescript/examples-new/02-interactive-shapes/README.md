# Example 02: Interactive Shapes

## Overview

Learn to work with multiple actors, handle selection, implement drag-and-drop, and manage z-order (layer stacking).

## What You'll Learn

1. **Multiple Actor Types** - Rectangles, circles, and triangles
2. **Selection System** - Click to select, visual feedback
3. **Drag and Drop** - Move actors with the mouse
4. **Z-Order Management** - Bring actors forward or send them back

## Key Concepts

### Actor Types
SK8 provides several built-in shape types:
- **SK8Rectangle** - Four-sided shapes
- **SK8Circle** - Round shapes (circles and ellipses)
- **SK8Line** - Line segments
- **SK8Triangle** - Three-sided polygons

### Hit Testing
```typescript
containsPoint(x, y): boolean
```
Each actor can determine if a point is inside its bounds, accounting for its specific shape.

### Selection Tracking
```typescript
let selectedActor = null;

actor.addEventListener('click', () => {
    selectedActor = actor;
    render();
});
```

### Z-Order
```typescript
stage.bringToFront(actor);  // Move to top layer
stage.sendToBack(actor);     // Move to bottom layer
```

## How to Run

Open `index.html` in your browser or use a local server.

## Try This

1. **Select**: Click any shape to select it (blue outline appears)
2. **Move**: Drag selected shapes around the canvas
3. **Layer**: Use "Bring to Front" or "Send to Back" to change stacking
4. **Add**: Click "Add Random Shape" to create new shapes
5. **Clear**: Remove selection or clear all shapes

## Challenges

### Easy
- Change the colors of the shapes
- Add more initial shapes
- Modify the size of new random shapes

### Medium
- Add keyboard shortcuts (Delete key to remove selected shape)
- Implement multi-selection (Ctrl+Click to add to selection)
- Add a "Duplicate" button that clones the selected shape

### Hard
- Implement snap-to-grid when dragging
- Add rotation handles to rotate selected shapes
- Create a "group" feature to move multiple shapes together

## Code Statistics

- **Total Lines:** ~150
- **Concepts Covered:** 7
- **Difficulty:** Beginner
- **Estimated Time:** 30 minutes

## Next Steps

- **03-animation-basics** - Add motion and effects
- **06-drawing-app** - Build a complete drawing application
