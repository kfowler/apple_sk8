/**
 * SK8Project - Represents a complete SK8 project
 *
 * A project contains stages, actors, assets, and scripts.
 * This is the top-level container for all SK8 content.
 */

import { SK8Stage } from '../graphics/SK8Stage.js';
import { SK8Actor } from '../graphics/SK8Actor.js';

/**
 * Metadata for a project
 */
export interface ProjectMetadata {
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Author name */
  author?: string;
  /** Creation date */
  created: string;
  /** Last modified date */
  modified: string;
  /** Project version */
  version: string;
  /** SK8 version used to create this project */
  sk8Version: string;
  /** Custom metadata fields */
  [key: string]: any;
}

/**
 * Asset reference in a project
 */
export interface ProjectAsset {
  /** Unique asset ID */
  id: string;
  /** Asset type (image, sound, video, etc.) */
  type: string;
  /** Asset name */
  name: string;
  /** Asset URL or data URI */
  url: string;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Script/handler definition in a project
 */
export interface ProjectScript {
  /** Object ID this script belongs to */
  objectId: string;
  /** Handler name */
  handlerName: string;
  /** Handler source code */
  source: string;
  /** Handler parameters */
  parameters?: string[];
}

/**
 * Stage definition in a project
 */
export interface StageDefinition {
  /** Stage ID */
  id: string;
  /** Stage name */
  name: string;
  /** Stage reference (runtime) */
  stage?: SK8Stage;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Background color */
  backgroundColor?: any;
  /** Actors on this stage */
  actorIds: string[];
}

/**
 * SK8Project - Complete SK8 project container
 */
export class SK8Project {
  private metadata: ProjectMetadata;
  private stages = new Map<string, StageDefinition>();
  private actors = new Map<string, SK8Actor>();
  private assets = new Map<string, ProjectAsset>();
  private scripts: ProjectScript[] = [];
  private isDirty: boolean = false;

  constructor(name: string, version: string = '1.0.0') {
    const now = new Date().toISOString();
    this.metadata = {
      name,
      version,
      created: now,
      modified: now,
      sk8Version: '0.3.0', // Current SK8 version
    };
  }

  /**
   * Get project metadata
   */
  getMetadata(): ProjectMetadata {
    return { ...this.metadata };
  }

  /**
   * Set metadata field
   */
  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updateModified();
  }

  /**
   * Update all metadata
   */
  updateMetadata(metadata: Partial<ProjectMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updateModified();
  }

  /**
   * Update modified timestamp
   */
  private updateModified(): void {
    this.metadata.modified = new Date().toISOString();
    this.isDirty = true;
  }

  /**
   * Get project name
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * Set project name
   */
  setName(name: string): void {
    this.metadata.name = name;
    this.updateModified();
  }

  /**
   * Get project version
   */
  getVersion(): string {
    return this.metadata.version;
  }

  /**
   * Set project version
   */
  setVersion(version: string): void {
    this.metadata.version = version;
    this.updateModified();
  }

  /**
   * Add a stage to the project
   */
  addStage(id: string, stage: SK8Stage, name?: string): void {
    const stageDef: StageDefinition = {
      id,
      name: name || id,
      stage,
      width: stage.getWidth(),
      height: stage.getHeight(),
      backgroundColor: stage.getBackgroundColor(),
      actorIds: [],
    };

    // Register all actors from the stage
    const actors = stage.getActors();
    for (const actor of actors) {
      const actorId = this.generateActorId(actor);
      this.actors.set(actorId, actor);
      stageDef.actorIds.push(actorId);
    }

    this.stages.set(id, stageDef);
    this.updateModified();
  }

  /**
   * Remove a stage from the project
   */
  removeStage(id: string): void {
    const stageDef = this.stages.get(id);
    if (stageDef) {
      // Remove all actors from this stage
      for (const actorId of stageDef.actorIds) {
        this.actors.delete(actorId);
      }
      this.stages.delete(id);
      this.updateModified();
    }
  }

  /**
   * Get a stage by ID
   */
  getStage(id: string): StageDefinition | undefined {
    return this.stages.get(id);
  }

  /**
   * Get all stages
   */
  getStages(): StageDefinition[] {
    return Array.from(this.stages.values());
  }

  /**
   * Get all stage IDs
   */
  getStageIds(): string[] {
    return Array.from(this.stages.keys());
  }

  /**
   * Add an actor to the project
   */
  addActor(id: string, actor: SK8Actor): void {
    this.actors.set(id, actor);
    this.updateModified();
  }

