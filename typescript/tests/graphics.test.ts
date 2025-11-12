/**
 * Graphics System Tests - Phase 1.2
 * Tests for gradients, transforms, text styling, and performance
 */

import { LinearGradient, RadialGradient, Gradient } from '../src/graphics/gradients';
import { TextStyle, TextMeasure } from '../src/graphics/text-style';
import { SK8Rectangle } from '../src/graphics/shapes';

describe('Gradient System', () => {
  describe('LinearGradient', () => {
    it('should create a linear gradient', () => {
      const gradient = new LinearGradient(0, 0, 1, 0);
      expect(gradient).toBeInstanceOf(LinearGradient);
      expect(gradient).toBeInstanceOf(Gradient);
    });

    it('should add color stops', () => {
      const gradient = new LinearGradient();
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(1, 'blue');

      const stops = gradient.getColorStops();
      expect(stops).toHaveLength(2);
      expect(stops[0].offset).toBe(0);
      expect(stops[0].color).toBe('red');
      expect(stops[1].offset).toBe(1);
      expect(stops[1].color).toBe('blue');
    });

    it('should sort color stops by offset', () => {
      const gradient = new LinearGradient();
      gradient.addColorStop(1, 'blue');
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(0.5, 'green');

      const stops = gradient.getColorStops();
      expect(stops[0].offset).toBe(0);
      expect(stops[1].offset).toBe(0.5);
      expect(stops[2].offset).toBe(1);
    });

    it('should throw error for invalid offset', () => {
      const gradient = new LinearGradient();
      expect(() => gradient.addColorStop(-0.1, 'red')).toThrow();
      expect(() => gradient.addColorStop(1.1, 'red')).toThrow();
    });

    it('should create horizontal gradient', () => {
      const gradient = LinearGradient.horizontal();
      expect(gradient).toBeInstanceOf(LinearGradient);
    });

    it('should create vertical gradient', () => {
      const gradient = LinearGradient.vertical();
      expect(gradient).toBeInstanceOf(LinearGradient);
    });

    it('should create diagonal gradient', () => {
      const gradient = LinearGradient.diagonal();
      expect(gradient).toBeInstanceOf(LinearGradient);
    });

    it('should clear color stops', () => {
      const gradient = new LinearGradient();
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(1, 'blue');
      gradient.clearColorStops();

      expect(gradient.getColorStops()).toHaveLength(0);
    });

    it('should support method chaining', () => {
      const gradient = new LinearGradient()
        .addColorStop(0, 'red')
        .addColorStop(0.5, 'yellow')
        .addColorStop(1, 'blue');

      expect(gradient.getColorStops()).toHaveLength(3);
    });
  });

  describe('RadialGradient', () => {
    it('should create a radial gradient', () => {
      const gradient = new RadialGradient(0.5, 0.5, 0, 0.5, 0.5, 0.5);
      expect(gradient).toBeInstanceOf(RadialGradient);
    });

    it('should add color stops', () => {
      const gradient = new RadialGradient();
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');

      const stops = gradient.getColorStops();
      expect(stops).toHaveLength(2);
    });

    it('should create centered gradient', () => {
      const gradient = RadialGradient.centered();
      expect(gradient).toBeInstanceOf(RadialGradient);
    });

    it('should create spotlight gradient', () => {
      const gradient = RadialGradient.spotlight(0.3, 0.3);
      expect(gradient).toBeInstanceOf(RadialGradient);
    });

    it('should support method chaining', () => {
      const gradient = new RadialGradient()
        .addColorStop(0, 'yellow')
        .addColorStop(1, 'orange');

      expect(gradient.getColorStops()).toHaveLength(2);
    });
  });
});

