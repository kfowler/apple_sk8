/**
 * SK8FileDialog - File browser dialog
 *
 * A file selection dialog with directory navigation,
 * file type filters, preview pane, and save/open modes.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { Color, ColorUtils, RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

export type FileDialogMode = 'open' | 'save';

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  extension?: string;
}

export interface FileFilter {
  label: string;
  extensions: string[];
}

export class SK8FileDialog extends SK8Actor {
  private mode: FileDialogMode = 'open';
  private currentPath: string = '/';
  private files: FileEntry[] = [];
  private selectedFile: FileEntry | null = null;
  private filters: FileFilter[] = [];
  private activeFilterIndex: number = 0;
  private showPreview: boolean = true;
  private previewContent: string | null = null;
  private fileName: string = '';

  // Visual state
  private hoveredFileIndex: number = -1;
  private scrollOffset: number = 0;

  // Visual properties
  private headerHeight: number = 40;
  private fileListWidth: number = 300;
  private previewWidth: number = 200;
  private rowHeight: number = 24;
  private footerHeight: number = 60;
  private fontSize: number = 13;
  private fontFamily: string = 'Geneva, Arial, sans-serif';
  private padding: number = 10;
  private scrollbarWidth: number = 12;

  // Colors
  private backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1.0 };
  private headerBackgroundColor: Color = { r: 240, g: 240, b: 240, a: 1.0 };
  private selectedColor: Color = { r: 0, g: 120, b: 215, a: 0.3 };
  private hoverColor: Color = { r: 0, g: 120, b: 215, a: 0.1 };
  private alternateRowColor: Color = { r: 248, g: 248, b: 248, a: 1.0 };
  private textColor: Color = { r: 0, g: 0, b: 0, a: 1.0 };
  private borderColor: Color = { r: 200, g: 200, b: 200, a: 1.0 };
  private scrollbarColor: Color = { r: 180, g: 180, b: 180, a: 1.0 };
  private directoryColor: Color = { r: 0, g: 100, b: 200, a: 1.0 };

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'FileDialog');

    // Set default bounds
    this.setBoundsRect({ left: 0, top: 0, right: 550, bottom: 400 });

    // Define properties
    this.defineProperty('mode', {
      getter: () => this.getMode(),
      setter: (value: FileDialogMode) => this.setMode(value),
    });

    this.defineProperty('currentPath', {
      getter: () => this.getCurrentPath(),
      setter: (value: string) => this.setCurrentPath(value),
    });

    this.defineProperty('showPreview', {
      getter: () => this.getShowPreview(),
      setter: (value: boolean) => this.setShowPreview(value),
    });

    // Set default filters
    this.setFilters([
      { label: 'All Files', extensions: ['*'] },
      { label: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'] },
      { label: 'Documents', extensions: ['txt', 'pdf', 'doc', 'docx'] },
    ]);
  }

  // Mode
  getMode(): FileDialogMode {
    return this.mode;
  }

  setMode(mode: FileDialogMode): void {
    this.mode = mode;
    this.setNeedsDraw();
  }

  // Current path
  getCurrentPath(): string {
    return this.currentPath;
  }

  setCurrentPath(path: string): void {
    this.currentPath = path;
    this.setNeedsDraw();

    // Dispatch pathChanged event
    this.dispatchEvent(
      new SK8CustomEvent('pathChanged', {
        path,
      })
    );
  }

  // Show preview
  getShowPreview(): boolean {
    return this.showPreview;
  }

  setShowPreview(show: boolean): void {
    this.showPreview = show;
    this.setNeedsDraw();
  }

  // Files
  getFiles(): FileEntry[] {
    return [...this.files];
  }

  setFiles(files: FileEntry[]): void {
    this.files = files;
    this.selectedFile = null;
    this.scrollOffset = 0;
    this.setNeedsDraw();
  }

  // Selected file
  getSelectedFile(): FileEntry | null {
    return this.selectedFile ? { ...this.selectedFile } : null;
  }

  selectFile(file: FileEntry): void {
    this.selectedFile = file;
    this.fileName = file.name;

    // Update preview if it's an image or text file
    if (file.type === 'file') {
      this.updatePreview(file);
    }

    this.setNeedsDraw();
  }

  // Filters
  getFilters(): FileFilter[] {
    return [...this.filters];
  }

  setFilters(filters: FileFilter[]): void {
    this.filters = filters;
    this.activeFilterIndex = 0;
    this.setNeedsDraw();
  }

  getActiveFilter(): FileFilter | null {
    return this.filters[this.activeFilterIndex] || null;
  }

  setActiveFilterIndex(index: number): void {
    if (index >= 0 && index < this.filters.length) {
      this.activeFilterIndex = index;
      this.setNeedsDraw();
    }
  }

  // File name (for save mode)
  getFileName(): string {
    return this.fileName;
  }

  setFileName(name: string): void {
    this.fileName = name;
    this.setNeedsDraw();
  }

  // Helper: Update preview
  private updatePreview(file: FileEntry): void {
    // In a real implementation, this would load the file content
    // For now, we'll just show metadata
    if (file.extension && ['png', 'jpg', 'jpeg', 'gif'].includes(file.extension)) {
      this.previewContent = `[Image Preview]\n${file.name}\n${file.size ? this.formatFileSize(file.size) : ''}`;
    } else {
      this.previewContent = `${file.name}\n${file.size ? this.formatFileSize(file.size) : ''}\n${file.modified ? file.modified.toLocaleString() : ''}`;
    }
  }

  // Helper: Format file size
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Helper: Get filtered files
  private getFilteredFiles(): FileEntry[] {
    const activeFilter = this.getActiveFilter();
    if (!activeFilter || activeFilter.extensions.includes('*')) {
      return this.files;
    }

    return this.files.filter((file) => {
      if (file.type === 'directory') return true;
      if (!file.extension) return false;
      return activeFilter.extensions.includes(file.extension);
    });
  }

  // Helper: Get file list bounds
  private getFileListBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const bounds = this.getBoundsRect();
    return {
      left: bounds.left,
      top: bounds.top + this.headerHeight,
      right: this.showPreview
        ? bounds.left + this.fileListWidth
        : bounds.right,
      bottom: bounds.bottom - this.footerHeight,
    };
  }

  // Helper: Get preview bounds
  private getPreviewBounds(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } {
    const bounds = this.getBoundsRect();
    return {
      left: bounds.left + this.fileListWidth,
      top: bounds.top + this.headerHeight,
      right: bounds.right,
      bottom: bounds.bottom - this.footerHeight,
    };
  }

  // Helper: Get file at point
  private getFileAtPoint(x: number, y: number): FileEntry | null {
    const fileList = this.getFileListBounds();
    if (
      x < fileList.left ||
      x > fileList.right ||
      y < fileList.top ||
      y > fileList.bottom
    ) {
      return null;
    }

    const relativeY = y - fileList.top + this.scrollOffset;
    const fileIndex = Math.floor(relativeY / this.rowHeight);
    const filteredFiles = this.getFilteredFiles();

    if (fileIndex >= 0 && fileIndex < filteredFiles.length) {
      return filteredFiles[fileIndex];
    }

    return null;
  }

  // Helper: Navigate up
  navigateUp(): void {
    const parts = this.currentPath.split('/').filter((p) => p);
    if (parts.length > 0) {
      parts.pop();
      this.setCurrentPath('/' + parts.join('/'));
    }
  }

  // Event handlers
  override onClick(x: number, y: number): void {
    // Check file list
    const file = this.getFileAtPoint(x, y);
    if (file) {
      if (file.type === 'directory') {
        // Navigate into directory
        this.setCurrentPath(file.path);
      } else {
        // Select file
        this.selectFile(file);
      }
      super.onClick(x, y);
      return;
    }

    super.onClick(x, y);
  }

  override onMouseMove(x: number, y: number): void {
    const file = this.getFileAtPoint(x, y);
    const filteredFiles = this.getFilteredFiles();
    const newHoveredIndex = file ? filteredFiles.indexOf(file) : -1;

    if (this.hoveredFileIndex !== newHoveredIndex) {
      this.hoveredFileIndex = newHoveredIndex;
      this.setNeedsDraw();
    }

    super.onMouseMove(x, y);
  }

  // Public methods
  confirmSelection(): void {
    if (this.mode === 'open' && this.selectedFile) {
      this.dispatchEvent(
        new SK8CustomEvent('fileSelected', {
          file: this.selectedFile,
          path: this.selectedFile.path,
        })
      );
    } else if (this.mode === 'save' && this.fileName) {
      this.dispatchEvent(
        new SK8CustomEvent('fileSelected', {
          name: this.fileName,
          path: this.currentPath + '/' + this.fileName,
        })
      );
    }
  }

  cancel(): void {
    this.dispatchEvent(new SK8CustomEvent('dialogCancelled', {}));
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    ctx.fillRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      RectUtils.height(bounds)
    );

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      RectUtils.height(bounds)
    );

    // Draw header
    this.drawHeader(ctx);

    // Draw file list
    this.drawFileList(ctx);

    // Draw preview if enabled
    if (this.showPreview) {
      this.drawPreview(ctx);
    }

    // Draw footer
    this.drawFooter(ctx);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();

    // Draw header background
    ctx.fillStyle = ColorUtils.toCSS(this.headerBackgroundColor);
    ctx.fillRect(
      bounds.left,
      bounds.top,
      RectUtils.width(bounds),
      this.headerHeight
    );

    // Draw header border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounds.left, bounds.top + this.headerHeight);
    ctx.lineTo(bounds.right, bounds.top + this.headerHeight);
    ctx.stroke();

    // Draw current path
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(
      this.currentPath || '/',
      bounds.left + this.padding,
      bounds.top + this.headerHeight / 2
    );

    // Draw up button
    const upButtonX = bounds.right - 60;
    const upButtonY = bounds.top + (this.headerHeight - 24) / 2;

    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.fillStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1.0 });
    ctx.lineWidth = 1;
    ctx.fillRect(upButtonX, upButtonY, 50, 24);
    ctx.strokeRect(upButtonX, upButtonY, 50, 24);

    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText('Up', upButtonX + 25, upButtonY + 12);
  }

  private drawFileList(ctx: CanvasRenderingContext2D): void {
    const fileList = this.getFileListBounds();
    const filteredFiles = this.getFilteredFiles();

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    ctx.fillRect(
      fileList.left,
      fileList.top,
      fileList.right - fileList.left,
      fileList.bottom - fileList.top
    );

    // Clip to file list area
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      fileList.left,
      fileList.top,
      fileList.right - fileList.left,
      fileList.bottom - fileList.top
    );
    ctx.clip();

    // Draw files
    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i];
      const y = fileList.top + i * this.rowHeight - this.scrollOffset;

      // Skip if not visible
      if (y + this.rowHeight < fileList.top || y > fileList.bottom) {
        continue;
      }

      this.drawFileRow(ctx, file, i, y, fileList);
    }

    ctx.restore();

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      fileList.left,
      fileList.top,
      fileList.right - fileList.left,
      fileList.bottom - fileList.top
    );
  }

  private drawFileRow(
    ctx: CanvasRenderingContext2D,
    file: FileEntry,
    index: number,
    y: number,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): void {
    const isSelected = this.selectedFile?.path === file.path;
    const isHovered = this.hoveredFileIndex === index;

    // Draw row background
    if (isSelected) {
      ctx.fillStyle = ColorUtils.toCSS(this.selectedColor);
      ctx.fillRect(bounds.left, y, bounds.right - bounds.left, this.rowHeight);
    } else if (isHovered) {
      ctx.fillStyle = ColorUtils.toCSS(this.hoverColor);
      ctx.fillRect(bounds.left, y, bounds.right - bounds.left, this.rowHeight);
    } else if (index % 2 === 1) {
      ctx.fillStyle = ColorUtils.toCSS(this.alternateRowColor);
      ctx.fillRect(bounds.left, y, bounds.right - bounds.left, this.rowHeight);
    }

    // Draw icon (emoji placeholder)
    const icon = file.type === 'directory' ? '📁' : '📄';
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, bounds.left + this.padding, y + this.rowHeight / 2);

    // Draw file name
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = ColorUtils.toCSS(
      file.type === 'directory' ? this.directoryColor : this.textColor
    );
    ctx.fillText(file.name, bounds.left + this.padding + 25, y + this.rowHeight / 2);

    // Draw file size (if file)
    if (file.type === 'file' && file.size !== undefined) {
      ctx.textAlign = 'right';
      ctx.fillStyle = ColorUtils.toCSS(this.textColor);
      ctx.fillText(
        this.formatFileSize(file.size),
        bounds.right - this.padding,
        y + this.rowHeight / 2
      );
    }
  }

  private drawPreview(ctx: CanvasRenderingContext2D): void {
    const preview = this.getPreviewBounds();

    // Draw background
    ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    ctx.fillRect(
      preview.left,
      preview.top,
      preview.right - preview.left,
      preview.bottom - preview.top
    );

    // Draw border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(
      preview.left,
      preview.top,
      preview.right - preview.left,
      preview.bottom - preview.top
    );

    // Draw preview content
    if (this.previewContent) {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = ColorUtils.toCSS(this.textColor);

      const lines = this.previewContent.split('\n');
      let y = preview.top + this.padding;

      for (const line of lines) {
        ctx.fillText(line, preview.left + this.padding, y);
        y += this.fontSize + 4;
      }
    } else {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ColorUtils.toCSS({ r: 150, g: 150, b: 150, a: 1.0 });
      ctx.fillText(
        'No preview',
        (preview.left + preview.right) / 2,
        (preview.top + preview.bottom) / 2
      );
    }
  }

  private drawFooter(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getBoundsRect();
    const footerY = bounds.bottom - this.footerHeight;

    // Draw footer background
    ctx.fillStyle = ColorUtils.toCSS(this.headerBackgroundColor);
    ctx.fillRect(
      bounds.left,
      footerY,
      RectUtils.width(bounds),
      this.footerHeight
    );

    // Draw footer border
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounds.left, footerY);
    ctx.lineTo(bounds.right, footerY);
    ctx.stroke();

    // Draw file name input (for save mode)
    if (this.mode === 'save') {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ColorUtils.toCSS(this.textColor);
      ctx.fillText(
        'File name:',
        bounds.left + this.padding,
        footerY + 20
      );

      // Draw input field
      const inputX = bounds.left + 80;
      const inputY = footerY + 10;
      const inputWidth = 200;
      const inputHeight = 24;

      ctx.fillStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1.0 });
      ctx.fillRect(inputX, inputY, inputWidth, inputHeight);

      ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
      ctx.lineWidth = 1;
      ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);

      ctx.fillStyle = ColorUtils.toCSS(this.textColor);
      ctx.fillText(this.fileName, inputX + 5, inputY + inputHeight / 2);
    }

    // Draw OK/Cancel buttons
    const buttonWidth = 80;
    const buttonHeight = 28;
    const buttonY = footerY + (this.footerHeight - buttonHeight) / 2;
    const okButtonX = bounds.right - 2 * buttonWidth - this.padding * 2;
    const cancelButtonX = bounds.right - buttonWidth - this.padding;

    // OK button
    ctx.fillStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1.0 });
    ctx.fillRect(okButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = ColorUtils.toCSS(this.borderColor);
    ctx.lineWidth = 1;
    ctx.strokeRect(okButtonX, buttonY, buttonWidth, buttonHeight);

    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(
      this.mode === 'save' ? 'Save' : 'Open',
      okButtonX + buttonWidth / 2,
      buttonY + buttonHeight / 2
    );

    // Cancel button
    ctx.fillStyle = ColorUtils.toCSS({ r: 255, g: 255, b: 255, a: 1.0 });
    ctx.fillRect(cancelButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(cancelButtonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = ColorUtils.toCSS(this.textColor);
    ctx.fillText(
      'Cancel',
      cancelButtonX + buttonWidth / 2,
      buttonY + buttonHeight / 2
    );
  }
}
