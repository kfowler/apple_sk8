/**
 * SK8Stage - Canvas manager and container for actors
 *
 * In SK8, a Stage is like a window that contains actors.
 * This implementation uses an HTML canvas element.
 */

import { SK8Object } from '../core/SK8Object.js';
import { SK8Actor } from './SK8Actor.js';
import { Color, ColorUtils } from './types.js';

export class SK8Stage extends SK8Object {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private actors: SK8Actor[] = [];
  private backgroundColor: Color = ColorUtils.White;
  private needsRender: boolean = true;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement | string, name?: string) {
    super(undefined, name || 'Stage');

    // Get canvas element
    if (typeof canvas === 'string') {
      const element = document.getElementById(canvas) as HTMLCanvasElement;
      if (!element) {
        throw new Error(`Canvas element '${canvas}' not found`);
      }
      this.canvas = element;
    } else {
      this.canvas = canvas;
    }

    // Get 2D context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Set up event listeners
    this.setupEventListeners();

    // Define properties
    this.defineProperty('backgroundColor', {
      getter: () => this.getBackgroundColor(),
      setter: (value: Color) => this.setBackgroundColor(value)
    });
  }

  // Background color

  getBackgroundColor(): Color {
    return this.backgroundColor;
  }

  setBackgroundColor(color: Color): void {
    this.backgroundColor = color;
    this.setNeedsRender();
  }

  // Actor management

  addActor(actor: SK8Actor): void {
    if (!this.actors.includes(actor)) {
      this.actors.push(actor);
      this.setNeedsRender();
    }
  }

  removeActor(actor: SK8Actor): void {
    const index = this.actors.indexOf(actor);
    if (index !== -1) {
      this.actors.splice(index, 1);
      this.setNeedsRender();
    }
  }

  getActors(): SK8Actor[] {
    return [...this.actors];
  }

  clearActors(): void {
    this.actors = [];
    this.setNeedsRender();
  }

  // Z-order management

  bringToFront(actor: SK8Actor): void {
    this.removeActor(actor);
    this.actors.push(actor);
    this.setNeedsRender();
  }

  sendToBack(actor: SK8Actor): void {
    this.removeActor(actor);
    this.actors.unshift(actor);
    this.setNeedsRender();
  }

  // Hit testing

  actorAtPoint(x: number, y: number): SK8Actor | null {
    // Check actors in reverse order (front to back)
    for (let i = this.actors.length - 1; i >= 0; i--) {
      const actor = this.actors[i];
      if (actor.getVisible() && actor.containsPoint(x, y)) {
        return actor;
      }
    }
    return null;
  }

  // Rendering

  setNeedsRender(): void {
    this.needsRender = true;
  }

  render(): void {
    // Clear canvas
    this.ctx.fillStyle = ColorUtils.toCSS(this.backgroundColor);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all actors
    for (const actor of this.actors) {
      if (actor.getVisible()) {
        this.ctx.save();
        actor.render(this.ctx);
        this.ctx.restore();
      }
    }

    this.needsRender = false;
  }

  // Animation loop

  startRendering(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    const renderLoop = () => {
      if (this.needsRender) {
        this.render();
      }
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  stopRendering(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Event handling

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private handleClick(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);
    if (actor) {
      actor.onClick(pos.x, pos.y);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);
    if (actor) {
      actor.onMouseDown(pos.x, pos.y);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);
    if (actor) {
      actor.onMouseUp(pos.x, pos.y);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const actor = this.actorAtPoint(pos.x, pos.y);
    if (actor) {
      actor.onMouseMove(pos.x, pos.y);
    }
  }

  // Canvas properties

  getWidth(): number {
    return this.canvas.width;
  }

  getHeight(): number {
    return this.canvas.height;
  }

  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.setNeedsRender();
  }

  // Cleanup

  destroy(): void {
    this.stopRendering();
    this.clearActors();
  }
}
