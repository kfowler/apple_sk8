# Phase 1.2 Quick Reference Guide

## Gradients

### Linear Gradient
```typescript
import { LinearGradient } from './graphics/gradients.js';

// Horizontal gradient
const grad = LinearGradient.horizontal()
  .addColorStop(0, 'red')
  .addColorStop(1, 'blue');

// Vertical gradient
const grad2 = LinearGradient.vertical()
  .addColorStop(0, 'white')
  .addColorStop(1, 'black');

// Custom direction
const grad3 = new LinearGradient(0, 0, 1, 1)  // diagonal
  .addColorStop(0, '#FF6B6B')
  .addColorStop(0.5, '#FFD93D')
  .addColorStop(1, '#6BCF7F');

// Apply to actor
actor.setFillColor(grad);
```

### Radial Gradient
```typescript
import { RadialGradient } from './graphics/gradients.js';

// Centered gradient
const grad = RadialGradient.centered()
  .addColorStop(0, 'white')
  .addColorStop(1, 'blue');

// Spotlight effect
const spot = RadialGradient.spotlight(0.3, 0.3)
  .addColorStop(0, 'yellow')
  .addColorStop(1, 'orange');

// Custom parameters
const custom = new RadialGradient(
  0.5, 0.5, 0,    // inner circle: center x, y, radius
  0.5, 0.5, 0.5   // outer circle: center x, y, radius
);
```

## Transforms

### Rotation
```typescript
// Rotate 45 degrees
actor.rotate(45);

// Get current rotation
const angle = actor.getRotation();

// Animate rotation
setInterval(() => {
  actor.rotate(actor.getRotation() + 1);
  stage.setNeedsRender();
}, 16);
```

### Scaling
```typescript
// Uniform scale
actor.scale(2);  // 2x in both directions

// Non-uniform scale
actor.scale(1.5, 2);  // 1.5x horizontal, 2x vertical

// Get scale
const { x, y } = actor.getScale();
```

### Skewing
```typescript
// Skew transformation
actor.skew(15, 10);  // 15 degrees X, 10 degrees Y

// Get skew
const { x, y } = actor.getSkew();
```

### Combined Transforms
```typescript
// Apply multiple transforms
actor.rotate(45);
actor.scale(1.5);
actor.skew(10, 5);

// Reset all transforms
actor.resetTransform();

// Get transform matrix
const matrix = actor.getTransformMatrix();
```

## Text Styling

### Basic Text Style
```typescript
import { TextStyle } from './graphics/text-style.js';

const style = new TextStyle();
style.setFontSize(24)
     .setFontWeight('bold')
     .setFontFamily('Arial, sans-serif')
     .setTextAlign('center');

text.setTextStyle(style);
```

### Text Decorations
```typescript
style.setTextDecoration('underline');  // underline
style.setTextDecoration('overline');   // overline
style.setTextDecoration('line-through'); // strikethrough
style.setTextDecoration('none');       // no decoration
```

### Multi-line Text
```typescript
// Enable word wrapping
style.setWordWrap(true)
     .setMaxWidth(300)
     .setLineHeight(1.5);

// Newlines also supported
text.setText('Line 1\nLine 2\nLine 3');
```

### Text Layout
```typescript
// Alignment
style.setTextAlign('left');    // left, center, right, start, end

// Baseline
style.setTextBaseline('top');  // top, middle, bottom, alphabetic

// Spacing
style.setLineHeight(1.5);      // line height multiplier
style.setLetterSpacing(2);     // pixels between letters
```

### Style Variants
```typescript
// Create variants
const bold = style.bold();
const italic = style.italic();
const larger = style.larger(1.5);  // 1.5x current size
const smaller = style.smaller(0.8); // 0.8x current size

// Clone style
const copy = style.clone();
```

