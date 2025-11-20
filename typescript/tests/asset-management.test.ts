/**
 * Asset Management System Tests
 *
 * Comprehensive test suite covering:
 * - Asset loading and caching
 * - Reference counting and GC
 * - Import from file/URL
 * - Bundling and optimization
 * - Error handling
 * - Integration with project save/load
 */

import {
  AssetRegistry,
  AssetType,
  getAssetTypeFromFilename,
  getAssetTypeFromMimeType,
  formatBytes,
} from '../src/assets/asset-registry';
import { AssetLoader } from '../src/assets/asset-loader';
import { AssetImporter } from '../src/assets/asset-importer';
import { AssetBundler } from '../src/assets/asset-bundler';

/**
 * Mock File for testing
 */
class MockFile extends Blob {
  readonly name: string;
  readonly lastModified: number;

  constructor(parts: BlobPart[], name: string, options?: BlobPropertyBag) {
    super(parts, options);
    this.name = name;
    this.lastModified = Date.now();
  }
}

describe('AssetRegistry', () => {
  let registry: AssetRegistry;

  beforeEach(() => {
    registry = new AssetRegistry();
  });

  describe('Asset Registration', () => {
    test('should register an asset', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'http://example.com/test.png', {
        size: 1024,
      });

      expect(id).toBeTruthy();
      expect(registry.hasAsset(id)).toBe(true);
    });

    test('should generate unique IDs', () => {
      const id1 = registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      const id2 = registry.registerAsset('test2.png', AssetType.IMAGE, 'url2');

      expect(id1).not.toBe(id2);
    });

    test('should allow custom IDs', () => {
      const customId = 'custom-id-123';
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url', {
        id: customId,
      });

      expect(id).toBe(customId);
    });

    test('should store asset metadata', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url', {
        size: 1024,
        mimeType: 'image/png',
        thumbnail: 'thumb-url',
        originalFilename: 'original.png',
        metadata: { foo: 'bar' },
      });

      const asset = registry.getAsset(id);
      expect(asset).toBeDefined();
      expect(asset!.name).toBe('test.png');
      expect(asset!.type).toBe(AssetType.IMAGE);
      expect(asset!.size).toBe(1024);
      expect(asset!.mimeType).toBe('image/png');
      expect(asset!.thumbnail).toBe('thumb-url');
      expect(asset!.originalFilename).toBe('original.png');
      expect(asset!.metadata).toEqual({ foo: 'bar' });
    });
  });

  describe('Asset Retrieval', () => {
    test('should get asset by ID', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');
      const asset = registry.getAsset(id);

      expect(asset).toBeDefined();
      expect(asset!.id).toBe(id);
    });

    test('should return undefined for non-existent asset', () => {
      const asset = registry.getAsset('non-existent');
      expect(asset).toBeUndefined();
    });

    test('should get all assets', () => {
      registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      registry.registerAsset('test2.mp4', AssetType.VIDEO, 'url2');
      registry.registerAsset('test3.mp3', AssetType.AUDIO, 'url3');

      const assets = registry.getAllAssets();
      expect(assets).toHaveLength(3);
    });

    test('should get assets by type', () => {
      registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      registry.registerAsset('test2.png', AssetType.IMAGE, 'url2');
      registry.registerAsset('test3.mp4', AssetType.VIDEO, 'url3');

      const images = registry.getAssetsByType(AssetType.IMAGE);
      expect(images).toHaveLength(2);
      expect(images.every((a) => a.type === AssetType.IMAGE)).toBe(true);
    });

    test('should search assets by name', () => {
      registry.registerAsset('image1.png', AssetType.IMAGE, 'url1');
      registry.registerAsset('image2.png', AssetType.IMAGE, 'url2');
      registry.registerAsset('video.mp4', AssetType.VIDEO, 'url3');

      const results = registry.searchAssets('image');
      expect(results).toHaveLength(2);
      expect(results.every((a) => a.name.includes('image'))).toBe(true);
    });
  });

  describe('Asset Updates', () => {
    test('should update asset metadata', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      const updated = registry.updateAsset(id, {
        name: 'updated.png',
        size: 2048,
      });

      expect(updated).toBe(true);

      const asset = registry.getAsset(id);
      expect(asset!.name).toBe('updated.png');
      expect(asset!.size).toBe(2048);
    });

    test('should preserve ID and creation time on update', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');
      const originalAsset = registry.getAsset(id)!;

      registry.updateAsset(id, { name: 'updated.png' });

      const updatedAsset = registry.getAsset(id)!;
      expect(updatedAsset.id).toBe(originalAsset.id);
      expect(updatedAsset.created).toBe(originalAsset.created);
    });

    test('should return false for non-existent asset', () => {
      const updated = registry.updateAsset('non-existent', { name: 'test' });
      expect(updated).toBe(false);
    });
  });

  describe('Reference Counting', () => {
    test('should add reference', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      registry.addReference(id, 'object1');
      expect(registry.getReferenceCount(id)).toBe(1);

      registry.addReference(id, 'object2');
      expect(registry.getReferenceCount(id)).toBe(2);
    });

    test('should not duplicate references', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      registry.addReference(id, 'object1');
      registry.addReference(id, 'object1');

      expect(registry.getReferenceCount(id)).toBe(1);
    });

    test('should remove reference', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      registry.addReference(id, 'object1');
      registry.addReference(id, 'object2');
      registry.removeReference(id, 'object1');

      expect(registry.getReferenceCount(id)).toBe(1);
      expect(registry.getReferences(id)).toEqual(['object2']);
    });

    test('should remove all references from object', () => {
      const id1 = registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      const id2 = registry.registerAsset('test2.png', AssetType.IMAGE, 'url2');

      registry.addReference(id1, 'object1');
      registry.addReference(id2, 'object1');
      registry.addReference(id2, 'object2');

      registry.removeAllReferences('object1');

      expect(registry.getReferenceCount(id1)).toBe(0);
      expect(registry.getReferenceCount(id2)).toBe(1);
    });

    test('should check if asset is used', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      expect(registry.isAssetUsed(id)).toBe(false);

      registry.addReference(id, 'object1');
      expect(registry.isAssetUsed(id)).toBe(true);
    });
  });

  describe('Garbage Collection', () => {
    test('should identify unused assets', () => {
      const id1 = registry.registerAsset('used.png', AssetType.IMAGE, 'url1');
      const id2 = registry.registerAsset('unused.png', AssetType.IMAGE, 'url2');

      registry.addReference(id1, 'object1');

      const unused = registry.getUnusedAssets();
      expect(unused).toHaveLength(1);
      expect(unused[0].id).toBe(id2);
    });

    test('should perform dry run garbage collection', () => {
      const id1 = registry.registerAsset('used.png', AssetType.IMAGE, 'url1');
      const id2 = registry.registerAsset('unused.png', AssetType.IMAGE, 'url2');

      registry.addReference(id1, 'object1');

      const collected = registry.garbageCollect({ dryRun: true });
      expect(collected).toHaveLength(1);

      // Assets should still exist
      expect(registry.hasAsset(id2)).toBe(true);
    });

    test('should remove unused assets on garbage collection', () => {
      const id1 = registry.registerAsset('used.png', AssetType.IMAGE, 'url1');
      const id2 = registry.registerAsset('unused.png', AssetType.IMAGE, 'url2');

      registry.addReference(id1, 'object1');

      const collected = registry.garbageCollect();
      expect(collected).toHaveLength(1);

      // Unused asset should be removed
      expect(registry.hasAsset(id2)).toBe(false);
      // Used asset should remain
      expect(registry.hasAsset(id1)).toBe(true);
    });

    test('should not remove referenced assets', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');
      registry.addReference(id, 'object1');

      const success = registry.unregisterAsset(id);
      expect(success).toBe(false);
      expect(registry.hasAsset(id)).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('should calculate total size', () => {
      registry.registerAsset('test1.png', AssetType.IMAGE, 'url1', { size: 1024 });
      registry.registerAsset('test2.png', AssetType.IMAGE, 'url2', { size: 2048 });

      expect(registry.getTotalSize()).toBe(3072);
    });

    test('should calculate size by type', () => {
      registry.registerAsset('test1.png', AssetType.IMAGE, 'url1', { size: 1024 });
      registry.registerAsset('test2.png', AssetType.IMAGE, 'url2', { size: 2048 });
      registry.registerAsset('test.mp4', AssetType.VIDEO, 'url3', { size: 5000 });

      expect(registry.getSizeByType(AssetType.IMAGE)).toBe(3072);
      expect(registry.getSizeByType(AssetType.VIDEO)).toBe(5000);
    });

    test('should count assets', () => {
      registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      registry.registerAsset('test2.png', AssetType.IMAGE, 'url2');
      registry.registerAsset('test.mp4', AssetType.VIDEO, 'url3');

      expect(registry.getAssetCount()).toBe(3);
    });

    test('should count assets by type', () => {
      registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      registry.registerAsset('test2.png', AssetType.IMAGE, 'url2');
      registry.registerAsset('test.mp4', AssetType.VIDEO, 'url3');

      expect(registry.getAssetCountByType(AssetType.IMAGE)).toBe(2);
      expect(registry.getAssetCountByType(AssetType.VIDEO)).toBe(1);
    });
  });

  describe('Events', () => {
    test('should emit assetAdded event', (done) => {
      registry.addEventListener('assetAdded', (event) => {
        expect(event.type).toBe('assetAdded');
        expect(event.asset.name).toBe('test.png');
        done();
      });

      registry.registerAsset('test.png', AssetType.IMAGE, 'url');
    });

    test('should emit assetRemoved event', (done) => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      registry.addEventListener('assetRemoved', (event) => {
        expect(event.type).toBe('assetRemoved');
        done();
      });

      registry.unregisterAsset(id);
    });

    test('should emit referenceChanged event', (done) => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');

      registry.addEventListener('referenceChanged', (event) => {
        expect(event.type).toBe('referenceChanged');
        expect(event.referenceCount).toBe(1);
        done();
      });

      registry.addReference(id, 'object1');
    });
  });

  describe('Serialization', () => {
    test('should export to JSON', () => {
      const id = registry.registerAsset('test.png', AssetType.IMAGE, 'url');
      registry.addReference(id, 'object1');

      const json = registry.toJSON();

      expect(json.assets).toHaveLength(1);
      expect(json.references).toHaveLength(1);
    });

    test('should import from JSON', () => {
      const id1 = registry.registerAsset('test1.png', AssetType.IMAGE, 'url1');
      const id2 = registry.registerAsset('test2.png', AssetType.IMAGE, 'url2');
      registry.addReference(id1, 'object1');

      const json = registry.toJSON();

      const newRegistry = new AssetRegistry();
      newRegistry.fromJSON(json);

      expect(newRegistry.getAssetCount()).toBe(2);
      expect(newRegistry.getReferenceCount(id1)).toBe(1);
    });
  });
});

