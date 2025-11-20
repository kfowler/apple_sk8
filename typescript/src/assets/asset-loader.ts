/**
 * AssetLoader - Asynchronous asset loading with caching and progress tracking
 *
 * Features:
 * - Async loading for images, video, audio, fonts, JSON
 * - In-memory caching to avoid duplicate loads
 * - IndexedDB caching for persistence
 * - Progress callbacks for UX
 * - Preloading queue with priority
 * - Error handling and retry logic
 * - Blob URL generation for local files
 */

import { AssetType, getAssetTypeFromMimeType } from './asset-registry.js';

/**
 * Load progress callback
 */
export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type ProgressCallback = (progress: LoadProgress) => void;

/**
 * Load options
 */
export interface LoadOptions {
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Use cache if available */
  useCache?: boolean;
  /** Number of retry attempts */
  retries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Priority for preload queue (higher = load sooner) */
  priority?: number;
}

/**
 * Loaded asset data
 */
export interface LoadedAsset<T = any> {
  data: T;
  url: string;
  type: AssetType;
  size: number;
  mimeType?: string;
}

/**
 * Cache entry
 */
interface CacheEntry<T = any> {
  data: T;
  url: string;
  type: AssetType;
  size: number;
  mimeType?: string;
  timestamp: number;
}

/**
 * Preload queue item
 */
interface PreloadItem {
  url: string;
  type: AssetType;
  options: LoadOptions;
  priority: number;
  resolve: (value: LoadedAsset) => void;
  reject: (error: Error) => void;
}

/**
 * IndexedDB database name and store
 */
const DB_NAME = 'SK8AssetCache';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

/**
 * AssetLoader - Manages asset loading and caching
 */
