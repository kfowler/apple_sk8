/**
 * SK8Path - A path shape supporting SVG-style path commands
 *
 * Supports common SVG path commands:
 * - M/m: Move to (absolute/relative)
 * - L/l: Line to (absolute/relative)
 * - H/h: Horizontal line (absolute/relative)
 * - V/v: Vertical line (absolute/relative)
 * - C/c: Cubic Bezier curve (absolute/relative)
 * - Q/q: Quadratic Bezier curve (absolute/relative)
 * - A/a: Arc (absolute/relative)
 * - Z/z: Close path
 */

import { SK8Actor } from '../graphics/SK8Actor.js';

export interface PathCommand {
  command: string;
  params: number[];
}

export class SK8Path extends SK8Actor {
  private pathData: string = '';
  private commands: PathCommand[] = [];
  private closed: boolean = false;

  constructor(parent?: SK8Actor, name?: string) {
    super(parent, name || 'Path');

    this.defineProperty('pathData', {
      getter: () => this.getPathData(),
      setter: (value: string) => this.setPathData(value),
    });

    this.defineProperty('closed', {
      getter: () => this.getClosed(),
    });
  }

  getPathData(): string {
    return this.pathData;
  }

  setPathData(data: string): void {
    this.pathData = data;
    this.parsePathData(data);
    this.updateBoundsFromPath();
    this.setNeedsDraw();
  }

  /**
   * Set path from command array
   */
  setCommands(commands: PathCommand[]): void {
    this.commands = commands;
    this.pathData = this.commandsToString(commands);
    this.updateBoundsFromPath();
    this.setNeedsDraw();
  }

  getCommands(): PathCommand[] {
    return [...this.commands];
  }

  getClosed(): boolean {
    return this.closed;
  }

  /**
   * Parse SVG path data string into commands
   */
  private parsePathData(data: string): void {
    this.commands = [];
    this.closed = false;

    // Remove extra whitespace and normalize
    data = data.trim().replace(/\s+/g, ' ');

    // Split into commands
    const commandRegex = /([MLHVCQAZmlhvcqaz])\s*([^MLHVCQAZmlhvcqaz]*)/gi;
    let match;

    while ((match = commandRegex.exec(data)) !== null) {
      const command = match[1];
      const paramsStr = match[2].trim();

      // Parse parameters
      const params = paramsStr
        ? paramsStr.split(/[\s,]+/).map((p) => parseFloat(p)).filter((n) => !isNaN(n))
        : [];

      this.commands.push({ command, params });

      if (command.toUpperCase() === 'Z') {
        this.closed = true;
      }
    }
  }

  /**
   * Convert commands back to string
   */
  private commandsToString(commands: PathCommand[]): string {
    return commands.map((cmd) => `${cmd.command}${cmd.params.join(',')}`).join(' ');
  }

