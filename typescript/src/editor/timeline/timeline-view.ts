/**
 * Timeline View - Visual representation of timeline
 *
 * Features:
 * - Track display with horizontal scrolling
 * - Keyframe markers (draggable, selectable)
 * - Scrubber/playhead
 * - Grid with time markers
 * - Zoom controls
 * - Grid snapping
 */

import { Timeline, Track, Keyframe } from './timeline-model.js';

/**
 * Timeline view configuration
 */
export interface TimelineViewConfig {
  width: number;
  height: number;
  trackHeight: number;
  headerWidth: number;
  minZoom: number; // ms per pixel
  maxZoom: number;
  defaultZoom: number;
  snapInterval: number; // ms
  gridLineInterval: number; // ms
}

/**
 * Selection state
 */
export interface TimelineSelection {
  keyframes: Set<string>; // keyframe IDs
  tracks: Set<string>; // track IDs
}

/**
 * Drag state
 */
interface DragState {
  isDragging: boolean;
  dragType: 'keyframe' | 'scrubber' | 'pan' | null;
  startX: number;
  startY: number;
  startTime: number;
  draggedKeyframes: Array<{ track: Track; keyframe: Keyframe; startTime: number }>;
}

/**
 * Timeline View - Canvas-based timeline visualization
 */
