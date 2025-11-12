# SK8 Media Guide

**Comprehensive media handling for images, video, and audio in SK8 TypeScript**

## Overview

Phase 3.1 introduces comprehensive media support to SK8, replacing the original QuickTime-based system with modern HTML5 APIs. This guide covers all media features including enhanced image processing, video playback, audio management, and asset handling.

## Table of Contents

1. [Enhanced Image Support](#enhanced-image-support)
2. [Picture Actor](#picture-actor)
3. [Video/Movie Actor](#videomovie-actor)
4. [Sound Actor](#sound-actor)
5. [Media Manager](#media-manager)
6. [Audio Utilities](#audio-utilities)
7. [Examples](#examples)
8. [API Reference](#api-reference)

---

## Enhanced Image Support

### SK8Image

The enhanced `SK8Image` class provides comprehensive image handling with caching, transformations, and effects.

#### Basic Usage

```typescript
import { SK8Image, ImageFitMode } from 'sk8';

const image = new SK8Image();
image.setBoundsRect({ left: 50, top: 50, right: 350, bottom: 250 });
image.setSource('https://example.com/image.png');
image.setFitMode(ImageFitMode.CONTAIN);
```

#### Fit Modes

Control how images fit within their bounds:

```typescript
// Fill the bounds (may distort)
image.setFitMode(ImageFitMode.FILL);

// Fit within bounds (maintain aspect ratio)
image.setFitMode(ImageFitMode.CONTAIN);

// Cover bounds (maintain aspect ratio, may crop)
image.setFitMode(ImageFitMode.COVER);

// Original size, centered
image.setFitMode(ImageFitMode.NONE);
```

#### Image Transformations

```typescript
// Flip horizontally or vertically
image.setFlipHorizontal(true);
image.setFlipVertical(true);

// Crop image
image.setCrop(x, y, width, height);
image.clearCrop();
```

#### Image Effects

```typescript
// Adjust brightness (0-2, default 1)
image.setBrightness(1.5);

// Adjust contrast (0-2, default 1)
image.setContrast(1.2);

// Apply grayscale
image.setGrayscale(true);

// Apply blur (pixels)
image.setBlur(5);

// Set opacity (0-1)
image.setOpacity(0.8);
```

#### Loading Events

```typescript
// Handle image load
image.addEventListener('imageLoad', (event) => {
  console.log('Image loaded:', event.detail.url);
});

// Handle errors
image.addEventListener('imageError', (event) => {
  console.error('Failed to load:', event.detail.error);
});

// Progress tracking (if supported by browser)
image.setHandler('progress', (loaded, total) => {
  console.log(`Loading: ${(loaded / total * 100).toFixed(0)}%`);
});
```

#### Caching

Images are automatically cached to improve performance:

```typescript
// Clear entire cache
SK8Image.clearCache();

// Remove specific image from cache
SK8Image.removeFromCache(url);

// Get cache size
const size = SK8Image.getCacheSize();

// Enable/disable caching
SK8Image.setCacheEnabled(true);
```

---

## Picture Actor

The `SK8Picture` actor extends `SK8Image` with interactive file selection and drag-and-drop capabilities.

### Basic Usage

```typescript
import { SK8Picture, createPicture, ImageFitMode } from 'sk8';

// Using helper function
const picture = createPicture(100, 100, 300, 200, {
  fitMode: ImageFitMode.CONTAIN,
  allowFileSelection: true,
  allowDragDrop: true,
});

// Manual creation
const picture2 = new SK8Picture();
picture2.setBoundsRect({ left: 100, top: 100, right: 400, bottom: 300 });
picture2.setAllowFileSelection(true);
picture2.setAllowDragDrop(true);
```

### File Selection

Enable click-to-select functionality:

```typescript
picture.setAllowFileSelection(true);

// Users can now click the picture to select a file
// Or programmatically trigger selection:
picture.selectFile();

// Handle file loaded
picture.setHandler('fileLoaded', (filename, filesize) => {
  console.log(`Loaded ${filename} (${filesize} bytes)`);
});
```

### Drag and Drop

Enable drag-and-drop file import:

```typescript
picture.setAllowDragDrop(true);
picture.setAcceptedFormats('image/png,image/jpeg');

// Handle drag events in your HTML
dropZone.ondragover = (e) => {
  e.preventDefault();
  picture.handleDragOver(e);
};

dropZone.ondrop = (e) => {
  e.preventDefault();
  picture.handleDrop(e);
};
```

### Loading from Different Sources

```typescript
// From URL
picture.setSource('https://example.com/image.png');

// From data URL
picture.loadFromDataURL('data:image/png;base64,...');

// From Blob
const blob = new Blob([imageData], { type: 'image/png' });
picture.loadFromBlob(blob);

// From File object
const file = fileInput.files[0];
picture.loadFromFile(file);
```

---

## Video/Movie Actor

The `SK8MovieRectangle` actor provides comprehensive video playback using HTML5 video.

### Basic Usage

```typescript
import { SK8MovieRectangle, createMovieRectangle, VideoFitMode } from 'sk8';

// Using helper function
const movie = createMovieRectangle(50, 50, 640, 480, {
  src: 'https://example.com/video.mp4',
  fitMode: VideoFitMode.CONTAIN,
  showControls: true,
  autoplay: false,
});

// Manual creation
const movie2 = new SK8MovieRectangle();
movie2.setBoundsRect({ left: 50, top: 50, right: 690, bottom: 530 });
movie2.setSource('video.mp4');
```

### Playback Controls

```typescript
// Play video
await movie.play();

// Pause video
movie.pause();

// Stop (pause and reset)
movie.stop();

// Seek to time (in seconds)
movie.seek(30);

// Check state
if (movie.isPlayingVideo()) {
  console.log('Video is playing');
}

if (movie.isPaused()) {
  console.log('Video is paused');
}

if (movie.hasEnded()) {
  console.log('Video has ended');
}
```

### Volume and Playback Rate

```typescript
// Set volume (0.0 to 1.0)
movie.setVolume(0.8);

// Mute/unmute
movie.setMuted(true);

// Playback rate (0.25 to 4.0)
movie.setPlaybackRate(1.5); // 1.5x speed
movie.setPlaybackRate(0.5); // Half speed
```

### Fit Modes

```typescript
// Fill the bounds
movie.setFitMode(VideoFitMode.FILL);

// Fit within bounds (letterbox/pillarbox)
movie.setFitMode(VideoFitMode.CONTAIN);

// Cover bounds (may crop)
movie.setFitMode(VideoFitMode.COVER);
```

### Built-in Controls

```typescript
// Show/hide control overlay
movie.setShowControls(true);

// The built-in controls include:
// - Play/pause button
// - Progress bar (seekable)
// - Time display
// - Volume control (future enhancement)
```

### Video Events

```typescript
// Video loaded and ready
movie.addEventListener('videoLoadedMetadata', (event) => {
  console.log('Video ready:', event.detail);
});

// Playback started
movie.addEventListener('videoPlay', () => {
  console.log('Video playing');
});

// Playback paused
movie.addEventListener('videoPause', () => {
  console.log('Video paused');
});

// Playback ended
movie.addEventListener('videoEnded', () => {
  console.log('Video ended');
});

// Time update (fires frequently during playback)
movie.addEventListener('videoTimeUpdate', (event) => {
  const { currentTime, duration } = event.detail;
  console.log(`${currentTime}/${duration}`);
});

// Error handling
movie.addEventListener('videoError', (event) => {
  console.error('Video error:', event.detail.error);
});
```

### Frame Extraction

```typescript
// Extract current frame as canvas
const canvas = movie.toCanvas();

// Use the canvas for thumbnails, effects, etc.
const dataUrl = canvas.toDataURL('image/png');
```

### Cleanup

```typescript
// Always dispose when done
movie.dispose();
```

---

## Sound Actor

The `SK8Sound` actor provides audio playback using the Web Audio API.

### Basic Usage

```typescript
import { SK8Sound, createSound, SoundState } from 'sk8';

// Using helper function
const sound = await createSound('https://example.com/audio.mp3', {
  volume: 0.8,
  loop: false,
  playbackRate: 1.0,
  autoplay: false,
});

// Manual creation
const sound2 = new SK8Sound();
await sound2.setSource('audio.mp3');
```

### Playback Control

```typescript
// Play from beginning
sound.play();

// Play from offset (in seconds)
sound.play(5.0);

// Pause (preserves position)
sound.pause();

// Resume from pause
sound.resume();

// Stop (resets position)
sound.stop();
```

### Volume Control

```typescript
// Set volume (0.0 to 1.0)
sound.setVolume(0.7);

// Fade volume over time
sound.fadeVolume(0.0, 2.0); // Fade to 0 over 2 seconds
sound.fadeVolume(1.0, 1.5); // Fade to 1 over 1.5 seconds
```

### Looping and Playback Rate

```typescript
// Enable looping
sound.setLoop(true);

// Playback rate (0.25 to 4.0)
sound.setPlaybackRate(1.5); // Play 1.5x speed
sound.setPlaybackRate(0.75); // Play at 75% speed
```

### Sound State

```typescript
// Check state
console.log(sound.getState()); // IDLE, LOADING, LOADED, PLAYING, PAUSED, STOPPED, ERROR

// Or use helper methods
if (sound.isPlaying()) {
  console.log('Sound is playing');
}

if (sound.isPaused()) {
  console.log('Sound is paused');
}

if (sound.isLoaded()) {
  console.log('Sound is loaded and ready');
}
```

### Duration and Time

```typescript
// Get duration (in seconds)
const duration = sound.getDuration();

// Get current playback time
const currentTime = sound.getCurrentTime();
```

### Sound Events

```typescript
// Sound loaded
sound.setHandler('loaded', () => {
  console.log('Sound loaded');
});

// Playback started
sound.setHandler('play', () => {
  console.log('Sound playing');
});

// Playback paused
sound.setHandler('pause', () => {
  console.log('Sound paused');
});

// Playback ended
sound.setHandler('ended', () => {
  console.log('Sound ended');
});

// Error handling
sound.setHandler('error', (error) => {
  console.error('Sound error:', error);
});
```

### Sound Manager

Manage multiple sounds:

```typescript
import { SoundManager } from 'sk8';

// Create and register a sound
await SoundManager.createSound('bgMusic', 'music.mp3');

// Play by name
SoundManager.play('bgMusic');

// Stop by name
SoundManager.stop('bgMusic');

// Stop all sounds
SoundManager.stopAll();

// Set master volume
SoundManager.setMasterVolume(0.5);

// Get a specific sound
const sound = SoundManager.getSound('bgMusic');

// Cleanup
SoundManager.clear();
```

---

## Media Manager

The `MediaManager` provides centralized asset management for all media types.

### Basic Usage

```typescript
import { MediaManager, MediaType, MediaStatus, getMediaManager } from 'sk8';

// Get singleton instance
const manager = getMediaManager();

// Register assets
manager.register('bg', 'images/background.png', MediaType.IMAGE);
manager.register('intro', 'videos/intro.mp4', MediaType.VIDEO);
manager.register('music', 'audio/music.mp3', MediaType.AUDIO);

// Register multiple at once
manager.registerMany([
  { id: 'img1', url: 'images/1.png', type: MediaType.IMAGE },
  { id: 'img2', url: 'images/2.png', type: MediaType.IMAGE },
  { id: 'snd1', url: 'audio/click.mp3', type: MediaType.AUDIO },
]);
```

### Loading Assets

```typescript
// Load single asset
const asset = await manager.load('bg');

// Load multiple assets with progress
await manager.loadMany(['bg', 'intro', 'music'], (loaded, total, asset) => {
  console.log(`Loading: ${loaded}/${total} (${Math.round(loaded/total*100)}%)`);
  if (asset) {
    console.log(`Loaded: ${asset.id}`);
  }
});

// Load all registered assets
await manager.loadAll((loaded, total) => {
  console.log(`Progress: ${loaded}/${total}`);
});
```

### Accessing Assets

```typescript
// Get asset metadata
const asset = manager.get('bg');
console.log(asset.id, asset.url, asset.type, asset.status);

// Get asset data directly
const imageElement = manager.getData<HTMLImageElement>('bg');
const videoElement = manager.getData<HTMLVideoElement>('intro');
const audioBuffer = manager.getData<AudioBuffer>('music');

// Check if loaded
if (manager.isLoaded('bg')) {
  console.log('Asset is loaded');
}

// Check if currently loading
if (manager.isLoading('bg')) {
  console.log('Asset is loading');
}
```

### Querying Assets

```typescript
// Get all assets
const all = manager.getAll();

// Get by type
const images = manager.getByType(MediaType.IMAGE);
const videos = manager.getByType(MediaType.VIDEO);
const audio = manager.getByType(MediaType.AUDIO);

// Get by status
const pending = manager.getByStatus(MediaStatus.PENDING);
const loaded = manager.getByStatus(MediaStatus.LOADED);
const errors = manager.getByStatus(MediaStatus.ERROR);
```

### Progress Tracking

```typescript
// Get overall progress
const progress = manager.getProgress();
console.log(`${progress.loaded}/${progress.total} (${progress.percent}%)`);

// Get memory usage
const bytes = manager.getMemoryUsage();
const readable = manager.getMemoryUsageString(); // "2.4 MB"
```

### Memory Management

```typescript
// Unload specific asset (free memory but keep registered)
manager.unload('bg');

// Unload all assets
manager.unloadAll();

// Remove asset from registry
manager.remove('bg');

// Clear everything
manager.clear();
```

### Asset Catalog

```typescript
// Load from manifest
await manager.loadManifest([
  { id: 'bg', url: 'bg.png', type: MediaType.IMAGE },
  { id: 'music', url: 'music.mp3', type: MediaType.AUDIO },
], (loaded, total) => {
  console.log(`Loading: ${loaded}/${total}`);
});

// Export catalog
const catalog = manager.exportCatalog();
console.log(catalog);
// [{ id: 'bg', url: 'bg.png', type: 'image' }, ...]
```

### Convenience Functions

```typescript
import {
  registerAsset,
  loadAsset,
  getAsset,
  getAssetData,
  preloadAssets,
} from 'sk8';

// Register
registerAsset('bg', 'bg.png', MediaType.IMAGE);

// Load
const asset = await loadAsset('bg');

// Get
const assetMeta = getAsset('bg');
const imageData = getAssetData<HTMLImageElement>('bg');

// Preload multiple
await preloadAssets([
  { id: 'img1', url: '1.png', type: MediaType.IMAGE },
  { id: 'img2', url: '2.png', type: MediaType.IMAGE },
]);
```

---

## Audio Utilities

Advanced audio features using Web Audio API.

### Audio Context

```typescript
import {
  getAudioContext,
  resumeAudioContext,
  getAudioContextState,
  closeAudioContext,
} from 'sk8';

// Get or create audio context
const ctx = getAudioContext();

// Resume context (required after user interaction)
await resumeAudioContext();

// Check state
const state = getAudioContextState(); // 'suspended', 'running', 'closed'

// Close context
await closeAudioContext();
```

### Loading Audio

```typescript
import { loadAudio, preloadAudio } from 'sk8';

// Load single audio file
const buffer = await loadAudio('audio.mp3');

// Preload multiple files
const results = await preloadAudio(
  ['sound1.mp3', 'sound2.mp3', 'sound3.mp3'],
  (loaded, total) => {
    console.log(`Preloaded: ${loaded}/${total}`);
  }
);
```

### Simple Audio Playback

```typescript
import { playAudioBuffer } from 'sk8';

const buffer = await loadAudio('audio.mp3');

const player = playAudioBuffer(buffer, {
  volume: 0.8,
  loop: false,
  playbackRate: 1.0,
  onEnded: () => console.log('Finished'),
});

// Control playback
player.setVolume(0.5);
player.fadeVolume(0.0, 2.0); // Fade out over 2 seconds
player.stop();
```

### Volume Control

```typescript
import { VolumeController } from 'sk8';

const ctx = getAudioContext();
const gainNode = ctx.createGain();
const controller = new VolumeController(gainNode);

// Fade in
controller.fadeIn(1.0, 2.0); // To full volume over 2 seconds

// Fade out
controller.fadeOut(2.0); // To zero over 2 seconds

// Crossfade between two sounds
VolumeController.crossfade(fadeOutGain, fadeInGain, 1.5);
```

### Tone Generation

```typescript
import { playBeep, playToneSequence } from 'sk8';

// Simple beep
playBeep(440, 0.3, 0.5); // 440Hz, 0.3s duration, 0.5 volume

// Play melody
playToneSequence([
  { frequency: 262, duration: 0.2, volume: 0.3 }, // C
  { frequency: 294, duration: 0.2, volume: 0.3 }, // D
  { frequency: 330, duration: 0.2, volume: 0.3 }, // E
  { frequency: 349, duration: 0.4, volume: 0.3 }, // F
]);
```

### 3D Audio (Optional)

```typescript
import { create3DAudioSource, setListenerPosition } from 'sk8';

const buffer = await loadAudio('audio.mp3');

// Create 3D sound source
const source3D = create3DAudioSource(buffer, {
  position: { x: 0, y: 0, z: -5 },
  refDistance: 1,
  maxDistance: 10,
  rolloffFactor: 1,
});

source3D.play();

// Move sound
source3D.setPosition(2, 0, -5);

// Set listener position (camera/player)
setListenerPosition(
  { x: 0, y: 0, z: 0 },
  {
    forward: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
  }
);
```

### Audio Analysis

```typescript
import { createAudioAnalyzer } from 'sk8';

const ctx = getAudioContext();
const source = ctx.createBufferSource();

const analyzer = createAudioAnalyzer(source, 2048);

// Get frequency data
const freqData = analyzer.getFrequencyData(); // Uint8Array

// Get time domain data
const timeData = analyzer.getTimeDomainData(); // Uint8Array

// Get average frequency
const avgFreq = analyzer.getAverageFrequency();

// Use for visualization
function visualize() {
  const data = analyzer.getFrequencyData();
  // Draw bars, waveform, etc.
  requestAnimationFrame(visualize);
}
visualize();
```

---

## Examples

### Complete Image Gallery

```typescript
import { SK8Picture, ImageFitMode, createStage } from 'sk8';

const stage = createStage('canvas');
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
const pictures = [];

images.forEach((url, i) => {
  const pic = new SK8Picture();
  pic.setBoundsRect({
    left: 50 + i * 220,
    top: 50,
    right: 250 + i * 220,
    bottom: 200,
  });
  pic.setSource(url);
  pic.setFitMode(ImageFitMode.COVER);

  pic.addEventListener('imageLoad', () => {
    console.log(`Loaded: ${url}`);
  });

  stage.addActor(pic);
  pictures.push(pic);
});

stage.render();
```

### Video Player with Custom Controls

```typescript
import { SK8MovieRectangle, createStage } from 'sk8';

const stage = createStage('canvas');
const movie = new SK8MovieRectangle();

movie.setBoundsRect({ left: 50, top: 50, right: 690, bottom: 530 });
movie.setSource('video.mp4');

// Custom controls
const playButton = document.getElementById('play');
const seekBar = document.getElementById('seek');
const volumeSlider = document.getElementById('volume');

playButton.onclick = async () => {
  if (movie.isPlayingVideo()) {
    movie.pause();
    playButton.textContent = 'Play';
  } else {
    await movie.play();
    playButton.textContent = 'Pause';
  }
};

movie.addEventListener('videoTimeUpdate', (event) => {
  const { currentTime, duration } = event.detail;
  seekBar.value = (currentTime / duration) * 100;
});

seekBar.oninput = (e) => {
  const percent = e.target.value / 100;
  movie.seek(movie.getDuration() * percent);
};

volumeSlider.oninput = (e) => {
  movie.setVolume(e.target.value / 100);
};

stage.addActor(movie);
stage.render();
```

### Audio Manager with Sound Effects

```typescript
import { SoundManager, resumeAudioContext } from 'sk8';

// Initialize audio system
await resumeAudioContext();

// Load sound effects
await SoundManager.createSound('click', 'sounds/click.mp3');
await SoundManager.createSound('error', 'sounds/error.mp3');
await SoundManager.createSound('success', 'sounds/success.mp3');
await SoundManager.createSound('bgMusic', 'sounds/music.mp3');

// Configure background music
const music = SoundManager.getSound('bgMusic');
music.setLoop(true);
music.setVolume(0.3);

// Play effects on events
document.getElementById('button').onclick = () => {
  SoundManager.play('click');
};

// Start background music
SoundManager.play('bgMusic');

// Cleanup on page unload
window.onbeforeunload = () => {
  SoundManager.clear();
};
```

### Media Preloader

```typescript
import { MediaManager, MediaType, preloadAssets } from 'sk8';

// Define all media assets
const manifest = [
  { id: 'bg', url: 'images/background.png', type: MediaType.IMAGE },
  { id: 'logo', url: 'images/logo.png', type: MediaType.IMAGE },
  { id: 'intro', url: 'videos/intro.mp4', type: MediaType.VIDEO },
  { id: 'music', url: 'audio/music.mp3', type: MediaType.AUDIO },
  { id: 'click', url: 'audio/click.mp3', type: MediaType.AUDIO },
];

// Show loading screen
const loadingScreen = document.getElementById('loading');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');

// Preload all assets
await preloadAssets(manifest, (loaded, total, asset) => {
  const percent = Math.round((loaded / total) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `Loading: ${loaded}/${total} (${percent}%)`;

  if (asset) {
    console.log(`Loaded: ${asset.id}`);
  }
});

// Hide loading screen
loadingScreen.style.display = 'none';

// Start application
startApp();
```

---

## API Reference

### SK8Image

**Properties:**
- `src: string | null` - Image URL
- `loaded: boolean` - Whether image is loaded
- `loading: boolean` - Whether image is currently loading
- `fitMode: ImageFitMode` - How image fits in bounds
- `maintainAspectRatio: boolean` - Whether to maintain aspect ratio

**Methods:**
- `setSource(url: string): void`
- `setFitMode(mode: ImageFitMode): void`
- `setFlipHorizontal(flip: boolean): void`
- `setFlipVertical(flip: boolean): void`
- `setCrop(x, y, width, height): void`
- `clearCrop(): void`
- `setBrightness(value: number): void`
- `setContrast(value: number): void`
- `setGrayscale(enabled: boolean): void`
- `setBlur(pixels: number): void`
- `setOpacity(value: number): void`
- `toCanvas(): HTMLCanvasElement | null`
- `static clearCache(): void`
- `static getCacheSize(): number`

**Events:**
- `imageLoad` - Image successfully loaded
- `imageError` - Image failed to load

### SK8Picture

Extends `SK8Image` with additional properties and methods.

**Properties:**
- `allowFileSelection: boolean` - Enable click-to-select
- `allowDragDrop: boolean` - Enable drag-and-drop
- `acceptedFormats: string` - Accepted file formats

**Methods:**
- `setAllowFileSelection(allow: boolean): void`
- `setAllowDragDrop(allow: boolean): void`
- `setAcceptedFormats(formats: string): void`
- `selectFile(): void`
- `loadFromFile(file: File): void`
- `loadFromDataURL(dataUrl: string): void`
- `loadFromBlob(blob: Blob): void`
- `handleDragOver(event: DragEvent): boolean`
- `handleDrop(event: DragEvent): boolean`
- `dispose(): void`

### SK8MovieRectangle

**Properties:**
- `src: string | null` - Video URL
- `currentTime: number` - Current playback time
- `duration: number` - Video duration
- `volume: number` - Volume (0-1)
- `playbackRate: number` - Playback speed
- `playing: boolean` - Whether playing
- `paused: boolean` - Whether paused
- `ended: boolean` - Whether ended
- `fitMode: VideoFitMode` - How video fits in bounds
- `showControls: boolean` - Show built-in controls

**Methods:**
- `setSource(url: string): void`
- `play(): Promise<void>`
- `pause(): void`
- `stop(): void`
- `seek(time: number): void`
- `setVolume(volume: number): void`
- `setMuted(muted: boolean): void`
- `setPlaybackRate(rate: number): void`
- `setFitMode(mode: VideoFitMode): void`
- `setShowControls(show: boolean): void`
- `toCanvas(): HTMLCanvasElement`
- `dispose(): void`

**Events:**
- `videoLoadedMetadata` - Video metadata loaded
- `videoPlay` - Playback started
- `videoPause` - Playback paused
- `videoEnded` - Playback ended
- `videoTimeUpdate` - Time updated
- `videoError` - Error occurred

### SK8Sound

**Properties:**
- `src: string | null` - Audio URL
- `volume: number` - Volume (0-1)
- `loop: boolean` - Whether to loop
- `playbackRate: number` - Playback speed
- `state: SoundState` - Current state
- `duration: number` - Audio duration
- `currentTime: number` - Current playback time

**Methods:**
- `setSource(url: string): Promise<void>`
- `play(offset?: number): void`
- `pause(): void`
- `resume(): void`
- `stop(): void`
- `setVolume(volume: number): void`
- `setLoop(loop: boolean): void`
- `setPlaybackRate(rate: number): void`
- `fadeVolume(targetVolume: number, duration: number): void`
- `dispose(): void`

### MediaManager

**Methods:**
- `register(id, url, type): void`
- `registerMany(assets): void`
- `load(id): Promise<MediaAsset>`
- `loadMany(ids, callback?): Promise<Map>`
- `loadAll(callback?): Promise<Map>`
- `get(id): MediaAsset | undefined`
- `getData<T>(id): T | undefined`
- `isLoaded(id): boolean`
- `isLoading(id): boolean`
- `unload(id): void`
- `unloadAll(): void`
- `remove(id): boolean`
- `clear(): void`
- `getAll(): MediaAsset[]`
- `getByType(type): MediaAsset[]`
- `getByStatus(status): MediaAsset[]`
- `getProgress(): {loaded, total, percent}`
- `getMemoryUsage(): number`
- `getMemoryUsageString(): string`
- `loadManifest(manifest, callback?): Promise<void>`
- `exportCatalog(): Array`

---

## Best Practices

1. **Always await resumeAudioContext()** before playing sounds (required by browsers)
2. **Use MediaManager** for large projects with many assets
3. **Dispose video and audio actors** when no longer needed
4. **Enable caching** for frequently used images
5. **Preload critical assets** during loading screens
6. **Handle errors gracefully** with error event listeners
7. **Use fit modes** to maintain aspect ratios
8. **Fade audio** for smooth transitions
9. **Monitor memory usage** with large asset collections
10. **Test across browsers** as media support varies

---

## Browser Compatibility

- **Images:** All modern browsers
- **Video:** H.264, WebM (varies by browser)
- **Audio:** MP3, OGG, WAV (varies by browser)
- **Web Audio API:** All modern browsers
- **Drag & Drop:** All modern browsers

## Performance Tips

1. Use appropriate image sizes (don't load 4K images for thumbnails)
2. Compress media files (use tools like ImageOptim, HandBrake)
3. Lazy load media that's not immediately visible
4. Unload unused media to free memory
5. Use sprite sheets for multiple small images
6. Preload critical assets, lazy load others
7. Consider using WebP for images (better compression)
8. Use video posters for better perceived performance

---

**Next Steps:**
- Explore the [media demo](demo/media-demo.html)
- Review [test cases](tests/media.test.ts)
- Check out [example projects](examples/)

For questions or issues, refer to the main SK8 documentation or open an issue on GitHub.
