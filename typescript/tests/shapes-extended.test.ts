/**
 * Tests for extended shape actors (Phase 1 Additional Shapes)
 *
 * Tests for: Arrow, Star, Path, TextBox, ProgressBar, and visual effects
 */

import { describe, test, expect } from '@jest/globals';
import { SK8Arrow, ArrowDirection } from '../src/actors/Arrow.js';
import { SK8Star } from '../src/actors/Star.js';
import { SK8Path } from '../src/actors/Path.js';
import { SK8TextBox } from '../src/actors/TextBox.js';
import { SK8ProgressBar } from '../src/actors/ProgressBar.js';
import { SK8Rectangle } from '../src/graphics/shapes.js';

describe('SK8Arrow', () => {
  test('should create an arrow with default properties', () => {
    const arrow = new SK8Arrow();
    expect(arrow).toBeDefined();
    expect(arrow.getStartPoint()).toEqual({ x: 0, y: 0 });
    expect(arrow.getEndPoint()).toEqual({ x: 100, y: 0 });
    expect(arrow.getHeadSize()).toBe(15);
    expect(arrow.getHeadAngle()).toBe(30);
    expect(arrow.getDirection()).toBe('end');
  });

  test('should set and get start point', () => {
    const arrow = new SK8Arrow();
    arrow.setStartPoint({ x: 10, y: 20 });
    expect(arrow.getStartPoint()).toEqual({ x: 10, y: 20 });
  });

  test('should set and get end point', () => {
    const arrow = new SK8Arrow();
    arrow.setEndPoint({ x: 200, y: 150 });
    expect(arrow.getEndPoint()).toEqual({ x: 200, y: 150 });
  });

  test('should set points using convenience method', () => {
    const arrow = new SK8Arrow();
    arrow.setPoints(50, 60, 150, 180);
    expect(arrow.getStartPoint()).toEqual({ x: 50, y: 60 });
    expect(arrow.getEndPoint()).toEqual({ x: 150, y: 180 });
  });

  test('should set and get head size', () => {
    const arrow = new SK8Arrow();
    arrow.setHeadSize(20);
    expect(arrow.getHeadSize()).toBe(20);
  });

  test('should clamp head size to non-negative', () => {
    const arrow = new SK8Arrow();
    arrow.setHeadSize(-10);
    expect(arrow.getHeadSize()).toBe(0);
  });

  test('should set and get head angle', () => {
    const arrow = new SK8Arrow();
    arrow.setHeadAngle(45);
    expect(arrow.getHeadAngle()).toBe(45);
  });

  test('should clamp head angle between 0 and 90', () => {
    const arrow = new SK8Arrow();
    arrow.setHeadAngle(120);
    expect(arrow.getHeadAngle()).toBe(90);
    arrow.setHeadAngle(-10);
    expect(arrow.getHeadAngle()).toBe(0);
  });

  test('should set and get direction', () => {
    const arrow = new SK8Arrow();
    const directions: ArrowDirection[] = ['start', 'end', 'both', 'none'];

    directions.forEach(dir => {
      arrow.setDirection(dir);
      expect(arrow.getDirection()).toBe(dir);
    });
  });

  test('should update bounds when points change', () => {
    const arrow = new SK8Arrow();
    arrow.setPoints(10, 20, 100, 80);
    const bounds = arrow.getBoundsRect();

    // Bounds should encompass both points plus head size
    expect(bounds.left).toBeLessThan(10);
    expect(bounds.top).toBeLessThan(20);
    expect(bounds.right).toBeGreaterThan(100);
    expect(bounds.bottom).toBeGreaterThan(80);
  });
});

