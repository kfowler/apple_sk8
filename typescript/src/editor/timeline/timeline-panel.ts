/**
 * Timeline Panel - Main integration component
 *
 * Combines:
 * - Timeline View (visual timeline)
 * - Keyframe Editor (property editing)
 * - Playback Controls (play/pause/export)
 *
 * Integrates with:
 * - SK8Editor (command pattern for undo/redo)
 * - SK8Actor (animation target)
 */

import { Timeline, Track, Keyframe, AnimatablePropertyType } from './timeline-model.js';
import { TimelineView } from './timeline-view.js';
import { KeyframeEditor } from './keyframe-editor.js';
import { PlaybackControls } from './playback.js';
import { SK8Actor } from '../../graphics/SK8Actor.js';
import { SK8Editor, BaseCommand } from '../editor.js';
import { PropertyValue } from '../../core/SK8Object.js';

/**
 * Commands for timeline operations
 */

/**
 * Add keyframe command
 */
export class AddKeyframeCommand extends BaseCommand {
  constructor(
    private track: Track,
    private keyframe: Keyframe
  ) {
    super();
  }

  get description(): string {
    return `Add keyframe at ${this.keyframe.time}ms`;
  }

  execute(): void {
    this.track.addKeyframe(this.keyframe);
  }

  undo(): void {
    this.track.removeKeyframe(this.keyframe.id);
  }
}

/**
 * Remove keyframe command
 */
export class RemoveKeyframeCommand extends BaseCommand {
  private keyframeData: any;
  private index: number = -1;

  constructor(
    private track: Track,
    private keyframe: Keyframe
  ) {
    super();
    this.keyframeData = keyframe.toJSON();
    this.index = track.keyframes.indexOf(keyframe);
  }

  get description(): string {
    return `Remove keyframe at ${this.keyframe.time}ms`;
  }

  execute(): void {
    this.track.removeKeyframe(this.keyframe.id);
  }

  undo(): void {
    const kf = Keyframe.fromJSON(this.keyframeData);
    this.track.keyframes.splice(this.index, 0, kf);
  }
}

/**
 * Move keyframes command
 */
export class MoveKeyframesCommand extends BaseCommand {
  private originalTimes: Map<string, number> = new Map();

  constructor(
    private changes: Array<{ track: Track; keyframe: Keyframe; newTime: number }>
  ) {
    super();
    for (const { keyframe } of changes) {
      this.originalTimes.set(keyframe.id, keyframe.time);
    }
  }

  get description(): string {
    return `Move ${this.changes.length} keyframe(s)`;
  }

  execute(): void {
    for (const { track, keyframe, newTime } of this.changes) {
      track.updateKeyframeTime(keyframe.id, newTime);
    }
  }

  undo(): void {
    for (const { track, keyframe } of this.changes) {
      const originalTime = this.originalTimes.get(keyframe.id);
      if (originalTime !== undefined) {
        track.updateKeyframeTime(keyframe.id, originalTime);
      }
    }
  }
}

/**
 * Update keyframe command
 */
export class UpdateKeyframeCommand extends BaseCommand {
  private oldValue: PropertyValue;

  constructor(
    private keyframe: Keyframe,
    private property: 'time' | 'value' | 'easing',
    private newValue: any
  ) {
    super();
    this.oldValue = keyframe[property];
  }

  get description(): string {
    return `Update keyframe ${this.property}`;
  }

  execute(): void {
    (this.keyframe as any)[this.property] = this.newValue;
  }

  undo(): void {
    (this.keyframe as any)[this.property] = this.oldValue;
  }
}

/**
 * Add track command
 */
export class AddTrackCommand extends BaseCommand {
  constructor(
    private timeline: Timeline,
    private track: Track
  ) {
    super();
  }

  get description(): string {
    return `Add track: ${this.track.propertyName}`;
  }

  execute(): void {
    this.timeline.addTrack(this.track);
  }

