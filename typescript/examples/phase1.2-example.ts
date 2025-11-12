/**
 * Phase 1.2 Features Example
 *
 * This example demonstrates the new graphics features:
 * - Gradients (linear and radial)
 * - Transforms (rotate, scale, skew)
 * - Advanced text styling
 * - Performance optimization
 */

import { SK8Stage } from '../src/graphics/SK8Stage.js';
import { SK8Rectangle, SK8Circle, SK8Text } from '../src/graphics/shapes.js';
import { LinearGradient, RadialGradient } from '../src/graphics/gradients.js';
import { TextStyle } from '../src/graphics/text-style.js';

// Example 1: Gradient-filled shapes
export function createGradientExample(canvas: HTMLCanvasElement): SK8Stage {
  const stage = new SK8Stage(canvas);
  stage.setBackgroundColor({ r: 240, g: 240, b: 240 });

  // Rectangle with linear gradient
  const rect1 = new SK8Rectangle();
  rect1.setBoundsRect({ left: 50, top: 50, right: 200, bottom: 150 });

  const linearGrad = LinearGradient.horizontal()
    .addColorStop(0, '#FF6B6B')
    .addColorStop(0.5, '#FFD93D')
    .addColorStop(1, '#6BCF7F');
  rect1.setFillColor(linearGrad);
  rect1.setFrameColor('black');

  stage.addActor(rect1);

  // Circle with radial gradient
  const circle = new SK8Circle();
  circle.setBoundsRect({ left: 300, top: 50, right: 450, bottom: 200 });

  const radialGrad = RadialGradient.centered()
    .addColorStop(0, 'white')
    .addColorStop(1, '#4A90E2');
  circle.setFillColor(radialGrad);
  circle.setFrameColor('navy');

  stage.addActor(circle);

  return stage;
}

// Example 2: Transformed shapes
export function createTransformExample(canvas: HTMLCanvasElement): SK8Stage {
  const stage = new SK8Stage(canvas);
  stage.setBackgroundColor('white');

  // Rotated rectangle
  const rect1 = new SK8Rectangle();
  rect1.setBoundsRect({ left: 100, top: 100, right: 200, bottom: 150 });
  rect1.setFillColor('#E74C3C');
  rect1.rotate(45);

  stage.addActor(rect1);

  // Scaled rectangle
  const rect2 = new SK8Rectangle();
  rect2.setBoundsRect({ left: 300, top: 100, right: 350, bottom: 150 });
  rect2.setFillColor('#3498DB');
  rect2.scale(1.5, 2);

  stage.addActor(rect2);

  // Skewed rectangle
  const rect3 = new SK8Rectangle();
  rect3.setBoundsRect({ left: 500, top: 100, right: 600, bottom: 150 });
  rect3.setFillColor('#9B59B6');
  rect3.skew(20, 0);

  stage.addActor(rect3);

  return stage;
}

// Example 3: Styled text
export function createTextExample(canvas: HTMLCanvasElement): SK8Stage {
  const stage = new SK8Stage(canvas);
  stage.setBackgroundColor('#F8F9FA');

  // Title text
  const title = new SK8Text();
  title.setBoundsRect({ left: 50, top: 50, right: 600, bottom: 100 });
  title.setText('Advanced Text Rendering');
  title.setFillColor('#2C3E50');

  const titleStyle = title.getTextStyle();
  titleStyle.setFontSize(32)
           .setFontWeight('bold')
           .setTextAlign('center');

  stage.addActor(title);

  // Subtitle with decoration
  const subtitle = new SK8Text();
  subtitle.setBoundsRect({ left: 50, top: 100, right: 600, bottom: 130 });
  subtitle.setText('With rich formatting and styling');
  subtitle.setFillColor('#7F8C8D');

  const subtitleStyle = subtitle.getTextStyle();
  subtitleStyle.setFontSize(18)
              .setTextAlign('center')
              .setTextDecoration('underline');

  stage.addActor(subtitle);

  // Multi-line wrapped text
  const body = new SK8Text();
  body.setBoundsRect({ left: 50, top: 160, right: 600, bottom: 300 });
  body.setText('This text demonstrates word wrapping with custom line height. ' +
               'The TextStyle class provides comprehensive control over typography, ' +
               'including font properties, alignment, spacing, and decorations.');
  body.setFillColor('#34495E');

  const bodyStyle = body.getTextStyle();
  bodyStyle.setFontSize(16)
           .setLineHeight(1.6)
           .setWordWrap(true)
           .setMaxWidth(550);

  stage.addActor(body);

  return stage;
}

