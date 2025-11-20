/**
 * AssetLibrary - Visual UI for managing project assets
 *
 * Features:
 * - Grid view of all project assets
 * - Thumbnail generation and display
 * - Search and filter by type
 * - Drag-drop to canvas creates actor
 * - Import assets via file picker or URL
 * - Delete with confirmation
 * - Asset usage indicator (ref count)
 * - Preview panel on selection
 */

import {
  AssetRegistry,
  AssetMetadata,
  AssetType,
  formatBytes,
  AssetRegistryEvent,
} from '../assets/asset-registry.js';
import { AssetImporter, showFilePicker, AcceptStrings } from '../assets/asset-importer.js';
import { AssetLoader } from '../assets/asset-loader.js';
import { SK8Stage } from '../graphics/SK8Stage.js';
import { SK8Picture } from '../actors/Picture.js';
import { SK8MovieRectangle } from '../actors/MovieRectangle.js';
import { SK8Sound } from '../actors/Sound.js';

/**
 * Asset library view mode
 */
export enum ViewMode {
  GRID = 'grid',
  LIST = 'list',
}

/**
 * Asset library options
 */
export interface AssetLibraryOptions {
  /** Container element */
  container: HTMLElement;
  /** Asset registry */
  registry: AssetRegistry;
  /** Asset loader */
  loader: AssetLoader;
  /** Asset importer */
  importer: AssetImporter;
  /** Stage (for creating actors) */
  stage?: SK8Stage;
  /** Initial view mode */
  viewMode?: ViewMode;
  /** Show thumbnails */
  showThumbnails?: boolean;
  /** Thumbnail size */
  thumbnailSize?: number;
}

/**
 * AssetLibrary - UI component for asset management
 */
export class AssetLibrary {
  private container: HTMLElement;
  private registry: AssetRegistry;
  private loader: AssetLoader;
  private importer: AssetImporter;
  private stage?: SK8Stage;

  private viewMode: ViewMode;
  private showThumbnails: boolean;
  private thumbnailSize: number;

  private selectedAsset: AssetMetadata | null = null;
  private filterType: AssetType | null = null;
  private searchQuery: string = '';

  // UI elements
  private headerEl!: HTMLElement;
  private toolbarEl!: HTMLElement;
  private searchEl!: HTMLInputElement;
  private filterEl!: HTMLSelectElement;
  private gridEl!: HTMLElement;
  private previewEl!: HTMLElement;
  private statusEl!: HTMLElement;

  constructor(options: AssetLibraryOptions) {
    this.container = options.container;
    this.registry = options.registry;
    this.loader = options.loader;
    this.importer = options.importer;
    this.stage = options.stage;

    this.viewMode = options.viewMode || ViewMode.GRID;
    this.showThumbnails = options.showThumbnails ?? true;
    this.thumbnailSize = options.thumbnailSize || 120;

    this.createUI();
    this.attachEventListeners();
    this.refresh();
  }

  /**
   * Create UI structure
   */
  private createUI(): void {
    this.container.className = 'sk8-asset-library';
    this.container.innerHTML = `
      <div class="asset-library-header">
        <h3>Asset Library</h3>
        <button class="close-btn" title="Close">&times;</button>
      </div>
      <div class="asset-library-toolbar">
        <button class="btn-import" title="Import Assets">
          <span class="icon">📁</span> Import
        </button>
        <button class="btn-import-url" title="Import from URL">
          <span class="icon">🔗</span> URL
        </button>
        <button class="btn-refresh" title="Refresh">
          <span class="icon">🔄</span>
        </button>
        <div class="spacer"></div>
        <input type="text" class="search-input" placeholder="Search assets..." />
        <select class="filter-select">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="font">Fonts</option>
          <option value="json">JSON</option>
          <option value="script">Scripts</option>
          <option value="other">Other</option>
        </select>
        <button class="btn-view-mode" title="Toggle View Mode">
          <span class="icon">⊞</span>
        </button>
      </div>
      <div class="asset-library-content">
        <div class="asset-grid"></div>
        <div class="asset-preview">
          <div class="preview-empty">Select an asset to preview</div>
        </div>
      </div>
      <div class="asset-library-status">
        <span class="status-text">0 assets</span>
      </div>
    `;

    // Get element references
    this.headerEl = this.container.querySelector('.asset-library-header')!;
    this.toolbarEl = this.container.querySelector('.asset-library-toolbar')!;
    this.searchEl = this.container.querySelector('.search-input')!;
    this.filterEl = this.container.querySelector('.filter-select')!;
    this.gridEl = this.container.querySelector('.asset-grid')!;
    this.previewEl = this.container.querySelector('.asset-preview')!;
    this.statusEl = this.container.querySelector('.status-text')!;

    // Apply styles
    this.applyStyles();
  }

