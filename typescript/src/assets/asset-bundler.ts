/**
 * AssetBundler - Bundle and optimize assets for deployment
 *
 * Features:
 * - Bundle assets for deployment
 * - Base64 embedding for small assets (<10KB)
 * - External file output for large assets
 * - Generate asset manifest JSON
 * - Optimize image sizes (responsive)
 * - Audio/video format detection
 * - Output to dist/assets/
 */

import { AssetRegistry, AssetMetadata, AssetType, formatBytes } from './asset-registry.js';

/**
 * Bundle options
 */
export interface BundleOptions {
  /** Output directory */
  outputDir?: string;
  /** Base64 embed threshold in bytes (default: 10KB) */
  embedThreshold?: number;
  /** Generate sourcemap for manifest */
  sourcemap?: boolean;
  /** Minify JSON */
  minify?: boolean;
  /** Include unused assets */
  includeUnused?: boolean;
  /** Optimize images */
  optimizeImages?: boolean;
  /** Image quality (0-1) */
  imageQuality?: number;
  /** Generate responsive image sizes */
  responsiveImages?: boolean;
  /** Responsive sizes (widths) */
  responsiveSizes?: number[];
}

/**
 * Bundle result
 */
export interface BundleResult {
  /** Total assets bundled */
  totalAssets: number;
  /** Assets embedded as base64 */
  embeddedCount: number;
  /** Assets as external files */
  externalCount: number;
  /** Total size in bytes */
  totalSize: number;
  /** Embedded size in bytes */
  embeddedSize: number;
  /** External size in bytes */
  externalSize: number;
  /** Manifest data */
  manifest: AssetManifest;
  /** External files (filename -> data) */
  files: Map<string, Blob>;
}

/**
 * Asset manifest entry
 */
