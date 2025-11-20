# SK8 TypeScript Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Object System](#core-object-system)
3. [Graphics System](#graphics-system)
4. [Event System](#event-system)
5. [SK8Script Language](#sk8script-language)
6. [Animation System](#animation-system)
7. [Project System](#project-system)
8. [Asset Management](#asset-management)
9. [Editor/IDE](#editoride)
10. [Data Flow](#data-flow)

---

## System Overview

SK8 TypeScript is a modern reimplementation of Apple's SK8 multimedia authoring environment, adapted for the web platform. The architecture preserves SK8's core design principles while leveraging modern web technologies.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SK8 Application Layer                    │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Editor   │  │ SK8Script  │  │  Project Manager     │  │
│  │    IDE     │  │ Interpreter│  │  (Save/Load)         │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      SK8 Runtime Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │  Graphics  │  │   Events   │  │     Animation        │  │
│  │   System   │  │   System   │  │      System          │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │    Media   │  │Collections │  │   Asset Manager      │  │
│  │   System   │  │   System   │  │                      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    SK8 Core Object System                    │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ SK8Object  │  │ SK8Actor   │  │     SK8Stage         │  │
│  │   (Base)   │  │  (Visual)  │  │   (Container)        │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Web Platform APIs                        │
│  Canvas 2D │ DOM Events │ File API │ IndexedDB │ Audio API │
└─────────────────────────────────────────────────────────────┘
```

### Core Subsystems

1. **Core Object System** - Prototype-based inheritance, property system, handlers
2. **Graphics System** - SK8Actor rendering pipeline, Canvas 2D integration
3. **Event System** - Event propagation, mouse/keyboard/touch handling
4. **SK8Script** - Custom scripting language (lexer, parser, evaluator)
5. **Animation System** - Tween interpolation, easing functions
6. **Project System** - Serialization, persistence, versioning
7. **Asset Management** - Media loading, caching, reference counting
8. **Editor/IDE** - Undo/redo, selection, property inspector

---

## Core Object System

The Core Object System implements SK8's prototype-based inheritance model, inspired by the original Macframes II object system.

### SK8Object Implementation

```typescript
class SK8Object {
  private parent: SK8Object | null = null;
  private properties = new Map<string, PropertyDescriptor>();
  private handlers = new Map<string, HandlerFunction>();
  private observers = new Map<string, Set<PropertyObserver>>();
  private computedCache = new Map<string, PropertyValue>();
}
```

#### Key Features

1. **Prototype Chain**
   - Each object has a `parent` reference
   - Property and method lookup walks up the chain
   - Allows inheritance without classes
   - Supports dynamic parent switching

2. **Property System**
   ```typescript
   interface PropertyDescriptor {
     value?: PropertyValue;
     getter?: () => PropertyValue;
     setter?: (value: PropertyValue) => void;
     propagate?: boolean;
     computed?: boolean;
     dependencies?: string[];
     validator?: PropertyValidator;
     metadata?: PropertyMetadata;
   }
   ```

   - **Simple Properties**: Direct value storage
   - **Computed Properties**: Calculated on-demand with caching
   - **Validated Properties**: Optional validation functions
   - **Observed Properties**: Change notification system
   - **Dependency Tracking**: Automatic invalidation of computed properties

3. **Handler System**
   - Methods stored in `handlers` map
   - Dispatch walks prototype chain
   - Supports dynamic method addition
   - Bound to object instance during call

4. **Memory Management**
   - WeakMap for object references where appropriate
   - Manual cleanup methods for circular references
   - Property cache invalidation
   - Observer cleanup on property removal

#### Property Resolution Algorithm

```
get(propertyName):
  1. Check local properties map
  2. If computed property:
     a. Check cache (if valid)
     b. Execute getter (mark as computing to detect cycles)
     c. Cache result
     d. Return value
  3. If has getter: Execute and return
  4. If has value: Return value
  5. If no property found: Walk up parent chain
  6. If still not found: Return undefined
```

#### Handler Dispatch Mechanism

```
callHandler(name, args):
  1. Look up handler in local handlers map
  2. If found: Apply with object as `this`
  3. If not found: Recursively check parent
  4. If no handler found: Throw error with stack trace
```

---

## Graphics System

The Graphics System manages visual rendering using HTML5 Canvas 2D API, adapted from SK8's original QuickDraw-based rendering.

### SK8Actor Rendering Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                    Rendering Pipeline                     │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Mark Dirty     │
                  │  (setNeedsDraw) │
                  └─────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │   Animation Loop (RAF)              │
         │   - Check needsRender flag          │
         │   - Decide: Full render vs Dirty    │
         └─────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
      ┌───────────────────┐  ┌───────────────────┐
      │   Full Render     │  │  Dirty Rect Render│
      │   - Clear canvas  │  │  - Merge rects    │
      │   - All actors    │  │  - Clip region    │
      └───────────────────┘  │  - Only affected  │
                             └───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Per-Actor:     │
                  │  1. Save ctx    │
                  │  2. Transform   │
                  │  3. Effects     │
                  │  4. render()    │
                  │  5. Restore ctx │
                  └─────────────────┘
```

### Canvas 2D Integration

**Actor Rendering Method:**

```typescript
abstract class SK8Actor {
  render(ctx: CanvasRenderingContext2D): void {
    // Implemented by subclasses
  }

  protected applyTransform(ctx: CanvasRenderingContext2D): void {
    if (hasTransform) {
      const m = this.transformMatrix;
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    }
  }

  protected applyVisualEffects(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.opacity;
    if (this.shadowColor) {
      ctx.shadowColor = ColorUtils.toCSS(this.shadowColor);
      ctx.shadowBlur = this.shadowBlur;
      ctx.shadowOffsetX = this.shadowOffsetX;
      ctx.shadowOffsetY = this.shadowOffsetY;
    }
  }
}
```

### Dirty Rectangle Optimization

To achieve 60fps rendering, SK8 implements dirty rectangle tracking:

1. **Marking Phase**
   - Actor changes call `markActorDirty(actor)`
   - Store actor's bounding rectangle
   - Set `needsRender = true`

2. **Merging Phase**
   - Combine overlapping dirty rectangles
   - Reduces number of regions to redraw
   - Algorithm: Iterative union of intersecting rects

3. **Rendering Phase**
   - For each merged dirty rect:
     - Set clip region
     - Clear region
     - Render intersecting actors only

**Performance Impact:**
- Full render: ~50-200 actors at 60fps
- Dirty rect: ~1000+ actors at 60fps (when few moving)

### Z-Order and Layering

Actors are stored in a simple array where index = z-order:

```typescript
private actors: SK8Actor[] = [];  // Index 0 = back, N = front

bringToFront(actor: SK8Actor): void {
  this.removeActor(actor);
  this.actors.push(actor);  // Add to end = front
}

sendToBack(actor: SK8Actor): void {
  this.removeActor(actor);
  this.actors.unshift(actor);  // Add to start = back
}
```

Rendering iterates forward (back to front):
```typescript
for (const actor of this.actors) {
  if (actor.getVisible()) {
    actor.render(ctx);
  }
}
```

Hit testing iterates backward (front to back):
```typescript
for (let i = this.actors.length - 1; i >= 0; i--) {
  const actor = this.actors[i];
  if (actor.containsPoint(x, y)) {
    return actor;
  }
}
```

### Coordinate Systems and Transforms

**Local Coordinates:**
- Each actor has `boundsRect` in stage coordinates
- Center of bounds used as transform origin

**Transform Matrix:**
```typescript
updateTransformMatrix(): void {
  this.transformMatrix = new DOMMatrix()
    .translate(centerX, centerY)
    .rotate(this.rotation)
    .scale(this.scaleX, this.scaleY)
    .skewX(this.skewX * Math.PI / 180)
    .skewY(this.skewY * Math.PI / 180)
    .translate(-centerX, -centerY);
}
```

**Inverse Transform for Hit Testing:**
```typescript
containsPoint(x: number, y: number): boolean {
  if (hasTransform) {
    const inverse = this.transformMatrix.inverse();
    const point = new DOMPoint(x, y);
    const transformed = point.matrixTransform(inverse);
    return RectUtils.contains(this.bounds, transformed.x, transformed.y);
  }
  return RectUtils.contains(this.bounds, x, y);
}
```

### Text Rendering with TextStyle

Text rendering uses `TextStyle` for typography:

```typescript
class TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  textBaseline: string;
  color: Color;
  lineHeight: number;
}

// Usage in SK8Text:
render(ctx: CanvasRenderingContext2D): void {
  this.textStyle.applyToContext(ctx);
  ctx.fillText(this.text, x, y);
}
```

---

## Event System

The Event System implements DOM-like event propagation with support for mouse, keyboard, touch, and custom events.

### Event Types and Hierarchy

```
SK8Event (abstract)
├── SK8MouseEvent (click, mousedown, mouseup, mousemove, etc.)
├── SK8KeyboardEvent (keydown, keyup, keypress)
├── SK8TouchEvent (touchstart, touchmove, touchend)
├── SK8DragEvent (dragstart, drag, dragend, drop)
└── SK8CustomEvent<T> (custom user events)
```

### Event Bubbling and Capturing

**Event Phases:**

```typescript
enum EventPhase {
  NONE = 0,        // Not in propagation
  CAPTURING = 1,   // Going down from root to target
  AT_TARGET = 2,   // At the target actor
  BUBBLING = 3,    // Going up from target to root
}
```

**Propagation Algorithm:**

1. **Capturing Phase** (not yet implemented in actors)
   - Would traverse from stage to target
   - Call capture listeners

2. **At Target Phase**
   - Dispatch to target actor's listeners
   - Check `stopImmediatePropagation()`

3. **Bubbling Phase**
   - Walk up parent chain (if implemented)
   - Dispatch to each ancestor
   - Stop if `stopPropagation()` called

**Current Implementation:**
SK8 currently implements direct dispatch without full bubbling:

```typescript
dispatchEvent(event: SK8Event): boolean {
  event.target = this;
  event.currentTarget = this;

  const listeners = this.eventListeners.get(event.type);
  if (listeners) {
    for (const entry of [...listeners]) {
      if (event.immediatePropagationStopped) break;
      entry.listener.call(this, event);
      if (entry.options.once) {
        this.removeEventListener(event.type, entry.listener);
      }
    }
  }

  return !event.defaultPrevented;
}
```

### Mouse/Keyboard/Touch Handling

**Mouse Event Flow:**

```
Browser MouseEvent
       ↓
SK8Stage.handleMouseDown(e)
       ↓
getMousePos(e) → canvas-relative coords
       ↓
actorAtPoint(x, y) → hit test
       ↓
Create SK8MouseEvent
       ↓
actor.dispatchEvent(event)
       ↓
Call registered listeners
```

**Touch Event Flow:**

```
Browser TouchEvent
       ↓
SK8Stage.handleTouchStart(e)
       ↓
getTouchPoints(e.touches) → array of TouchPoint
       ↓
gestureRecognizer.touchStart(points) → detect gestures
       ↓
actorAtPoint(touch.x, touch.y)
       ↓
Create SK8TouchEvent
       ↓
actor.dispatchEvent(event)
```

### Drag-Drop Implementation

The `DragDropManager` handles drag operations:

```typescript
class DragDropManager {
  private currentDrag: DragState | null = null;
  private dropTargets: Set<SK8Actor> = new Set();

  startDrag(actor: SK8Actor, x: number, y: number): void {
    this.currentDrag = {
      actor,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      constraints: undefined
    };
  }

  updateDrag(x: number, y: number): void {
    if (!this.currentDrag) return;

    const dx = x - this.currentDrag.currentX;
    const dy = y - this.currentDrag.currentY;

    // Apply constraints if set
    if (this.currentDrag.constraints) {
      // Constrain to bounds or axis
    }

    this.currentDrag.actor.moveBy(dx, dy);
    this.currentDrag.currentX = x;
    this.currentDrag.currentY = y;
  }

  endDrag(x: number, y: number): void {
    if (!this.currentDrag) return;

    // Check for drop targets
    for (const target of this.dropTargets) {
      if (target.containsPoint(x, y)) {
        const event = new SK8DragEvent('drop', x, y, ...);
        target.dispatchEvent(event);
      }
    }

    this.currentDrag = null;
  }
}
```

### Gesture Recognition

The `GestureRecognizer` detects multi-touch gestures:

**Supported Gestures:**
- Tap
- Double Tap
- Long Press
- Swipe (4 directions)
- Pinch (zoom)
- Rotate

**Detection Algorithm:**

```typescript
class GestureRecognizer {
  touchStart(points: TouchPoint[]): void {
    this.touches = points;
    this.startTime = Date.now();

    if (points.length === 1) {
      this.startTapTimer();  // For long press detection
    } else if (points.length === 2) {
      this.initialDistance = distance(points[0], points[1]);
      this.initialAngle = angle(points[0], points[1]);
    }
  }

  touchMove(points: TouchPoint[]): void {
    if (points.length === 2) {
      const currentDistance = distance(points[0], points[1]);
      const currentAngle = angle(points[0], points[1]);

      // Detect pinch
      const scale = currentDistance / this.initialDistance;
      if (Math.abs(scale - 1) > 0.1) {
        this.emit('pinch', { scale });
      }

      // Detect rotate
      const rotation = currentAngle - this.initialAngle;
      if (Math.abs(rotation) > 10) {
        this.emit('rotate', { rotation });
      }
    }
  }
}
```

### Event Queue and Processing

Events are processed synchronously in the current implementation:

```
User Input → Browser Event → SK8Stage Handler → Actor Dispatch → Listeners
```

For future async processing, events could be queued:

```typescript
class EventQueue {
  private queue: SK8Event[] = [];

  enqueue(event: SK8Event): void {
    this.queue.push(event);
  }

  processEvents(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      this.dispatchEvent(event);
    }
  }
}
```

---

## SK8Script Language

SK8Script is a custom scripting language inspired by AppleScript and the original SK8 language.

### Lexer: Tokenization Process

**Token Types:**

```typescript
enum TokenType {
  // Literals
  NUMBER, STRING, TRUE, FALSE, NULL,

  // Identifiers and Keywords
  IDENTIFIER, THE, OF, SET, TO,

  // Operators
  PLUS, MINUS, STAR, SLASH, PERCENT, CARET,
  EQUALS, NOT_EQUALS, LESS_THAN, GREATER_THAN,

  // Control Flow
  IF, THEN, ELSE, END, WHILE, REPEAT,

  // Delimiters
  LPAREN, RPAREN, LBRACKET, RBRACKET, LBRACE, RBRACE,
  COMMA, DOT, COLON, SEMICOLON,

  // Special
  NEWLINE, COMMENT, EOF
}
```

**Tokenization Algorithm:**

```
tokenize(source):
  position = 0
  while not at end:
    skip whitespace

    if digit:
      scan number (int, float, scientific)
    else if alpha:
      scan identifier or keyword
    else if quote:
      scan string with escape sequences
    else if '--':
      skip comment to end of line
    else:
      scan operator or punctuation

    add token to list

  add EOF token
  return tokens
```

**Number Scanning:**
```typescript
scanNumber():
  consume digits

  if '.' and digit ahead:
    consume '.'
    consume digits  // Decimal part

  if 'e' or 'E':
    consume 'e'/'E'
    if '+' or '-':
      consume sign
    consume digits  // Exponent

  return NUMBER token with parseFloat(value)
```

### Parser: AST Construction

**Abstract Syntax Tree Nodes:**

```typescript
type ASTNode =
  | LiteralNode        // 42, "hello", true
  | IdentifierNode     // myVariable
  | BinaryOpNode       // x + y
  | UnaryOpNode        // -x, not x
  | PropertyAccessNode // the width of myRect
  | IndexAccessNode    // item 5 of myList
  | FunctionCallNode   // add(x, y)
  | AssignmentNode     // set x to 10
  | IfStatementNode    // if...then...else
  | WhileStatementNode // while...end
  | RepeatNode         // repeat...times/with/forever
  | FunctionDeclNode   // on myHandler / to myFunction
  | BlockNode          // { stmt1; stmt2; }
  | ...
```

**Parsing Strategy: Recursive Descent**

```
Expression Grammar:
  expression     → assignment | binary_expr
  assignment     → "set" primary "to" expression
  binary_expr    → unary ( operator unary )*
  unary          → ( "-" | "not" ) unary | postfix
  postfix        → primary ( "(" args ")" | "[" expr "]" | "." IDENT )*
  primary        → NUMBER | STRING | IDENT | "(" expr ")"
                 | "the" IDENT "of" primary
                 | "[" list "]"
                 | "{" table "}"
```

**Precedence Climbing for Binary Operators:**

```typescript
parseBinaryExpression(minPrecedence: number): ASTNode {
  let left = parseUnaryExpression();

  while (!isAtEnd()) {
    const precedence = getOperatorPrecedence(current());
    if (precedence < minPrecedence) break;

    const operator = advance();
    const right = parseBinaryExpression(precedence + 1);
    left = createBinaryOp(operator, left, right);
  }

  return left;
}
```

**Operator Precedence Table:**

| Precedence | Operators | Associativity |
|------------|-----------|---------------|
| 1 | or | Left |
| 2 | and | Left |
| 3 | =, ≠, <, >, ≤, ≥ | Left |
| 4 | & (concat) | Left |
| 5 | +, - | Left |
| 6 | *, /, % | Left |
| 7 | ^ (power) | Right |
| 8 | unary -, not | Right |

### Evaluator: Execution Model

**Evaluation Context:**

```typescript
interface EvaluationContext {
  variables: Map<string, any>;
  functions: Map<string, BuiltInFunction | UserDefinedFunction>;
  parent?: EvaluationContext;  // For closures
}
```

**Evaluation Dispatch:**

```typescript
evaluate(node: ASTNode): any {
  switch (node.kind) {
    case 'Literal':
      return node.value;

    case 'Identifier':
      return lookupVariable(node.name);  // Walk context chain

    case 'BinaryOp':
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      return applyOperator(node.operator, left, right);

    case 'FunctionCall':
      const func = lookupFunction(node.name);
      const args = node.args.map(arg => evaluate(arg));
      return callFunction(func, args);

    // ... more cases
  }
}
```

**Variable Lookup (Closure Chain):**

```typescript
lookupVariable(name: string): any {
  let context = this.context;

  while (context) {
    if (context.variables.has(name)) {
      return context.variables.get(name);
    }
    context = context.parent;  // Walk up closure chain
  }

  throw new EvaluatorError(`Undefined variable: ${name}`);
}
```

### Closure Implementation

**User-Defined Functions as Closures:**

```typescript
class UserDefinedFunction {
  constructor(
    public name: string,
    public parameters: FunctionParameter[],
    public body: ASTNode[],
    public closure: EvaluationContext,  // Captured context
    public returnsValue: boolean
  ) {}
}

evaluateFunctionDeclaration(node): void {
  const func = new UserDefinedFunction(
    node.name,
    node.parameters,
    node.body,
    this.context,  // ← Capture current context!
    node.returnsValue
  );

  this.context.functions.set(node.name, func);
}

callUserDefinedFunction(func, args): any {
  // Create new context with closure as parent
  const functionContext = {
    variables: new Map(),
    functions: func.closure.functions,
    parent: func.closure  // ← Link to closure!
  };

  // Bind parameters
  for (let i = 0; i < func.parameters.length; i++) {
    functionContext.variables.set(
      func.parameters[i].name,
      args[i]
    );
  }

  // Execute with function context
  const savedContext = this.context;
  this.context = functionContext;
  try {
    return executeBody(func.body);
  } finally {
    this.context = savedContext;
  }
}
```

### Standard Library Architecture

**Function Registration:**

```typescript
// stdlib/math.ts
export const mathFunctions: Record<string, BuiltInFunction> = {
  abs: (x: number) => Math.abs(x),
  sqrt: (x: number) => Math.sqrt(x),
  sin: (x: number) => Math.sin(x),
  // ... more functions
};

// stdlib/index.ts
export const stdlib = {
  ...mathFunctions,
  ...stringFunctions,
  ...collectionFunctions,
  ...typeFunctions,
  ...ioFunctions,
  ...objectFunctions,
};

// Register with evaluator
const evaluator = new Evaluator();
evaluator.registerFunctions(stdlib);
```

**Standard Library Categories:**

1. **Math**: abs, sqrt, sin, cos, tan, pow, log, random, round, floor, ceil
2. **String**: length, substring, uppercase, lowercase, concat, split, join
3. **Collection**: length, add, remove, map, filter, reduce, sort
4. **Type**: typeof, isNumber, isString, isList, isTable
5. **I/O**: print, alert, prompt (browser integration)
6. **Object**: getProperty, setProperty, hasProperty, keys, values

### Natural Language Syntax ("the X of Y")

**Property Access Translation:**

```
"the width of myRect"
    ↓
PropertyAccessNode {
  property: "width",
  object: IdentifierNode { name: "myRect" }
}
    ↓
Evaluates to: myRect.get("width")
```

**Index Access Translation:**

```
"item 5 of myList"
    ↓
IndexAccessNode {
  index: LiteralNode { value: 5 },
  object: IdentifierNode { name: "myList" }
}
    ↓
Evaluates to: myList[5 - 1]  // 1-based to 0-based
```

### Error Handling and Stack Traces

**Exception Types:**

```typescript
class LexerError extends Error {
  constructor(message: string, line: number, column: number) {
    super(`Lexer error at ${line}:${column}: ${message}`);
  }
}

class ParserError extends Error {
  constructor(message: string, token: Token) {
    super(`Parser error at ${token.line}:${token.column}: ${message}`);
  }
}

class EvaluatorError extends Error {
  constructor(message: string) {
    super(`Evaluation error: ${message}`);
  }
}
```

**Call Stack Tracking:**

```typescript
class Evaluator {
  private callStack: string[] = [];
  private readonly MAX_CALL_STACK_SIZE = 1000;

  callUserDefinedFunction(func, args): any {
    if (this.callStack.length >= this.MAX_CALL_STACK_SIZE) {
      throw new EvaluatorError(
        `Stack overflow: Maximum call stack size exceeded\n` +
        `Call stack: ${this.callStack.join(' → ')}`
      );
    }

    this.callStack.push(func.name);
    try {
      return execute(func);
    } finally {
      this.callStack.pop();
    }
  }
}
```

**Error Context:**

```typescript
try {
  evaluate(ast);
} catch (error) {
  console.error('SK8Script Error:');
  console.error(`  ${error.message}`);

  if (error instanceof EvaluatorError) {
    console.error(`  Call stack: ${evaluator.getCallStack().join(' → ')}`);
  }

  if (error.token) {
    console.error(`  At line ${error.token.line}, column ${error.token.column}`);
    console.error(`  ${getSourceLine(error.token.line)}`);
    console.error(`  ${' '.repeat(error.token.column)}^`);
  }
}
```

---

## Animation System

The Animation System provides smooth property interpolation using `requestAnimationFrame`.

### Animation Loop (requestAnimationFrame)

**Main Loop Structure:**

```typescript
class AnimationManager {
  private animationFrameId: number | null = null;

  private startAnimationLoop(): void {
    const update = () => {
      this.updateAnimations();

      if (this.animations.size > 0) {
        this.animationFrameId = requestAnimationFrame(update);
      } else {
        this.animationFrameId = null;  // Stop when no animations
      }
    };

    this.animationFrameId = requestAnimationFrame(update);
  }
}
```

**Update Cycle:**

```
requestAnimationFrame callback (60fps)
    ↓
for each active animation:
  1. Calculate elapsed time
  2. Compute progress (0 to 1)
  3. Apply easing function
  4. Interpolate value
  5. Update target property
  6. Call onUpdate callback (if any)
  7. If complete:
     - Mark for removal
     - Call onComplete callback
    ↓
Remove completed animations
    ↓
Schedule next frame (if animations remain)
```

### Easing Functions (Mathematical Basis)

**Easing Function Signature:**

```typescript
type EasingFunction = (t: number) => number;
// Input: t in [0, 1] (linear progress)
// Output: eased value in [0, 1] (may overshoot for bounce/elastic)
```

**Mathematical Definitions:**

```typescript
// Linear: y = t
linear(t: number): number {
  return t;
}

// Quadratic ease in: y = t²
easeInQuad(t: number): number {
  return t * t;
}

// Quadratic ease out: y = t(2 - t)
easeOutQuad(t: number): number {
  return t * (2 - t);
}

// Quadratic ease in-out: piecewise parabola
easeInOutQuad(t: number): number {
  return t < 0.5
    ? 2 * t * t                    // Ease in first half
    : -1 + (4 - 2 * t) * t;        // Ease out second half
}

// Cubic: y = t³
easeInCubic(t: number): number {
  return t * t * t;
}

// Elastic: damped sine wave
easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;

  return Math.pow(2, -10 * t) *
         Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
}

// Bounce: simulates gravity
easeOutBounce(t: number): number {
  if (t < 1/2.75) {
    return 7.5625 * t * t;
  } else if (t < 2/2.75) {
    return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
  } else if (t < 2.5/2.75) {
    return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
  } else {
    return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
  }
}
```

**Easing Visualization:**

```
Linear:      ╱
           ╱
         ╱

EaseInQuad:       ╱
                ╱
            __╱

EaseOutQuad: ╱‾‾
           ╱
         ╱

EaseInOut:     __╱‾‾
            __╱
         __╱

Elastic:     ╱~
          _╱ ~
        _╱   ~

Bounce:   ╱‾╲╱‾╲
        ╱    ╲╱
      ╱
```

### Tween Interpolation

**Linear Interpolation (Lerp):**

```typescript
updateAnimations(): void {
  const now = Date.now();

  this.animations.forEach(anim => {
    const elapsed = now - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);

    // Apply easing
    const easedProgress = anim.easing(progress);

    // Linear interpolation
    const currentValue = anim.startValue +
                        (anim.endValue - anim.startValue) * easedProgress;

    // Update target
    updateProperty(anim.target, anim.property, currentValue);
  });
}
```

**Multi-Property Animations:**

```typescript
// Animate multiple properties in parallel
moveTo(actor: SK8Actor, x: number, y: number, duration: number): void {
  animations.animate(actor, 'left', x, duration);
  animations.animate(actor, 'top', y, duration);
}

scaleTo(actor: SK8Actor, scale: number, duration: number): void {
  const currentWidth = actor.getWidth();
  const currentHeight = actor.getHeight();

  animations.animate(actor, 'width', currentWidth * scale, duration);
  animations.animate(actor, 'height', currentHeight * scale, duration);
}
```

### Timeline Data Structure

*Note: Timeline support is planned but not yet implemented. Here's the proposed architecture:*

```typescript
interface Keyframe {
  time: number;           // Time in milliseconds
  property: string;       // Property to animate
  value: any;            // Target value
  easing?: EasingFunction;
}

class Timeline {
  private keyframes: Keyframe[] = [];
  private currentTime: number = 0;
  private playing: boolean = false;

  addKeyframe(time: number, property: string, value: any): void {
    this.keyframes.push({ time, property, value });
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  play(): void {
    this.playing = true;
    this.currentTime = 0;
    this.startPlayback();
  }

  private update(deltaTime: number): void {
    this.currentTime += deltaTime;

    // Find keyframes around current time
    const before = this.findKeyframeBefore(this.currentTime);
    const after = this.findKeyframeAfter(this.currentTime);

    if (before && after) {
      // Interpolate between keyframes
      const progress = (this.currentTime - before.time) /
                      (after.time - before.time);
      const easedProgress = (after.easing || Easing.linear)(progress);
      const value = interpolate(before.value, after.value, easedProgress);

      this.target.set(after.property, value);
    }
  }
}
```

### Keyframe Storage and Evaluation

```typescript
class KeyframeTrack {
  private keyframes: Map<number, any> = new Map();

  evaluate(time: number): any {
    // Find surrounding keyframes
    const times = Array.from(this.keyframes.keys()).sort((a, b) => a - b);

    let beforeTime = 0;
    let afterTime = times[times.length - 1];

    for (let i = 0; i < times.length - 1; i++) {
      if (time >= times[i] && time < times[i + 1]) {
        beforeTime = times[i];
        afterTime = times[i + 1];
        break;
      }
    }

    const beforeValue = this.keyframes.get(beforeTime);
    const afterValue = this.keyframes.get(afterTime);

    if (time <= beforeTime) return beforeValue;
    if (time >= afterTime) return afterValue;

    // Interpolate
    const t = (time - beforeTime) / (afterTime - beforeTime);
    return this.interpolate(beforeValue, afterValue, t);
  }
}
```

### Performance Optimization

**Animation Batching:**

```typescript
// Instead of updating DOM/canvas immediately:
updateProperty(target, property, value): void {
  target[property] = value;
  // Don't render yet!
}

// Batch all updates, then render once:
updateAnimations(): void {
  for (const anim of this.animations) {
    updateProperty(anim.target, anim.property, calculateValue(anim));
  }

  // Single render pass for all animations
  stage.setNeedsRender();
}
```

**Animation Cancelation:**

```typescript
// Cancel by ID
animations.cancel(animId);

// Cancel all for target (prevents conflicts)
animations.cancelAllFor(actor);

// Cancel all
animations.cancelAll();
```

**Memory Management:**

```typescript
// Automatically remove completed animations
updateAnimations(): void {
  const completed: number[] = [];

  this.animations.forEach(anim => {
    if (isComplete(anim)) {
      completed.push(anim.id);
      anim.onComplete?.();
    }
  });

  completed.forEach(id => this.animations.delete(id));

  // Stop loop when no animations remain
  if (this.animations.size === 0) {
    this.stopAnimationLoop();
  }
}
```

---

## Project System

The Project System handles persistence, serialization, and project management.

### Serialization Format (.sk8json)

**File Structure:**

```json
{
  "formatVersion": "1.0.0",
  "metadata": {
    "name": "My Project",
    "version": "1.0.0",
    "author": "User Name",
    "created": "2025-01-15T10:30:00Z",
    "modified": "2025-01-20T14:22:00Z",
    "description": "Project description"
  },
  "stages": [
    {
      "id": "stage_0",
      "name": "Main Stage",
      "width": 800,
      "height": 600,
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "actorIds": ["actor_0", "actor_1", "actor_2"]
    }
  ],
  "actors": [
    {
      "id": "actor_0",
      "className": "SK8Rectangle",
      "name": "MyRect",
      "properties": {
        "boundsRect": {
          "value": { "left": 50, "top": 50, "right": 200, "bottom": 150 },
          "type": "object"
        },
        "fillColor": {
          "value": { "r": 255, "g": 0, "b": 0, "a": 1 },
          "type": "object"
        },
        "visible": {
          "value": true,
          "type": "boolean"
        }
      },
      "handlers": {
        "click": "function() { this.set('fillColor', {r:0,g:0,b:255,a:1}); }"
      },
      "parentId": null
    }
  ],
  "assets": [
    {
      "id": "asset_0",
      "name": "background.jpg",
      "type": "image",
      "url": "assets/background.jpg",
      "data": "base64_encoded_data_or_url"
    }
  ],
  "scripts": [
    {
      "id": "script_0",
      "name": "Main Script",
      "source": "on startup\n  print(\"Hello SK8!\")\nend"
    }
  ]
}
```

### Object Graph Traversal

**Serialization Algorithm:**

```typescript
serializeProject(project: SK8Project): SerializedProject {
  const context = new SerializationContext();

  // 1. Collect all objects and assign IDs
  const stages = project.getStages();
  const actors: SK8Actor[] = [];

  for (const stageDef of stages) {
    context.getObjectId(stageDef, 'stage');

    for (const actorId of stageDef.actorIds) {
      const actor = project.getActor(actorId);
      if (actor) {
        context.getObjectId(actor, 'actor');
        actors.push(actor);
      }
    }
  }

  // 2. Serialize objects with references
  const serializedActors = actors.map(actor =>
    serializeActor(actor, context.getObjectId(actor), context)
  );

  // 3. Serialize assets and scripts
  const assets = project.getAssets();
  const scripts = project.getScripts();

  return {
    formatVersion: '1.0.0',
    metadata: project.getMetadata(),
    stages: stages.map(s => serializeStage(s, context)),
    actors: serializedActors,
    assets,
    scripts
  };
}
```

**Handling Circular References:**

```typescript
class SerializationContext {
  private objectIds = new WeakMap<object, string>();

  serializeValue(value: any): any {
    if (value instanceof SK8Object) {
      // Check if already serialized
      if (this.hasObjectId(value)) {
        return { $ref: this.getObjectId(value) };  // Reference
      }

      // Assign ID and continue
      const id = this.getObjectId(value);
      return { $ref: id };
    }

    // Handle plain objects recursively
    if (typeof value === 'object') {
      const result: any = {};
      for (const key in value) {
        result[key] = this.serializeValue(value[key]);
      }
      return result;
    }

    return value;
  }
}
```

### Reference Resolution

**Deserialization Algorithm:**

```typescript
deserializeProject(data: SerializedProject): SK8Project {
  const project = new SK8Project();
  const context = new DeserializationContext();

  // 1. Create all actors first (without setting properties)
  for (const actorData of data.actors) {
    const ActorClass = getActorClass(actorData.className);
    const actor = new ActorClass();
    context.registerObject(actorData.id, actor);
    project.addActor(actorData.id, actor);
  }

  // 2. Now resolve properties and references
  for (const actorData of data.actors) {
    const actor = context.getObject(actorData.id);
    deserializeActorProperties(actor, actorData.properties, context);
    deserializeActorHandlers(actor, actorData.handlers);
  }

  // 3. Create stages and link actors
  for (const stageData of data.stages) {
    const stage = deserializeStage(stageData, context, project);
    project.addStage(stage);
  }

  return project;
}
```

**Reference Resolution:**

```typescript
class DeserializationContext {
  private objects = new Map<string, any>();

  resolveValue(value: any): any {
    // Handle references
    if (value && typeof value === 'object' && value.$ref) {
      const referenced = this.objects.get(value.$ref);
      if (!referenced) {
        throw new Error(`Unresolved reference: ${value.$ref}`);
      }
      return referenced;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.resolveValue(item));
    }

    // Handle nested objects
    if (typeof value === 'object') {
      const result: any = {};
      for (const key in value) {
        result[key] = this.resolveValue(value[key]);
      }
      return result;
    }

    return value;
  }
}
```

### Versioning Strategy

**Format Version:**

```typescript
interface SerializedProject {
  formatVersion: string;  // Semantic versioning: "major.minor.patch"
  // ...
}

function deserializeProject(data: any): SK8Project {
  const version = parseVersion(data.formatVersion);

  // Major version must match
  if (version.major !== CURRENT_MAJOR) {
    throw new Error(`Incompatible format version: ${data.formatVersion}`);
  }

  // Apply migrations for minor versions
  if (version.minor < CURRENT_MINOR) {
    data = migrateProject(data, version, CURRENT_VERSION);
  }

  return deserializeProjectV1(data);
}
```

**Migration System:**

```typescript
const migrations = [
  {
    from: '1.0.0',
    to: '1.1.0',
    migrate: (data: any) => {
      // Add new field with default
      for (const actor of data.actors) {
        if (!actor.properties.opacity) {
          actor.properties.opacity = { value: 1, type: 'number' };
        }
      }
      data.formatVersion = '1.1.0';
      return data;
    }
  },
  {
    from: '1.1.0',
    to: '1.2.0',
    migrate: (data: any) => {
      // Rename field
      for (const stage of data.stages) {
        if (stage.bgColor) {
          stage.backgroundColor = stage.bgColor;
          delete stage.bgColor;
        }
      }
      data.formatVersion = '1.2.0';
      return data;
    }
  }
];

function migrateProject(data: any, from: Version, to: Version): any {
  let current = data;

  for (const migration of migrations) {
    const migrationFrom = parseVersion(migration.from);
    const migrationTo = parseVersion(migration.to);

    if (versionGreaterOrEqual(migrationFrom, from) &&
        versionLessOrEqual(migrationTo, to)) {
      current = migration.migrate(current);
    }
  }

  return current;
}
```

### Auto-Save Implementation

**Auto-Save Manager:**

```typescript
class AutoSaveManager {
  private project: SK8Project;
  private intervalId: number | null = null;
  private lastSaveTime: number = 0;
  private isDirty: boolean = false;

  enable(config: AutoSaveConfig): void {
    this.intervalId = setInterval(() => {
      if (this.isDirty) {
        this.save();
      }
    }, config.intervalMs);

    // Also save on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isDirty) {
        this.save();
      }
    });
  }

  markDirty(): void {
    this.isDirty = true;
  }

  private async save(): Promise<void> {
    try {
      const data = serializeProject(this.project);
      const key = `sk8_autosave_${this.project.getMetadata().id}`;

      // Save to localStorage as JSON
      localStorage.setItem(key, JSON.stringify(data));

      // Also backup to IndexedDB for larger projects
      await this.saveToIndexedDB(data);

      this.isDirty = false;
      this.lastSaveTime = Date.now();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  async recover(): Promise<SK8Project | null> {
    const key = `sk8_autosave_${projectId}`;
    const json = localStorage.getItem(key);

    if (json) {
      try {
        const data = JSON.parse(json);
        return deserializeProject(data);
      } catch (error) {
        console.error('Recovery failed:', error);
        // Try IndexedDB backup
        return this.recoverFromIndexedDB();
      }
    }

    return null;
  }
}
```

### File I/O with File API

**Save to File:**

```typescript
async function saveProjectToFile(project: SK8Project, filename: string): Promise<void> {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: 'application/json' });

  // Use File API for download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

**Load from File:**

```typescript
async function loadProjectFromFile(): Promise<SK8Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sk8json,.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return reject(new Error('No file selected'));

      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateSerializedProject(data)) {
        return reject(new Error('Invalid project file'));
      }

      const project = deserializeProject(data);
      resolve(project);
    };

    input.click();
  });
}
```

**IndexedDB Integration:**

```typescript
class ProjectStore {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SK8Projects', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async save(project: SK8Project): Promise<void> {
    const data = serializeProjectToObject(project);
    const transaction = this.db!.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.put({
        id: project.getMetadata().id,
        data,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(projectId: string): Promise<SK8Project> {
    const transaction = this.db!.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) return reject(new Error('Project not found'));

        const project = deserializeProjectFromObject(result.data);
        resolve(project);
      };

      request.onerror = () => reject(request.error);
    });
  }
}
```

---

## Asset Management

Asset Management handles loading, caching, and lifecycle management for media resources.

### Asset Registry Design

```typescript
interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  status: MediaStatus;
  data?: any;  // Blob, HTMLImageElement, HTMLVideoElement, etc.
  size?: number;
  metadata?: Record<string, any>;
  thumbnail?: string;  // Data URL for preview
}

enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  JSON = 'json',
  BINARY = 'binary'
}

enum MediaStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

class AssetRegistry {
  private assets = new Map<string, MediaAsset>();
  private refCounts = new Map<string, number>();

  register(asset: MediaAsset): void {
    this.assets.set(asset.id, asset);
    this.refCounts.set(asset.id, 0);
  }

  get(id: string): MediaAsset | undefined {
    return this.assets.get(id);
  }

  has(id: string): boolean {
    return this.assets.has(id);
  }

  remove(id: string): void {
    this.assets.delete(id);
    this.refCounts.delete(id);
  }

  getAll(): MediaAsset[] {
    return Array.from(this.assets.values());
  }
}
```

### Reference Counting Algorithm

```typescript
class MediaManager {
  private registry = new AssetRegistry();
  private refCounts = new Map<string, number>();

  /**
   * Acquire a reference to an asset
   */
  acquire(assetId: string): MediaAsset {
    const asset = this.registry.get(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Increment reference count
    const count = this.refCounts.get(assetId) || 0;
    this.refCounts.set(assetId, count + 1);

    return asset;
  }

  /**
   * Release a reference to an asset
   */
  release(assetId: string): void {
    const count = this.refCounts.get(assetId);
    if (!count) return;

    const newCount = count - 1;
    this.refCounts.set(assetId, newCount);

    // Clean up if no more references
    if (newCount === 0) {
      this.unloadAsset(assetId);
    }
  }

  /**
   * Unload asset from memory
   */
  private unloadAsset(assetId: string): void {
    const asset = this.registry.get(assetId);
    if (!asset) return;

    // Revoke object URLs
    if (asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }

    // Clear data
    if (asset.data) {
      if (asset.data instanceof HTMLImageElement) {
        asset.data.src = '';
      } else if (asset.data instanceof HTMLVideoElement) {
        asset.data.src = '';
        asset.data.load();
      }
      asset.data = null;
    }

    asset.status = MediaStatus.PENDING;
  }
}
```

### Caching Strategy (IndexedDB + Memory)

**Two-Level Cache:**

1. **Memory Cache** - Hot assets for immediate access
2. **IndexedDB Cache** - Cold assets for persistence

```typescript
class AssetCache {
  // Level 1: Memory cache (LRU)
  private memoryCache = new Map<string, MediaAsset>();
  private memoryCacheSize = 0;
  private readonly MAX_MEMORY_CACHE_SIZE = 50 * 1024 * 1024;  // 50MB
  private lruQueue: string[] = [];

