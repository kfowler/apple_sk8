/**
 * Picture - Enhanced image actor with file selection and drag-drop
 *
 * Extends SK8Image with interactive features for loading images from user files.
 */

import { SK8Image, ImageFitMode } from '../graphics/advanced-shapes.js';
import { SK8Actor } from '../graphics/SK8Actor.js';

/**
 * Picture actor - Interactive image with file selection and drag-drop
 */
export class SK8Picture extends SK8Image {
  private fileInput: HTMLInputElement | null = null;
  private allowFileSelection: boolean = false;
  private allowDragDrop: boolean = false;
  private acceptedFormats: string = 'image/*';

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Picture');

    this.defineProperty('allowFileSelection', {
      getter: () => this.getAllowFileSelection(),
      setter: (value: boolean) => this.setAllowFileSelection(value),
    });

    this.defineProperty('allowDragDrop', {
      getter: () => this.getAllowDragDrop(),
      setter: (value: boolean) => this.setAllowDragDrop(value),
    });

    this.defineProperty('acceptedFormats', {
      getter: () => this.getAcceptedFormats(),
      setter: (value: string) => this.setAcceptedFormats(value),
    });
  }

  /**
   * Enable/disable click-to-select file
   */
  getAllowFileSelection(): boolean {
    return this.allowFileSelection;
  }

  setAllowFileSelection(allow: boolean): void {
    this.allowFileSelection = allow;

    if (allow && !this.fileInput) {
      this.createFileInput();
    }
  }

  /**
   * Enable/disable drag and drop
   */
  getAllowDragDrop(): boolean {
    return this.allowDragDrop;
  }

  setAllowDragDrop(allow: boolean): void {
    this.allowDragDrop = allow;
    this.setDroppable(allow);
  }

  /**
   * Set accepted file formats
   */
  getAcceptedFormats(): string {
    return this.acceptedFormats;
  }

  setAcceptedFormats(formats: string): void {
    this.acceptedFormats = formats;
    if (this.fileInput) {
      this.fileInput.accept = formats;
    }
  }

  /**
   * Create hidden file input for selection
   */
  private createFileInput(): void {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = this.acceptedFormats;
    this.fileInput.style.display = 'none';

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.loadFromFile(target.files[0]);
      }
    });

    document.body.appendChild(this.fileInput);
  }

  /**
   * Load image from File object
   */
  loadFromFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      if (this.hasHandler('error')) {
        this.callHandler('error', 'Invalid file type: ' + file.type);
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        this.setSource(dataUrl);

        // Dispatch custom event
        if (this.hasHandler('fileLoaded')) {
          this.callHandler('fileLoaded', file.name, file.size);
        }
      }
    };

    reader.onerror = () => {
      console.error('Error reading file:', file.name);
      if (this.hasHandler('error')) {
        this.callHandler('error', 'Error reading file: ' + file.name);
      }
    };

    reader.readAsDataURL(file);
  }

  /**
   * Open file selection dialog
   */
  selectFile(): void {
    if (!this.allowFileSelection) {
      console.warn('File selection is not enabled');
      return;
    }

    if (!this.fileInput) {
      this.createFileInput();
    }

    this.fileInput?.click();
  }

  /**
   * Handle click - open file selector if enabled
   */
  override onClick(x: number, y: number): void {
    if (this.allowFileSelection && this.containsPoint(x, y)) {
      this.selectFile();
    }
    super.onClick(x, y);
  }

  /**
   * Handle drag and drop events
   */
  handleDragOver(event: DragEvent): boolean {
    if (!this.allowDragDrop) return false;

    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    return true;
  }

  handleDrop(event: DragEvent): boolean {
    if (!this.allowDragDrop) return false;

    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.loadFromFile(files[0]);
      return true;
    }

    return false;
  }

  /**
   * Load from data URL or Blob URL
   */
  loadFromDataURL(dataUrl: string): void {
    this.setSource(dataUrl);
  }

  /**
   * Load from Blob
   */
  loadFromBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    this.setSource(url);

    // Clean up blob URL after loading
    const cleanup = () => {
      URL.revokeObjectURL(url);
      this.removeEventListener('imageLoad', cleanup);
    };
    this.addEventListener('imageLoad', cleanup);
  }

  /**
   * Cleanup when destroyed
   */
  dispose(): void {
    if (this.fileInput && this.fileInput.parentElement) {
      this.fileInput.parentElement.removeChild(this.fileInput);
      this.fileInput = null;
    }
  }
}

/**
 * Helper function to create a Picture with common settings
 */
export function createPicture(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    src?: string;
    fitMode?: ImageFitMode;
    allowFileSelection?: boolean;
    allowDragDrop?: boolean;
  }
): SK8Picture {
  const picture = new SK8Picture();
  picture.setBoundsRect({ left: x, top: y, right: x + width, bottom: y + height });

  if (options?.src) {
    picture.setSource(options.src);
  }

  if (options?.fitMode) {
    picture.setFitMode(options.fitMode);
  }

  if (options?.allowFileSelection) {
    picture.setAllowFileSelection(options.allowFileSelection);
  }

  if (options?.allowDragDrop) {
    picture.setAllowDragDrop(options.allowDragDrop);
  }

  return picture;
}
