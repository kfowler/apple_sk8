# Contributing to SK8 TypeScript

Thank you for your interest in contributing to SK8 TypeScript! This guide will help you get started.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Code Style Guide](#code-style-guide)
6. [How to Contribute](#how-to-contribute)
7. [Testing Strategy](#testing-strategy)
8. [Pull Request Process](#pull-request-process)
9. [Issue Labels](#issue-labels)

---

## Code of Conduct

Be respectful, inclusive, and professional. This is an educational project for preserving computing history.

---

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- TypeScript knowledge
- Understanding of Canvas 2D API
- Familiarity with prototype-based inheritance

### Clone and Install

```bash
git clone https://github.com/your-repo/apple_sk8.git
cd apple_sk8/typescript
npm install
```

### Build and Test

```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
npm test             # Run tests
npm run lint         # Check code style
```

---

## Development Setup

### Recommended Tools

- **Editor:** VS Code with TypeScript extension
- **Debugger:** Chrome DevTools or VS Code debugger
- **Git:** For version control

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Environment

The project uses:
- TypeScript 5.x
- ESLint for linting
- Jest for testing
- Canvas 2D API for rendering

---

## Project Structure

```
typescript/
├── src/
│   ├── core/               # Core object system
│   │   └── SK8Object.ts
│   ├── graphics/           # Graphics and actors
│   │   ├── SK8Actor.ts
│   │   ├── SK8Stage.ts
│   │   ├── shapes.ts
│   │   └── advanced-shapes.ts
│   ├── events/             # Event system
│   │   ├── SK8Event.ts
│   │   ├── event-dispatcher.ts
│   │   └── drag-drop.ts
│   ├── runtime/            # Animation and collections
│   │   ├── animation.ts
│   │   └── collections.ts
│   ├── sk8script/          # SK8Script language
│   │   ├── lexer/
│   │   ├── parser/
│   │   ├── evaluator/
│   │   └── stdlib/
│   ├── project/            # Project system
│   │   ├── project.ts
│   │   ├── serializer.ts
│   │   └── deserializer.ts
│   ├── media/              # Media management
│   │   ├── media-manager.ts
│   │   └── audio-utils.ts
│   ├── editor/             # Editor/IDE
│   │   ├── editor.ts
│   │   ├── property-inspector.ts
│   │   └── object-tree.ts
│   └── sk8.ts              # Main exports
├── tests/                  # Test files
├── examples/               # Example code
├── dist/                   # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Key Modules

- **core/**: SK8Object prototype system
- **graphics/**: Visual rendering (actors, stage, shapes)
- **events/**: Event handling and propagation
- **runtime/**: Animation and collections
- **sk8script/**: Scripting language implementation
- **project/**: Serialization and persistence
- **media/**: Asset management
- **editor/**: Visual IDE components

---

## Code Style Guide

### TypeScript Guidelines

#### Naming Conventions

```typescript
// Classes: PascalCase
class SK8Rectangle extends SK8Actor { }

// Interfaces/Types: PascalCase
interface PropertyDescriptor { }
type HandlerFunction = (...args: any[]) => any;

// Functions: camelCase
function calculateBounds(rect: Rect): number { }

// Variables: camelCase
const boundsRect = actor.getBoundsRect();

// Constants: UPPER_SNAKE_CASE (for true constants)
const MAX_STACK_SIZE = 1000;

// Private members: camelCase with private keyword
private eventListeners = new Map();
```

#### File Organization

```typescript
/**
 * File header comment
 * Describes the module's purpose
 */

// Imports (grouped)
import { SK8Object } from '../core/SK8Object.js';
import { Rect, Color } from './types.js';

// Type definitions
export interface MyInterface { }
export type MyType = string | number;

// Constants
const DEFAULT_VALUE = 100;

// Class definition
export class MyClass {
  // Private fields first
  private field1: number;

  // Public fields
  public field2: string;

  // Constructor
  constructor() { }

  // Public methods
  public method1(): void { }

  // Private methods
  private method2(): void { }
}

// Helper functions
function helperFunction(): void { }
```

#### Type Annotations

Always use explicit types for function parameters and return values:

```typescript
// Good
function add(a: number, b: number): number {
  return a + b;
}

// Bad
function add(a, b) {
  return a + b;
}
```

Use `any` sparingly, prefer `unknown` for truly unknown types:

```typescript
// Acceptable
function processData(data: unknown): ProcessedData {
  if (typeof data === 'object') {
    // Type guard narrows to object
  }
}

// Avoid
function processData(data: any): any {
  return data.something;
}
```

#### Error Handling

```typescript
// Use custom error classes
export class SK8Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SK8Error';
  }
}

// Throw specific errors
function loadAsset(url: string): MediaAsset {
  if (!url) {
    throw new SK8Error('URL is required');
  }
  // ...
}

// Handle errors appropriately
try {
  const asset = loadAsset(url);
} catch (error) {
  if (error instanceof SK8Error) {
    console.error('SK8 Error:', error.message);
  } else {
    throw error;  // Re-throw unexpected errors
  }
}
```

### Comments and Documentation

#### JSDoc Comments

Use JSDoc for all public APIs:

```typescript
/**
 * Calculate the area of a rectangle
 *
 * @param rect - The rectangle to measure
 * @returns The area in square pixels
 * @throws {SK8Error} If rectangle is invalid
 *
 * @example
 * ```typescript
 * const area = calculateArea({ left: 0, top: 0, right: 100, bottom: 50 });
 * // Returns: 5000
 * ```
 */
function calculateArea(rect: Rect): number {
  if (!isValidRect(rect)) {
    throw new SK8Error('Invalid rectangle');
  }
  return (rect.right - rect.left) * (rect.bottom - rect.top);
}
```

#### Inline Comments

Use inline comments for complex logic:

```typescript
// Calculate the eased progress using the easing function
// t is in range [0, 1]
const easedProgress = this.easing(progress);

// Interpolate between start and end values
// Formula: v = start + (end - start) * t'
const currentValue = anim.startValue +
                    (anim.endValue - anim.startValue) * easedProgress;
```

#### Comment Style

- Use `//` for single-line comments
- Use `/* */` for multi-line comments
- Use `/** */` for JSDoc documentation
- Explain *why*, not *what* (code should be self-explanatory)

### Formatting

Use Prettier with these settings (in `.prettierrc`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Best Practices

#### Immutability

Prefer immutable operations:

```typescript
// Good
const newBounds = { ...this.bounds };
newBounds.left = x;
return newBounds;

// Avoid
this.bounds.left = x;
return this.bounds;
```

#### Null Safety

Use optional chaining and nullish coalescing:

```typescript
// Good
const name = actor?.getName() ?? 'Unnamed';

// Avoid
const name = actor && actor.getName() ? actor.getName() : 'Unnamed';
```

#### Async/Await

Prefer async/await over promise chains:

```typescript
// Good
async function loadProject(): Promise<SK8Project> {
  const file = await selectFile();
  const text = await file.text();
  const data = JSON.parse(text);
  return deserializeProject(data);
}

// Avoid
function loadProject(): Promise<SK8Project> {
  return selectFile()
    .then(file => file.text())
    .then(text => JSON.parse(text))
    .then(data => deserializeProject(data));
}
```

---

## How to Contribute

### Adding New Actors

1. Create a new file in `src/actors/`:

```typescript
// src/actors/MyActor.ts
import { SK8Actor } from '../graphics/SK8Actor.js';
import { Rect } from '../graphics/types.js';

export class SK8MyActor extends SK8Actor {
  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'MyActor');

    // Define custom properties
    this.defineProperty('myProperty', {
      value: 'default',
      metadata: {
        type: 'string',
        description: 'My custom property'
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();

    // Apply visual effects
    this.applyVisualEffects(ctx);

    // Draw your actor
    ctx.fillStyle = 'blue';
    ctx.fillRect(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    );

    // Clear visual effects
    this.clearVisualEffects(ctx);
  }
}
```

2. Export from `src/sk8.ts`:

```typescript
export { SK8MyActor } from './actors/MyActor.js';
```

3. Write tests in `tests/actors/MyActor.test.ts`

4. Update documentation in `API.md`

### Adding SK8Script Functions

1. Add to appropriate stdlib file (e.g., `src/sk8script/stdlib/math.ts`):

```typescript
export const mathFunctions: Record<string, BuiltInFunction> = {
  // ... existing functions

  /**
   * Calculate factorial
   * @param n - Number to calculate factorial of
   * @returns n!
   */
  factorial: (n: number): number => {
    if (!Number.isInteger(n) || n < 0) {
      throw new EvaluatorError('factorial requires non-negative integer');
    }
    if (n === 0 || n === 1) return 1;
    return n * mathFunctions.factorial(n - 1);
  },
};
```

2. Register with metadata in `src/sk8script/stdlib/index.ts`:

```typescript
registerFunction('factorial', mathFunctions.factorial, {
  category: 'math',
  description: 'Calculate factorial of a number',
  params: [
    { name: 'n', type: 'number', description: 'Non-negative integer' }
  ],
  returns: 'number',
  examples: [
    'factorial(5)  -- Returns 120',
    'factorial(0)  -- Returns 1'
  ]
});
```

3. Write tests

4. Update documentation

### Implementing Custom Shapes

See `EXTENDING.md` for detailed guide on creating custom shapes and actors.

---

## Testing Strategy

### Unit Tests

Use Jest for unit testing:

```typescript
// tests/core/SK8Object.test.ts
import { SK8Object } from '../../src/core/SK8Object';

describe('SK8Object', () => {
  describe('property system', () => {
    it('should get and set properties', () => {
      const obj = new SK8Object();
      obj.set('name', 'Test');
      expect(obj.get('name')).toBe('Test');
    });

    it('should walk prototype chain', () => {
      const parent = new SK8Object();
      parent.set('color', 'red');

      const child = new SK8Object(parent);
      expect(child.get('color')).toBe('red');
    });
  });
});
```

### Integration Tests

Test interactions between components:

```typescript
// tests/integration/rendering.test.ts
import { SK8Stage, SK8Rectangle } from '../../src/sk8';

describe('Rendering Integration', () => {
  let canvas: HTMLCanvasElement;
  let stage: SK8Stage;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    stage = new SK8Stage(canvas);
  });

  it('should render rectangle on stage', () => {
    const rect = new SK8Rectangle();
    rect.setBoundsRect({ left: 50, top: 50, right: 150, bottom: 100 });

    stage.addActor(rect);
    stage.render();

    // Check that canvas was modified
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(100, 75, 1, 1);
    expect(imageData.data[3]).toBeGreaterThan(0);  // Alpha > 0
  });
});
```

### Test Coverage

Aim for:
- 80%+ code coverage
- 100% coverage for core systems (SK8Object, property system)
- Critical path testing for all features

Run coverage report:

```bash
npm run test:coverage
```

### Manual Testing

For visual features, create demo pages in `demo/`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Feature Demo</title>
  <script src="../dist/sk8.umd.js"></script>
</head>
<body>
  <canvas id="canvas" width="800" height="600"></canvas>
  <script>
    const stage = new SK8.SK8Stage('canvas');
    // ... test your feature
    stage.startRendering();
  </script>
</body>
</html>
```

---

## Pull Request Process

### Before Submitting

1. **Create an issue** describing the feature/bug
2. **Fork the repository** and create a branch
3. **Write code** following style guide
4. **Add tests** for your changes
5. **Update documentation** (API.md, README.md, etc.)
6. **Run checks**:
   ```bash
   npm run lint     # Check code style
   npm test         # Run tests
   npm run build    # Ensure it builds
   ```

### Branch Naming

```
feature/actor-new-shape
bugfix/property-validation
docs/api-reference-update
refactor/animation-system
```

### Commit Messages

Follow conventional commits:

```
feat: Add SK8Star actor for star shapes
fix: Correct property inheritance in SK8Object
docs: Update API documentation for SK8Script
refactor: Simplify animation loop logic
test: Add unit tests for event system
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests pass locally

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** run (lint, test, build)
2. **Code review** by maintainer
3. **Feedback addressed** (if any)
4. **Approval and merge**

---

## Issue Labels

### Type Labels

- `bug` - Something isn't working
- `feature` - New feature or enhancement
- `documentation` - Documentation improvements
- `refactor` - Code refactoring
- `performance` - Performance optimization

### Priority Labels

- `critical` - Critical bug or blocker
- `high` - High priority
- `medium` - Medium priority
- `low` - Low priority

### Status Labels

- `needs-triage` - Needs initial review
- `in-progress` - Someone is working on it
- `blocked` - Blocked by something
- `ready-for-review` - Ready for code review

### Component Labels

- `core` - Core object system
- `graphics` - Graphics and rendering
- `events` - Event system
- `animation` - Animation system
- `sk8script` - SK8Script language
- `project` - Project system
- `media` - Media management
- `editor` - Editor/IDE

---

## Development Workflow

### Typical Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run lint
npm test
npm run build

# 4. Commit changes
git add .
git commit -m "feat: Add my feature"

# 5. Push and create PR
git push origin feature/my-feature
# ... create PR on GitHub ...

# 6. Address review comments
# ... make changes ...
git commit -m "fix: Address review comments"
git push
```

### Keeping Up to Date

```bash
# Sync with main branch
git checkout main
git pull origin main

# Rebase your feature branch
git checkout feature/my-feature
git rebase main
```

---

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Original SK8 Documentation](../sk8_docs/)

## Questions?

- Open an issue for questions
- Check existing documentation
- Ask in pull request discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to SK8 TypeScript!
