# SK8 TypeScript Port

A modern reimplementation of Apple's SK8 multimedia authoring environment in TypeScript for the web.

## What is This?

This is a **proof-of-concept TypeScript port** of SK8, Apple's innovative multimedia authoring environment from the 1990s. Rather than directly porting the original Macintosh Common Lisp code, this is a **conceptual reimplementation** that preserves SK8's architecture while leveraging modern web technologies.

## Status: Proof of Concept

This is an early-stage implementation demonstrating core concepts:

✅ **Implemented:**
- SK8Object system (prototype-based inheritance)
- Property system with getters/setters
- Handler (method) system
- SK8Actor base class for visual objects
- Concrete shapes (Rectangle, Circle, RoundRect, Text, Line)
- SK8Stage (canvas manager)
- Basic event handling (click, mouse events)
- Animation support
- HTML5 Canvas rendering

❌ **Not Yet Implemented:**
- SK8Script language interpreter
- Media support (video, audio)
- Visual development environment
- Project save/load system
- Complete actor library
- Timeline/animation system
- And much more from the original...

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- A modern web browser

### Installation

```bash
cd typescript
npm install
```

### Build

```bash
npm run build
```

### Run Demo

```bash
npm run dev
```

Then open http://localhost:8080 in your browser.

Or simply open `demo/index.html` in a browser after building.

## Usage Example

```typescript
import { SK8Stage, SK8Rectangle, SK8Circle, ColorUtils } from 'sk8-ts';

// Create a stage (canvas container)
const stage = new SK8Stage('my-canvas');

// Create a rectangle
const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 50, top: 50, right: 200, bottom: 150 });
rect.set('fillColor', 'red');
rect.set('frameColor', 'black');

// Add event handler
rect.addHandler('click', function() {
  this.set('fillColor', 'blue');
  stage.render();
});

// Add to stage
stage.addActor(rect);

// Start rendering
stage.startRendering();
```

## Architecture

### SK8Object

The foundation of SK8's object system:

```typescript
class SK8Object {
  // Prototype-based inheritance
  getParent(): SK8Object | null
  setParent(parent: SK8Object | null): void

  // Property system
  get(name: string): any
  set(name: string, value: any, propagate?: boolean): void

  // Handler system
  addHandler(name: string, handler: Function): void
  callHandler(name: string, ...args: any[]): any

  // Cloning
  clone(name?: string): SK8Object
}
```

### SK8Actor

Base class for visual objects:

```typescript
abstract class SK8Actor extends SK8Object {
  // Bounds and position
  getBoundsRect(): Rect
  setBoundsRect(rect: Rect): void
  moveTo(x: number, y: number): void
  moveBy(dx: number, dy: number): void

  // Visual properties
  getFillColor(): Color | null
  setFillColor(color: Color | null): void
  getFrameColor(): Color | null
  setFrameColor(color: Color | null): void

  // Rendering (must implement)
  abstract render(ctx: CanvasRenderingContext2D): void

  // Event handling
  onClick(x: number, y: number): void
  onMouseDown(x: number, y: number): void
  // etc.
}
```

### SK8Stage

Canvas manager and container:

```typescript
class SK8Stage extends SK8Object {
  // Actor management
  addActor(actor: SK8Actor): void
  removeActor(actor: SK8Actor): void
  clearActors(): void

  // Z-order
  bringToFront(actor: SK8Actor): void
  sendToBack(actor: SK8Actor): void

  // Hit testing
  actorAtPoint(x: number, y: number): SK8Actor | null

  // Rendering
  render(): void
  startRendering(): void  // Begin animation loop
  stopRendering(): void
}
```

## Concrete Shapes

- **SK8Rectangle** - Rectangular shapes
- **SK8RoundRect** - Rounded rectangles
- **SK8Circle** - Circles and ovals
- **SK8Text** - Text rendering
- **SK8Line** - Lines

All shapes inherit from SK8Actor and support:
- Position and bounds
- Fill and frame colors
- Event handling
- Property system

