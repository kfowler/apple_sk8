/**
 * SK8 Project Deserializer
 *
 * Restores SK8 projects from JSON format, handling:
 * - Object reconstruction with correct types
 * - Reference resolution
 * - Property restoration
 * - Handler parsing and binding
 */

import { SK8Project, createProject } from './project.js';
import { SerializedProject, validateSerializedProject } from './serializer.js';
import { SK8Actor } from '../graphics/SK8Actor.js';
import { SK8Stage } from '../graphics/SK8Stage.js';
import type { HandlerFunction } from '../core/SK8Object.js';
import {
  SK8Rectangle,
  SK8RoundRect,
  SK8Circle,
  SK8Text,
  SK8Line,
} from '../graphics/shapes.js';
import { SK8Polygon, SK8Image, SK8Group } from '../graphics/advanced-shapes.js';
import { SK8Button } from '../actors/Button.js';
import { SK8CheckBox } from '../actors/CheckBox.js';
import { SK8RadioButton } from '../actors/RadioButton.js';
import { SK8Slider } from '../actors/Slider.js';
import { SK8EditText } from '../actors/EditText.js';
import { SK8Label } from '../actors/Label.js';
import { SK8Container } from '../actors/Container.js';
import { SK8Panel } from '../actors/Panel.js';
import { SK8Scroller } from '../actors/Scroller.js';
import { SK8MenuButton } from '../actors/MenuButton.js';
import { Gradient, LinearGradient, RadialGradient } from '../graphics/gradients.js';

/**
 * Deserialization options
 */
export interface DeserializationOptions {
  /** Strict mode - fail on any error */
  strict?: boolean;
  /** Validate project structure */
  validate?: boolean;
  /** Create missing assets */
  createMissingAssets?: boolean;
}

/**
 * Deserialization context for tracking references
 */
class DeserializationContext {
  private objects = new Map<string, any>();
  private pendingReferences = new Map<string, Array<{ obj: any; prop: string }>>();

  /**
   * Register an object with its ID
   */
  registerObject(id: string, obj: any): void {
    this.objects.set(id, obj);

    // Resolve any pending references to this object
    const pending = this.pendingReferences.get(id);
    if (pending) {
      for (const { obj: targetObj, prop } of pending) {
        targetObj[prop] = obj;
      }
      this.pendingReferences.delete(id);
    }
  }

  /**
   * Get an object by ID
   */
  getObject(id: string): any {
    return this.objects.get(id);
  }

  /**
   * Add a pending reference
   */
  addPendingReference(refId: string, obj: any, prop: string): void {
    if (!this.pendingReferences.has(refId)) {
      this.pendingReferences.set(refId, []);
    }
    this.pendingReferences.get(refId)!.push({ obj, prop });
  }

  /**
   * Check if there are unresolved references
   */
  hasUnresolvedReferences(): boolean {
    return this.pendingReferences.size > 0;
  }

  /**
   * Get unresolved reference IDs
   */
  getUnresolvedReferenceIds(): string[] {
    return Array.from(this.pendingReferences.keys());
  }
}

/**
 * Actor class registry for deserialization
 */
const actorClassRegistry = new Map<string, new () => SK8Actor>([
  ['SK8Actor', SK8Actor as any],
  ['SK8Rectangle', SK8Rectangle as any],
  ['SK8RoundRect', SK8RoundRect as any],
  ['SK8Circle', SK8Circle as any],
  ['SK8Text', SK8Text as any],
  ['SK8Line', SK8Line as any],
  ['SK8Polygon', SK8Polygon as any],
  ['SK8Image', SK8Image as any],
  ['SK8Group', SK8Group as any],
  ['SK8Button', SK8Button as any],
  ['SK8CheckBox', SK8CheckBox as any],
  ['SK8RadioButton', SK8RadioButton as any],
  ['SK8Slider', SK8Slider as any],
  ['SK8EditText', SK8EditText as any],
  ['SK8Label', SK8Label as any],
  ['SK8Container', SK8Container as any],
  ['SK8Panel', SK8Panel as any],
  ['SK8Scroller', SK8Scroller as any],
  ['SK8MenuButton', SK8MenuButton as any],
]);

/**
 * Register a custom actor class for deserialization
 */
export function registerActorClass(className: string, constructor: new () => SK8Actor): void {
  actorClassRegistry.set(className, constructor);
}

/**
 * Deserialize an SK8 project from JSON
 */
export function deserializeProject(
  json: string,
  options: DeserializationOptions = {}
): SK8Project {
  let data: any;

  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }

  return deserializeProjectFromObject(data, options);
}

