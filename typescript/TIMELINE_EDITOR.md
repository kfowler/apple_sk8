# SK8 Timeline Editor

A comprehensive animation timeline editor for the SK8 TypeScript port. Create complex multi-track animations with keyframes, easing curves, and real-time preview.

## Features

### Core Functionality
- **Multi-track Animation**: Animate multiple properties simultaneously (position, rotation, scale, opacity, color)
- **Keyframe-based Timeline**: Precise control over animation timing
- **Visual Timeline View**: Canvas-based visualization with grid, scrubber, and track display
- **Easing Curves**: 11+ built-in easing functions (linear, quad, cubic, elastic, bounce)
- **Real-time Preview**: See animations play in real-time
- **Undo/Redo**: Full command pattern integration with editor
- **Export to Code**: Generate animation code from timeline

### Advanced Features
- **Grid Snapping**: Snap keyframes to configurable intervals
- **Zoom Controls**: Zoom timeline from 10ms to 10s per division
- **Track Mute/Solo**: Control which tracks are played
- **Keyframe Dragging**: Move keyframes by dragging
- **Multi-select**: Select and edit multiple keyframes
- **Copy/Paste**: Duplicate keyframes across tracks
- **Bezier Curves**: Custom easing with bezier curve editor

## Architecture

### File Structure

```
src/editor/timeline/
├── timeline-model.ts       # Data model (Timeline, Track, Keyframe)
├── timeline-view.ts        # Canvas-based visual timeline
├── keyframe-editor.ts      # Keyframe property editor
├── playback.ts             # Playback controls
├── timeline-panel.ts       # Main integration component
├── timeline.css            # Styling
└── index.ts                # Public API exports

tests/
└── timeline.test.ts        # 50+ comprehensive tests

demo/
└── timeline-demo.html      # Interactive demo
```

### Components

#### 1. Timeline Model (`timeline-model.ts`)

**Keyframe**: Represents a value at a specific time
```typescript
class Keyframe {
  id: string;
  time: number;              // milliseconds
  value: PropertyValue;      // number, Color, etc.
  easing: EasingFunction;
  easingName: string;
}
```

**Track**: Manages keyframes for a single property
```typescript
class Track {
  id: string;
  propertyName: string;
  propertyType: AnimatablePropertyType;
  keyframes: Keyframe[];
  muted: boolean;
  solo: boolean;
  color: string;
}
```

**Timeline**: Manages multiple tracks
```typescript
class Timeline {
  actor: SK8Actor | null;
  tracks: Track[];
  currentTime: number;
  playing: boolean;
  loop: boolean;
  playbackSpeed: number;
}
```

#### 2. Timeline View (`timeline-view.ts`)

Canvas-based visual timeline with:
- Track lanes
- Keyframe markers (diamond-shaped)
- Scrubber/playhead
- Time grid
- Zoom/pan controls

#### 3. Keyframe Editor (`keyframe-editor.ts`)

UI for editing individual keyframes:
- Time input
- Value input (type-specific)
- Easing curve selector
- Curve preview canvas
- Copy/paste/delete actions

#### 4. Playback Controls (`playback.ts`)

Animation playback:
- Play/pause/stop buttons
- Loop toggle
- Speed control (0.25x - 2x)
- Time display
- Export to code

#### 5. Timeline Panel (`timeline-panel.ts`)

Main integration component that combines all sub-components and provides:
- Command pattern integration for undo/redo
- Keyboard shortcuts
- Actor binding

## Usage

### Basic Setup

```typescript
import { TimelinePanel } from './editor/timeline';
import { SK8Actor } from './graphics/SK8Actor';

// Create actor
const actor = new SK8Actor();

// Create timeline panel
const container = document.getElementById('timeline-container');
const timelinePanel = new TimelinePanel(container, actor);

// Add a track
const track = timelinePanel.addTrack('left', 'position');

// Add keyframes
timelinePanel.addKeyframe(track.id, 0, 0);        // Start at 0
timelinePanel.addKeyframe(track.id, 1000, 100);   // Move to 100 at 1s
timelinePanel.addKeyframe(track.id, 2000, 0);     // Back to 0 at 2s
```

### With Editor Integration

```typescript
import { SK8Editor } from './editor/editor';
import { TimelinePanel } from './editor/timeline';

const editor = new SK8Editor(stage);
const actor = new SK8Actor();

// Timeline with undo/redo support
const timelinePanel = new TimelinePanel(container, actor, editor);

// All timeline operations will create undo-able commands
timelinePanel.addTrack('rotation', 'rotation');
timelinePanel.addKeyframe(trackId, 0, 0, 'easeInQuad');
```

### Working with Tracks

