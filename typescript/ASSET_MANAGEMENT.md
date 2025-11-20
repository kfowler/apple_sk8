# SK8 Asset Management System

A comprehensive, production-ready asset management system for the SK8 TypeScript port.

## Overview

The Asset Management System provides complete infrastructure for handling all types of assets in SK8 projects, including images, videos, audio, fonts, JSON, and scripts. It features intelligent caching, reference tracking, automatic garbage collection, thumbnail generation, and optimization for deployment.

## Features

### Core Components

1. **AssetRegistry** - Central registry for all project assets
2. **AssetLoader** - Asynchronous loading with caching
3. **AssetImporter** - Import from files, URLs, and data URIs
4. **AssetBundler** - Optimization and bundling for deployment
5. **AssetLibrary** - Visual UI component for asset management

### Key Capabilities

- **UUID-based identification** - Every asset gets a unique ID
- **Reference counting** - Track which actors use which assets
- **Garbage collection** - Automatically remove unused assets
- **Thumbnail generation** - For images and videos
- **Image optimization** - Resize and compress images
- **Caching** - In-memory and IndexedDB for persistence
- **Preloading queue** - Priority-based asset preloading
- **Progress tracking** - Real-time progress callbacks
- **Batch import** - Import multiple files at once
- **Error handling** - Robust error handling with retry logic
- **Asset bundling** - Base64 embedding for small files, external for large
- **Responsive images** - Generate multiple sizes for different screens

## Architecture

```
┌─────────────────┐
│  AssetLibrary   │ (UI Component)
│    (Editor)     │
└────────┬────────┘
         │
         ├──────────┐
         │          │
┌────────▼─────┐  ┌▼────────────┐
│ AssetImporter│  │AssetBundler │
└────────┬─────┘  └─────────────┘
         │
    ┌────▼────┐
    │  Asset  │
    │ Loader  │
    └────┬────┘
         │
    ┌────▼────┐
    │  Asset  │
    │Registry │
    └─────────┘
```

## File Structure

```
typescript/src/assets/
├── asset-registry.ts     (2,450 lines) - Core registry with reference counting
├── asset-loader.ts       (694 lines)   - Async loading with caching
├── asset-importer.ts     (579 lines)   - File/URL import with thumbnails
├── asset-bundler.ts      (665 lines)   - Deployment bundling
└── index.ts              (55 lines)    - Main exports

typescript/src/editor/
└── asset-library.ts      (818 lines)   - Visual UI component

typescript/tests/
└── asset-management.test.ts (621 lines) - Comprehensive tests

typescript/demo/
└── asset-demo.html       - Interactive demo

Total: ~5,882 lines of code
```

## Usage

### Basic Usage

```typescript
import {
  AssetRegistry,
  AssetLoader,
  AssetImporter,
  getGlobalAssetRegistry,
  getGlobalAssetLoader,
} from './assets';

// Get singleton instances
const registry = getGlobalAssetRegistry();
const loader = getGlobalAssetLoader();
const importer = new AssetImporter(registry, loader);

// Import an asset
const result = await importer.importFile(file, {
  generateThumbnail: true,
  optimizeImages: true,
});

// Access the asset
const asset = registry.getAsset(result.assetId);
console.log(`Imported: ${asset.name}, Size: ${asset.size} bytes`);

// Add a reference (track usage)
registry.addReference(result.assetId, 'myActor123');

// Get reference count
const refCount = registry.getReferenceCount(result.assetId);
console.log(`Asset used by ${refCount} object(s)`);
```

### Loading Assets

```typescript
// Load an image
const imageAsset = await loader.loadImage('path/to/image.png', {
  onProgress: (progress) => {
    console.log(`${progress.percentage.toFixed(0)}% loaded`);
  },
  useCache: true,
});

// Load video
const videoAsset = await loader.loadVideo('path/to/video.mp4');

// Load audio
const audioAsset = await loader.loadAudio('path/to/audio.mp3');

// Auto-detect type and load
const asset = await loader.load('path/to/file.ext', {
  retries: 3,
  timeout: 30000,
});
```

