/**
 * Timeline Editor Tests
 *
 * Comprehensive test suite covering:
 * - Keyframe CRUD operations
 * - Track management
 * - Interpolation accuracy
 * - Timeline playback
 * - Export functionality
 * - Edge cases
 */

import {
  Keyframe,
  Track,
  Timeline,
  EASING_FUNCTIONS,
} from '../src/editor/timeline/timeline-model';
import { Easing } from '../src/runtime/animation';

// Mock SK8Actor for testing
class MockActor {
  public left: number = 0;
  public top: number = 0;
  public width: number = 100;
  public height: number = 100;
  public rotation: number = 0;
  public opacity: number = 1;

  setLeft(value: number): void {
    this.left = value;
  }
  setTop(value: number): void {
    this.top = value;
  }
  setWidth(value: number): void {
    this.width = value;
  }
  setHeight(value: number): void {
    this.height = value;
  }
  rotate(value: number): void {
    this.rotation = value;
  }
  setOpacity(value: number): void {
    this.opacity = value;
  }
  set(property: string, value: any): void {
    (this as any)[property] = value;
  }
}

describe('Timeline - Keyframe', () => {
  test('creates keyframe with default easing', () => {
    const kf = new Keyframe(1000, 100);
    expect(kf.time).toBe(1000);
    expect(kf.value).toBe(100);
    expect(kf.easingName).toBe('linear');
  });

  test('creates keyframe with custom easing', () => {
    const kf = new Keyframe(500, 50, Easing.easeInQuad, 'easeInQuad');
    expect(kf.time).toBe(500);
    expect(kf.value).toBe(50);
    expect(kf.easingName).toBe('easeInQuad');
  });

  test('generates unique IDs', () => {
    const kf1 = new Keyframe(0, 0);
    const kf2 = new Keyframe(0, 0);
    expect(kf1.id).not.toBe(kf2.id);
  });

  test('clones keyframe correctly', () => {
    const kf1 = new Keyframe(1000, 100, Easing.easeOutQuad, 'easeOutQuad');
    const kf2 = kf1.clone();
    expect(kf2.time).toBe(kf1.time);
    expect(kf2.value).toBe(kf1.value);
    expect(kf2.easingName).toBe(kf1.easingName);
    expect(kf2.id).not.toBe(kf1.id); // Different instance
  });

  test('serializes to JSON', () => {
    const kf = new Keyframe(1000, 100, Easing.linear, 'linear');
    const json = kf.toJSON();
    expect(json.time).toBe(1000);
    expect(json.value).toBe(100);
    expect(json.easingName).toBe('linear');
  });

  test('deserializes from JSON', () => {
    const json = {
      id: 'test_id',
      time: 2000,
      value: 200,
      easingName: 'easeInCubic',
    };
    const kf = Keyframe.fromJSON(json);
    expect(kf.id).toBe('test_id');
    expect(kf.time).toBe(2000);
    expect(kf.value).toBe(200);
    expect(kf.easingName).toBe('easeInCubic');
  });
});