```typescript
// Get or create track
const timeline = timelinePanel.getTimeline();
const track = timeline.getOrCreateTrack('opacity', 'opacity');

// Add keyframes with different easings
track.addKeyframe(new Keyframe(0, 1.0, Easing.linear, 'linear'));
track.addKeyframe(new Keyframe(1000, 0.5, Easing.easeInQuad, 'easeInQuad'));
track.addKeyframe(new Keyframe(2000, 1.0, Easing.easeOutBounce, 'easeOutBounce'));

// Mute/solo tracks
track.muted = true;
track.solo = true;
```

### Playback Control

```typescript
const timeline = timelinePanel.getTimeline();

// Play/pause
timeline.playing = true;
timeline.seekTo(500);  // Seek to 500ms

// Loop and speed
timeline.loop = true;
timeline.playbackSpeed = 1.5;  // 1.5x speed

// Apply to actor
timeline.applyToActor();
```

### Export Animation

```typescript
const timeline = timelinePanel.getTimeline();
const code = timeline.exportToCode();

// Generates code like:
// import { animations, Easing } from "./runtime/animation.js";
//
// // Animate left
// setTimeout(() => {
//   animations.animate(actor, "left", 100, 1000, {
//     easing: Easing.easeInQuad
//   });
// }, 0);
```

### Keyboard Shortcuts

The timeline panel supports keyboard shortcuts:

- **Space**: Play/Pause
- **Left Arrow**: Step backward (100ms)
- **Right Arrow**: Step forward (100ms)
- **Delete/Backspace**: Delete selected keyframes
- **Ctrl+Z**: Undo (when integrated with editor)
- **Ctrl+Shift+Z**: Redo (when integrated with editor)

```typescript
document.addEventListener('keydown', (e) => {
  timelinePanel.handleKeyDown(e);
});
```

## API Reference

### TimelinePanel

#### Constructor
```typescript
constructor(container: HTMLElement, actor?: SK8Actor, editor?: SK8Editor)
```

#### Methods

**Track Management**
```typescript
addTrack(propertyName: string, propertyType: AnimatablePropertyType): Track
removeTrack(trackId: string): boolean
```

**Keyframe Management**
```typescript
addKeyframe(trackId: string, time: number, value: PropertyValue, easingName?: string): Keyframe | null
removeKeyframe(trackId: string, keyframeId: string): boolean
```

**Timeline Control**
```typescript
getTimeline(): Timeline
setTimeline(timeline: Timeline): void
setActor(actor: SK8Actor): void
```

**Events**
```typescript
handleKeyDown(event: KeyboardEvent): boolean
destroy(): void
```

### Timeline

#### Methods

**Track Management**
```typescript
addTrack(track: Track): void
removeTrack(trackId: string): boolean
getTrack(trackId: string): Track | null
getTrackByProperty(propertyName: string): Track | null
getOrCreateTrack(propertyName: string, propertyType: AnimatablePropertyType): Track
```

**Playback**
```typescript
seekTo(time: number): void
applyToActor(): void
getDuration(): number
```

**Data**
```typescript
getAllKeyframes(): Array<{ track: Track; keyframe: Keyframe }>
clone(): Timeline
toJSON(): any
static fromJSON(data: any, actor?: SK8Actor): Timeline
```

**Export**
```typescript
exportToCode(): string
```

### Track

#### Methods

**Keyframe Management**
```typescript
addKeyframe(keyframe: Keyframe): void
removeKeyframe(keyframeId: string): boolean
getKeyframe(keyframeId: string): Keyframe | null
updateKeyframeTime(keyframeId: string, newTime: number): boolean
getKeyframesInRange(startTime: number, endTime: number): Keyframe[]
```

**Interpolation**
```typescript
getValueAtTime(time: number): PropertyValue
getDuration(): number
```

**Data**
```typescript
clone(): Track
toJSON(): any
static fromJSON(data: any): Track
```

### Keyframe

#### Methods

```typescript
clone(): Keyframe
toJSON(): any
static fromJSON(data: any): Keyframe
```

## Animatable Properties

The timeline supports these property types:

| Type | Properties | Value Type | Example |
|------|-----------|------------|---------|
| `number` | Any numeric property | `number` | `42` |
| `position` | `left`, `top` | `number` | `100` |
| `scale` | `width`, `height` | `number` | `1.5` |
| `rotation` | `rotation` | `number` (degrees) | `45` |
| `opacity` | `opacity` | `number` (0-1) | `0.8` |
| `color` | `fillColor`, `frameColor` | `Color` | `{r: 255, g: 0, b: 0}` |

## Easing Functions

Available easing functions:

- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInElastic`, `easeOutElastic`
- `easeInBounce`, `easeOutBounce`

## Testing

The timeline editor includes 50+ comprehensive tests:

```bash
npm test -- timeline.test.ts
```

### Test Coverage

- **Keyframe Tests**: Creation, cloning, serialization
- **Track Tests**: CRUD operations, sorting, interpolation
- **Timeline Tests**: Multi-track management, playback, export
- **Easing Tests**: All easing functions
- **Edge Cases**: Empty tracks, overlapping keyframes, large values
- **Performance Tests**: Many keyframes/tracks

## Demo

Open the interactive demo:

```bash
# Build the project
npm run build

