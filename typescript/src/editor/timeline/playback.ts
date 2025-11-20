/**
 * Timeline Playback Controls
 *
 * Features:
 * - Play/pause/stop controls
 * - Loop toggle
 * - Speed control (0.25x to 2x)
 * - Export to animation code
 * - Real-time preview
 */

import { Timeline } from './timeline-model.js';

/**
 * Playback state
 */
export interface PlaybackState {
  playing: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
  speed: number;
}

/**
 * Playback Controls
 */
export class PlaybackControls {
  private timeline: Timeline;
  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  // UI Elements
  private playButton?: HTMLButtonElement;
  private pauseButton?: HTMLButtonElement;
  private stopButton?: HTMLButtonElement;
  private loopCheckbox?: HTMLInputElement;
  private speedSelect?: HTMLSelectElement;
  private timeDisplay?: HTMLElement;
  private exportButton?: HTMLButtonElement;

  // Callbacks
  private onPlayStateChanged?: (playing: boolean) => void;
  private onTimeUpdated?: (time: number) => void;

  constructor(timeline: Timeline, container: HTMLElement) {
    this.timeline = timeline;
    this.container = container;
    this.render();
  }

  /**
   * Render playback controls
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'playback-controls';
    this.container.style.padding = '10px';
    this.container.style.borderBottom = '1px solid #444';
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.gap = '10px';

    // Play button
    this.playButton = this.createButton('▶', () => this.play());
    this.playButton.title = 'Play (Space)';
    this.container.appendChild(this.playButton);

    // Pause button
    this.pauseButton = this.createButton('⏸', () => this.pause());
    this.pauseButton.title = 'Pause (Space)';
    this.pauseButton.style.display = 'none';
    this.container.appendChild(this.pauseButton);

    // Stop button
    this.stopButton = this.createButton('⏹', () => this.stop());
    this.stopButton.title = 'Stop';
    this.container.appendChild(this.stopButton);

    // Separator
    this.container.appendChild(this.createSeparator());

    // Loop checkbox
    const loopLabel = document.createElement('label');
    loopLabel.style.display = 'flex';
    loopLabel.style.alignItems = 'center';
    loopLabel.style.gap = '5px';
    loopLabel.style.cursor = 'pointer';

    this.loopCheckbox = document.createElement('input');
    this.loopCheckbox.type = 'checkbox';
    this.loopCheckbox.checked = this.timeline.loop;
    this.loopCheckbox.addEventListener('change', () => {
      this.timeline.loop = this.loopCheckbox!.checked;
    });

    const loopText = document.createElement('span');
    loopText.textContent = 'Loop';
    loopText.style.fontSize = '12px';

    loopLabel.appendChild(this.loopCheckbox);
    loopLabel.appendChild(loopText);
    this.container.appendChild(loopLabel);

    // Separator
    this.container.appendChild(this.createSeparator());

    // Speed control
    const speedLabel = document.createElement('label');
    speedLabel.style.display = 'flex';
    speedLabel.style.alignItems = 'center';
    speedLabel.style.gap = '5px';

    const speedText = document.createElement('span');
    speedText.textContent = 'Speed:';
    speedText.style.fontSize = '12px';

    this.speedSelect = document.createElement('select');
    this.speedSelect.style.fontSize = '12px';

    const speeds = [
      { value: 0.25, label: '0.25x' },
      { value: 0.5, label: '0.5x' },
      { value: 0.75, label: '0.75x' },
      { value: 1.0, label: '1x' },
      { value: 1.25, label: '1.25x' },
      { value: 1.5, label: '1.5x' },
      { value: 2.0, label: '2x' },
    ];

    for (const speed of speeds) {
      const option = document.createElement('option');
      option.value = speed.value.toString();
      option.textContent = speed.label;
      option.selected = speed.value === this.timeline.playbackSpeed;
      this.speedSelect.appendChild(option);
    }

    this.speedSelect.addEventListener('change', () => {
      this.timeline.playbackSpeed = parseFloat(this.speedSelect!.value);
    });

    speedLabel.appendChild(speedText);
    speedLabel.appendChild(this.speedSelect);
    this.container.appendChild(speedLabel);

    // Separator
    this.container.appendChild(this.createSeparator());

    // Time display
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.style.fontSize = '12px';
    this.timeDisplay.style.fontFamily = 'monospace';
    this.timeDisplay.style.minWidth = '120px';
    this.updateTimeDisplay();
    this.container.appendChild(this.timeDisplay);

    // Spacer
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    this.container.appendChild(spacer);

    // Export button
    this.exportButton = this.createButton('Export Code', () => this.exportCode());
    this.exportButton.style.fontSize = '12px';
    this.container.appendChild(this.exportButton);
  }

  /**
   * Create button
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '5px 10px';
    button.style.cursor = 'pointer';
    button.style.border = '1px solid #555';
    button.style.background = '#333';
    button.style.color = '#fff';
    button.style.borderRadius = '3px';
    button.style.fontSize = '14px';
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Create separator
   */
  private createSeparator(): HTMLElement {
    const sep = document.createElement('div');
    sep.style.width = '1px';
    sep.style.height = '20px';
    sep.style.background = '#555';
    return sep;
  }

  /**
   * Play timeline
   */
  play(): void {
    if (this.timeline.playing) return;

    this.timeline.playing = true;
    this.lastFrameTime = performance.now();

    if (this.playButton) this.playButton.style.display = 'none';
    if (this.pauseButton) this.pauseButton.style.display = 'inline-block';

    if (this.onPlayStateChanged) {
      this.onPlayStateChanged(true);
    }

    this.startAnimationLoop();
  }

