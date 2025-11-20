# Troubleshooting Guide

Solutions to common problems and issues in SK8.

## Table of Contents

- [Installation Problems](#installation-problems)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)
- [Common Mistakes](#common-mistakes)
- [Debug Techniques](#debug-techniques)
- [Getting Help](#getting-help)

---

## Installation Problems

### Node.js Not Installed

**Problem:** `node: command not found` or `npm: command not found`

**Solution:**
1. Download Node.js from [nodejs.org](https://nodejs.org)
2. Install the LTS version
3. Restart your terminal
4. Verify: `node --version` and `npm --version`

### npm install Fails

**Problem:** Errors during `npm install`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Permission Errors (Mac/Linux)

**Problem:** `EACCES: permission denied`

**Solution:**
```bash
# Don't use sudo with npm!
# Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to ~/.profile or ~/.bash_profile:
export PATH=~/.npm-global/bin:$PATH

# Source the file
source ~/.profile
```

---

## Build Errors

### TypeScript Compilation Errors

**Problem:** `tsc` reports type errors

**Solution:**
1. Check that all imports are correct
2. Ensure types match function signatures
3. Run `npm run build` to see all errors
4. Fix one error at a time from the top

**Common type errors:**
```typescript
// Error: Type 'string' is not assignable to type 'number'
actor.set('left', "100");  // Wrong
actor.set('left', 100);    // Correct

// Error: Object is possibly 'null'
const actor = stage.actorAtPoint(x, y);
actor.set('fillColor', 'red');  // Might be null

// Fix:
if (actor) {
    actor.set('fillColor', 'red');
}
```

### Module Not Found

**Problem:** `Cannot find module 'SK8Actor'`

**Solution:**
1. Check import path is correct
2. Ensure file has `.js` extension in import:
   ```typescript
   import { SK8Actor } from './SK8Actor.js';  // Correct
   import { SK8Actor } from './SK8Actor';     // Wrong
   ```
3. Run `npm run build` to regenerate dist files

### Build Hangs

**Problem:** Build process never completes

**Solution:**
```bash
# Kill the process (Ctrl+C)
# Clear build cache
rm -rf dist/

# Try again
npm run build
```

---

## Runtime Errors

### Canvas Not Found

**Problem:** `Cannot read property 'getContext' of null`

**Solution:**
```javascript
// Make sure canvas element exists
const canvas = document.getElementById('myCanvas');
if (!canvas) {
    console.error('Canvas element not found!');
    // Check that HTML has: <canvas id="myCanvas"></canvas>
}

const stage = new SK8Stage(canvas);
```

### Stage Not Rendering

**Problem:** Nothing appears on canvas

**Solution:**
```javascript
// 1. Make sure you're calling render
stage.render();  // Or
stage.startRendering();

// 2. Check actors are added to stage
stage.addActor(myActor);

// 3. Check actor visibility
myActor.set('visible', true);

// 4. Check actor position is on-screen
console.log(myActor.get('left'), myActor.get('top'));

// 5. Check canvas size
console.log(canvas.width, canvas.height);
```

### Animations Not Working

**Problem:** Animations don't run smoothly or at all

**Solution:**
```javascript
// 1. Make sure you're calling onUpdate
animations.animate(actor, 'left', 500, 1000, {
    onUpdate: () => stage.render()  // Required!
});

// 2. Check animation manager is running
import { animations } from './sk8.js';
// animations is global, should work automatically

// 3. Check browser console for errors
// Open DevTools (F12) and check Console tab
```

### Event Handlers Not Firing

**Problem:** Click handlers don't respond

**Solution:**
```javascript
// 1. Make sure handler is added correctly
actor.addHandler('click', function() {
    console.log('Clicked!');
});

// 2. Check actor is visible and on-screen
actor.set('visible', true);

// 3. Check actor position contains click point
const bounds = actor.getBoundsRect();
console.log('Bounds:', bounds);

// 4. Check stage is handling events
stage.startRendering();  // Enables event handling

// 5. Test with simple handler
actor.addHandler('click', () => alert('Works!'));
```

### Property Not Updating

**Problem:** Setting property has no effect

**Solution:**
```javascript
// 1. Use set() method
actor.set('fillColor', 'red');  // Correct
actor.fillColor = 'red';        // Wrong (won't work)

// 2. Render after changing
actor.set('fillColor', 'red');
stage.render();

// 3. Check property name is correct
// Use exact casing
actor.set('fillColor', 'red');  // Correct
actor.set('fillcolor', 'red');  // Wrong
```

---

## Performance Issues

### Low Frame Rate

**Problem:** Animation is choppy or slow

**Solutions:**
```javascript
// 1. Reduce number of actors
// Aim for < 100 visible actors

// 2. Avoid expensive operations in render loop
// Bad:
function render() {
    actors.forEach(a => {
        a.doExpensiveCalculation();  // Every frame!
    });
    stage.render();
}

// Good:
const precomputed = actors.map(a => a.doExpensiveCalculation());
function render() {
    // Use precomputed values
    stage.render();
}

// 3. Use requestAnimationFrame
function renderLoop() {
    stage.render();
    requestAnimationFrame(renderLoop);
}
renderLoop();

// 4. Check frame rate
let frameCount = 0;
setInterval(() => {
    console.log('FPS:', frameCount);
    frameCount = 0;
}, 1000);

function renderLoop() {
    stage.render();
    frameCount++;
    requestAnimationFrame(renderLoop);
}
```

### High Memory Usage

**Problem:** Browser becomes slow or crashes

**Solutions:**
```javascript
// 1. Remove unused actors
stage.removeActor(oldActor);

// 2. Cancel animations when done
const animId = animations.animate(...);
animations.cancel(animId);

// 3. Clear event listeners
actor.removeHandler('click', handlerFn);

// 4. Dispose of large assets
picture.unload();  // Free image memory

// 5. Monitor memory in DevTools
// Chrome: Performance -> Memory
```

### Slow Load Times

**Problem:** Application takes long to start

**Solutions:**
```javascript
// 1. Optimize images
// Resize to needed dimensions
// Compress with tools like TinyPNG

// 2. Load assets progressively
async function loadAssets() {
    await loadCriticalAssets();   // Load essential first
    startApp();
    await loadNonCriticalAssets(); // Load rest in background
}

// 3. Use lazy loading
// Load assets only when needed

// 4. Enable browser caching
// Set correct cache headers for assets
```

---

## Browser Compatibility

### Canvas Not Supported

**Problem:** Old browser doesn't support Canvas

**Solution:**
```javascript
// Check for Canvas support
if (!canvas.getContext) {
    alert('Your browser does not support HTML5 Canvas. Please upgrade.');
    return;
}
```

### ES6 Modules Not Working

**Problem:** Import/export not supported

**Solution:**
```html
<!-- Use type="module" in script tag -->
<script type="module" src="main.js"></script>

<!-- For older browsers, use a bundler like Webpack -->
```

### Audio/Video Issues

**Problem:** Media not playing in some browsers

**Solutions:**
```javascript
// 1. Use supported formats
// Video: MP4 (H.264)
// Audio: MP3, WAV

// 2. Add autoplay restrictions workaround
// Many browsers block autoplay
video.play().catch(err => {
    console.log('Autoplay blocked:', err);
    // Show play button instead
});

// 3. Provide multiple formats
<video>
    <source src="video.mp4" type="video/mp4">
    <source src="video.webm" type="video/webm">
</video>
```

---

## Common Mistakes

### Forgetting to Render

```javascript
// ❌ Wrong: Changes not visible
actor.set('fillColor', 'red');

// ✓ Correct: Render after change
actor.set('fillColor', 'red');
stage.render();
```

### Incorrect Property Names

```javascript
// ❌ Wrong: Property doesn't exist
actor.set('color', 'red');

// ✓ Correct: Use exact property name
actor.set('fillColor', 'red');
```

### Wrong Color Format

```javascript
// ❌ Wrong: Invalid color
actor.set('fillColor', 'rgb(255, 0, 0)');

// ✓ Correct: Use SK8 color format
actor.set('fillColor', { r: 255, g: 0, b: 0, a: 1.0 });
// Or shorthand
actor.set('fillColor', 'red');
```

### Not Handling Null

```javascript
// ❌ Wrong: May throw error
const actor = stage.actorAtPoint(x, y);
actor.set('fillColor', 'red');  // Error if no actor found!

// ✓ Correct: Check for null
const actor = stage.actorAtPoint(x, y);
if (actor) {
    actor.set('fillColor', 'red');
}
```

### Infinite Loops

```javascript
// ❌ Wrong: Infinite loop!
while (true) {
    doSomething();
}

// ✓ Correct: Add exit condition
while (condition && iterations < 1000) {
    doSomething();
    iterations++;
}
```

---

## Debug Techniques

### Console Logging

```javascript
// Log values
console.log('Actor position:', actor.get('left'), actor.get('top'));

// Log objects
console.log('Actor:', actor);

// Group related logs
console.group('Animation Debug');
console.log('Start value:', start);
console.log('End value:', end);
console.log('Duration:', duration);
console.groupEnd();

// Conditional logging
if (DEBUG) {
    console.log('Debug info:', data);
}
```

### Browser DevTools

**Open DevTools:** Press F12 or Right-click > Inspect

**Console tab:**
- View errors and warnings
- Run JavaScript interactively
- Test SK8 commands

**Sources tab:**
- Set breakpoints
- Step through code
- Inspect variables

**Performance tab:**
- Profile rendering performance
- Find bottlenecks
- Monitor FPS

**Network tab:**
- Check asset loading
- View load times
- Debug failed requests

### Debug Helpers

```javascript
// Create debug overlay
function createDebugOverlay() {
    const overlay = new SK8Label();
    overlay.set('left', 10);
    overlay.set('top', 10);
    overlay.set('fillColor', 'white');
    stage.addActor(overlay);

    function update() {
        const fps = calculateFPS();
        const actors = stage.getActors().length;
        overlay.set('text', `FPS: ${fps} | Actors: ${actors}`);
        stage.render();
        requestAnimationFrame(update);
    }
    update();
}

// Visualize bounds
function debugBounds(actor) {
    const bounds = actor.getBoundsRect();
    const rect = new SK8Rectangle();
    rect.set('boundsRect', bounds);
    rect.set('fillColor', 'transparent');
    rect.set('frameColor', 'red');
    rect.set('frameWidth', 2);
    stage.addActor(rect);
}
```

---

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Read the error message carefully
3. Search the FAQ
4. Try a minimal example to isolate the problem
5. Check browser console for errors

### Where to Get Help

**Documentation:**
- Read [Getting Started](GETTING_STARTED.md)
- Check [FAQ](FAQ.md)
- Review [API Reference](../typescript/README.md)

**Community:**
- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Stack Overflow: Tag with `sk8`

**When Reporting Bugs:**

Include:
1. SK8 version: Check `package.json`
2. Browser and version
3. Operating system
4. Minimal code to reproduce
5. Expected vs. actual behavior
6. Error messages (full text)
7. Screenshots if relevant

**Good bug report:**
```
Title: Rectangle fillColor not updating

SK8 version: 0.4.0
Browser: Chrome 120.0
OS: Windows 11

Steps to reproduce:
1. Create rectangle
2. Set fillColor to 'red'
3. Call stage.render()

Expected: Rectangle turns red
Actual: Rectangle stays default color

Code:
const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 50, top: 50, right: 150, bottom: 150 });
rect.set('fillColor', 'red');
stage.addActor(rect);
stage.render();

Error: (none in console)
```

---

**Still having trouble?** Check the [FAQ](FAQ.md) or ask in GitHub Discussions!
