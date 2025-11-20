# SK8 TypeScript API Reference

## Table of Contents

1. [Core System](#core-system)
2. [Graphics and Actors](#graphics-and-actors)
3. [Events](#events)
4. [Animation](#animation)
5. [SK8Script](#sk8script)
6. [Project System](#project-system)
7. [Media Management](#media-management)
8. [Editor System](#editor-system)
9. [Utilities](#utilities)

---

## Core System

### SK8Object

The root class for all SK8 objects, implementing prototype-based inheritance.

**Source:** `/home/user/apple_sk8/typescript/src/core/SK8Object.ts`

```typescript
class SK8Object
```

#### Constructor

```typescript
constructor(parent?: SK8Object | null, name?: string)
```

Creates a new SK8Object with optional parent and name.

**Parameters:**
- `parent` - Optional parent object for prototype chain
- `name` - Optional name for the object

**Example:**
```typescript
const obj = new SK8Object(null, 'MyObject');
```

#### Properties

##### Parent Management

```typescript
getParent(): SK8Object | null
setParent(parent: SK8Object | null): void
```

Get or set the parent object in the prototype chain.

##### Name

```typescript
getName(): string
setName(name: string): void
```

Get or set the object's name.

#### Property System

```typescript
get(propertyName: string): PropertyValue
```

Get a property value, walking up the prototype chain if needed.

**Parameters:**
- `propertyName` - Name of the property to retrieve

**Returns:** The property value, or `undefined` if not found

**Example:**
```typescript
const width = rect.get('width');
```

---

```typescript
set(propertyName: string, value: PropertyValue, propagate?: boolean): void
```

Set a property value.

**Parameters:**
- `propertyName` - Name of the property to set
- `value` - New value for the property
- `propagate` - Optional; if true, propagate to children

**Example:**
```typescript
rect.set('width', 200);
rect.set('fillColor', { r: 255, g: 0, b: 0, a: 1 });
```

---

```typescript
defineProperty(propertyName: string, descriptor: PropertyDescriptor): void
```

Define a property with getter/setter and optional configuration.

**PropertyDescriptor Interface:**
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

**Example:**
```typescript
obj.defineProperty('area', {
  computed: true,
  dependencies: ['width', 'height'],
  getter: function() {
    return this.get('width') * this.get('height');
  }
});
```

---

```typescript
hasProperty(propertyName: string): boolean
hasOwnProperty(propertyName: string): boolean
```

Check if property exists (including inherited) or only on this object.

---

```typescript
getPropertyNames(): string[]
getOwnPropertyNames(): string[]
```

Get all property names (including inherited) or only this object's properties.

---

```typescript
getPropertyMetadata(propertyName: string): PropertyMetadata | undefined
```

Get metadata for a property.

#### Property Observers

```typescript
addPropertyObserver(propertyName: string, observer: PropertyObserver): void
removePropertyObserver(propertyName: string, observer: PropertyObserver): void
```

Add or remove observers that are called when a property changes.

**PropertyObserver Type:**
```typescript
type PropertyObserver = (newValue: PropertyValue, oldValue: PropertyValue) => void
```

**Example:**
```typescript
rect.addPropertyObserver('width', (newVal, oldVal) => {
  console.log(`Width changed from ${oldVal} to ${newVal}`);
});
```

#### Handler System

```typescript
addHandler(name: string, handler: HandlerFunction): void
```

Add a handler (method) to the object.

**Example:**
```typescript
obj.addHandler('greet', function(name: string) {
  return `Hello, ${name}!`;
});
```

---

```typescript
callHandler(name: string, ...args: any[]): any
```

Call a handler, walking up the prototype chain if needed.

**Example:**
```typescript
const greeting = obj.callHandler('greet', 'World');
// Returns: "Hello, World!"
```

---

```typescript
hasHandler(name: string): boolean
```

Check if a handler exists.

#### Cloning

```typescript
clone(name?: string): SK8Object
```

Create a new object with this object as parent.

**Example:**
```typescript
const parent = new SK8Object(null, 'Parent');
parent.set('color', 'red');

const child = parent.clone('Child');
child.get('color'); // Returns 'red' (inherited)
```

#### Debugging

```typescript
toString(): string
inspect(): object
```

Get string representation or detailed inspection object.

---

## Graphics and Actors

### SK8Actor

Base class for all visual objects.

**Source:** `/home/user/apple_sk8/typescript/src/graphics/SK8Actor.ts`

```typescript
abstract class SK8Actor extends SK8Object
```

#### Constructor

```typescript
constructor(parent?: SK8Actor, name?: string)
```

#### Bounds and Position

```typescript
getBoundsRect(): Rect
setBoundsRect(rect: Rect): void
```

Get or set the actor's bounding rectangle.

**Rect Interface:**
```typescript
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
```

**Example:**
```typescript
rect.setBoundsRect({ left: 50, top: 50, right: 200, bottom: 150 });
```

---

```typescript
getLeft(): number
setLeft(value: number): void
getTop(): number
setTop(value: number): void
getRight(): number
getBottom(): number
getWidth(): number
setWidth(value: number): void
getHeight(): number
setHeight(value: number): void
```

Convenience methods for bounds properties.

---

```typescript
moveTo(x: number, y: number): void
moveBy(dx: number, dy: number): void
```

Move actor to absolute position or by relative offset.

**Example:**
```typescript
rect.moveTo(100, 100);
rect.moveBy(50, 0); // Move 50 pixels right
```

#### Visual Properties

```typescript
getVisible(): boolean
setVisible(value: boolean): void
```

Control actor visibility.

---

```typescript
getFillColor(): Color | Gradient | null
setFillColor(color: Color | Gradient | null): void
getFrameColor(): Color | null
setFrameColor(color: Color | null): void
getLineWidth(): number
setLineWidth(width: number): void
```

Control colors and stroke width.

**Color Interface:**
```typescript
interface Color {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
  a: number;  // 0-1 (alpha)
}
```

**Example:**
```typescript
rect.setFillColor({ r: 255, g: 0, b: 0, a: 1 });  // Red
rect.setFrameColor({ r: 0, g: 0, b: 0, a: 1 });   // Black
rect.setLineWidth(2);
```

---

```typescript
getOpacity(): number
setOpacity(opacity: number): void
fadeIn(duration?: number): void
fadeOut(duration?: number): void
```

Control opacity and fading.

**Example:**
```typescript
rect.setOpacity(0.5);  // 50% transparent
rect.fadeIn(300);      // Fade in over 300ms
```

#### Shadow Effects

```typescript
setShadow(color: Color, blur?: number, offsetX?: number, offsetY?: number): void
clearShadow(): void
getShadowColor(): Color | null
getShadowBlur(): number
getShadowOffsetX(): number
getShadowOffsetY(): number
hasShadow(): boolean
```

**Example:**
```typescript
rect.setShadow(
  { r: 0, g: 0, b: 0, a: 0.5 },  // Semi-transparent black
  4,    // blur
  2,    // offsetX
  2     // offsetY
);
```

#### Transformations

```typescript
rotate(angle: number): void
getRotation(): number
scale(sx: number, sy?: number): void
getScale(): { x: number; y: number }
skew(ax: number, ay: number): void
getSkew(): { x: number; y: number }
resetTransform(): void
getTransformMatrix(): DOMMatrix
```

**Example:**
```typescript
rect.rotate(45);           // Rotate 45 degrees
rect.scale(2, 1.5);        // Scale 2x horizontally, 1.5x vertically
rect.resetTransform();     // Reset all transforms
```

#### Hit Testing

```typescript
containsPoint(x: number, y: number): boolean
```

Test if a point is inside the actor (respects transforms).

#### Rendering

```typescript
abstract render(ctx: CanvasRenderingContext2D): void
```

Render the actor (must be implemented by subclasses).

#### Drag and Drop

```typescript
getDraggable(): boolean
setDraggable(value: boolean): void
getDroppable(): boolean
setDroppable(value: boolean): void
```

#### Event Handling

```typescript
addEventListener(
  type: string,
  listener: EventListener,
  options?: EventListenerOptions
): void

removeEventListener(type: string, listener: EventListener): void

dispatchEvent(event: SK8Event): boolean
```

See [Events](#events) section for details.

---

### Shape Classes

#### SK8Rectangle

```typescript
class SK8Rectangle extends SK8Actor
```

Rectangular shape actor.

**Example:**
```typescript
import { SK8Rectangle } from 'sk8-ts';

const rect = new SK8Rectangle();
rect.setBoundsRect({ left: 50, top: 50, right: 200, bottom: 150 });
rect.setFillColor({ r: 255, g: 0, b: 0, a: 1 });
rect.setFrameColor({ r: 0, g: 0, b: 0, a: 1 });
```

#### SK8RoundRect

```typescript
class SK8RoundRect extends SK8Actor
```

Rounded rectangle shape.

**Additional Methods:**
```typescript
getCornerRadius(): number
setCornerRadius(radius: number): void
```

#### SK8Circle

```typescript
class SK8Circle extends SK8Actor
```

Circle/ellipse shape.

#### SK8Line

```typescript
class SK8Line extends SK8Actor
```

Line shape.

**Additional Methods:**
```typescript
getStartPoint(): Point
setStartPoint(point: Point): void
getEndPoint(): Point
setEndPoint(point: Point): void
```

#### SK8Text

```typescript
class SK8Text extends SK8Actor
```

Text rendering actor.

**Additional Methods:**
```typescript
getText(): string
setText(text: string): void
getTextStyle(): TextStyle
setTextStyle(style: TextStyle): void
```

**TextStyle:**
```typescript
class TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: Color;
}
```

---

### SK8Stage

Canvas manager and container for actors.

**Source:** `/home/user/apple_sk8/typescript/src/graphics/SK8Stage.ts`

```typescript
class SK8Stage extends SK8Object
```

#### Constructor

```typescript
constructor(canvas: HTMLCanvasElement | string, name?: string)
```

**Parameters:**
- `canvas` - Canvas element or element ID
- `name` - Optional stage name

**Example:**
```typescript
const stage = new SK8Stage('my-canvas');
// or
const canvas = document.getElementById('my-canvas');
const stage = new SK8Stage(canvas);
```

#### Actor Management

```typescript
addActor(actor: SK8Actor): void
removeActor(actor: SK8Actor): void
getActors(): SK8Actor[]
clearActors(): void
```

**Example:**
```typescript
const rect = new SK8Rectangle();
stage.addActor(rect);
```

#### Z-Order

```typescript
bringToFront(actor: SK8Actor): void
sendToBack(actor: SK8Actor): void
```

#### Hit Testing

```typescript
actorAtPoint(x: number, y: number): SK8Actor | null
```

Get the topmost actor at the given point.

#### Rendering

```typescript
render(): void
startRendering(): void
stopRendering(): void
setNeedsRender(): void
```

**Example:**
```typescript
stage.startRendering();  // Start animation loop
```

---

```typescript
setUseDirtyRectOptimization(enabled: boolean): void
getFPS(): number
```

Enable dirty rectangle optimization and get current FPS.

#### Canvas Properties

```typescript
getWidth(): number
getHeight(): number
setSize(width: number, height: number): void
getBackgroundColor(): Color
setBackgroundColor(color: Color): void
```

#### Focus Management

```typescript
setFocus(actor: SK8Actor | null): void
getFocusedActor(): SK8Actor | null
```

---

## Events

### Event Classes

**Source:** `/home/user/apple_sk8/typescript/src/events/SK8Event.ts`

#### SK8Event (Base)

```typescript
abstract class SK8Event {
  readonly type: string;
  readonly timestamp: number;
  target: SK8Actor | null;
  currentTarget: SK8Actor | null;
  phase: EventPhase;

  stopPropagation(): void;
  stopImmediatePropagation(): void;
  preventDefault(): void;

  get propagationStopped(): boolean;
  get immediatePropagationStopped(): boolean;
  get defaultPrevented(): boolean;
}
```

#### SK8MouseEvent

```typescript
class SK8MouseEvent extends SK8Event {
  readonly x: number;
  readonly y: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly button: MouseButton;
  readonly buttons: number;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}
```

**Event Types:** `click`, `mousedown`, `mouseup`, `mousemove`, `mouseenter`, `mouseleave`, `contextmenu`

**Example:**
```typescript
rect.addEventListener('click', (event: SK8Event) => {
  const mouseEvent = event as SK8MouseEvent;
  console.log(`Clicked at ${mouseEvent.x}, ${mouseEvent.y}`);
});
```

#### SK8KeyboardEvent

```typescript
class SK8KeyboardEvent extends SK8Event {
  readonly key: string;
  readonly code: string;
  readonly keyCode: number;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly repeat: boolean;
}
```

**Event Types:** `keydown`, `keyup`, `keypress`

#### SK8TouchEvent

```typescript
interface TouchPoint {
  identifier: number;
  x: number;
  y: number;
  clientX: number;
  clientY: number;
}

class SK8TouchEvent extends SK8Event {
  readonly touches: TouchPoint[];
  readonly changedTouches: TouchPoint[];
}
```

**Event Types:** `touchstart`, `touchmove`, `touchend`, `touchcancel`

#### SK8CustomEvent

```typescript
class SK8CustomEvent<T = any> extends SK8Event {
  readonly detail: T;
}
```

### Event Utilities

**Source:** `/home/user/apple_sk8/typescript/src/events/event-utils.ts`

```typescript
function debounce<T extends Function>(func: T, wait: number): T
function throttle<T extends Function>(func: T, wait: number): T
function once<T extends Function>(func: T): T
```

Utility functions for event handling.

**Example:**
```typescript
import { debounce } from 'sk8-ts';

const handleResize = debounce(() => {
  console.log('Window resized');
}, 250);

window.addEventListener('resize', handleResize);
```

---

## Animation

**Source:** `/home/user/apple_sk8/typescript/src/runtime/animation.ts`

### AnimationManager

```typescript
class AnimationManager {
  animate(
    target: any,
    property: string,
    endValue: number,
    duration: number,
    options?: {
      easing?: EasingFunction;
      onComplete?: () => void;
      onUpdate?: (value: number) => void;
    }
  ): number;

  cancel(animationId: number): void;
  cancelAllFor(target: any): void;
  cancelAll(): void;
}
```

**Global Instance:**
```typescript
import { animations } from 'sk8-ts';
```

**Example:**
```typescript
import { animations, Easing } from 'sk8-ts';

// Animate left property
const animId = animations.animate(rect, 'left', 500, 1000, {
  easing: Easing.easeInOutQuad,
  onComplete: () => console.log('Animation complete!'),
  onUpdate: (value) => console.log(`Current value: ${value}`)
});

// Cancel animation
animations.cancel(animId);
```

### Easing Functions

```typescript
class Easing {
  static linear(t: number): number;
  static easeInQuad(t: number): number;
  static easeOutQuad(t: number): number;
  static easeInOutQuad(t: number): number;
  static easeInCubic(t: number): number;
  static easeOutCubic(t: number): number;
  static easeInOutCubic(t: number): number;
  static easeInElastic(t: number): number;
  static easeOutElastic(t: number): number;
  static easeInBounce(t: number): number;
  static easeOutBounce(t: number): number;
}
```

### Animation Helpers

```typescript
class AnimationHelpers {
  static fadeIn(actor: SK8Actor, duration?: number): number;
  static fadeOut(actor: SK8Actor, duration?: number): number;
  static moveTo(actor: SK8Actor, x: number, y: number, duration: number): void;
  static scaleTo(actor: SK8Actor, scale: number, duration: number): void;
  static pulse(actor: SK8Actor, scale?: number, duration?: number): void;
  static shake(actor: SK8Actor, intensity?: number, duration?: number): void;
}
```

**Example:**
```typescript
import { AnimationHelpers } from 'sk8-ts';

AnimationHelpers.fadeIn(rect, 300);
AnimationHelpers.pulse(rect, 1.2, 300);
AnimationHelpers.shake(rect, 10, 500);
```

---

## SK8Script

**Source:** `/home/user/apple_sk8/typescript/src/sk8script/`

### Lexer

```typescript
class Lexer {
  constructor(source: string);
  tokenize(): Token[];
}

function tokenize(source: string): Token[]
```

**Example:**
```typescript
import { tokenize } from 'sk8-ts';

const tokens = tokenize('set x to 42');
```

### Parser

```typescript
class Parser {
  constructor(tokens: Token[]);
  parse(): ASTNode;
}

function parse(tokens: Token[]): ASTNode
```

**Example:**
```typescript
import { tokenize, parse } from 'sk8-ts';

const tokens = tokenize('set x to 42');
const ast = parse(tokens);
```

### Evaluator

```typescript
class Evaluator {
  constructor(context?: EvaluationContext);

  evaluate(node: ASTNode): any;
  registerFunction(name: string, func: BuiltInFunction): void;
  registerFunctions(functions: Record<string, BuiltInFunction>): void;
  setVariable(name: string, value: any): void;
  getVariable(name: string): any;
  getContext(): EvaluationContext;
}

function evaluate(node: ASTNode, context?: EvaluationContext): any
```

**Example:**
```typescript
import { createEvaluator } from 'sk8-ts';

const evaluator = createEvaluator();  // Includes stdlib
evaluator.setVariable('x', 10);
evaluator.setVariable('y', 20);

const result = evaluator.evaluate(ast);
```

### Standard Library

```typescript
import { stdlib } from 'sk8-ts';
```

**Categories:**
- **Math:** abs, sqrt, sin, cos, tan, pow, log, random, round, floor, ceil
- **String:** length, substring, uppercase, lowercase, concat, split, join
- **Collection:** length, add, remove, map, filter, reduce, sort
- **Type:** typeof, isNumber, isString, isList, isTable
- **I/O:** print, alert, prompt
- **Object:** getProperty, setProperty, hasProperty, keys, values

**Example:**
```typescript
import { evaluateScript } from 'sk8-ts';

const result = evaluateScript('sqrt(16) + abs(-5)');
// Returns: 9
```

---

## Project System

**Source:** `/home/user/apple_sk8/typescript/src/project/`

### SK8Project

```typescript
class SK8Project {
  getMetadata(): ProjectMetadata;
  setMetadata(metadata: Partial<ProjectMetadata>): void;

  addStage(stage: StageDefinition): void;
  getStages(): StageDefinition[];

  addActor(id: string, actor: SK8Actor): void;
  getActor(id: string): SK8Actor | undefined;
  getActors(): Map<string, SK8Actor>;

  addAsset(asset: ProjectAsset): void;
  getAssets(): ProjectAsset[];

  addScript(script: ProjectScript): void;
  getScripts(): ProjectScript[];
}

function createProject(metadata?: Partial<ProjectMetadata>): SK8Project
```

### Serialization

```typescript
function serializeProject(
  project: SK8Project,
  options?: SerializationOptions
): string

function serializeProjectToObject(
  project: SK8Project,
  options?: SerializationOptions
): SerializedProject

function validateSerializedProject(data: any): boolean
```

### Deserialization

```typescript
function deserializeProject(
  data: SerializedProject,
  options?: DeserializationOptions
): SK8Project

function deserializeProjectFromObject(
  data: any,
  options?: DeserializationOptions
): SK8Project

function registerActorClass(
  className: string,
  constructor: new () => SK8Actor
): void
```

### File I/O

```typescript
function saveProjectToFile(
  project: SK8Project,
  filename: string
): Promise<void>

function loadProjectFromFile(): Promise<SK8Project>

function openProjectFromFilePicker(): Promise<SK8Project>

function saveProjectToLocalStorage(
  project: SK8Project,
  key: string
): void

function loadProjectFromLocalStorage(key: string): SK8Project | null

function enableAutoSave(
  project: SK8Project,
  config: AutoSaveConfig
): void

function recoverProjectFromAutoSave(projectId: string): Promise<SK8Project | null>
```

### Project Manager

```typescript
class ProjectManager {
  getCurrentProject(): SK8Project | null;
  setCurrentProject(project: SK8Project): void;

  markDirty(): void;
  isDirty(): boolean;

  save(): Promise<void>;
  saveAs(filename: string): Promise<void>;
  load(filename: string): Promise<void>;

  addChangeListener(listener: ProjectChangeListener): void;
  removeChangeListener(listener: ProjectChangeListener): void;
}

function getProjectManager(): ProjectManager
function createProjectManager(options?: ProjectManagerOptions): ProjectManager
```

---

## Media Management

**Source:** `/home/user/apple_sk8/typescript/src/media/media-manager.ts`

### MediaManager

```typescript
class MediaManager {
  registerAsset(asset: MediaAsset): void;
  loadAsset(url: string, type: MediaType): Promise<MediaAsset>;
  getAsset(id: string): MediaAsset | undefined;
  getAssetData(id: string): any;
  preloadAssets(urls: string[]): Promise<MediaAsset[]>;
}

function getMediaManager(): MediaManager
function registerAsset(asset: MediaAsset): void
function loadAsset(url: string, type: MediaType): Promise<MediaAsset>
function getAsset(id: string): MediaAsset | undefined
function preloadAssets(urls: string[]): Promise<MediaAsset[]>
```

**Example:**
```typescript
import { loadAsset, MediaType } from 'sk8-ts';

const imageAsset = await loadAsset('path/to/image.jpg', MediaType.IMAGE);
const picture = new SK8Picture();
picture.setImage(imageAsset.data);
```

### Audio Utilities

**Source:** `/home/user/apple_sk8/typescript/src/media/audio-utils.ts`

```typescript
function getAudioContext(): AudioContext
function resumeAudioContext(): Promise<void>
function loadAudio(url: string): Promise<AudioBuffer>
function playAudioBuffer(buffer: AudioBuffer, options?: AudioOptions): AudioPlayer
function playBeep(frequency?: number, duration?: number): Promise<void>
```

---

## Editor System

**Source:** `/home/user/apple_sk8/typescript/src/editor/editor.ts`

### SK8Editor

```typescript
class SK8Editor {
  constructor(stage: SK8Stage);

  // Selection
  getSelection(): SK8Actor[];
  setSelection(actors: SK8Actor[]): void;
  select(actor: SK8Actor, addToSelection?: boolean): void;
  deselect(actor: SK8Actor): void;
  clearSelection(): void;
  isSelected(actor: SK8Actor): boolean;

  // Tools
  getCurrentTool(): ToolType;
  setTool(toolType: ToolType): void;
  registerTool(tool: EditorTool): void;
  getTool(type: ToolType): EditorTool | undefined;

  // Commands (Undo/Redo)
  executeCommand(command: EditorCommand): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  clearHistory(): void;

  // Events
  on(eventType: EditorEventType, listener: EditorEventListener): void;
  off(eventType: EditorEventType, listener: EditorEventListener): void;

  // Keyboard
  handleKeyDown(event: KeyboardEvent): boolean;
}
```

### Editor Commands

```typescript
class SetPropertyCommand extends BaseCommand {
  constructor(
    target: SK8Object,
    propertyName: string,
    newValue: PropertyValue
  );
}

class MoveActorsCommand extends BaseCommand {
  constructor(actors: SK8Actor[], dx: number, dy: number);
}

class ResizeActorCommand extends BaseCommand {
  constructor(
    actor: SK8Actor,
    left: number,
    top: number,
    right: number,
    bottom: number
  );
}

class DeleteActorsCommand extends BaseCommand {
  constructor(stage: SK8Stage, actors: SK8Actor[]);
}

class AddActorCommand extends BaseCommand {
  constructor(stage: SK8Stage, actor: SK8Actor);
}
```

### Property Inspector

```typescript
class SK8PropertyInspector {
  constructor(editor: SK8Editor, container: HTMLElement);
  refresh(): void;
}
```

### Object Tree

```typescript
class SK8ObjectTree {
  constructor(editor: SK8Editor, container: HTMLElement);
  refresh(): void;
}
```

### Toolbar

```typescript
class SK8Toolbar {
  constructor(editor: SK8Editor, container: HTMLElement);
}
```

---

## Utilities

### Color Utilities

```typescript
class ColorUtils {
  static readonly White: Color;
  static readonly Black: Color;
  static readonly Red: Color;
  static readonly Green: Color;
  static readonly Blue: Color;

  static toCSS(color: Color): string;
  static fromCSS(css: string): Color;
  static fromRGB(r: number, g: number, b: number, a?: number): Color;
  static interpolate(color1: Color, color2: Color, t: number): Color;
}
```

### Rect Utilities

```typescript
class RectUtils {
  static width(rect: Rect): number;
  static height(rect: Rect): number;
  static centerX(rect: Rect): number;
  static centerY(rect: Rect): number;

  static contains(rect: Rect, x: number, y: number): boolean;
  static containsRect(rect: Rect, other: Rect): boolean;
  static intersects(rect1: Rect, rect2: Rect): boolean;
  static union(rect1: Rect, rect2: Rect): Rect;

  static fromXYWH(x: number, y: number, width: number, height: number): Rect;
  static fromLTRB(left: number, top: number, right: number, bottom: number): Rect;
}
```

### Collection Utilities

```typescript
class SK8List<T> {
  add(item: T): void;
  remove(item: T): boolean;
  get(index: number): T | undefined;
  set(index: number, item: T): void;
  length(): number;
  map<U>(fn: (item: T) => U): SK8List<U>;
  filter(fn: (item: T) => boolean): SK8List<T>;
  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U;
  sort(compareFn?: (a: T, b: T) => number): SK8List<T>;
}

class SK8Table<K, V> {
  setItem(key: K, value: V): void;
  getItem(key: K): V | undefined;
  hasItem(key: K): boolean;
  removeItem(key: K): boolean;
  keys(): K[];
  values(): V[];
  entries(): [K, V][];
  forEach(fn: (value: V, key: K) => void): void;
}
```

---

## Type Definitions

For TypeScript type definitions, see `/home/user/apple_sk8/typescript/TYPES.md`.

## Examples

For complete usage examples, see:
- `/home/user/apple_sk8/typescript/examples/phase1.2-example.ts`
- `/home/user/apple_sk8/typescript/examples/project-showcase.ts`

## Source Code

All source files are located in `/home/user/apple_sk8/typescript/src/`.

For architecture details, see `/home/user/apple_sk8/ARCHITECTURE.md`.
