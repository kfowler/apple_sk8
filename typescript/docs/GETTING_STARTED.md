# Getting Started with SK8

Welcome to SK8! This guide will get you up and running with SK8 in just a few minutes, even if you've never used it before.

## Table of Contents

- [5-Minute Quickstart](#5-minute-quickstart)
- [Hello World Tutorial](#hello-world-tutorial)
- [Understanding SK8 Concepts](#understanding-sk8-concepts)
- [Next Steps](#next-steps)

---

## 5-Minute Quickstart

### Step 1: Install Node.js

SK8 runs on Node.js, which you'll need to install first.

**Download Node.js:**
- Visit [nodejs.org](https://nodejs.org)
- Download the LTS (Long Term Support) version
- Run the installer and follow the prompts
- Verify installation by opening a terminal and typing:

```bash
node --version
npm --version
```

You should see version numbers for both commands.

### Step 2: Clone the Repository

Open a terminal and clone the SK8 repository:

```bash
git clone https://github.com/your-username/apple_sk8.git
cd apple_sk8/typescript
```

### Step 3: Install Dependencies

Install the required packages:

```bash
npm install
```

This will download all the libraries SK8 needs to run.

### Step 4: Build SK8

Compile the TypeScript source code:

```bash
npm run build
```

This creates the compiled JavaScript files in the `dist/` directory.

### Step 5: Run Your First Demo

Open the demo in your web browser:

```bash
# Option 1: Use the dev server
npm run dev
# Then open http://localhost:8080 in your browser

# Option 2: Open the file directly
# Simply open demo/index.html in your browser
```

You should see an interactive canvas with shapes you can click and interact with!

### Step 6: Modify a Simple Example

Let's make a quick change to see how SK8 works. Open `demo/index.html` in a text editor and find this code:

```javascript
// Create a rectangle
const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 50, top: 50, right: 200, bottom: 150 });
rect.set('fillColor', 'red');
```

Change the fill color from `'red'` to `'blue'`:

```javascript
rect.set('fillColor', 'blue');
```

Refresh your browser and you'll see the rectangle is now blue! Congratulations - you've just modified your first SK8 program.

---

## Hello World Tutorial

Now let's build a complete interactive application from scratch. We'll create a rectangle that changes color when you click it and animates when you click again.

### Create Your HTML File

Create a new file called `my-first-sk8.html` in the `demo/` folder:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My First SK8 App</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        canvas {
            border: 2px solid #333;
            background-color: white;
            display: block;
            margin: 20px auto;
        }
        h1 {
            text-align: center;
            color: #333;
        }
    </style>
</head>
<body>
    <h1>My First SK8 Application</h1>
    <canvas id="myCanvas" width="600" height="400"></canvas>

    <script type="module" src="../dist/sk8.js"></script>
    <script type="module">
        // We'll add our code here
    </script>
</body>
</html>
```

### Step 1: Create a Stage

The **stage** is like a canvas where all your visual objects live. Add this code in the second `<script>` tag:

```javascript
import { SK8Stage } from '../dist/sk8.js';

// Create a stage attached to our canvas
const stage = new SK8Stage('myCanvas');
console.log('Stage created!');
```

Save and refresh your browser. You should see a white canvas and a message in the console.

### Step 2: Add a Rectangle

Now let's add a visual object (called an **actor** in SK8):

```javascript
import { SK8Stage, SK8Rectangle } from '../dist/sk8.js';

// Create a stage
const stage = new SK8Stage('myCanvas');

// Create a rectangle actor
const rect = new SK8Rectangle();

// Set its position and size (left, top, right, bottom)
rect.set('boundsRect', { left: 200, top: 150, right: 400, bottom: 250 });

// Set its appearance
rect.set('fillColor', { r: 255, g: 100, b: 100, a: 1.0 }); // Pink
rect.set('frameColor', { r: 0, g: 0, b: 0, a: 1.0 });     // Black border

// Add the rectangle to the stage
stage.addActor(rect);

// Start rendering
stage.startRendering();
```

Refresh your browser - you should now see a pink rectangle with a black border!

### Step 3: Add a Click Handler

Let's make it interactive. When you click the rectangle, it will change color:

```javascript
import { SK8Stage, SK8Rectangle } from '../dist/sk8.js';

const stage = new SK8Stage('myCanvas');

const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 200, top: 150, right: 400, bottom: 250 });
rect.set('fillColor', { r: 255, g: 100, b: 100, a: 1.0 });
rect.set('frameColor', { r: 0, g: 0, b: 0, a: 1.0 });

// Add a click handler
rect.addHandler('click', function() {
    // Generate a random color
    const randomColor = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
        a: 1.0
    };

    // Change the rectangle's color
    this.set('fillColor', randomColor);

    // Force the stage to redraw
    stage.render();

    console.log('Rectangle clicked! New color:', randomColor);
});

stage.addActor(rect);
stage.startRendering();
```

Now click the rectangle - it should change to a random color each time!

### Step 4: Animate on Click

Let's make it even more interesting with animation:

```javascript
import { SK8Stage, SK8Rectangle, animations, Easing } from '../dist/sk8.js';

const stage = new SK8Stage('myCanvas');

const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 200, top: 150, right: 400, bottom: 250 });
rect.set('fillColor', { r: 255, g: 100, b: 100, a: 1.0 });
rect.set('frameColor', { r: 0, g: 0, b: 0, a: 1.0 });

