/**
 * Asset Management System - Main exports
 *
 * This module provides a complete asset management system for SK8 projects,
 * including registry, loading, importing, bundling, and UI components.
 */

// Core registry
export {
  AssetRegistry,
  AssetType,
  AssetMetadata,
  AssetRegistryEvent,
  AssetRegistryEventType,
  AssetRegistryEventListener,
  getGlobalAssetRegistry,
  setGlobalAssetRegistry,
  getAssetTypeFromMimeType,
  getAssetTypeFromFilename,
  formatBytes,
} from './asset-registry.js';

// Asset loader
export {
  AssetLoader,
  LoadProgress,
  ProgressCallback,
  LoadOptions,
  LoadedAsset,
  getGlobalAssetLoader,
  setGlobalAssetLoader,
} from './asset-loader.js';

// Asset importer
export {
  AssetImporter,
  ImportOptions,
  ImportResult,
  BatchImportProgress,
  BatchProgressCallback,
  createFileInput,
  showFilePicker,
  AcceptStrings,
} from './asset-importer.js';

// Asset bundler
export {
  AssetBundler,
  BundleOptions,
  BundleResult,
  AssetManifest,
  AssetManifestEntry,
  loadManifest,
  validateManifest,
} from './asset-bundler.js';