export class TimelineView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timeline: Timeline;
  private config: TimelineViewConfig;

  // View state
  private zoom: number; // ms per pixel
  private scrollX: number = 0; // horizontal scroll offset in pixels
  private scrollY: number = 0; // vertical scroll offset in pixels

  // Selection state
  private selection: TimelineSelection = {
    keyframes: new Set(),
    tracks: new Set(),
  };

  // Drag state
  private dragState: DragState = {
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    draggedKeyframes: [],
  };

  // Hover state
  private hoveredKeyframe: { track: Track; keyframe: Keyframe } | null = null;

  // Grid snapping
  private snapEnabled: boolean = true;

  // Event callbacks
  private onKeyframeSelected?: (track: Track, keyframe: Keyframe) => void;
  private onKeyframesMoved?: (
    changes: Array<{ track: Track; keyframe: Keyframe; newTime: number }>
  ) => void;
  private onTimeChanged?: (time: number) => void;

  constructor(canvas: HTMLCanvasElement, timeline: Timeline, config?: Partial<TimelineViewConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2d context');
    this.ctx = ctx;
    this.timeline = timeline;

    // Default configuration
    this.config = {
      width: 800,
      height: 400,
      trackHeight: 40,
      headerWidth: 150,
      minZoom: 0.1, // 10 seconds per pixel
      maxZoom: 10, // 10ms per pixel
      defaultZoom: 1, // 1 second per pixel
      snapInterval: 100, // snap to 100ms
      gridLineInterval: 1000, // grid line every second
      ...config,
    };

    this.zoom = this.config.defaultZoom;

    this.setupCanvas();
    this.setupEventListeners();
    this.render();
  }

  /**
   * Setup canvas dimensions
   */
  private setupCanvas(): void {
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.width = `${this.config.width}px`;
    this.canvas.style.height = `${this.config.height}px`;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // Context menu for right-click options
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on scrubber
    if (this.isOnScrubber(x, y)) {
      this.dragState = {
        isDragging: true,
        dragType: 'scrubber',
        startX: x,
        startY: y,
        startTime: this.timeline.currentTime,
        draggedKeyframes: [],
      };
      this.updateScrubberPosition(x);
      return;
    }

    // Check if clicking on a keyframe
    const keyframeHit = this.hitTestKeyframes(x, y);
    if (keyframeHit) {
      const { track, keyframe } = keyframeHit;

      // If shift key, add to selection
      if (e.shiftKey) {
        this.selection.keyframes.add(keyframe.id);
      } else if (!this.selection.keyframes.has(keyframe.id)) {
        // If not in selection, clear and select this one
        this.selection.keyframes.clear();
        this.selection.keyframes.add(keyframe.id);
      }

      // Start dragging keyframes
      this.dragState = {
        isDragging: true,
        dragType: 'keyframe',
        startX: x,
        startY: y,
        startTime: this.timeline.currentTime,
        draggedKeyframes: this.getSelectedKeyframesWithTracks(),
      };

      // Notify selection
      if (this.onKeyframeSelected) {
        this.onKeyframeSelected(track, keyframe);
      }

      this.render();
      return;
    }

    // Check if clicking on timeline area (for panning)
    if (x > this.config.headerWidth) {
      this.dragState = {
        isDragging: true,
        dragType: 'pan',
        startX: x,
        startY: y,
        startTime: this.timeline.currentTime,
        draggedKeyframes: [],
      };
      return;
    }

    // Otherwise, clear selection
    this.selection.keyframes.clear();
    this.render();
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.dragState.isDragging) {
      switch (this.dragState.dragType) {
        case 'scrubber':
          this.updateScrubberPosition(x);
          break;

        case 'keyframe':
          this.dragKeyframes(x - this.dragState.startX);
          break;

        case 'pan':
          this.scrollX -= x - this.dragState.startX;
          this.scrollY -= y - this.dragState.startY;
          this.dragState.startX = x;
          this.dragState.startY = y;
          this.render();
          break;
      }
    } else {
      // Update hover state
      const keyframeHit = this.hitTestKeyframes(x, y);
      this.hoveredKeyframe = keyframeHit;
      this.canvas.style.cursor = keyframeHit ? 'pointer' : this.isOnScrubber(x, y) ? 'ew-resize' : 'default';
      this.render();
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(_e: MouseEvent): void {
    if (this.dragState.isDragging && this.dragState.dragType === 'keyframe') {
      // Finalize keyframe drag
      const changes: Array<{ track: Track; keyframe: Keyframe; newTime: number }> = [];

      for (const { track, keyframe } of this.dragState.draggedKeyframes) {
        changes.push({ track, keyframe, newTime: keyframe.time });
      }

      if (this.onKeyframesMoved && changes.length > 0) {
        this.onKeyframesMoved(changes);
      }
    }

    this.dragState = {
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
      startTime: 0,
      draggedKeyframes: [],
    };
  }

  /**
   * Handle mouse wheel (for zoom)
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.setZoom(this.zoom * zoomFactor);
    } else {
      // Scroll
      this.scrollX += e.deltaX;
      this.scrollY += e.deltaY;
      this.render();
    }
  }

  /**
   * Handle double click (add keyframe)
   */
  private handleDoubleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check which track was clicked
    const trackIndex = this.getTrackIndexAtY(y);
    if (trackIndex !== -1 && trackIndex < this.timeline.tracks.length) {
      const track = this.timeline.tracks[trackIndex];
      const time = this.pixelToTime(x);

      // Get current value at this time or use a default
      const value = track.getValueAtTime(time) || 0;
      const keyframe = new Keyframe(time, value);
      track.addKeyframe(keyframe);
      this.render();
    }
  }

  /**
   * Check if position is on scrubber
   */
  private isOnScrubber(x: number, y: number): boolean {
    const scrubberX = this.timeToPixel(this.timeline.currentTime);
    return Math.abs(x - scrubberX) < 5 && y < 30;
  }

  /**
   * Hit test for keyframes
   */
  private hitTestKeyframes(x: number, y: number): { track: Track; keyframe: Keyframe } | null {
    const trackIndex = this.getTrackIndexAtY(y);
    if (trackIndex === -1 || trackIndex >= this.timeline.tracks.length) {
      return null;
    }

    const track = this.timeline.tracks[trackIndex];
    for (const keyframe of track.keyframes) {
      const kfX = this.timeToPixel(keyframe.time);
      const trackY = this.getTrackY(trackIndex);
      const kfY = trackY + this.config.trackHeight / 2;

      if (Math.abs(x - kfX) < 6 && Math.abs(y - kfY) < 6) {
        return { track, keyframe };
      }
    }

    return null;
  }

  /**
   * Get track index at Y position
   */
  private getTrackIndexAtY(y: number): number {
    const adjustedY = y + this.scrollY - 30; // 30px for timeline header
    if (adjustedY < 0) return -1;
    return Math.floor(adjustedY / this.config.trackHeight);
  }

  /**
   * Get Y position for track
   */
  private getTrackY(trackIndex: number): number {
    return 30 + trackIndex * this.config.trackHeight - this.scrollY;
  }

  /**
   * Update scrubber position
   */
  private updateScrubberPosition(x: number): void {
    const time = this.pixelToTime(x);
    this.timeline.seekTo(time);
    if (this.onTimeChanged) {
      this.onTimeChanged(time);
    }
    this.render();
  }

  /**
   * Drag selected keyframes
   */
  private dragKeyframes(deltaX: number): void {
    const deltaTime = this.pixelToTime(deltaX) - this.pixelToTime(0);

    for (const { keyframe, startTime } of this.dragState.draggedKeyframes) {
      let newTime = startTime + deltaTime;

      // Snap to grid if enabled
      if (this.snapEnabled) {
        newTime = this.snapTime(newTime);
      }

      // Clamp to non-negative
      newTime = Math.max(0, newTime);

      keyframe.time = newTime;
    }

    // Re-sort keyframes in all affected tracks
    for (const track of this.timeline.tracks) {
      track.keyframes.sort((a, b) => a.time - b.time);
    }

    this.render();
  }

  /**
   * Get selected keyframes with their tracks
   */
  private getSelectedKeyframesWithTracks(): Array<{
    track: Track;
    keyframe: Keyframe;
    startTime: number;
  }> {
    const result: Array<{ track: Track; keyframe: Keyframe; startTime: number }> = [];

    for (const track of this.timeline.tracks) {
      for (const keyframe of track.keyframes) {
        if (this.selection.keyframes.has(keyframe.id)) {
          result.push({ track, keyframe, startTime: keyframe.time });
        }
      }
    }

    return result;
  }

  /**
   * Convert time to pixel position
   */
  private timeToPixel(time: number): number {
    return this.config.headerWidth + time / this.zoom - this.scrollX;
  }

  /**
   * Convert pixel position to time
   */
  private pixelToTime(x: number): number {
    return (x - this.config.headerWidth + this.scrollX) * this.zoom;
  }

  /**
   * Snap time to grid
   */
  private snapTime(time: number): number {
    const interval = this.config.snapInterval;
    return Math.round(time / interval) * interval;
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
    this.render();
  }

  /**
   * Get zoom level
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Toggle snap
   */
  toggleSnap(): void {
    this.snapEnabled = !this.snapEnabled;
  }

  /**
   * Set snap enabled
   */
  setSnapEnabled(enabled: boolean): void {
    this.snapEnabled = enabled;
  }

  /**
   * Render the timeline
   */
  render(): void {
    const { ctx } = this;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw timeline header
    this.drawTimelineHeader();

    // Draw grid
    this.drawGrid();

    // Draw tracks
    this.drawTracks();

    // Draw keyframes
    this.drawKeyframes();

    // Draw scrubber (playhead)
    this.drawScrubber();
  }

  /**
   * Draw timeline header with time markers
   */
  private drawTimelineHeader(): void {
    const { ctx } = this;

    // Background
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, this.canvas.width, 30);

    // Time markers
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const interval = this.config.gridLineInterval;
    const startTime = Math.floor(this.scrollX * this.zoom / interval) * interval;
    const endTime = startTime + (this.canvas.width - this.config.headerWidth) * this.zoom;

    for (let time = startTime; time <= endTime; time += interval) {
      const x = this.timeToPixel(time);
      if (x >= this.config.headerWidth) {
        ctx.fillText(this.formatTime(time), x, 15);
      }
    }

    // Separator line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(this.canvas.width, 30);
    ctx.stroke();
  }

  /**
   * Draw grid lines
   */
  private drawGrid(): void {
    const { ctx } = this;

    // Vertical grid lines
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;

    const interval = this.config.gridLineInterval;
    const startTime = Math.floor(this.scrollX * this.zoom / interval) * interval;
    const endTime = startTime + (this.canvas.width - this.config.headerWidth) * this.zoom;

    for (let time = startTime; time <= endTime; time += interval) {
      const x = this.timeToPixel(time);
      if (x >= this.config.headerWidth) {
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, this.canvas.height);
        ctx.stroke();
      }
    }

    // Horizontal grid lines (between tracks)
    for (let i = 0; i <= this.timeline.tracks.length; i++) {
      const y = this.getTrackY(i);
      if (y > 30 && y < this.canvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width, y);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw tracks
   */
  private drawTracks(): void {
    const { ctx } = this;

    for (let i = 0; i < this.timeline.tracks.length; i++) {
      const track = this.timeline.tracks[i];
      const y = this.getTrackY(i);

      if (y + this.config.trackHeight < 30 || y > this.canvas.height) {
        continue; // Track not visible
      }

      // Track background
      ctx.fillStyle = i % 2 === 0 ? '#1e1e1e' : '#252525';
      ctx.fillRect(0, y, this.canvas.width, this.config.trackHeight);

      // Track label
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        track.propertyName,
        10,
        y + this.config.trackHeight / 2
      );

      // Track color indicator
      ctx.fillStyle = track.color;
      ctx.fillRect(5, y + 5, 3, this.config.trackHeight - 10);

      // Muted/solo indicators
      if (track.muted) {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('M', this.config.headerWidth - 30, y + this.config.trackHeight / 2);
      }
      if (track.solo) {
        ctx.fillStyle = '#f5a623';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('S', this.config.headerWidth - 15, y + this.config.trackHeight / 2);
      }
    }

    // Track header separator
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.config.headerWidth, 0);
    ctx.lineTo(this.config.headerWidth, this.canvas.height);
    ctx.stroke();
  }

  /**
   * Draw keyframes
   */
  private drawKeyframes(): void {
    const { ctx } = this;

    for (let i = 0; i < this.timeline.tracks.length; i++) {
      const track = this.timeline.tracks[i];
      const trackY = this.getTrackY(i);

      if (trackY + this.config.trackHeight < 30 || trackY > this.canvas.height) {
        continue; // Track not visible
      }

      for (const keyframe of track.keyframes) {
        const x = this.timeToPixel(keyframe.time);

        if (x < this.config.headerWidth || x > this.canvas.width) {
          continue; // Keyframe not visible
        }

        const y = trackY + this.config.trackHeight / 2;

        // Determine keyframe appearance
        const isSelected = this.selection.keyframes.has(keyframe.id);
        const isHovered =
          this.hoveredKeyframe?.keyframe.id === keyframe.id;

        // Draw keyframe diamond
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);

        ctx.fillStyle = isSelected
          ? '#4A90E2'
          : isHovered
            ? '#f5a623'
            : track.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = isSelected ? 2 : 1;

        const size = isHovered ? 8 : 6;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.strokeRect(-size / 2, -size / 2, size, size);

        ctx.restore();
      }
    }
  }

  /**
   * Draw scrubber (playhead)
   */
  private drawScrubber(): void {
    const { ctx } = this;
    const x = this.timeToPixel(this.timeline.currentTime);

    if (x < this.config.headerWidth || x > this.canvas.width) {
      return; // Scrubber not visible
    }

    // Scrubber line
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.canvas.height);
    ctx.stroke();

    // Scrubber head
    ctx.fillStyle = '#e91e63';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 6, 12);
    ctx.lineTo(x + 6, 12);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Format time as MM:SS.mmm
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').substring(0, 1)}`;
  }

  /**
   * Set timeline
   */
  setTimeline(timeline: Timeline): void {
    this.timeline = timeline;
    this.render();
  }

  /**
   * Get selection
   */
  getSelection(): TimelineSelection {
    return this.selection;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selection.keyframes.clear();
    this.selection.tracks.clear();
    this.render();
  }

  /**
   * Delete selected keyframes
   */
  deleteSelectedKeyframes(): void {
    for (const track of this.timeline.tracks) {
      track.keyframes = track.keyframes.filter(
        (kf) => !this.selection.keyframes.has(kf.id)
      );
    }
    this.selection.keyframes.clear();
    this.render();
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onKeyframeSelected?: (track: Track, keyframe: Keyframe) => void;
    onKeyframesMoved?: (
      changes: Array<{ track: Track; keyframe: Keyframe; newTime: number }>
    ) => void;
    onTimeChanged?: (time: number) => void;
  }): void {
    this.onKeyframeSelected = callbacks.onKeyframeSelected;
    this.onKeyframesMoved = callbacks.onKeyframesMoved;
    this.onTimeChanged = callbacks.onTimeChanged;
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.setupCanvas();
    this.render();
  }
}