  undo(): void {
    this.timeline.removeTrack(this.track.id);
  }
}

/**
 * Remove track command
 */
export class RemoveTrackCommand extends BaseCommand {
  private trackData: any;
  private index: number = -1;

  constructor(
    private timeline: Timeline,
    private track: Track
  ) {
    super();
    this.trackData = track.toJSON();
    this.index = timeline.tracks.indexOf(track);
  }

  get description(): string {
    return `Remove track: ${this.track.propertyName}`;
  }

  execute(): void {
    this.timeline.removeTrack(this.track.id);
  }

  undo(): void {
    const track = Track.fromJSON(this.trackData);
    this.timeline.tracks.splice(this.index, 0, track);
  }
}

/**
 * Timeline Panel - Main UI component
 */
export class TimelinePanel {
  private container: HTMLElement;
  private timeline: Timeline;
  private editor: SK8Editor | null = null;

  // Sub-components
  private timelineView: TimelineView | null = null;
  private keyframeEditor: KeyframeEditor;
  private playbackControls: PlaybackControls;

  // UI containers
  private viewCanvas: HTMLCanvasElement;
  private editorContainer: HTMLElement;
  private controlsContainer: HTMLElement;

  constructor(container: HTMLElement, actor?: SK8Actor, editor?: SK8Editor) {
    this.container = container;
    this.timeline = new Timeline(actor);
    this.editor = editor || null;

    // Create UI structure
    this.container.innerHTML = '';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.background = '#1e1e1e';
    this.container.style.color = '#e0e0e0';

    // Playback controls
    this.controlsContainer = document.createElement('div');
    this.container.appendChild(this.controlsContainer);

    // Main content area (timeline view + keyframe editor)
    const mainContent = document.createElement('div');
    mainContent.style.display = 'flex';
    mainContent.style.flex = '1';
    mainContent.style.overflow = 'hidden';

    // Timeline view (canvas)
    const viewContainer = document.createElement('div');
    viewContainer.style.flex = '1';
    viewContainer.style.overflow = 'hidden';
    viewContainer.style.position = 'relative';

    this.viewCanvas = document.createElement('canvas');
    viewContainer.appendChild(this.viewCanvas);

    // Keyframe editor (sidebar)
    this.editorContainer = document.createElement('div');
    this.editorContainer.style.width = '250px';
    this.editorContainer.style.borderLeft = '1px solid #444';
    this.editorContainer.style.background = '#252525';
    this.editorContainer.style.overflow = 'auto';

    mainContent.appendChild(viewContainer);
    mainContent.appendChild(this.editorContainer);
    this.container.appendChild(mainContent);

    // Initialize components
    this.playbackControls = new PlaybackControls(this.timeline, this.controlsContainer);
    this.keyframeEditor = new KeyframeEditor(this.editorContainer);

    // Setup timeline view after a brief delay to ensure container is sized
    setTimeout(() => {
      const rect = viewContainer.getBoundingClientRect();
      this.timelineView = new TimelineView(this.viewCanvas, this.timeline, {
        width: rect.width,
        height: rect.height,
      });

      this.setupCallbacks();
    }, 0);

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.timelineView) {
        const rect = viewContainer.getBoundingClientRect();
        this.timelineView.resize(rect.width, rect.height);
      }
    });
  }

  /**
   * Setup callbacks between components
   */
  private setupCallbacks(): void {
    if (!this.timelineView) return;

    // Timeline view callbacks
    this.timelineView.setCallbacks({
      onKeyframeSelected: (track, keyframe) => {
        this.keyframeEditor.showKeyframe(track, keyframe);
      },
      onKeyframesMoved: (changes) => {
        // Create undo command
        if (this.editor) {
          const command = new MoveKeyframesCommand(changes);
          this.editor.executeCommand(command);
        }
        if (this.timelineView) {
          this.timelineView.render();
        }
      },
      onTimeChanged: (time) => {
        // Update playback controls
        this.playbackControls.setCallbacks({});
      },
    });

    // Keyframe editor callbacks
    this.keyframeEditor.setCallbacks({
      onKeyframeChanged: (_track, _keyframe) => {
        if (this.timelineView) {
          this.timelineView.render();
        }
      },
      onBatchDelete: (_keyframes) => {
        if (this.timelineView) {
          this.timelineView.clearSelection();
          this.timelineView.render();
        }
      },
    });

    // Playback controls callbacks
    this.playbackControls.setCallbacks({
      onPlayStateChanged: (_playing) => {
        // Could update UI state
      },
      onTimeUpdated: (_time) => {
        if (this.timelineView) {
          this.timelineView.render();
        }
      },
    });
  }

  /**
   * Set the actor for the timeline
   */
  setActor(actor: SK8Actor): void {
    this.timeline.actor = actor;
  }

  /**
   * Add a track for a property
   */
  addTrack(propertyName: string, propertyType: AnimatablePropertyType): Track {
    const track = new Track(propertyName, propertyType);

    if (this.editor) {
      const command = new AddTrackCommand(this.timeline, track);
      this.editor.executeCommand(command);
    } else {
      this.timeline.addTrack(track);
    }

    if (this.timelineView) {
      this.timelineView.render();
    }

    return track;
  }

  /**
   * Remove a track
   */
  removeTrack(trackId: string): boolean {
    const track = this.timeline.getTrack(trackId);
    if (!track) return false;

    if (this.editor) {
      const command = new RemoveTrackCommand(this.timeline, track);
      this.editor.executeCommand(command);
    } else {
      this.timeline.removeTrack(trackId);
    }

    if (this.timelineView) {
      this.timelineView.render();
    }

    return true;
  }

  /**
   * Add a keyframe to a track
   */
  addKeyframe(
    trackId: string,
    time: number,
    value: PropertyValue,
    easingName: string = 'linear'
  ): Keyframe | null {
    const track = this.timeline.getTrack(trackId);
    if (!track) return null;

    const easingFunc = EASING_FUNCTIONS.find((e) => e.name === easingName);
    const keyframe = new Keyframe(
      time,
      value,
      easingFunc?.func,
      easingName
    );

    if (this.editor) {
      const command = new AddKeyframeCommand(track, keyframe);
      this.editor.executeCommand(command);
    } else {
      track.addKeyframe(keyframe);
    }

    if (this.timelineView) {
      this.timelineView.render();
    }

    return keyframe;
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(trackId: string, keyframeId: string): boolean {
    const track = this.timeline.getTrack(trackId);
    if (!track) return false;

    const keyframe = track.getKeyframe(keyframeId);
    if (!keyframe) return false;

    if (this.editor) {
      const command = new RemoveKeyframeCommand(track, keyframe);
      this.editor.executeCommand(command);
    } else {
      track.removeKeyframe(keyframeId);
    }

    if (this.timelineView) {
      this.timelineView.render();
    }

    return true;
  }

  /**
   * Get the timeline
   */
  getTimeline(): Timeline {
    return this.timeline;
  }

  /**
   * Set the timeline
   */
  setTimeline(timeline: Timeline): void {
    this.timeline = timeline;
    if (this.timelineView) {
      this.timelineView.setTimeline(timeline);
    }
    this.playbackControls.setTimeline(timeline);
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Let playback controls handle first
    if (this.playbackControls.handleKeyDown(event)) {
      return true;
    }

    // Delete selected keyframes
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.timelineView) {
        this.timelineView.deleteSelectedKeyframes();
        return true;
      }
    }

    return false;
  }

  /**
   * Destroy the panel
   */
  destroy(): void {
    this.playbackControls.destroy();
  }
}

// Re-export for convenience
import { EASING_FUNCTIONS } from './timeline-model.js';
export { Timeline, Track, Keyframe, AnimatablePropertyType, EASING_FUNCTIONS };
