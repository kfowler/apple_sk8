# Media Guide

Complete guide to working with images, video, audio, and media assets in SK8.

## Table of Contents

- [Images](#images)
- [Video](#video)
- [Audio](#audio)
- [Asset Management](#asset-management)
- [Complete Examples](#complete-examples)

---

## Images

### Picture Actor

Display and manipulate images.

```javascript
import { SK8Picture } from './dist/sk8.js';

const picture = new SK8Picture();
picture.set('left', 100);
picture.set('top', 100);
picture.set('width', 300);
picture.set('height', 200);

// Load image
picture.loadImage('assets/photo.jpg').then(() => {
    console.log('Image loaded!');
    stage.render();
});

stage.addActor(picture);
```

**Image Properties:**
```javascript
picture.set('url', 'path/to/image.jpg');
picture.set('scaleMode', 'fit');  // fit, fill, stretch, center
picture.set('opacity', 0.8);
```

**Image Loading:**
```javascript
// From URL
picture.loadImage('https://example.com/image.jpg');

// From data URL
picture.loadImage('data:image/png;base64,...');

// From asset library
picture.loadImage(assetManager.getAsset('photo1').url);

// Handle loading errors
picture.loadImage('image.jpg')
    .then(() => console.log('Success'))
    .catch(err => console.error('Failed to load:', err));
```

**Scale Modes:**
```javascript
// Fit: Maintain aspect ratio, fit within bounds
picture.set('scaleMode', 'fit');

// Fill: Maintain aspect ratio, cover entire bounds
picture.set('scaleMode', 'fill');

// Stretch: Ignore aspect ratio, fill bounds
picture.set('scaleMode', 'stretch');

// Center: Display at original size, centered
picture.set('scaleMode', 'center');
```

**Image Effects:**
```javascript
// Tint the image
picture.set('tintColor', { r: 255, g: 0, b: 0, a: 0.5 });

// Flip image
picture.set('flipHorizontal', true);
picture.set('flipVertical', false);

// Rotate
picture.set('rotation', 45);  // degrees
```

---

## Video

### MovieRectangle Actor

Play video content.

```javascript
import { SK8MovieRectangle } from './dist/sk8.js';

const movie = new SK8MovieRectangle();
movie.set('left', 100);
movie.set('top', 100);
movie.set('width', 640);
movie.set('height', 360);

// Load video
movie.loadVideo('videos/demo.mp4').then(() => {
    console.log('Video loaded!');
});

stage.addActor(movie);
```

**Playback Controls:**
```javascript
// Play video
movie.play();

// Pause video
movie.pause();

// Stop and reset
movie.stop();

// Seek to time (in seconds)
movie.seek(30);

// Set playback rate
movie.setRate(1.0);  // Normal speed
movie.setRate(2.0);  // 2x speed
movie.setRate(0.5);  // Half speed
```

**Video Properties:**
```javascript
// Volume (0.0 to 1.0)
movie.set('volume', 0.8);

// Mute
movie.set('muted', true);

// Loop
movie.set('loop', true);

// Show controls
movie.set('controls', true);
```

**Video Events:**
```javascript
// Playback events
movie.addHandler('play', () => {
    console.log('Video started');
});

movie.addHandler('pause', () => {
    console.log('Video paused');
});

movie.addHandler('ended', () => {
    console.log('Video finished');
    nextVideo();
});

movie.addHandler('timeUpdate', (currentTime) => {
    console.log('Current time:', currentTime);
    updateProgressBar(currentTime);
});

movie.addHandler('error', (error) => {
    console.error('Video error:', error);
    showErrorMessage();
});
```

**Video Example:**
```javascript
// Simple video player
const playBtn = new SK8Button();
playBtn.set('label', 'Play');
playBtn.addHandler('click', () => {
    if (movie.isPlaying()) {
        movie.pause();
        playBtn.set('label', 'Play');
    } else {
        movie.play();
        playBtn.set('label', 'Pause');
    }
});

const progress = new SK8ProgressBar();
movie.addHandler('timeUpdate', (current) => {
    const duration = movie.getDuration();
    progress.set('value', (current / duration) * 100);
    stage.render();
});
```

---

## Audio

### Sound Actor

Play audio files and sound effects.

```javascript
import { SK8Sound } from './dist/sk8.js';

const sound = new SK8Sound();
sound.loadSound('audio/background-music.mp3').then(() => {
    console.log('Sound loaded!');
    sound.play();
});
```

**Audio Controls:**
```javascript
// Play
sound.play();

// Pause
sound.pause();

// Stop and reset
sound.stop();

// Volume (0.0 to 1.0)
sound.set('volume', 0.5);

// Pan (-1.0 left, 0.0 center, 1.0 right)
sound.set('pan', -0.5);

// Loop
sound.set('loop', true);

// Playback rate
sound.set('rate', 1.0);
```

**Sound Events:**
```javascript
sound.addHandler('ended', () => {
    console.log('Sound finished');
});

sound.addHandler('error', (err) => {
    console.error('Sound error:', err);
});
```

**Multiple Sounds:**
```javascript
// Sound effects
const sounds = {
    click: new SK8Sound(),
    hover: new SK8Sound(),
    error: new SK8Sound(),
    success: new SK8Sound()
};

// Load all sounds
Promise.all([
    sounds.click.loadSound('sfx/click.wav'),
    sounds.hover.loadSound('sfx/hover.wav'),
    sounds.error.loadSound('sfx/error.wav'),
    sounds.success.loadSound('sfx/success.wav')
]).then(() => {
    console.log('All sounds loaded');
});

// Play on events
button.addHandler('click', () => {
    sounds.click.play();
});

button.addHandler('mouseEnter', () => {
    sounds.hover.play();
});
```

**Web Audio Integration:**
```javascript
// Advanced audio with Web Audio API
const audioContext = new AudioContext();

// Create audio node from sound
const gainNode = audioContext.createGain();
sound.connectToNode(gainNode);
gainNode.connect(audioContext.destination);

// Control gain
gainNode.gain.value = 0.5;
```

---

## Asset Management

### Asset Library

Organize and manage media assets.

**Creating Asset Library:**
```javascript
import { AssetLibrary } from './dist/sk8.js';

const assets = new AssetLibrary();

// Add assets
assets.addAsset('logo', {
    type: 'image',
    url: 'images/logo.png',
    width: 200,
    height: 100
});

assets.addAsset('bg-music', {
    type: 'audio',
    url: 'audio/background.mp3',
    duration: 180
});

assets.addAsset('intro-video', {
    type: 'video',
    url: 'videos/intro.mp4',
    width: 1920,
    height: 1080
});
```

**Loading Assets:**
```javascript
// Load all assets
assets.loadAll((progress) => {
    console.log(`Loading: ${progress}%`);
    updateLoadingBar(progress);
}).then(() => {
    console.log('All assets loaded!');
    startApplication();
});

// Load specific asset
assets.load('logo').then((asset) => {
    picture.set('url', asset.url);
});

// Preload critical assets
assets.preload(['logo', 'bg-music']).then(() => {
    showMainMenu();
});
```

**Asset Organization:**
```javascript
// Group assets by category
const assets = {
    images: {
        logo: 'images/logo.png',
        background: 'images/bg.jpg',
        sprite: 'images/sprite-sheet.png'
    },
    sounds: {
        music: 'audio/music.mp3',
        click: 'audio/click.wav',
        explosion: 'audio/boom.wav'
    },
    videos: {
        intro: 'videos/intro.mp4',
        tutorial: 'videos/tutorial.mp4'
    }
};

// Load by category
function loadCategory(category) {
    const promises = Object.entries(assets[category]).map(([name, url]) => {
        return loadAsset(name, url);
    });
    return Promise.all(promises);
}

loadCategory('images').then(() => {
    console.log('All images loaded');
});
```

**Reference Counting:**
```javascript
// Track asset usage
class AssetManager {
    constructor() {
        this.assets = new Map();
        this.refCounts = new Map();
    }

    acquire(name) {
        const count = this.refCounts.get(name) || 0;
        this.refCounts.set(name, count + 1);

        if (count === 0) {
            return this.loadAsset(name);
        }
        return Promise.resolve(this.assets.get(name));
    }

    release(name) {
        const count = this.refCounts.get(name) || 0;
        if (count <= 1) {
            this.unloadAsset(name);
            this.refCounts.delete(name);
        } else {
            this.refCounts.set(name, count - 1);
        }
    }
}
```

**Bundling for Deployment:**
```javascript
// Bundle all assets into project
function bundleAssets(project) {
    const assets = [];

    // Find all asset references
    project.getAllActors().forEach(actor => {
        if (actor instanceof SK8Picture) {
            assets.push({
                type: 'image',
                url: actor.get('url')
            });
        }
        else if (actor instanceof SK8MovieRectangle) {
            assets.push({
                type: 'video',
                url: actor.get('url')
            });
        }
    });

    // Copy assets to bundle directory
    assets.forEach(asset => {
        copyToBundleDir(asset.url);
    });

    return assets;
}
```

---

## Complete Examples

### Image Gallery

```javascript
function createImageGallery(images) {
    let currentIndex = 0;

    // Main image display
    const mainPicture = new SK8Picture();
    mainPicture.set('left', 100);
    mainPicture.set('top', 100);
    mainPicture.set('width', 600);
    mainPicture.set('height', 400);
    mainPicture.set('scaleMode', 'fit');

    // Load first image
    mainPicture.loadImage(images[0]);

    // Previous button
    const prevBtn = new SK8Button();
    prevBtn.set('label', '◀ Previous');
    prevBtn.set('left', 100);
    prevBtn.set('top', 520);
    prevBtn.addHandler('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        mainPicture.loadImage(images[currentIndex]);
        updateCaption();
    });

    // Next button
    const nextBtn = new SK8Button();
    nextBtn.set('label', 'Next ▶');
    nextBtn.set('left', 600);
    nextBtn.set('top', 520);
    nextBtn.addHandler('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        mainPicture.loadImage(images[currentIndex]);
        updateCaption();
    });

    // Caption
    const caption = new SK8Label();
    caption.set('text', `1 / ${images.length}`);
    caption.set('left', 400);
    caption.set('top', 530);

    function updateCaption() {
        caption.set('text', `${currentIndex + 1} / ${images.length}`);
        stage.render();
    }

    // Thumbnail strip
    images.forEach((url, index) => {
        const thumb = new SK8Picture();
        thumb.set('left', 100 + index * 80);
        thumb.set('top', 560);
        thumb.set('width', 70);
        thumb.set('height', 50);
        thumb.set('scaleMode', 'fill');
        thumb.loadImage(url);

        thumb.addHandler('click', () => {
            currentIndex = index;
            mainPicture.loadImage(images[currentIndex]);
            updateCaption();
        });

        stage.addActor(thumb);
    });

    [mainPicture, prevBtn, nextBtn, caption].forEach(a => stage.addActor(a));
}

// Use it
const photos = [
    'photos/pic1.jpg',
    'photos/pic2.jpg',
    'photos/pic3.jpg',
    'photos/pic4.jpg'
];

createImageGallery(photos);
```

### Video Player

```javascript
function createVideoPlayer(videoUrl) {
    // Video display
    const movie = new SK8MovieRectangle();
    movie.set('left', 50);
    movie.set('top', 50);
    movie.set('width', 700);
    movie.set('height', 400);
    movie.loadVideo(videoUrl);

    // Play/Pause button
    const playBtn = new SK8Button();
    playBtn.set('label', '▶ Play');
    playBtn.set('left', 50);
    playBtn.set('top', 470);
    playBtn.addHandler('click', () => {
        if (movie.isPlaying()) {
            movie.pause();
            playBtn.set('label', '▶ Play');
        } else {
            movie.play();
            playBtn.set('label', '⏸ Pause');
        }
        stage.render();
    });

    // Progress bar
    const progressBar = new SK8ProgressBar();
    progressBar.set('left', 150);
    progressBar.set('top', 470);
    progressBar.set('width', 500);
    progressBar.set('height', 30);

    // Update progress
    movie.addHandler('timeUpdate', (current) => {
        const duration = movie.getDuration();
        progressBar.set('value', (current / duration) * 100);
        timeLabel.set('text', formatTime(current) + ' / ' + formatTime(duration));
        stage.render();
    });

    // Click progress bar to seek
    progressBar.addHandler('click', (x, y) => {
        const bounds = progressBar.getBoundsRect();
        const percent = (x - bounds.left) / (bounds.right - bounds.left);
        const time = percent * movie.getDuration();
        movie.seek(time);
    });

    // Time label
    const timeLabel = new SK8Label();
    timeLabel.set('text', '0:00 / 0:00');
    timeLabel.set('left', 670);
    timeLabel.set('top', 480);

    // Volume slider
    const volumeSlider = new SK8Slider();
    volumeSlider.set('left', 50);
    volumeSlider.set('top', 520);
    volumeSlider.set('width', 150);
    volumeSlider.set('minimum', 0);
    volumeSlider.set('maximum', 100);
    volumeSlider.set('value', 100);

    volumeSlider.addHandler('change', function() {
        movie.set('volume', this.get('value') / 100);
    });

    // Add all to stage
    [movie, playBtn, progressBar, timeLabel, volumeSlider]
        .forEach(a => stage.addActor(a));

    // Helper function
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

createVideoPlayer('videos/demo.mp4');
```

### Music Player with Playlist

```javascript
function createMusicPlayer(playlist) {
    let currentTrack = 0;

    // Audio player
    const music = new SK8Sound();
    music.set('loop', false);

    // Load first track
    music.loadSound(playlist[0].url);

    // Album art
    const albumArt = new SK8Picture();
    albumArt.set('left', 100);
    albumArt.set('top', 100);
    albumArt.set('width', 200);
    albumArt.set('height', 200);
    albumArt.set('scaleMode', 'fill');
    albumArt.loadImage(playlist[0].art);

    // Track info
    const trackTitle = new SK8Label();
    trackTitle.set('text', playlist[0].title);
    trackTitle.set('fontSize', 20);
    trackTitle.set('left', 320);
    trackTitle.set('top', 100);

    const trackArtist = new SK8Label();
    trackArtist.set('text', playlist[0].artist);
    trackArtist.set('left', 320);
    trackArtist.set('top', 130);

    // Play button
    const playBtn = new SK8Button();
    playBtn.set('label', '▶');
    playBtn.set('left', 100);
    playBtn.set('top', 320);
    playBtn.addHandler('click', () => {
        if (music.isPlaying()) {
            music.pause();
            playBtn.set('label', '▶');
        } else {
            music.play();
            playBtn.set('label', '⏸');
        }
        stage.render();
    });

    // Previous button
    const prevBtn = new SK8Button();
    prevBtn.set('label', '⏮');
    prevBtn.set('left', 50);
    prevBtn.set('top', 320);
    prevBtn.addHandler('click', () => {
        currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrack);
    });

    // Next button
    const nextBtn = new SK8Button();
    nextBtn.set('label', '⏭');
    nextBtn.set('left', 150);
    nextBtn.set('top', 320);
    nextBtn.addHandler('click', () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
    });

    // Auto-advance to next track
    music.addHandler('ended', () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
        music.play();
    });

    // Playlist view
    const playlistView = new SK8ListView();
    playlistView.set('left', 320);
    playlistView.set('top', 160);
    playlistView.set('width', 300);
    playlistView.set('height', 200);

    playlist.forEach((track, index) => {
        playlistView.addItem(`${track.title} - ${track.artist}`);
    });

    playlistView.addHandler('select', (item, index) => {
        currentTrack = index;
        loadTrack(currentTrack);
        music.play();
        playBtn.set('label', '⏸');
        stage.render();
    });

    function loadTrack(index) {
        const track = playlist[index];
        music.stop();
        music.loadSound(track.url);
        albumArt.loadImage(track.art);
        trackTitle.set('text', track.title);
        trackArtist.set('text', track.artist);
        playlistView.selectItem(index);
        stage.render();
    }

    // Add all to stage
    [albumArt, trackTitle, trackArtist, playBtn, prevBtn, nextBtn, playlistView]
        .forEach(a => stage.addActor(a));
}

// Use it
const myPlaylist = [
    { title: 'Song 1', artist: 'Artist A', url: 'music/song1.mp3', art: 'covers/1.jpg' },
    { title: 'Song 2', artist: 'Artist B', url: 'music/song2.mp3', art: 'covers/2.jpg' },
    { title: 'Song 3', artist: 'Artist C', url: 'music/song3.mp3', art: 'covers/3.jpg' }
];

createMusicPlayer(myPlaylist);
```

---

## Next Steps

- **[Projects Guide](PROJECTS.md)** - Manage media assets in projects
- **[Recipe Book](RECIPES.md)** - More media examples
- **[Animation Tutorial](ANIMATION_TUTORIAL.md)** - Animate media actors

Create rich multimedia experiences with SK8!
