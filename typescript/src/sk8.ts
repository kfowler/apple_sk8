/**
 * SK8 TypeScript Port
 *
 * Main entry point - exports all public API
 */

// Core
export { SK8Object, newSK8Object } from './core/SK8Object.js';
export type { PropertyValue, PropertyDescriptor } from './core/SK8Object.js';

// Graphics types
export { RectUtils, ColorUtils, TransferMode } from './graphics/types.js';
export type { Rect, Point, Color } from './graphics/types.js';

// Actors
export { SK8Actor } from './graphics/SK8Actor.js';
export { SK8Rectangle, SK8RoundRect, SK8Circle, SK8Text, SK8Line } from './graphics/shapes.js';

// Advanced shapes
export {
  SK8Polygon,
  SK8Image,
  SK8Group,
  createStar,
  createRegularPolygon,
} from './graphics/advanced-shapes.js';

// Stage
export { SK8Stage } from './graphics/SK8Stage.js';
import { SK8Stage } from './graphics/SK8Stage.js';

// Animation
export { animations, AnimationManager, Easing, AnimationHelpers } from './runtime/animation.js';
export type { Animation, EasingFunction } from './runtime/animation.js';

// Collections
export {
  SK8Collection,
  SK8List,
  SK8Table,
  newList,
  newTable,
  CollectionUtils,
} from './runtime/collections.js';

// Version
export const VERSION = '0.2.0';

/**
 * Helper function to initialize SK8 with a canvas
 */
export function createStage(canvas: HTMLCanvasElement | string): SK8Stage {
  return new SK8Stage(canvas);
}

/**
 * Log SK8 info
 */
export function info(): void {
  console.log(`SK8 TypeScript Port v${VERSION}`);
  console.log('A multimedia authoring environment for the web');
  console.log('Based on the original SK8 by Apple Computer, Inc.');
}
