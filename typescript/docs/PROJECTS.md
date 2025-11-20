# Project Management Guide

Complete guide to creating, saving, loading, and managing SK8 projects.

## Table of Contents

- [Creating Projects](#creating-projects)
- [Saving and Loading](#saving-and-loading)
- [Project Structure](#project-structure)
- [Collaboration](#collaboration)
- [Deployment](#deployment)

---

## Creating Projects

### Creating a New Project

```javascript
import { SK8Project } from './dist/sk8.js';

// Create new project
const project = new SK8Project('My Application', '1.0.0');

// Set metadata
project.setMetadata('description', 'An interactive SK8 application');
project.setMetadata('author', 'Your Name');

console.log(project.toString());
// Output: SK8Project "My Application" v1.0.0 (0 stages, 0 actors)
```

### Adding Stages and Actors

```javascript
// Create a stage
const stage = new SK8Stage('canvas');
stage.set('width', 800);
stage.set('height', 600);

// Add stage to project
project.addStage('mainStage', stage, 'Main Stage');

// Create actors
const rect = new SK8Rectangle();
rect.set('boundsRect', { left: 100, top: 100, right: 300, bottom: 200 });
rect.set('fillColor', 'blue');

const circle = new SK8Circle();
circle.set('boundsRect', { left: 400, top: 100, right: 600, bottom: 300 });
circle.set('fillColor', 'red');

// Add to stage
stage.addActor(rect);
stage.addActor(circle);

// Actors are automatically registered in project
console.log(project.getStats());
// Output: { stageCount: 1, actorCount: 2, assetCount: 0, scriptCount: 0 }
```

### Project Settings

```javascript
// Get metadata
const metadata = project.getMetadata();
console.log(metadata.name);        // "My Application"
console.log(metadata.version);     // "1.0.0"
console.log(metadata.created);     // ISO timestamp
console.log(metadata.modified);    // ISO timestamp

// Update metadata
project.setName('Awesome App');
project.setVersion('1.1.0');
project.setMetadata('author', 'Your Name');
project.setMetadata('license', 'MIT');
project.setMetadata('tags', ['game', 'interactive', 'sk8']);
```

---

## Saving and Loading

### SK8JSON Format

SK8 projects are saved in JSON format (`.sk8json`):

```json
{
  "metadata": {
    "name": "My Application",
    "version": "1.0.0",
    "author": "Your Name",
    "created": "2025-01-15T10:30:00.000Z",
    "modified": "2025-01-15T14:20:00.000Z",
    "sk8Version": "0.4.0"
  },
  "stages": [
    {
      "id": "mainStage",
      "name": "Main Stage",
      "width": 800,
      "height": 600,
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1.0 },
      "actors": ["rect1", "circle1"]
    }
  ],
  "actors": {
    "rect1": {
      "type": "SK8Rectangle",
      "name": "Rectangle 1",
      "properties": {
        "left": 100,
        "top": 100,
        "width": 200,
        "height": 100,
        "fillColor": { "r": 0, "g": 0, "b": 255, "a": 1.0 }
      }
    }
  },
  "assets": [],
  "scripts": []
}
```

### Saving a Project

```javascript
import { ProjectSerializer } from './dist/sk8.js';

// Serialize project to JSON
const serializer = new ProjectSerializer();
const json = serializer.serialize(project);

// Save to file (browser)
function saveProjectToFile(project, filename) {
    const json = serializer.serialize(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${project.getName()}.sk8json`;
    link.click();

    URL.revokeObjectURL(url);
}

saveProjectToFile(project, 'my-app.sk8json');

// Save to localStorage
function saveToLocalStorage(project, key) {
    const json = serializer.serialize(project);
    localStorage.setItem(key, json);
}

saveToLocalStorage(project, 'sk8-project');
```

### Loading a Project

```javascript
import { ProjectDeserializer } from './dist/sk8.js';

// Load from JSON string
const deserializer = new ProjectDeserializer();
const loadedProject = deserializer.deserialize(jsonString);

// Load from file (browser)
function loadProjectFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const json = e.target.result;
                const project = deserializer.deserialize(json);
                resolve(project);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// Use file input
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.sk8json';
fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    const project = await loadProjectFromFile(file);
    console.log('Loaded:', project.getName());

    // Recreate stages
    const stageIds = project.getStageIds();
    stageIds.forEach(id => {
        const stageDef = project.getStage(id);
        // Reconstruct stage from definition
        recreateStage(stageDef);
    });
};

// Load from localStorage
function loadFromLocalStorage(key) {
    const json = localStorage.getItem(key);
    if (json) {
        return deserializer.deserialize(json);
    }
    return null;
}

const savedProject = loadFromLocalStorage('sk8-project');
```

### Auto-Save Feature

```javascript
// Auto-save every 5 minutes
class AutoSaver {
    constructor(project, interval = 300000) {
        this.project = project;
        this.interval = interval;
        this.timer = null;
    }

    start() {
        this.timer = setInterval(() => {
            if (this.project.isDirtyState()) {
                this.save();
            }
        }, this.interval);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    save() {
        const serializer = new ProjectSerializer();
        const json = serializer.serialize(this.project);

        // Save to localStorage
        localStorage.setItem('sk8-autosave', json);
        localStorage.setItem('sk8-autosave-time', new Date().toISOString());

        this.project.markClean();
        console.log('Auto-saved at', new Date().toLocaleTimeString());
    }
}

// Use it
const autoSaver = new AutoSaver(project, 60000);  // Every minute
autoSaver.start();
```

---

## Project Structure

### Directory Layout

Recommended project structure:

```
my-sk8-project/
├── project.sk8json         # Main project file
├── assets/                 # Media assets
│   ├── images/
│   │   ├── logo.png
│   │   └── background.jpg
│   ├── audio/
│   │   ├── music.mp3
│   │   └── sfx/
│   │       ├── click.wav
│   │       └── beep.wav
│   └── videos/
│       └── intro.mp4
├── scripts/                # SK8Script files
│   ├── main.sk8script
│   ├── utils.sk8script
│   └── handlers.sk8script
├── styles/                 # Style definitions
│   └── themes.json
└── README.md              # Project documentation
```

### Asset Organization

Best practices for organizing assets:

```javascript
// Asset manifest
const assetManifest = {
    images: {
        ui: {
            logo: 'assets/images/logo.png',
            button: 'assets/images/button.png',
            icon: 'assets/images/icon.png'
        },
        game: {
            player: 'assets/images/player.png',
            enemy: 'assets/images/enemy.png',
            background: 'assets/images/bg.jpg'
        }
    },
    audio: {
        music: 'assets/audio/music.mp3',
        sfx: {
            click: 'assets/audio/sfx/click.wav',
            error: 'assets/audio/sfx/error.wav'
        }
    }
};

// Load assets by category
async function loadAssetCategory(category) {
    const assets = assetManifest[category];
    // Load all assets in category
}
```

### Script Files

Organize SK8Script code in separate files:

```javascript
// scripts/main.sk8script
-- Main application logic

on startup()
    initializeApp()
    loadAssets()
    showMainMenu()
end startup

-- scripts/utils.sk8script
-- Utility functions

on formatNumber(num, decimals)
    -- Format number with decimals
    return formatted
end formatNumber

-- scripts/handlers.sk8script
-- Event handlers

on buttonClick()
    playSound("click")
    navigateToScreen("game")
end buttonClick
```

### Project Templates

Create reusable templates:

```javascript
// Template: Empty project
function createEmptyProject() {
    const project = new SK8Project('Untitled', '1.0.0');
    return project;
}

// Template: Basic application
function createBasicApp(name) {
    const project = new SK8Project(name, '1.0.0');

    const stage = new SK8Stage('canvas');
    stage.set('width', 800);
    stage.set('height', 600);
    project.addStage('main', stage);

    return project;
}

// Template: Game project
function createGameProject(name) {
    const project = new SK8Project(name, '1.0.0');

    // Add game-specific stages
    const menuStage = new SK8Stage('menu');
    const gameStage = new SK8Stage('game');
    const gameOverStage = new SK8Stage('gameover');

    project.addStage('menu', menuStage);
    project.addStage('game', gameStage);
    project.addStage('gameover', gameOverStage);

    return project;
}
```

---

## Collaboration

### Version Control with Git

SK8 projects work great with Git:

```bash
# Initialize Git repository
git init
git add .
git commit -m "Initial commit"

# .gitignore file
node_modules/
dist/
.DS_Store
*.log
autosave/
```

### Sharing Projects

```javascript
// Export project as shareable file
function exportProject(project) {
    const serializer = new ProjectSerializer();
    const json = serializer.serialize(project);

    // Create downloadable file
    const blob = new Blob([json], { type: 'application/json' });
    return blob;
}

// Import shared project
function importProject(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const deserializer = new ProjectDeserializer();
            const project = deserializer.deserialize(e.target.result);
            resolve(project);
        };
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}
```

### Merging Changes

When collaborating:

1. Save your work frequently
2. Use descriptive commit messages
3. Pull before you push
4. Resolve conflicts in SK8JSON files carefully
5. Test after merging

### Best Practices

**Project Organization:**
- Use meaningful names for actors and stages
- Keep assets in organized directories
- Document complex scripts
- Version your project

**Collaboration:**
- Communicate changes to team
- Use branches for features
- Review before merging
- Test thoroughly

---

## Deployment

### Building for Production

```javascript
// Build script
async function buildForProduction(project) {
    console.log('Building project...');

    // 1. Validate project
    const errors = validateProject(project);
    if (errors.length > 0) {
        console.error('Validation errors:', errors);
        return;
    }

    // 2. Optimize assets
    await optimizeAssets(project);

    // 3. Bundle project
    const bundle = bundleProject(project);

    // 4. Create distribution package
    createDistribution(bundle);

    console.log('Build complete!');
}

function validateProject(project) {
    const errors = [];

    // Check for missing assets
    const assets = project.getAssets();
    assets.forEach(asset => {
        if (!assetExists(asset.url)) {
            errors.push(`Missing asset: ${asset.url}`);
        }
    });

    // Check for undefined handlers
    const scripts = project.getScripts();
    scripts.forEach(script => {
        const actor = project.getActor(script.objectId);
        if (!actor) {
            errors.push(`Actor not found for script: ${script.objectId}`);
        }
    });

    return errors;
}
```

### Static Export

Export as standalone HTML:

```javascript
function exportToHTML(project) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${project.getName()}</title>
    <style>
        body { margin: 0; padding: 0; }
        canvas { display: block; margin: 0 auto; }
    </style>
</head>
<body>
    <canvas id="stage"></canvas>
    <script type="module">
        import { SK8Stage } from './sk8.js';

        // Load project
        const projectData = ${JSON.stringify(serialize(project))};

        // Recreate project
        const stage = recreateStage(projectData);
        stage.startRendering();
    </script>
</body>
</html>
`;

    return html;
}
```

### Hosting Options

**GitHub Pages:**
```bash
# Build and deploy to GitHub Pages
npm run build
git add dist/
git commit -m "Build for deployment"
git push origin main

# Enable GitHub Pages in repository settings
```

**Netlify:**
1. Connect Git repository
2. Build command: `npm run build`
3. Publish directory: `dist/`
4. Deploy!

**Static Web Hosting:**
- Upload `dist/` folder to any web host
- Ensure `index.html` is in root
- Set correct MIME types for assets

### Distribution Package

```javascript
// Create distribution ZIP
async function createDistributionZip(project) {
    const zip = new JSZip();

    // Add project file
    zip.file('project.sk8json', serialize(project));

    // Add assets
    const assets = project.getAssets();
    for (const asset of assets) {
        const data = await fetchAssetData(asset.url);
        zip.file(`assets/${asset.id}${getExtension(asset.url)}`, data);
    }

    // Add index.html
    zip.file('index.html', exportToHTML(project));

    // Generate ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
}
```

---

## Next Steps

- **[Visual IDE Guide](VISUAL_IDE.md)** - Use the visual editor
- **[Recipe Book](RECIPES.md)** - Complete project examples
- **[Troubleshooting](TROUBLESHOOTING.md)** - Fix common issues

Build and share amazing SK8 projects!