  /**
   * Pause timeline
   */
  pause(): void {
    if (!this.timeline.playing) return;

    this.timeline.playing = false;

    if (this.playButton) this.playButton.style.display = 'inline-block';
    if (this.pauseButton) this.pauseButton.style.display = 'none';

    if (this.onPlayStateChanged) {
      this.onPlayStateChanged(false);
    }

    this.stopAnimationLoop();
  }

  /**
   * Stop timeline (pause and reset to start)
   */
  stop(): void {
    this.pause();
    this.timeline.seekTo(0);
    this.updateTimeDisplay();

    if (this.onTimeUpdated) {
      this.onTimeUpdated(0);
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.timeline.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Start animation loop
   */
  private startAnimationLoop(): void {
    const update = (currentTime: number) => {
      if (!this.timeline.playing) return;

      // Calculate delta time
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // Update timeline time
      const newTime = this.timeline.currentTime + deltaTime * this.timeline.playbackSpeed;

      // Check if reached end
      const duration = this.timeline.getDuration();
      if (newTime >= duration) {
        if (this.timeline.loop) {
          // Loop back to start
          this.timeline.seekTo(0);
        } else {
          // Stop at end
          this.timeline.seekTo(duration);
          this.pause();
          this.updateTimeDisplay();
          if (this.onTimeUpdated) {
            this.onTimeUpdated(duration);
          }
          return;
        }
      } else {
        this.timeline.seekTo(newTime);
      }

      this.updateTimeDisplay();

      if (this.onTimeUpdated) {
        this.onTimeUpdated(this.timeline.currentTime);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Stop animation loop
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Update time display
   */
  private updateTimeDisplay(): void {
    if (!this.timeDisplay) return;

    const current = this.formatTime(this.timeline.currentTime);
    const duration = this.formatTime(this.timeline.getDuration());
    this.timeDisplay.textContent = `${current} / ${duration}`;
  }

  /**
   * Format time as MM:SS.mmm
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * Export timeline to code
   */
  exportCode(): void {
    const code = this.timeline.exportToCode();

    // Create modal to show code
    this.showExportModal(code);
  }

  /**
   * Show export modal
   */
  private showExportModal(code: string): void {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';

    // Create modal
    const modal = document.createElement('div');
    modal.style.background = '#1e1e1e';
    modal.style.border = '1px solid #444';
    modal.style.borderRadius = '5px';
    modal.style.padding = '20px';
    modal.style.maxWidth = '600px';
    modal.style.width = '90%';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Exported Animation Code';
    title.style.marginTop = '0';
    title.style.color = '#fff';
    modal.appendChild(title);

    // Code textarea
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.width = '100%';
    textarea.style.height = '300px';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '12px';
    textarea.style.background = '#2c2c2c';
    textarea.style.color = '#e0e0e0';
    textarea.style.border = '1px solid #444';
    textarea.style.padding = '10px';
    textarea.style.borderRadius = '3px';
    textarea.readOnly = true;
    modal.appendChild(textarea);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '15px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';

    const copyButton = this.createButton('Copy to Clipboard', () => {
      textarea.select();
      document.execCommand('copy');
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = 'Copy to Clipboard';
      }, 2000);
    });

    const closeButton = this.createButton('Close', () => {
      document.body.removeChild(overlay);
    });

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    modal.appendChild(buttonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    // Focus textarea
    textarea.focus();
    textarea.select();
  }

  /**
   * Get playback state
   */
  getState(): PlaybackState {
    return {
      playing: this.timeline.playing,
      currentTime: this.timeline.currentTime,
      duration: this.timeline.getDuration(),
      loop: this.timeline.loop,
      speed: this.timeline.playbackSpeed,
    };
  }

  /**
   * Set timeline
   */
  setTimeline(timeline: Timeline): void {
    const wasPlaying = this.timeline.playing;
    if (wasPlaying) {
      this.pause();
    }

    this.timeline = timeline;
    this.updateTimeDisplay();

    if (this.loopCheckbox) {
      this.loopCheckbox.checked = timeline.loop;
    }
    if (this.speedSelect) {
      this.speedSelect.value = timeline.playbackSpeed.toString();
    }
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onPlayStateChanged?: (playing: boolean) => void;
    onTimeUpdated?: (time: number) => void;
  }): void {
    this.onPlayStateChanged = callbacks.onPlayStateChanged;
    this.onTimeUpdated = callbacks.onTimeUpdated;
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.stopAnimationLoop();
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Space: toggle play/pause
    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePlayPause();
      return true;
    }

    // Left arrow: step backward
    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      const newTime = Math.max(0, this.timeline.currentTime - 100);
      this.timeline.seekTo(newTime);
      this.updateTimeDisplay();
      if (this.onTimeUpdated) {
        this.onTimeUpdated(newTime);
      }
      return true;
    }

    // Right arrow: step forward
    if (event.code === 'ArrowRight') {
      event.preventDefault();
      const newTime = Math.min(
        this.timeline.getDuration(),
        this.timeline.currentTime + 100
      );
      this.timeline.seekTo(newTime);
      this.updateTimeDisplay();
      if (this.onTimeUpdated) {
        this.onTimeUpdated(newTime);
      }
      return true;
    }

    return false;
  }
}
