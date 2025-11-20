/**
 * SK8 Project Serializer
 *
 * Converts SK8 projects to JSON format, handling:
 * - Object references and IDs
 * - Circular dependencies
 * - Property serialization
 * - Handler source code extraction
 */

import { SK8Project, ProjectMetadata, ProjectAsset, ProjectScript } from './project.js';
import { SK8Actor } from '../graphics/SK8Actor.js';
import { SK8Object } from '../core/SK8Object.js';
import { Gradient } from '../graphics/gradients.js';

/**
 * Serialized property value
 */
interface SerializedProperty {
  value?: any;
  hasGetter?: boolean;
  hasSetter?: boolean;
  computed?: boolean;
  propagate?: boolean;
  metadata?: any;
  type?: string; // For special types like gradients, references, etc.
}

/**
 * Serialized actor definition
 */
interface SerializedActor {
  id: string;
  className: string;
  name: string;
  properties: Record<string, SerializedProperty>;
  handlers: Record<string, string>;
  parentId?: string;
}

/**
 * Serialized stage definition
 */
interface SerializedStage {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: any;
  actorIds: string[];
}

/**
 * Complete serialized project format
 */
export interface SerializedProject {
  /** File format version */
  formatVersion: string;
  /** Project metadata */
  metadata: ProjectMetadata;
  /** Stages */
  stages: SerializedStage[];
  /** Actors (flat list with references) */
  actors: SerializedActor[];
  /** Assets */
  assets: ProjectAsset[];
  /** Scripts */
  scripts: ProjectScript[];
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  /** Pretty print JSON */
  prettyPrint?: boolean;
  /** Include computed properties */
  includeComputed?: boolean;
  /** Include metadata */
  includeMetadata?: boolean;
  /** Indent size for pretty printing */
  indent?: number;
}

/**
 * Serialization context for tracking references
 */
class SerializationContext {
  private objectIds = new WeakMap<object, string>();
  private idCounter = 0;

  /**
   * Get or create an ID for an object
   */
  getObjectId(obj: object, prefix: string = 'obj'): string {
    if (this.objectIds.has(obj)) {
      return this.objectIds.get(obj)!;
    }

    const id = `${prefix}_${this.idCounter++}`;
    this.objectIds.set(obj, id);
    return id;
  }

  /**
   * Check if object has been assigned an ID
   */
  hasObjectId(obj: object): boolean {
    return this.objectIds.has(obj);
  }
}

/**
 * Serialize an SK8 project to JSON
 */
export function serializeProject(
  project: SK8Project,
  options: SerializationOptions = {}
): string {
  const serialized = serializeProjectToObject(project, options);

  const indent = options.prettyPrint ? options.indent || 2 : undefined;
  return JSON.stringify(serialized, null, indent);
}

/**
 * Serialize project to object (not JSON string)
 */
export function serializeProjectToObject(
  project: SK8Project,
  options: SerializationOptions = {}
): SerializedProject {
  const context = new SerializationContext();

  // Serialize stages
  const stages: SerializedStage[] = project.getStages().map((stageDef) => ({
    id: stageDef.id,
    name: stageDef.name,
    width: stageDef.width,
    height: stageDef.height,
    backgroundColor: serializeColor(stageDef.backgroundColor),
    actorIds: [...stageDef.actorIds],
  }));

  // Serialize actors
  const actors: SerializedActor[] = [];
  const actorMap = project.getActors();

  for (const [id, actor] of actorMap) {
    actors.push(serializeActor(actor, id, context, options));
  }

  // Serialize assets (with enhanced metadata if available)
  const assets = project.getAssets().map((asset) => ({ ...asset }));

  // Serialize scripts
  const scripts = project.getScripts().map((script) => ({ ...script }));

  return {
    formatVersion: '1.0.0',
    metadata: project.getMetadata(),
    stages,
    actors,
    assets,
    scripts,
  };
}

/**
 * Serialize an actor
 */
