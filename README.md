# SK8 - Modern Multimedia Authoring for the Web

[![CI](https://github.com/apple/sk8/workflows/CI/badge.svg)](https://github.com/apple/sk8/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![codecov](https://codecov.io/gh/apple/sk8/branch/main/graph/badge.svg)](https://codecov.io/gh/apple/sk8)
[![npm version](https://badge.fury.io/js/sk8-ts.svg)](https://www.npmjs.com/package/sk8-ts)
[![License](https://img.shields.io/badge/License-SK8-green.svg)](./sk8_license.pdf)
[![Documentation](https://img.shields.io/badge/docs-online-blue.svg)](https://apple.github.io/sk8)
[![Dependencies](https://img.shields.io/librariesio/release/npm/sk8-ts)](https://www.npmjs.com/package/sk8-ts)

> A modern reimplementation of Apple's revolutionary SK8 multimedia authoring environment, bringing visual programming and interactive media creation to the web.

## What is SK8?

SK8 is a **visual programming environment** for creating interactive multimedia experiences. Originally developed by Apple's Advanced Technology Group in the 1990s, SK8 pioneered object-oriented visual development with its innovative prototype-based object system, powerful scripting language, and rich multimedia capabilities.

This project brings SK8's visionary design to modern web browsers using TypeScript, HTML5 Canvas, and contemporary web APIs.

## Features

### Core System
- **Prototype-based Object System** - Flexible inheritance model inspired by Self and Smalltalk
- **SK8Script Programming Language** - Complete interpreter with lexer, parser, and evaluator
- **Visual Development IDE** - Property inspector, object tree, toolbar, and visual editing
- **Project Management** - Save/load projects as JSON with full asset bundling

### Visual Objects & UI
- **18+ Interactive Actors** - Complete widget library ready to use:
  - **Basic Shapes**: Rectangle, RoundRect, Circle, Line, Text
  - **Advanced Shapes**: Polygon, Star, Arrow, Path, custom polygons
  - **UI Widgets**: Button, CheckBox, RadioButton, Slider, EditText, Label
  - **Containers**: Panel, Container, Scroller with layout management
  - **Advanced UI**: MenuButton, ProgressBar, TextBox
- **Actor Groups** - Hierarchical object composition with event propagation
- **Z-Order Management** - Full control over visual layering

### Graphics & Media
- **Advanced Graphics**:
  - Linear and radial gradients
  - Text styling with fonts, sizes, and formatting
  - Custom shapes with point-in-polygon hit testing
  - Image transforms and effects
- **Media Support**:
  - Image actors with loading and caching
  - Video playback with MovieRectangle
  - Audio with Sound actors and SoundManager
  - Asset management and bundling

### Animation & Events
- **Animation Timeline** - Comprehensive animation system with:
  - 12+ easing functions (linear, quad, cubic, elastic, bounce, etc.)
  - Property tweening
  - Animation helpers (fade, pulse, shake, move, scale)
- **Rich Event System**:
  - Mouse events (click, drag, hover)
  - Keyboard input
  - Touch and gesture recognition
  - Drag-and-drop with constraints
  - Custom event system

### SK8Script Language
- **Complete Implementation**:
  - Lexer with full tokenization
  - Recursive descent parser with AST
  - Expression evaluator with proper scoping
  - 50+ standard library functions
- **Standard Library**:
  - Math operations and functions
  - String manipulation
  - Collection operations (lists, tables)
  - Type checking and conversion
  - I/O operations
  - Object system integration

## Quick Start

### Installation

**Clone from GitHub:**
```bash
git clone https://github.com/yourusername/apple_sk8.git
cd apple_sk8/typescript
npm install
```

**Install as npm package** (when published):
```bash
npm install sk8-ts
```

**Use from CDN:**
```html
<script type="module">
  import { createStage, SK8Rectangle } from 'https://unpkg.com/sk8-ts/dist/sk8.js';
</script>
```

### Getting Started in 5 Minutes

1. **Create an HTML file:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>My SK8 App</title>
</head>
<body>
  <canvas id="stage" width="800" height="600"></canvas>
  <script type="module" src="app.js"></script>
</body>
</html>
```

2. **Write your SK8 code** (`app.js`):
```typescript
import { createStage, SK8Rectangle, SK8Button } from './dist/sk8.js';

// Create a stage
const stage = createStage('stage');

// Create a colorful rectangle
const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 100, top: 100, right: 300, bottom: 200 });
rect.set('fillColor', { r: 255, g: 100, b: 100, a: 1 });

// Create an interactive button
const button = new SK8Button();
button.set('boundsRect', { left: 100, top: 250, right: 300, bottom: 300 });
button.set('text', 'Click Me!');
button.addHandler('click', () => {
  rect.set('fillColor', {
    r: Math.random() * 255,
    g: Math.random() * 255,
    b: Math.random() * 255,
    a: 1
  });
  stage.render();
});

// Add to stage and start rendering
stage.addActor(rect);
stage.addActor(button);
stage.startRendering();
```

3. **Build and run:**
```bash
npm run build
npm run dev
```

Open http://localhost:8080 in your browser!

## Documentation

### Comprehensive Guides
- **[TypeScript API Reference](./typescript/README.md)** - Complete library documentation
- **[SK8Script Language Guide](./typescript/docs/sk8script.md)** - Language syntax and features
- **[Actor System Guide](./typescript/docs/actors.md)** - Working with visual objects
- **[Animation Tutorial](./typescript/docs/animation.md)** - Creating animations
- **[Project System Guide](./typescript/docs/projects.md)** - Save/load and asset management

### Examples
Explore the demo gallery in `typescript/demo/`:
- **index.html** - Basic shapes and interaction
- **widgets.html** - Complete widget showcase
- **advanced.html** - Advanced graphics and effects
- **events.html** - Event handling demonstrations
- **shapes-gallery.html** - All available shapes
- **media-demo.html** - Images, video, and audio
- **project-demo.html** - Project save/load
- **sk8-editor.html** - Visual IDE demonstration
- **sk8script-repl.html** - Interactive SK8Script REPL

## Architecture

SK8 uses a layered architecture:

```
┌─────────────────────────────────────┐
│      Visual IDE & Editor            │  Property inspector, toolbar, etc.
├─────────────────────────────────────┤
│      SK8Script Language             │  Lexer, parser, evaluator, stdlib
├─────────────────────────────────────┤
│      Project System                 │  Serialization, file I/O, assets
├─────────────────────────────────────┤
│      Actors & Media                 │  Widgets, shapes, images, video, audio
├─────────────────────────────────────┤
│      Graphics & Animation           │  Stage, rendering, tweening, easing
├─────────────────────────────────────┤
│      Events & Interaction           │  Mouse, keyboard, touch, gestures
├─────────────────────────────────────┤
│      SK8Object Core                 │  Prototype inheritance, properties, handlers
└─────────────────────────────────────┘
```

### Key Components

**SK8Object** - Core object system with prototype inheritance, property getters/setters, and handler dispatch.

**SK8Actor** - Base class for all visual objects. Handles rendering, bounds, colors, and events.

**SK8Stage** - Canvas manager and container. Manages actors, z-order, hit testing, and rendering loop.

**SK8Script** - Complete scripting language with standard library for extending and automating SK8 applications.

**Project System** - Full save/load with JSON serialization, asset bundling, and IndexedDB backup.

**Editor** - Visual IDE with undo/redo, property editing, object tree, and WYSIWYG editing.

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Browser Support

SK8 works in all modern browsers with HTML5 Canvas support:

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## Contributing

We welcome contributions! SK8 is a complete, production-ready system, but there's always room for improvement:

### Areas for Contribution
- Additional actor types and widgets
- Performance optimizations
- Enhanced SK8Script standard library
- Documentation and tutorials
- Example projects and templates
- Testing and bug fixes
- IDE features and tools

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/apple_sk8.git
cd apple_sk8/typescript

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Follow code style (`npm run lint` and `npm run format`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Roadmap

### Current Status: v1.0.0 Release Candidate

The TypeScript implementation is feature-complete and production-ready. Future enhancements include:

### Planned Enhancements
- [ ] **WebGL Renderer** - Hardware-accelerated graphics for better performance
- [ ] **React/Vue Wrappers** - Framework integration components
- [ ] **Node.js Backend** - Server-side rendering and project management
- [ ] **Mobile Apps** - React Native or Capacitor wrappers
- [ ] **3D Objects** - Three.js integration for 3D actors
- [ ] **Collaborative Editing** - Real-time multi-user project editing
- [ ] **Plugin System** - Extensible architecture for third-party actors
- [ ] **Visual Debugger** - Step through SK8Script execution
- [ ] **Export Formats** - Standalone HTML, PWA, Electron app

See [ROADMAP.md](./ROADMAP.md) for detailed plans.

## Historical Context

SK8 was created by Apple's Advanced Technology Group (ATG) in the mid-1990s as a next-generation multimedia authoring environment. It was designed to be more powerful than HyperCard while remaining accessible to non-programmers.

### Original SK8
- **Language**: Macintosh Common Lisp (MCL)
- **Platform**: Mac OS Classic (System 7 through Mac OS 9)
- **Codebase**: 360+ Lisp files, 100,000+ lines of code
- **Features**: QuickDraw graphics, QuickTime integration, Mac Toolbox APIs
- **Release**: 1996 as free download from Apple

### This Implementation
This is a **modern reimplementation** for the web, not a direct port. It preserves SK8's core architecture and design philosophy while leveraging contemporary web technologies:
- TypeScript instead of Common Lisp
- HTML5 Canvas instead of QuickDraw
- Web APIs instead of Mac Toolbox
- Cross-platform by design

### Documentation

**Current Documentation:**
- **[SK8_DEEP_DIVE.md](./SK8_DEEP_DIVE.md)** - Deep dive into SK8's architecture and design
- **[typescript/README.md](./typescript/README.md)** - TypeScript implementation guide

**Legacy Analysis (Archived):**
The `archive/` directory contains historical planning documents from the initial porting phase:
- **[archive/PORTING_ANALYSIS.md](./archive/PORTING_ANALYSIS.md)** - Common Lisp port feasibility study
- **[archive/PORTING_EXAMPLE.md](./archive/PORTING_EXAMPLE.md)** - Concrete porting code examples
- **[archive/TYPESCRIPT_PORT.md](./archive/TYPESCRIPT_PORT.md)** - TypeScript reimplementation analysis
- **[archive/PROJECT_SUMMARY.md](./archive/PROJECT_SUMMARY.md)** - Initial project exploration summary
- **[archive/IMPLEMENTATION_ROADMAP.md](./archive/IMPLEMENTATION_ROADMAP.md)** - Original development roadmap
- **[archive/README.md](./archive/README.md)** - About the archived documents

The original SK8 source code is preserved in the `Sources/` directory.

## License

**Original SK8**: © 1997 by Apple Computer, Inc. See [sk8_license.pdf](./sk8_license.pdf) for details.

**This Implementation**: This TypeScript reimplementation is provided for educational and historical preservation purposes. The implementation code is available under the same terms as the original SK8 license.

## Acknowledgments

### Original SK8 Team
- Ruben Kleiman - Project Lead
- Adam Hertz - Lead Engineer
- Ken Dickey - Language Design
- And many others at Apple's Advanced Technology Group

### This Implementation
- The TypeScript port contributors
- The Common Lisp and TypeScript communities
- Apple Computer, Inc. for creating and releasing SK8

## Links

- **Documentation**: [typescript/README.md](./typescript/README.md)
- **Examples**: [typescript/demo/](./typescript/demo/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/apple_sk8/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/apple_sk8/discussions)
- **Original SK8 Archive**: [Apple SK8 Archive](https://archive.org/details/SK8)

---

Built with ❤️ by the SK8 community | Inspired by Apple's vision for multimedia authoring