describe('Timeline - Track', () => {
  test('creates track with default color', () => {
    const track = new Track('left', 'position');
    expect(track.propertyName).toBe('left');
    expect(track.propertyType).toBe('position');
    expect(track.color).toBeTruthy();
  });

  test('adds keyframes and sorts by time', () => {
    const track = new Track('opacity', 'opacity');
    track.addKeyframe(new Keyframe(2000, 0.5));
    track.addKeyframe(new Keyframe(1000, 1.0));
    track.addKeyframe(new Keyframe(3000, 0.0));

    expect(track.keyframes.length).toBe(3);
    expect(track.keyframes[0].time).toBe(1000);
    expect(track.keyframes[1].time).toBe(2000);
    expect(track.keyframes[2].time).toBe(3000);
  });

  test('removes keyframe by ID', () => {
    const track = new Track('rotation', 'rotation');
    const kf = new Keyframe(1000, 90);
    track.addKeyframe(kf);

    expect(track.keyframes.length).toBe(1);
    const removed = track.removeKeyframe(kf.id);
    expect(removed).toBe(true);
    expect(track.keyframes.length).toBe(0);
  });

  test('gets keyframe by ID', () => {
    const track = new Track('left', 'position');
    const kf = new Keyframe(1000, 100);
    track.addKeyframe(kf);

    const found = track.getKeyframe(kf.id);
    expect(found).toBe(kf);
  });

  test('updates keyframe time and re-sorts', () => {
    const track = new Track('left', 'position');
    const kf1 = new Keyframe(1000, 100);
    const kf2 = new Keyframe(2000, 200);
    const kf3 = new Keyframe(3000, 300);

    track.addKeyframe(kf1);
    track.addKeyframe(kf2);
    track.addKeyframe(kf3);

    // Move kf3 to time 500 (should become first)
    track.updateKeyframeTime(kf3.id, 500);

    expect(track.keyframes[0]).toBe(kf3);
    expect(track.keyframes[0].time).toBe(500);
  });

  test('gets keyframes in time range', () => {
    const track = new Track('opacity', 'opacity');
    track.addKeyframe(new Keyframe(1000, 1.0));
    track.addKeyframe(new Keyframe(2000, 0.5));
    track.addKeyframe(new Keyframe(3000, 0.0));

    const inRange = track.getKeyframesInRange(1500, 2500);
    expect(inRange.length).toBe(1);
    expect(inRange[0].time).toBe(2000);
  });

  test('interpolates value between keyframes with linear easing', () => {
    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0, Easing.linear, 'linear'));
    track.addKeyframe(new Keyframe(1000, 100, Easing.linear, 'linear'));

    const value = track.getValueAtTime(500);
    expect(value).toBe(50); // Linear interpolation
  });

  test('interpolates value with easeInQuad', () => {
    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0, Easing.linear, 'linear'));
    track.addKeyframe(new Keyframe(1000, 100, Easing.easeInQuad, 'easeInQuad'));

    const value = track.getValueAtTime(500);
    // At t=0.5, easeInQuad gives 0.25, so value should be 25
    expect(value).toBe(25);
  });

  test('returns first keyframe value before first keyframe', () => {
    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(1000, 100));

    const value = track.getValueAtTime(500);
    expect(value).toBe(100);
  });

  test('returns last keyframe value after last keyframe', () => {
    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(1000, 100));
    track.addKeyframe(new Keyframe(2000, 200));

    const value = track.getValueAtTime(3000);
    expect(value).toBe(200);
  });

  test('calculates duration correctly', () => {
    const track = new Track('opacity', 'opacity');
    track.addKeyframe(new Keyframe(500, 1.0));
    track.addKeyframe(new Keyframe(2000, 0.5));
    track.addKeyframe(new Keyframe(1500, 0.75));

    expect(track.getDuration()).toBe(2000);
  });

  test('clones track with all keyframes', () => {
    const track = new Track('rotation', 'rotation');
    track.addKeyframe(new Keyframe(0, 0));
    track.addKeyframe(new Keyframe(1000, 360));
    track.muted = true;
    track.solo = true;

    const clone = track.clone();
    expect(clone.propertyName).toBe(track.propertyName);
    expect(clone.keyframes.length).toBe(track.keyframes.length);
    expect(clone.muted).toBe(true);
    expect(clone.solo).toBe(true);
    expect(clone.id).not.toBe(track.id);
  });

  test('serializes and deserializes track', () => {
    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0));
    track.addKeyframe(new Keyframe(1000, 100));
    track.muted = true;

    const json = track.toJSON();
    const restored = Track.fromJSON(json);

    expect(restored.propertyName).toBe(track.propertyName);
    expect(restored.propertyType).toBe(track.propertyType);
    expect(restored.keyframes.length).toBe(track.keyframes.length);
    expect(restored.muted).toBe(true);
  });
});

