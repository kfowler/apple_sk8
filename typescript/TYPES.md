# SK8 TypeScript Type System Documentation

Complete guide to TypeScript types used in SK8, including core types, generic constraints, and type usage patterns.

## Table of Contents

1. [Core Type Definitions](#core-type-definitions)
2. [Generic Types and Constraints](#generic-types-and-constraints)
3. [Type Guards and Narrowing](#type-guards-and-narrowing)
4. [Union Types](#union-types)
5. [Interface vs Type Usage](#interface-vs-type-usage)
6. [Declaration Files](#declaration-files)
7. [Advanced Patterns](#advanced-patterns)

---

## Core Type Definitions

### Basic Types

```typescript
// Primitive types
type PropertyValue = any;  // Any value can be a property
type HandlerFunction = (...args: any[]) => any;

// Validation and observation
type PropertyValidator = (value: PropertyValue) => boolean | string;
type PropertyObserver = (newValue: PropertyValue, oldValue: PropertyValue) => void;
```

### Property Descriptor

```typescript
interface PropertyDescriptor {
  // Value storage
  value?: PropertyValue;

  // Computed property
  getter?: () => PropertyValue;
  setter?: (value: PropertyValue) => void;

  // Flags
  propagate?: boolean;      // Propagate to children
  computed?: boolean;       // Is a computed property

  // Dependencies and validation
  dependencies?: string[];  // Properties this depends on
  validator?: PropertyValidator;

  // Metadata
  metadata?: PropertyMetadata;
}

interface PropertyMetadata {
  type?: string;           // 'string' | 'number' | 'boolean' | 'object'
  description?: string;    // Human-readable description
  category?: string;       // For grouping in inspector
  min?: number;           // For numeric types
  max?: number;           // For numeric types
  [key: string]: any;     // Extensible
}
```

### Geometry Types

```typescript
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}
```

### Color Types

```typescript
interface Color {
  r: number;    // 0-255
  g: number;    // 0-255
  b: number;    // 0-255
  a: number;    // 0-1 (alpha)
}

// Color can be specified in multiple ways
type ColorValue = Color | string | number;
```

### Event Types

```typescript
// Event listener function
type EventListener = (event: SK8Event) => void;

interface EventListenerOptions {
  capture?: boolean;    // Capture phase
  once?: boolean;       // Remove after first invocation
}

interface EventListenerEntry {
  listener: EventListener;
  options: EventListenerOptions;
}

// Touch point
interface TouchPoint {
  identifier: number;   // Touch ID
  x: number;           // Canvas X coordinate
  y: number;           // Canvas Y coordinate
  clientX: number;     // Screen X coordinate
  clientY: number;     // Screen Y coordinate
}
```

---

## Generic Types and Constraints

### Collection Types

```typescript
// Generic collection
class SK8Collection<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  // Generic with constraint
  find<U extends T>(predicate: (item: U) => boolean): U | undefined {
    return this.items.find(predicate as any) as U | undefined;
  }
}

// Typed list
class SK8List<T> extends SK8Collection<T> {
  map<U>(fn: (item: T) => U): SK8List<U> {
    const result = new SK8List<U>();
    for (const item of this.items) {
      result.add(fn(item));
    }
    return result;
  }

  filter(fn: (item: T) => boolean): SK8List<T> {
    const result = new SK8List<T>();
    for (const item of this.items) {
      if (fn(item)) {
        result.add(item);
      }
    }
    return result;
  }
}

// Typed table (map)
class SK8Table<K, V> {
  private data = new Map<K, V>();

  setItem(key: K, value: V): void {
    this.data.set(key, value);
  }

  getItem(key: K): V | undefined {
    return this.data.get(key);
  }

  // Iterator support
  *[Symbol.iterator](): Iterator<[K, V]> {
    yield* this.data.entries();
  }
}
```

### Custom Event Generic

```typescript
class SK8CustomEvent<T = any> extends SK8Event {
  readonly detail: T;

  constructor(type: string, detail: T) {
    super(type);
    this.detail = detail;
  }
}

// Usage:
interface MyEventData {
  score: number;
  level: number;
}

const event = new SK8CustomEvent<MyEventData>('gameOver', {
  score: 1000,
  level: 5
});
```

### Constrained Generic Functions

```typescript
// Function that works with SK8Objects
function cloneObject<T extends SK8Object>(obj: T, name?: string): T {
  return obj.clone(name) as T;
}

// Function with multiple type parameters
function animate<T extends SK8Actor, K extends keyof T>(
  target: T,
  property: K,
  endValue: T[K] extends number ? number : never,
  duration: number
): number {
  // Type-safe animation
  return animations.animate(target, property as string, endValue, duration);
}

// Usage:
const rect = new SK8Rectangle();
animate(rect, 'width', 200, 1000);  // ✓ Valid
// animate(rect, 'fillColor', 'red', 1000);  // ✗ Error: fillColor not number
```

---

## Type Guards and Narrowing

### Built-in Type Guards

```typescript
// Check if value is an SK8Actor
function isSK8Actor(obj: any): obj is SK8Actor {
  return obj instanceof SK8Actor;
}

// Check if value is a Color
function isColor(value: any): value is Color {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.r === 'number' &&
    typeof value.g === 'number' &&
    typeof value.b === 'number' &&
    typeof value.a === 'number'
  );
}

// Check if value is a Rect
function isRect(value: any): value is Rect {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.left === 'number' &&
    typeof value.top === 'number' &&
    typeof value.right === 'number' &&
    typeof value.bottom === 'number'
  );
}
```

### Usage with Narrowing

```typescript
function handleValue(value: unknown): void {
  if (isSK8Actor(value)) {
    // TypeScript knows value is SK8Actor
    value.render(ctx);
    value.moveTo(100, 100);
  } else if (isColor(value)) {
    // TypeScript knows value is Color
    const css = ColorUtils.toCSS(value);
  } else if (typeof value === 'string') {
    // TypeScript knows value is string
    console.log(value.toUpperCase());
  }
}
```

### Discriminated Unions

```typescript
// AST node types with discriminant
type ASTNode =
  | { kind: 'Literal'; value: any }
  | { kind: 'Identifier'; name: string }
  | { kind: 'BinaryOp'; operator: TokenType; left: ASTNode; right: ASTNode }
  | { kind: 'FunctionCall'; name: string; args: ASTNode[] };

function evaluate(node: ASTNode): any {
  switch (node.kind) {
    case 'Literal':
      // TypeScript knows node.value exists
      return node.value;

    case 'Identifier':
      // TypeScript knows node.name exists
      return lookupVariable(node.name);

    case 'BinaryOp':
      // TypeScript knows node.operator, left, right exist
      return evaluateBinaryOp(node.operator, node.left, node.right);

    case 'FunctionCall':
      // TypeScript knows node.name, args exist
      return callFunction(node.name, node.args);
  }
}
```

---

## Union Types

### Common Unions

```typescript
// A property can be a primitive or complex value
type SerializableValue =
  | null
  | undefined
  | boolean
  | number
  | string
  | SerializableValue[]
  | { [key: string]: SerializableValue };

// Media can be various types
type MediaType = 'image' | 'video' | 'audio' | 'json' | 'binary';

// Media status
type MediaStatus = 'pending' | 'loading' | 'loaded' | 'error';

// Editor tool types
type ToolType =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'
  | 'arrow'
  | 'star';

// Alignment options
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type VerticalAlign = 'top' | 'middle' | 'bottom';
```

### Optional with Unions

```typescript
// Function can accept multiple input types
function setColor(color: Color | string | null): void {
  if (color === null) {
    this.fillColor = null;
  } else if (typeof color === 'string') {
    this.fillColor = ColorUtils.fromCSS(color);
  } else {
    this.fillColor = color;
  }
}

// Usage:
setColor({ r: 255, g: 0, b: 0, a: 1 });  // Color object
setColor('#FF0000');                      // CSS string
setColor('red');                          // Named color
setColor(null);                           // Clear color
```

---

## Interface vs Type Usage

### When to Use Interface

```typescript
// Use interface for object shapes that may be extended
interface Actor {
  name: string;
  render(ctx: CanvasRenderingContext2D): void;
}

// Can be extended
interface VisualActor extends Actor {
  visible: boolean;
  opacity: number;
}

// Can be implemented by classes
class SK8Actor implements Actor {
  name: string = 'Actor';

  render(ctx: CanvasRenderingContext2D): void {
    // Implementation
  }
}
```

### When to Use Type

```typescript
// Use type for unions
type InputValue = string | number | boolean;

// Use type for complex mapped types
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Use type for intersections
type Positioned = { x: number; y: number };
type Sized = { width: number; height: number };
type BoundingBox = Positioned & Sized;

// Use type for function signatures
type EventHandler = (event: SK8Event) => void;
type Predicate<T> = (value: T) => boolean;
```

### Practical Examples

```typescript
// Interface for extensible object
interface ProjectMetadata {
  name: string;
  version: string;
  author?: string;
  created: string;
  modified: string;
  description?: string;
}

// Type for union of possible values
type AnimationState = 'idle' | 'running' | 'paused' | 'completed';

// Type for function type
type EasingFunction = (t: number) => number;

// Interface for class contracts
interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}
```

---

## Declaration Files

### Creating Declaration Files

**File: `sk8.d.ts`**

```typescript
declare module 'sk8-ts' {
  // Core exports
  export class SK8Object {
    constructor(parent?: SK8Object | null, name?: string);
    get(propertyName: string): any;
    set(propertyName: string, value: any): void;
    // ... more methods
  }

  export class SK8Actor extends SK8Object {
    constructor(parent?: SK8Actor, name?: string);
    render(ctx: CanvasRenderingContext2D): void;
    getBoundsRect(): Rect;
    // ... more methods
  }

  // Types
  export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }

  export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  // Functions
  export function createStage(canvas: HTMLCanvasElement | string): SK8Stage;
  export function evaluateScript(code: string): any;

  // Constants
  export const VERSION: string;
}
```

### Ambient Declarations

For global types:

```typescript
// globals.d.ts
declare global {
  interface Window {
    SK8: typeof import('sk8-ts');
  }

  namespace SK8 {
    type Actor = import('sk8-ts').SK8Actor;
    type Stage = import('sk8-ts').SK8Stage;
  }
}

export {};
```

---

## Advanced Patterns

### Conditional Types

```typescript
// Extract property type based on property name
type PropertyType<T, K extends keyof T> =
  T[K] extends number ? 'number' :
  T[K] extends string ? 'string' :
  T[K] extends boolean ? 'boolean' :
  'object';

// Usage:
interface MyActor {
  width: number;
  name: string;
  visible: boolean;
  color: Color;
}

type WidthType = PropertyType<MyActor, 'width'>;  // 'number'
type NameType = PropertyType<MyActor, 'name'>;    // 'string'
```

### Mapped Types

```typescript
// Make all properties optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Usage:
interface FullConfig {
  name: string;
  version: string;
  debug: boolean;
  maxSize: number;
}

type PartialConfig = Partial<FullConfig>;
// All properties optional

type ReadonlyConfig = Readonly<FullConfig>;
// All properties readonly

type MinimalConfig = Pick<FullConfig, 'name' | 'version'>;
// Only name and version
```

### Template Literal Types

```typescript
// Event names
type EventType = 'click' | 'mousedown' | 'mouseup' | 'mousemove';
type ListenerName<T extends string> = `on${Capitalize<T>}`;

type ClickListener = ListenerName<'click'>;  // 'onClick'
type MouseDownListener = ListenerName<'mousedown'>;  // 'onMousedown'

// Property names
type PropertyKey = 'fill' | 'frame' | 'shadow';
type ColorProperty = `${PropertyKey}Color`;

type FillColorProp = Extract<ColorProperty, 'fillColor'>;  // 'fillColor'
```

### Utility Types

```typescript
// Exclude null and undefined
type NonNullable<T> = T extends null | undefined ? never : T;

// Extract function return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

// Extract function parameters
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// Usage:
function add(a: number, b: number): number {
  return a + b;
}

type AddReturn = ReturnType<typeof add>;  // number
type AddParams = Parameters<typeof add>;  // [number, number]
```

### Branded Types

```typescript
// Create nominal types
type ActorID = string & { readonly __brand: 'ActorID' };
type StageID = string & { readonly __brand: 'StageID' };

function createActorID(id: string): ActorID {
  return id as ActorID;
}

function createStageID(id: string): StageID {
  return id as StageID;
}

// Type-safe usage
function getActor(id: ActorID): SK8Actor | undefined {
  // ...
}

const actorId = createActorID('actor_123');
const stageId = createStageID('stage_456');

getActor(actorId);   // ✓ Valid
// getActor(stageId);   // ✗ Error: Type mismatch
```

---

## Type Inference

### Automatic Inference

```typescript
// TypeScript infers return type
function getWidth(rect: Rect) {
  return rect.right - rect.left;  // Inferred as number
}

// TypeScript infers generic type
const list = new SK8List<number>();
list.add(42);
const doubled = list.map(x => x * 2);  // SK8List<number>

// TypeScript infers from usage
const actors = [new SK8Rectangle(), new SK8Circle()];
// Inferred as Array<SK8Rectangle | SK8Circle>
```

### Type Assertions

When you know better than TypeScript:

```typescript
// Type assertion
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// Alternative syntax (not in JSX)
const canvas = <HTMLCanvasElement>document.getElementById('canvas');

// Non-null assertion
const actor = stage.actorAtPoint(x, y)!;  // I know it's not null

// Const assertion
const colors = ['red', 'green', 'blue'] as const;
// Type: readonly ['red', 'green', 'blue']
```

---

## Best Practices

### 1. Prefer Interfaces for Public APIs

```typescript
// Good - extensible
export interface ProjectOptions {
  name: string;
  autoSave?: boolean;
}

// Can be extended by users
interface MyProjectOptions extends ProjectOptions {
  customField: string;
}
```

### 2. Use Union Types for Fixed Sets

```typescript
// Good - exhaustive
type ToolType = 'select' | 'rectangle' | 'circle';

function selectTool(tool: ToolType) {
  switch (tool) {
    case 'select':    // ...
    case 'rectangle': // ...
    case 'circle':    // ...
    // TypeScript ensures all cases covered
  }
}
```

### 3. Avoid `any`, Prefer `unknown`

```typescript
// Bad
function processData(data: any) {
  return data.value;  // No type checking
}

// Good
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    return (data as { value: any }).value;  // Explicit cast
  }
}
```

### 4. Use Readonly for Immutability

```typescript
// Good
interface Config {
  readonly version: string;
  readonly settings: Readonly<{ theme: string }>;
}

// Cannot modify
const config: Config = { version: '1.0', settings: { theme: 'dark' } };
// config.version = '2.0';  // ✗ Error
```

---

## TypeScript Configuration

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- SK8 API Reference: `/home/user/apple_sk8/API.md`
- SK8 Architecture: `/home/user/apple_sk8/ARCHITECTURE.md`