describe('SK8Star', () => {
  test('should create a star with default properties', () => {
    const star = new SK8Star();
    expect(star).toBeDefined();
    expect(star.getNumPoints()).toBe(5);
    expect(star.getInnerRadius()).toBe(20);
    expect(star.getOuterRadius()).toBe(50);
  });

  test('should set and get number of points', () => {
    const star = new SK8Star();
    star.setNumPoints(7);
    expect(star.getNumPoints()).toBe(7);
  });

  test('should enforce minimum of 3 points', () => {
    const star = new SK8Star();
    star.setNumPoints(2);
    expect(star.getNumPoints()).toBe(3);
  });

  test('should set and get inner radius', () => {
    const star = new SK8Star();
    star.setInnerRadius(30);
    expect(star.getInnerRadius()).toBe(30);
  });

  test('should set and get outer radius', () => {
    const star = new SK8Star();
    star.setOuterRadius(75);
    expect(star.getOuterRadius()).toBe(75);
  });

  test('should set center point', () => {
    const star = new SK8Star();
    star.setCenter(100, 150);
    expect(star.getCenterX()).toBe(100);
    expect(star.getCenterY()).toBe(150);
  });

  test('should update bounds when radii change', () => {
    const star = new SK8Star();
    star.setCenter(100, 100);
    star.setOuterRadius(50);

    const bounds = star.getBoundsRect();
    expect(bounds.left).toBe(50);
    expect(bounds.top).toBe(50);
    expect(bounds.right).toBe(150);
    expect(bounds.bottom).toBe(150);
  });

  test('should handle non-negative radii only', () => {
    const star = new SK8Star();
    star.setInnerRadius(-10);
    expect(star.getInnerRadius()).toBe(0);
    star.setOuterRadius(-5);
    expect(star.getOuterRadius()).toBe(0);
  });
});

describe('SK8Path', () => {
  test('should create a path with default properties', () => {
    const path = new SK8Path();
    expect(path).toBeDefined();
    expect(path.getPathData()).toBe('');
    expect(path.getClosed()).toBe(false);
  });

  test('should parse simple line path', () => {
    const path = new SK8Path();
    path.setPathData('M 10 10 L 50 50');
    expect(path.getPathData()).toBe('M 10 10 L 50 50');
    expect(path.getCommands()).toHaveLength(2);
  });

  test('should parse path with multiple commands', () => {
    const path = new SK8Path();
    path.setPathData('M 10 10 L 50 50 L 10 90 Z');
    const commands = path.getCommands();
    expect(commands).toHaveLength(4);
    expect(commands[0].command).toBe('M');
    expect(commands[1].command).toBe('L');
    expect(commands[3].command).toBe('Z');
  });

  test('should detect closed paths', () => {
    const path = new SK8Path();
    path.setPathData('M 10 10 L 50 50 Z');
    expect(path.getClosed()).toBe(true);
  });

  test('should parse cubic bezier curves', () => {
    const path = new SK8Path();
    path.setPathData('M 10 10 C 20 20, 40 20, 50 10');
    const commands = path.getCommands();
    expect(commands).toHaveLength(2);
    expect(commands[1].command).toBe('C');
    expect(commands[1].params).toHaveLength(6);
  });

  test('should create heart shape', () => {
    const heart = SK8Path.createHeart(100, 100, 50);
    expect(heart).toBeDefined();
    expect(heart.getPathData()).toContain('M');
    expect(heart.getPathData()).toContain('C');
  });

  test('should create cloud shape', () => {
    const cloud = SK8Path.createCloud(100, 100, 50);
    expect(cloud).toBeDefined();
    expect(cloud.getPathData()).toContain('Q');
  });

  test('should create lightning shape', () => {
    const lightning = SK8Path.createLightning(100, 100, 50);
    expect(lightning).toBeDefined();
    expect(lightning.getPathData()).toContain('L');
  });
});

