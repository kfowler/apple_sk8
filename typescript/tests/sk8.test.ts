/**
 * Basic SK8 System Tests
 */

import { SK8Object } from '../src/core/SK8Object';
import { newList, newTable } from '../src/runtime/collections';
import { Easing } from '../src/runtime/animation';
import { RectUtils, ColorUtils } from '../src/graphics/types';

describe('SK8Object', () => {
  it('should create an object', () => {
    const obj = new SK8Object(null, 'TestObject');
    expect(obj).toBeDefined();
    expect(obj.getName()).toBe('TestObject');
  });

  it('should handle properties', () => {
    const obj = new SK8Object();
    obj.defineProperty('value', { value: 42 });
    expect(obj.get('value')).toBe(42);
    obj.set('value', 100);
    expect(obj.get('value')).toBe(100);
  });

  it('should handle handlers', () => {
    const obj = new SK8Object();
    obj.addHandler('test', function() {
      return 'works';
    });
    expect(obj.callHandler('test')).toBe('works');
  });

  it('should support inheritance', () => {
    const parent = new SK8Object(null, 'Parent');
    parent.defineProperty('inherited', { value: 'from parent' });

    const child = new SK8Object(parent, 'Child');
    expect(child.get('inherited')).toBe('from parent');
  });

  it('should clone objects', () => {
    const original = new SK8Object(null, 'Original');
    original.defineProperty('value', { value: 42 });

    const clone = original.clone('Clone');
    expect(clone.getName()).toBe('Clone');
    expect(clone.get('value')).toBe(42);
  });
});

describe('SK8List', () => {
  it('should create a list', () => {
    const list = newList(1, 2, 3);
    expect(list.length()).toBe(3);
    expect(list.item(0)).toBe(1);
  });

  it('should add items', () => {
    const list = newList();
    list.add(1);
    list.add(2);
    expect(list.length()).toBe(2);
    expect(list.toArray()).toEqual([1, 2]);
  });

  it('should remove items', () => {
    const list = newList(1, 2, 3);
    list.remove(2);
    expect(list.toArray()).toEqual([1, 3]);
  });

  it('should map items', () => {
    const list = newList(1, 2, 3);
    const doubled = list.map((x: number) => x * 2);
    expect(doubled.toArray()).toEqual([2, 4, 6]);
  });

  it('should filter items', () => {
    const list = newList(1, 2, 3, 4, 5);
    const evens = list.filter((x: number) => x % 2 === 0);
    expect(evens.toArray()).toEqual([2, 4]);
  });

  it('should check containment', () => {
    const list = newList(1, 2, 3);
    expect(list.contains(2)).toBe(true);
    expect(list.contains(5)).toBe(false);
  });
});

describe('SK8Table', () => {
  it('should create a table', () => {
    const table = newTable({ a: 1, b: 2 });
    expect(table.length()).toBe(2);
    expect(table.item('a')).toBe(1);
  });

  it('should set and get items', () => {
    const table = newTable();
    table.setItem('key', 'value');
    expect(table.item('key')).toBe('value');
  });

  it('should check if key exists', () => {
    const table = newTable({ a: 1 });
    expect(table.hasKey('a')).toBe(true);
    expect(table.hasKey('b')).toBe(false);
  });

  it('should get keys and values', () => {
    const table = newTable({ a: 1, b: 2 });
    expect(table.keys()).toContain('a');
    expect(table.keys()).toContain('b');
    expect(table.values()).toContain(1);
    expect(table.values()).toContain(2);
  });

  it('should remove items', () => {
    const table = newTable({ a: 1, b: 2 });
    table.remove('a');
    expect(table.hasKey('a')).toBe(false);
    expect(table.length()).toBe(1);
  });

  it('should merge tables', () => {
    const table1 = newTable({ a: 1 });
    const table2 = newTable({ b: 2 });
    table1.merge(table2);
    expect(table1.length()).toBe(2);
    expect(table1.item('b')).toBe(2);
  });
});

describe('Easing', () => {
  it('should calculate linear easing', () => {
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.linear(1)).toBe(1);
  });

  it('should calculate quad easings', () => {
    expect(Easing.easeInQuad(0)).toBe(0);
    expect(Easing.easeInQuad(1)).toBe(1);
    expect(Easing.easeOutQuad(0)).toBe(0);
    expect(Easing.easeOutQuad(1)).toBe(1);
    expect(Easing.easeInOutQuad(0)).toBe(0);
    expect(Easing.easeInOutQuad(1)).toBe(1);
  });

  it('should calculate cubic easings', () => {
    expect(Easing.easeInCubic(0)).toBe(0);
    expect(Easing.easeInCubic(1)).toBe(1);
    expect(Easing.easeOutCubic(0)).toBe(0);
    expect(Easing.easeOutCubic(1)).toBe(1);
    expect(Easing.easeInOutCubic(0)).toBe(0);
    expect(Easing.easeInOutCubic(1)).toBe(1);
  });

  it('should calculate elastic easings', () => {
    expect(Easing.easeInElastic(0)).toBe(0);
    expect(Easing.easeOutElastic(0)).toBe(0);
    // Elastic functions should return approximately 1 at t=1
    expect(Math.abs(Easing.easeInElastic(1) - 1)).toBeLessThan(0.1);
    expect(Math.abs(Easing.easeOutElastic(1) - 1)).toBeLessThan(0.1);
  });

  it('should calculate bounce easings', () => {
    expect(Easing.easeInBounce(0)).toBe(0);
    expect(Easing.easeOutBounce(0)).toBe(0);
    // Bounce should be close to 1 at t=1
    expect(Math.abs(Easing.easeOutBounce(1) - 1)).toBeLessThan(0.01);
  });
});

describe('RectUtils', () => {
  it('should create rect from XYWH', () => {
    const rect = RectUtils.fromXYWH(10, 20, 100, 50);
    expect(rect.left).toBe(10);
    expect(rect.top).toBe(20);
    expect(rect.right).toBe(110);
    expect(rect.bottom).toBe(70);
  });

  it('should calculate width and height', () => {
    const rect = { left: 0, top: 0, right: 100, bottom: 50 };
    expect(RectUtils.width(rect)).toBe(100);
    expect(RectUtils.height(rect)).toBe(50);
  });

  it('should check containment', () => {
    const rect = { left: 0, top: 0, right: 100, bottom: 100 };
    expect(RectUtils.contains(rect, 50, 50)).toBe(true);
    expect(RectUtils.contains(rect, 150, 50)).toBe(false);
  });

  it('should calculate center', () => {
    const rect = { left: 0, top: 0, right: 100, bottom: 100 };
    expect(RectUtils.centerX(rect)).toBe(50);
    expect(RectUtils.centerY(rect)).toBe(50);
  });
});

describe('ColorUtils', () => {
  it('should convert string colors to CSS', () => {
    expect(ColorUtils.toCSS('red')).toBe('red');
    expect(ColorUtils.toCSS('#FF0000')).toBe('#FF0000');
  });

  it('should convert RGB object to CSS', () => {
    const color = { r: 255, g: 128, b: 64 };
    expect(ColorUtils.toCSS(color)).toBe('rgba(255, 128, 64, 1)');
  });

  it('should convert RGBA object to CSS', () => {
    const color = { r: 255, g: 128, b: 64, a: 0.5 };
    expect(ColorUtils.toCSS(color)).toBe('rgba(255, 128, 64, 0.5)');
  });

  it('should create from RGB', () => {
    const color = ColorUtils.fromRGB(255, 128, 64);
    if (typeof color !== 'string') {
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBe(1);
    }
  });
});
