/**
 * Object Pool - Reusable object pool to reduce GC pressure
 *
 * Implements object pooling for frequently created/destroyed objects
 * to minimize memory allocations and garbage collection.
 */

export interface Poolable {
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private createFn: () => T;
  private maxSize: number;
  private allocatedCount: number = 0;
  private totalAllocations: number = 0;
  private totalReuses: number = 0;

  constructor(createFn: () => T, initialSize: number = 10, maxSize: number = 1000) {
    this.createFn = createFn;
    this.maxSize = maxSize;

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  /**
   * Get an object from the pool
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      this.totalReuses++;
    } else {
      obj = this.createFn();
      this.totalAllocations++;
    }

    this.allocatedCount++;
    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      obj.reset();
      this.pool.push(obj);
      this.allocatedCount--;
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
    this.allocatedCount = 0;
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      available: this.pool.length,
      allocated: this.allocatedCount,
      totalAllocations: this.totalAllocations,
      totalReuses: this.totalReuses,
      reuseRate: this.totalReuses / (this.totalAllocations + this.totalReuses) || 0,
    };
  }
}

export interface PoolStats {
  available: number;
  allocated: number;
  totalAllocations: number;
  totalReuses: number;
  reuseRate: number;
}

/**
 * Pooled Rect implementation
 */
export class PooledRect implements Poolable {
  left: number = 0;
  top: number = 0;
  right: number = 0;
  bottom: number = 0;

  set(left: number, top: number, right: number, bottom: number): this {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    return this;
  }

  reset(): void {
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
  }

  clone(): PooledRect {
    const rect = rectPool.acquire();
    rect.left = this.left;
    rect.top = this.top;
    rect.right = this.right;
    rect.bottom = this.bottom;
    return rect;
  }
}

/**
 * Pooled Color implementation
 */
export class PooledColor implements Poolable {
  red: number = 0;
  green: number = 0;
  blue: number = 0;
  alpha: number = 1;

  set(red: number, green: number, blue: number, alpha: number = 1): this {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
    return this;
  }

  reset(): void {
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this.alpha = 1;
  }

  clone(): PooledColor {
    const color = colorPool.acquire();
    color.red = this.red;
    color.green = this.green;
    color.blue = this.blue;
    color.alpha = this.alpha;
    return color;
  }
}

/**
 * Pooled Point implementation
 */
export class PooledPoint implements Poolable {
  x: number = 0;
  y: number = 0;

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
  }

  clone(): PooledPoint {
    const point = pointPool.acquire();
    point.x = this.x;
    point.y = this.y;
    return point;
  }
}

/**
 * Global pools
 */
export const rectPool = new ObjectPool<PooledRect>(() => new PooledRect(), 50, 500);
export const colorPool = new ObjectPool<PooledColor>(() => new PooledColor(), 20, 200);
export const pointPool = new ObjectPool<PooledPoint>(() => new PooledPoint(), 50, 500);

/**
 * Get statistics from all pools
 */
export function getAllPoolStats(): Record<string, PoolStats> {
  return {
    rect: rectPool.getStats(),
    color: colorPool.getStats(),
    point: pointPool.getStats(),
  };
}