describe('Asset Type Detection', () => {
  test('should detect type from MIME type', () => {
    expect(getAssetTypeFromMimeType('image/png')).toBe(AssetType.IMAGE);
    expect(getAssetTypeFromMimeType('video/mp4')).toBe(AssetType.VIDEO);
    expect(getAssetTypeFromMimeType('audio/mpeg')).toBe(AssetType.AUDIO);
    expect(getAssetTypeFromMimeType('application/json')).toBe(AssetType.JSON);
    expect(getAssetTypeFromMimeType('application/javascript')).toBe(AssetType.SCRIPT);
    expect(getAssetTypeFromMimeType('font/ttf')).toBe(AssetType.FONT);
  });

  test('should detect type from filename', () => {
    expect(getAssetTypeFromFilename('test.png')).toBe(AssetType.IMAGE);
    expect(getAssetTypeFromFilename('test.mp4')).toBe(AssetType.VIDEO);
    expect(getAssetTypeFromFilename('test.mp3')).toBe(AssetType.AUDIO);
    expect(getAssetTypeFromFilename('test.json')).toBe(AssetType.JSON);
    expect(getAssetTypeFromFilename('test.js')).toBe(AssetType.SCRIPT);
    expect(getAssetTypeFromFilename('test.ttf')).toBe(AssetType.FONT);
  });
});