describe('SK8TextBox', () => {
  test('should create a text box with default properties', () => {
    const textBox = new SK8TextBox();
    expect(textBox).toBeDefined();
    expect(textBox.getText()).toBe('');
    expect(textBox.getAlignment()).toBe('left');
    expect(textBox.getLineHeight()).toBe(1.2);
    expect(textBox.getPadding()).toBe(5);
  });

  test('should set and get text', () => {
    const textBox = new SK8TextBox();
    textBox.setText('Hello World');
    expect(textBox.getText()).toBe('Hello World');
  });

  test('should set and get alignment', () => {
    const textBox = new SK8TextBox();
    textBox.setAlignment('center');
    expect(textBox.getAlignment()).toBe('center');
    textBox.setAlignment('right');
    expect(textBox.getAlignment()).toBe('right');
  });

  test('should set and get line height', () => {
    const textBox = new SK8TextBox();
    textBox.setLineHeight(1.5);
    expect(textBox.getLineHeight()).toBe(1.5);
  });

  test('should enforce minimum line height', () => {
    const textBox = new SK8TextBox();
    textBox.setLineHeight(0.2);
    expect(textBox.getLineHeight()).toBe(0.5);
  });

  test('should set and get padding', () => {
    const textBox = new SK8TextBox();
    textBox.setPadding(10);
    expect(textBox.getPadding()).toBe(10);
  });

  test('should handle scroll offset', () => {
    const textBox = new SK8TextBox();
    textBox.setScrollOffset(5);
    expect(textBox.getScrollOffset()).toBe(5);
  });

  test('should scroll up and down', () => {
    const textBox = new SK8TextBox();
    textBox.setScrollOffset(5);
    textBox.scrollUp();
    expect(textBox.getScrollOffset()).toBe(4);
    textBox.scrollDown();
    expect(textBox.getScrollOffset()).toBe(5);
  });

  test('should set editable mode', () => {
    const textBox = new SK8TextBox();
    expect(textBox.getEditable()).toBe(false);
    textBox.setEditable(true);
    expect(textBox.getEditable()).toBe(true);
  });

  test('should set max lines', () => {
    const textBox = new SK8TextBox();
    textBox.setMaxLines(10);
    expect(textBox.getMaxLines()).toBe(10);
  });
});

describe('SK8ProgressBar', () => {
  test('should create a progress bar with default properties', () => {
    const bar = new SK8ProgressBar();
    expect(bar).toBeDefined();
    expect(bar.getValue()).toBe(0);
    expect(bar.getOrientation()).toBe('horizontal');
    expect(bar.getShowText()).toBe(true);
  });

  test('should set and get value', () => {
    const bar = new SK8ProgressBar();
    bar.setValue(50, false);
    expect(bar.getValue()).toBe(50);
  });

  test('should clamp value between 0 and 100', () => {
    const bar = new SK8ProgressBar();
    bar.setValue(150, false);
    expect(bar.getValue()).toBe(100);
    bar.setValue(-10, false);
    expect(bar.getValue()).toBe(0);
  });

  test('should set orientation', () => {
    const bar = new SK8ProgressBar();
    bar.setOrientation('vertical');
    expect(bar.getOrientation()).toBe('vertical');
  });

  test('should toggle text display', () => {
    const bar = new SK8ProgressBar();
    bar.setShowText(false);
    expect(bar.getShowText()).toBe(false);
  });

  test('should increment value', () => {
    const bar = new SK8ProgressBar();
    bar.setValue(50, false);
    bar.increment(10);
    expect(bar.getValue()).toBe(60);
  });

  test('should decrement value', () => {
    const bar = new SK8ProgressBar();
    bar.setValue(50, false);
    bar.decrement(20);
    expect(bar.getValue()).toBe(30);
  });

  test('should reset to 0', () => {
    const bar = new SK8ProgressBar();
    bar.setValue(75, false);
    bar.reset();
    expect(bar.getValue()).toBe(0);
  });

  test('should complete to 100', () => {
    const bar = new SK8ProgressBar();
    bar.complete();
    expect(bar.getValue()).toBe(100);
  });

  test('should set animation speed', () => {
    const bar = new SK8ProgressBar();
    bar.setAnimationSpeed(0.5);
    expect(bar.getAnimationSpeed()).toBe(0.5);
  });

  test('should set background color', () => {
    const bar = new SK8ProgressBar();
    const color = { r: 255, g: 0, b: 0 };
    bar.setBackgroundColor(color);
    expect(bar.getBackgroundColor()).toEqual(color);
  });

  test('should set bar color', () => {
    const bar = new SK8ProgressBar();
    const color = { r: 0, g: 255, b: 0 };
    bar.setBarColor(color);
    expect(bar.getBarColor()).toEqual(color);
  });

  test('should create determinate progress bar', () => {
    const bar = SK8ProgressBar.createDeterminate(10, 20, 200, 30);
    expect(bar.getBoundsRect()).toEqual({
      left: 10,
      top: 20,
      right: 210,
      bottom: 50,
    });
  });

  test('should create vertical progress bar', () => {
    const bar = SK8ProgressBar.createVertical(10, 20, 30, 200);
    expect(bar.getOrientation()).toBe('vertical');
  });
});