  /**
   * Update bounds based on path commands
   */
  private updateBoundsFromPath(): void {
    if (this.commands.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    const updateBounds = (x: number, y: number) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };

    for (const cmd of this.commands) {
      const { command, params } = cmd;
      const isRelative = command === command.toLowerCase();

      switch (command.toUpperCase()) {
        case 'M': // Move to
          if (isRelative) {
            currentX += params[0] || 0;
            currentY += params[1] || 0;
          } else {
            currentX = params[0] || 0;
            currentY = params[1] || 0;
          }
          startX = currentX;
          startY = currentY;
          updateBounds(currentX, currentY);
          break;

        case 'L': // Line to
          if (isRelative) {
            currentX += params[0] || 0;
            currentY += params[1] || 0;
          } else {
            currentX = params[0] || 0;
            currentY = params[1] || 0;
          }
          updateBounds(currentX, currentY);
          break;

        case 'H': // Horizontal line
          if (isRelative) {
            currentX += params[0] || 0;
          } else {
            currentX = params[0] || 0;
          }
          updateBounds(currentX, currentY);
          break;

        case 'V': // Vertical line
          if (isRelative) {
            currentY += params[0] || 0;
          } else {
            currentY = params[0] || 0;
          }
          updateBounds(currentX, currentY);
          break;

        case 'C': // Cubic Bezier
          if (isRelative) {
            updateBounds(currentX + (params[0] || 0), currentY + (params[1] || 0));
            updateBounds(currentX + (params[2] || 0), currentY + (params[3] || 0));
            currentX += params[4] || 0;
            currentY += params[5] || 0;
          } else {
            updateBounds(params[0] || 0, params[1] || 0);
            updateBounds(params[2] || 0, params[3] || 0);
            currentX = params[4] || 0;
            currentY = params[5] || 0;
          }
          updateBounds(currentX, currentY);
          break;

        case 'Q': // Quadratic Bezier
          if (isRelative) {
            updateBounds(currentX + (params[0] || 0), currentY + (params[1] || 0));
            currentX += params[2] || 0;
            currentY += params[3] || 0;
          } else {
            updateBounds(params[0] || 0, params[1] || 0);
            currentX = params[2] || 0;
            currentY = params[3] || 0;
          }
          updateBounds(currentX, currentY);
          break;

        case 'A': // Arc - approximate bounds
          if (isRelative) {
            currentX += params[5] || 0;
            currentY += params[6] || 0;
          } else {
            currentX = params[5] || 0;
            currentY = params[6] || 0;
          }
          // Approximate arc bounds with radius
          const rx = params[0] || 0;
          const ry = params[1] || 0;
          updateBounds(currentX - rx, currentY - ry);
          updateBounds(currentX + rx, currentY + ry);
          break;

        case 'Z': // Close path
          currentX = startX;
          currentY = startY;
          break;
      }
    }

    // Add padding
    const padding = 2;
    this.setBoundsRect({
      left: minX - padding,
      top: minY - padding,
      right: maxX + padding,
      bottom: maxY + padding,
    });
  }

