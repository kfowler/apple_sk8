# SK8 TypeScript Performance Guide

## Table of Contents

1. [Rendering Performance](#rendering-performance)
2. [Memory Usage](#memory-usage)
3. [Profiling](#profiling)
4. [Common Bottlenecks](#common-bottlenecks)
5. [Optimization Techniques](#optimization-techniques)
6. [Dirty Rectangle Implementation](#dirty-rectangle-implementation)
7. [When to Use What](#when-to-use-what)

---

## Rendering Performance

### Target: 60 FPS

SK8 aims for 60 frames per second (16.67ms per frame).

**Frame Budget Breakdown:**
```
16.67ms total per frame
├── 2ms   - Event processing
├── 1ms   - Animation updates
├── 10ms  - Rendering (Canvas operations)
├── 2ms   - Browser compositing
└── 1.67ms - Buffer
```

### Full Render Performance

**Without Optimization:**
- Simple scene (10 actors): ~200 fps
- Medium scene (50 actors): ~60 fps
- Complex scene (200 actors): ~20 fps ❌

### Dirty Rectangle Performance

**With Optimization:**
- Simple scene: ~300 fps
- Medium scene: ~120 fps
- Complex scene (200 actors, 10 moving): ~55 fps ✓

**When It Helps:**
- Large number of static actors
- Few actors changing per frame
- Simple shapes (rectangles, circles)

**When It Doesn't:**
- Most actors moving
- Complex gradients/effects
- Small canvas size

### Enabling Dirty Rectangles

```typescript
stage.setUseDirtyRectOptimization(true);
```

**Automatic Optimization:**
The system automatically merges overlapping dirty rectangles to minimize redraws.

---

## Memory Usage

### Typical Memory Footprint

```
Base SK8 Runtime:       ~5 MB
Per SK8Object:          ~2 KB
Per SK8Actor:           ~5 KB
Per Event Listener:     ~1 KB
Animation (active):     ~3 KB
Cached Image (1MB):     ~1 MB (ImageData)
```

### Memory Optimization

#### 1. Remove Event Listeners

```typescript
// Bad - leaks memory
actor.addEventListener('click', function() { /* ... */ });

// Good - cleanup on removal
const handler = function() { /* ... */ };
actor.addEventListener('click', handler);

// Later, when removing actor:
actor.removeEventListener('click', handler);
```

#### 2. Clear Property Observers

```typescript
const observer = (newVal, oldVal) => { /* ... */ };
actor.addPropertyObserver('width', observer);

// Clean up
actor.removePropertyObserver('width', observer);
```

#### 3. Cancel Animations

```typescript
// Cancel specific animation
animations.cancel(animId);

// Cancel all for actor
animations.cancelAllFor(actor);
```

#### 4. Dispose Computed Properties

```typescript
// Computed properties cache results
// Clear cache when object is removed
actor.clearComputedCache?.();  // If implemented
```

### Asset Management

#### Reference Counting

```typescript
// Acquire reference
const asset = mediaManager.acquire(assetId);

// Use asset...

// Release when done
mediaManager.release(assetId);
// Asset is unloaded when refCount reaches 0
```

#### Cache Limits

```typescript
// Memory cache: 50 MB (configurable)
assetCache.setMaxMemorySize(50 * 1024 * 1024);

// LRU eviction keeps hot assets in memory
// Cold assets move to IndexedDB
```

### Garbage Collection

**Avoiding GC Pauses:**

```typescript
// Bad - creates new objects each frame
function updateAnimations() {
  for (const anim of animations) {
    const bounds = { left: 0, top: 0, right: 100, bottom: 100 };  // ❌
    // ...
  }
}

// Good - reuse objects
const tempBounds = { left: 0, top: 0, right: 0, bottom: 0 };
function updateAnimations() {
  for (const anim of animations) {
    tempBounds.left = anim.x;
    tempBounds.top = anim.y;
    // ...
  }
}
```

---

## Profiling

### Chrome DevTools

#### Performance Tab

```
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with SK8 application
5. Stop recording
6. Analyze flame graph
```

**Look For:**
- Long frames (>16.67ms)
- Frequent GC (green bars)
- Layout thrashing
- Heavy functions (wide bars in flame chart)

#### Memory Tab

```
1. Take heap snapshot
2. Perform actions
3. Take another snapshot
4. Compare snapshots
5. Look for:
   - Detached DOM nodes
   - Retained event listeners
   - Large arrays/objects
```

### SK8 Built-in Profiling

```typescript
// Get current FPS
const fps = stage.getFPS();
console.log(`Current FPS: ${fps}`);

// Monitor over time
setInterval(() => {
  const fps = stage.getFPS();
  if (fps < 50) {
    console.warn(`Performance degraded: ${fps} FPS`);
  }
}, 1000);
```

### Performance Markers

```typescript
// Add custom markers
performance.mark('animation-start');
// ... do work ...
performance.mark('animation-end');
performance.measure('animation', 'animation-start', 'animation-end');

// View in DevTools Performance tab
```

---

## Common Bottlenecks

### 1. Excessive Rendering

**Problem:**
```typescript
// Bad - renders on every property change
function updateActor() {
  actor.set('x', newX);
  stage.render();  // ❌
  actor.set('y', newY);
  stage.render();  // ❌
  actor.set('width', newWidth);
  stage.render();  // ❌
}
```

**Solution:**
```typescript
// Good - batch changes, single render
function updateActor() {
  actor.set('x', newX);
  actor.set('y', newY);
  actor.set('width', newWidth);
  stage.setNeedsRender();  // ✓ Deferred render
}
```

### 2. Heavy Property Getters

**Problem:**
```typescript
// Bad - expensive calculation on every get
class MyActor extends SK8Actor {
  get area(): number {
    // Complex calculation every time
    return this.calculateComplexArea();  // ❌
  }
}
```

**Solution:**
```typescript
// Good - use computed property with caching
class MyActor extends SK8Actor {
  constructor() {
    super();
    this.defineProperty('area', {
      computed: true,
      dependencies: ['width', 'height'],
      getter: () => this.width * this.height  // ✓ Cached
    });
  }
}
```

### 3. Event Listener Proliferation

**Problem:**
```typescript
// Bad - creates listener for every actor
for (const actor of actors) {
  actor.addEventListener('click', function(e) {  // ❌ 100 listeners
    handleClick(e);
  });
}
```

**Solution:**
```typescript
// Good - single listener with delegation
stage.addEventListener('click', (e) => {  // ✓ 1 listener
  const actor = stage.actorAtPoint(e.x, e.y);
  if (actor) {
    handleClick(actor, e);
  }
});
```

### 4. Inefficient Hit Testing

**Problem:**
```typescript
// Bad - tests all actors linearly
function findActors(x: number, y: number): SK8Actor[] {
  return actors.filter(actor => actor.containsPoint(x, y));  // ❌ O(n)
}
```

**Solution:**
```typescript
// Good - spatial indexing (future optimization)
class SpatialIndex {
  private grid: Map<string, SK8Actor[]>;

  insert(actor: SK8Actor) {
    const cell = this.getCell(actor.getBoundsRect());
    // Add to grid cell
  }

  query(x: number, y: number): SK8Actor[] {
    const cell = this.getCell({ left: x, top: y, right: x, bottom: y });
    return cell.filter(actor => actor.containsPoint(x, y));  // ✓ O(k) where k << n
  }
}
```

### 5. String Concatenation in Loops

**Problem:**
```typescript
// Bad - creates many intermediate strings
let result = '';
for (const item of items) {
  result += item.toString() + ', ';  // ❌
}
```

**Solution:**
```typescript
// Good - use array join
const result = items.map(item => item.toString()).join(', ');  // ✓
```

---

## Optimization Techniques

### 1. Object Pooling

Reuse objects instead of creating new ones:

```typescript
class ActorPool {
  private pool: SK8Actor[] = [];

  acquire(type: ActorType): SK8Actor {
    let actor = this.pool.pop();
    if (!actor) {
      actor = this.createActor(type);
    }
    actor.reset();
    return actor;
  }

  release(actor: SK8Actor): void {
    this.pool.push(actor);
  }
}
```

### 2. Batch Operations

```typescript
// Bad
actors.forEach(actor => {
  actor.moveTo(newX, newY);
  stage.render();  // ❌ Renders N times
});

// Good
actors.forEach(actor => {
  actor.moveTo(newX, newY);
});
stage.render();  // ✓ Renders once
```

### 3. Debounce Expensive Operations

```typescript
import { debounce } from 'sk8-ts';

const expensiveOperation = debounce(() => {
  // Heavy calculation
  recalculateLayout();
}, 250);

window.addEventListener('resize', expensiveOperation);
```

### 4. Virtual Scrolling

For large lists of actors:

```typescript
class VirtualScroller {
  private visibleActors: SK8Actor[] = [];

  update(scrollY: number, viewportHeight: number) {
    const startIdx = Math.floor(scrollY / ITEM_HEIGHT);
    const endIdx = Math.ceil((scrollY + viewportHeight) / ITEM_HEIGHT);

    // Only render visible range
    this.visibleActors = allActors.slice(startIdx, endIdx);
  }
}
```

### 5. Lazy Loading

```typescript
class LazyActor extends SK8Actor {
  private imageData: ImageData | null = null;

  render(ctx: CanvasRenderingContext2D) {
    if (!this.imageData) {
      this.imageData = this.loadImageData();  // Load on first render
    }
    ctx.putImageData(this.imageData, this.left, this.top);
  }
}
```

### 6. RequestAnimationFrame Timing

```typescript
// Good - align with browser repaint
function renderLoop() {
  if (needsRender) {
    render();
  }
  requestAnimationFrame(renderLoop);
}

// Bad - setInterval doesn't align with repaint
setInterval(render, 16);  // ❌ Can cause jank
```

---

## Dirty Rectangle Implementation

### How It Works

```typescript
class SK8Stage {
  private dirtyRects: Rect[] = [];

  markActorDirty(actor: SK8Actor): void {
    // Add actor's bounds to dirty list
    this.dirtyRects.push(actor.getBoundsRect());
  }

  render(): void {
    if (this.dirtyRects.length > 0) {
      // Merge overlapping rects
      const merged = this.mergeDirtyRects();

      // Render only dirty regions
      for (const dirtyRect of merged) {
        this.renderDirtyRect(dirtyRect);
      }
    } else {
      // Full render
      this.renderFull();
    }

    this.dirtyRects = [];
  }

  private renderDirtyRect(dirtyRect: Rect): void {
    // Clip to dirty region
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(dirtyRect.left, dirtyRect.top,
                  dirtyRect.right - dirtyRect.left,
                  dirtyRect.bottom - dirtyRect.top);
    this.ctx.clip();

    // Clear region
    this.ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    this.ctx.fillRect(dirtyRect.left, dirtyRect.top,
                     dirtyRect.right - dirtyRect.left,
                     dirtyRect.bottom - dirtyRect.top);

    // Render intersecting actors
    for (const actor of this.actors) {
      if (actor.getVisible() && this.intersects(actor.getBoundsRect(), dirtyRect)) {
        actor.render(this.ctx);
      }
    }

    this.ctx.restore();
  }
}
```

### Merge Algorithm

```typescript
private mergeDirtyRects(): Rect[] {
  if (this.dirtyRects.length <= 1) return this.dirtyRects;

  const merged: Rect[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < this.dirtyRects.length; i++) {
    if (processed.has(i)) continue;

    let currentRect = { ...this.dirtyRects[i] };

    // Keep merging until no more overlaps
    let didMerge = true;
    while (didMerge) {
      didMerge = false;
      for (let j = i + 1; j < this.dirtyRects.length; j++) {
        if (processed.has(j)) continue;

        if (RectUtils.intersects(currentRect, this.dirtyRects[j])) {
          currentRect = RectUtils.union(currentRect, this.dirtyRects[j]);
          processed.add(j);
          didMerge = true;
        }
      }
    }

    merged.push(currentRect);
    processed.add(i);
  }

  return merged;
}
```

### When to Use

**Use dirty rectangles when:**
- Large number of actors (> 50)
- Most actors are static
- Small number of updates per frame (< 10% of actors)
- Simple shapes (rectangles, circles)

**Don't use when:**
- Most actors are moving
- Complex visual effects (shadows, gradients on all actors)
- Small canvas (< 500x500)
- Very few actors (< 20)

---

## When to Use What

### Canvas vs SVG vs DOM

| Feature | Canvas | SVG | DOM |
|---------|--------|-----|-----|
| Performance (many objects) | ✓ | ✗ | ✗ |
| Scalability | ✗ | ✓ | ✗ |
| Event handling | Manual | Automatic | Automatic |
| Text rendering | Good | Excellent | Excellent |
| Animation | Excellent | Good | Good |
| Memory usage | Low | High | Medium |
| Use case | SK8 rendering | Icons, logos | UI controls |

**SK8 uses Canvas because:**
- Excellent performance for animations
- Direct pixel manipulation
- Consistent with original QuickDraw
- Lower memory footprint

### Animation vs CSS Transitions

| Feature | JS Animation | CSS Transition |
|---------|--------------|----------------|
| Performance | Good | Better (GPU) |
| Control | Full | Limited |
| Easing functions | Custom | Limited |
| Integration | Native | Requires CSS |
| Use case | SK8 actors | DOM elements |

**SK8 uses JS animations because:**
- Full control over timing
- Works with Canvas
- Custom easing functions
- Integration with object system

### IndexedDB vs LocalStorage

| Feature | IndexedDB | LocalStorage |
|---------|-----------|--------------|
| Size limit | ~50-100 MB+ | ~5-10 MB |
| Performance | Async, fast | Sync, slower |
| Data types | Any | Strings only |
| Complexity | Higher | Lower |
| Use case | Large projects | Settings, small data |

**SK8 uses both:**
- IndexedDB for project files and assets
- LocalStorage for auto-save and preferences

---

## Performance Checklist

### Before Release

- [ ] Profile with Chrome DevTools
- [ ] Check FPS stays > 50 in typical use
- [ ] Memory usage doesn't grow over time
- [ ] No memory leaks (event listeners cleaned up)
- [ ] Asset cache properly evicts old items
- [ ] Animations don't drop frames
- [ ] Dirty rectangle optimization enabled for large scenes
- [ ] No long tasks (> 50ms) in main thread

### Monitoring

```typescript
// Add performance monitoring
class PerformanceMonitor {
  private frames: number[] = [];

  recordFrame(fps: number): void {
    this.frames.push(fps);
    if (this.frames.length > 60) {
      this.frames.shift();
    }
  }

  getAverageFPS(): number {
    return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
  }

  getMinFPS(): number {
    return Math.min(...this.frames);
  }

  report(): void {
    console.log(`Avg FPS: ${this.getAverageFPS().toFixed(1)}`);
    console.log(`Min FPS: ${this.getMinFPS()}`);
  }
}
```

---

## Conclusion

Performance optimization is an ongoing process. Profile first, optimize second. The techniques in this guide should help you achieve 60 FPS in most scenarios.

For architecture details, see `ARCHITECTURE.md`.
For API reference, see `API.md`.