// Example 4: Animated scene with performance optimization
export function createPerformanceExample(canvas: HTMLCanvasElement): SK8Stage {
  const stage = new SK8Stage(canvas);
  stage.setBackgroundColor('#ECF0F1');

  // Enable dirty rectangle optimization
  stage.setUseDirtyRectOptimization(true);

  const actors: SK8Rectangle[] = [];
  const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];

  // Create many actors
  for (let i = 0; i < 50; i++) {
    const rect = new SK8Rectangle();
    const x = Math.random() * (canvas.width - 50);
    const y = Math.random() * (canvas.height - 50);

    rect.setBoundsRect({
      left: x,
      top: y,
      right: x + 30,
      bottom: y + 30
    });
    rect.setFillColor(colors[i % colors.length]);
    rect.setFrameColor('white');

    actors.push(rect);
    stage.addActor(rect);
  }

  // Animate some actors
  let frame = 0;
  const animate = () => {
    frame++;

    // Only animate first 10 actors
    for (let i = 0; i < 10; i++) {
      const actor = actors[i];
      const rotation = actor.getRotation();
      actor.rotate(rotation + 2);
      stage.markActorDirty(actor);
    }

    stage.setNeedsRender();
  };

  // Log FPS every second
  setInterval(() => {
    console.log(`FPS: ${stage.getFPS()}, Actors: ${actors.length}`);
  }, 1000);

  return { stage, animate };
}

// Example 5: Combined features
export function createCombinedExample(canvas: HTMLCanvasElement): SK8Stage {
  const stage = new SK8Stage(canvas);

  // Background gradient
  const bgRect = new SK8Rectangle();
  bgRect.setBoundsRect({ left: 0, top: 0, right: canvas.width, bottom: canvas.height });

  const bgGrad = LinearGradient.diagonal()
    .addColorStop(0, '#667eea')
    .addColorStop(1, '#764ba2');
  bgRect.setFillColor(bgGrad);

  stage.addActor(bgRect);

  // Rotated circle with radial gradient
  const circle = new SK8Circle();
  circle.setBoundsRect({ left: 200, top: 150, right: 400, bottom: 350 });

  const circleGrad = RadialGradient.spotlight(0.3, 0.3)
    .addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    .addColorStop(1, 'rgba(255, 165, 0, 0.6)');
  circle.setFillColor(circleGrad);
  circle.setFrameColor('white');
  circle.rotate(0);  // Will be animated

  stage.addActor(circle);

  // Styled text overlay
  const text = new SK8Text();
  text.setBoundsRect({ left: 150, top: 240, right: 450, bottom: 280 });
  text.setText('SK8 Phase 1.2');
  text.setFillColor('white');

  const textStyle = text.getTextStyle();
  textStyle.setFontSize(36)
           .setFontWeight('bold')
           .setTextAlign('center');

  stage.addActor(text);

  // Animation
  let angle = 0;
  const animate = () => {
    angle += 1;
    circle.rotate(angle);
    stage.markActorDirty(circle);
    stage.setNeedsRender();
  };

  return { stage, animate };
}

// Usage examples (to be called from HTML)
declare global {
  interface Window {
    SK8Examples: typeof SK8Examples;
  }
}

export const SK8Examples = {
  createGradientExample,
  createTransformExample,
  createTextExample,
  createPerformanceExample,
  createCombinedExample
};

// Make available globally for HTML demos
if (typeof window !== 'undefined') {
  window.SK8Examples = SK8Examples;
}
