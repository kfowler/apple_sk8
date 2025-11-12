/**
 * Media Tests - Testing image, video, and audio functionality
 */

import {
  SK8Image,
  SK8Picture,
  SK8MovieRectangle,
  SK8Sound,
  ImageFitMode,
  VideoFitMode,
  SoundState,
  MediaManager,
  MediaType,
  MediaStatus,
  getAudioContext,
  playBeep,
} from '../src/sk8.js';

describe('SK8Image Enhanced', () => {
  let image: SK8Image;

  beforeEach(() => {
    image = new SK8Image();
  });

  test('should create image with default properties', () => {
    expect(image.getSource()).toBeNull();
    expect(image.isLoaded()).toBe(false);
    expect(image.isLoading()).toBe(false);
  });

  test('should support fit modes', () => {
    image.setFitMode(ImageFitMode.CONTAIN);
    expect(image.getFitMode()).toBe(ImageFitMode.CONTAIN);

    image.setFitMode(ImageFitMode.COVER);
    expect(image.getFitMode()).toBe(ImageFitMode.COVER);
  });

  test('should support aspect ratio', () => {
    expect(image.getMaintainAspectRatio()).toBe(true);

    image.setMaintainAspectRatio(false);
    expect(image.getMaintainAspectRatio()).toBe(false);
  });

  test('should support transformations', () => {
    image.setFlipHorizontal(true);
    image.setFlipVertical(true);
    image.setCrop(10, 10, 100, 100);

    // Just verify no errors thrown
    expect(image).toBeDefined();
  });

  test('should support effects', () => {
    image.setBrightness(1.5);
    image.setContrast(1.2);
    image.setGrayscale(true);
    image.setBlur(5);
    image.setOpacity(0.8);

    // Effects applied successfully
    expect(image).toBeDefined();
  });

  test('should support cache management', () => {
    SK8Image.clearCache();
    expect(SK8Image.getCacheSize()).toBe(0);

    SK8Image.setCacheEnabled(true);
    expect(SK8Image.getCacheSize()).toBeGreaterThanOrEqual(0);
  });
});

describe('SK8Picture', () => {
  let picture: SK8Picture;

  beforeEach(() => {
    picture = new SK8Picture();
  });

  test('should create picture', () => {
    expect(picture).toBeDefined();
    expect(picture.getAllowFileSelection()).toBe(false);
    expect(picture.getAllowDragDrop()).toBe(false);
  });

  test('should enable file selection', () => {
    picture.setAllowFileSelection(true);
    expect(picture.getAllowFileSelection()).toBe(true);
  });

  test('should enable drag and drop', () => {
    picture.setAllowDragDrop(true);
    expect(picture.getAllowDragDrop()).toBe(true);
    expect(picture.getDroppable()).toBe(true);
  });

  test('should set accepted formats', () => {
    picture.setAcceptedFormats('image/png');
    expect(picture.getAcceptedFormats()).toBe('image/png');
  });

  test('should create canvas from image', () => {
    const canvas = picture.toCanvas();
    expect(canvas).toBeNull(); // No image loaded
  });
});

describe('SK8MovieRectangle', () => {
  let movie: SK8MovieRectangle;

  beforeEach(() => {
    movie = new SK8MovieRectangle();
  });

  afterEach(() => {
    movie.dispose();
  });

  test('should create movie rectangle', () => {
    expect(movie).toBeDefined();
    expect(movie.getSource()).toBeNull();
    expect(movie.isPlayingVideo()).toBe(false);
  });

  test('should set fit mode', () => {
    movie.setFitMode(VideoFitMode.CONTAIN);
    expect(movie.getFitMode()).toBe(VideoFitMode.CONTAIN);

    movie.setFitMode(VideoFitMode.COVER);
    expect(movie.getFitMode()).toBe(VideoFitMode.COVER);
  });

  test('should control volume', () => {
    movie.setVolume(0.5);
    expect(movie.getVolume()).toBe(0.5);

    movie.setVolume(1.5); // Should clamp to 1
    expect(movie.getVolume()).toBe(1);

    movie.setVolume(-0.5); // Should clamp to 0
    expect(movie.getVolume()).toBe(0);
  });

  test('should control playback rate', () => {
    movie.setPlaybackRate(1.5);
    expect(movie.getPlaybackRate()).toBe(1.5);

    movie.setPlaybackRate(5); // Should clamp to 4
    expect(movie.getPlaybackRate()).toBe(4);

    movie.setPlaybackRate(0.1); // Should clamp to 0.25
    expect(movie.getPlaybackRate()).toBe(0.25);
  });

  test('should control mute', () => {
    expect(movie.getMuted()).toBe(false);

    movie.setMuted(true);
    expect(movie.getMuted()).toBe(true);
  });

  test('should show/hide controls', () => {
    expect(movie.getShowControls()).toBe(false);

    movie.setShowControls(true);
    expect(movie.getShowControls()).toBe(true);
  });

  test('should get duration and current time', () => {
    expect(movie.getDuration()).toBe(0);
    expect(movie.getCurrentTime()).toBe(0);
  });

  test('should check playback state', () => {
    expect(movie.isPaused()).toBe(true);
    expect(movie.hasEnded()).toBe(false);
  });

  test('should get video dimensions', () => {
    expect(movie.getVideoWidth()).toBe(0);
    expect(movie.getVideoHeight()).toBe(0);
  });
});

