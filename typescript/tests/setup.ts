/**
 * Jest test setup file
 * Provides polyfills and mocks for browser APIs not available in jsdom
 */

// Polyfill for DOMMatrix (not available in jsdom)
class DOMMatrixPolyfill {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;
  is2D = true;
  isIdentity = true;

  constructor(init?: string | number[]) {
    if (typeof init === 'string') {
      // Parse matrix string if needed
      // For now, just use identity
    } else if (Array.isArray(init)) {
      // Initialize from array if needed
      if (init.length >= 6) {
        this.a = init[0];
        this.b = init[1];
        this.c = init[2];
        this.d = init[3];
        this.e = init[4];
        this.f = init[5];
      }
    }
  }

  translate(tx: number, ty: number): DOMMatrixPolyfill {
    const matrix = new DOMMatrixPolyfill();
    matrix.e = this.e + tx;
    matrix.f = this.f + ty;
    return matrix;
  }

  scale(scaleX: number, scaleY?: number): DOMMatrixPolyfill {
    const sy = scaleY ?? scaleX;
    const matrix = new DOMMatrixPolyfill();
    matrix.a = this.a * scaleX;
    matrix.d = this.d * sy;
    return matrix;
  }

  rotate(angle: number): DOMMatrixPolyfill {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const matrix = new DOMMatrixPolyfill();
    matrix.a = cos;
    matrix.b = sin;
    matrix.c = -sin;
    matrix.d = cos;
    return matrix;
  }

  multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
    const matrix = new DOMMatrixPolyfill();
    matrix.a = this.a * other.a + this.c * other.b;
    matrix.b = this.b * other.a + this.d * other.b;
    matrix.c = this.a * other.c + this.c * other.d;
    matrix.d = this.b * other.c + this.d * other.d;
    matrix.e = this.a * other.e + this.c * other.f + this.e;
    matrix.f = this.b * other.e + this.d * other.f + this.f;
    return matrix;
  }

  transformPoint(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: point.x * this.a + point.y * this.c + this.e,
      y: point.x * this.b + point.y * this.d + this.f,
    };
  }

  inverse(): DOMMatrixPolyfill {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) {
      throw new Error('Matrix is not invertible');
    }
    const matrix = new DOMMatrixPolyfill();
    matrix.a = this.d / det;
    matrix.b = -this.b / det;
    matrix.c = -this.c / det;
    matrix.d = this.a / det;
    matrix.e = (this.c * this.f - this.d * this.e) / det;
    matrix.f = (this.b * this.e - this.a * this.f) / det;
    return matrix;
  }
}

// Add DOMMatrix to global scope
(global as any).DOMMatrix = DOMMatrixPolyfill;

// Mock HTMLMediaElement methods if needed
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = jest.fn();
  HTMLMediaElement.prototype.load = jest.fn();
}

// Mock createImageBitmap if not available
if (typeof createImageBitmap === 'undefined') {
  (global as any).createImageBitmap = jest.fn(() =>
    Promise.resolve({
      width: 100,
      height: 100,
      close: jest.fn(),
    })
  );
}

// Mock requestAnimationFrame and cancelAnimationFrame
(global as any).requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
(global as any).cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: jest.fn(() => Date.now()),
  };
}