describe('Timeline - Timeline', () => {
  test('creates timeline without actor', () => {
    const timeline = new Timeline();
    expect(timeline.actor).toBeNull();
    expect(timeline.tracks.length).toBe(0);
    expect(timeline.currentTime).toBe(0);
  });

  test('creates timeline with actor', () => {
    const actor = new MockActor();
    const timeline = new Timeline(actor as any);
    expect(timeline.actor).toBe(actor);
  });

  test('adds and removes tracks', () => {
    const timeline = new Timeline();
    const track = new Track('left', 'position');

    timeline.addTrack(track);
    expect(timeline.tracks.length).toBe(1);

    const removed = timeline.removeTrack(track.id);
    expect(removed).toBe(true);
    expect(timeline.tracks.length).toBe(0);
  });

  test('gets track by property name', () => {
    const timeline = new Timeline();
    const track = new Track('opacity', 'opacity');
    timeline.addTrack(track);

    const found = timeline.getTrackByProperty('opacity');
    expect(found).toBe(track);
  });

  test('gets or creates track', () => {
    const timeline = new Timeline();

    const track1 = timeline.getOrCreateTrack('left', 'position');
    expect(timeline.tracks.length).toBe(1);

    const track2 = timeline.getOrCreateTrack('left', 'position');
    expect(timeline.tracks.length).toBe(1);
    expect(track1).toBe(track2);
  });

  test('calculates duration from longest track', () => {
    const timeline = new Timeline();

    const track1 = new Track('left', 'position');
    track1.addKeyframe(new Keyframe(0, 0));
    track1.addKeyframe(new Keyframe(1000, 100));

    const track2 = new Track('opacity', 'opacity');
    track2.addKeyframe(new Keyframe(0, 1));
    track2.addKeyframe(new Keyframe(2000, 0));

    timeline.addTrack(track1);
    timeline.addTrack(track2);

    expect(timeline.getDuration()).toBe(2000);
  });

  test('applies timeline to actor', () => {
    const actor = new MockActor();
    const timeline = new Timeline(actor as any);

    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0));
    track.addKeyframe(new Keyframe(1000, 100));
    timeline.addTrack(track);

    timeline.seekTo(500);
    expect(actor.left).toBe(50);
  });

  test('respects muted tracks', () => {
    const actor = new MockActor();
    const timeline = new Timeline(actor as any);

    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0));
    track.addKeyframe(new Keyframe(1000, 100));
    track.muted = true;
    timeline.addTrack(track);

    timeline.seekTo(500);
    expect(actor.left).toBe(0); // Not applied because muted
  });

  test('respects solo tracks', () => {
    const actor = new MockActor();
    const timeline = new Timeline(actor as any);

    const track1 = new Track('left', 'position');
    track1.addKeyframe(new Keyframe(0, 0));
    track1.addKeyframe(new Keyframe(1000, 100));

    const track2 = new Track('top', 'position');
    track2.addKeyframe(new Keyframe(0, 0));
    track2.addKeyframe(new Keyframe(1000, 200));
    track2.solo = true;

    timeline.addTrack(track1);
    timeline.addTrack(track2);

    timeline.seekTo(1000);
    expect(actor.left).toBe(0); // Not applied because track2 is solo
    expect(actor.top).toBe(200); // Applied because solo
  });

  test('seeks to specific time', () => {
    const timeline = new Timeline();
    timeline.seekTo(1500);
    expect(timeline.currentTime).toBe(1500);
  });

  test('clamps seek time to non-negative', () => {
    const timeline = new Timeline();
    timeline.seekTo(-500);
    expect(timeline.currentTime).toBe(0);
  });

  test('gets all keyframes across tracks', () => {
    const timeline = new Timeline();

    const track1 = new Track('left', 'position');
    track1.addKeyframe(new Keyframe(0, 0));
    track1.addKeyframe(new Keyframe(1000, 100));

    const track2 = new Track('opacity', 'opacity');
    track2.addKeyframe(new Keyframe(500, 1));

    timeline.addTrack(track1);
    timeline.addTrack(track2);

    const all = timeline.getAllKeyframes();
    expect(all.length).toBe(3);
  });

  test('clones timeline', () => {
    const actor = new MockActor();
    const timeline = new Timeline(actor as any);

    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0));
    timeline.addTrack(track);
    timeline.seekTo(500);
    timeline.loop = true;
    timeline.playbackSpeed = 2.0;

    const clone = timeline.clone();
    expect(clone.actor).toBe(actor);
    expect(clone.tracks.length).toBe(1);
    expect(clone.currentTime).toBe(500);
    expect(clone.loop).toBe(true);
    expect(clone.playbackSpeed).toBe(2.0);
  });

  test('exports to animation code', () => {
    const timeline = new Timeline();

    const track = new Track('left', 'position');
    track.addKeyframe(new Keyframe(0, 0, Easing.linear, 'linear'));
    track.addKeyframe(new Keyframe(1000, 100, Easing.easeInQuad, 'easeInQuad'));
    timeline.addTrack(track);

    const code = timeline.exportToCode();
    expect(code).toContain('animations.animate');
    expect(code).toContain('left');
    expect(code).toContain('easeInQuad');
  });

  test('serializes and deserializes timeline', () => {
    const timeline = new Timeline();
    const track = new Track('opacity', 'opacity');
    track.addKeyframe(new Keyframe(0, 1));
    track.addKeyframe(new Keyframe(1000, 0));
    timeline.addTrack(track);
    timeline.currentTime = 500;
    timeline.loop = true;
    timeline.playbackSpeed = 1.5;

    const json = timeline.toJSON();
    const restored = Timeline.fromJSON(json);

    expect(restored.tracks.length).toBe(1);
    expect(restored.currentTime).toBe(500);
    expect(restored.loop).toBe(true);
    expect(restored.playbackSpeed).toBe(1.5);
  });
});