## Comparison to Original SK8

### What's the Same

✅ **Prototype-based object system** - Preserved from original Macframes II
✅ **Actor/Stage architecture** - Same conceptual model
✅ **Property system** - Getter/setter with inheritance
✅ **Handler system** - Method dispatch with prototype chain
✅ **Visual objects** - Actors on stages

### What's Different

⚠️ **Canvas instead of QuickDraw** - HTML5 Canvas 2D API vs Mac Toolbox
⚠️ **JavaScript events** - Modern event model vs Mac OS Classic
⚠️ **No SK8Script yet** - Would need parser/interpreter
⚠️ **No resource forks** - JSON/IndexedDB for projects
⚠️ **HTML5 media** - `<video>`/`<audio>` vs QuickTime
⚠️ **TypeScript not Lisp** - Loses macros, gains types and ecosystem

## Development

### Project Structure

```
typescript/
├── src/
│   ├── core/
│   │   └── SK8Object.ts        # Core object system
│   ├── graphics/
│   │   ├── types.ts            # Rect, Color, etc.
│   │   ├── SK8Actor.ts         # Base visual class
│   │   ├── shapes.ts           # Concrete shapes
│   │   └── SK8Stage.ts         # Canvas manager
│   └── sk8.ts                  # Main exports
├── demo/
│   └── index.html              # Live demo
├── dist/                       # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Build Commands

```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode
npm run dev          # Dev server
npm run clean        # Clean dist/
```

### Extending

#### Create a Custom Actor

```typescript
import { SK8Actor } from 'sk8-ts';

class MyCustomActor extends SK8Actor {
  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();

    // Custom drawing code
    ctx.fillStyle = 'purple';
    ctx.fillRect(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    );
  }
}
```

#### Add Custom Properties

```typescript
class MyActor extends SK8Actor {
  private customValue = 42;

  constructor() {
    super();

    this.defineProperty('customValue', {
      getter: () => this.customValue,
      setter: (value) => {
        this.customValue = value;
        this.setNeedsRender();
      }
    });
  }
}
```

## Roadmap

Potential future enhancements:

- [ ] SK8Script parser and interpreter
- [ ] Visual development environment
- [ ] Project system (save/load with JSON)
- [ ] Media support (video, audio, images)
- [ ] Animation timeline
- [ ] More actors (buttons, sliders, etc.)
- [ ] Asset management
- [ ] Hot reload during development
- [ ] Export to standalone HTML
- [ ] React/Vue component wrappers

## Why TypeScript?

See `../TYPESCRIPT_PORT.md` for detailed analysis, but briefly:

**Advantages:**
- HTML5 multimedia easier than emulating Mac Toolbox
- Canvas 2D similar to QuickDraw concepts
- Cross-platform automatically (web, Electron, mobile)
- Huge developer community
- Modern tooling and ecosystem
- No Mac OS Classic dependencies

**Trade-offs:**
- Lose Lisp's macro system
- Complete rewrite vs. port
- Different paradigm (objects vs. prototypes + functions)

## License

This TypeScript port is an educational reimplementation. The original SK8 was:

```
SK8 © 1997 by Apple Computer, Inc.
```

See `../sk8_license.pdf` for the original SK8 license.

This TypeScript implementation is provided as-is for educational and historical preservation purposes.

## Acknowledgments

- Original SK8 team at Apple Computer, Inc.
- Apple Research Laboratories
- The Common Lisp and TypeScript communities

## Related Files

- `../TYPESCRIPT_PORT.md` - Detailed porting analysis
- `../SK8_DEEP_DIVE.md` - Technical deep dive on original SK8
- `../PORTING_ANALYSIS.md` - Common Lisp port analysis
- `../README.md` - Main repository README

## Contributing

This is a proof-of-concept. Contributions welcome! Areas of interest:

- SK8Script interpreter implementation
- Additional actor types
- Media integration
- Visual editor
- Documentation and examples
- Performance optimization

## Contact

For questions about this TypeScript port, see the main repository.
