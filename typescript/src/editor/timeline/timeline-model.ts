/**
 * Timeline Data Model for SK8
 *
 * Provides the data structures for managing animation timelines:
 * - Keyframes: time + value + easing
 * - Tracks: animated property over time
 * - Timeline: collection of tracks for an actor
 */

import { EasingFunction, Easing } from '../../runtime/animation.js';
import { SK8Actor } from '../../graphics/SK8Actor.js';
import { PropertyValue } from '../../core/SK8Object.js';

/**
 * Property types that can be animated
 */
export type AnimatablePropertyType =
  | 'number'
  | 'position'
  | 'scale'
  | 'rotation'
  | 'opacity'
  | 'color';

/**
 * Keyframe - represents a value at a specific time
 */
export class Keyframe {
  public id: string;
  public time: number; // in milliseconds
  public value: PropertyValue;
  public easing: EasingFunction;
  public easingName: string;

  // Bezier curve control points for custom easing (optional)
  public customBezier?: { p1: { x: number; y: number }; p2: { x: number; y: number } };

  constructor(
    time: number,
    value: PropertyValue,
    easing: EasingFunction = Easing.linear,
    easingName: string = 'linear'
  ) {
    this.id = this.generateId();
    this.time = time;
    this.value = value;
    this.easing = easing;
    this.easingName = easingName;
  }