  // Level 2: IndexedDB cache
  private db: IDBDatabase | null = null;

  async get(assetId: string): Promise<MediaAsset | null> {
    // Try memory cache first
    if (this.memoryCache.has(assetId)) {
      this.touchLRU(assetId);
      return this.memoryCache.get(assetId)!;
    }

    // Try IndexedDB
    const asset = await this.getFromIndexedDB(assetId);
    if (asset) {
      this.putInMemory(assetId, asset);
      return asset;
    }

    return null;
  }

  async put(assetId: string, asset: MediaAsset): Promise<void> {
    // Always put in IndexedDB for persistence
    await this.putInIndexedDB(assetId, asset);

    // Put in memory if there's room
    this.putInMemory(assetId, asset);
  }

  private putInMemory(assetId: string, asset: MediaAsset): void {
    const size = this.estimateSize(asset);

    // Evict old entries if needed
    while (this.memoryCacheSize + size > this.MAX_MEMORY_CACHE_SIZE &&
           this.lruQueue.length > 0) {
      const evictId = this.lruQueue.shift()!;
      const evictAsset = this.memoryCache.get(evictId);
      if (evictAsset) {
        this.memoryCacheSize -= this.estimateSize(evictAsset);
        this.memoryCache.delete(evictId);
      }
    }

    // Add new entry
    this.memoryCache.set(assetId, asset);
    this.memoryCacheSize += size;
    this.lruQueue.push(assetId);
  }