export interface AssetManifestEntry {
  id: string;
  name: string;
  type: AssetType;
  size: number;
  /** Embedded data URL or external file path */
  url: string;
  /** Whether this asset is embedded */
  embedded: boolean;
  /** Original URL */
  originalUrl?: string;
  /** Thumbnail (if any) */
  thumbnail?: string;
  /** Responsive versions (for images) */
  responsive?: {
    width: number;
    url: string;
  }[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Asset manifest
 */
export interface AssetManifest {
  version: string;
  generated: number;
  assets: AssetManifestEntry[];
  stats: {
    totalAssets: number;
    totalSize: number;
    embeddedCount: number;
    embeddedSize: number;
    externalCount: number;
    externalSize: number;
    byType: Record<AssetType, { count: number; size: number }>;
  };
}

/**
 * AssetBundler - Bundles assets for deployment
 */
export class AssetBundler {
  private registry: AssetRegistry;

  constructor(registry: AssetRegistry) {
    this.registry = registry;
  }

  /**
   * Bundle all assets
   */
  async bundle(options: BundleOptions = {}): Promise<BundleResult> {
    const opts = this.getDefaultOptions(options);

    // Get assets to bundle
    let assets = this.registry.getAllAssets();
    if (!opts.includeUnused) {
      assets = assets.filter((asset) => this.registry.isAssetUsed(asset.id));
    }

    const manifestEntries: AssetManifestEntry[] = [];
    const externalFiles = new Map<string, Blob>();
    let embeddedCount = 0;
    let externalCount = 0;
    let embeddedSize = 0;
    let externalSize = 0;
    let totalSize = 0;

    // Process each asset
    for (const asset of assets) {
      const result = await this.bundleAsset(asset, opts);

      if (result.embedded) {
        embeddedCount++;
        embeddedSize += result.size;
      } else {
        externalCount++;
        externalSize += result.size;
        if (result.file) {
          externalFiles.set(result.filename!, result.file);
        }
      }

      totalSize += result.size;
      manifestEntries.push(result.entry);
    }

    // Create manifest
    const manifest = this.createManifest(manifestEntries, {
      totalAssets: assets.length,
      totalSize,
      embeddedCount,
      embeddedSize,
      externalCount,
      externalSize,
    });

    // Add manifest as JSON file
    const manifestJson = JSON.stringify(manifest, null, opts.minify ? 0 : 2);
    const manifestBlob = new Blob([manifestJson], { type: 'application/json' });
    externalFiles.set('manifest.json', manifestBlob);

    return {
      totalAssets: assets.length,
      embeddedCount,
      externalCount,
      totalSize,
      embeddedSize,
      externalSize,
      manifest,
      files: externalFiles,
    };
  }

  /**
   * Bundle a single asset
   */
  private async bundleAsset(
    asset: AssetMetadata,
    options: Required<BundleOptions>
  ): Promise<{
    entry: AssetManifestEntry;
    embedded: boolean;
    size: number;
    filename?: string;
    file?: Blob;
  }> {
    const shouldEmbed = asset.size <= options.embedThreshold;

    // Handle embedded assets
    if (shouldEmbed) {
      const dataUrl = await this.assetToDataURL(asset);
      return {
        entry: {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          size: asset.size,
          url: dataUrl,
          embedded: true,
          originalUrl: asset.url,
          thumbnail: asset.thumbnail,
          metadata: asset.metadata,
        },
        embedded: true,
        size: asset.size,
      };
    }

    // Handle external assets
    const filename = this.generateFilename(asset);
    const blob = await this.assetToBlob(asset);

    // Handle responsive images
    let responsive: AssetManifestEntry['responsive'];
    if (options.responsiveImages && asset.type === AssetType.IMAGE) {
      responsive = await this.generateResponsiveImages(asset, options);
    }

    return {
      entry: {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        size: blob.size,
        url: `./assets/${filename}`,
        embedded: false,
        originalUrl: asset.url,
        thumbnail: asset.thumbnail,
        responsive,
        metadata: asset.metadata,
      },
      embedded: false,
      size: blob.size,
      filename,
      file: blob,
    };
  }

  /**
   * Convert asset to data URL
   */
  private async assetToDataURL(asset: AssetMetadata): Promise<string> {
    // If already a data URL, return as-is
    if (asset.url.startsWith('data:')) {
      return asset.url;
    }

    // Fetch and convert to data URL
    const response = await fetch(asset.url);
    const blob = await response.blob();
    return this.blobToDataURL(blob);
  }

  /**
   * Convert asset to Blob
   */
  private async assetToBlob(asset: AssetMetadata): Promise<Blob> {
    // If blob URL, fetch it
    if (asset.url.startsWith('blob:')) {
      const response = await fetch(asset.url);
      return response.blob();
    }

    // If data URL, convert to blob
    if (asset.url.startsWith('data:')) {
      return this.dataURLToBlob(asset.url);
    }

    // Otherwise, fetch from URL
    const response = await fetch(asset.url);
    return response.blob();
  }

  /**
   * Convert blob to data URL
   */
  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert data URL to blob
   */
  private dataURLToBlob(dataUrl: string): Blob {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URL');
    }

    const mimeType = match[1];
    const base64 = match[2];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Generate filename for asset
   */
  private generateFilename(asset: AssetMetadata): string {
    const ext = this.getExtensionForType(asset.type, asset.mimeType);
    const safeName = asset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${asset.id.substring(0, 8)}_${safeName}.${ext}`;
  }

  /**
   * Get file extension for asset type
   */
  private getExtensionForType(type: AssetType, mimeType?: string): string {
    if (mimeType) {
      const mimeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'application/json': 'json',
        'application/javascript': 'js',
        'font/ttf': 'ttf',
        'font/otf': 'otf',
        'font/woff': 'woff',
        'font/woff2': 'woff2',
      };

      if (mimeMap[mimeType]) {
        return mimeMap[mimeType];
      }
    }

    const typeMap: Record<AssetType, string> = {
      [AssetType.IMAGE]: 'png',
      [AssetType.VIDEO]: 'mp4',
      [AssetType.AUDIO]: 'mp3',
      [AssetType.FONT]: 'ttf',
      [AssetType.JSON]: 'json',
      [AssetType.SCRIPT]: 'js',
      [AssetType.OTHER]: 'bin',
    };

    return typeMap[type] || 'bin';
  }

  /**
   * Generate responsive image versions
   */
  private async generateResponsiveImages(
    asset: AssetMetadata,
    options: Required<BundleOptions>
  ): Promise<AssetManifestEntry['responsive']> {
    const sizes = options.responsiveSizes || [320, 640, 1024, 1920];
    const responsive: AssetManifestEntry['responsive'] = [];

    try {
      const img = await this.loadImage(asset.url);

      for (const width of sizes) {
        if (width >= img.width) continue; // Don't upscale

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const scale = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', options.imageQuality);
        responsive.push({
          width,
          url: dataUrl,
        });
      }
    } catch (error) {
      console.error('Failed to generate responsive images:', error);
    }

    return responsive;
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Create asset manifest
   */
  private createManifest(
    entries: AssetManifestEntry[],
    stats: {
      totalAssets: number;
      totalSize: number;
      embeddedCount: number;
      embeddedSize: number;
      externalCount: number;
      externalSize: number;
    }
  ): AssetManifest {
    // Calculate stats by type
    const byType: Record<AssetType, { count: number; size: number }> = {
      [AssetType.IMAGE]: { count: 0, size: 0 },
      [AssetType.VIDEO]: { count: 0, size: 0 },
      [AssetType.AUDIO]: { count: 0, size: 0 },
      [AssetType.FONT]: { count: 0, size: 0 },
      [AssetType.JSON]: { count: 0, size: 0 },
      [AssetType.SCRIPT]: { count: 0, size: 0 },
      [AssetType.OTHER]: { count: 0, size: 0 },
    };

    for (const entry of entries) {
      byType[entry.type].count++;
      byType[entry.type].size += entry.size;
    }

    return {
      version: '1.0.0',
      generated: Date.now(),
      assets: entries,
      stats: {
        ...stats,
        byType,
      },
    };
  }

  /**
   * Get default options
   */
  private getDefaultOptions(options: BundleOptions): Required<BundleOptions> {
    return {
      outputDir: options.outputDir || './dist/assets',
      embedThreshold: options.embedThreshold ?? 10 * 1024, // 10KB
      sourcemap: options.sourcemap ?? false,
      minify: options.minify ?? false,
      includeUnused: options.includeUnused ?? false,
      optimizeImages: options.optimizeImages ?? true,
      imageQuality: options.imageQuality ?? 0.85,
      responsiveImages: options.responsiveImages ?? false,
      responsiveSizes: options.responsiveSizes || [320, 640, 1024, 1920],
    };
  }

  /**
   * Generate bundle report (human-readable)
   */
  generateReport(result: BundleResult): string {
    const lines: string[] = [];
    lines.push('Asset Bundle Report');
    lines.push('==================\n');

    lines.push(`Total Assets: ${result.totalAssets}`);
    lines.push(`Total Size: ${formatBytes(result.totalSize)}\n`);

    lines.push(`Embedded Assets: ${result.embeddedCount}`);
    lines.push(`Embedded Size: ${formatBytes(result.embeddedSize)}`);
    lines.push(
      `Percentage: ${((result.embeddedSize / result.totalSize) * 100).toFixed(1)}%\n`
    );

    lines.push(`External Assets: ${result.externalCount}`);
    lines.push(`External Size: ${formatBytes(result.externalSize)}`);
    lines.push(
      `Percentage: ${((result.externalSize / result.totalSize) * 100).toFixed(1)}%\n`
    );

    lines.push('By Type:');
    for (const [type, stats] of Object.entries(result.manifest.stats.byType)) {
      if (stats.count > 0) {
        lines.push(`  ${type}: ${stats.count} (${formatBytes(stats.size)})`);
      }
    }

    lines.push('\nExternal Files:');
    for (const [filename, blob] of Array.from(result.files.entries())) {
      lines.push(`  ${filename} - ${formatBytes(blob.size)}`);
    }

    return lines.join('\n');
  }

  /**
   * Export bundle to downloadable zip (requires JSZip or similar)
   * This is a placeholder - actual implementation would need a zip library
   */
  async exportToZip(result: BundleResult): Promise<Blob> {
    // This would require a zip library like JSZip
    // For now, just create a tarball-like structure
    console.warn('ZIP export not implemented - would require JSZip library');

    // Return manifest as placeholder
    const manifestJson = JSON.stringify(result.manifest, null, 2);
    return new Blob([manifestJson], { type: 'application/json' });
  }

  /**
   * Write bundle to file system (Node.js only)
   * This is a placeholder for Node.js usage
   */
  async writeToDisk(_result: BundleResult, _outputDir: string): Promise<void> {
    throw new Error('writeToDisk is only available in Node.js environment');
  }
}

/**
 * Load manifest from JSON
 */
export function loadManifest(json: string): AssetManifest {
  return JSON.parse(json);
}

/**
 * Validate manifest structure
 */
export function validateManifest(manifest: any): boolean {
  if (!manifest || typeof manifest !== 'object') return false;
  if (!manifest.version || !manifest.generated || !Array.isArray(manifest.assets)) return false;
  if (!manifest.stats || typeof manifest.stats !== 'object') return false;

  return true;
}