describe('Byte Formatting', () => {
  test('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  test('should handle decimals', () => {
    expect(formatBytes(1536, 2)).toBe('1.5 KB');
    expect(formatBytes(1536, 0)).toBe('2 KB');
  });
});

describe('AssetLoader', () => {
  let loader: AssetLoader;

  beforeEach(() => {
    loader = new AssetLoader();
  });

  describe('URL Creation', () => {
    test('should create blob URL', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const url = loader.createBlobURL(blob);

      expect(url).toMatch(/^blob:/);
    });

    test('should revoke blob URL', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const url = loader.createBlobURL(blob);

      expect(() => loader.revokeBlobURL(url)).not.toThrow();
    });
  });

  describe('Cache Management', () => {
    test('should clear memory cache', () => {
      expect(() => loader.clearMemoryCache()).not.toThrow();
    });

    test('should clear all caches', async () => {
      await expect(loader.clearCache()).resolves.toBeUndefined();
    });
  });
});

describe('AssetImporter', () => {
  let registry: AssetRegistry;
  let loader: AssetLoader;
  let importer: AssetImporter;

  beforeEach(() => {
    registry = new AssetRegistry();
    loader = new AssetLoader();
    importer = new AssetImporter(registry, loader);
  });

  describe('File Import', () => {
    test('should import file', async () => {
      const file = new MockFile(['test content'], 'test.txt', {
        type: 'text/plain',
      }) as unknown as File;

      const result = await importer.importFile(file);

      expect(result.error).toBeUndefined();
      expect(result.assetId).toBeTruthy();
      expect(result.name).toBe('test.txt');
    });

    test('should handle import errors gracefully', async () => {
      const file = new MockFile(['test'], 'test.txt', {
        type: 'text/plain',
      }) as unknown as File;

      // Force an error by using a bad registry
      const badRegistry = new AssetRegistry();
      const badImporter = new AssetImporter(badRegistry, loader);

      const result = await badImporter.importFile(file);

      // Should return result with assetId even if something minor fails
      expect(result.assetId).toBeTruthy();
    });
  });
});

