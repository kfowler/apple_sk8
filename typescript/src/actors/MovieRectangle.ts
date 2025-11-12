/**
 * MovieRectangle - Video playback actor
 *
 * Wraps HTMLVideoElement to provide video playback in SK8.
 * Replaces SK8's QuickTime-based MovieRectangle with modern HTML5 video.
 */

import { SK8Actor } from '../graphics/SK8Actor.js';
import { RectUtils } from '../graphics/types.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

/**
 * Video fit modes
 */
export enum VideoFitMode {
  FILL = 'fill', // Fill the bounds, may distort
  CONTAIN = 'contain', // Fit within bounds, maintain aspect ratio
  COVER = 'cover', // Cover bounds, maintain aspect ratio, may crop
}

/**
 * MovieRectangle - Video playback actor
 */
export class SK8MovieRectangle extends SK8Actor {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private videoUrl: string | null = null;
  private isPlaying: boolean = false;
  private fitMode: VideoFitMode = VideoFitMode.CONTAIN;
  private showControls: boolean = false;
  private animationFrameId: number | null = null;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'MovieRectangle');

    // Create video element
    this.video = document.createElement('video');
    this.video.style.display = 'none';
    this.video.crossOrigin = 'anonymous';

    // Create offscreen canvas for rendering
    this.canvas = document.createElement('canvas');

    // Set up video event listeners
    this.setupVideoListeners();

    // Define properties
    this.defineProperty('src', {
      getter: () => this.getSource(),
      setter: (value: string) => this.setSource(value),
    });

    this.defineProperty('currentTime', {
      getter: () => this.getCurrentTime(),
      setter: (value: number) => this.seek(value),
    });

    this.defineProperty('duration', {
      getter: () => this.getDuration(),
    });

    this.defineProperty('volume', {
      getter: () => this.getVolume(),
      setter: (value: number) => this.setVolume(value),
    });

    this.defineProperty('playbackRate', {
      getter: () => this.getPlaybackRate(),
      setter: (value: number) => this.setPlaybackRate(value),
    });

    this.defineProperty('playing', {
      getter: () => this.isPlayingVideo(),
    });

    this.defineProperty('paused', {
      getter: () => this.isPaused(),
    });

    this.defineProperty('ended', {
      getter: () => this.hasEnded(),
    });

    this.defineProperty('fitMode', {
      getter: () => this.getFitMode(),
      setter: (value: VideoFitMode) => this.setFitMode(value),
    });

    this.defineProperty('showControls', {
      getter: () => this.getShowControls(),
      setter: (value: boolean) => this.setShowControls(value),
    });

    // Append video to document
    document.body.appendChild(this.video);
  }

  /**
   * Set up video element event listeners
   */
  private setupVideoListeners(): void {
    this.video.addEventListener('loadedmetadata', () => {
      // Update canvas size to match video
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      if (this.hasHandler('loadedMetadata')) {
        this.callHandler('loadedMetadata');
      }

      this.dispatchEvent(
        new SK8CustomEvent('videoLoadedMetadata', {
          detail: {
            width: this.video.videoWidth,
            height: this.video.videoHeight,
            duration: this.video.duration,
          },
        })
      );

      this.setNeedsDraw();
    });

    this.video.addEventListener('play', () => {
      this.isPlaying = true;
      this.startRenderLoop();

      if (this.hasHandler('play')) {
        this.callHandler('play');
      }

      this.dispatchEvent(new SK8CustomEvent('videoPlay', { detail: {} }));
    });

    this.video.addEventListener('pause', () => {
      this.isPlaying = false;
      this.stopRenderLoop();

      if (this.hasHandler('pause')) {
        this.callHandler('pause');
      }

      this.dispatchEvent(new SK8CustomEvent('videoPause', { detail: {} }));
    });

    this.video.addEventListener('ended', () => {
      this.isPlaying = false;
      this.stopRenderLoop();

      if (this.hasHandler('ended')) {
        this.callHandler('ended');
      }

      this.dispatchEvent(new SK8CustomEvent('videoEnded', { detail: {} }));
    });

    this.video.addEventListener('timeupdate', () => {
      if (this.hasHandler('timeUpdate')) {
        this.callHandler('timeUpdate', this.video.currentTime, this.video.duration);
      }

      this.dispatchEvent(
        new SK8CustomEvent('videoTimeUpdate', {
          detail: {
            currentTime: this.video.currentTime,
            duration: this.video.duration,
          },
        })
      );
    });

    this.video.addEventListener('error', () => {
      const error = this.video.error;
      console.error('Video error:', error?.message);

      if (this.hasHandler('error')) {
        this.callHandler('error', error?.message || 'Unknown error');
      }

      this.dispatchEvent(
        new SK8CustomEvent('videoError', {
          detail: { error: error?.message },
        })
      );
    });

    this.video.addEventListener('loadstart', () => {
      if (this.hasHandler('loadStart')) {
        this.callHandler('loadStart');
      }
    });

    this.video.addEventListener('canplay', () => {
      if (this.hasHandler('canPlay')) {
        this.callHandler('canPlay');
      }
      this.setNeedsDraw();
    });
  }

  /**
   * Source management
   */
  getSource(): string | null {
    return this.videoUrl;
  }

  setSource(url: string): void {
    this.videoUrl = url;
    this.video.src = url;
    this.setNeedsDraw();
  }

  /**
   * Playback controls
   */
  async play(): Promise<void> {
    try {
      await this.video.play();
    } catch (error) {
      console.error('Failed to play video:', error);
      throw error;
    }
  }

  pause(): void {
    this.video.pause();
  }

  stop(): void {
    this.video.pause();
    this.video.currentTime = 0;
  }

  seek(time: number): void {
    this.video.currentTime = Math.max(0, Math.min(time, this.video.duration));
  }

  /**
   * Playback state
   */
  isPlayingVideo(): boolean {
    return this.isPlaying;
  }

  isPaused(): boolean {
    return this.video.paused;
  }

  hasEnded(): boolean {
    return this.video.ended;
  }

  getCurrentTime(): number {
    return this.video.currentTime;
  }

  getDuration(): number {
    return this.video.duration || 0;
  }

  /**
   * Volume control (0.0 to 1.0)
   */
  getVolume(): number {
    return this.video.volume;
  }

  setVolume(volume: number): void {
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  getMuted(): boolean {
    return this.video.muted;
  }

  setMuted(muted: boolean): void {
    this.video.muted = muted;
  }

  /**
   * Playback rate (0.5 = half speed, 2.0 = double speed)
   */
  getPlaybackRate(): number {
    return this.video.playbackRate;
  }

  setPlaybackRate(rate: number): void {
    this.video.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  /**
   * Fit mode
   */
  getFitMode(): VideoFitMode {
    return this.fitMode;
  }

  setFitMode(mode: VideoFitMode): void {
    this.fitMode = mode;
    this.setNeedsDraw();
  }

  /**
   * Controls visibility
   */
  getShowControls(): boolean {
    return this.showControls;
  }

  setShowControls(show: boolean): void {
    this.showControls = show;
    this.setNeedsDraw();
  }

  /**
   * Video dimensions
   */
  getVideoWidth(): number {
    return this.video.videoWidth;
  }

  getVideoHeight(): number {
    return this.video.videoHeight;
  }

  /**
   * Calculate draw rectangle based on fit mode
   */
  private calculateDrawRect(bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }): { x: number; y: number; width: number; height: number } {
    const bWidth = bounds.right - bounds.left;
    const bHeight = bounds.bottom - bounds.top;

    if (!this.video.videoWidth || !this.video.videoHeight || this.fitMode === VideoFitMode.FILL) {
      return {
        x: bounds.left,
        y: bounds.top,
        width: bWidth,
        height: bHeight,
      };
    }

    const videoAspect = this.video.videoWidth / this.video.videoHeight;
    const boundsAspect = bWidth / bHeight;

    let drawWidth = bWidth;
    let drawHeight = bHeight;
    let drawX = bounds.left;
    let drawY = bounds.top;

    switch (this.fitMode) {
      case VideoFitMode.CONTAIN:
        if (videoAspect > boundsAspect) {
          drawHeight = bWidth / videoAspect;
          drawY = bounds.top + (bHeight - drawHeight) / 2;
        } else {
          drawWidth = bHeight * videoAspect;
          drawX = bounds.left + (bWidth - drawWidth) / 2;
        }
        break;

      case VideoFitMode.COVER:
        if (videoAspect > boundsAspect) {
          drawWidth = bHeight * videoAspect;
          drawX = bounds.left + (bWidth - drawWidth) / 2;
        } else {
          drawHeight = bWidth / videoAspect;
          drawY = bounds.top + (bHeight - drawHeight) / 2;
        }
        break;
    }

    return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
  }

  /**
   * Start render loop for smooth video playback
   */
  private startRenderLoop(): void {
    if (this.animationFrameId !== null) return;

    const renderFrame = () => {
      if (!this.isPlaying) {
        this.animationFrameId = null;
        return;
      }

      this.setNeedsDraw();
      this.animationFrameId = requestAnimationFrame(renderFrame);
    };

    this.animationFrameId = requestAnimationFrame(renderFrame);
  }

  /**
   * Stop render loop
   */
  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Render video frame to canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible()) return;

    const bounds = this.getBoundsRect();
    const x = bounds.left;
    const y = bounds.top;
    const width = RectUtils.width(bounds);
    const height = RectUtils.height(bounds);

    // Draw background
    if (this.getFillColor()) {
      this.applyFillStyle(ctx);
      ctx.fillRect(x, y, width, height);
    }

    // Draw video if ready
    if (this.video.readyState >= 2) {
      // HAVE_CURRENT_DATA or better
      const drawRect = this.calculateDrawRect(bounds);
      ctx.drawImage(this.video, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
    } else {
      // Draw placeholder
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading video...', x + width / 2, y + height / 2);
    }

    // Draw controls if enabled
    if (this.showControls) {
      this.drawControls(ctx, bounds);
    }

    // Draw frame
    if (this.getFrameColor()) {
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      this.drawFrame(ctx);
    }
  }

  /**
   * Draw simple playback controls overlay
   */
  private drawControls(
    ctx: CanvasRenderingContext2D,
    bounds: { left: number; top: number; right: number; bottom: number }
  ): void {
    const width = bounds.right - bounds.left;
    const controlHeight = 40;
    const y = bounds.bottom - controlHeight;

    // Draw control bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(bounds.left, y, width, controlHeight);

    // Draw play/pause button
    const buttonSize = 24;
    const buttonX = bounds.left + 10;
    const buttonY = y + (controlHeight - buttonSize) / 2;

    ctx.fillStyle = '#fff';
    if (this.isPlaying) {
      // Pause icon (two bars)
      ctx.fillRect(buttonX, buttonY, 8, buttonSize);
      ctx.fillRect(buttonX + 12, buttonY, 8, buttonSize);
    } else {
      // Play icon (triangle)
      ctx.beginPath();
      ctx.moveTo(buttonX, buttonY);
      ctx.lineTo(buttonX, buttonY + buttonSize);
      ctx.lineTo(buttonX + buttonSize, buttonY + buttonSize / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Draw progress bar
    const progressX = buttonX + buttonSize + 15;
    const progressY = y + controlHeight / 2 - 2;
    const progressWidth = width - progressX - 80;
    const progressHeight = 4;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

    // Progress
    if (this.video.duration > 0) {
      const progress = this.video.currentTime / this.video.duration;
      ctx.fillStyle = '#f00';
      ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
    }

    // Draw time
    const timeText = this.formatTime(this.video.currentTime) + ' / ' + this.formatTime(this.video.duration);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeText, bounds.right - 10, y + controlHeight / 2);
  }

  /**
   * Format time as MM:SS
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Extract current frame as canvas
   */
  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const bounds = this.getBoundsRect();
    canvas.width = RectUtils.width(bounds);
    canvas.height = RectUtils.height(bounds);

    const ctx = canvas.getContext('2d');
    if (ctx && this.video.readyState >= 2) {
      const drawRect = this.calculateDrawRect(bounds);
      ctx.drawImage(this.video, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
    }

    return canvas;
  }

  /**
   * Handle click on controls
   */
  override onClick(x: number, y: number): void {
    if (this.showControls && this.containsPoint(x, y)) {
      const bounds = this.getBoundsRect();
      const controlHeight = 40;
      const controlY = bounds.bottom - controlHeight;

      // Check if click is in control area
      if (y >= controlY) {
        const buttonSize = 24;
        const buttonX = bounds.left + 10;
        const buttonY = controlY + (controlHeight - buttonSize) / 2;

        // Check if click is on play/pause button
        if (
          x >= buttonX &&
          x <= buttonX + buttonSize &&
          y >= buttonY &&
          y <= buttonY + buttonSize
        ) {
          if (this.isPlaying) {
            this.pause();
          } else {
            this.play();
          }
          return;
        }

        // Check if click is on progress bar
        const progressX = buttonX + buttonSize + 15;
        const progressWidth = RectUtils.width(bounds) - progressX - 80;
        if (x >= progressX && x <= progressX + progressWidth) {
          const progress = (x - progressX) / progressWidth;
          this.seek(progress * this.video.duration);
          return;
        }
      }
    }

    super.onClick(x, y);
  }

  /**
   * Cleanup when destroyed
   */
  dispose(): void {
    this.stop();
    this.stopRenderLoop();

    if (this.video.parentElement) {
      this.video.parentElement.removeChild(this.video);
    }
  }
}

/**
 * Helper function to create a MovieRectangle
 */
export function createMovieRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    src?: string;
    fitMode?: VideoFitMode;
    showControls?: boolean;
    autoplay?: boolean;
  }
): SK8MovieRectangle {
  const movie = new SK8MovieRectangle();
  movie.setBoundsRect({ left: x, top: y, right: x + width, bottom: y + height });

  if (options?.src) {
    movie.setSource(options.src);
  }

  if (options?.fitMode) {
    movie.setFitMode(options.fitMode);
  }

  if (options?.showControls !== undefined) {
    movie.setShowControls(options.showControls);
  }

  if (options?.autoplay) {
    // Wait for metadata before playing
    movie.addEventListener('videoLoadedMetadata', () => {
      movie.play();
    });
  }

  return movie;
}