/**
 * Deserialize project from object
 */
export function deserializeProjectFromObject(
  data: SerializedProject,
  options: DeserializationOptions = {}
): SK8Project {
  // Validate structure
  if (options.validate !== false && !validateSerializedProject(data)) {
    throw new Error('Invalid project structure');
  }

  const context = new DeserializationContext();

  // Create project
  const project = createProject(data.metadata.name, data.metadata.version);
  project.updateMetadata(data.metadata);

  // Deserialize actors first (so stages can reference them)
  const actorMap = new Map<string, SK8Actor>();

  for (const actorData of data.actors) {
    try {
      const actor = deserializeActor(actorData, context, options);
      actorMap.set(actorData.id, actor);
      context.registerObject(actorData.id, actor);
      project.addActor(actorData.id, actor);
    } catch (error) {
      if (options.strict) {
        throw new Error(`Failed to deserialize actor '${actorData.id}': ${error}`);
      } else {
        console.warn(`Skipping actor '${actorData.id}': ${error}`);
      }
    }
  }

  // Deserialize stages
  for (const stageData of data.stages) {
    try {
      // Create a temporary canvas for the stage
      // In a real implementation, this would be provided by the application
      const canvas = document.createElement('canvas');
      canvas.width = stageData.width;
      canvas.height = stageData.height;

      const stage = new SK8Stage(canvas, stageData.name);

      // Set background color
      if (stageData.backgroundColor) {
        stage.setBackgroundColor(deserializeColor(stageData.backgroundColor));
      }

      // Add actors to stage
      for (const actorId of stageData.actorIds) {
        const actor = actorMap.get(actorId);
        if (actor) {
          stage.addActor(actor);
        } else if (options.strict) {
          throw new Error(`Actor '${actorId}' not found`);
        }
      }

      project.addStage(stageData.id, stage, stageData.name);
    } catch (error) {
      if (options.strict) {
        throw new Error(`Failed to deserialize stage '${stageData.id}': ${error}`);
      } else {
        console.warn(`Skipping stage '${stageData.id}': ${error}`);
      }
    }
  }

  // Deserialize assets
  for (const asset of data.assets) {
    project.addAsset({ ...asset });
  }

  // Deserialize scripts
  for (const script of data.scripts) {
    project.addScript({ ...script });
  }

  // Apply scripts to actors
  applyScriptsToActors(data.scripts, actorMap, options);

  // Check for unresolved references
  if (context.hasUnresolvedReferences() && options.strict) {
    const unresolvedIds = context.getUnresolvedReferenceIds();
    throw new Error(`Unresolved references: ${unresolvedIds.join(', ')}`);
  }

  // Mark project as clean (no unsaved changes)
  project.markClean();

  return project;
}

/**
 * Deserialize an actor
 */
function deserializeActor(
  data: any,
  context: DeserializationContext,
  options: DeserializationOptions
): SK8Actor {
  const className = data.className;

  // Look up actor class
  const ActorClass = actorClassRegistry.get(className);
  if (!ActorClass) {
    throw new Error(`Unknown actor class: ${className}`);
  }

  // Create actor instance
  const actor = new ActorClass();
  actor.setName(data.name);

  // Restore properties
  for (const [propName, propData] of Object.entries(data.properties as any)) {
    try {
      const value = deserializePropertyValue(propData, context, options);

      // Set the property
      if (value !== undefined) {
        actor.set(propName, value);
      }
    } catch (error) {
      if (options.strict) {
        throw new Error(`Failed to restore property '${propName}': ${error}`);
      } else {
        console.warn(`Skipping property '${propName}' of actor '${data.name}': ${error}`);
      }
    }
  }

  // Restore handlers
  for (const [handlerName, handlerSource] of Object.entries(data.handlers || {})) {
    try {
      const handler = deserializeHandler(handlerSource as string) as HandlerFunction;
      actor.addHandler(handlerName, handler);
    } catch (error) {
      if (options.strict) {
        throw new Error(`Failed to restore handler '${handlerName}': ${error}`);
      } else {
        console.warn(`Skipping handler '${handlerName}' of actor '${data.name}': ${error}`);
      }
    }
  }

  return actor;
}

/**
 * Deserialize a property value
 */