### Importing Assets

```typescript
// Import from file
const file = document.querySelector('input[type="file"]').files[0];
const result = await importer.importFile(file, {
  generateThumbnail: true,
  optimizeImages: true,
  maxImageSize: 2048,
  imageQuality: 0.8,
});

// Import from URL
const urlResult = await importer.importURL('https://example.com/image.png', {
  generateThumbnail: true,
});

// Batch import
const files = document.querySelector('input[type="file"]').files;
const results = await importer.importFiles(files, {
  onBatchProgress: (progress) => {
    console.log(`${progress.completed}/${progress.total} files imported`);
  },
});
```

### Reference Tracking

```typescript
// Add reference
registry.addReference(assetId, 'actor1');
registry.addReference(assetId, 'actor2');

// Check usage
const isUsed = registry.isAssetUsed(assetId);
const refCount = registry.getReferenceCount(assetId);

// Get all references
const refs = registry.getReferences(assetId);
console.log(`Asset used by: ${refs.join(', ')}`);

// Remove reference
registry.removeReference(assetId, 'actor1');

// Remove all references from an object
registry.removeAllReferences('actor1');
```

### Garbage Collection

```typescript
// Get unused assets
const unused = registry.getUnusedAssets();
console.log(`Found ${unused.length} unused assets`);

// Dry run (preview what would be collected)
const wouldCollect = registry.garbageCollect({ dryRun: true });

// Actually collect
const collected = registry.garbageCollect();
console.log(`Collected ${collected.length} unused assets`);
```

### Asset Bundling

```typescript
import { AssetBundler } from './assets';

const bundler = new AssetBundler(registry);

// Generate bundle
const bundle = await bundler.bundle({
  embedThreshold: 10 * 1024,      // Embed files < 10KB
  optimizeImages: true,             // Optimize images
  imageQuality: 0.85,               // JPEG quality
  includeUnused: false,             // Only bundle used assets
  responsiveImages: true,           // Generate responsive sizes
  responsiveSizes: [320, 640, 1024, 1920],
});

// Generate report
const report = bundler.generateReport(bundle);
console.log(report);

// Download manifest
const manifestJson = JSON.stringify(bundle.manifest, null, 2);
const blob = new Blob([manifestJson], { type: 'application/json' });
// ... download blob
```

### Asset Library UI

```typescript
import { AssetLibrary } from './editor/asset-library';

const assetLibrary = new AssetLibrary({
  container: document.getElementById('asset-panel'),
  registry,
  loader,
  importer,
  stage: myStage, // Optional: for creating actors
  showThumbnails: true,
  thumbnailSize: 120,
});

// Show/hide
assetLibrary.show();
assetLibrary.hide();
assetLibrary.toggle();

// Refresh
assetLibrary.refresh();
```

## Supported Asset Types

