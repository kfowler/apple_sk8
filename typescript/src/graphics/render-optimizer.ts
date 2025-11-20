/**
 * Render Optimizer - Spatial indexing and render optimizations
 *
 * Implements:
 * - Quadtree spatial indexing for efficient hit testing
 * - Culling of off-screen actors
 * - Batching of similar draw operations
 * - Layer caching for static content
 */

import { SK8Actor } from './SK8Actor.js';
import { Rect, RectUtils } from './types.js';

/**
 * Quadtree node for spatial indexing
 */
class QuadTreeNode {
  private bounds: Rect;
  private capacity: number = 10;
  private actors: SK8Actor[] = [];
  private divided: boolean = false;
  private northwest?: QuadTreeNode;
  private northeast?: QuadTreeNode;
  private southwest?: QuadTreeNode;
  private southeast?: QuadTreeNode;

  constructor(bounds: Rect) {
    this.bounds = bounds;
  }

  /**
   * Insert an actor into the quadtree
   */
  insert(actor: SK8Actor): boolean {
    // Check if actor intersects with this node's bounds
    const actorBounds = actor.getBoundsRect();
    if (!RectUtils.intersects(this.bounds, actorBounds)) {
      return false;
    }

    // If we have capacity and haven't divided, add to this node
    if (this.actors.length < this.capacity && !this.divided) {
      this.actors.push(actor);
      return true;
    }

    // Otherwise, subdivide and insert into children
    if (!this.divided) {
      this.subdivide();
    }

    // Try to insert into children
    if (this.northwest!.insert(actor)) return true;
    if (this.northeast!.insert(actor)) return true;
    if (this.southwest!.insert(actor)) return true;
    if (this.southeast!.insert(actor)) return true;

    // If actor spans multiple quadrants, keep it at this level
    this.actors.push(actor);
    return true;
  }

  /**
   * Query actors that intersect with a rectangle
   */
  query(range: Rect, found: SK8Actor[] = []): SK8Actor[] {
    // If range doesn't intersect this node, return
    if (!RectUtils.intersects(this.bounds, range)) {
      return found;
    }

    // Check actors in this node
    for (const actor of this.actors) {
      const actorBounds = actor.getBoundsRect();
      if (RectUtils.intersects(actorBounds, range)) {
        found.push(actor);
      }
    }

    // If divided, query children
    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  /**
   * Find actor at a specific point
   */
  queryPoint(x: number, y: number): SK8Actor | null {
    // If point is not in bounds, return null
    if (!RectUtils.contains(this.bounds, x, y)) {
      return null;
    }

    // Check actors in this node (in reverse order for front-to-back)
    for (let i = this.actors.length - 1; i >= 0; i--) {
      const actor = this.actors[i];
      if (actor.getVisible() && actor.containsPoint(x, y)) {
        return actor;
      }
    }

    // If divided, query children
    if (this.divided) {
      let result: SK8Actor | null = null;
      result = this.northwest!.queryPoint(x, y);
      if (result) return result;
      result = this.northeast!.queryPoint(x, y);
      if (result) return result;
      result = this.southwest!.queryPoint(x, y);
      if (result) return result;
      result = this.southeast!.queryPoint(x, y);
      if (result) return result;
    }

    return null;
  }

  /**
   * Subdivide this node into four children
   */
  private subdivide(): void {
    const x = this.bounds.left;
    const y = this.bounds.top;
    const w = RectUtils.width(this.bounds);
    const h = RectUtils.height(this.bounds);
    const hw = w / 2;
    const hh = h / 2;

    this.northwest = new QuadTreeNode({
      left: x,
      top: y,
      right: x + hw,
      bottom: y + hh,
    });

    this.northeast = new QuadTreeNode({
      left: x + hw,
      top: y,
      right: x + w,
      bottom: y + hh,
    });

    this.southwest = new QuadTreeNode({
      left: x,
      top: y + hh,
      right: x + hw,
      bottom: y + h,
    });

    this.southeast = new QuadTreeNode({
      left: x + hw,
      top: y + hh,
      right: x + w,
      bottom: y + h,
    });

    this.divided = true;
  }

  /**
   * Clear the quadtree
   */
  clear(): void {
    this.actors = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }
}

/**
 * Spatial index using quadtree
 */
export class SpatialIndex {
  private root: QuadTreeNode;
  private bounds: Rect;

  constructor(bounds: Rect) {
    this.bounds = bounds;
    this.root = new QuadTreeNode(bounds);
  }

  /**
   * Rebuild the index with current actors
   */
  rebuild(actors: SK8Actor[]): void {
    this.root.clear();
    this.root = new QuadTreeNode(this.bounds);

    for (const actor of actors) {
      if (actor.getVisible()) {
        this.root.insert(actor);
      }
    }
  }

  /**
   * Query actors in a region
   */
  query(region: Rect): SK8Actor[] {
    return this.root.query(region);
  }

  /**
   * Find actor at point
   */
  actorAtPoint(x: number, y: number): SK8Actor | null {
    return this.root.queryPoint(x, y);
  }