function deserializePropertyValue(
  propData: any,
  context: DeserializationContext,
  options: DeserializationOptions
): any {
  if (!propData || typeof propData !== 'object') {
    return propData;
  }

  // Check for special property wrapper
  if ('value' in propData && 'type' in propData) {
    return deserializeTypedValue(propData.value, propData.type, context, options);
  }

  // Otherwise assume it's a direct value
  return deserializeValue(propData, context, options);
}

/**
 * Deserialize a typed value
 */
function deserializeTypedValue(
  value: any,
  type: string,
  context: DeserializationContext,
  options: DeserializationOptions
): any {
  switch (type) {
    case 'null':
    case 'string':
    case 'number':
    case 'boolean':
      return value;

    case 'array':
      return value.map((item: any) => deserializeValue(item, context, options));

    case 'object':
      return deserializeValue(value, context, options);

    case 'reference':
      // Return the referenced object
      const refObj = context.getObject(value);
      if (!refObj && options.strict) {
        throw new Error(`Reference '${value}' not found`);
      }
      return refObj || null;

    case 'gradient':
      return deserializeGradient(value);

    case 'function':
      return undefined; // Can't deserialize functions

    default:
      console.warn(`Unknown property type: ${type}`);
      return value;
  }
}

/**
 * Deserialize a value (handles nested objects and references)
 */
function deserializeValue(
  value: any,
  context: DeserializationContext,
  options: DeserializationOptions
): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  // Handle references
  if (value.$ref) {
    const refObj = context.getObject(value.$ref);
    if (!refObj && options.strict) {
      throw new Error(`Reference '${value.$ref}' not found`);
    }
    return refObj || null;
  }

  // Handle gradients
  if (value.$gradient) {
    return deserializeGradient(value.$gradient);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(item, context, options));
  }

  // Handle plain objects
  const result: any = {};
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      result[key] = deserializeValue(value[key], context, options);
    }
  }
  return result;
}

/**
 * Deserialize a color value
 */
function deserializeColor(color: any): any {
  if (!color) return null;

  // If it's an object with r,g,b properties, return as-is
  if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    return { ...color };
  }

  return color;
}

/**
 * Deserialize a gradient
 */
function deserializeGradient(data: any): Gradient {
  // Placeholder - would need full gradient data structure
  const type = data.type || 'LinearGradient';

  let gradient: Gradient;

  if (type === 'LinearGradient') {
    gradient = new LinearGradient(0, 0, 1, 0);
  } else {
    gradient = new RadialGradient(0.5, 0.5, 0, 0.5, 0.5, 0.5);
  }

  // Add default color stops
  gradient.addColorStop(0, { r: 0, g: 0, b: 0, a: 1 });
  gradient.addColorStop(1, { r: 255, g: 255, b: 255, a: 1 });

  return gradient;
}

/**
 * Deserialize a handler from source code
 */
function deserializeHandler(source: string): Function {
  // Parse and create function from source
  // This is potentially dangerous and should be sandboxed in production
  try {
    // eslint-disable-next-line no-new-func
    return new Function('return ' + source)();
  } catch (error) {
    throw new Error(`Failed to parse handler: ${error}`);
  }
}

/**
 * Apply scripts to actors
 */
function applyScriptsToActors(
  scripts: any[],
  actorMap: Map<string, SK8Actor>,
  options: DeserializationOptions
): void {
  for (const script of scripts) {
    const actor = actorMap.get(script.objectId);

    if (!actor) {
      if (options.strict) {
        throw new Error(`Actor '${script.objectId}' not found for script '${script.handlerName}'`);
      }
      continue;
    }

    try {
      const handler = deserializeHandler(script.source) as HandlerFunction;
      actor.addHandler(script.handlerName, handler);
    } catch (error) {
      if (options.strict) {
        throw new Error(
          `Failed to apply script '${script.handlerName}' to actor '${script.objectId}': ${error}`
        );
      } else {
        console.warn(
          `Skipping script '${script.handlerName}' for actor '${script.objectId}': ${error}`
        );
      }
    }
  }
}

/**
 * Validate deserialized project
 */
export function validateProject(project: SK8Project): boolean {
  // Check that all stages have valid actors
  for (const stageDef of project.getStages()) {
    for (const actorId of stageDef.actorIds) {
      if (!project.getActor(actorId)) {
        console.error(`Stage '${stageDef.id}' references missing actor '${actorId}'`);
        return false;
      }
    }
  }

  // Check that all scripts reference valid actors
  for (const script of project.getScripts()) {
    if (!project.getActor(script.objectId)) {
      console.error(`Script '${script.handlerName}' references missing actor '${script.objectId}'`);
      return false;
    }
  }

  return true;
}