describe('Timeline - Easing Functions', () => {
  test('all easing functions are available', () => {
    expect(EASING_FUNCTIONS.length).toBeGreaterThan(0);

    const names = EASING_FUNCTIONS.map((e) => e.name);
    expect(names).toContain('linear');
    expect(names).toContain('easeInQuad');
    expect(names).toContain('easeOutQuad');
    expect(names).toContain('easeInOutQuad');
  });

  test('easing functions work correctly', () => {
    const linear = EASING_FUNCTIONS.find((e) => e.name === 'linear')!;
    expect(linear.func(0.5)).toBe(0.5);

    const easeInQuad = EASING_FUNCTIONS.find((e) => e.name === 'easeInQuad')!;
    expect(easeInQuad.func(0.5)).toBe(0.25);
  });
});

describe('Timeline - Edge Cases', () => {
  test('handles empty track interpolation', () => {
    const track = new Track('left', 'position');
    const value = track.getValueAtTime(1000);
    expect(value).toBeNull();
  });

  test('handles single keyframe track', () => {
    const track = new Track('opacity', 'opacity');
    track.addKeyframe(new Keyframe(1000, 0.5));

    expect(track.getValueAtTime(0)).toBe(0.5);
    expect(track.getValueAtTime(1000)).toBe(0.5);
    expect(track.getValueAtTime(2000)).toBe(0.5);
  });

  test('handles overlapping keyframes (same time)', () => {
    const track = new Track('left', 'position');
    const kf1 = new Keyframe(1000, 100);
    const kf2 = new Keyframe(1000, 200);

    track.addKeyframe(kf1);
    track.addKeyframe(kf2);

    // Both keyframes exist at same time - last one wins
    expect(track.keyframes.length).toBe(2);
  });

  test('handles very large time values', () => {
    const track = new Track('opacity', 'opacity');
    track.addKeyframe(new Keyframe(0, 1));
    track.addKeyframe(new Keyframe(1000000, 0));

    const value = track.getValueAtTime(500000);
    expect(value).toBe(0.5);
  });

  test('handles negative time values gracefully', () => {
    const timeline = new Timeline();
    timeline.seekTo(-1000);
    expect(timeline.currentTime).toBe(0);
  });

  test('handles color interpolation', () => {
    const track = new Track('fillColor', 'color');
    track.addKeyframe(
      new Keyframe(0, { r: 255, g: 0, b: 0 }, Easing.linear, 'linear')
    );
    track.addKeyframe(
      new Keyframe(1000, { r: 0, g: 255, b: 0 }, Easing.linear, 'linear')
    );

    const value = track.getValueAtTime(500) as any;
    expect(value.r).toBe(128);
    expect(value.g).toBe(128);
    expect(value.b).toBe(0);
  });

  test('handles playback speed edge cases', () => {
    const timeline = new Timeline();
    timeline.playbackSpeed = 0;
    expect(timeline.playbackSpeed).toBe(0);

    timeline.playbackSpeed = 10;
    expect(timeline.playbackSpeed).toBe(10);
  });
});

describe('Timeline - Performance', () => {
  test('handles many keyframes efficiently', () => {
    const track = new Track('left', 'position');

    const startTime = Date.now();

    // Add 1000 keyframes
    for (let i = 0; i < 1000; i++) {
      track.addKeyframe(new Keyframe(i * 10, i));
    }

    const addTime = Date.now() - startTime;
    expect(addTime).toBeLessThan(1000); // Should complete in less than 1 second

    // Test interpolation
    const interpStartTime = Date.now();
    for (let i = 0; i < 100; i++) {
      track.getValueAtTime(i * 100);
    }
    const interpTime = Date.now() - interpStartTime;
    expect(interpTime).toBeLessThan(100); // Should be fast
  });

  test('handles many tracks efficiently', () => {
    const timeline = new Timeline();

    const startTime = Date.now();

    // Add 100 tracks
    for (let i = 0; i < 100; i++) {
      const track = new Track(`property${i}`, 'number');
      track.addKeyframe(new Keyframe(0, 0));
      track.addKeyframe(new Keyframe(1000, 100));
      timeline.addTrack(track);
    }

    const addTime = Date.now() - startTime;
    expect(addTime).toBeLessThan(1000);
  });
});