describe('Visual Effects - Opacity', () => {
  test('should set and get opacity', () => {
    const rect = new SK8Rectangle();
    rect.setOpacity(0.5);
    expect(rect.getOpacity()).toBe(0.5);
  });

  test('should clamp opacity between 0 and 1', () => {
    const rect = new SK8Rectangle();
    rect.setOpacity(1.5);
    expect(rect.getOpacity()).toBe(1);
    rect.setOpacity(-0.5);
    expect(rect.getOpacity()).toBe(0);
  });

  test('should have default opacity of 1', () => {
    const rect = new SK8Rectangle();
    expect(rect.getOpacity()).toBe(1);
  });
});

describe('Visual Effects - Shadow', () => {
  test('should set shadow', () => {
    const rect = new SK8Rectangle();
    const color = { r: 0, g: 0, b: 0 };
    rect.setShadow(color, 5, 3, 3);

    expect(rect.hasShadow()).toBe(true);
    expect(rect.getShadowColor()).toEqual(color);
    expect(rect.getShadowBlur()).toBe(5);
    expect(rect.getShadowOffsetX()).toBe(3);
    expect(rect.getShadowOffsetY()).toBe(3);
  });

  test('should clear shadow', () => {
    const rect = new SK8Rectangle();
    const color = { r: 0, g: 0, b: 0 };
    rect.setShadow(color, 5, 3, 3);
    rect.clearShadow();

    expect(rect.hasShadow()).toBe(false);
    expect(rect.getShadowColor()).toBeNull();
    expect(rect.getShadowBlur()).toBe(0);
    expect(rect.getShadowOffsetX()).toBe(0);
    expect(rect.getShadowOffsetY()).toBe(0);
  });

  test('should not have shadow by default', () => {
    const rect = new SK8Rectangle();
    expect(rect.hasShadow()).toBe(false);
  });
});

describe('Integration Tests', () => {
  test('should combine opacity and shadow effects', () => {
    const rect = new SK8Rectangle();
    rect.setOpacity(0.7);
    rect.setShadow({ r: 0, g: 0, b: 0 }, 4, 2, 2);

    expect(rect.getOpacity()).toBe(0.7);
    expect(rect.hasShadow()).toBe(true);
  });

  test('should apply visual effects to all shape types', () => {
    const shapes = [
      new SK8Arrow(),
      new SK8Star(),
      new SK8Path(),
      new SK8TextBox(),
      new SK8ProgressBar(),
    ];

    shapes.forEach(shape => {
      shape.setOpacity(0.5);
      shape.setShadow({ r: 0, g: 0, b: 0 }, 3, 1, 1);

      expect(shape.getOpacity()).toBe(0.5);
      expect(shape.hasShadow()).toBe(true);
    });
  });

  test('should maintain visual effects after property changes', () => {
    const star = new SK8Star();
    star.setOpacity(0.8);
    star.setShadow({ r: 0, g: 0, b: 0 }, 5, 2, 2);

    star.setNumPoints(7);
    star.setOuterRadius(100);

    expect(star.getOpacity()).toBe(0.8);
    expect(star.hasShadow()).toBe(true);
  });
});