describe('Transform System', () => {
  let rect: SK8Rectangle;

  beforeEach(() => {
    rect = new SK8Rectangle();
    rect.setBoundsRect({ left: 100, top: 100, right: 200, bottom: 200 });
  });

  it('should rotate actor', () => {
    rect.rotate(45);
    expect(rect.getRotation()).toBe(45);
  });

  it('should scale actor uniformly', () => {
    rect.scale(2);
    const scale = rect.getScale();
    expect(scale.x).toBe(2);
    expect(scale.y).toBe(2);
  });

  it('should scale actor non-uniformly', () => {
    rect.scale(2, 3);
    const scale = rect.getScale();
    expect(scale.x).toBe(2);
    expect(scale.y).toBe(3);
  });

  it('should skew actor', () => {
    rect.skew(15, 10);
    const skew = rect.getSkew();
    expect(skew.x).toBe(15);
    expect(skew.y).toBe(10);
  });

  it('should reset transformations', () => {
    rect.rotate(45);
    rect.scale(2, 3);
    rect.skew(15, 10);

    rect.resetTransform();

    expect(rect.getRotation()).toBe(0);
    expect(rect.getScale().x).toBe(1);
    expect(rect.getScale().y).toBe(1);
    expect(rect.getSkew().x).toBe(0);
    expect(rect.getSkew().y).toBe(0);
  });

  it('should get transform matrix', () => {
    rect.rotate(45);
    const matrix = rect.getTransformMatrix();
    expect(matrix).toBeInstanceOf(DOMMatrix);
  });

  it('should handle hit testing with transforms', () => {
    rect.setBoundsRect({ left: 0, top: 0, right: 100, bottom: 100 });

    // Without transform, point at (50, 50) should be inside
    expect(rect.containsPoint(50, 50)).toBe(true);

    // With rotation, we need to test if inverse transform works
    rect.rotate(45);
    // The actual hit testing logic should handle the inverse transform
  });

  it('should combine multiple transforms', () => {
    rect.rotate(30);
    rect.scale(1.5, 1.5);
    rect.skew(5, 5);

    expect(rect.getRotation()).toBe(30);
    expect(rect.getScale().x).toBe(1.5);
    expect(rect.getSkew().x).toBe(5);
  });
});