  /**
   * Apply CSS styles
   */
  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .sk8-asset-library {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #2a2a2a;
        color: #ddd;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
      }

      .asset-library-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #1e1e1e;
        border-bottom: 1px solid #444;
      }

      .asset-library-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }

      .close-btn {
        background: none;
        border: none;
        color: #999;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
      }

      .close-btn:hover {
        color: #fff;
      }

      .asset-library-toolbar {
        display: flex;
        gap: 8px;
        padding: 8px;
        background: #252525;
        border-bottom: 1px solid #444;
        align-items: center;
      }

      .asset-library-toolbar button {
        padding: 6px 12px;
        background: #3a3a3a;
        border: 1px solid #555;
        color: #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .asset-library-toolbar button:hover {
        background: #454545;
      }

      .asset-library-toolbar .spacer {
        flex: 1;
      }

      .search-input, .filter-select {
        padding: 6px 8px;
        background: #3a3a3a;
        border: 1px solid #555;
        color: #ddd;
        border-radius: 4px;
        font-size: 12px;
      }

      .search-input {
        width: 200px;
      }

      .asset-library-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .asset-grid {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        align-content: start;
      }

      .asset-item {
        background: #333;
        border: 2px solid #444;
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: all 0.2s;
      }

      .asset-item:hover {
        background: #3a3a3a;
        border-color: #666;
      }

      .asset-item.selected {
        background: #2a4a7a;
        border-color: #4a7aba;
      }

      .asset-item.dragging {
        opacity: 0.5;
      }

      .asset-thumbnail {
        width: 100%;
        aspect-ratio: 1;
        background: #2a2a2a;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .asset-thumbnail img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .asset-thumbnail .icon {
        font-size: 32px;
      }

      .asset-name {
        font-size: 11px;
        word-break: break-word;
        margin-bottom: 4px;
      }

      .asset-info {
        font-size: 10px;
        color: #999;
      }

      .asset-refs {
        font-size: 10px;
        color: #7ac;
        margin-top: 2px;
      }

      .asset-preview {
        width: 300px;
        background: #252525;
        border-left: 1px solid #444;
        padding: 16px;
        overflow-y: auto;
        display: none;
      }

      .asset-preview.visible {
        display: block;
      }

      .preview-empty {
        color: #777;
        text-align: center;
        padding-top: 40px;
      }

      .preview-thumbnail {
        width: 100%;
        background: #2a2a2a;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        margin-bottom: 16px;
      }

      .preview-thumbnail img {
        max-width: 100%;
        max-height: 300px;
        object-fit: contain;
      }

      .preview-info {
        margin-bottom: 16px;
      }

      .preview-info h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
      }

      .preview-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #333;
      }

      .preview-label {
        color: #999;
      }

      .preview-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .preview-actions button {
        flex: 1;
        padding: 8px;
        background: #3a3a3a;
        border: 1px solid #555;
        color: #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .preview-actions button:hover {
        background: #454545;
      }

      .preview-actions button.danger {
        background: #6a3a3a;
        border-color: #844;
      }

      .preview-actions button.danger:hover {
        background: #7a4545;
      }

      .asset-library-status {
        padding: 6px 12px;
        background: #1e1e1e;
        border-top: 1px solid #444;
        font-size: 11px;
        color: #999;
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #777;
      }

      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Close button
    const closeBtn = this.headerEl.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Import buttons
    const importBtn = this.toolbarEl.querySelector('.btn-import');
    importBtn?.addEventListener('click', () => this.handleImport());

    const importUrlBtn = this.toolbarEl.querySelector('.btn-import-url');
    importUrlBtn?.addEventListener('click', () => this.handleImportURL());

    // Refresh button
    const refreshBtn = this.toolbarEl.querySelector('.btn-refresh');
    refreshBtn?.addEventListener('click', () => this.refresh());

    // View mode toggle
    const viewModeBtn = this.toolbarEl.querySelector('.btn-view-mode');
    viewModeBtn?.addEventListener('click', () => this.toggleViewMode());

    // Search
    this.searchEl.addEventListener('input', () => {
      this.searchQuery = this.searchEl.value;
      this.refresh();
    });

    // Filter
    this.filterEl.addEventListener('change', () => {
      this.filterType = this.filterEl.value ? (this.filterEl.value as AssetType) : null;
      this.refresh();
    });

    // Registry events
    this.registry.addEventListener('assetAdded', (event: AssetRegistryEvent) => this.refresh());
    this.registry.addEventListener('assetRemoved', (event: AssetRegistryEvent) => this.refresh());
    this.registry.addEventListener('assetUpdated', (event: AssetRegistryEvent) => this.refresh());
    this.registry.addEventListener('referenceChanged', (event: AssetRegistryEvent) => this.refresh());
  }

  /**
   * Refresh asset display
   */
  refresh(): void {
    // Get filtered assets
    let assets = this.registry.getAllAssets();

    if (this.filterType) {
      assets = assets.filter((asset) => asset.type === this.filterType);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      assets = assets.filter((asset) => asset.name.toLowerCase().includes(query));
    }

    // Sort by name
    assets.sort((a, b) => a.name.localeCompare(b.name));

    // Render grid
    this.renderGrid(assets);

    // Update status
    this.updateStatus(assets.length);

    // Update preview if selected asset was removed
    if (this.selectedAsset && !this.registry.hasAsset(this.selectedAsset.id)) {
      this.selectedAsset = null;
      this.hidePreview();
    }
  }

  /**
   * Render asset grid
   */
  private renderGrid(assets: AssetMetadata[]): void {
    this.gridEl.innerHTML = '';

    if (assets.length === 0) {
      this.gridEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div>No assets found</div>
          <div style="margin-top: 8px; font-size: 11px;">
            Click "Import" to add assets to your project
          </div>
        </div>
      `;
      return;
    }

    for (const asset of assets) {
      const item = this.createAssetItem(asset);
      this.gridEl.appendChild(item);
    }
  }

  /**
   * Create asset item element
   */
  private createAssetItem(asset: AssetMetadata): HTMLElement {
    const item = document.createElement('div');
    item.className = 'asset-item';
    item.draggable = true;

    if (this.selectedAsset?.id === asset.id) {
      item.classList.add('selected');
    }

    // Thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'asset-thumbnail';

    if (asset.thumbnail && this.showThumbnails) {
      const img = document.createElement('img');
      img.src = asset.thumbnail;
      img.alt = asset.name;
      thumbnail.appendChild(img);
    } else {
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = this.getIconForType(asset.type);
      thumbnail.appendChild(icon);
    }

    item.appendChild(thumbnail);

    // Name
    const name = document.createElement('div');
    name.className = 'asset-name';
    name.textContent = asset.name;
    item.appendChild(name);

    // Info
    const info = document.createElement('div');
    info.className = 'asset-info';
    info.textContent = formatBytes(asset.size);
    item.appendChild(info);

    // Reference count
    const refCount = this.registry.getReferenceCount(asset.id);
    if (refCount > 0) {
      const refs = document.createElement('div');
      refs.className = 'asset-refs';
      refs.textContent = `${refCount} reference${refCount === 1 ? '' : 's'}`;
      item.appendChild(refs);
    }

    // Events
    item.addEventListener('click', () => this.selectAsset(asset));
    item.addEventListener('dblclick', () => this.handleAssetDoubleClick(asset));

    // Drag events
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer!.effectAllowed = 'copy';
      e.dataTransfer!.setData('text/plain', asset.id);
      e.dataTransfer!.setData('application/x-sk8-asset', JSON.stringify(asset));
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });

    return item;
  }

  /**
   * Get icon for asset type
   */
  private getIconForType(type: AssetType): string {
    const icons: Record<AssetType, string> = {
      [AssetType.IMAGE]: '🖼️',
      [AssetType.VIDEO]: '🎬',
      [AssetType.AUDIO]: '🔊',
      [AssetType.FONT]: '🔤',
      [AssetType.JSON]: '📋',
      [AssetType.SCRIPT]: '📜',
      [AssetType.OTHER]: '📄',
    };
    return icons[type] || '📄';
  }

  /**
   * Select asset
   */
  private selectAsset(asset: AssetMetadata): void {
    this.selectedAsset = asset;
    this.showPreview(asset);
    this.refresh();
  }

  /**
   * Show asset preview
   */
  private showPreview(asset: AssetMetadata): void {
    this.previewEl.classList.add('visible');
    this.previewEl.innerHTML = `
      <div class="preview-thumbnail">
        ${
          asset.thumbnail
            ? `<img src="${asset.thumbnail}" alt="${asset.name}" />`
            : `<span class="icon" style="font-size: 64px">${this.getIconForType(asset.type)}</span>`
        }
      </div>
      <div class="preview-info">
        <h4>${asset.name}</h4>
        <div class="preview-row">
          <span class="preview-label">Type:</span>
          <span>${asset.type}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Size:</span>
          <span>${formatBytes(asset.size)}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">References:</span>
          <span>${this.registry.getReferenceCount(asset.id)}</span>
        </div>
        ${
          asset.originalFilename
            ? `<div class="preview-row">
                <span class="preview-label">Original:</span>
                <span>${asset.originalFilename}</span>
              </div>`
            : ''
        }
        <div class="preview-row">
          <span class="preview-label">Created:</span>
          <span>${new Date(asset.created).toLocaleString()}</span>
        </div>
      </div>
      <div class="preview-actions">
        <button class="btn-use">Use</button>
        <button class="btn-delete danger">Delete</button>
      </div>
    `;

    // Attach action handlers
    const useBtn = this.previewEl.querySelector('.btn-use');
    useBtn?.addEventListener('click', () => this.handleAssetDoubleClick(asset));

    const deleteBtn = this.previewEl.querySelector('.btn-delete');
    deleteBtn?.addEventListener('click', () => this.handleDelete(asset));
  }

  /**
   * Hide preview
   */
  private hidePreview(): void {
    this.previewEl.classList.remove('visible');
    this.previewEl.innerHTML = '<div class="preview-empty">Select an asset to preview</div>';
  }

  /**
   * Handle asset double-click (create actor)
   */
  private handleAssetDoubleClick(asset: AssetMetadata): void {
    if (!this.stage) {
      console.warn('No stage available - cannot create actor');
      return;
    }

    this.createActorFromAsset(asset);
  }

  /**
   * Create actor from asset
   */
  private createActorFromAsset(asset: AssetMetadata): void {
    if (!this.stage) return;

    // Center of stage
    const x = this.stage.getWidth() / 2 - 100;
    const y = this.stage.getHeight() / 2 - 100;

    let actor;

    switch (asset.type) {
      case AssetType.IMAGE:
        actor = new SK8Picture();
        actor.setBoundsRect({ left: x, top: y, right: x + 200, bottom: y + 200 });
        actor.setSource(asset.url);
        break;

      case AssetType.VIDEO:
        actor = new SK8MovieRectangle();
        actor.setBoundsRect({ left: x, top: y, right: x + 320, bottom: y + 240 });
        actor.setSource(asset.url);
        break;

      case AssetType.AUDIO:
        actor = new SK8Sound();
        actor.setSource(asset.url);
        break;

      default:
        console.warn(`Cannot create actor for asset type: ${asset.type}`);
        return;
    }

    if (actor) {
      this.stage.addActor(actor);
      this.registry.addReference(asset.id, actor.getObjectId());
    }
  }

  /**
   * Handle import
   */
  private async handleImport(): Promise<void> {
    const files = await showFilePicker(AcceptStrings.ALL, true);
    if (!files) return;

    // TODO: Show progress dialog
    const results = await this.importer.importFiles(files, {
      generateThumbnail: true,
      onBatchProgress: (progress) => {
        this.updateStatus(`Importing ${progress.current}... (${progress.completed}/${progress.total})`);
      },
    });

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Failed to import some assets:', errors);
      alert(`Failed to import ${errors.length} asset(s)`);
    }

    this.refresh();
  }

  /**
   * Handle import from URL
   */
  private async handleImportURL(): Promise<void> {
    const url = prompt('Enter asset URL:');
    if (!url) return;

    try {
      this.updateStatus('Importing from URL...');
      const result = await this.importer.importURL(url, {
        generateThumbnail: true,
      });

      if (result.error) {
        alert(`Failed to import: ${result.error}`);
      } else {
        this.refresh();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import asset from URL');
    }
  }

  /**
   * Handle delete
   */
  private handleDelete(asset: AssetMetadata): void {
    const refCount = this.registry.getReferenceCount(asset.id);

    if (refCount > 0) {
      const confirm = window.confirm(
        `This asset is used by ${refCount} object(s). Delete anyway?`
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm(`Delete "${asset.name}"?`);
      if (!confirm) return;
    }

    this.registry.unregisterAsset(asset.id);
    this.selectedAsset = null;
    this.hidePreview();
    this.refresh();
  }

  /**
   * Toggle view mode
   */
  private toggleViewMode(): void {
    this.viewMode = this.viewMode === ViewMode.GRID ? ViewMode.LIST : ViewMode.GRID;
    this.refresh();
  }

  /**
   * Update status bar
   */
  private updateStatus(countOrMessage?: number | string): void {
    if (typeof countOrMessage === 'string') {
      this.statusEl.textContent = countOrMessage;
    } else {
      const totalAssets = countOrMessage ?? this.registry.getAssetCount();
      const totalSize = this.registry.getTotalSize();
      this.statusEl.textContent = `${totalAssets} asset${totalAssets === 1 ? '' : 's'} • ${formatBytes(totalSize)}`;
    }
  }

  /**
   * Show library
   */
  show(): void {
    this.container.style.display = 'flex';
    this.refresh();
  }

  /**
   * Hide library
   */
  hide(): void {
    this.container.style.display = 'none';
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.container.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
}

/**
 * Create and mount asset library
 */
export function createAssetLibrary(options: AssetLibraryOptions): AssetLibrary {
  return new AssetLibrary(options);
}