### SK8Text Integration
```typescript
import { SK8Text } from './graphics/shapes.js';

const text = new SK8Text();
text.setText('Hello, World!');
text.setFillColor('blue');

// Access and modify style
const style = text.getTextStyle();
style.setFontSize(20).setFontWeight('bold');

// Or replace style
const newStyle = new TextStyle().setFontSize(24);
text.setTextStyle(newStyle);

// Legacy API still works
text.setFontSize(18);  // updates style internally
text.setFontFamily('Helvetica');
```

## Performance Optimization

### Enable Optimization
```typescript
const stage = new SK8Stage(canvas);

// Enable dirty rectangle optimization
stage.setUseDirtyRectOptimization(true);

// Start rendering
stage.startRendering();
```

### Monitor Performance
```typescript
// Get current FPS
const fps = stage.getFPS();

// Log FPS periodically
setInterval(() => {
  console.log(`FPS: ${stage.getFPS()}`);
}, 1000);
```

### Manual Dirty Marking
```typescript
// Usually automatic, but can be manual
actor.moveTo(100, 100);
stage.markActorDirty(actor);
stage.setNeedsRender();
```

### Best Practices
```typescript
// DO: Batch updates
actors.forEach(actor => {
  actor.moveTo(x, y);
  actor.rotate(angle);
});
stage.setNeedsRender();  // Single render

// DON'T: Render after each change
actors.forEach(actor => {
  actor.moveTo(x, y);
  stage.setNeedsRender();  // Multiple renders
});
```

## Complete Example

```typescript
import { SK8Stage } from './graphics/SK8Stage.js';
import { SK8Rectangle, SK8Text } from './graphics/shapes.js';
import { LinearGradient } from './graphics/gradients.js';
import { TextStyle } from './graphics/text-style.js';

// Create stage
const stage = new SK8Stage('myCanvas');
stage.setUseDirtyRectOptimization(true);

// Create gradient
const gradient = LinearGradient.horizontal()
  .addColorStop(0, '#FF6B6B')
  .addColorStop(1, '#4ECDC4');

// Create rectangle with gradient
const rect = new SK8Rectangle();
rect.setBoundsRect({ left: 100, top: 100, right: 300, bottom: 200 });
rect.setFillColor(gradient);
rect.setFrameColor('white');
rect.rotate(15);
rect.scale(1.2);

stage.addActor(rect);

// Create styled text
const text = new SK8Text();
text.setBoundsRect({ left: 100, top: 250, right: 400, bottom: 300 });
text.setText('Hello, SK8!');
text.setFillColor('white');

const style = text.getTextStyle();
style.setFontSize(32)
     .setFontWeight('bold')
     .setTextAlign('center');

stage.addActor(text);

// Start rendering
stage.startRendering();

// Animate
let angle = 0;
setInterval(() => {
  angle += 1;
  rect.rotate(angle);
  stage.setNeedsRender();

  // Log FPS
  if (angle % 60 === 0) {
    console.log(`FPS: ${stage.getFPS()}`);
  }
}, 16);
```

## API Reference

### Gradient Classes

#### LinearGradient
- `constructor(x0, y0, x1, y1)` - Create gradient with direction
- `static horizontal()` - Create horizontal gradient
- `static vertical()` - Create vertical gradient
- `static diagonal()` - Create diagonal gradient
- `addColorStop(offset, color)` - Add color stop (0-1)
- `clearColorStops()` - Remove all stops
- `getColorStops()` - Get all stops

#### RadialGradient
- `constructor(x0, y0, r0, x1, y1, r1)` - Create gradient
- `static centered()` - Create centered gradient
- `static spotlight(x, y)` - Create spotlight effect
- `addColorStop(offset, color)` - Add color stop (0-1)

### Transform Methods (SK8Actor)
- `rotate(angle)` - Rotate in degrees
- `getRotation()` - Get rotation
- `scale(sx, sy?)` - Scale uniformly or non-uniformly
- `getScale()` - Get scale factors {x, y}
- `skew(ax, ay)` - Skew in degrees
- `getSkew()` - Get skew angles {x, y}
- `resetTransform()` - Clear all transforms
- `getTransformMatrix()` - Get DOMMatrix

