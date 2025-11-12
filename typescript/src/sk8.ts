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

// Interactive Actors (Widgets)
export { SK8Button } from './actors/Button.js';
export type { ButtonState } from './actors/Button.js';
export { SK8CheckBox } from './actors/CheckBox.js';
export { SK8RadioButton } from './actors/RadioButton.js';
export { SK8Slider } from './actors/Slider.js';
export type { SliderOrientation } from './actors/Slider.js';
export { SK8EditText } from './actors/EditText.js';
export { SK8Label } from './actors/Label.js';
export type { TextAlign, VerticalAlign } from './actors/Label.js';
export { SK8Container } from './actors/Container.js';
export type { LayoutMode } from './actors/Container.js';
export { SK8Panel } from './actors/Panel.js';
export { SK8Scroller } from './actors/Scroller.js';
export { SK8MenuButton } from './actors/MenuButton.js';
export type { MenuItem } from './actors/MenuButton.js';

// Stage
export { SK8Stage } from './graphics/SK8Stage.js';
import { SK8Stage } from './graphics/SK8Stage.js';

// Events
export {
  SK8Event,
  SK8MouseEvent,
  SK8KeyboardEvent,
  SK8TouchEvent,
  SK8DragEvent,
  SK8CustomEvent,
  EventPhase,
  MouseButton,
} from './events/SK8Event.js';
export type {
  EventListener,
  EventListenerOptions,
  EventListenerEntry,
  TouchPoint,
} from './events/SK8Event.js';
export { EventDispatcher } from './events/event-dispatcher.js';
export type { EventTarget } from './events/event-dispatcher.js';
export { DragDropManager } from './events/drag-drop.js';
export type { DragConstraints, DragState } from './events/drag-drop.js';
export { GestureRecognizer } from './events/gestures.js';
export type { GestureType, SwipeDirection, GestureData } from './events/gestures.js';
export {
  debounce,
  throttle,
  once,
  EventSimulator,
  createCustomEvent,
  waitForEvent,
  delegate,
} from './events/event-utils.js';

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
export const VERSION = '0.3.0';

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
