# SK8 TypeScript Design Decisions

Rationale for key architectural and implementation choices in SK8 TypeScript.

## Table of Contents

1. [TypeScript vs Common Lisp](#typescript-vs-common-lisp)
2. [Canvas 2D vs WebGL](#canvas-2d-vs-webgl)
3. [Prototype Inheritance vs Classes](#prototype-inheritance-vs-classes)
4. [Serialization Format](#serialization-format)
5. [Bundle Strategy](#bundle-strategy)
6. [Testing Framework](#testing-framework)
7. [Module System](#module-system)
8. [Event System Design](#event-system-design)

---

## TypeScript vs Common Lisp

### Decision: Use TypeScript

**Original SK8:** Common Lisp with custom MCL extensions

**SK8-TS:** TypeScript targeting modern browsers

### Rationale

**Pros:**
- **Web platform native:** Runs in all modern browsers without plugins
- **Ecosystem:** npm, bundlers, modern tooling
- **Type safety:** Catch errors at compile time
- **Developer pool:** Larger community than Common Lisp
- **Multimedia APIs:** Native HTML5 Canvas, Video, Audio
- **No emulation:** Direct access to platform features

**Cons:**
- **Lost Lisp features:** Macros, REPL, S-expressions
- **Complete rewrite:** Cannot port existing SK8 code directly
- **Different paradigm:** Prototype-based vs Lisp's flexibility
- **Less powerful:** TypeScript more limited than Lisp metaprogramming

### Trade-offs Accepted

1. **Macro system lost:** SK8's powerful macro system for DSLs cannot be replicated. We compensate with code generation tools and TypeScript generics.

2. **REPL interactivity:** No live image modification. Compromise: hot module replacement during development.

3. **Dynamic typing:** TypeScript is stricter. Benefit: catch more errors early.

### Why Not...

**Common Lisp to JavaScript transpilers (e.g., Parenscript):**
- Adds complexity
- Loses type checking
- Poor integration with JS ecosystem
- Limited adoption/support

**ClojureScript:**
- Different Lisp dialect than SK8's MCL
- Still a complete rewrite
- TypeScript has larger community

**WebAssembly + Lisp:**
- Canvas API access awkward from WASM
- DOM manipulation overhead
- Not ready for multimedia authoring

---

## Canvas 2D vs WebGL

### Decision: Canvas 2D API

**Alternative:** WebGL for rendering

### Rationale

**Pros:**
- **Simpler API:** Immediate mode, familiar to QuickDraw programmers
- **Better text:** Native text rendering with font support
- **Easier debugging:** Visual output directly in DevTools
- **QuickDraw parallels:** Original SK8 used QuickDraw, Canvas 2D is similar
- **Good enough:** 60fps achievable for typical SK8 use cases

**Cons:**
- **Performance ceiling:** Cannot match WebGL for large scenes
- **No GPU compositing:** Everything in main thread
- **Limited effects:** No shaders for advanced effects

### Performance Comparison

| Metric | Canvas 2D | WebGL |
|--------|-----------|-------|
| Simple scene (50 actors) | 200 fps | 1000+ fps |
| Complex scene (500 actors) | 20 fps | 200 fps |
| Text rendering | Excellent | Poor (requires texture atlas) |
| Setup complexity | Low | High |
| Learning curve | Gentle | Steep |

### When WebGL Would Win

- 1000+ actors on screen
- Particle systems
- 3D transformations
- Complex shader effects
- Real-time video processing

### SK8's Use Cases Don't Need WebGL

SK8 targets:
- Educational multimedia
- Interactive presentations
- Simple animations
- UI prototyping

These rarely exceed Canvas 2D's performance envelope.

### Future: Pluggable Renderers

Architecture allows custom render backends:

```typescript
interface RenderBackend {
  initialize(canvas: HTMLCanvasElement): void;
  renderActor(actor: SK8Actor): void;
}
```

WebGL backend could be added later for advanced users.

---

## Prototype Inheritance vs Classes

### Decision: Explicit Prototype System

**Alternative:** ES6 classes with traditional inheritance

### Rationale

SK8's core feature is its prototype-based object system (from Macframes II). This is fundamental to SK8's identity.

**Original SK8:**
```lisp
(setf my-rect (clone rectangle))
(setf (fillColor of my-rect) red)
```

**SK8-TS:**
```typescript
const myRect = rectangle.clone();
myRect.set('fillColor', ColorUtils.Red);
```

### Why Not ES6 Classes?

```typescript
// ES6 classes:
class Rectangle extends Actor {
  fillColor: Color;
}

// Problems:
// 1. No runtime parent switching
// 2. No property inheritance (only method inheritance)
// 3. Cannot dynamically add properties that propagate
// 4. Doesn't match SK8's semantics
```

### SK8Object Implementation

```typescript
class SK8Object {
  private parent: SK8Object | null;  // Runtime parent
  private properties = new Map();     // Dynamic properties
  private handlers = new Map();       // Dynamic methods

  get(propertyName: string): any {
    // Walk up parent chain
  }
}
```

This matches SK8's original behavior while using modern JavaScript.

### Hybrid Approach

We use both:
- **Classes for structure:** `SK8Actor` is a class
- **Prototype chain for semantics:** Parent relationships at runtime

```typescript
class SK8Actor extends SK8Object {  // ← Class inheritance
  constructor(parent?: SK8Actor) {   // ← Prototype parent
    super(parent);
  }
}
```

---

## Serialization Format

### Decision: JSON with .sk8json extension

**Alternative:** Binary format, XML, or custom text format

### Format

```json
{
  "formatVersion": "1.0.0",
  "metadata": { "name": "...", "..." },
  "stages": [...],
  "actors": [...],
  "assets": [...],
  "scripts": [...]
}
```

### Rationale

**Pros:**
- **Human readable:** Easy to debug and inspect
- **Standard format:** All languages can parse JSON
- **Text-based:** Git-friendly, diff-able
- **Browser native:** `JSON.parse()` is fast
- **Established:** No custom parser needed

**Cons:**
- **Size:** Larger than binary (mitigated by compression)
- **No streaming:** Must load entire file (could add NDJSON support)
- **No comments:** Cannot annotate (could use metadata fields)

### Why Not...

**Binary format:**
- Harder to debug
- Needs custom parser
- Not git-friendly
- Benefit (size) minimal with compression

**XML:**
- Verbose
- More complex to parse
- No advantages over JSON for SK8

**Custom format:**
- Reinventing wheel
- Parsing complexity
- No tooling support

### Versioning Strategy

```json
{
  "formatVersion": "1.2.0",  // Semantic versioning
  // ...
}
```

Migration system handles version upgrades:

```typescript
function migrateProject(data: any, fromVersion: string): any {
  // Apply migrations sequentially
}
```

---

## Bundle Strategy

### Decision: UMD + ESM

Build both Universal Module Definition and ES Modules.

### Build Targets

```
dist/
├── sk8.umd.js          # Universal (browser <script>)
├── sk8.umd.js.map
├── sk8.esm.js          # ES Modules (import)
├── sk8.esm.js.map
└── types/
    └── index.d.ts      # TypeScript definitions
```

### Rationale

**UMD:**
- Works in browser with `<script>` tag
- Works in Node.js
- Works with AMD loaders
- Maximum compatibility

**ESM:**
- Modern bundlers (Webpack, Rollup, Vite)
- Tree-shaking support
- Better for npm packages
- Future-proof

**Both:**
- Covers all use cases
- Small additional build overhead

### Why Not...

**ESM only:**
- Doesn't work with `<script>` in older browsers
- Some environments still need UMD

**UMD only:**
- No tree-shaking
- Larger bundle sizes for apps

**CommonJS:**
- Being phased out
- ESM is the future

### Package.json

```json
{
  "main": "./dist/sk8.umd.js",
  "module": "./dist/sk8.esm.js",
  "types": "./dist/types/index.d.ts"
}
```

Bundlers automatically choose the right format.

---

## Testing Framework

### Decision: Jest

**Alternative:** Mocha, Jasmine, Vitest

### Rationale

**Pros:**
- **Zero config:** Works out of the box
- **TypeScript support:** Native ts-jest integration
- **Fast:** Parallel test execution
- **Good ecosystem:** Many plugins
- **Snapshot testing:** Useful for serialization tests
- **Code coverage:** Built-in Istanbul integration

**Cons:**
- **Large install:** Many dependencies
- **Slower than Vitest:** But fast enough for SK8

### Test Structure

```
tests/
├── core/
│   └── SK8Object.test.ts
├── graphics/
│   └── SK8Actor.test.ts
├── sk8script/
│   ├── lexer.test.ts
│   ├── parser.test.ts
│   └── evaluator.test.ts
└── integration/
    └── rendering.test.ts
```

### Why Not...

**Vitest:**
- Newer, less mature
- Excellent performance but Jest "fast enough"
- Would require migration

**Mocha:**
- More configuration needed
- No snapshot testing
- Less integrated

**Jasmine:**
- Older, less active
- Less TypeScript support

---

## Module System

### Decision: ES Modules with .js Extensions

All imports use `.js` extension even for `.ts` files:

```typescript
import { SK8Object } from './core/SK8Object.js';  // ← .js not .ts
```

### Rationale

**Pros:**
- **Future-proof:** Matches final JavaScript output
- **Node.js ESM:** Required for Node ESM resolution
- **Explicit:** Shows intent to use compiled output
- **Standards compliant:** ES modules specification

**Cons:**
- **Confusing:** Import `.js` for `.ts` source
- **IDE warnings:** Some IDEs show false errors

### Why This Matters

TypeScript compiles `.ts` → `.js` but doesn't rewrite import paths:

```typescript
// Source: SK8Object.ts
import { Color } from './types.js';  // ← Must use .js

// Compiled: SK8Object.js
import { Color } from './types.js';  // ← Unchanged
```

If we used `.ts`:
```typescript
import { Color } from './types.ts';  // ❌
// Compiled JS still has .ts, breaks at runtime!
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

## Event System Design

### Decision: DOM-like Events with Actors

Custom event classes mimicking DOM events, but dispatched through actors not DOM.

### Design

```typescript
abstract class SK8Event {
  type: string;
  target: SK8Actor;
  preventDefault(): void;
  stopPropagation(): void;
}

class SK8MouseEvent extends SK8Event {
  x: number;
  y: number;
  button: MouseButton;
}
```

### Rationale

**DOM-like API:**
- Familiar to web developers
- Established patterns
- Well-understood semantics

**Why Not Native DOM Events:**
- Actors are not DOM elements
- Canvas is single DOM element
- Need custom hit testing
- Want SK8-specific event types

**Custom Events vs DOM Events:**

| Feature | Custom SK8Event | Native DOM Event |
|---------|----------------|------------------|
| Works with Canvas actors | ✓ | ✗ |
| Type safety | ✓ | Partial |
| Custom properties | ✓ | Via `detail` |
| Memory overhead | Low | Higher |
| Browser support | All | All |

### Event Flow

```
Browser DOM Event (canvas)
    ↓
SK8Stage handler
    ↓
Hit test → Find actor
    ↓
Create SK8Event
    ↓
Dispatch to actor
    ↓
Actor listeners
```

This decouples SK8 objects from DOM while maintaining familiar API.

---

## Summary

All design decisions prioritize:

1. **Fidelity to original SK8 concepts**
2. **Modern web platform best practices**
3. **Developer experience**
4. **Performance for typical use cases**
5. **Future extensibility**

Trade-offs are documented, alternatives considered, and rationale provided for transparency.

See `ARCHITECTURE.md` for implementation details.
See `ORIGINAL_VS_NEW.md` for comparison to original SK8.