# Open demo in browser
open demo/timeline-demo.html
```

The demo showcases:
- Multi-track animation (position, rotation, opacity)
- Different easing curves
- Real-time preview
- Export functionality
- Interactive keyframe editing

## Integration with Property Inspector

To add "Add Keyframe" buttons to the property inspector:

```typescript
import { SK8PropertyInspector } from './editor/property-inspector';
import { TimelinePanel } from './editor/timeline';

const inspector = new SK8PropertyInspector(editor, container);
const timelinePanel = new TimelinePanel(timelineContainer, actor, editor);

// Listen to property inspector
inspector.addPropertyDefinition({
  name: 'left',
  displayName: 'Left',
  type: 'number',
  group: 'layout',
  // Custom renderer could add "Add Keyframe" button
});
```

## Performance Considerations

### Optimization Tips

1. **Limit Keyframe Count**: While the system handles 1000+ keyframes, keep track keyframes reasonable (< 100 per track)
2. **Use Appropriate Zoom**: Set zoom level to show relevant detail
3. **Mute Unused Tracks**: Muted tracks don't apply values during playback
4. **Batch Operations**: Use undo/redo for batch keyframe operations

### Benchmarks

From performance tests:
- Add 1000 keyframes: < 1 second
- 100 interpolations: < 100ms
- 100 tracks with keyframes: < 1 second

## Examples

### Example 1: Simple Position Animation

```typescript
const timeline = new Timeline(actor);

const track = new Track('left', 'position');
track.addKeyframe(new Keyframe(0, 0));
track.addKeyframe(new Keyframe(1000, 200, Easing.easeInOutQuad, 'easeInOutQuad'));
timeline.addTrack(track);

timeline.seekTo(500);  // Actor at position 100 (halfway)
```

### Example 2: Complex Multi-Track Animation

```typescript
const timeline = new Timeline(actor);

// Position track
const posTrack = new Track('left', 'position');
posTrack.addKeyframe(new Keyframe(0, 0));
posTrack.addKeyframe(new Keyframe(1000, 300, Easing.easeOutBounce, 'easeOutBounce'));
timeline.addTrack(posTrack);

// Rotation track
const rotTrack = new Track('rotation', 'rotation');
rotTrack.addKeyframe(new Keyframe(0, 0));
rotTrack.addKeyframe(new Keyframe(1000, 360, Easing.linear, 'linear'));
timeline.addTrack(rotTrack);

// Opacity track
const opacityTrack = new Track('opacity', 'opacity');
opacityTrack.addKeyframe(new Keyframe(0, 1.0));
opacityTrack.addKeyframe(new Keyframe(500, 0.3, Easing.easeInQuad, 'easeInQuad'));
opacityTrack.addKeyframe(new Keyframe(1000, 1.0, Easing.easeOutQuad, 'easeOutQuad'));
timeline.addTrack(opacityTrack);

// Play animation
timeline.loop = true;
timeline.playing = true;
```

### Example 3: Color Animation

```typescript
const timeline = new Timeline(actor);

const colorTrack = new Track('fillColor', 'color');
colorTrack.addKeyframe(
  new Keyframe(0, { r: 255, g: 0, b: 0 }, Easing.linear, 'linear')
);
colorTrack.addKeyframe(
  new Keyframe(1000, { r: 0, g: 255, b: 0 }, Easing.easeInOutQuad, 'easeInOutQuad')
);
colorTrack.addKeyframe(
  new Keyframe(2000, { r: 0, g: 0, b: 255 }, Easing.easeInOutQuad, 'easeInOutQuad')
);
timeline.addTrack(colorTrack);
```

## Troubleshooting

### Timeline Not Rendering

**Issue**: Canvas appears blank

**Solutions**:
- Ensure container has width/height
- Check that timeline has tracks
- Verify canvas context is available

### Keyframes Not Interpolating

**Issue**: Values not changing smoothly

**Solutions**:
- Check keyframes are sorted by time
- Verify easing function is set
- Ensure track.getValueAtTime() is called

### Actor Not Updating

**Issue**: Actor properties not changing

**Solutions**:
- Call `timeline.applyToActor()`
- Check track is not muted
- Verify actor has property setters

### Performance Issues

**Issue**: Timeline is slow

**Solutions**:
- Reduce keyframe count
- Lower canvas resolution
- Disable real-time preview during editing

## Future Enhancements

Potential improvements:
- Curve path visualization
- Onion skinning for animation preview
- Timeline markers and labels
- Group track organization
- Custom property types
- Animation templates
- Motion path editor

## License

Part of the SK8 TypeScript port.

## Contributing

See main project README for contribution guidelines.
