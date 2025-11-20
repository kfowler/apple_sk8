# Presentation Template

## Overview
Slide-based presentation application template with navigation, thumbnails, fullscreen mode, and export.

## Features
- **Multiple Slides:** Add, delete, reorder slides
- **Slide Navigation:** Previous/next, thumbnail strip
- **Fullscreen Mode:** Presentation mode with keyboard nav
- **Thumbnail Preview:** Visual slide overview
- **Keyboard Shortcuts:** Arrow keys, Space, Escape
- **Export Ready:** PDF export placeholder

## Structure
```javascript
presentation = {
    slides: [],              // Array of slide objects
    currentSlideIndex: 0,    // Current slide
    fullscreenMode: false,   // Presentation mode

    addSlide(),             // Create new slide
    deleteSlide(),          // Remove slide
    nextSlide(),            // Navigate forward
    previousSlide(),        // Navigate backward
    goToSlide(index),       // Jump to slide
    renderSlide(slide),     // Render slide content
    toggleFullscreen(),     // Enter/exit presentation
    exportPDF()             // Export to PDF
}
```

## Slide Object
```javascript
{
    id: timestamp,
    title: 'Slide Title',
    content: [
        {
            type: 'text',
            text: 'Content',
            x: 480,
            y: 360,
            fontSize: 48,
            color: '#333333'
        }
        // Add more content items
    ],
    background: '#ffffff'
}
```

## Keyboard Shortcuts
- **→ or Space:** Next slide
- **←:** Previous slide
- **Escape:** Exit fullscreen
- **Click Left/Right:** Navigate in fullscreen

## Adding Content Types

### Text
```javascript
{
    type: 'text',
    text: 'Hello World',
    x: 480,
    y: 360,
    fontSize: 48,
    color: '#333333'
}
```

### Image (TODO)
```javascript
{
    type: 'image',
    src: 'path/to/image.jpg',
    x: 100,
    y: 100,
    width: 200,
    height: 150
}
```

### Shape (TODO)
```javascript
{
    type: 'rectangle',
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    color: '#4ECDC4'
}
```

## Perfect For
- Presentations and slideshows
- Educational content
- Portfolio showcases
- Tutorial sequences
- Story-based applications

## Code Statistics
- **Lines:** ~300 (boilerplate)
- **Setup Time:** 10 minutes
- **Difficulty:** Intermediate

## Next Steps
1. Add more content types (images, shapes)
2. Implement slide transitions
3. Add text formatting options
4. Create theme system
5. Implement PDF export with jsPDF
6. Add speaker notes

## Extensions
- Animation between slides
- Embedded video support
- Live polls/quizzes
- Remote control
- Slide templates
- Import from PowerPoint
