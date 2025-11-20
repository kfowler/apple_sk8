/**
 * AssetRegistry - Central registry for all project assets
 *
 * Features:
 * - UUID-based asset identification
 * - Reference counting to track usage
 * - Garbage collection for unused assets
 * - Asset metadata management
 * - Type-based filtering and search
 */

// UUID generation utility (no external dependencies)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Supported asset types
 */
export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FONT = 'font',
  JSON = 'json',
  SCRIPT = 'script',
  OTHER = 'other',
}

/**
 * Asset metadata
 */
export interface AssetMetadata {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Asset type */
  type: AssetType;
  /** File size in bytes */
  size: number;
  /** Asset URL (can be blob URL, data URL, or external URL) */
  url: string;
  /** Thumbnail URL (for images and video) */
  thumbnail?: string;
  /** MIME type */
  mimeType?: string;
  /** Original filename if imported from file */
  originalFilename?: string;
  /** Creation timestamp */
  created: number;
  /** Last modified timestamp */
  modified: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Asset reference tracking entry
 */
interface AssetReference {
  assetId: string;
  references: Set<string>; // Set of object IDs that reference this asset
}

/**
 * Asset registry events
 */
export type AssetRegistryEventType = 'assetAdded' | 'assetRemoved' | 'assetUpdated' | 'referenceChanged';

export interface AssetRegistryEvent {
  type: AssetRegistryEventType;
  asset: AssetMetadata;
  referenceCount?: number;
}

export type AssetRegistryEventListener = (event: AssetRegistryEvent) => void;

/**
 * AssetRegistry - Manages all assets in a project
 */
export class AssetRegistry {
  private assets = new Map<string, AssetMetadata>();
  private references = new Map<string, AssetReference>();
  private listeners = new Map<AssetRegistryEventType, Set<AssetRegistryEventListener>>();

  /**
   * Register a new asset
   */
  registerAsset(
    name: string,
    type: AssetType,
    url: string,
    options?: {
      size?: number;
      thumbnail?: string;
      mimeType?: string;
      originalFilename?: string;
      metadata?: Record<string, any>;
      id?: string; // Optional: provide your own ID
    }
  ): string {
    const id = options?.id || this.generateAssetId();
    const now = Date.now();

    const asset: AssetMetadata = {
      id,
      name,
      type,
      size: options?.size || 0,
      url,
      thumbnail: options?.thumbnail,
      mimeType: options?.mimeType,
      originalFilename: options?.originalFilename,
      created: now,
      modified: now,
      metadata: options?.metadata,
    };

    this.assets.set(id, asset);
    this.references.set(id, { assetId: id, references: new Set() });

    this.emit('assetAdded', asset);

    return id;
  }

  /**
   * Unregister an asset
   */
  unregisterAsset(id: string): boolean {
    const asset = this.assets.get(id);
    if (!asset) return false;

    // Check if asset is still referenced
    const refCount = this.getReferenceCount(id);
    if (refCount > 0) {
      console.warn(`Cannot remove asset '${asset.name}' - still referenced by ${refCount} object(s)`);
      return false;
    }

    this.assets.delete(id);
    this.references.delete(id);

    this.emit('assetRemoved', asset);

    return true;
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): AssetMetadata | undefined {
    return this.assets.get(id);
  }

