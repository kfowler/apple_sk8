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
  ImageFitMode,
} from './graphics/advanced-shapes.js';
export type { ImageTransform, ImageEffects } from './graphics/advanced-shapes.js';

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

// Extended Shapes (Phase 1 Additional Shapes)
export { SK8Arrow } from './actors/Arrow.js';
export type { ArrowDirection } from './actors/Arrow.js';
export { SK8Star } from './actors/Star.js';
export { SK8Path } from './actors/Path.js';
export type { PathCommand } from './actors/Path.js';
export { SK8TextBox } from './actors/TextBox.js';
export type { TextAlignment } from './actors/TextBox.js';
export { SK8ProgressBar } from './actors/ProgressBar.js';
export type { ProgressBarOrientation } from './actors/ProgressBar.js';

// Media Actors (Phase 3.1)
export { SK8Picture, createPicture } from './actors/Picture.js';
export { SK8MovieRectangle, createMovieRectangle, VideoFitMode } from './actors/MovieRectangle.js';
export { SK8Sound, SoundManager, createSound, SoundState } from './actors/Sound.js';

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

// Gradients (already implemented in Phase 1)
export { Gradient, LinearGradient, RadialGradient } from './graphics/gradients.js';
export type { ColorStop } from './graphics/gradients.js';

// Text Styling
export { TextStyle } from './graphics/text-style.js';

// Media Management (Phase 3.1)
export {
  MediaManager,
  getMediaManager,
  registerAsset,
  loadAsset,
  getAsset,
  getAssetData,
  preloadAssets,
  MediaType,
  MediaStatus,
} from './media/media-manager.js';
export type { MediaAsset, ProgressCallback } from './media/media-manager.js';

// Audio Utilities (Phase 3.1)
export {
  getAudioContext,
  resumeAudioContext,
  getAudioContextState,
  closeAudioContext,
  loadAudio,
  preloadAudio,
  clearAudioCache,
  removeFromCache,
  getCacheSize,
  playAudioBuffer,
  VolumeController,
  create3DAudioSource,
  setListenerPosition,
  createAudioAnalyzer,
  playBeep,
  playToneSequence,
} from './media/audio-utils.js';
export type { AudioPlayer, Audio3DOptions } from './media/audio-utils.js';

// SK8Script - Scripting Language (Phase 2.1)
export { tokenize, Lexer, LexerError } from './sk8script/lexer/lexer.js';
export { Token, TokenType, KEYWORDS, getOperatorPrecedence } from './sk8script/lexer/token.js';
export { parse, Parser, ParserError } from './sk8script/parser/parser.js';
export {
  isLiteral,
  isIdentifier,
  isBinaryOp,
  isUnaryOp,
  isPropertyAccess,
  isIndexAccess,
  isGrouping,
  isAssignment,
  createLiteral,
  createIdentifier,
  createBinaryOp,
  createUnaryOp,
  createPropertyAccess,
  createIndexAccess,
  createGrouping,
  createAssignment,
  printAST,
} from './sk8script/parser/ast.js';
export type {
  ASTNode,
  LiteralNode,
  IdentifierNode,
  BinaryOpNode,
  UnaryOpNode,
  PropertyAccessNode,
  IndexAccessNode,
  GroupingNode,
  AssignmentNode,
} from './sk8script/parser/ast.js';
export { evaluate, Evaluator, EvaluatorError } from './sk8script/evaluator/evaluator.js';
export type { EvaluationContext } from './sk8script/evaluator/evaluator.js';

// Project System (Phase 3.2)
export {
  SK8Project,
  createProject,
  createProjectFromTemplate,
} from './project/project.js';
export type {
  ProjectMetadata,
  ProjectAsset,
  ProjectScript,
  StageDefinition,
} from './project/project.js';

// Serialization
export {
  serializeProject,
  serializeProjectToObject,
  validateSerializedProject,
  serializeHandler,
} from './project/serializer.js';
export type {
  SerializedProject,
  SerializationOptions,
} from './project/serializer.js';

// Deserialization
export {
  deserializeProject,
  deserializeProjectFromObject,
  validateProject,
  registerActorClass,
} from './project/deserializer.js';
export type { DeserializationOptions } from './project/deserializer.js';

// File I/O
export {
  saveProjectToFile,
  loadProjectFromFile,
  openProjectFromFilePicker,
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
  enableAutoSave,
  recoverProjectFromAutoSave,
  hasAutoSave,
  clearAutoSave,
  getRecentProjects,
  clearRecentProjects,
  exportProjectAsJSON,
  importProjectFromJSON,
  isLocalStorageAvailable,
  getStorageInfo,
  backupProjectToIndexedDB,
  restoreProjectFromIndexedDB,
} from './project/file-io.js';
export type {
  FileIOOptions,
  AutoSaveConfig,
  RecentProjectEntry,
} from './project/file-io.js';

// Project Manager
export {
  ProjectManager,
  getProjectManager,
  createProjectManager,
} from './project/project-manager.js';
export type {
  ProjectChangeListener,
  DirtyStateListener,
  ProjectManagerOptions,
} from './project/project-manager.js';

// Version
export const VERSION = '0.3.1';

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
