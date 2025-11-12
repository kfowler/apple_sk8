# SK8 Project File Format (.sk8json)

This document describes the SK8 project file format used for saving and loading SK8 projects.

## Overview

SK8 projects are saved as JSON files with the `.sk8json` extension. The format is designed to be:

- **Human-readable**: JSON format with optional pretty-printing
- **Version-tracked**: Format version for compatibility
- **Extensible**: Custom metadata fields supported
- **Reference-based**: Object references to handle circular dependencies
- **Complete**: Captures all project state including actors, stages, assets, and scripts

## File Structure

### Top Level

```json
{
  "formatVersion": "1.0.0",
  "metadata": { ... },
  "stages": [ ... ],
  "actors": [ ... ],
  "assets": [ ... ],
  "scripts": [ ... ]
}
```

### Format Version

The `formatVersion` field indicates the file format version. Current version is `1.0.0`.

Version format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible format changes
- **MINOR**: Backward-compatible additions
- **PATCH**: Backward-compatible fixes

### Metadata Section

Project metadata includes information about the project itself:

```json
{
  "metadata": {
    "name": "Project Name",
    "description": "Optional description",
    "author": "Author Name",
    "created": "2025-11-12T00:00:00.000Z",
    "modified": "2025-11-12T00:00:00.000Z",
    "version": "1.0.0",
    "sk8Version": "0.3.0",
    "customField": "Custom metadata can be added"
  }
}
```

**Required fields:**
- `name` (string): Project name
- `version` (string): Project version
- `created` (string): ISO 8601 timestamp
- `modified` (string): ISO 8601 timestamp
- `sk8Version` (string): SK8 version used to create the project

**Optional fields:**
- `description` (string): Project description
- `author` (string): Author name
- Any custom fields

### Stages Section

Stages represent canvases in the project:

```json
{
  "stages": [
    {
      "id": "stage1",
      "name": "Main Stage",
      "width": 800,
      "height": 600,
      "backgroundColor": {
        "r": 255,
        "g": 255,
        "b": 255,
        "a": 1
      },
      "actorIds": ["rect1", "circle1"]
    }
  ]
}
```

**Stage fields:**
- `id` (string): Unique stage identifier
- `name` (string): Display name
- `width` (number): Canvas width in pixels
- `height` (number): Canvas height in pixels
- `backgroundColor` (Color): Background color object
- `actorIds` (array): Array of actor IDs on this stage

### Actors Section

Actors are the visual objects in the project:

```json
{
  "actors": [
    {
      "id": "rect1",
      "className": "SK8Rectangle",
      "name": "RedRectangle",
      "properties": {
        "boundsRect": {
          "value": { "left": 100, "top": 100, "right": 200, "bottom": 200 },
          "type": "object"
        },
        "fillColor": {
          "value": { "r": 255, "g": 0, "b": 0, "a": 1 },
          "type": "object"
        },
        "visible": {
          "value": true,
          "type": "boolean"
        }
      },
      "handlers": {},
      "parentId": "optionalParentId"
    }
  ]
}
```

**Actor fields:**
- `id` (string): Unique actor identifier
- `className` (string): Actor class name (e.g., "SK8Rectangle", "SK8Button")
- `name` (string): Actor instance name
- `properties` (object): Property values
- `handlers` (object): Handler functions (see Scripts section)
- `parentId` (string, optional): Parent object ID for inheritance

### Properties Format

Each property is stored with type information:

```json
{
  "propertyName": {
    "value": <actual-value>,
    "type": "string|number|boolean|object|array|reference|gradient|null",
    "metadata": { ... }  // optional
  }
}
```

**Property types:**

1. **Primitives**: `string`, `number`, `boolean`, `null`
   ```json
   { "value": "hello", "type": "string" }
   { "value": 42, "type": "number" }
   { "value": true, "type": "boolean" }
   ```

2. **Objects**: Plain objects like Color, Rect, Point
   ```json
   {
     "value": { "r": 255, "g": 0, "b": 0, "a": 1 },
     "type": "object"
   }
   ```

3. **Arrays**: Lists of values
   ```json
   {
     "value": [1, 2, 3],
     "type": "array"
   }
   ```

4. **References**: References to other SK8Objects
   ```json
   {
     "value": "obj_123",
     "type": "reference"
   }
   ```

5. **Gradients**: Gradient objects
   ```json
   {
     "value": { "$gradient": { ... } },
     "type": "gradient"
   }
   ```

### Assets Section

Assets are external resources used in the project:

```json
{
  "assets": [
    {
      "id": "img1",
      "type": "image",
      "name": "logo.png",
      "url": "data:image/png;base64,iVBORw0KGgo...",
      "size": 15234,
      "mimeType": "image/png",
      "metadata": {
        "width": 256,
        "height": 256,
        "description": "Company logo"
      }
    }
  ]
}
```

**Asset fields:**
- `id` (string): Unique asset identifier
- `type` (string): Asset type ("image", "sound", "video", etc.)
- `name` (string): Asset file name
- `url` (string): Data URI or URL
- `size` (number, optional): Size in bytes
- `mimeType` (string, optional): MIME type
- `metadata` (object, optional): Custom metadata

**Asset types:**
- `image`: PNG, JPEG, GIF, SVG
- `sound`: MP3, WAV, OGG
- `video`: MP4, WebM
- `font`: TTF, WOFF, WOFF2
- `data`: JSON, XML, text files

### Scripts Section

Scripts define handler functions for actors:

```json
{
  "scripts": [
    {
      "objectId": "rect1",
      "handlerName": "onClick",
      "source": "function(x, y) { console.log('Clicked at', x, y); }",
      "parameters": ["x", "y"]
    }
  ]
}
```

