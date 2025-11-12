/**
 * MediaManager - Central media asset management
 *
 * Provides asset registry, preloading, memory management, and progress tracking
 * for images, videos, and audio files.
 */

import { loadAudio } from './audio-utils.js';

/**
 * Media asset types
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

/**
 * Media asset status
 */
export enum MediaStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
}

/**
 * Media asset descriptor
 */
export interface MediaAsset {
  id: string;
  url: string;
  type: MediaType;
  status: MediaStatus;
  data?: HTMLImageElement | HTMLVideoElement | AudioBuffer;
  error?: Error;
  size?: number;
  duration?: number;
}

/**
 * Load progress callback
 */
export type ProgressCallback = (loaded: number, total: number, asset?: MediaAsset) => void;

/**
 * MediaManager - Central asset manager
 */
export class MediaManager {
  private static instance: MediaManager | null = null;
  private assets = new Map<string, MediaAsset>();
  private loading = new Set<string>();

  /**
   * Get singleton instance
   */
  static getInstance(): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager();
    }
    return MediaManager.instance;
  }

  /**
   * Register an asset
   */
  register(id: string, url: string, type: MediaType): void {
    if (this.assets.has(id)) {
      console.warn(`Asset with id "${id}" already registered`);
      return;
    }

    this.assets.set(id, {
      id,
      url,
      type,
      status: MediaStatus.PENDING,
    });
  }

  /**
   * Register multiple assets
   */
  registerMany(assets: { id: string; url: string; type: MediaType }[]): void {
    for (const asset of assets) {
      this.register(asset.id, asset.url, asset.type);
    }
  }

  /**
   * Load a single asset
   */
  async load(id: string): Promise<MediaAsset> {
    const asset = this.assets.get(id);

    if (!asset) {
      throw new Error(`Asset "${id}" not found`);
    }

    if (asset.status === MediaStatus.LOADED) {
      return asset;
    }

    if (this.loading.has(id)) {
      // Wait for ongoing load
      return this.waitForLoad(id);
    }

    this.loading.add(id);
    asset.status = MediaStatus.LOADING;

    try {
      switch (asset.type) {
        case MediaType.IMAGE:
          asset.data = await this.loadImage(asset.url);
          break;

        case MediaType.VIDEO:
          asset.data = await this.loadVideo(asset.url);
          break;

        case MediaType.AUDIO:
          asset.data = await this.loadAudioAsset(asset.url);
          break;
      }

      asset.status = MediaStatus.LOADED;
      this.loading.delete(id);

      return asset;
    } catch (error) {
      asset.status = MediaStatus.ERROR;
      asset.error = error as Error;
      this.loading.delete(id);

      throw error;
    }
  }

  /**
   * Load multiple assets with progress tracking
   */
  async loadMany(ids: string[], onProgress?: ProgressCallback): Promise<Map<string, MediaAsset>> {
    const results = new Map<string, MediaAsset>();
    let loaded = 0;

    for (const id of ids) {
      try {
        const asset = await this.load(id);
        results.set(id, asset);
        loaded++;

        if (onProgress) {
          onProgress(loaded, ids.length, asset);
        }
      } catch (error) {
        console.error(`Failed to load asset "${id}":`, error);

        if (onProgress) {
          onProgress(loaded, ids.length);
        }
      }
    }

    return results;
  }

  /**
   * Load all registered assets
   */
  async loadAll(onProgress?: ProgressCallback): Promise<Map<string, MediaAsset>> {
    const ids = Array.from(this.assets.keys()).filter(
      (id) => this.assets.get(id)!.status !== MediaStatus.LOADED
    );

    return this.loadMany(ids, onProgress);
  }

  /**
   * Get an asset by id
   */
  get(id: string): MediaAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get asset data
   */
  getData<T = HTMLImageElement | HTMLVideoElement | AudioBuffer>(id: string): T | undefined {
    return this.assets.get(id)?.data as T | undefined;
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(id: string): boolean {
    return this.assets.get(id)?.status === MediaStatus.LOADED;
  }

  /**
   * Check if asset is loading
   */
  isLoading(id: string): boolean {
    return this.loading.has(id);
  }

  /**
   * Unload an asset (free memory)
   */
  unload(id: string): void {
    const asset = this.assets.get(id);
    if (asset) {
      asset.data = undefined;
      asset.status = MediaStatus.PENDING;
    }
  }

  /**
   * Unload all assets
   */
  unloadAll(): void {
    for (const id of this.assets.keys()) {
      this.unload(id);
    }
  }

  /**
   * Remove an asset from registry
   */
  remove(id: string): boolean {
    return this.assets.delete(id);
  }

  /**
   * Clear all assets
   */
  clear(): void {
    this.assets.clear();
    this.loading.clear();
  }

  /**
   * Get all assets
   */
  getAll(): MediaAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by type
   */
  getByType(type: MediaType): MediaAsset[] {
    return Array.from(this.assets.values()).filter((asset) => asset.type === type);
  }

  /**
   * Get assets by status
   */
  getByStatus(status: MediaStatus): MediaAsset[] {
    return Array.from(this.assets.values()).filter((asset) => asset.status === status);
  }

  /**
   * Get loading progress
   */
  getProgress(): { loaded: number; total: number; percent: number } {
    const total = this.assets.size;
    const loaded = this.getByStatus(MediaStatus.LOADED).length;
    const percent = total > 0 ? (loaded / total) * 100 : 0;

    return { loaded, total, percent };
  }

  /**
   * Get memory usage estimate (in bytes)
   */
  getMemoryUsage(): number {
    let bytes = 0;

    for (const asset of this.assets.values()) {
      if (asset.status === MediaStatus.LOADED && asset.data) {
        switch (asset.type) {
          case MediaType.IMAGE: {
            const img = asset.data as HTMLImageElement;
            bytes += img.naturalWidth * img.naturalHeight * 4; // RGBA
            break;
          }

          case MediaType.VIDEO: {
            const video = asset.data as HTMLVideoElement;
            bytes += video.videoWidth * video.videoHeight * 4 * 30; // Estimate 30 frames
            break;
          }

          case MediaType.AUDIO: {
            const buffer = asset.data as AudioBuffer;
            bytes += buffer.length * buffer.numberOfChannels * 4; // Float32
            break;
          }
        }
      }
    }

    return bytes;
  }

  /**
   * Get memory usage in human-readable format
   */
  getMemoryUsageString(): string {
    const bytes = this.getMemoryUsage();

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Private: Load image
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      img.src = url;
    });
  }

  /**
   * Private: Load video
   */
  private loadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';

      video.onloadedmetadata = () => resolve(video);
      video.onerror = () => reject(new Error(`Failed to load video: ${url}`));

      video.src = url;
      video.load();
    });
  }

  /**
   * Private: Load audio
   */
  private async loadAudioAsset(url: string): Promise<AudioBuffer> {
    return loadAudio(url);
  }

  /**
   * Private: Wait for ongoing load
   */
  private waitForLoad(id: string): Promise<MediaAsset> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const asset = this.assets.get(id);

        if (!asset) {
          clearInterval(checkInterval);
          reject(new Error(`Asset "${id}" not found`));
          return;
        }

        if (asset.status === MediaStatus.LOADED) {
          clearInterval(checkInterval);
          resolve(asset);
        } else if (asset.status === MediaStatus.ERROR) {
          clearInterval(checkInterval);
          reject(asset.error || new Error(`Failed to load asset "${id}"`));
        }
      }, 100);
    });
  }

  /**
   * Create an asset catalog from a manifest
   */
  async loadManifest(
    manifest: { id: string; url: string; type: MediaType }[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    this.registerMany(manifest);
    await this.loadAll(onProgress);
  }

  /**
   * Export asset catalog
   */
  exportCatalog(): { id: string; url: string; type: MediaType }[] {
    return Array.from(this.assets.values()).map((asset) => ({
      id: asset.id,
      url: asset.url,
      type: asset.type,
    }));
  }
}

/**
 * Global convenience functions
 */

/**
 * Get the global MediaManager instance
 */
export function getMediaManager(): MediaManager {
  return MediaManager.getInstance();
}

/**
 * Register an asset
 */
export function registerAsset(id: string, url: string, type: MediaType): void {
  getMediaManager().register(id, url, type);
}

/**
 * Load an asset
 */
export async function loadAsset(id: string): Promise<MediaAsset> {
  return getMediaManager().load(id);
}

/**
 * Get an asset
 */
export function getAsset(id: string): MediaAsset | undefined {
  return getMediaManager().get(id);
}

/**
 * Get asset data
 */
export function getAssetData<T = HTMLImageElement | HTMLVideoElement | AudioBuffer>(
  id: string
): T | undefined {
  return getMediaManager().getData<T>(id);
}

/**
 * Preload assets from manifest
 */
export async function preloadAssets(
  manifest: { id: string; url: string; type: MediaType }[],
  onProgress?: ProgressCallback
): Promise<void> {
  await getMediaManager().loadManifest(manifest, onProgress);
}