describe('SK8Sound', () => {
  let sound: SK8Sound;

  beforeEach(() => {
    sound = new SK8Sound();
  });

  afterEach(() => {
    sound.dispose();
  });

  test('should create sound', () => {
    expect(sound).toBeDefined();
    expect(sound.getSource()).toBeNull();
    expect(sound.getState()).toBe(SoundState.IDLE);
  });

  test('should set volume', () => {
    sound.setVolume(0.5);
    expect(sound.getVolume()).toBe(0.5);

    sound.setVolume(1.5); // Should clamp to 1
    expect(sound.getVolume()).toBe(1);

    sound.setVolume(-0.5); // Should clamp to 0
    expect(sound.getVolume()).toBe(0);
  });

  test('should set loop', () => {
    expect(sound.getLoop()).toBe(false);

    sound.setLoop(true);
    expect(sound.getLoop()).toBe(true);
  });

  test('should set playback rate', () => {
    sound.setPlaybackRate(1.5);
    expect(sound.getPlaybackRate()).toBe(1.5);

    sound.setPlaybackRate(5); // Should clamp to 4
    expect(sound.getPlaybackRate()).toBe(4);

    sound.setPlaybackRate(0.1); // Should clamp to 0.25
    expect(sound.getPlaybackRate()).toBe(0.25);
  });

  test('should check state', () => {
    expect(sound.isPlaying()).toBe(false);
    expect(sound.isPaused()).toBe(false);
    expect(sound.isLoaded()).toBe(false);
  });

  test('should get duration and current time', () => {
    expect(sound.getDuration()).toBe(0);
    expect(sound.getCurrentTime()).toBe(0);
  });
});

describe('MediaManager', () => {
  let manager: MediaManager;

  beforeEach(() => {
    manager = MediaManager.getInstance();
    manager.clear();
  });

  afterEach(() => {
    manager.clear();
  });

  test('should be a singleton', () => {
    const manager2 = MediaManager.getInstance();
    expect(manager).toBe(manager2);
  });

  test('should register assets', () => {
    manager.register('image1', 'https://example.com/image.png', MediaType.IMAGE);
    const asset = manager.get('image1');

    expect(asset).toBeDefined();
    expect(asset?.id).toBe('image1');
    expect(asset?.url).toBe('https://example.com/image.png');
    expect(asset?.type).toBe(MediaType.IMAGE);
    expect(asset?.status).toBe(MediaStatus.PENDING);
  });

  test('should register multiple assets', () => {
    const assets = [
      { id: 'img1', url: 'https://example.com/img1.png', type: MediaType.IMAGE },
      { id: 'vid1', url: 'https://example.com/vid1.mp4', type: MediaType.VIDEO },
      { id: 'snd1', url: 'https://example.com/snd1.mp3', type: MediaType.AUDIO },
    ];

    manager.registerMany(assets);

    expect(manager.get('img1')).toBeDefined();
    expect(manager.get('vid1')).toBeDefined();
    expect(manager.get('snd1')).toBeDefined();
  });

  test('should get all assets', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);
    manager.register('img2', 'https://example.com/img2.png', MediaType.IMAGE);

    const all = manager.getAll();
    expect(all.length).toBe(2);
  });

  test('should get assets by type', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);
    manager.register('vid1', 'https://example.com/vid1.mp4', MediaType.VIDEO);
    manager.register('img2', 'https://example.com/img2.png', MediaType.IMAGE);

    const images = manager.getByType(MediaType.IMAGE);
    expect(images.length).toBe(2);

    const videos = manager.getByType(MediaType.VIDEO);
    expect(videos.length).toBe(1);
  });

  test('should get assets by status', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);
    manager.register('img2', 'https://example.com/img2.png', MediaType.IMAGE);

    const pending = manager.getByStatus(MediaStatus.PENDING);
    expect(pending.length).toBe(2);
  });

  test('should check loading state', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);

    expect(manager.isLoaded('img1')).toBe(false);
    expect(manager.isLoading('img1')).toBe(false);
  });

  test('should unload assets', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);

    manager.unload('img1');
    const asset = manager.get('img1');

    expect(asset?.status).toBe(MediaStatus.PENDING);
    expect(asset?.data).toBeUndefined();
  });

  test('should remove assets', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);

    const removed = manager.remove('img1');
    expect(removed).toBe(true);
    expect(manager.get('img1')).toBeUndefined();
  });

  test('should clear all assets', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);
    manager.register('img2', 'https://example.com/img2.png', MediaType.IMAGE);

    manager.clear();
    expect(manager.getAll().length).toBe(0);
  });

  test('should track progress', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);
    manager.register('img2', 'https://example.com/img2.png', MediaType.IMAGE);

    const progress = manager.getProgress();
    expect(progress.total).toBe(2);
    expect(progress.loaded).toBe(0);
    expect(progress.percent).toBe(0);
  });

  test('should estimate memory usage', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);

    const usage = manager.getMemoryUsage();
    expect(usage).toBeGreaterThanOrEqual(0);

    const usageString = manager.getMemoryUsageString();
    expect(typeof usageString).toBe('string');
  });

  test('should export catalog', () => {
    manager.register('img1', 'https://example.com/img1.png', MediaType.IMAGE);
    manager.register('vid1', 'https://example.com/vid1.mp4', MediaType.VIDEO);

    const catalog = manager.exportCatalog();
    expect(catalog.length).toBe(2);
    expect(catalog[0].id).toBe('img1');
    expect(catalog[1].id).toBe('vid1');
  });
});

