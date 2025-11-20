/**
 * Keyframe Editor - UI for editing keyframe properties
 *
 * Features:
 * - Property value input
 * - Easing curve selector
 * - Bezier curve editor for custom easing
 * - Batch operations (copy, paste, delete)
 */

import { Track, Keyframe, EASING_FUNCTIONS } from './timeline-model.js';
import { Color, ColorUtils } from '../../graphics/types.js';
import { EasingFunction } from '../../runtime/animation.js';

/**
 * Clipboard for keyframes
 */
interface KeyframeClipboard {
  keyframes: Array<{ propertyName: string; keyframe: Keyframe }>;
}

/**
 * Keyframe Editor
 */
export class KeyframeEditor {
  private container: HTMLElement;
  private currentTrack: Track | null = null;
  private currentKeyframe: Keyframe | null = null;
  private clipboard: KeyframeClipboard | null = null;

  // Callbacks
  private onKeyframeChanged?: (track: Track, keyframe: Keyframe) => void;
  private onBatchDelete?: (keyframes: Keyframe[]) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  /**
   * Show keyframe for editing
   */
  showKeyframe(track: Track, keyframe: Keyframe): void {
    this.currentTrack = track;
    this.currentKeyframe = keyframe;
    this.render();
  }

  /**
   * Clear editor
   */
  clear(): void {
    this.currentTrack = null;
    this.currentKeyframe = null;
    this.render();
  }

  /**
   * Render the editor
   */
  private render(): void {
    this.container.innerHTML = '';

    if (!this.currentTrack || !this.currentKeyframe) {
      this.renderEmpty();
      return;
    }

    this.renderKeyframeEditor();
  }

  /**
   * Render empty state
   */
  private renderEmpty(): void {
    const message = document.createElement('div');
    message.className = 'keyframe-editor-empty';
    message.textContent = 'Select a keyframe to edit';
    message.style.padding = '20px';
    message.style.textAlign = 'center';
    message.style.color = '#888';
    this.container.appendChild(message);
  }

  /**
   * Render keyframe editor
   */
  private renderKeyframeEditor(): void {
    if (!this.currentTrack || !this.currentKeyframe) return;

    const { currentTrack: track, currentKeyframe: keyframe } = this;

    // Header
    const header = document.createElement('div');
    header.className = 'keyframe-editor-header';
    header.style.padding = '10px';
    header.style.borderBottom = '1px solid #444';
    header.style.fontWeight = 'bold';
    header.textContent = `Keyframe: ${track.propertyName}`;
    this.container.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'keyframe-editor-content';
    content.style.padding = '10px';

    // Time input
    content.appendChild(this.createTimeInput(keyframe));

    // Value input
    content.appendChild(this.createValueInput(track, keyframe));

    // Easing selector
    content.appendChild(this.createEasingSelector(keyframe));

    // Bezier curve preview
    if (keyframe.easingName !== 'linear') {
      content.appendChild(this.createEasingPreview(keyframe));
    }

    // Actions
    content.appendChild(this.createActions(keyframe));

    this.container.appendChild(content);
  }

  /**
   * Create time input
   */
  private createTimeInput(keyframe: Keyframe): HTMLElement {
    const row = document.createElement('div');
    row.className = 'keyframe-editor-row';
    row.style.marginBottom = '10px';

    const label = document.createElement('label');
    label.textContent = 'Time (ms):';
    label.style.display = 'inline-block';
    label.style.width = '80px';
    row.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.value = keyframe.time.toString();
    input.min = '0';
    input.step = '100';
    input.style.width = '100px';
    input.addEventListener('change', () => {
      const newTime = parseFloat(input.value);
      if (!isNaN(newTime) && newTime >= 0) {
        keyframe.time = newTime;
        this.notifyChange();
      }
    });
    row.appendChild(input);

    return row;
  }