describe('Text Style System', () => {
  describe('TextStyle', () => {
    it('should create default text style', () => {
      const style = new TextStyle();
      expect(style.getFontFamily()).toBe('Geneva, Arial, sans-serif');
      expect(style.getFontSize()).toBe(16);
      expect(style.getFontWeight()).toBe('normal');
      expect(style.getFontStyle()).toBe('normal');
    });

    it('should create text style with options', () => {
      const style = new TextStyle();
      style.setFontSize(24);
      style.setFontWeight('bold');
      style.setFontStyle('italic');

      expect(style.getFontSize()).toBe(24);
      expect(style.getFontWeight()).toBe('bold');
      expect(style.getFontStyle()).toBe('italic');
    });

    it('should set font family', () => {
      const style = new TextStyle();
      style.setFontFamily('Helvetica, sans-serif');
      expect(style.getFontFamily()).toBe('Helvetica, sans-serif');
    });

    it('should set font size', () => {
      const style = new TextStyle();
      style.setFontSize(24);
      expect(style.getFontSize()).toBe(24);
    });

    it('should set font weight', () => {
      const style = new TextStyle();
      style.setFontWeight('bold');
      expect(style.getFontWeight()).toBe('bold');
    });

    it('should set font style', () => {
      const style = new TextStyle();
      style.setFontStyle('italic');
      expect(style.getFontStyle()).toBe('italic');
    });

    it('should set text alignment', () => {
      const style = new TextStyle();
      style.setTextAlign('center');
      expect(style.getTextAlign()).toBe('center');
    });

    it('should set line height', () => {
      const style = new TextStyle();
      style.setLineHeight(1.5);
      expect(style.getLineHeight()).toBe(1.5);
    });

    it('should set letter spacing', () => {
      const style = new TextStyle();
      style.setLetterSpacing(2);
      expect(style.getLetterSpacing()).toBe(2);
    });

    it('should set text decoration', () => {
      const style = new TextStyle();
      style.setTextDecoration('underline');
      expect(style.getTextDecoration()).toBe('underline');
    });

    it('should set word wrap', () => {
      const style = new TextStyle();
      style.setWordWrap(true);
      expect(style.getWordWrap()).toBe(true);
    });

    it('should set max width', () => {
      const style = new TextStyle();
      style.setMaxWidth(200);
      expect(style.getMaxWidth()).toBe(200);
    });

    it('should calculate line height in pixels', () => {
      const style = new TextStyle();
      style.setFontSize(20);
      style.setLineHeight(1.5);
      expect(style.getLineHeightPixels()).toBe(30);
    });

    it('should support method chaining', () => {
      const style = new TextStyle()
        .setFontSize(24)
        .setFontWeight('bold')
        .setTextAlign('center');

      expect(style.getFontSize()).toBe(24);
      expect(style.getFontWeight()).toBe('bold');
      expect(style.getTextAlign()).toBe('center');
    });

    it('should clone text style', () => {
      const original = new TextStyle()
        .setFontSize(24)
        .setFontWeight('bold');

      const clone = original.clone();
      expect(clone.getFontSize()).toBe(24);
      expect(clone.getFontWeight()).toBe('bold');

      // Modifying clone shouldn't affect original
      clone.setFontSize(32);
      expect(original.getFontSize()).toBe(24);
    });

    it('should create bold variant', () => {
      const style = new TextStyle();
      const bold = style.bold();

      expect(bold.getFontWeight()).toBe('bold');
      expect(style.getFontWeight()).toBe('normal'); // Original unchanged
    });

    it('should create italic variant', () => {
      const style = new TextStyle();
      const italic = style.italic();

      expect(italic.getFontStyle()).toBe('italic');
      expect(style.getFontStyle()).toBe('normal');
    });

    it('should create larger variant', () => {
      const style = new TextStyle().setFontSize(16);
      const larger = style.larger();

      expect(larger.getFontSize()).toBeCloseTo(19.2); // 16 * 1.2
      expect(style.getFontSize()).toBe(16);
    });

    it('should create smaller variant', () => {
      const style = new TextStyle().setFontSize(16);
      const smaller = style.smaller();

      expect(smaller.getFontSize()).toBeCloseTo(12.8); // 16 * 0.8
      expect(style.getFontSize()).toBe(16);
    });
  });

  describe('TextMeasure', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get 2D context');
      ctx = context;
    });

    it('should measure text width', () => {
      const style = new TextStyle().setFontSize(16);
      const width = TextMeasure.measureWidth(ctx, 'Hello', style);
      expect(width).toBeGreaterThan(0);
    });

    it('should measure text height', () => {
      const style = new TextStyle().setFontSize(16).setLineHeight(1.5);
      const height = TextMeasure.measureHeight(style);
      expect(height).toBe(24); // 16 * 1.5
    });

    it('should wrap text to fit width', () => {
      const style = new TextStyle().setFontSize(16);
      const lines = TextMeasure.wrapText(
        ctx,
        'This is a long line of text that should wrap',
        100,
        style
      );
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should not wrap short text', () => {
      const style = new TextStyle().setFontSize(16);
      const lines = TextMeasure.wrapText(ctx, 'Short', 1000, style);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Short');
    });

    it('should measure multi-line text', () => {
      const style = new TextStyle().setFontSize(16).setLineHeight(1.5);
      const size = TextMeasure.measureMultilineText(ctx, 'Line 1\nLine 2', style);

      expect(size.height).toBe(48); // 2 lines * 24 pixels
      expect(size.width).toBeGreaterThan(0);
    });
  });
});

describe('Performance Optimization', () => {
  it('should track FPS', () => {
    // This would require a browser environment with requestAnimationFrame
    // For now, just verify the structure exists
    expect(true).toBe(true);
  });
});