  /**
   * Remove an actor from the project
   */
  removeActor(id: string): void {
    this.actors.delete(id);
    // Remove from any stages
    for (const stageDef of this.stages.values()) {
      const index = stageDef.actorIds.indexOf(id);
      if (index !== -1) {
        stageDef.actorIds.splice(index, 1);
      }
    }
    this.updateModified();
  }

  /**
   * Get an actor by ID
   */
  getActor(id: string): SK8Actor | undefined {
    return this.actors.get(id);
  }

  /**
   * Get all actors
   */
  getActors(): Map<string, SK8Actor> {
    return new Map(this.actors);
  }

  /**
   * Get all actor IDs
   */
  getActorIds(): string[] {
    return Array.from(this.actors.keys());
  }

  /**
   * Add an asset to the project
   */
  addAsset(asset: ProjectAsset): void {
    this.assets.set(asset.id, asset);
    this.updateModified();
  }

  /**
   * Remove an asset from the project
   */
  removeAsset(id: string): void {
    this.assets.delete(id);
    this.updateModified();
  }

  /**
   * Get an asset by ID
   */
  getAsset(id: string): ProjectAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get all assets
   */
  getAssets(): ProjectAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Add a script/handler to the project
   */
  addScript(script: ProjectScript): void {
    this.scripts.push(script);
    this.updateModified();
  }

  /**
   * Remove scripts for an object
   */
  removeScripts(objectId: string): void {
    this.scripts = this.scripts.filter((s) => s.objectId !== objectId);
    this.updateModified();
  }

  /**
   * Get all scripts for an object
   */
  getScripts(objectId?: string): ProjectScript[] {
    if (objectId) {
      return this.scripts.filter((s) => s.objectId === objectId);
    }
    return [...this.scripts];
  }

  /**
   * Check if project has unsaved changes
   */
  isDirtyState(): boolean {
    return this.isDirty;
  }

  /**
   * Mark project as saved (clean)
   */
  markClean(): void {
    this.isDirty = false;
  }

  /**
   * Mark project as dirty (has unsaved changes)
   */
  markDirty(): void {
    this.isDirty = true;
    this.updateModified();
  }

  /**
   * Generate a unique ID for an actor
   */
  private generateActorId(actor: SK8Actor): string {
    const name = actor.getName();
    const baseId = name.replace(/[^a-zA-Z0-9]/g, '_');
    let id = baseId;
    let counter = 1;

    // Ensure uniqueness
    while (this.actors.has(id)) {
      id = `${baseId}_${counter}`;
      counter++;
    }

    return id;
  }

  /**
   * Clear all project content
   */
  clear(): void {
    this.stages.clear();
    this.actors.clear();
    this.assets.clear();
    this.scripts = [];
    this.updateModified();
  }

  /**
   * Get project statistics
   */
  getStats(): {
    stageCount: number;
    actorCount: number;
    assetCount: number;
    scriptCount: number;
  } {
    return {
      stageCount: this.stages.size,
      actorCount: this.actors.size,
      assetCount: this.assets.size,
      scriptCount: this.scripts.length,
    };
  }

  /**
   * Clone this project
   */
  clone(newName?: string): SK8Project {
    const cloned = new SK8Project(newName || `${this.metadata.name} Copy`, this.metadata.version);
    cloned.metadata = { ...this.metadata, created: new Date().toISOString() };
    if (newName) {
      cloned.metadata.name = newName;
    }

    // Clone stages, actors, assets, scripts
    // Note: This is a shallow clone for now
    this.stages.forEach((stageDef, id) => {
      cloned.stages.set(id, { ...stageDef });
    });

    this.actors.forEach((actor, id) => {
      cloned.actors.set(id, actor);
    });

    this.assets.forEach((asset, id) => {
      cloned.assets.set(id, { ...asset });
    });

    cloned.scripts = this.scripts.map((s) => ({ ...s }));

    return cloned;
  }

  /**
   * String representation
   */
  toString(): string {
    const stats = this.getStats();
    return `SK8Project "${this.metadata.name}" v${this.metadata.version} (${stats.stageCount} stages, ${stats.actorCount} actors)`;
  }
}

/**
 * Create a new empty project
 */
export function createProject(name: string, version?: string): SK8Project {
  return new SK8Project(name, version);
}

/**
 * Create a project from a template
 */
export function createProjectFromTemplate(template: 'empty' | 'basic' | 'demo'): SK8Project {
  switch (template) {
    case 'empty':
      return new SK8Project('Untitled Project');

    case 'basic':
      const basic = new SK8Project('Basic Project');
      basic.setMetadata('description', 'A basic SK8 project with one stage');
      return basic;

    case 'demo':
      const demo = new SK8Project('Demo Project');
      demo.setMetadata('description', 'A demonstration project showing SK8 features');
      return demo;

    default:
      return new SK8Project('Untitled Project');
  }
}