  /**
   * Create value input based on property type
   */
  private createValueInput(track: Track, keyframe: Keyframe): HTMLElement {
    const row = document.createElement('div');
    row.className = 'keyframe-editor-row';
    row.style.marginBottom = '10px';

    const label = document.createElement('label');
    label.textContent = 'Value:';
    label.style.display = 'inline-block';
    label.style.width = '80px';
    row.appendChild(label);

    switch (track.propertyType) {
      case 'number':
      case 'rotation':
      case 'opacity':
        row.appendChild(this.createNumberInput(keyframe));
        break;
      case 'color':
        row.appendChild(this.createColorInput(keyframe));
        break;
      case 'position':
        row.appendChild(this.createPositionInput(keyframe));
        break;
      case 'scale':
        row.appendChild(this.createScaleInput(keyframe));
        break;
      default:
        const text = document.createElement('span');
        text.textContent = String(keyframe.value);
        row.appendChild(text);
    }

    return row;
  }

  /**
   * Create number input
   */
  private createNumberInput(keyframe: Keyframe): HTMLElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(keyframe.value);
    input.step = '0.1';
    input.style.width = '100px';
    input.addEventListener('change', () => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        keyframe.value = value;
        this.notifyChange();
      }
    });
    return input;
  }

  /**
   * Create color input
   */
  private createColorInput(keyframe: Keyframe): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    const input = document.createElement('input');
    input.type = 'color';
    if (typeof keyframe.value === 'object') {
      input.value = ColorUtils.toHex(keyframe.value as Color);
    }
    input.addEventListener('change', () => {
      keyframe.value = ColorUtils.fromHex(input.value);
      this.notifyChange();
    });
    container.appendChild(input);

    return container;
  }

  /**
   * Create position input (x, y)
   */
  private createPositionInput(keyframe: Keyframe): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    // For position, value might be stored as {x, y} or just a number
    // This is a simplified version - in production you'd handle both x and y
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(keyframe.value);
    input.step = '1';
    input.style.width = '80px';
    input.addEventListener('change', () => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        keyframe.value = value;
        this.notifyChange();
      }
    });
    container.appendChild(input);

    return container;
  }

  /**
   * Create scale input
   */
  private createScaleInput(keyframe: Keyframe): HTMLElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(keyframe.value);
    input.step = '0.1';
    input.min = '0';
    input.style.width = '100px';
    input.addEventListener('change', () => {
      const value = parseFloat(input.value);
      if (!isNaN(value) && value >= 0) {
        keyframe.value = value;
        this.notifyChange();
      }
    });
    return input;
  }

  /**
   * Create easing selector
   */
  private createEasingSelector(keyframe: Keyframe): HTMLElement {
    const row = document.createElement('div');
    row.className = 'keyframe-editor-row';
    row.style.marginBottom = '10px';

    const label = document.createElement('label');
    label.textContent = 'Easing:';
    label.style.display = 'inline-block';
    label.style.width = '80px';
    row.appendChild(label);

    const select = document.createElement('select');
    select.style.width = '150px';

    for (const easingFunc of EASING_FUNCTIONS) {
      const option = document.createElement('option');
      option.value = easingFunc.name;
      option.textContent = easingFunc.displayName;
      option.selected = keyframe.easingName === easingFunc.name;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      const selectedName = select.value;
      const easingFunc = EASING_FUNCTIONS.find((e) => e.name === selectedName);
      if (easingFunc) {
        keyframe.easing = easingFunc.func;
        keyframe.easingName = easingFunc.name;
        this.notifyChange();
        this.render(); // Re-render to show/hide bezier preview
      }
    });

    row.appendChild(select);

    return row;
  }

  /**
   * Create easing preview (canvas showing the curve)
   */
  private createEasingPreview(keyframe: Keyframe): HTMLElement {
    const container = document.createElement('div');
    container.className = 'keyframe-editor-row';
    container.style.marginBottom = '10px';

    const label = document.createElement('div');
    label.textContent = 'Curve Preview:';
    label.style.marginBottom = '5px';
    label.style.fontSize = '12px';
    label.style.color = '#aaa';
    container.appendChild(label);

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    canvas.style.border = '1px solid #444';
    canvas.style.background = '#1e1e1e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.drawEasingCurve(ctx, keyframe.easing);
    }

    return container;
  }

  /**
   * Draw easing curve on canvas
   */
  private drawEasingCurve(ctx: CanvasRenderingContext2D, easing: EasingFunction): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    // Draw curve
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const value = easing(t);
      const x = t * width;
      const y = height - value * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw end points
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.arc(0, height, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Create actions (copy, delete, etc.)
   */
  private createActions(_keyframe: Keyframe): HTMLElement {
    const container = document.createElement('div');
    container.className = 'keyframe-editor-actions';
    container.style.marginTop = '20px';
    container.style.borderTop = '1px solid #444';
    container.style.paddingTop = '10px';

    // Copy button
    const copyBtn = this.createButton('Copy', () => {
      this.copyKeyframe();
    });
    container.appendChild(copyBtn);

    // Paste button
    const pasteBtn = this.createButton('Paste', () => {
      this.pasteKeyframe();
    });
    pasteBtn.disabled = !this.clipboard;
    container.appendChild(pasteBtn);

    // Delete button
    const deleteBtn = this.createButton('Delete', () => {
      this.deleteKeyframe();
    });
    deleteBtn.style.backgroundColor = '#c44';
    container.appendChild(deleteBtn);

    return container;
  }

  /**
   * Create button
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.marginRight = '5px';
    button.style.padding = '5px 10px';
    button.style.cursor = 'pointer';
    button.style.border = '1px solid #555';
    button.style.background = '#333';
    button.style.color = '#fff';
    button.style.borderRadius = '3px';
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Copy current keyframe to clipboard
   */
  private copyKeyframe(): void {
    if (!this.currentTrack || !this.currentKeyframe) return;

    this.clipboard = {
      keyframes: [
        {
          propertyName: this.currentTrack.propertyName,
          keyframe: this.currentKeyframe.clone(),
        },
      ],
    };
  }

  /**
   * Paste keyframe from clipboard
   */
  private pasteKeyframe(): void {
    if (!this.clipboard || !this.currentTrack) return;

    for (const item of this.clipboard.keyframes) {
      if (item.propertyName === this.currentTrack.propertyName) {
        const newKeyframe = item.keyframe.clone();
        // Offset time slightly to avoid overlap
        newKeyframe.time = this.currentKeyframe?.time || 0 + 100;
        this.currentTrack.addKeyframe(newKeyframe);
        this.notifyChange();
      }
    }
  }

  /**
   * Delete current keyframe
   */
  private deleteKeyframe(): void {
    if (!this.currentTrack || !this.currentKeyframe) return;

    this.currentTrack.removeKeyframe(this.currentKeyframe.id);

    if (this.onBatchDelete) {
      this.onBatchDelete([this.currentKeyframe]);
    }

    this.clear();
  }

  /**
   * Copy multiple keyframes
   */
  copyKeyframes(items: Array<{ track: Track; keyframe: Keyframe }>): void {
    this.clipboard = {
      keyframes: items.map((item) => ({
        propertyName: item.track.propertyName,
        keyframe: item.keyframe.clone(),
      })),
    };
  }

  /**
   * Paste multiple keyframes
   */
  pasteKeyframes(targetTracks: Track[]): void {
    if (!this.clipboard) return;

    for (const item of this.clipboard.keyframes) {
      const targetTrack = targetTracks.find((t) => t.propertyName === item.propertyName);
      if (targetTrack) {
        const newKeyframe = item.keyframe.clone();
        targetTrack.addKeyframe(newKeyframe);
      }
    }

    this.notifyChange();
  }

  /**
   * Delete multiple keyframes
   */
  deleteKeyframes(items: Array<{ track: Track; keyframe: Keyframe }>): void {
    for (const { track, keyframe } of items) {
      track.removeKeyframe(keyframe.id);
    }

    if (this.onBatchDelete) {
      this.onBatchDelete(items.map((i) => i.keyframe));
    }

    this.clear();
  }

  /**
   * Notify that keyframe changed
   */
  private notifyChange(): void {
    if (this.currentTrack && this.currentKeyframe && this.onKeyframeChanged) {
      this.onKeyframeChanged(this.currentTrack, this.currentKeyframe);
    }
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onKeyframeChanged?: (track: Track, keyframe: Keyframe) => void;
    onBatchDelete?: (keyframes: Keyframe[]) => void;
  }): void {
    this.onKeyframeChanged = callbacks.onKeyframeChanged;
    this.onBatchDelete = callbacks.onBatchDelete;
  }

  /**
   * Get clipboard status
   */
  hasClipboard(): boolean {
    return this.clipboard !== null;
  }
}