  /**
   * Get all assets
   */
  getAllAssets(): AssetMetadata[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by type
   */
  getAssetsByType(type: AssetType): AssetMetadata[] {
    return Array.from(this.assets.values()).filter((asset) => asset.type === type);
  }

  /**
   * Search assets by name
   */
  searchAssets(query: string): AssetMetadata[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.assets.values()).filter((asset) =>
      asset.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Update asset metadata
   */
  updateAsset(id: string, updates: Partial<AssetMetadata>): boolean {
    const asset = this.assets.get(id);
    if (!asset) return false;

    const updated = {
      ...asset,
      ...updates,
      id: asset.id, // Preserve ID
      created: asset.created, // Preserve creation time
      modified: Date.now(),
    };

    this.assets.set(id, updated);
    this.emit('assetUpdated', updated);

    return true;
  }

  /**
   * Add a reference to an asset
   */
  addReference(assetId: string, objectId: string): void {
    const ref = this.references.get(assetId);
    if (!ref) {
      console.warn(`Asset '${assetId}' not found in registry`);
      return;
    }

    ref.references.add(objectId);

    const asset = this.assets.get(assetId);
    if (asset) {
      this.emit('referenceChanged', asset, ref.references.size);
    }
  }

  /**
   * Remove a reference from an asset
   */
  removeReference(assetId: string, objectId: string): void {
    const ref = this.references.get(assetId);
    if (!ref) return;

    ref.references.delete(objectId);

    const asset = this.assets.get(assetId);
    if (asset) {
      this.emit('referenceChanged', asset, ref.references.size);
    }
  }

  /**
   * Remove all references from a specific object
   */
  removeAllReferences(objectId: string): void {
    for (const [assetId, ref] of Array.from(this.references.entries())) {
      if (ref.references.has(objectId)) {
        ref.references.delete(objectId);

        const asset = this.assets.get(assetId);
        if (asset) {
          this.emit('referenceChanged', asset, ref.references.size);
        }
      }
    }
  }

  /**
   * Get reference count for an asset
   */
  getReferenceCount(assetId: string): number {
    const ref = this.references.get(assetId);
    return ref ? ref.references.size : 0;
  }

  /**
   * Get all objects that reference an asset
   */
  getReferences(assetId: string): string[] {
    const ref = this.references.get(assetId);
    return ref ? Array.from(ref.references) : [];
  }

  /**
   * Check if an asset is used
   */
  isAssetUsed(assetId: string): boolean {
    return this.getReferenceCount(assetId) > 0;
  }

  /**
   * Get all unused assets
   */
  getUnusedAssets(): AssetMetadata[] {
    return Array.from(this.assets.values()).filter(
      (asset) => this.getReferenceCount(asset.id) === 0
    );
  }

  /**
   * Garbage collect - remove all unused assets
   */
  garbageCollect(options?: { dryRun?: boolean }): AssetMetadata[] {
    const unused = this.getUnusedAssets();

    if (!options?.dryRun) {
      for (const asset of unused) {
        this.unregisterAsset(asset.id);
      }
    }

    return unused;
  }

  /**
   * Get total size of all assets
   */
  getTotalSize(): number {
    return Array.from(this.assets.values()).reduce((total, asset) => total + asset.size, 0);
  }

  /**
   * Get total size by type
   */
  getSizeByType(type: AssetType): number {
    return this.getAssetsByType(type).reduce((total, asset) => total + asset.size, 0);
  }

  /**
   * Check if asset exists
   */
  hasAsset(id: string): boolean {
    return this.assets.has(id);
  }

  /**
   * Get asset count
   */
  getAssetCount(): number {
    return this.assets.size;
  }

  /**
   * Get asset count by type
   */
  getAssetCountByType(type: AssetType): number {
    return this.getAssetsByType(type).length;
  }

  /**
   * Clear all assets (warning: irreversible!)
   */
  clear(): void {
    const assets = Array.from(this.assets.values());

    this.assets.clear();
    this.references.clear();

    for (const asset of assets) {
      this.emit('assetRemoved', asset);
    }
  }

  /**
   * Generate a unique asset ID
   */
  private generateAssetId(): string {
    return generateUUID();
  }

  /**
   * Event listener management
   */
  addEventListener(type: AssetRegistryEventType, listener: AssetRegistryEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: AssetRegistryEventType, listener: AssetRegistryEventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  private emit(
    type: AssetRegistryEventType,
    asset: AssetMetadata,
    referenceCount?: number
  ): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;

    const event: AssetRegistryEvent = {
      type,
      asset,
      referenceCount,
    };

    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in asset registry event listener:`, error);
      }
    });
  }

  /**
   * Export registry to JSON
   */
  toJSON(): any {
    return {
      assets: Array.from(this.assets.values()),
      references: Array.from(this.references.entries()).map(([id, ref]) => ({
        assetId: id,
        references: Array.from(ref.references),
      })),
    };
  }

  /**
   * Import registry from JSON
   */
  fromJSON(data: any): void {
    this.clear();

    if (data.assets) {
      for (const asset of data.assets) {
        this.assets.set(asset.id, asset);
        this.references.set(asset.id, { assetId: asset.id, references: new Set() });
      }
    }

    if (data.references) {
      for (const refData of data.references) {
        const ref = this.references.get(refData.assetId);
        if (ref) {
          ref.references = new Set(refData.references);
        }
      }
    }
  }
}

/**
 * Singleton instance for global asset registry
 */
let globalRegistry: AssetRegistry | null = null;

/**
 * Get or create the global asset registry
 */
export function getGlobalAssetRegistry(): AssetRegistry {
  if (!globalRegistry) {
    globalRegistry = new AssetRegistry();
  }
  return globalRegistry;
}

/**
 * Set the global asset registry (useful for testing)
 */
export function setGlobalAssetRegistry(registry: AssetRegistry): void {
  globalRegistry = registry;
}

/**
 * Helper to determine asset type from MIME type
 */
export function getAssetTypeFromMimeType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return AssetType.IMAGE;
  if (mimeType.startsWith('video/')) return AssetType.VIDEO;
  if (mimeType.startsWith('audio/')) return AssetType.AUDIO;
  if (mimeType.includes('font')) return AssetType.FONT;
  if (mimeType === 'application/json') return AssetType.JSON;
  if (
    mimeType === 'application/javascript' ||
    mimeType === 'text/javascript' ||
    mimeType === 'application/typescript'
  )
    return AssetType.SCRIPT;
  return AssetType.OTHER;
}

/**
 * Helper to determine asset type from filename
 */
export function getAssetTypeFromFilename(filename: string): AssetType {
  const ext = filename.split('.').pop()?.toLowerCase();

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
  const fontExts = ['ttf', 'otf', 'woff', 'woff2', 'eot'];
  const scriptExts = ['js', 'ts', 'mjs', 'cjs'];

  if (ext && imageExts.includes(ext)) return AssetType.IMAGE;
  if (ext && videoExts.includes(ext)) return AssetType.VIDEO;
  if (ext && audioExts.includes(ext)) return AssetType.AUDIO;
  if (ext && fontExts.includes(ext)) return AssetType.FONT;
  if (ext === 'json') return AssetType.JSON;
  if (ext && scriptExts.includes(ext)) return AssetType.SCRIPT;

  return AssetType.OTHER;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
