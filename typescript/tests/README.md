# SK8 TypeScript Test Suite

Comprehensive testing documentation for the SK8 TypeScript project.

## Overview

The SK8 test suite provides extensive coverage across multiple testing levels:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between subsystems
- **E2E Tests**: Test complete user workflows (planned)
- **Performance Tests**: Benchmark and performance monitoring
- **Visual Tests**: Visual regression testing (planned)
- **Stress Tests**: Load and stress testing (planned)

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test -- actors.test.ts
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="SK8Script"
```

## Test Organization

```
tests/
├── setup.ts                    # Jest setup and polyfills
├── *.test.ts                   # Unit tests (13 files, 500+ tests)
├── coverage-gaps.test.ts       # Edge case coverage
├── utils/                      # Test utilities
│   ├── test-helpers.ts         # Common test helpers
│   ├── test-assets.ts          # Mock assets
│   └── performance-utils.ts    # Performance testing tools
├── integration/                # Integration tests
│   ├── editor-integration.test.ts
│   ├── animation-integration.test.ts
│   ├── project-integration.test.ts
│   └── sk8script-integration.test.ts
├── e2e/                        # End-to-end tests (planned)
│   ├── basic-workflow.test.ts
│   ├── animation-workflow.test.ts
│   ├── media-workflow.test.ts
│   └── script-workflow.test.ts
├── performance/                # Performance benchmarks
│   ├── rendering.bench.ts
│   ├── animation.bench.ts      # (planned)
│   └── sk8script.bench.ts      # (planned)
├── visual/                     # Visual regression tests (planned)
│   ├── shapes.visual.ts
│   └── ui-components.visual.ts
└── stress/                     # Stress tests (planned)
    ├── memory-leak.test.ts
    └── large-projects.test.ts
```

## Test File Descriptions

### Unit Tests

| File | Tests | Description |
|------|-------|-------------|
| `sk8.test.ts` | 15 | Core SK8 system initialization |
| `object-system.test.ts` | 35 | SK8Object property system |
| `graphics.test.ts` | 28 | Graphics primitives and rendering |
| `shapes-extended.test.ts` | 42 | Extended shape types |
| `actors.test.ts` | 55 | Actor system and UI components |
| `events.test.ts` | 48 | Event system and handlers |
| `project.test.ts` | 52 | Project save/load functionality |
| `media.test.ts` | 38 | Media handling (images, video, audio) |
| `sk8script.test.ts` | 68 | SK8Script lexer, parser, evaluator |
| `sk8script-functions.test.ts` | 45 | User-defined functions |
| `sk8script-control-flow.test.ts` | 52 | Control flow (if/while/for) |
| `sk8script-stdlib.test.ts` | 78 | Standard library functions |
| `editor.test.ts` | 62 | Visual editor components |
| **Total** | **618** | |

### Integration Tests

| File | Tests | Description |
|------|-------|-------------|
| `editor-integration.test.ts` | 50+ | Editor ↔ PropertyInspector ↔ ObjectTree ↔ Canvas |
| `animation-integration.test.ts` | 45+ | Timeline ↔ Actors ↔ Stage ↔ Rendering |
| `project-integration.test.ts` | 40+ | Save/Load across all subsystems |
| `sk8script-integration.test.ts` | 45+ | Scripts ↔ Actors ↔ Events ↔ Runtime |

### Coverage Tests

- `coverage-gaps.test.ts`: Edge cases, error paths, boundary conditions

### Performance Tests

- `rendering.bench.ts`: Rendering performance benchmarks
- Tests rendering at different actor counts
- Measures FPS with various optimizations
- Validates 60fps threshold

## Test Utilities

### Test Helpers (`test-helpers.ts`)

```typescript
import { createMockCanvas, createTestActor, simulateMouseEvent } from './utils/test-helpers';

// Create test canvas
const canvas = createMockCanvas(800, 600);

// Create test actor with defaults
const actor = createTestActor({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fillColor: '#ff0000'
});

// Simulate events
simulateMouseEvent(canvas, 'click', { clientX: 100, clientY: 100 });
```

### Test Assets (`test-assets.ts`)

```typescript
import { TEST_IMAGES, createMockImage, createMockProjectFile } from './utils/test-assets';

// Use pre-made test images
const img = TEST_IMAGES.red;

// Create custom mock assets
const customImg = createMockImage(640, 480);
const projectFile = createMockProjectFile(projectData);
```

### Performance Utils (`performance-utils.ts`)

```typescript
import { benchmark, FPSMeter, performanceAssert } from './utils/performance-utils';

// Benchmark a function
const result = await benchmark('My operation', () => {
  // Code to benchmark
}, { iterations: 1000 });

// Measure FPS
const fpsMeter = new FPSMeter();
fpsMeter.start();
// ... render loop ...
const report = fpsMeter.getReport();