rect.addHandler('click', function() {
    // Change color
    const randomColor = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
        a: 1.0
    };
    this.set('fillColor', randomColor);

    // Animate the rectangle moving to a new position
    const newX = Math.random() * 400 + 100;
    const newY = Math.random() * 200 + 100;

    animations.animate(this, 'left', newX, 500, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });

    animations.animate(this, 'top', newY, 500, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });

    console.log('Rectangle animated to:', newX, newY);
});

stage.addActor(rect);
stage.startRendering();
```

Perfect! Now when you click the rectangle:
1. It changes to a random color
2. It smoothly animates to a new position
3. The movement has a nice easing curve

### Complete Working Code

Here's the complete `my-first-sk8.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My First SK8 App</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        canvas {
            border: 2px solid #333;
            background-color: white;
            display: block;
            margin: 20px auto;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .instructions {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <h1>My First SK8 Application</h1>
    <div class="instructions">
        <h2>Instructions:</h2>
        <p>Click the rectangle to:</p>
        <ul>
            <li>Change its color randomly</li>
            <li>Animate it to a new position</li>
        </ul>
    </div>
    <canvas id="myCanvas" width="600" height="400"></canvas>

    <script type="module">
        import { SK8Stage, SK8Rectangle, animations, Easing } from '../dist/sk8.js';

        const stage = new SK8Stage('myCanvas');

        const rect = new SK8Rectangle();
        rect.set('boundsRect', { left: 200, top: 150, right: 400, bottom: 250 });
        rect.set('fillColor', { r: 255, g: 100, b: 100, a: 1.0 });
        rect.set('frameColor', { r: 0, g: 0, b: 0, a: 1.0 });

        rect.addHandler('click', function() {
            const randomColor = {
                r: Math.floor(Math.random() * 256),
                g: Math.floor(Math.random() * 256),
                b: Math.floor(Math.random() * 256),
                a: 1.0
            };
            this.set('fillColor', randomColor);

            const newX = Math.random() * 400 + 100;
            const newY = Math.random() * 200 + 100;

            animations.animate(this, 'left', newX, 500, {
                easing: Easing.easeInOutCubic,
                onUpdate: () => stage.render()
            });

            animations.animate(this, 'top', newY, 500, {
                easing: Easing.easeInOutCubic,
                onUpdate: () => stage.render()
            });
        });

        stage.addActor(rect);
        stage.startRendering();
    </script>
</body>
</html>
```

---

## Understanding SK8 Concepts

Now that you've built your first application, let's understand the core concepts of SK8.

### What are Actors?

**Actors** are visual objects that appear on screen. Every visible element in SK8 is an actor - rectangles, circles, text, images, buttons, etc.

**Key characteristics of actors:**
- They have a **position** and **size** (defined by `boundsRect`)
- They have **visual properties** like `fillColor`, `frameColor`, `opacity`
- They can respond to **events** like clicks and mouse movements
- They can have **handlers** (functions) attached to them
- They can be **animated** smoothly

**Common actor types:**
```javascript
// Basic shapes
const rect = new SK8Rectangle();
const circle = new SK8Circle();
const roundRect = new SK8RoundRect();
const line = new SK8Line();
const text = new SK8Text();

// Advanced shapes
const polygon = new SK8Polygon();
const star = new SK8Star();
const arrow = new SK8Arrow();

// UI components
const button = new SK8Button();
const slider = new SK8Slider();
const checkbox = new SK8CheckBox();

// Media actors
const picture = new SK8Picture();
const movie = new SK8MovieRectangle();
const sound = new SK8Sound();
```

### What are Stages?

A **stage** is a container that holds actors and manages the canvas. Think of it like a theater stage where actors perform.

**Key responsibilities of a stage:**
- Manages a **canvas element** for drawing
- Holds a collection of **actors**
- Handles **rendering** (drawing everything)
- Manages **Z-ordering** (which actors are in front)
- Coordinates **events** (clicks, drags, etc.)

**Stage operations:**
```javascript
const stage = new SK8Stage('myCanvas');

// Add actors
stage.addActor(myRectangle);
stage.addActor(myCircle);

// Remove actors
stage.removeActor(myRectangle);

// Z-ordering
stage.bringToFront(myCircle);  // Move to top
stage.sendToBack(myRectangle); // Move to bottom

// Find actor at point
const actor = stage.actorAtPoint(100, 150);

// Rendering
stage.render();           // Render once
stage.startRendering();   // Start animation loop
stage.stopRendering();    // Stop animation loop

// Access all actors
const actors = stage.getActors();
```

### Properties and Handlers

**Properties** are attributes of actors that you can get and set:

```javascript
const rect = new SK8Rectangle();

// Setting properties
rect.set('left', 100);
rect.set('top', 50);
rect.set('fillColor', 'red');
rect.set('opacity', 0.5);

// Getting properties
const x = rect.get('left');
const color = rect.get('fillColor');

// Chaining
rect.set('left', 100).set('top', 50).set('fillColor', 'blue');
```

**Common properties all actors have:**
- **Position**: `left`, `top`, `right`, `bottom`, `width`, `height`
- **Appearance**: `fillColor`, `frameColor`, `opacity`, `visible`
- **Behavior**: `draggable`, `name`

**Handlers** are functions that respond to events:

```javascript
rect.addHandler('click', function(x, y) {
    console.log('Clicked at:', x, y);
    this.set('fillColor', 'green');
});

rect.addHandler('mouseDown', function(x, y) {
    console.log('Mouse pressed');
});

rect.addHandler('mouseUp', function(x, y) {
    console.log('Mouse released');
});

rect.addHandler('mouseMove', function(x, y) {
    // Called when mouse moves over actor
});
```

### Events and Animation

**Events** let you respond to user interactions:

```javascript
// Click events
actor.addHandler('click', function(x, y) {
    // x and y are click coordinates
    // 'this' refers to the actor
});

// Mouse events
actor.addHandler('mouseDown', function(x, y) { });
actor.addHandler('mouseUp', function(x, y) { });
actor.addHandler('mouseMove', function(x, y) { });

// Custom events
actor.addHandler('customEvent', function(data) {
    console.log('Custom event:', data);
});

// Trigger custom event
actor.callHandler('customEvent', { message: 'Hello!' });
```

**Animation** makes properties change smoothly over time:

```javascript
import { animations, Easing } from '../dist/sk8.js';

// Animate a single property
animations.animate(actor, 'left', 500, 1000, {
    easing: Easing.easeInOutCubic,
    onComplete: () => console.log('Done!'),
    onUpdate: (value) => stage.render()
});

// Parameters:
// - actor: the object to animate
// - 'left': the property name
// - 500: target value
// - 1000: duration in milliseconds
// - options: easing, callbacks

// Animation helpers
import { AnimationHelpers } from '../dist/sk8.js';

AnimationHelpers.fadeIn(actor, 300);
AnimationHelpers.fadeOut(actor, 300);
AnimationHelpers.moveTo(actor, 100, 200, 500);
AnimationHelpers.scaleTo(actor, 1.5, 500);
AnimationHelpers.pulse(actor, 1.2, 400);
AnimationHelpers.shake(actor, 10, 500);
```

**Available easing functions:**
- `Easing.linear` - Constant speed
- `Easing.easeInQuad` - Accelerate
- `Easing.easeOutQuad` - Decelerate
- `Easing.easeInOutQuad` - Accelerate then decelerate
- `Easing.easeInCubic` - Strong acceleration
- `Easing.easeOutCubic` - Strong deceleration
- `Easing.easeInOutCubic` - Strong ease in/out
- `Easing.easeInElastic` - Elastic bounce in
- `Easing.easeOutElastic` - Elastic bounce out
- `Easing.easeInBounce` - Bounce in
- `Easing.easeOutBounce` - Bounce out

### SK8 Object Model

SK8 uses **prototype-based inheritance**:

```javascript
// Every actor inherits from SK8Actor
// SK8Actor inherits from SK8Object
// This gives all actors a common set of features

// Create an actor
const rect = new SK8Rectangle();

// It has SK8Object features:
rect.get('propertyName');        // Get property
rect.set('propertyName', value); // Set property
rect.addHandler('event', fn);    // Add event handler
rect.callHandler('event', args); // Call event handler

// It has SK8Actor features:
rect.getBoundsRect();           // Get position/size
rect.setBoundsRect(rect);       // Set position/size
rect.moveTo(x, y);              // Move to position
rect.moveBy(dx, dy);            // Move by offset
rect.containsPoint(x, y);       // Hit test
rect.render(ctx);               // Draw to canvas

// It has shape-specific features:
rect.setCornerRadius(10);       // Rectangle specific
```

---

## Next Steps

Congratulations! You've learned the basics of SK8. Here's where to go next:

### Tutorials to Explore

1. **[SK8Script Tutorial](SK8SCRIPT_TUTORIAL.md)** - Learn the SK8Script programming language for scripting your applications

2. **[Animation Tutorial](ANIMATION_TUTORIAL.md)** - Master animation techniques, easing curves, and the timeline editor

3. **[UI Components Guide](UI_COMPONENTS.md)** - Build interactive interfaces with buttons, sliders, and other widgets

4. **[Media Guide](MEDIA.md)** - Work with images, video, and audio in your projects

5. **[Visual IDE Guide](VISUAL_IDE.md)** - Use the visual editor to design applications without coding

6. **[Recipe Book](RECIPES.md)** - 30+ complete examples showing how to build common applications

### Example Projects

Check out these example projects in the `examples/` directory:

- **Animation Demo** - Showcases all animation types and easing functions
- **Interactive UI** - Complete UI with buttons, sliders, and forms
- **Drawing App** - Simple drawing application
- **Game Examples** - Platformer and puzzle game examples
- **Media Player** - Image gallery and video player

### Learning Path

**Beginner:**
1. Complete this Getting Started guide
2. Try modifying the demo projects
3. Build simple interactive scenes
4. Read the UI Components Guide

**Intermediate:**
5. Learn SK8Script for more powerful scripting
6. Study the Animation Tutorial
7. Work through the Recipe Book examples
8. Build a complete application

**Advanced:**
9. Use the Visual IDE for rapid development
10. Integrate media (images, video, sound)
11. Create custom actor types
12. Contribute to SK8 development

### Getting Help

- **Documentation**: Read the guides in the `docs/` folder
- **Examples**: Study code in `examples/` and `demo/` folders
- **FAQ**: Check [FAQ.md](FAQ.md) for common questions
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions to common problems
- **API Reference**: See the TypeScript definitions in `src/` for detailed API docs

### Community and Support

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share projects
- **Contributing**: See CONTRIBUTING.md to help improve SK8

---

## Quick Reference

### Creating Actors

```javascript
const rect = new SK8Rectangle();
const circle = new SK8Circle();
const text = new SK8Text();
const button = new SK8Button();
```

### Setting Properties

```javascript
actor.set('left', 100);
actor.set('top', 50);
actor.set('fillColor', 'red');
actor.set('fillColor', { r: 255, g: 0, b: 0, a: 1.0 });
```

### Adding to Stage

```javascript
const stage = new SK8Stage('canvasId');
stage.addActor(actor);
stage.startRendering();
```

### Event Handling

```javascript
actor.addHandler('click', function() {
    this.set('fillColor', 'blue');
    stage.render();
});
```

### Animation

```javascript
animations.animate(actor, 'left', 500, 1000, {
    easing: Easing.easeInOutCubic,
    onUpdate: () => stage.render()
});
```

---

**Ready to build amazing interactive applications with SK8!**

Next: [SK8Script Tutorial](SK8SCRIPT_TUTORIAL.md) or [Recipe Book](RECIPES.md)