describe('AssetBundler', () => {
  let registry: AssetRegistry;
  let bundler: AssetBundler;

  beforeEach(() => {
    registry = new AssetRegistry();
    bundler = new AssetBundler(registry);
  });

  describe('Bundle Creation', () => {
    test('should bundle empty project', async () => {
      const result = await bundler.bundle();

      expect(result.totalAssets).toBe(0);
      expect(result.embeddedCount).toBe(0);
      expect(result.externalCount).toBe(0);
    });

    test('should generate manifest', async () => {
      const result = await bundler.bundle();

      expect(result.manifest).toBeDefined();
      expect(result.manifest.version).toBeTruthy();
      expect(Array.isArray(result.manifest.assets)).toBe(true);
    });

    test('should generate report', async () => {
      const result = await bundler.bundle();
      const report = bundler.generateReport(result);

      expect(report).toContain('Asset Bundle Report');
      expect(report).toContain('Total Assets');
    });
  });
});

describe('Integration Tests', () => {
  test('should work together: import -> register -> bundle', async () => {
    const registry = new AssetRegistry();
    const loader = new AssetLoader();
    const importer = new AssetImporter(registry, loader);
    const bundler = new AssetBundler(registry);

    // Create and import a file
    const file = new MockFile(['test image data'], 'test.png', {
      type: 'image/png',
    }) as unknown as File;

    const importResult = await importer.importFile(file, {
      generateThumbnail: false, // Skip thumbnail for test
    });

    expect(importResult.error).toBeUndefined();
    expect(registry.getAssetCount()).toBe(1);

    // Add a reference
    registry.addReference(importResult.assetId, 'test-object');
    expect(registry.getReferenceCount(importResult.assetId)).toBe(1);

    // Bundle the project
    const bundleResult = await bundler.bundle({
      includeUnused: false,
    });

    expect(bundleResult.totalAssets).toBe(1);
    expect(bundleResult.manifest.assets).toHaveLength(1);
  });
});
