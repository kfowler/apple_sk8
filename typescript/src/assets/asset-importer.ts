/**
 * AssetImporter - Import assets from various sources
 *
 * Features:
 * - Import from File API (drag-drop or file picker)
 * - Import from URL with fetch
 * - Automatic thumbnail generation
 * - Image optimization (resize, compress)
 * - Format conversion where needed
 * - Batch import support
 * - Progress tracking
 */

import { AssetType, AssetRegistry, getAssetTypeFromFilename, getAssetTypeFromMimeType } from './asset-registry.js';
import { AssetLoader, ProgressCallback } from './asset-loader.js';

/**
 * Import options
 */
export interface ImportOptions {
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Generate thumbnail */
  generateThumbnail?: boolean;
  /** Thumbnail size (max width/height) */
  thumbnailSize?: number;
  /** Optimize images */
  optimizeImages?: boolean;
  /** Max image dimension (for optimization) */
  maxImageSize?: number;
  /** JPEG quality (0-1) */
  imageQuality?: number;
  /** Custom name for the asset */
  name?: string;
}

/**
 * Import result
 */
export interface ImportResult {
  assetId: string;
  name: string;
  type: AssetType;
  size: number;
  url: string;
  thumbnail?: string;
  error?: string;
}

/**
 * Batch import progress
 */
export interface BatchImportProgress {
  completed: number;
  total: number;
  current: string;
  results: ImportResult[];
}

export type BatchProgressCallback = (progress: BatchImportProgress) => void;

/**
 * AssetImporter - Handles importing assets from various sources
 */
export class AssetImporter {
  private registry: AssetRegistry;
  private loader: AssetLoader;

  constructor(registry: AssetRegistry, loader: AssetLoader) {
    this.registry = registry;
    this.loader = loader;
  }

  /**
   * Import from File object
   */
  async importFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const type = this.detectFileType(file);
      const name = options.name || file.name;

      // Create blob URL
      const blobUrl = this.loader.createBlobURL(file);

      // Generate thumbnail if requested
      let thumbnail: string | undefined;
      if (options.generateThumbnail !== false && (type === AssetType.IMAGE || type === AssetType.VIDEO)) {
        thumbnail = await this.generateThumbnail(blobUrl, type, options.thumbnailSize || 200);
      }

      // Optimize image if requested
      let finalUrl = blobUrl;
      let finalSize = file.size;
      if (options.optimizeImages && type === AssetType.IMAGE) {
        const optimized = await this.optimizeImage(blobUrl, {
          maxSize: options.maxImageSize || 2048,
          quality: options.imageQuality || 0.8,
        });
        finalUrl = optimized.url;
        finalSize = optimized.size;
      }

      // Register asset
      const assetId = this.registry.registerAsset(name, type, finalUrl, {
        size: finalSize,
        thumbnail,
        mimeType: file.type,
        originalFilename: file.name,
      });