// Performance assertions
await performanceAssert.completesWithin(() => {
  // Code that should complete quickly
}, 100); // max 100ms
```

## Coverage Requirements

### Global Thresholds

The project enforces minimum coverage thresholds:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Per-File Coverage

Run with `--coverage` to see detailed per-file coverage:

```bash
npm run test:coverage
```

View the HTML report:

```bash
open coverage/lcov-report/index.html
```

## Writing New Tests

### Unit Test Template

```typescript
import { MyClass } from '../src/my-module';

describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('myMethod', () => {
    it('should do the expected thing', () => {
      const result = instance.myMethod('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      expect(() => instance.myMethod(null)).toThrow();
    });
  });
});
```

### Integration Test Template

```typescript
import { SystemA } from '../src/system-a';
import { SystemB } from '../src/system-b';

describe('SystemA and SystemB Integration', () => {
  let systemA: SystemA;
  let systemB: SystemB;

  beforeEach(() => {
    systemA = new SystemA();
    systemB = new SystemB();
    // Connect systems
    systemA.connect(systemB);
  });

  it('should synchronize when SystemA changes', () => {
    systemA.setValue(42);
    expect(systemB.getValue()).toBe(42);
  });
});
```

### Performance Test Template

```typescript
import { benchmark } from './utils/performance-utils';

it('should perform operation efficiently', async () => {
  const result = await benchmark('My operation', () => {
    // Code to benchmark
  }, {
    iterations: 1000,
    trackMemory: true
  });

  expect(result.averageTime).toBeLessThan(10); // < 10ms
  console.log(`Performance: ${result.opsPerSecond.toFixed(0)} ops/sec`);
});
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to create fresh instances
- Clean up in `afterEach`

### 2. Descriptive Names

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should update canvas when actor position changes', () => { ... });
```

### 3. Arrange-Act-Assert

```typescript
it('should calculate area correctly', () => {
  // Arrange
  const rect = new Rectangle();
  rect.setBounds({ left: 0, top: 0, width: 100, height: 50 });

  // Act
  const area = rect.getArea();

  // Assert
  expect(area).toBe(5000);
});
```

### 4. Edge Cases

Always test:
- Null/undefined inputs
- Empty collections
- Boundary values (0, -1, max)
- Invalid inputs
- Error conditions

### 5. Async Testing

```typescript
it('should load project asynchronously', async () => {
  const project = new Project();
  await project.load(projectData);
  expect(project.isLoaded()).toBe(true);
});
```

### 6. Mocking

```typescript
it('should call external service', () => {
  const mockService = {
    fetch: jest.fn().mockResolvedValue({ data: 'test' })
  };

  const result = await myFunction(mockService);

  expect(mockService.fetch).toHaveBeenCalledWith('/api/data');
  expect(result).toEqual({ data: 'test' });
});
```

## Continuous Integration

Tests run automatically on:
- Every commit (via pre-commit hook)
- Pull requests
- Main branch pushes

### CI Requirements

All tests must pass before merging:
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Coverage >= 80%
- ✅ No TypeScript errors
- ✅ Linting passes

## Performance Benchmarks

Performance tests establish baseline metrics:

| Benchmark | Target | Current |
|-----------|--------|---------|
| Render 100 actors | > 60 FPS | TBD |
| Render 500 actors | > 30 FPS | TBD |
| Parse 1000-line script | < 100ms | TBD |
| Save/load 100 actors | < 1s | TBD |
| 50 simultaneous animations | > 30 FPS | TBD |

Run performance tests:
```bash
npm test -- performance/
```

## Visual Regression Testing (Planned)

Visual tests will capture screenshots and compare against baselines:

```bash
npm run test:visual
npm run test:visual:update  # Update baselines
```

## Stress Testing (Planned)

Stress tests verify system stability:

- Memory leak detection
- Large project handling (1000+ actors)
- Concurrent operations
- Long-running sessions

```bash
npm test -- stress/
```

## Troubleshooting

### Tests Failing Locally

1. Clear coverage cache:
   ```bash
   rm -rf coverage
   ```

2. Clear Jest cache:
   ```bash
   npm test -- --clearCache
   ```

3. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### DOMMatrix Errors

If you see "DOMMatrix is not defined", ensure:
- `tests/setup.ts` is included in `jest.config.js`
- `setupFilesAfterEnv` is correctly configured

### Timeout Errors

Increase timeout for slow tests:
```typescript
it('slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

Or globally in `jest.config.js`:
```javascript
testTimeout: 10000
```

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure tests pass
3. Maintain coverage >= 80%
4. Add integration tests if multiple systems interact
5. Update this README if adding new test categories

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

## Test Statistics

Current test suite statistics:

- **Total Test Files**: 17+
- **Total Tests**: 700+
- **Code Coverage**: ~75% (target: 90%)
- **Test Execution Time**: ~20s
- **Integration Test Coverage**: 4 subsystems
- **Performance Benchmarks**: 5+ scenarios

---

**Last Updated**: 2025-11-20
**Maintained By**: SK8 TypeScript Team
