# Blank SK8 Project Template

## Overview
Minimal starting point for SK8 projects. Just a canvas and basic structure.

## Structure
```
blank-project/
├── index.html          # Main HTML file with canvas
├── src/
│   └── main.ts         # Your TypeScript code (optional)
├── assets/             # Images, sounds, etc.
├── package.json        # Dependencies (if using npm)
└── README.md           # This file
```

## Getting Started

### Quick Start (No Build)
1. Open `index.html` in your browser
2. Start coding in the `<script>` tag
3. Refresh to see changes

### With TypeScript (Recommended)
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## What's Included
- HTML boilerplate
- Canvas element
- Basic styling
- Script section ready for SK8 code

## What's NOT Included
- SK8 library (add via npm or CDN)
- Build system (add webpack/vite if needed)
- Advanced features

## Next Steps
1. Import SK8 library
2. Create a stage
3. Add actors
4. Implement your app logic

## Example Usage
```typescript
import { SK8Stage, SK8Rectangle } from 'sk8-ts';

const stage = new SK8Stage('canvas');

const rect = new SK8Rectangle();
rect.setBoundsRect({ left: 100, top: 100, right: 300, bottom: 200 });
rect.setFillColor({ r: 100, g: 150, b: 255, a: 1 });

stage.addActor(rect);
stage.startRendering();
```

## Resources
- [SK8 Documentation](../../API.md)
- [Examples](../../examples-new/)
- [Contributing Guide](../../CONTRIBUTING.md)

## License
Same as SK8 project license