      return {
        assetId,
        name,
        type,
        size: finalSize,
        url: finalUrl,
        thumbnail,
      };
    } catch (error) {
      return {
        assetId: '',
        name: options.name || file.name,
        type: AssetType.OTHER,
        size: 0,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Import from URL
   */
  async importURL(url: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      // Load asset
      const loaded = await this.loader.load(url, {
        onProgress: options.onProgress,
        useCache: true,
      });

      const name = options.name || this.getNameFromUrl(url);
      const type = loaded.type;

      // Generate thumbnail if requested
      let thumbnail: string | undefined;
      if (options.generateThumbnail !== false && (type === AssetType.IMAGE || type === AssetType.VIDEO)) {
        thumbnail = await this.generateThumbnail(url, type, options.thumbnailSize || 200);
      }

      // Register asset
      const assetId = this.registry.registerAsset(name, type, url, {
        size: loaded.size,
        thumbnail,
        mimeType: loaded.mimeType,
      });

      return {
        assetId,
        name,
        type,
        size: loaded.size,
        url,
        thumbnail,
      };
    } catch (error) {
      return {
        assetId: '',
        name: options.name || url,
        type: AssetType.OTHER,
        size: 0,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Import multiple files (batch)
   */
  async importFiles(
    files: FileList | File[],
    options: ImportOptions & { onBatchProgress?: BatchProgressCallback } = {}
  ): Promise<ImportResult[]> {
    const results: ImportResult[] = [];
    const fileArray = Array.from(files);
    const total = fileArray.length;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      // Report batch progress
      if (options.onBatchProgress) {
        options.onBatchProgress({
          completed: i,
          total,
          current: file.name,
          results: [...results],
        });
      }

      const result = await this.importFile(file, options);
      results.push(result);
    }

    // Report completion
    if (options.onBatchProgress) {
      options.onBatchProgress({
        completed: total,
        total,
        current: '',
        results,
      });
    }

    return results;
  }

  /**
   * Import from data URL
   */
  async importDataURL(dataUrl: string, name: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      // Parse data URL
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new Error('Invalid data URL');
      }

      const mimeType = match[1];
      const base64 = match[2];
      const type = getAssetTypeFromMimeType(mimeType);

      // Convert to blob
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = this.loader.createBlobURL(blob);

      // Generate thumbnail if requested
      let thumbnail: string | undefined;
      if (options.generateThumbnail !== false && (type === AssetType.IMAGE || type === AssetType.VIDEO)) {
        thumbnail = await this.generateThumbnail(blobUrl, type, options.thumbnailSize || 200);
      }

      // Register asset
      const assetId = this.registry.registerAsset(name, type, blobUrl, {
        size: blob.size,
        thumbnail,
        mimeType,
      });

      return {
        assetId,
        name,
        type,
        size: blob.size,
        url: blobUrl,
        thumbnail,
      };
    } catch (error) {
      return {
        assetId: '',
        name,
        type: AssetType.OTHER,
        size: 0,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate thumbnail for image or video
   */
  async generateThumbnail(
    url: string,
    type: AssetType,
    maxSize: number = 200
  ): Promise<string | undefined> {
    try {
      if (type === AssetType.IMAGE) {
        return await this.generateImageThumbnail(url, maxSize);
      } else if (type === AssetType.VIDEO) {
        return await this.generateVideoThumbnail(url, maxSize);
      }
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
    }
    return undefined;
  }

  /**
   * Generate thumbnail from image
   */
  private async generateImageThumbnail(url: string, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate thumbnail size
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Draw scaled image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to data URL
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = url;
    });
  }

  /**
   * Generate thumbnail from video (first frame)
   */
  private async generateVideoThumbnail(url: string, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      const handleLoaded = () => {
        try {
          // Seek to 1 second or 10% of duration
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
        } catch (error) {
          reject(error);
          cleanup();
        }
      };

      const handleSeeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            cleanup();
            return;
          }

          // Calculate thumbnail size
          const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;

          // Draw frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to data URL
          resolve(canvas.toDataURL('image/jpeg', 0.7));
          cleanup();
        } catch (error) {
          reject(error);
          cleanup();
        }
      };

      const handleError = () => {
        reject(new Error('Failed to load video for thumbnail'));
        cleanup();
      };

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', handleLoaded);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('loadedmetadata', handleLoaded);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      video.src = url;
    });
  }

  /**
   * Optimize image (resize and compress)
   */
  async optimizeImage(
    url: string,
    options: { maxSize: number; quality: number }
  ): Promise<{ url: string; size: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new size
          let width = img.width;
          let height = img.height;

          if (width > options.maxSize || height > options.maxSize) {
            const scale = Math.min(options.maxSize / width, options.maxSize / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              const optimizedUrl = this.loader.createBlobURL(blob);
              resolve({
                url: optimizedUrl,
                size: blob.size,
              });
            },
            'image/jpeg',
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = url;
    });
  }

  /**
   * Detect file type from File object
   */
  private detectFileType(file: File): AssetType {
    // Try MIME type first
    if (file.type) {
      const type = getAssetTypeFromMimeType(file.type);
      if (type !== AssetType.OTHER) {
        return type;
      }
    }

    // Fallback to filename
    return getAssetTypeFromFilename(file.name);
  }

  /**
   * Extract name from URL
   */
  private getNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      const filename = parts[parts.length - 1];
      return filename || 'asset';
    } catch {
      return 'asset';
    }
  }
}

/**
 * Create file input element for importing
 */
export function createFileInput(
  accept?: string,
  multiple: boolean = false,
  onSelect?: (files: FileList) => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = multiple;
  if (accept) {
    input.accept = accept;
  }
  input.style.display = 'none';

  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0 && onSelect) {
      onSelect(input.files);
    }
  });

  return input;
}

/**
 * Show file picker dialog
 */
export function showFilePicker(
  accept?: string,
  multiple: boolean = false
): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = createFileInput(accept, multiple, (files) => {
      resolve(files);
      input.remove();
    });

    document.body.appendChild(input);
    input.click();

    // Handle cancel
    const handleCancel = () => {
      setTimeout(() => {
        if (document.body.contains(input)) {
          resolve(null);
          input.remove();
        }
      }, 100);
    };

    input.addEventListener('cancel', handleCancel);
    window.addEventListener('focus', handleCancel, { once: true });
  });
}

/**
 * Common accept strings for different asset types
 */
export const AcceptStrings = {
  IMAGE: 'image/*',
  VIDEO: 'video/*',
  AUDIO: 'audio/*',
  JSON: 'application/json,.json',
  SCRIPT: '.js,.ts,.mjs',
  FONT: '.ttf,.otf,.woff,.woff2',
  ALL: '*/*',
};