describe('Audio Utilities', () => {
  test('should get audio context', () => {
    const ctx = getAudioContext();
    expect(ctx).toBeDefined();
    expect(ctx instanceof AudioContext).toBe(true);
  });

  test('should play beep', () => {
    // Just verify no error is thrown
    expect(() => playBeep(440, 0.1, 0.1)).not.toThrow();
  });
});

describe('Integration Tests', () => {
  test('should create picture with all features', () => {
    const picture = new SK8Picture();
    picture.setBoundsRect({ left: 0, top: 0, right: 200, bottom: 200 });
    picture.setFitMode(ImageFitMode.CONTAIN);
    picture.setAllowFileSelection(true);
    picture.setAllowDragDrop(true);
    picture.setBrightness(1.2);
    picture.setFlipHorizontal(true);

    expect(picture.getFitMode()).toBe(ImageFitMode.CONTAIN);
    expect(picture.getAllowFileSelection()).toBe(true);
    expect(picture.getAllowDragDrop()).toBe(true);
  });

  test('should create movie with controls', () => {
    const movie = new SK8MovieRectangle();
    movie.setBoundsRect({ left: 0, top: 0, right: 640, bottom: 480 });
    movie.setFitMode(VideoFitMode.COVER);
    movie.setShowControls(true);
    movie.setVolume(0.8);

    expect(movie.getFitMode()).toBe(VideoFitMode.COVER);
    expect(movie.getShowControls()).toBe(true);
    expect(movie.getVolume()).toBe(0.8);

    movie.dispose();
  });

  test('should create sound with options', () => {
    const sound = new SK8Sound();
    sound.setVolume(0.7);
    sound.setLoop(true);
    sound.setPlaybackRate(1.2);

    expect(sound.getVolume()).toBe(0.7);
    expect(sound.getLoop()).toBe(true);
    expect(sound.getPlaybackRate()).toBe(1.2);

    sound.dispose();
  });

  test('should manage multiple media assets', () => {
    const manager = MediaManager.getInstance();
    manager.clear();

    manager.registerMany([
      { id: 'bg', url: '/assets/background.png', type: MediaType.IMAGE },
      { id: 'intro', url: '/assets/intro.mp4', type: MediaType.VIDEO },
      { id: 'music', url: '/assets/music.mp3', type: MediaType.AUDIO },
      { id: 'click', url: '/assets/click.mp3', type: MediaType.AUDIO },
    ]);

    expect(manager.getAll().length).toBe(4);
    expect(manager.getByType(MediaType.IMAGE).length).toBe(1);
    expect(manager.getByType(MediaType.VIDEO).length).toBe(1);
    expect(manager.getByType(MediaType.AUDIO).length).toBe(2);

    manager.clear();
  });
});