function serializeActor(
  actor: SK8Actor,
  id: string,
  context: SerializationContext,
  options: SerializationOptions
): SerializedActor {
  const className = actor.constructor.name;
  const name = actor.getName();

  // Serialize properties
  const properties: Record<string, SerializedProperty> = {};
  const propertyNames = actor.getOwnPropertyNames();

  for (const propName of propertyNames) {
    try {
      const value = actor.get(propName);
      const metadata = options.includeMetadata ? actor.getPropertyMetadata(propName) : undefined;

      properties[propName] = serializeProperty(value, metadata, context);
    } catch (error) {
      // Skip properties that can't be read
      console.warn(`Could not serialize property '${propName}' of actor '${name}'`, error);
    }
  }

  // Extract handlers
  const handlers: Record<string, string> = {};
  // Note: We'd need to add a method to SK8Object to enumerate handlers
  // For now, this is a placeholder

  // Get parent reference if any
  const parent = actor.getParent();
  const parentId = parent && context.hasObjectId(parent) ? context.getObjectId(parent) : undefined;

  return {
    id,
    className,
    name,
    properties,
    handlers,
    parentId,
  };
}

/**
 * Serialize a property value
 */
function serializeProperty(
  value: any,
  metadata: any,
  context: SerializationContext
): SerializedProperty {
  const result: SerializedProperty = {
    metadata,
  };

  // Handle null/undefined
  if (value === null || value === undefined) {
    result.value = value;
    result.type = 'null';
    return result;
  }

  // Handle primitives
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    result.value = value;
    result.type = typeof value;
    return result;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    result.value = value.map((item) => serializePropertyValue(item, context));
    result.type = 'array';
    return result;
  }

  // Handle special objects
  if (value instanceof Gradient) {
    result.value = serializeGradient(value);
    result.type = 'gradient';
    return result;
  }

  if (value instanceof SK8Object) {
    // Store reference to another object
    result.value = context.getObjectId(value);
    result.type = 'reference';
    return result;
  }

  // Handle plain objects (like Color, Rect, Point)
  if (typeof value === 'object') {
    result.value = serializeObjectValue(value, context);
    result.type = 'object';
    return result;
  }

  // Function (shouldn't normally serialize these)
  if (typeof value === 'function') {
    result.type = 'function';
    result.value = '<function>';
    return result;
  }

  // Default
  result.value = String(value);
  result.type = 'unknown';
  return result;
}

/**
 * Serialize a property value (helper)
 */
function serializePropertyValue(value: any, context: SerializationContext): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePropertyValue(item, context));
  }

  if (value instanceof SK8Object) {
    return { $ref: context.getObjectId(value) };
  }

  if (value instanceof Gradient) {
    return { $gradient: serializeGradient(value) };
  }

  if (typeof value === 'object') {
    return serializeObjectValue(value, context);
  }

  return value;
}

/**
 * Serialize a plain object value
 */
function serializeObjectValue(_obj: any, context: SerializationContext): any {
  const result: any = {};

  // Handle circular references
  if (context.hasObjectId(_obj)) {
    return { $ref: context.getObjectId(_obj) };
  }

  // Temporarily mark this object to detect circular refs
  context.getObjectId(_obj, 'temp');

  for (const key in _obj) {
    if (_obj.hasOwnProperty(key)) {
      try {
        result[key] = serializePropertyValue(_obj[key], context);
      } catch (error) {
        // Skip properties that can't be serialized
        console.warn(`Could not serialize property '${key}'`, error);
      }
    }
  }

  return result;
}

/**
 * Serialize a color value
 */
function serializeColor(color: any): any {
  if (!color) return null;

  // If it's already a plain object with r,g,b properties, return as-is
  if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    return { ...color };
  }

  return color;
}

/**
 * Serialize a gradient
 */
function serializeGradient(gradient: Gradient): any {
  // Access gradient internals - this assumes Gradient class has appropriate accessors
  // For now, return a placeholder
  return {
    type: gradient.constructor.name,
    // We'd need methods on Gradient to export its stops and configuration
  };
}

/**
 * Serialize handler function to source code
 */
export function serializeHandler(handler: Function): string {
  return handler.toString();
}

/**
 * Extract all handlers from an SK8Object
 */
export function extractHandlers(_obj: SK8Object): Record<string, string> {
  const handlers: Record<string, string> = {};

  // This would require adding a method to SK8Object to enumerate handlers
  // For now, return empty object
  // TODO: Add getHandlerNames() method to SK8Object

  return handlers;
}

/**
 * Validate serialized project structure
 */
export function validateSerializedProject(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields
  if (!data.formatVersion || !data.metadata || !data.stages || !data.actors) {
    return false;
  }

  // Check format version
  if (!data.formatVersion.startsWith('1.')) {
    console.warn(`Unsupported format version: ${data.formatVersion}`);
    return false;
  }

  // Check metadata
  if (!data.metadata.name || !data.metadata.version || !data.metadata.created) {
    return false;
  }

  return true;
}
