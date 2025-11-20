# Extending SK8 TypeScript

Guide for extending SK8 with custom actors, properties, handlers, shapes, and plugins.

## Table of Contents

1. [Creating Custom Actors](#creating-custom-actors)
2. [Adding Properties and Handlers](#adding-properties-and-handlers)
3. [Implementing Custom Shapes](#implementing-custom-shapes)
4. [SK8Script Library Modules](#sk8script-library-modules)
5. [Editor Plugins](#editor-plugins)
6. [Custom Serializers](#custom-serializers)
7. [Render Backends](#render-backends)

---

## Creating Custom Actors

### Basic Custom Actor

```typescript
import { SK8Actor } from 'sk8-ts';

export class SK8CustomActor extends SK8Actor {
  private customData: string = '';

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'CustomActor');

    // Define custom properties
    this.defineProperty('customData', {
      getter: () => this.customData,
      setter: (value: string) => {
        this.customData = value;
        this.setNeedsDraw();
      },
      metadata: {
        type: 'string',
        description: 'Custom data property',
        category: 'Custom'
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();

    // Apply effects
    this.applyVisualEffects(ctx);

    // Your custom rendering
    ctx.fillStyle = 'purple';
    ctx.fillRect(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    );

    // Render text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.customData,
      (bounds.left + bounds.right) / 2,
      (bounds.top + bounds.bottom) / 2
    );

    this.clearVisualEffects(ctx);
  }
}
```

### Interactive Custom Actor

```typescript
export class SK8InteractiveActor extends SK8Actor {
  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor() {
    super(undefined, 'InteractiveActor');

    // Add event handlers
    this.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.setNeedsDraw();
    });

    this.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.setNeedsDraw();
    });

    this.addEventListener('mousedown', () => {
      this.isPressed = true;
      this.setNeedsDraw();
    });

    this.addEventListener('mouseup', () => {
      this.isPressed = false;
      this.setNeedsDraw();
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();

    // Change appearance based on state
    let color = 'blue';
    if (this.isPressed) {
      color = 'darkblue';
    } else if (this.isHovered) {
      color = 'lightblue';
    }

    this.applyVisualEffects(ctx);
    ctx.fillStyle = color;
    ctx.fillRect(bounds.left, bounds.top,
                bounds.right - bounds.left,
                bounds.bottom - bounds.top);
    this.clearVisualEffects(ctx);
  }
}
```

---

## Adding Properties and Handlers

### Custom Properties

```typescript
export class SK8PropertyActor extends SK8Actor {
  private _temperature: number = 20;
  private _unit: 'C' | 'F' = 'C';

  constructor() {
    super(undefined, 'PropertyActor');

    // Simple property
    this.defineProperty('temperature', {
      getter: () => this._temperature,
      setter: (value: number) => {
        this._temperature = value;
        this.setNeedsDraw();
      },
      validator: (value) => {
        if (typeof value !== 'number') {
          return 'Temperature must be a number';
        }
        if (value < -273.15) {
          return 'Temperature cannot be below absolute zero';
        }
        return true;
      },
      metadata: {
        type: 'number',
        description: 'Temperature value',
        min: -273.15,
        max: 10000
      }
    });

    // Computed property
    this.defineProperty('displayText', {
      computed: true,
      dependencies: ['temperature', 'unit'],
      getter: () => {
        return `${this._temperature}°${this._unit}`;
      },
      metadata: {
        type: 'string',
        description: 'Formatted temperature display',
        computed: true
      }
    });

    // Property with side effects
    this.defineProperty('unit', {
      getter: () => this._unit,
      setter: (value: 'C' | 'F') => {
        const oldUnit = this._unit;
        this._unit = value;

        // Convert temperature when unit changes
        if (oldUnit === 'C' && value === 'F') {
          this._temperature = (this._temperature * 9/5) + 32;
        } else if (oldUnit === 'F' && value === 'C') {
          this._temperature = (this._temperature - 32) * 5/9;
        }

        this.setNeedsDraw();
      }
    });
  }
}
```

### Custom Handlers

```typescript
export class SK8HandlerActor extends SK8Actor {
  constructor() {
    super(undefined, 'HandlerActor');

    // Add custom handler
    this.addHandler('rotate90', function() {
      const currentRotation = this.getRotation();
      this.rotate(currentRotation + 90);
    });

    // Handler with parameters
    this.addHandler('pulse', function(scale: number = 1.2, duration: number = 300) {
      AnimationHelpers.pulse(this, scale, duration);
    });

    // Handler that returns a value
    this.addHandler('getInfo', function() {
      return {
        name: this.getName(),
        bounds: this.getBoundsRect(),
        visible: this.getVisible()
      };
    });
  }
}

// Usage:
const actor = new SK8HandlerActor();
actor.callHandler('rotate90');
actor.callHandler('pulse', 1.5, 500);
const info = actor.callHandler('getInfo');
```

---

## Implementing Custom Shapes

### Custom Polygon Shape

```typescript
export class SK8Star extends SK8Actor {
  private points: number = 5;
  private innerRadius: number = 0.5;

  constructor() {
    super(undefined, 'Star');

    this.defineProperty('points', {
      getter: () => this.points,
      setter: (value: number) => {
        this.points = Math.max(3, Math.floor(value));
        this.setNeedsDraw();
      }
    });

    this.defineProperty('innerRadius', {
      getter: () => this.innerRadius,
      setter: (value: number) => {
        this.innerRadius = Math.max(0, Math.min(1, value));
        this.setNeedsDraw();
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    const outerRadius = Math.min(bounds.right - bounds.left,
                                  bounds.bottom - bounds.top) / 2;
    const innerRad = outerRadius * this.innerRadius;

    this.applyVisualEffects(ctx);

    ctx.beginPath();

    for (let i = 0; i < this.points * 2; i++) {
      const angle = (i * Math.PI) / this.points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRad;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    this.drawFill(ctx);
    this.drawFrame(ctx);
    this.clearVisualEffects(ctx);
  }

  containsPoint(x: number, y: number): boolean {
    // Implement point-in-polygon test
    const bounds = this.getBoundsRect();
    // ... implementation
    return super.containsPoint(x, y);
  }
}
```

---

## SK8Script Library Modules

### Creating Custom Functions

```typescript
// src/sk8script/stdlib/custom.ts

import { BuiltInFunction, EvaluatorError } from '../evaluator/evaluator.js';

export const customFunctions: Record<string, BuiltInFunction> = {
  /**
   * Calculate distance between two points
   */
  distance: (x1: number, y1: number, x2: number, y2: number): number => {
    if (typeof x1 !== 'number' || typeof y1 !== 'number' ||
        typeof x2 !== 'number' || typeof y2 !== 'number') {
      throw new EvaluatorError('distance requires four numbers');
    }
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  /**
   * Clamp value between min and max
   */
  clamp: (value: number, min: number, max: number): number => {
    if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
      throw new EvaluatorError('clamp requires three numbers');
    }
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Linear interpolation
   */
  lerp: (start: number, end: number, t: number): number => {
    if (typeof start !== 'number' || typeof end !== 'number' || typeof t !== 'number') {
      throw new EvaluatorError('lerp requires three numbers');
    }
    return start + (end - start) * t;
  },
};
```

### Register Custom Functions

```typescript
// src/sk8script/stdlib/index.ts

import { customFunctions } from './custom.js';

export const allStdLibFunctions = {
  ...mathFunctions,
  ...stringFunctions,
  ...customFunctions,  // Add your custom functions
};

// Register with metadata
export function registerCustomFunctions(registry: StdLibRegistry) {
  registry.register('distance', customFunctions.distance, {
    category: 'geometry',
    description: 'Calculate distance between two points',
    params: [
      { name: 'x1', type: 'number' },
      { name: 'y1', type: 'number' },
      { name: 'x2', type: 'number' },
      { name: 'y2', type: 'number' },
    ],
    returns: 'number',
    examples: ['distance(0, 0, 3, 4)  -- Returns 5']
  });
}
```

---

## Editor Plugins

### Custom Editor Tool

```typescript
import { EditorTool, SK8Editor } from 'sk8-ts';

export const MyCustomTool: EditorTool = {
  type: 'custom',
  name: 'Custom Tool',
  cursor: 'crosshair',
  hotkey: 'M',

  onActivate(editor: SK8Editor) {
    console.log('Custom tool activated');
  },

  onDeactivate(editor: SK8Editor) {
    console.log('Custom tool deactivated');
  },

  onMouseDown(editor: SK8Editor, x: number, y: number) {
    // Create custom actor at click position
    const actor = new SK8CustomActor();
    actor.setBoundsRect({
      left: x - 50,
      top: y - 50,
      right: x + 50,
      bottom: y + 50
    });

    const command = new AddActorCommand(editor.getStage(), actor);
    editor.executeCommand(command);
  },

  onMouseMove(editor: SK8Editor, x: number, y: number) {
    // Update preview during drag
  },

  onMouseUp(editor: SK8Editor, x: number, y: number) {
    // Finalize creation
  }
};

// Register tool
editor.registerTool(MyCustomTool);
```

### Custom Property Inspector

```typescript
export class CustomPropertyInspector {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  show(actor: SK8Actor): void {
    this.container.innerHTML = '';

    // Custom UI for specific actor type
    if (actor instanceof SK8Star) {
      this.showStarProperties(actor);
    } else {
      this.showDefaultProperties(actor);
    }
  }

  private showStarProperties(star: SK8Star): void {
    const pointsSlider = document.createElement('input');
    pointsSlider.type = 'range';
    pointsSlider.min = '3';
    pointsSlider.max = '12';
    pointsSlider.value = String(star.get('points'));

    pointsSlider.addEventListener('input', () => {
      star.set('points', parseInt(pointsSlider.value));
    });

    this.container.appendChild(this.createLabel('Points'));
    this.container.appendChild(pointsSlider);
  }
}
```

---

## Custom Serializers

### Register Custom Actor Serialization

```typescript
import { registerActorClass } from 'sk8-ts';

// Register for deserialization
registerActorClass('SK8CustomActor', SK8CustomActor);

// Custom serialization logic (if needed)
export function serializeCustomActor(actor: SK8CustomActor): any {
  return {
    ...serializeStandardActor(actor),
    customData: actor.get('customData'),
    // ... more custom properties
  };
}

export function deserializeCustomActor(data: any): SK8CustomActor {
  const actor = new SK8CustomActor();
  deserializeStandardProperties(actor, data);
  actor.set('customData', data.customData);
  return actor;
}
```

---

## Render Backends

### Custom Renderer (Advanced)

```typescript
export interface RenderBackend {
  initialize(canvas: HTMLCanvasElement): void;
  clear(color: Color): void;
  renderActor(actor: SK8Actor): void;
  finalize(): void;
}

export class WebGLBackend implements RenderBackend {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;

  initialize(canvas: HTMLCanvasElement): void {
    this.gl = canvas.getContext('webgl')!;
    this.program = this.createShaderProgram();
  }

  clear(color: Color): void {
    this.gl.clearColor(color.r / 255, color.g / 255, color.b / 255, color.a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  renderActor(actor: SK8Actor): void {
    // Convert actor to WebGL geometry
    const geometry = this.actorToGeometry(actor);
    this.drawGeometry(geometry);
  }

  finalize(): void {
    this.gl.flush();
  }

  private createShaderProgram(): WebGLProgram {
    // ... WebGL shader setup
    return program;
  }
}

// Use custom backend
class CustomStage extends SK8Stage {
  private backend: RenderBackend;

  constructor(canvas: HTMLCanvasElement, backend: RenderBackend) {
    super(canvas);
    this.backend = backend;
    this.backend.initialize(canvas);
  }

  render(): void {
    this.backend.clear(this.getBackgroundColor());

    for (const actor of this.getActors()) {
      if (actor.getVisible()) {
        this.backend.renderActor(actor);
      }
    }

    this.backend.finalize();
  }
}
```

---

## Example: Complete Custom Extension

Here's a complete example of a custom gauge actor:

```typescript
import { SK8Actor, Color, ColorUtils, AnimationHelpers } from 'sk8-ts';

export class SK8Gauge extends SK8Actor {
  private value: number = 0;
  private minValue: number = 0;
  private maxValue: number = 100;
  private needleColor: Color = ColorUtils.Black;

  constructor() {
    super(undefined, 'Gauge');

    this.defineProperty('value', {
      getter: () => this.value,
      setter: (val: number) => {
        this.value = Math.max(this.minValue, Math.min(this.maxValue, val));
        this.setNeedsDraw();
      },
      validator: (val) => typeof val === 'number',
      metadata: {
        type: 'number',
        description: 'Current gauge value',
        category: 'Value'
      }
    });

    this.defineProperty('minValue', {
      getter: () => this.minValue,
      setter: (val: number) => {
        this.minValue = val;
        this.setNeedsDraw();
      }
    });

    this.defineProperty('maxValue', {
      getter: () => this.maxValue,
      setter: (val: number) => {
        this.maxValue = val;
        this.setNeedsDraw();
      }
    });

    // Computed property
    this.defineProperty('percentage', {
      computed: true,
      dependencies: ['value', 'minValue', 'maxValue'],
      getter: () => {
        const range = this.maxValue - this.minValue;
        return range === 0 ? 0 : (this.value - this.minValue) / range;
      }
    });

    // Custom handler
    this.addHandler('animateToValue', function(targetValue: number, duration: number = 1000) {
      animations.animate(this, 'value', targetValue, duration, {
        easing: Easing.easeInOutQuad
      });
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    const radius = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) / 2 - 10;

    this.applyVisualEffects(ctx);

    // Draw gauge arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ddd';
    ctx.stroke();

    // Draw value arc
    const percentage = this.get('percentage') as number;
    const angle = Math.PI + (percentage * Math.PI);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, angle);
    ctx.strokeStyle = ColorUtils.toCSS(this.getFillColor() || ColorUtils.Blue);
    ctx.stroke();

    // Draw needle
    const needleLength = radius - 5;
    const needleX = centerX + Math.cos(angle) * needleLength;
    const needleY = centerY + Math.sin(angle) * needleLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = ColorUtils.toCSS(this.needleColor);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = ColorUtils.toCSS(this.needleColor);
    ctx.fill();

    // Draw value text
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(
      this.value.toFixed(1),
      centerX,
      centerY + radius / 2
    );

    this.clearVisualEffects(ctx);
  }
}

// Register for serialization
registerActorClass('SK8Gauge', SK8Gauge);

// Usage:
const gauge = new SK8Gauge();
gauge.set('minValue', 0);
gauge.set('maxValue', 100);
gauge.set('value', 50);
gauge.callHandler('animateToValue', 75, 1000);
```

---

## Best Practices

1. **Always call `setNeedsDraw()`** when properties change
2. **Apply and clear visual effects** in render methods
3. **Validate property values** to prevent invalid states
4. **Use metadata** for editor integration
5. **Register custom classes** for serialization
6. **Document your APIs** with JSDoc comments
7. **Test custom actors** thoroughly
8. **Follow naming conventions** (SK8Prefix for actors)

## Resources

- See `ARCHITECTURE.md` for system internals
- See `API.md` for complete API reference
- See `CONTRIBUTING.md` for contribution guidelines
