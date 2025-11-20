# Animation Tutorial

Master the art of creating smooth, engaging animations in SK8. This guide covers everything from basic property animations to complex timeline sequences.

## Table of Contents

- [Introduction to Animation](#introduction-to-animation)
- [Basic Animation](#basic-animation)
- [Easing Curves Explained](#easing-curves-explained)
- [Timeline Editor](#timeline-editor)
- [Multi-Property Animation](#multi-property-animation)
- [Animation Helpers](#animation-helpers)
- [Custom Easing](#custom-easing)
- [Performance Tips](#performance-tips)
- [Advanced Techniques](#advanced-techniques)

---

## Introduction to Animation

Animation brings your SK8 applications to life by smoothly transitioning property values over time. SK8's animation system is powerful yet easy to use.

### What Can Be Animated?

Almost any numeric property can be animated:

- **Position**: `left`, `top`, `right`, `bottom`
- **Size**: `width`, `height`
- **Appearance**: `opacity`, `rotation`
- **Custom properties**: Any numeric property you define

### Animation Basics

```javascript
import { animations, Easing } from './dist/sk8.js';

// Animate an actor's left position to 500 over 1 second
animations.animate(myActor, 'left', 500, 1000, {
    easing: Easing.easeInOutCubic,
    onComplete: () => console.log('Animation complete!'),
    onUpdate: (value) => stage.render()
});
```

**Parameters:**
- `target` - The object to animate
- `property` - The property name to animate (string)
- `endValue` - The target value (number)
- `duration` - Time in milliseconds
- `options` - Configuration object

---

## Basic Animation

### Your First Animation

Let's start with a simple example:

```javascript
import { SK8Stage, SK8Rectangle, animations } from './dist/sk8.js';

// Create a stage and rectangle
const stage = new SK8Stage('canvas');
const rect = new SK8Rectangle();

rect.set('boundsRect', { left: 50, top: 100, right: 150, bottom: 200 });
rect.set('fillColor', 'blue');

stage.addActor(rect);
stage.startRendering();

// Animate the rectangle moving right
animations.animate(rect, 'left', 400, 2000, {
    onUpdate: () => stage.render()
});
```

The rectangle smoothly moves from left position 50 to 400 over 2 seconds.

### Animating Different Properties

#### Position Animation

```javascript
// Move horizontally
animations.animate(rect, 'left', 500, 1000, {
    onUpdate: () => stage.render()
});

// Move vertically
animations.animate(rect, 'top', 300, 1000, {
    onUpdate: () => stage.render()
});

// Move both (run animations in parallel)
animations.animate(rect, 'left', 500, 1000, {
    onUpdate: () => stage.render()
});
animations.animate(rect, 'top', 300, 1000, {
    onUpdate: () => stage.render()
});
```

#### Size Animation

```javascript
// Grow width
animations.animate(rect, 'width', 300, 1000, {
    onUpdate: () => stage.render()
});

// Shrink height
animations.animate(rect, 'height', 50, 1000, {
    onUpdate: () => stage.render()
});
```

#### Opacity Animation

```javascript
// Fade out
animations.animate(rect, 'opacity', 0, 500, {
    onUpdate: () => stage.render()
});

// Fade in
animations.animate(rect, 'opacity', 1, 500, {
    onUpdate: () => stage.render()
});
```

### Animation Callbacks

Callbacks let you coordinate actions with animations:

```javascript
animations.animate(rect, 'left', 500, 1000, {
    // Called for every frame
    onUpdate: (currentValue) => {
        console.log('Current position:', currentValue);
        stage.render();
    },

    // Called when animation completes
    onComplete: () => {
        console.log('Animation finished!');
        rect.set('fillColor', 'green');
        stage.render();
    }
});
```

### Canceling Animations

```javascript
// Start an animation and save its ID
const animId = animations.animate(rect, 'left', 500, 1000, {
    onUpdate: () => stage.render()
});

// Cancel it before it finishes
animations.cancel(animId);

// Cancel all animations for an actor
animations.cancelAllFor(rect);

// Cancel ALL running animations
animations.cancelAll();
```

---

## Easing Curves Explained

**Easing** controls the acceleration and deceleration of animations, making them feel natural and polished.

### What is Easing?

Without easing, animations move at constant speed (linear). With easing, they can:
- Start slow and speed up (**ease in**)
- Start fast and slow down (**ease out**)
- Both (**ease in-out**)

### Visual Guide to Easing

**Linear**: Constant speed throughout
```
Speed: ███████████████████
Time:  ╵───────────────────╵
       Start              End
```

**Ease In**: Slow start, fast end
```
Speed: ▁▂▃▄▅▆▇█████████████
Time:  ╵───────────────────╵
       Start              End
```

**Ease Out**: Fast start, slow end
```
Speed: █████████████▇▆▅▄▃▂▁
Time:  ╵───────────────────╵
       Start              End
```

**Ease In-Out**: Slow start and end, fast middle
```
Speed: ▁▂▃▄▅████████▅▄▃▂▁
Time:  ╵───────────────────╵
       Start              End
```

### Available Easing Functions

SK8 includes 18 built-in easing functions:

#### Linear
```javascript
Easing.linear  // Constant speed, no acceleration
```

Use for: Mechanical movements, constant scrolling

#### Quadratic (quad)
```javascript
Easing.easeInQuad      // Gentle ease in
Easing.easeOutQuad     // Gentle ease out
Easing.easeInOutQuad   // Gentle ease both
```

Use for: UI transitions, smooth movements

#### Cubic
```javascript
Easing.easeInCubic      // Medium ease in
Easing.easeOutCubic     // Medium ease out
Easing.easeInOutCubic   // Medium ease both
```

Use for: Most animations, great default choice

#### Quartic (quart)
```javascript
Easing.easeInQuart      // Strong ease in
Easing.easeOutQuart     // Strong ease out
Easing.easeInOutQuart   // Strong ease both
```

Use for: Dramatic effects, emphasizing motion

#### Quintic (quint)
```javascript
Easing.easeInQuint      // Very strong ease in
Easing.easeOutQuint     // Very strong ease out
Easing.easeInOutQuint   // Very strong ease both
```

Use for: Heavy objects, extreme effects

#### Sine
```javascript
Easing.easeInSine      // Smooth ease in
Easing.easeOutSine     // Smooth ease out
Easing.easeInOutSine   // Smooth ease both
```

Use for: Natural, gentle movements

#### Exponential (expo)
```javascript
Easing.easeInExpo      // Explosive start
Easing.easeOutExpo     // Explosive end
Easing.easeInOutExpo   // Explosive both
```

Use for: Dramatic reveals, zoom effects

#### Elastic
```javascript
Easing.easeInElastic   // Elastic spring in
Easing.easeOutElastic  // Elastic spring out
```

Use for: Playful, bouncy effects

#### Bounce
```javascript
Easing.easeInBounce    // Bounce in
Easing.easeOutBounce   // Bounce out
```

Use for: Balls bouncing, playful UI

### Choosing the Right Easing

**For UI elements (buttons, panels):**
- `easeInOutQuad` - Subtle, professional
- `easeInOutCubic` - Good all-purpose choice

**For object movement:**
- `easeOutQuad` - Natural deceleration
- `easeInOutCubic` - Smooth acceleration/deceleration

**For attention-grabbing effects:**
- `easeOutElastic` - Bouncy, playful
- `easeOutBounce` - Bouncing ball effect

**For dramatic reveals:**
- `easeOutExpo` - Fast then sudden stop
- `easeInExpo` - Sudden start then slow

### Easing Comparison Example

```javascript
// Create five rectangles with different easings
const easings = [
    { name: 'linear', fn: Easing.linear },
    { name: 'easeInQuad', fn: Easing.easeInQuad },
    { name: 'easeOutQuad', fn: Easing.easeOutQuad },
    { name: 'easeInOutCubic', fn: Easing.easeInOutCubic },
    { name: 'easeOutBounce', fn: Easing.easeOutBounce }
];

easings.forEach((easing, index) => {
    const rect = new SK8Rectangle();
    rect.set('boundsRect', {
        left: 50,
        top: 50 + index * 60,
        right: 100,
        bottom: 90 + index * 60
    });
    rect.set('fillColor', 'blue');
    stage.addActor(rect);

    // Add label
    const label = new SK8Text();
    label.set('text', easing.name);
    label.set('left', 10);
    label.set('top', 60 + index * 60);
    stage.addActor(label);

    // Animate with this easing
    animations.animate(rect, 'left', 500, 2000, {
        easing: easing.fn,
        onUpdate: () => stage.render()
    });
});

// Watch them all animate differently!
```

---

## Timeline Editor

*Note: The Timeline Editor is a planned feature. This section describes the intended functionality.*

### Timeline Concept

The timeline editor lets you visually create complex animation sequences without code. Think of it like a video editor for animations.

**Key concepts:**
- **Timeline**: The full animation sequence
- **Tracks**: One per animated property
- **Keyframes**: Points in time where you set exact values
- **Curves**: The easing between keyframes

### Creating Tracks

```javascript
// Programmatic timeline (future API)
const timeline = new SK8Timeline();

// Add a track for left position
const leftTrack = timeline.addTrack(myActor, 'left');
leftTrack.addKeyframe(0, 50);        // At 0ms, left = 50
leftTrack.addKeyframe(1000, 500);    // At 1000ms, left = 500
leftTrack.setEasing(Easing.easeInOutCubic);

// Add a track for opacity
const opacityTrack = timeline.addTrack(myActor, 'opacity');
opacityTrack.addKeyframe(0, 1);
opacityTrack.addKeyframe(500, 0);
opacityTrack.addKeyframe(1000, 1);

// Play the timeline
timeline.play();
```

### Adding Keyframes

**Keyframe** = a specific value at a specific time

```javascript
// Add keyframes manually
track.addKeyframe(time, value);

// Example: ball bouncing
const track = timeline.addTrack(ball, 'top');
track.addKeyframe(0, 100);       // Start at top
track.addKeyframe(500, 300);     // Fall to bottom
track.addKeyframe(700, 200);     // Bounce back up
track.addKeyframe(900, 280);     // Fall again (smaller)
track.addKeyframe(1000, 300);    // Settle at bottom
```

### Editing Curves

Between keyframes, you can adjust the easing curve:

```javascript
// Set easing for entire track
track.setEasing(Easing.easeInOutCubic);

// Set easing between specific keyframes
track.setEasingBetween(0, 1, Easing.easeOutBounce);  // First two keyframes
track.setEasingBetween(1, 2, Easing.linear);         // Next segment
```

### Playback Controls

```javascript
// Play timeline
timeline.play();

// Pause timeline
timeline.pause();

// Stop and reset
timeline.stop();

// Seek to specific time
timeline.seek(500);  // Jump to 500ms

// Set playback speed
timeline.setSpeed(2.0);  // 2x speed
timeline.setSpeed(0.5);  // Half speed

// Loop
timeline.setLoop(true);

// Callbacks
timeline.onComplete(() => {
    console.log('Timeline finished!');
});
```

### Timeline UI (Visual Editor)

The visual timeline editor provides:

1. **Track List**: Shows all animated properties
2. **Keyframe Markers**: Diamond-shaped markers on tracks
3. **Curve Editor**: Visual editing of easing curves
4. **Playhead**: Shows current playback position
5. **Zoom/Pan**: Navigate long timelines

**Using the timeline editor:**
1. Select an actor
2. Click "Add Track" in timeline panel
3. Choose property to animate
4. Click on timeline to add keyframes
5. Drag keyframes to adjust timing
6. Double-click between keyframes to edit easing curve
7. Press Play to preview

---

## Multi-Property Animation

Animate multiple properties simultaneously for complex effects.

### Parallel Animations

Animate different properties at the same time:

```javascript
// Move AND resize simultaneously
animations.animate(rect, 'left', 500, 1000, {
    easing: Easing.easeInOutCubic,
    onUpdate: () => stage.render()
});

animations.animate(rect, 'width', 300, 1000, {
    easing: Easing.easeInOutCubic,
    onUpdate: () => stage.render()
});

animations.animate(rect, 'height', 200, 1000, {
    easing: Easing.easeInOutCubic,
    onUpdate: () => stage.render()
});
```

### Sequential Animations

Use `onComplete` callbacks to chain animations:

```javascript
// Move right, THEN move down, THEN fade out
animations.animate(rect, 'left', 500, 1000, {
    onUpdate: () => stage.render(),
    onComplete: () => {
        // First animation done, start second
        animations.animate(rect, 'top', 400, 1000, {
            onUpdate: () => stage.render(),
            onComplete: () => {
                // Second done, start third
                animations.animate(rect, 'opacity', 0, 500, {
                    onUpdate: () => stage.render()
                });
            }
        });
    }
});
```

### Complex Choreography

Animate multiple actors with careful timing:

```javascript
// Staggered animation - actors animate one after another
const actors = [rect1, rect2, rect3, rect4, rect5];
const delay = 200;  // 200ms between each

actors.forEach((actor, index) => {
    setTimeout(() => {
        animations.animate(actor, 'top', 400, 1000, {
            easing: Easing.easeOutBounce,
            onUpdate: () => stage.render()
        });
    }, delay * index);
});
```

### Synchronizing Multiple Actors

```javascript
// All actors move together
const actors = [rect1, rect2, rect3];
const duration = 1000;

actors.forEach(actor => {
    animations.animate(actor, 'left', 500, duration, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });
});

// Add variety with different target values
actors.forEach((actor, index) => {
    const targetY = 100 + index * 100;
    animations.animate(actor, 'top', targetY, duration, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });
});
```

---

## Animation Helpers

SK8 provides helper functions for common animations.

### FadeIn / FadeOut

```javascript
import { AnimationHelpers } from './dist/sk8.js';

// Fade in over 300ms
AnimationHelpers.fadeIn(myActor, 300);

// Fade out over 500ms
AnimationHelpers.fadeOut(myActor, 500);

// Custom fade
AnimationHelpers.fadeIn(myActor, 1000);  // Slow fade in
```

### MoveTo

Move an actor to a specific position:

```javascript
// Move to (100, 200) over 500ms
AnimationHelpers.moveTo(myActor, 100, 200, 500);

// Move to mouse click position
canvas.addEventListener('click', (e) => {
    AnimationHelpers.moveTo(myActor, e.offsetX, e.offsetY, 300);
});
```

### ScaleTo

Uniformly scale an actor:

```javascript
// Scale to 150% size over 500ms
AnimationHelpers.scaleTo(myActor, 1.5, 500);

// Scale to 50% size (shrink)
AnimationHelpers.scaleTo(myActor, 0.5, 500);

// Scale to double size
AnimationHelpers.scaleTo(myActor, 2.0, 1000);
```

### Pulse

Create a pulsing effect (grow and shrink):

```javascript
// Pulse to 120% size and back over 400ms
AnimationHelpers.pulse(myActor, 1.2, 400);

// Bigger pulse
AnimationHelpers.pulse(myActor, 1.5, 600);

// Use on button click for feedback
button.addHandler('click', function() {
    AnimationHelpers.pulse(this, 1.1, 200);
});
```

### Shake

Shake an actor for emphasis or error indication:

```javascript
// Shake with 10px intensity over 500ms
AnimationHelpers.shake(myActor, 10, 500);

// Strong shake
AnimationHelpers.shake(myActor, 20, 800);

// Error feedback
if (password.length < 8) {
    AnimationHelpers.shake(passwordField, 15, 400);
    alert('Password too short!');
}
```

### Creating Custom Helpers

```javascript
// Custom animation helper: rotate360
function rotate360(actor, duration = 1000) {
    const startRotation = actor.get('rotation') || 0;
    animations.animate(actor, 'rotation', startRotation + 360, duration, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });
}

// Use it
rotate360(myActor, 2000);

// Custom: bounce in from top
function bounceInFromTop(actor, targetY, duration = 1000) {
    actor.set('top', -100);  // Start above screen
    actor.set('visible', true);

    animations.animate(actor, 'top', targetY, duration, {
        easing: Easing.easeOutBounce,
        onUpdate: () => stage.render()
    });
}

bounceInFromTop(myActor, 200, 1500);
```

---

## Custom Easing

Create your own easing functions for unique effects.

### Easing Function Format

An easing function takes a value from 0 to 1 (progress) and returns a value (usually 0 to 1):

```javascript
function myEasing(t) {
    // t goes from 0.0 (start) to 1.0 (end)
    // return modified value
    return modifiedValue;
}
```

### Linear Easing (for reference)

```javascript
function linear(t) {
    return t;  // No change
}
```

### Custom Easing Examples

#### Steps (no smooth transition)

```javascript
function steps(numSteps) {
    return function(t) {
        return Math.floor(t * numSteps) / numSteps;
    };
}

// Use it
animations.animate(actor, 'left', 500, 1000, {
    easing: steps(5),  // 5 discrete steps
    onUpdate: () => stage.render()
});
```

#### Overshoot (go past target and come back)

```javascript
function overshoot(t) {
    const overshootAmount = 0.1;
    const s = 1 + overshootAmount;
    return t * t * ((s + 1) * t - s);
}

animations.animate(actor, 'left', 500, 1000, {
    easing: overshoot,
    onUpdate: () => stage.render()
});
```

#### Wave (sine wave)

```javascript
function wave(t) {
    return Math.sin(t * Math.PI * 2);
}

// Oscillate left and right
animations.animate(actor, 'left', 500, 2000, {
    easing: wave,
    onUpdate: () => stage.render()
});
```

### Bezier Curves

Bezier curves offer precise control over easing:

```javascript
// Cubic bezier: (x1, y1, x2, y2)
function cubicBezier(x1, y1, x2, y2) {
    // Implementation of cubic bezier easing
    return function(t) {
        // ... bezier math ...
        // SK8 may provide this built-in
    };
}

// Material Design's "standard" curve
const materialStandard = cubicBezier(0.4, 0.0, 0.2, 1.0);

animations.animate(actor, 'left', 500, 1000, {
    easing: materialStandard,
    onUpdate: () => stage.render()
});
```

### Combining Easings

```javascript
// Use different easings for different parts
function customEasing(t) {
    if (t < 0.5) {
        // First half: ease in
        return Easing.easeInQuad(t * 2) / 2;
    } else {
        // Second half: ease out
        return 0.5 + Easing.easeOutBounce((t - 0.5) * 2) / 2;
    }
}
```

---

## Performance Tips

Keep animations smooth and efficient.

### Target 60 FPS

Animations should run at 60 frames per second for smoothness:

```javascript
// Good: Update only when needed
animations.animate(actor, 'left', 500, 1000, {
    onUpdate: () => stage.render()  // Only re-render during animation
});

// Bad: Constantly updating
setInterval(() => stage.render(), 16);  // Wastes CPU even when nothing changes
```

### Batch Renders

If animating multiple properties, render once per frame:

```javascript
// Instead of this:
animations.animate(actor, 'left', 500, 1000, {
    onUpdate: () => stage.render()
});
animations.animate(actor, 'top', 300, 1000, {
    onUpdate: () => stage.render()
});
// (Renders twice per frame!)

// Do this:
let needsRender = false;

animations.animate(actor, 'left', 500, 1000, {
    onUpdate: () => { needsRender = true; }
});
animations.animate(actor, 'top', 300, 1000, {
    onUpdate: () => { needsRender = true; }
});

// Single render loop
function renderLoop() {
    if (needsRender) {
        stage.render();
        needsRender = false;
    }
    requestAnimationFrame(renderLoop);
}
renderLoop();
```

### Avoid Expensive Operations in Animations

```javascript
// Bad: Expensive calculation every frame
animations.animate(actor, 'left', 500, 1000, {
    onUpdate: (value) => {
        // Heavy calculation runs 60 times per second!
        const color = calculateComplexColor(value);
        actor.set('fillColor', color);
        stage.render();
    }
});

// Good: Pre-calculate or optimize
const colorLookup = preCalculateColors();
animations.animate(actor, 'left', 500, 1000, {
    onUpdate: (value) => {
        const color = colorLookup[Math.floor(value)];
        actor.set('fillColor', color);
        stage.render();
    }
});
```

### Limit Simultaneous Animations

```javascript
// If animating many objects, stagger them
const actors = getAllActors();  // 100 actors

// Bad: All start at once (hard on CPU)
actors.forEach(actor => {
    animations.animate(actor, 'left', 500, 1000, {
        onUpdate: () => stage.render()
    });
});

// Good: Stagger start times
actors.forEach((actor, index) => {
    setTimeout(() => {
        animations.animate(actor, 'left', 500, 1000, {
            onUpdate: () => stage.render()
        });
    }, index * 50);  // 50ms delay between each
});
```

### Use GPU Acceleration Hints

*Note: Browser-dependent, but these properties often use GPU:*

```javascript
// Properties that may use GPU:
// - transform (CSS: translate, scale, rotate)
// - opacity

// Properties that may NOT use GPU:
// - left, top (triggers layout)
// - width, height (triggers layout)

// For web-based SK8, consider using transform when possible
```

### Cleanup After Animations

```javascript
// Cancel animations when actors are removed
function removeActor(actor) {
    animations.cancelAllFor(actor);  // Stop its animations
    stage.removeActor(actor);
}
```

### Monitor Performance

```javascript
// Check frame rate
let frameCount = 0;
let lastTime = Date.now();

function renderLoop() {
    stage.render();
    frameCount++;

    const now = Date.now();
    if (now - lastTime >= 1000) {
        console.log('FPS:', frameCount);
        frameCount = 0;
        lastTime = now;
    }

    requestAnimationFrame(renderLoop);
}

// If FPS drops below 30, reduce animation complexity
```

---

## Advanced Techniques

### Spring Physics

Create natural, physics-based animations:

```javascript
function spring(stiffness = 100, damping = 10) {
    return function(t) {
        const w = Math.sqrt(stiffness);
        const zeta = damping / (2 * Math.sqrt(stiffness));

        if (zeta < 1) {
            // Underdamped spring (bouncy)
            const wd = w * Math.sqrt(1 - zeta * zeta);
            return 1 - Math.exp(-zeta * w * t) * Math.cos(wd * t);
        } else {
            // Critically damped (smooth settle)
            return 1 - Math.exp(-w * t) * (1 + w * t);
        }
    };
}

// Bouncy spring animation
animations.animate(actor, 'left', 500, 1000, {
    easing: spring(150, 8),  // Adjust stiffness and damping
    onUpdate: () => stage.render()
});
```

### Path Following

Animate along a curved path:

```javascript
// Define a path (array of points)
const path = [
    { x: 50, y: 50 },
    { x: 200, y: 100 },
    { x: 300, y: 300 },
    { x: 450, y: 200 },
    { x: 550, y: 350 }
];

// Interpolate along path
function followPath(actor, path, duration) {
    const totalLength = calculatePathLength(path);
    let startTime = Date.now();

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = Easing.easeInOutCubic(progress);

        // Get position along path
        const point = getPointAtDistance(path, easedProgress * totalLength);
        actor.set('left', point.x);
        actor.set('top', point.y);

        stage.render();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    update();
}

function calculatePathLength(path) {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i-1].x;
        const dy = path[i].y - path[i-1].y;
        length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
}

function getPointAtDistance(path, distance) {
    let travelled = 0;
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i-1].x;
        const dy = path[i].y - path[i-1].y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (travelled + segmentLength >= distance) {
            // Point is on this segment
            const t = (distance - travelled) / segmentLength;
            return {
                x: path[i-1].x + dx * t,
                y: path[i-1].y + dy * t
            };
        }

        travelled += segmentLength;
    }

    return path[path.length - 1];
}

// Use it
followPath(myActor, path, 3000);
```

### Morphing Shapes

Animate between different shapes:

```javascript
// Morph from rectangle to circle
function morphToCircle(rect, duration = 1000) {
    const startRadius = 0;
    const endRadius = rect.get('width') / 2;

    // Animate corner radius
    animations.animate(rect, 'cornerRadius', endRadius, duration, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });

    // Make it square (circles need equal width/height)
    const size = Math.max(rect.get('width'), rect.get('height'));
    animations.animate(rect, 'width', size, duration, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });
    animations.animate(rect, 'height', size, duration, {
        easing: Easing.easeInOutCubic,
        onUpdate: () => stage.render()
    });
}
```

### Particle Systems

Create effects with many animated particles:

```javascript
function createParticleExplosion(x, y, count = 50) {
    for (let i = 0; i < count; i++) {
        const particle = new SK8Circle();
        particle.set('boundsRect', { left: x-5, top: y-5, right: x+5, bottom: y+5 });
        particle.set('fillColor', {
            r: Math.random() * 255,
            g: Math.random() * 255,
            b: Math.random() * 255,
            a: 1
        });

        stage.addActor(particle);

        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 50;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        // Animate outward
        animations.animate(particle, 'left', targetX, 1000, {
            easing: Easing.easeOutQuad,
            onUpdate: () => stage.render()
        });
        animations.animate(particle, 'top', targetY, 1000, {
            easing: Easing.easeOutQuad,
            onUpdate: () => stage.render()
        });

        // Fade out
        animations.animate(particle, 'opacity', 0, 1000, {
            easing: Easing.linear,
            onComplete: () => {
                stage.removeActor(particle);
            },
            onUpdate: () => stage.render()
        });
    }
}

// Trigger on click
canvas.addEventListener('click', (e) => {
    createParticleExplosion(e.offsetX, e.offsetY);
});
```

### Cinematic Sequences

Chain multiple animations for storytelling:

```javascript
async function playIntroSequence() {
    // Scene 1: Title fades in
    const title = new SK8Text();
    title.set('text', 'SK8 Adventure');
    title.set('fontSize', 48);
    title.set('opacity', 0);
    title.set('left', 200);
    title.set('top', 150);
    stage.addActor(title);

    await fadeIn(title, 1000);
    await wait(2000);
    await fadeOut(title, 1000);

    // Scene 2: Hero enters
    const hero = new SK8Rectangle();
    hero.set('left', -100);
    hero.set('top', 250);
    hero.set('fillColor', 'blue');
    stage.addActor(hero);

    await slideIn(hero, 200, 1500);
    await wait(500);

    // Scene 3: Enemy appears
    const enemy = new SK8Circle();
    enemy.set('left', 800);
    enemy.set('top', 250);
    enemy.set('fillColor', 'red');
    stage.addActor(enemy);

    await slideIn(enemy, 500, 1500);

    // Scene 4: Battle!
    await pulse(hero, 1.2, 200);
    await pulse(enemy, 1.2, 200);

    // ... continue the story ...
}

// Helper to promisify animations
function fadeIn(actor, duration) {
    return new Promise(resolve => {
        AnimationHelpers.fadeIn(actor, duration);
        setTimeout(resolve, duration);
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

playIntroSequence();
```

---

## Next Steps

- **[UI Components Guide](UI_COMPONENTS.md)** - Animate UI widgets
- **[Recipe Book](RECIPES.md)** - Animation recipes and examples
- **[Visual IDE Guide](VISUAL_IDE.md)** - Use the timeline editor

Experiment with different easing functions and combine animations to create unique effects!