### TextStyle Class
- Font: `setFontFamily()`, `setFontSize()`, `setFontWeight()`, `setFontStyle()`
- Layout: `setTextAlign()`, `setTextBaseline()`, `setLineHeight()`, `setLetterSpacing()`
- Decoration: `setTextDecoration()`
- Wrapping: `setWordWrap()`, `setMaxWidth()`
- Variants: `bold()`, `italic()`, `larger()`, `smaller()`, `clone()`
- Measurement: `measureText()`, `getLineHeightPixels()`

### TextMeasure Utility
- `static measureWidth(ctx, text, style)` - Get text width
- `static measureHeight(style)` - Get line height
- `static wrapText(ctx, text, maxWidth, style)` - Break into lines
- `static measureMultilineText(ctx, text, style, maxWidth?)` - Get bounds

### Performance Methods (SK8Stage)
- `setUseDirtyRectOptimization(enabled)` - Enable/disable optimization
- `markActorDirty(actor)` - Mark actor needing redraw
- `getFPS()` - Get current frame rate

## Tips and Tricks

### Gradient Tips
- Keep color stops to 5-10 for best performance
- Use ratios (0-1) for positions, not pixel values
- Gradients automatically scale to actor bounds

### Transform Tips
- Transforms are applied around actor center
- Combine transforms for complex effects
- Use `resetTransform()` before setting new transforms
- Hit testing works correctly with transforms

### Text Tips
- Use TextStyle objects for consistent formatting
- Enable word wrap for long text
- Set maxWidth slightly less than bounds width
- Use line height 1.2-1.6 for readability

### Performance Tips
- Enable optimization for scenes with 50+ actors
- Only animate actors that need to change
- Batch actor updates before calling setNeedsRender()
- Monitor FPS to detect performance issues
- Consider disabling optimization for fully animated scenes

## Common Patterns

### Animated Gradient
```typescript
const gradient = LinearGradient.horizontal();
let hue = 0;

setInterval(() => {
  hue = (hue + 1) % 360;
  gradient.clearColorStops()
          .addColorStop(0, `hsl(${hue}, 100%, 50%)`)
          .addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, 50%)`);
  stage.setNeedsRender();
}, 16);
```

### Rotating Text
```typescript
const text = new SK8Text();
text.setText('Rotating');
text.setFillColor('blue');

let angle = 0;
setInterval(() => {
  angle = (angle + 1) % 360;
  text.rotate(angle);
  stage.setNeedsRender();
}, 16);
```

### Dynamic Text Styling
```typescript
const text = new SK8Text();
const style = text.getTextStyle();

let size = 16;
let growing = true;

setInterval(() => {
  size += growing ? 1 : -1;
  if (size >= 32) growing = false;
  if (size <= 16) growing = true;

  style.setFontSize(size);
  stage.setNeedsRender();
}, 50);
```

### Performance Monitoring
```typescript
const fpsDisplay = new SK8Text();
fpsDisplay.setBoundsRect({ left: 10, top: 10, right: 100, bottom: 30 });
fpsDisplay.setFillColor('white');

setInterval(() => {
  fpsDisplay.setText(`FPS: ${stage.getFPS()}`);
  stage.setNeedsRender();
}, 100);

stage.addActor(fpsDisplay);
```

---

For more details, see:
- `/home/user/apple_sk8/typescript/PHASE_1.2_SUMMARY.md` - Complete implementation summary
- `/home/user/apple_sk8/typescript/demos/phase1.2-demo.html` - Interactive demo
- `/home/user/apple_sk8/typescript/examples/phase1.2-example.ts` - Code examples
- `/home/user/apple_sk8/typescript/tests/graphics.test.ts` - Test suite