**Script fields:**
- `objectId` (string): Actor ID this script belongs to
- `handlerName` (string): Handler/event name
- `source` (string): JavaScript source code
- `parameters` (array, optional): Parameter names

## Reference Handling

Object references are handled using IDs to avoid circular dependencies:

```json
{
  "actors": [
    {
      "id": "parent1",
      "properties": {
        "child": {
          "value": "child1",
          "type": "reference"
        }
      }
    },
    {
      "id": "child1",
      "parentId": "parent1"
    }
  ]
}
```

## Special Value Syntax

### Object References

```json
{ "$ref": "object_id" }
```

### Gradients

```json
{
  "$gradient": {
    "type": "LinearGradient",
    "stops": [
      { "offset": 0, "color": { "r": 0, "g": 0, "b": 0, "a": 1 } },
      { "offset": 1, "color": { "r": 255, "g": 255, "b": 255, "a": 1 } }
    ]
  }
}
```

## Color Format

Colors are represented as RGBA objects:

```json
{
  "r": 255,    // Red (0-255)
  "g": 128,    // Green (0-255)
  "b": 64,     // Blue (0-255)
  "a": 1.0     // Alpha (0.0-1.0)
}
```

## Rectangle Format

Rectangles are represented with left, top, right, bottom:

```json
{
  "left": 100,
  "top": 50,
  "right": 200,
  "bottom": 150
}
```

## Point Format

Points have x and y coordinates:

```json
{
  "x": 150,
  "y": 200
}
```

## Best Practices

### File Organization

1. **Pretty Print**: Use pretty printing for human readability
2. **Compression**: Use gzip compression for production
3. **Validation**: Validate structure before loading
4. **Backups**: Keep backup copies of important projects

### Property Guidelines

1. **Essential Properties**: Only serialize essential properties
2. **Computed Properties**: Don't serialize computed properties (they're recalculated)
3. **Type Safety**: Always include type information
4. **Metadata**: Add metadata for documentation

### Asset Management

1. **Data URIs**: Use data URIs for small assets
2. **External URLs**: Use external URLs for large assets
3. **Compression**: Compress images and media
4. **Lazy Loading**: Implement lazy loading for large projects

### Script Guidelines

1. **Safety**: Validate and sandbox script execution
2. **Dependencies**: Document script dependencies
3. **Error Handling**: Include error handling in scripts
4. **Comments**: Add comments to complex scripts

## Version Compatibility

### Forward Compatibility

Newer SK8 versions should be able to read older format versions by:
1. Checking `formatVersion` field
2. Providing migration paths
3. Handling missing fields gracefully

### Backward Compatibility

Within the same major version:
1. New optional fields can be added
2. Existing fields cannot be removed
3. Field types cannot change
4. Field semantics cannot change

## File Size Optimization

### Minification

Remove unnecessary whitespace:
```bash
# Before (pretty)
{
  "formatVersion": "1.0.0",
  "metadata": {
    "name": "Project"
  }
}

# After (minified)
{"formatVersion":"1.0.0","metadata":{"name":"Project"}}
```

### Asset Optimization

1. **Image Compression**: Use optimal formats (WebP, AVIF)
2. **Video Compression**: Use H.264 or VP9
3. **Audio Compression**: Use MP3 or AAC
4. **Data URIs**: Only for small assets (<10KB)

### Reference Deduplication

Use references instead of duplicating objects:
```json
{
  "actors": [
    {
      "id": "shared",
      "className": "SK8Object",
      "properties": { "color": { "value": { "r": 255, "g": 0, "b": 0, "a": 1 }, "type": "object" } }
    },
    {
      "id": "user1",
      "properties": { "sharedObject": { "value": "shared", "type": "reference" } }
    },
    {
      "id": "user2",
      "properties": { "sharedObject": { "value": "shared", "type": "reference" } }
    }
  ]
}
```

## Example: Complete Project

See `examples/` directory for complete example projects:
- `simple-project.sk8json` - Basic shapes
- `interactive-project.sk8json` - Interactive elements with handlers
- `complex-project.sk8json` - Multi-stage project with assets

## Tools

### Validation

Use `validateSerializedProject()` to validate project structure:

```typescript
import { validateSerializedProject } from 'sk8';

const isValid = validateSerializedProject(data);
```

### Serialization

```typescript
import { serializeProject } from 'sk8';

const json = serializeProject(project, {
  prettyPrint: true,
  indent: 2
});
```

### Deserialization

```typescript
import { deserializeProject } from 'sk8';

const project = deserializeProject(json, {
  strict: true,
  validate: true
});
```

## Security Considerations

### Script Execution

Scripts are executed using `Function()` constructor. In production:

1. **Sandboxing**: Use Web Workers or iframe sandboxing
2. **CSP**: Implement Content Security Policy
3. **Validation**: Validate scripts before execution
4. **Permissions**: Request user permission for script execution

### Asset Loading

1. **CORS**: Respect CORS policies for external assets
2. **Validation**: Validate asset types and sizes
3. **Sanitization**: Sanitize URLs and data URIs
4. **Rate Limiting**: Implement rate limiting for asset loading

## Future Enhancements

Planned for future versions:

1. **Binary Format**: Optional binary format for performance
2. **Streaming**: Streaming serialization/deserialization
3. **Delta Updates**: Store only changes for version control
4. **Encryption**: Optional encryption for sensitive projects
5. **Compression**: Built-in compression support
6. **Schema Validation**: JSON Schema for validation

## License

This format is part of the SK8 TypeScript Port project.
Based on the original SK8 by Apple Computer, Inc.