  /**
   * Update bounds
   */
  setBounds(bounds: Rect): void {
    this.bounds = bounds;
  }
}

/**
 * Render batch for grouping similar draw operations
 */
export interface RenderBatch {
  actors: SK8Actor[];
  type: 'fill' | 'stroke' | 'text' | 'image' | 'mixed';
  canBatch: boolean;
}

/**
 * Layer for caching static content
 */
export class RenderLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  actors: SK8Actor[] = [];
  dirty: boolean = true;

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Mark layer as dirty (needs redraw)
   */
  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Check if layer needs redraw
   */
  isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Render all actors in this layer
   */
  render(): void {
    if (!this.dirty) return;

    // Clear layer
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all actors
    for (const actor of this.actors) {
      if (actor.getVisible()) {
        this.ctx.save();
        const transform = actor.getTransformMatrix?.();
        if (transform) {
          this.ctx.transform(
            transform.a,
            transform.b,
            transform.c,
            transform.d,
            transform.e,
            transform.f
          );
        }
        actor.render(this.ctx);
        this.ctx.restore();
      }
    }

    this.dirty = false;
  }

  /**
   * Resize layer
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.dirty = true;
  }
}

/**
 * Render optimizer with all optimizations
 */
export class RenderOptimizer {
  private spatialIndex?: SpatialIndex;
  private layers: Map<string, RenderLayer> = new Map();
  private useSpatialIndex: boolean = true;
  private useLayers: boolean = false;
  private frustumCulling: boolean = true;

  // Statistics
  private stats = {
    totalActors: 0,
    culledActors: 0,
    renderedActors: 0,
    batchesSaved: 0,
    spatialQueries: 0,
  };

  constructor(bounds?: Rect) {
    if (bounds) {
      this.spatialIndex = new SpatialIndex(bounds);
    }
  }

  /**
   * Enable/disable spatial indexing
   */
  setUseSpatialIndex(enabled: boolean): void {
    this.useSpatialIndex = enabled;
  }

  /**
   * Enable/disable layer caching
   */
  setUseLayers(enabled: boolean): void {
    this.useLayers = enabled;
  }

  /**
   * Enable/disable frustum culling
   */
  setFrustumCulling(enabled: boolean): void {
    this.frustumCulling = enabled;
  }

  /**
   * Rebuild spatial index
   */
  rebuildSpatialIndex(actors: SK8Actor[]): void {
    if (this.spatialIndex && this.useSpatialIndex) {
      this.spatialIndex.rebuild(actors);
    }
  }

  /**
   * Cull actors outside viewport
   */
  cullActors(actors: SK8Actor[], viewport: Rect): SK8Actor[] {
    if (!this.frustumCulling) {
      this.stats.renderedActors = actors.length;
      return actors;
    }

    this.stats.totalActors = actors.length;
    const visible: SK8Actor[] = [];

    for (const actor of actors) {
      if (!actor.getVisible()) {
        this.stats.culledActors++;
        continue;
      }

      const bounds = actor.getBoundsRect();
      if (RectUtils.intersects(bounds, viewport)) {
        visible.push(actor);
      } else {
        this.stats.culledActors++;
      }
    }

    this.stats.renderedActors = visible.length;
    return visible;
  }

  /**
   * Find actor at point using spatial index
   */
  actorAtPoint(actors: SK8Actor[], x: number, y: number): SK8Actor | null {
    if (this.spatialIndex && this.useSpatialIndex) {
      this.stats.spatialQueries++;
      return this.spatialIndex.actorAtPoint(x, y);
    }

    // Fallback to linear search
    for (let i = actors.length - 1; i >= 0; i--) {
      const actor = actors[i];
      if (actor.getVisible() && actor.containsPoint(x, y)) {
        return actor;
      }
    }

    return null;
  }

  /**
   * Query actors in region using spatial index
   */
  queryRegion(actors: SK8Actor[], region: Rect): SK8Actor[] {
    if (this.spatialIndex && this.useSpatialIndex) {
      this.stats.spatialQueries++;
      return this.spatialIndex.query(region);
    }

    // Fallback to linear search
    const found: SK8Actor[] = [];
    for (const actor of actors) {
      if (actor.getVisible()) {
        const bounds = actor.getBoundsRect();
        if (RectUtils.intersects(bounds, region)) {
          found.push(actor);
        }
      }
    }

    return found;
  }

  /**
   * Create or get a render layer
   */
  getLayer(name: string, width: number, height: number): RenderLayer {
    if (!this.layers.has(name)) {
      this.layers.set(name, new RenderLayer(width, height));
    }
    return this.layers.get(name)!;
  }

  /**
   * Mark a layer as dirty
   */
  markLayerDirty(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.markDirty();
    }
  }

  /**
   * Batch similar actors for optimized rendering
   */
  batchActors(actors: SK8Actor[]): RenderBatch[] {
    // Simple batching strategy: group consecutive actors with similar properties
    const batches: RenderBatch[] = [];
    let currentBatch: RenderBatch | null = null;

    for (const actor of actors) {
      // For now, we don't batch - just create individual batches
      // Future: group actors with same fillColor, no transforms, etc.
      batches.push({
        actors: [actor],
        type: 'mixed',
        canBatch: false,
      });
    }

    return batches;
  }

  /**
   * Get optimization statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalActors: 0,
      culledActors: 0,
      renderedActors: 0,
      batchesSaved: 0,
      spatialQueries: 0,
    };
  }
}