| Type   | Extensions                           | MIME Types                          |
|--------|--------------------------------------|-------------------------------------|
| IMAGE  | jpg, jpeg, png, gif, webp, svg, bmp | image/*                             |
| VIDEO  | mp4, webm, ogg, mov, avi, mkv       | video/*                             |
| AUDIO  | mp3, wav, ogg, aac, flac, m4a       | audio/*                             |
| FONT   | ttf, otf, woff, woff2, eot          | font/*                              |
| JSON   | json                                 | application/json                    |
| SCRIPT | js, ts, mjs, cjs                    | application/javascript, text/*      |
| OTHER  | *                                    | *                                   |

## Performance Characteristics

### Loading
- **Deduplication**: Simultaneous loads of the same URL are deduplicated
- **Caching**: Two-tier caching (memory + IndexedDB)
- **Preloading**: Priority-based queue, max 4 concurrent loads
- **Progress**: Real-time progress tracking for large files

### Memory
- **Efficient**: Only thumbnails kept in memory, full assets loaded on-demand
- **Blob URLs**: Used for local files to avoid data URL overhead
- **Cache limits**: Automatic LRU eviction (future enhancement)

### Bundling
- **Small files**: Embedded as base64 (< 10KB by default)
- **Large files**: Saved as external files
- **Optimization**: Images resized and compressed
- **Responsive**: Multiple sizes generated for images

## Bundle Output Format

### Manifest Structure

```json
{
  "version": "1.0.0",
  "generated": 1234567890,
  "assets": [
    {
      "id": "uuid-1234",
      "name": "logo.png",
      "type": "image",
      "size": 15234,
      "url": "./assets/abcd1234_logo.png",
      "embedded": false,
      "thumbnail": "data:image/jpeg;base64,...",
      "responsive": [
        { "width": 320, "url": "data:image/jpeg;base64,..." },
        { "width": 640, "url": "data:image/jpeg;base64,..." }
      ]
    }
  ],
  "stats": {
    "totalAssets": 10,
    "totalSize": 1048576,
    "embeddedCount": 3,
    "embeddedSize": 25600,
    "externalCount": 7,
    "externalSize": 1022976,
    "byType": {
      "image": { "count": 5, "size": 512000 },
      "audio": { "count": 3, "size": 409600 },
      "video": { "count": 2, "size": 102400 }
    }
  }
}
```

### External Files

```
dist/assets/
├── manifest.json
├── abcd1234_logo.png
├── efgh5678_background.jpg
├── ijkl9012_music.mp3
└── mnop3456_video.mp4
```

## Integration Instructions

### 1. Update Actor Classes

Update Picture, MovieRectangle, and Sound to register assets:

```typescript
import { getGlobalAssetRegistry } from '../assets';

class SK8Picture extends SK8Image {
  private assetId?: string;

  setSource(url: string): void {
    // Register asset if not already registered
    const registry = getGlobalAssetRegistry();

    // Import or register the asset
    // ... import logic here

    // Add reference
    registry.addReference(this.assetId, this.getObjectId());

    super.setSource(url);
  }

  dispose(): void {
    // Remove reference when actor is destroyed
    if (this.assetId) {
      const registry = getGlobalAssetRegistry();
      registry.removeReference(this.assetId, this.getObjectId());
    }
    super.dispose();
  }
}
```

### 2. Update Project Serialization

The ProjectSerializer already supports assets. Enhance it to include AssetRegistry data:

```typescript
import { getGlobalAssetRegistry } from '../assets';

function serializeProject(project: SK8Project): SerializedProject {
  const registry = getGlobalAssetRegistry();

  // Include registry data in serialization
  const registryData = registry.toJSON();

  return {
    // ... existing fields
    assetRegistry: registryData,
  };
}
```

### 3. Add to Editor

Integrate AssetLibrary into the editor:

```typescript
import { AssetLibrary } from './editor/asset-library';
import { getGlobalAssetRegistry, getGlobalAssetLoader, AssetImporter } from './assets';

class SK8Editor {
  private assetLibrary: AssetLibrary;

  constructor() {
    const registry = getGlobalAssetRegistry();
    const loader = getGlobalAssetLoader();
    const importer = new AssetImporter(registry, loader);

    this.assetLibrary = new AssetLibrary({
      container: document.getElementById('asset-panel'),
      registry,
      loader,
      importer,
      stage: this.stage,
    });
  }

  showAssetLibrary(): void {
    this.assetLibrary.show();
  }
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test -- asset-management.test.ts
```

Test coverage:
- 60+ tests
- Registry operations: 20 tests
- Loading and caching: 15 tests
- Importing: 10 tests
- Bundling: 8 tests
- Integration: 7 tests

## Demo

Open the interactive demo:

```bash
cd typescript
npm run build
# Open demo/asset-demo.html in browser
```

The demo showcases:
- Importing assets from files and URLs
- Asset registry statistics
- Reference counting
- Garbage collection
- Bundle generation
- Cache management
- Interactive asset library UI

## API Reference

### AssetRegistry

```typescript
class AssetRegistry {
  // Registration
  registerAsset(name: string, type: AssetType, url: string, options?): string
  unregisterAsset(id: string): boolean

  // Retrieval
  getAsset(id: string): AssetMetadata | undefined
  getAllAssets(): AssetMetadata[]
  getAssetsByType(type: AssetType): AssetMetadata[]
  searchAssets(query: string): AssetMetadata[]

  // Updates
  updateAsset(id: string, updates: Partial<AssetMetadata>): boolean

  // References
  addReference(assetId: string, objectId: string): void
  removeReference(assetId: string, objectId: string): void
  removeAllReferences(objectId: string): void
  getReferenceCount(assetId: string): number
  getReferences(assetId: string): string[]
  isAssetUsed(assetId: string): boolean

  // Garbage collection
  getUnusedAssets(): AssetMetadata[]
  garbageCollect(options?: { dryRun?: boolean }): AssetMetadata[]

  // Statistics
  getTotalSize(): number
  getSizeByType(type: AssetType): number
  getAssetCount(): number
  getAssetCountByType(type: AssetType): number

  // Events
  addEventListener(type: AssetRegistryEventType, listener: AssetRegistryEventListener): void
  removeEventListener(type: AssetRegistryEventType, listener: AssetRegistryEventListener): void

  // Serialization
  toJSON(): any
  fromJSON(data: any): void
}
```

### AssetLoader

```typescript
class AssetLoader {
  // Type-specific loading
  loadImage(url: string, options?: LoadOptions): Promise<LoadedAsset<HTMLImageElement>>
  loadVideo(url: string, options?: LoadOptions): Promise<LoadedAsset<HTMLVideoElement>>
  loadAudio(url: string, options?: LoadOptions): Promise<LoadedAsset<AudioBuffer>>
  loadFont(url: string, fontFamily: string, options?: LoadOptions): Promise<LoadedAsset<FontFace>>
  loadJSON<T>(url: string, options?: LoadOptions): Promise<LoadedAsset<T>>
  loadText(url: string, options?: LoadOptions): Promise<LoadedAsset<string>>
  loadBlob(url: string, options?: LoadOptions): Promise<LoadedAsset<Blob>>

  // Auto-detect type
  load(url: string, options?: LoadOptions): Promise<LoadedAsset>

  // Preloading
  preload(url: string, type: AssetType, options?: LoadOptions): Promise<LoadedAsset>

  // Blob URL management
  createBlobURL(file: File | Blob): string
  revokeBlobURL(url: string): void

  // Cache management
  clearMemoryCache(): void
  clearIndexedDBCache(): Promise<void>
  clearCache(): Promise<void>
}
```

### AssetImporter

```typescript
class AssetImporter {
  // Import methods
  importFile(file: File, options?: ImportOptions): Promise<ImportResult>
  importURL(url: string, options?: ImportOptions): Promise<ImportResult>
  importFiles(files: FileList | File[], options?: ImportOptions): Promise<ImportResult[]>
  importDataURL(dataUrl: string, name: string, options?: ImportOptions): Promise<ImportResult>

  // Thumbnail generation
  generateThumbnail(url: string, type: AssetType, maxSize?: number): Promise<string | undefined>

  // Image optimization
  optimizeImage(url: string, options: { maxSize: number, quality: number }): Promise<{ url: string, size: number }>
}
```

### AssetBundler

```typescript
class AssetBundler {
  // Bundling
  bundle(options?: BundleOptions): Promise<BundleResult>

  // Reporting
  generateReport(result: BundleResult): string

  // Export (placeholder for future)
  exportToZip(result: BundleResult): Promise<Blob>
  writeToDisk(result: BundleResult, outputDir: string): Promise<void>
}
```

## Future Enhancements

- [ ] LRU cache eviction for memory management
- [ ] WebWorker support for image processing
- [ ] CDN integration for external assets
- [ ] Asset compression (gzip, brotli)
- [ ] Asset versioning and migration
- [ ] Asset dependency tracking
- [ ] Sprite sheet generation
- [ ] Audio sprite support
- [ ] Video transcoding
- [ ] Progressive image loading
- [ ] Asset prefetching based on usage patterns
- [ ] Cloud storage integration (S3, etc.)

## License

See ../sk8_license.pdf

## Authors

SK8 TypeScript Port Contributors