  private touchLRU(assetId: string): void {
    // Move to end of queue (most recently used)
    const index = this.lruQueue.indexOf(assetId);
    if (index !== -1) {
      this.lruQueue.splice(index, 1);
      this.lruQueue.push(assetId);
    }
  }

  private async putInIndexedDB(assetId: string, asset: MediaAsset): Promise<void> {
    const transaction = this.db!.transaction(['assets'], 'readwrite');
    const store = transaction.objectStore('assets');

    return new Promise((resolve, reject) => {
      const request = store.put({ id: assetId, asset });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

### Loading Pipeline

```typescript
class AssetLoader {
  async loadAsset(url: string, type: MediaType): Promise<MediaAsset> {
    const asset: MediaAsset = {
      id: generateId(),
      name: extractFilename(url),
      type,
      url,
      status: MediaStatus.LOADING
    };

    try {
      switch (type) {
        case MediaType.IMAGE:
          asset.data = await this.loadImage(url);
          break;
        case MediaType.VIDEO:
          asset.data = await this.loadVideo(url);
          break;
        case MediaType.AUDIO:
          asset.data = await this.loadAudio(url);
          break;
        default:
          asset.data = await this.loadBinary(url);
      }

      asset.status = MediaStatus.LOADED;
      asset.size = this.estimateSize(asset.data);
      asset.thumbnail = await this.generateThumbnail(asset);

      return asset;
    } catch (error) {
      asset.status = MediaStatus.ERROR;
      throw error;
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private loadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve(video);
      video.onerror = reject;
      video.src = url;
    });
  }

  private loadAudio(url: string): Promise<AudioBuffer> {
    return loadAudioBuffer(url);  // Use audio-utils
  }

  private async loadBinary(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    return response.arrayBuffer();
  }
}
```

### Thumbnail Generation

```typescript
class ThumbnailGenerator {
  async generate(asset: MediaAsset): Promise<string> {
    switch (asset.type) {
      case MediaType.IMAGE:
        return this.generateImageThumbnail(asset.data);
      case MediaType.VIDEO:
        return this.generateVideoThumbnail(asset.data);
      default:
        return this.generateDefaultThumbnail(asset.type);
    }
  }

  private generateImageThumbnail(img: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const maxSize = 128;

    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  private generateVideoThumbnail(video: HTMLVideoElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 72;

      video.currentTime = 1;  // Seek to 1 second

      video.onseeked = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      video.onerror = reject;
    });
  }
}
```

### Bundler Operation

*Note: Asset bundler is planned but not yet implemented.*

**Proposed Bundle Format:**

```json
{
  "version": "1.0.0",
  "manifest": {
    "asset_0": {
      "name": "background.jpg",
      "type": "image",
      "offset": 0,
      "size": 45231
    },
    "asset_1": {
      "name": "music.mp3",
      "type": "audio",
      "offset": 45231,
      "size": 2457832
    }
  },
  "data": "base64_encoded_concatenated_data"
}
```

**Bundler Implementation:**

```typescript
class AssetBundler {
  async createBundle(assets: MediaAsset[]): Promise<Blob> {
    const manifest: Record<string, any> = {};
    const chunks: Blob[] = [];
    let offset = 0;

    for (const asset of assets) {
      const data = await this.getAssetData(asset);
      const blob = new Blob([data]);

      manifest[asset.id] = {
        name: asset.name,
        type: asset.type,
        offset,
        size: blob.size
      };

      chunks.push(blob);
      offset += blob.size;
    }

    const bundleHeader = JSON.stringify({ version: '1.0.0', manifest });
    const headerBlob = new Blob([bundleHeader, '\n---\n']);

    return new Blob([headerBlob, ...chunks]);
  }

  async extractBundle(bundle: Blob): Promise<MediaAsset[]> {
    const text = await bundle.text();
    const [headerText, ...dataChunks] = text.split('\n---\n');
    const { manifest } = JSON.parse(headerText);

    const dataBlob = new Blob(dataChunks);
    const dataBuffer = await dataBlob.arrayBuffer();

    const assets: MediaAsset[] = [];

    for (const [id, info] of Object.entries(manifest)) {
      const assetData = dataBuffer.slice(info.offset, info.offset + info.size);

      assets.push({
        id,
        name: info.name,
        type: info.type,
        url: URL.createObjectURL(new Blob([assetData])),
        status: MediaStatus.LOADED,
        data: assetData,
        size: info.size
      });
    }

    return assets;
  }
}
```

---

## Editor/IDE

The Editor/IDE provides visual authoring tools with undo/redo, selection management, and interactive editing.

### Command Pattern for Undo/Redo

**Command Interface:**

```typescript
interface EditorCommand {
  execute(): void;
  undo(): void;
  redo(): void;
  canMerge?(other: EditorCommand): boolean;
  merge?(other: EditorCommand): void;
  description: string;
}
```

**Command Stack:**

```typescript
class SK8Editor {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private maxUndoStackSize = 100;

  executeCommand(command: EditorCommand): void {
    command.execute();

    // Try to merge with last command
    if (this.undoStack.length > 0) {
      const lastCommand = this.undoStack[this.undoStack.length - 1];
      if (lastCommand.canMerge?.(command)) {
        lastCommand.merge?.(command);
        return;  // Merged, don't add new command
      }
    }

    this.undoStack.push(command);
    this.redoStack = [];  // Clear redo stack

    // Limit stack size
    if (this.undoStack.length > this.maxUndoStackSize) {
      this.undoStack.shift();
    }
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
      return true;
    }
    return false;
  }
}
```

**Command Merging:**

```typescript
class SetPropertyCommand extends BaseCommand {
  private timestamp = Date.now();
  private mergeTimeMs = 500;

  canMerge(other: EditorCommand): boolean {
    if (!(other instanceof SetPropertyCommand)) return false;
    if (other.target !== this.target) return false;
    if (other.propertyName !== this.propertyName) return false;

    // Only merge if within time window
    if (Date.now() - this.timestamp > this.mergeTimeMs) return false;

    return true;
  }

  merge(other: EditorCommand): void {
    if (other instanceof SetPropertyCommand) {
      this.newValue = other.newValue;
      this.timestamp = other.timestamp;
    }
  }
}
```

### Selection Management

```typescript
class SK8Editor {
  private selectedActors: Set<SK8Actor> = new Set();

  select(actor: SK8Actor, addToSelection = false): void {
    if (!addToSelection) {
      this.selectedActors.clear();
    }
    this.selectedActors.add(actor);
    this.emit('selection-change', this.getSelection());
  }

  deselect(actor: SK8Actor): void {
    this.selectedActors.delete(actor);
    this.emit('selection-change', this.getSelection());
  }

  selectInRect(left: number, top: number, right: number, bottom: number): void {
    this.selectedActors.clear();

    for (const actor of this.stage.getActors()) {
      const bounds = actor.getBoundsRect();
      if (RectUtils.containsRect({ left, top, right, bottom }, bounds)) {
        this.selectedActors.add(actor);
      }
    }

    this.emit('selection-change', this.getSelection());
  }
}
```

### Property Inspector Binding

```typescript
class SK8PropertyInspector {
  private editor: SK8Editor;
  private container: HTMLElement;
  private currentActor: SK8Actor | null = null;

  constructor(editor: SK8Editor, container: HTMLElement) {
    this.editor = editor;
    this.container = container;

    // Listen to selection changes
    editor.on('selection-change', (actors) => {
      if (actors.length === 1) {
        this.showActor(actors[0]);
      } else if (actors.length === 0) {
        this.clear();
      } else {
        this.showMultiple(actors);
      }
    });
  }

  private showActor(actor: SK8Actor): void {
    this.currentActor = actor;
    this.container.innerHTML = '';

    const properties = this.getPropertyDefinitions(actor);

    for (const prop of properties) {
      const row = this.createPropertyRow(actor, prop);
      this.container.appendChild(row);
    }
  }

  private createPropertyRow(actor: SK8Actor, prop: PropertyDefinition): HTMLElement {
    const row = document.createElement('div');
    row.className = 'property-row';

    const label = document.createElement('label');
    label.textContent = prop.label;
    row.appendChild(label);

    const input = this.createInputFor(prop);
    input.value = actor.get(prop.name);

    // Bind to property changes
    input.addEventListener('change', () => {
      const command = new SetPropertyCommand(
        actor,
        prop.name,
        this.parseValue(input.value, prop.type)
      );
      this.editor.executeCommand(command);
    });

    row.appendChild(input);

    return row;
  }

  private createInputFor(prop: PropertyDefinition): HTMLInputElement {
    switch (prop.type) {
      case 'number':
        const numInput = document.createElement('input');
        numInput.type = 'number';
        if (prop.min !== undefined) numInput.min = String(prop.min);
        if (prop.max !== undefined) numInput.max = String(prop.max);
        return numInput;

      case 'boolean':
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        return checkbox;

      case 'color':
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        return colorInput;

      default:
        const textInput = document.createElement('input');
        textInput.type = 'text';
        return textInput;
    }
  }
}
```

### Object Tree Synchronization

```typescript
class SK8ObjectTree {
  private editor: SK8Editor;
  private container: HTMLElement;
  private tree: TreeNode[] = [];

  constructor(editor: SK8Editor, container: HTMLElement) {
    this.editor = editor;
    this.container = container;

    // Listen to stage changes
    editor.getStage().addPropertyObserver('actors', () => {
      this.rebuild();
    });
  }

  private rebuild(): void {
    const actors = this.editor.getStage().getActors();

    this.tree = actors.map(actor => ({
      id: this.getActorId(actor),
      label: actor.getName(),
      actor,
      children: []  // Could support hierarchy
    }));

    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    for (const node of this.tree) {
      const element = this.createTreeNode(node);
      this.container.appendChild(element);
    }
  }

  private createTreeNode(node: TreeNode): HTMLElement {
    const div = document.createElement('div');
    div.className = 'tree-node';

    const label = document.createElement('span');
    label.textContent = node.label;
    div.appendChild(label);

    // Click to select
    div.addEventListener('click', () => {
      this.editor.select(node.actor);
    });

    // Highlight if selected
    if (this.editor.isSelected(node.actor)) {
      div.classList.add('selected');
    }

    return div;
  }
}
```

### Drag Handles and Resizing

```typescript
class SK8SelectionHandles {
  private editor: SK8Editor;
  private handles: Handle[] = [];

  show(actor: SK8Actor): void {
    this.clear();

    const bounds = actor.getBoundsRect();

    // Create 8 handles (corners and edges)
    this.handles = [
      this.createHandle('nw', bounds.left, bounds.top),
      this.createHandle('n', (bounds.left + bounds.right) / 2, bounds.top),
      this.createHandle('ne', bounds.right, bounds.top),
      this.createHandle('e', bounds.right, (bounds.top + bounds.bottom) / 2),
      this.createHandle('se', bounds.right, bounds.bottom),
      this.createHandle('s', (bounds.left + bounds.right) / 2, bounds.bottom),
      this.createHandle('sw', bounds.left, bounds.bottom),
      this.createHandle('w', bounds.left, (bounds.top + bounds.bottom) / 2)
    ];

    // Set up drag handlers
    for (const handle of this.handles) {
      this.setupHandleDrag(handle, actor);
    }
  }

  private setupHandleDrag(handle: Handle, actor: SK8Actor): void {
    let startBounds: Rect;
    let startX: number;
    let startY: number;

    handle.element.addEventListener('mousedown', (e) => {
      startBounds = actor.getBoundsRect();
      startX = e.clientX;
      startY = e.clientY;

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newBounds = this.calculateNewBounds(
          startBounds,
          handle.type,
          dx,
          dy
        );

        actor.setBoundsRect(newBounds);
        this.updateHandlePositions(actor);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Create undo command
        const command = new ResizeActorCommand(
          actor,
          actor.getBoundsRect().left,
          actor.getBoundsRect().top,
          actor.getBoundsRect().right,
          actor.getBoundsRect().bottom
        );
        this.editor.executeCommand(command);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private calculateNewBounds(
    bounds: Rect,
    handleType: HandleType,
    dx: number,
    dy: number
  ): Rect {
    const newBounds = { ...bounds };

    switch (handleType) {
      case 'nw':
        newBounds.left += dx;
        newBounds.top += dy;
        break;
      case 'n':
        newBounds.top += dy;
        break;
      case 'ne':
        newBounds.right += dx;
        newBounds.top += dy;
        break;
      case 'e':
        newBounds.right += dx;
        break;
      case 'se':
        newBounds.right += dx;
        newBounds.bottom += dy;
        break;
      case 's':
        newBounds.bottom += dy;
        break;
      case 'sw':
        newBounds.left += dx;
        newBounds.bottom += dy;
        break;
      case 'w':
        newBounds.left += dx;
        break;
    }

    // Enforce minimum size
    if (newBounds.right - newBounds.left < 10) {
      if (handleType.includes('w')) {
        newBounds.left = newBounds.right - 10;
      } else {
        newBounds.right = newBounds.left + 10;
      }
    }

    if (newBounds.bottom - newBounds.top < 10) {
      if (handleType.includes('n')) {
        newBounds.top = newBounds.bottom - 10;
      } else {
        newBounds.bottom = newBounds.top + 10;
      }
    }

    return newBounds;
  }
}
```

### Toolbar and Panels

```typescript
class SK8Toolbar {
  private editor: SK8Editor;
  private container: HTMLElement;
  private buttons: Map<string, ToolButton> = new Map();

  constructor(editor: SK8Editor, container: HTMLElement) {
    this.editor = editor;
    this.container = container;

    this.createButtons();

    // Update active tool indication
    editor.on('tool-change', (tool) => {
      this.setActiveTool(tool);
    });
  }

  private createButtons(): void {
    const tools = this.editor.getTools();

    for (const tool of tools) {
      const button = this.createToolButton(tool);
      this.buttons.set(tool.type, button);
      this.container.appendChild(button.element);
    }
  }

  private createToolButton(tool: EditorTool): ToolButton {
    const button = document.createElement('button');
    button.className = 'tool-button';
    button.title = `${tool.name} (${tool.hotkey})`;
    button.textContent = tool.name;

    button.addEventListener('click', () => {
      this.editor.setTool(tool.type);
    });

    return {
      element: button,
      tool
    };
  }

  private setActiveTool(toolType: ToolType): void {
    for (const [type, button] of this.buttons) {
      if (type === toolType) {
        button.element.classList.add('active');
      } else {
        button.element.classList.remove('active');
      }
    }
  }
}
```

---

## Data Flow

### Overall Data Flow Diagram

```
User Input (Mouse/Keyboard/Touch)
        ↓
SK8Stage Event Handlers
        ↓
Hit Testing → Find Actor at Point
        ↓
Create SK8Event
        ↓
Dispatch to Actor
        ↓
Actor Event Listeners
        ↓
Modify Properties / Call Handlers
        ↓
Property Changes
        ↓
Mark Stage as Dirty
        ↓
Animation Loop (requestAnimationFrame)
        ↓
Check needsRender Flag
        ↓
Render Pipeline
        ↓
Canvas Draw
        ↓
Display Update
```

### Property Change Flow

```
actor.set('width', 200)
        ↓
SK8Object.set()
        ↓
1. Validate (if validator exists)
2. Get old value
3. Call setter (if exists) OR store value
4. Invalidate computed properties
5. Notify observers
        ↓
Property Observers
        ↓
setNeedsDraw() / markActorDirty()
        ↓
Stage Render Loop
```

### Event Propagation Flow

```
Browser Event (e.g., click)
        ↓
SK8Stage Handler
        ↓
getMousePos() - convert to canvas coords
        ↓
actorAtPoint() - hit test
        ↓
Create SK8MouseEvent
        ↓
actor.dispatchEvent()
        ↓
For each listener:
  - Check stopImmediatePropagation
  - Call listener with event
  - Handle once flag
        ↓
Return !event.defaultPrevented
```

### Animation Flow

```
animations.animate(actor, 'left', 500, 1000)
        ↓
Create Animation object:
  - Store start value
  - Store end value
  - Store easing function
  - Store callbacks
        ↓
Add to animations Map
        ↓
Start animation loop (if not running)
        ↓
requestAnimationFrame callback:
  1. Calculate elapsed time
  2. Compute progress (0-1)
  3. Apply easing: t' = easing(t)
  4. Interpolate: v = start + (end - start) * t'
  5. Update property: actor.set('left', v)
  6. Call onUpdate callback
  7. If complete: call onComplete, remove animation
        ↓
Property update triggers render
        ↓
Display update
```

### SK8Script Execution Flow

```
SK8Script Source Code
        ↓
Lexer.tokenize()
        ↓
Token Stream
        ↓
Parser.parse()
        ↓
AST (Abstract Syntax Tree)
        ↓
Evaluator.evaluate()
        ↓
Traverse AST:
  - Literals → return value
  - Identifiers → lookup variable
  - BinaryOp → evaluate operands, apply operator
  - FunctionCall → lookup function, evaluate args, call
  - Assignment → evaluate value, store in context
  - Control flow → conditional evaluation
        ↓
Return result
```

### Project Save/Load Flow

**Save:**
```
SK8Project
        ↓
serializeProject()
        ↓
1. Create SerializationContext
2. Assign IDs to all objects
3. Serialize metadata
4. Serialize stages
5. Serialize actors (with properties)
6. Serialize assets
7. Serialize scripts
        ↓
JSON String
        ↓
Write to File / LocalStorage / IndexedDB
```

**Load:**
```
JSON String
        ↓
Parse JSON
        ↓
validateSerializedProject()
        ↓
deserializeProject()
        ↓
1. Create DeserializationContext
2. Create all actors (register IDs)
3. Deserialize properties (resolve references)
4. Deserialize handlers
5. Create stages
6. Link actors to stages
        ↓
SK8Project
        ↓
Load into editor
```

---

## Conclusion

This architecture document provides a comprehensive technical overview of the SK8 TypeScript system. For specific API documentation, see `API.md`. For contributing guidelines, see `CONTRIBUTING.md`. For performance optimization, see `PERFORMANCE.md`.

The architecture balances fidelity to the original SK8 design with modern web platform capabilities, creating a powerful multimedia authoring environment for the web.
