# Example 01: Hello World

## Overview

Your first SK8 application! This example demonstrates the fundamental concepts of SK8:
- Creating a stage (canvas manager)
- Creating an actor (visual object)
- Setting properties (position, size, color)
- Handling events (mouse clicks)

## What You'll Learn

1. **SK8Stage** - The canvas manager that hosts all visual actors
2. **SK8Rectangle** - A basic shape actor
3. **Event Handling** - Responding to user interactions
4. **Properties** - Setting actor appearance and behavior

## Key Concepts

### Stage Creation
```typescript
const stage = new SK8Stage(canvas);
```
The stage is the container for all visual elements. It manages rendering, event routing, and the actor hierarchy.

### Actor Creation
```typescript
const rect = new SK8Rectangle();
rect.setBoundsRect({ left: 150, top: 100, right: 350, bottom: 200 });
rect.setFillColor({ r: 100, g: 150, b: 255, a: 1 });
```
Actors are visual objects. Set their position with bounds and appearance with properties.

### Event Handling
```typescript
rect.addEventListener('click', () => {
    // Handle click event
    rect.setFillColor(randomColor());
});
```
Actors can respond to mouse, keyboard, and custom events.

### Rendering
```typescript
stage.addActor(rect);
stage.startRendering();
```
Add actors to the stage and start the render loop.

## How to Run

### Option 1: Direct File Access
Simply open `index.html` in your web browser.

### Option 2: Local Server
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server

# Then open: http://localhost:8000/examples-new/01-hello-world/
```

## Try This

1. Click the rectangle to change its color
2. Watch the console for log messages
3. Open DevTools to inspect the code

## Challenges

### Easy
- Change the initial color of the rectangle
- Modify the text displayed in the rectangle
- Change the size of the rectangle

### Medium
- Add a second rectangle with a different color
- Make the rectangles respond to hover (change color on mouseover)
- Add a counter that shows how many times you've clicked

### Hard
- Create a rainbow of rectangles that cycle through colors in sequence
- Add keyboard shortcuts (press 'R' for red, 'G' for green, etc.)
- Implement smooth color transitions using animation

## Solution Hints

<details>
<summary>Hint: Adding a second rectangle</summary>

```typescript
const rect2 = new SK8Rectangle();
rect2.setBoundsRect({ left: 150, top: 220, right: 350, bottom: 280 });
rect2.setFillColor({ r: 255, g: 100, b: 100, a: 1 });
rect2.addEventListener('click', () => {
    rect2.setFillColor(randomColor());
});
stage.addActor(rect2);
```
</details>

<details>
<summary>Hint: Adding a click counter</summary>

```typescript
let clickCount = 0;

rect.addEventListener('click', () => {
    clickCount++;
    console.log(`Clicked ${clickCount} times`);
    rect.setFillColor(randomColor());
});
```
</details>

## Code Statistics

- **Total Lines:** 52 (core code)
- **Concepts Covered:** 4
- **Difficulty:** Beginner
- **Estimated Time:** 15 minutes

## Next Steps

After completing this example, move on to:
- **02-interactive-shapes** - Learn about multiple actor types and drag/drop
- **03-animation-basics** - Add motion and effects to your actors

## Related Documentation

- [SK8Stage API](../../API.md#sk8stage)
- [SK8Actor API](../../API.md#sk8actor)
- [Event System](../../EVENT_SYSTEM_SUMMARY.md)

## Notes

This example uses a simplified inline implementation of SK8 for educational purposes. In a real application, you would import the full SK8 library:

```typescript
import { SK8Stage, SK8Rectangle } from 'sk8-ts';
```

The concepts and API are the same, but the full library includes many more features like:
- Performance optimization
- Advanced event handling
- Animation system
- More actor types
- And much more!