  private generateId(): string {
    return `kf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clone this keyframe
   */
  clone(): Keyframe {
    const kf = new Keyframe(this.time, this.value, this.easing, this.easingName);
    if (this.customBezier) {
      kf.customBezier = { ...this.customBezier };
    }
    return kf;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      time: this.time,
      value: this.value,
      easingName: this.easingName,
      customBezier: this.customBezier,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): Keyframe {
    const easing = this.getEasingByName(data.easingName);
    const kf = new Keyframe(data.time, data.value, easing, data.easingName);
    kf.id = data.id;
    if (data.customBezier) {
      kf.customBezier = data.customBezier;
    }
    return kf;
  }

  /**
   * Get easing function by name
   */
  private static getEasingByName(name: string): EasingFunction {
    const easingMap: Record<string, EasingFunction> = {
      linear: Easing.linear,
      easeInQuad: Easing.easeInQuad,
      easeOutQuad: Easing.easeOutQuad,
      easeInOutQuad: Easing.easeInOutQuad,
      easeInCubic: Easing.easeInCubic,
      easeOutCubic: Easing.easeOutCubic,
      easeInOutCubic: Easing.easeInOutCubic,
      easeInElastic: Easing.easeInElastic,
      easeOutElastic: Easing.easeOutElastic,
      easeInBounce: Easing.easeInBounce,
      easeOutBounce: Easing.easeOutBounce,
    };
    return easingMap[name] || Easing.linear;
  }
}

/**
 * Track - represents animation for a single property
 */
export class Track {
  public id: string;
  public propertyName: string;
  public propertyType: AnimatablePropertyType;
  public keyframes: Keyframe[] = [];
  public muted: boolean = false;
  public solo: boolean = false;
  public color: string; // Visual color for track display

  constructor(propertyName: string, propertyType: AnimatablePropertyType, color?: string) {
    this.id = this.generateId();
    this.propertyName = propertyName;
    this.propertyType = propertyType;
    this.color = color || this.getDefaultColor(propertyType);
  }

  private generateId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getDefaultColor(type: AnimatablePropertyType): string {
    const colorMap: Record<AnimatablePropertyType, string> = {
      number: '#4A90E2',
      position: '#50C878',
      scale: '#F5A623',
      rotation: '#BD10E0',
      opacity: '#9013FE',
      color: '#E91E63',
    };
    return colorMap[type] || '#4A90E2';
  }

  /**
   * Add a keyframe to the track
   */
  addKeyframe(keyframe: Keyframe): void {
    this.keyframes.push(keyframe);
    this.sortKeyframes();
  }

  /**
   * Remove a keyframe by ID
   */
  removeKeyframe(keyframeId: string): boolean {
    const index = this.keyframes.findIndex((kf) => kf.id === keyframeId);
    if (index !== -1) {
      this.keyframes.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get keyframe by ID
   */
  getKeyframe(keyframeId: string): Keyframe | null {
    return this.keyframes.find((kf) => kf.id === keyframeId) || null;
  }

  /**
   * Update keyframe time (and re-sort)
   */
  updateKeyframeTime(keyframeId: string, newTime: number): boolean {
    const kf = this.getKeyframe(keyframeId);
    if (kf) {
      kf.time = newTime;
      this.sortKeyframes();
      return true;
    }
    return false;
  }

  /**
   * Sort keyframes by time
   */
  private sortKeyframes(): void {
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Get keyframes in a time range
   */
  getKeyframesInRange(startTime: number, endTime: number): Keyframe[] {
    return this.keyframes.filter((kf) => kf.time >= startTime && kf.time <= endTime);
  }

  /**
   * Get interpolated value at a specific time
   */
  getValueAtTime(time: number): PropertyValue {
    if (this.keyframes.length === 0) {
      return null;
    }

    // If before first keyframe, return first keyframe value
    if (time <= this.keyframes[0].time) {
      return this.keyframes[0].value;
    }

    // If after last keyframe, return last keyframe value
    const lastKf = this.keyframes[this.keyframes.length - 1];
    if (time >= lastKf.time) {
      return lastKf.value;
    }

    // Find surrounding keyframes
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      const kf1 = this.keyframes[i];
      const kf2 = this.keyframes[i + 1];

      if (time >= kf1.time && time <= kf2.time) {
        return this.interpolateValue(kf1, kf2, time);
      }
    }

    return null;
  }

  /**
   * Interpolate value between two keyframes
   */
  private interpolateValue(kf1: Keyframe, kf2: Keyframe, time: number): PropertyValue {
    const duration = kf2.time - kf1.time;
    const elapsed = time - kf1.time;
    const progress = duration > 0 ? elapsed / duration : 0;
    const easedProgress = kf2.easing(Math.max(0, Math.min(1, progress)));

    // Handle different property types
    if (typeof kf1.value === 'number' && typeof kf2.value === 'number') {
      return kf1.value + (kf2.value - kf1.value) * easedProgress;
    }

    // Color interpolation
    if (this.propertyType === 'color' && typeof kf1.value === 'object' && typeof kf2.value === 'object' && kf1.value !== null && kf2.value !== null) {
      const c1 = kf1.value as { r: number; g: number; b: number; a?: number };
      const c2 = kf2.value as { r: number; g: number; b: number; a?: number };

      // Type guard to check if both values have r, g, b properties
      if ('r' in c1 && 'g' in c1 && 'b' in c1 && 'r' in c2 && 'g' in c2 && 'b' in c2) {
        return {
          r: Math.round(c1.r + (c2.r - c1.r) * easedProgress),
          g: Math.round(c1.g + (c2.g - c1.g) * easedProgress),
          b: Math.round(c1.b + (c2.b - c1.b) * easedProgress),
          a: c1.a !== undefined && c2.a !== undefined
            ? c1.a + (c2.a - c1.a) * easedProgress
            : undefined,
        };
      }
    }

    // Default: return second keyframe value
    return kf2.value;
  }

  /**
   * Get duration (time of last keyframe)
   */
  getDuration(): number {
    if (this.keyframes.length === 0) return 0;
    return this.keyframes[this.keyframes.length - 1].time;
  }

  /**
   * Clone this track
   */
  clone(): Track {
    const track = new Track(this.propertyName, this.propertyType, this.color);
    track.muted = this.muted;
    track.solo = this.solo;
    track.keyframes = this.keyframes.map((kf) => kf.clone());
    return track;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      propertyName: this.propertyName,
      propertyType: this.propertyType,
      color: this.color,
      muted: this.muted,
      solo: this.solo,
      keyframes: this.keyframes.map((kf) => kf.toJSON()),
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): Track {
    const track = new Track(data.propertyName, data.propertyType, data.color);
    track.id = data.id;
    track.muted = data.muted || false;
    track.solo = data.solo || false;
    track.keyframes = (data.keyframes || []).map((kfData: any) => Keyframe.fromJSON(kfData));
    return track;
  }
}

/**
 * Timeline - manages multiple tracks for an actor
 */
export class Timeline {
  public id: string;
  public actor: SK8Actor | null = null;
  public tracks: Track[] = [];
  public currentTime: number = 0;
  public playing: boolean = false;
  public loop: boolean = false;
  public playbackSpeed: number = 1.0; // 1.0 = normal speed

  constructor(actor?: SK8Actor) {
    this.id = this.generateId();
    this.actor = actor || null;
  }

  private generateId(): string {
    return `timeline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Add a track
   */
  addTrack(track: Track): void {
    this.tracks.push(track);
  }

  /**
   * Remove a track by ID
   */
  removeTrack(trackId: string): boolean {
    const index = this.tracks.findIndex((t) => t.id === trackId);
    if (index !== -1) {
      this.tracks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get track by ID
   */
  getTrack(trackId: string): Track | null {
    return this.tracks.find((t) => t.id === trackId) || null;
  }

  /**
   * Get track by property name
   */
  getTrackByProperty(propertyName: string): Track | null {
    return this.tracks.find((t) => t.propertyName === propertyName) || null;
  }

  /**
   * Get or create track for a property
   */
  getOrCreateTrack(
    propertyName: string,
    propertyType: AnimatablePropertyType
  ): Track {
    const existing = this.getTrackByProperty(propertyName);
    if (existing) return existing;

    const track = new Track(propertyName, propertyType);
    this.addTrack(track);
    return track;
  }

  /**
   * Get total duration of timeline (longest track)
   */
  getDuration(): number {
    if (this.tracks.length === 0) return 0;
    return Math.max(...this.tracks.map((t) => t.getDuration()));
  }

  /**
   * Apply timeline state at current time to actor
   */
  applyToActor(): void {
    if (!this.actor) return;

    for (const track of this.tracks) {
      if (track.muted) continue;

      // Check if any track is soloed
      const hasSolo = this.tracks.some((t) => t.solo);
      if (hasSolo && !track.solo) continue;

      const value = track.getValueAtTime(this.currentTime);
      if (value !== null) {
        this.setActorProperty(track.propertyName, value);
      }
    }
  }

  /**
   * Set actor property (handles special cases)
   */
  private setActorProperty(propertyName: string, value: PropertyValue): void {
    if (!this.actor) return;

    try {
      // Special property handling
      if (propertyName === 'left') {
        this.actor.setLeft(value as number);
      } else if (propertyName === 'top') {
        this.actor.setTop(value as number);
      } else if (propertyName === 'width') {
        this.actor.setWidth(value as number);
      } else if (propertyName === 'height') {
        this.actor.setHeight(value as number);
      } else if (propertyName === 'rotation') {
        this.actor.rotate(value as number);
      } else if (propertyName === 'opacity') {
        this.actor.setOpacity(value as number);
      } else {
        // Use generic set method
        this.actor.set(propertyName, value);
      }
    } catch (error) {
      console.error(`Failed to set property ${propertyName}:`, error);
    }
  }

  /**
   * Seek to a specific time
   */
  seekTo(time: number): void {
    this.currentTime = Math.max(0, time);
    this.applyToActor();
  }

  /**
   * Get all keyframes across all tracks
   */
  getAllKeyframes(): Array<{ track: Track; keyframe: Keyframe }> {
    const result: Array<{ track: Track; keyframe: Keyframe }> = [];
    for (const track of this.tracks) {
      for (const keyframe of track.keyframes) {
        result.push({ track, keyframe });
      }
    }
    return result;
  }

  /**
   * Clone this timeline
   */
  clone(): Timeline {
    const timeline = new Timeline(this.actor || undefined);
    timeline.currentTime = this.currentTime;
    timeline.loop = this.loop;
    timeline.playbackSpeed = this.playbackSpeed;
    timeline.tracks = this.tracks.map((t) => t.clone());
    return timeline;
  }

  /**
   * Export timeline to animation code
   */
  exportToCode(): string {
    const lines: string[] = [];
    lines.push('// Generated animation code');
    lines.push('import { animations, Easing } from "./runtime/animation.js";');
    lines.push('');

    for (const track of this.tracks) {
      if (track.keyframes.length < 2) continue;

      lines.push(`// Animate ${track.propertyName}`);
      for (let i = 0; i < track.keyframes.length - 1; i++) {
        const kf1 = track.keyframes[i];
        const kf2 = track.keyframes[i + 1];
        const duration = kf2.time - kf1.time;

        lines.push(
          `setTimeout(() => {`,
          `  animations.animate(actor, "${track.propertyName}", ${kf2.value}, ${duration}, {`,
          `    easing: Easing.${kf2.easingName}`,
          `  });`,
          `}, ${kf1.time});`
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      currentTime: this.currentTime,
      loop: this.loop,
      playbackSpeed: this.playbackSpeed,
      tracks: this.tracks.map((t) => t.toJSON()),
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any, actor?: SK8Actor): Timeline {
    const timeline = new Timeline(actor);
    timeline.id = data.id;
    timeline.currentTime = data.currentTime || 0;
    timeline.loop = data.loop || false;
    timeline.playbackSpeed = data.playbackSpeed || 1.0;
    timeline.tracks = (data.tracks || []).map((trackData: any) => Track.fromJSON(trackData));
    return timeline;
  }
}

/**
 * Available easing functions for UI display
 */
export const EASING_FUNCTIONS: Array<{ name: string; displayName: string; func: EasingFunction }> = [
  { name: 'linear', displayName: 'Linear', func: Easing.linear },
  { name: 'easeInQuad', displayName: 'Ease In Quad', func: Easing.easeInQuad },
  { name: 'easeOutQuad', displayName: 'Ease Out Quad', func: Easing.easeOutQuad },
  { name: 'easeInOutQuad', displayName: 'Ease In/Out Quad', func: Easing.easeInOutQuad },
  { name: 'easeInCubic', displayName: 'Ease In Cubic', func: Easing.easeInCubic },
  { name: 'easeOutCubic', displayName: 'Ease Out Cubic', func: Easing.easeOutCubic },
  { name: 'easeInOutCubic', displayName: 'Ease In/Out Cubic', func: Easing.easeInOutCubic },
  { name: 'easeInElastic', displayName: 'Ease In Elastic', func: Easing.easeInElastic },
  { name: 'easeOutElastic', displayName: 'Ease Out Elastic', func: Easing.easeOutElastic },
  { name: 'easeInBounce', displayName: 'Ease In Bounce', func: Easing.easeInBounce },
  { name: 'easeOutBounce', displayName: 'Ease Out Bounce', func: Easing.easeOutBounce },
];