  /**
   * Execute path commands on a canvas context
   */
  private executePath(ctx: CanvasRenderingContext2D): void {
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;

    ctx.beginPath();

    for (const cmd of this.commands) {
      const { command, params } = cmd;
      const isRelative = command === command.toLowerCase();

      switch (command.toUpperCase()) {
        case 'M': // Move to
          if (isRelative) {
            currentX += params[0] || 0;
            currentY += params[1] || 0;
          } else {
            currentX = params[0] || 0;
            currentY = params[1] || 0;
          }
          startX = currentX;
          startY = currentY;
          ctx.moveTo(currentX, currentY);
          break;

        case 'L': // Line to
          if (isRelative) {
            currentX += params[0] || 0;
            currentY += params[1] || 0;
          } else {
            currentX = params[0] || 0;
            currentY = params[1] || 0;
          }
          ctx.lineTo(currentX, currentY);
          break;

        case 'H': // Horizontal line
          if (isRelative) {
            currentX += params[0] || 0;
          } else {
            currentX = params[0] || 0;
          }
          ctx.lineTo(currentX, currentY);
          break;

        case 'V': // Vertical line
          if (isRelative) {
            currentY += params[0] || 0;
          } else {
            currentY = params[0] || 0;
          }
          ctx.lineTo(currentX, currentY);
          break;

        case 'C': // Cubic Bezier
          if (isRelative) {
            ctx.bezierCurveTo(
              currentX + (params[0] || 0),
              currentY + (params[1] || 0),
              currentX + (params[2] || 0),
              currentY + (params[3] || 0),
              currentX + (params[4] || 0),
              currentY + (params[5] || 0)
            );
            currentX += params[4] || 0;
            currentY += params[5] || 0;
          } else {
            ctx.bezierCurveTo(
              params[0] || 0,
              params[1] || 0,
              params[2] || 0,
              params[3] || 0,
              params[4] || 0,
              params[5] || 0
            );
            currentX = params[4] || 0;
            currentY = params[5] || 0;
          }
          break;

        case 'Q': // Quadratic Bezier
          if (isRelative) {
            ctx.quadraticCurveTo(
              currentX + (params[0] || 0),
              currentY + (params[1] || 0),
              currentX + (params[2] || 0),
              currentY + (params[3] || 0)
            );
            currentX += params[2] || 0;
            currentY += params[3] || 0;
          } else {
            ctx.quadraticCurveTo(
              params[0] || 0,
              params[1] || 0,
              params[2] || 0,
              params[3] || 0
            );
            currentX = params[2] || 0;
            currentY = params[3] || 0;
          }
          break;

        case 'A': // Arc
          // SVG arc is complex, simplified implementation
          if (params.length >= 7) {
            const rx = params[0];
            const ry = params[1];
            const rotation = (params[2] * Math.PI) / 180;
            // const largeArc = params[3];
            // const sweep = params[4];
            let x = params[5];
            let y = params[6];

            if (isRelative) {
              x += currentX;
              y += currentY;
            }

            // Simplified: use ellipse (doesn't handle all arc parameters perfectly)
            const centerX = (currentX + x) / 2;
            const centerY = (currentY + y) / 2;
            ctx.ellipse(centerX, centerY, rx, ry, rotation, 0, Math.PI * 2);

            currentX = x;
            currentY = y;
          }
          break;

        case 'Z': // Close path
          ctx.closePath();
          currentX = startX;
          currentY = startY;
          break;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.getVisible() || this.commands.length === 0) return;

    this.executePath(ctx);

    this.drawFill(ctx);
    this.drawFrame(ctx);
  }

  /**
   * Helper methods to create common paths
   */

  /**
   * Create a heart shape
   */
  static createHeart(centerX: number, centerY: number, size: number): SK8Path {
    const path = new SK8Path();
    const scale = size / 100;

    const pathData = `
      M ${centerX} ${centerY + 20 * scale}
      C ${centerX} ${centerY + 10 * scale}, ${centerX - 30 * scale} ${centerY - 10 * scale}, ${centerX - 30 * scale} ${centerY - 30 * scale}
      C ${centerX - 30 * scale} ${centerY - 45 * scale}, ${centerX - 15 * scale} ${centerY - 50 * scale}, ${centerX} ${centerY - 40 * scale}
      C ${centerX + 15 * scale} ${centerY - 50 * scale}, ${centerX + 30 * scale} ${centerY - 45 * scale}, ${centerX + 30 * scale} ${centerY - 30 * scale}
      C ${centerX + 30 * scale} ${centerY - 10 * scale}, ${centerX} ${centerY + 10 * scale}, ${centerX} ${centerY + 20 * scale}
      Z
    `;

    path.setPathData(pathData);
    return path;
  }

  /**
   * Create a cloud shape
   */
  static createCloud(centerX: number, centerY: number, size: number): SK8Path {
    const path = new SK8Path();
    const scale = size / 100;

    const pathData = `
      M ${centerX - 40 * scale} ${centerY + 10 * scale}
      Q ${centerX - 50 * scale} ${centerY - 10 * scale} ${centerX - 30 * scale} ${centerY - 20 * scale}
      Q ${centerX - 20 * scale} ${centerY - 40 * scale} ${centerX} ${centerY - 30 * scale}
      Q ${centerX + 20 * scale} ${centerY - 45 * scale} ${centerX + 30 * scale} ${centerY - 25 * scale}
      Q ${centerX + 50 * scale} ${centerY - 15 * scale} ${centerX + 40 * scale} ${centerY + 10 * scale}
      L ${centerX - 40 * scale} ${centerY + 10 * scale}
      Z
    `;

    path.setPathData(pathData);
    return path;
  }

  /**
   * Create a lightning bolt
   */
  static createLightning(centerX: number, centerY: number, size: number): SK8Path {
    const path = new SK8Path();
    const scale = size / 100;

    const pathData = `
      M ${centerX - 10 * scale} ${centerY - 40 * scale}
      L ${centerX + 10 * scale} ${centerY - 10 * scale}
      L ${centerX + 5 * scale} ${centerY - 10 * scale}
      L ${centerX + 15 * scale} ${centerY + 40 * scale}
      L ${centerX - 5 * scale} ${centerY + 5 * scale}
      L ${centerX} ${centerY + 5 * scale}
      L ${centerX - 10 * scale} ${centerY - 40 * scale}
      Z
    `;

    path.setPathData(pathData);
    return path;
  }
}