export class AssetLoader {
  private memoryCache = new Map<string, CacheEntry>();
  private loadingPromises = new Map<string, Promise<LoadedAsset>>();
  private preloadQueue: PreloadItem[] = [];
  private isProcessingQueue = false;
  private maxConcurrentLoads = 4;
  private currentLoads = 0;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available - persistent caching disabled');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
      };
    });
  }

  /**
   * Load an image
   */
  async loadImage(url: string, options: LoadOptions = {}): Promise<LoadedAsset<HTMLImageElement>> {
    return this.loadWithCache(url, options, async () => {
      return new Promise<LoadedAsset<HTMLImageElement>>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          resolve({
            data: img,
            url,
            type: AssetType.IMAGE,
            size: this.estimateImageSize(img),
            mimeType: this.getMimeTypeFromUrl(url),
          });
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = url;
      });
    });
  }

  /**
   * Load a video
   */
  async loadVideo(url: string, options: LoadOptions = {}): Promise<LoadedAsset<HTMLVideoElement>> {
    return this.loadWithCache(url, options, async () => {
      return new Promise<LoadedAsset<HTMLVideoElement>>((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';

        const handleLoaded = () => {
          resolve({
            data: video,
            url,
            type: AssetType.VIDEO,
            size: 0, // Video size is hard to estimate without loading
            mimeType: this.getMimeTypeFromUrl(url),
          });
          cleanup();
        };

        const handleError = () => {
          reject(new Error(`Failed to load video: ${url}`));
          cleanup();
        };

        const cleanup = () => {
          video.removeEventListener('loadeddata', handleLoaded);
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('loadeddata', handleLoaded);
        video.addEventListener('error', handleError);

        video.src = url;
        video.load();
      });
    });
  }

  /**
   * Load audio
   */
  async loadAudio(url: string, options: LoadOptions = {}): Promise<LoadedAsset<AudioBuffer>> {
    return this.loadWithCache(url, options, async () => {
      const arrayBuffer = await this.fetchWithProgress(url, options.onProgress);

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      return {
        data: audioBuffer,
        url,
        type: AssetType.AUDIO,
        size: arrayBuffer.byteLength,
        mimeType: this.getMimeTypeFromUrl(url),
      };
    });
  }

  /**
   * Load a font
   */
  async loadFont(
    url: string,
    fontFamily: string,
    options: LoadOptions = {}
  ): Promise<LoadedAsset<FontFace>> {
    return this.loadWithCache(url, options, async () => {
      const arrayBuffer = await this.fetchWithProgress(url, options.onProgress);

      const fontFace = new FontFace(fontFamily, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      return {
        data: fontFace,
        url,
        type: AssetType.FONT,
        size: arrayBuffer.byteLength,
        mimeType: 'font/' + this.getFileExtension(url),
      };
    });
  }

  /**
   * Load JSON
   */
  async loadJSON<T = any>(url: string, options: LoadOptions = {}): Promise<LoadedAsset<T>> {
    return this.loadWithCache(url, options, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${response.statusText}`);
      }

      const text = await response.text();
      const data = JSON.parse(text);

      return {
        data,
        url,
        type: AssetType.JSON,
        size: text.length,
        mimeType: 'application/json',
      };
    });
  }

  /**
   * Load text/script
   */
  async loadText(url: string, options: LoadOptions = {}): Promise<LoadedAsset<string>> {
    return this.loadWithCache(url, options, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load text: ${response.statusText}`);
      }

      const text = await response.text();

      return {
        data: text,
        url,
        type: AssetType.SCRIPT,
        size: text.length,
        mimeType: response.headers.get('content-type') || 'text/plain',
      };
    });
  }

  /**
   * Load any asset by URL (auto-detect type)
   */
  async load(url: string, options: LoadOptions = {}): Promise<LoadedAsset> {
    const type = this.detectAssetType(url);

    switch (type) {
      case AssetType.IMAGE:
        return this.loadImage(url, options);
      case AssetType.VIDEO:
        return this.loadVideo(url, options);
      case AssetType.AUDIO:
        return this.loadAudio(url, options);
      case AssetType.JSON:
        return this.loadJSON(url, options);
      case AssetType.SCRIPT:
        return this.loadText(url, options);
      default:
        // Load as blob for unknown types
        return this.loadBlob(url, options);
    }
  }

  /**
   * Load as blob (for any file type)
   */
  async loadBlob(url: string, options: LoadOptions = {}): Promise<LoadedAsset<Blob>> {
    return this.loadWithCache(url, options, async () => {
      const arrayBuffer = await this.fetchWithProgress(url, options.onProgress);
      const blob = new Blob([arrayBuffer]);
      const mimeType = this.getMimeTypeFromUrl(url);

      return {
        data: blob,
        url,
        type: getAssetTypeFromMimeType(mimeType || 'application/octet-stream'),
        size: arrayBuffer.byteLength,
        mimeType,
      };
    });
  }

  /**
   * Create blob URL from file
   */
  createBlobURL(file: File | Blob): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke blob URL
   */
  revokeBlobURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Fetch with progress tracking
   */
  private async fetchWithProgress(
    url: string,
    onProgress?: ProgressCallback
  ): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (!contentLength || !onProgress) {
      // No progress tracking available
      return response.arrayBuffer();
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return response.arrayBuffer();
    }

    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      onProgress({
        loaded,
        total: contentLength,
        percentage: (loaded / contentLength) * 100,
      });
    }

    // Combine chunks
    const arrayBuffer = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
      arrayBuffer.set(chunk, position);
      position += chunk.length;
    }

    return arrayBuffer.buffer;
  }

  /**
   * Load with caching and deduplication
   */
  private async loadWithCache<T>(
    url: string,
    options: LoadOptions,
    loader: () => Promise<LoadedAsset<T>>
  ): Promise<LoadedAsset<T>> {
    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url) as Promise<LoadedAsset<T>>;
    }

    // Check memory cache
    if (options.useCache !== false) {
      const cached = this.memoryCache.get(url);
      if (cached) {
        return Promise.resolve(cached as LoadedAsset<T>);
      }

      // Check IndexedDB cache
      const dbCached = await this.getFromIndexedDB(url);
      if (dbCached) {
        this.memoryCache.set(url, dbCached);
        return dbCached as LoadedAsset<T>;
      }
    }

    // Start loading
    const promise = this.loadWithRetry(loader, options.retries || 0);

    this.loadingPromises.set(url, promise as Promise<LoadedAsset>);

    try {
      const result = await promise;

      // Cache result
      if (options.useCache !== false) {
        const cacheEntry: CacheEntry<T> = {
          ...result,
          timestamp: Date.now(),
        };
        this.memoryCache.set(url, cacheEntry);
        await this.saveToIndexedDB(url, cacheEntry);
      }

      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Load with retry logic
   */
  private async loadWithRetry<T>(
    loader: () => Promise<T>,
    retries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await loader();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * Preload asset (add to queue)
   */
  preload(url: string, type: AssetType, options: LoadOptions = {}): Promise<LoadedAsset> {
    return new Promise((resolve, reject) => {
      this.preloadQueue.push({
        url,
        type,
        options,
        priority: options.priority || 0,
        resolve,
        reject,
      });

      // Sort by priority (higher first)
      this.preloadQueue.sort((a, b) => b.priority - a.priority);

      this.processPreloadQueue();
    });
  }

  /**
   * Process preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.preloadQueue.length > 0 && this.currentLoads < this.maxConcurrentLoads) {
      const item = this.preloadQueue.shift();
      if (!item) break;

      this.currentLoads++;

      this.load(item.url, item.options)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.currentLoads--;
          this.processPreloadQueue();
        });
    }

    this.isProcessingQueue = false;
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Clear IndexedDB cache
   */
  async clearIndexedDBCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.clearMemoryCache();
    await this.clearIndexedDBCache();
  }

  /**
   * Get from IndexedDB
   */
  private async getFromIndexedDB(url: string): Promise<CacheEntry | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result as CacheEntry);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        resolve(null); // Don't fail, just return null
      };
    });
  }

  /**
   * Save to IndexedDB
   */
  private async saveToIndexedDB(url: string, entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...entry, url });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('IndexedDB save error:', request.error);
        resolve(); // Don't fail on cache save errors
      };
    });
  }

  /**
   * Detect asset type from URL
   */
  private detectAssetType(url: string): AssetType {
    const ext = this.getFileExtension(url);
    const mimeType = this.getMimeTypeFromUrl(url);

    if (mimeType) {
      return getAssetTypeFromMimeType(mimeType);
    }

    // Fallback to extension
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
    const fontExts = ['ttf', 'otf', 'woff', 'woff2'];

    if (imageExts.includes(ext)) return AssetType.IMAGE;
    if (videoExts.includes(ext)) return AssetType.VIDEO;
    if (audioExts.includes(ext)) return AssetType.AUDIO;
    if (fontExts.includes(ext)) return AssetType.FONT;
    if (ext === 'json') return AssetType.JSON;
    if (['js', 'ts', 'mjs'].includes(ext)) return AssetType.SCRIPT;

    return AssetType.OTHER;
  }

  /**
   * Get file extension from URL
   */
  private getFileExtension(url: string): string {
    const path = url.split('?')[0]; // Remove query string
    const parts = path.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  /**
   * Get MIME type from URL (basic detection)
   */
  private getMimeTypeFromUrl(url: string): string | undefined {
    const ext = this.getFileExtension(url);
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      json: 'application/json',
      js: 'application/javascript',
      ts: 'application/typescript',
      ttf: 'font/ttf',
      otf: 'font/otf',
      woff: 'font/woff',
      woff2: 'font/woff2',
    };

    return mimeTypes[ext];
  }

  /**
   * Estimate image size
   */
  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimate: width * height * 4 bytes per pixel
    return img.width * img.height * 4;
  }
}

/**
 * Singleton instance for global asset loader
 */
let globalLoader: AssetLoader | null = null;

/**
 * Get or create the global asset loader
 */
export function getGlobalAssetLoader(): AssetLoader {
  if (!globalLoader) {
    globalLoader = new AssetLoader();
  }
  return globalLoader;
}

/**
 * Set the global asset loader (useful for testing)
 */
export function setGlobalAssetLoader(loader: AssetLoader): void {
  globalLoader = loader;
}
