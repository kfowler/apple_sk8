/**
 * Object System Enhancement Tests
 * Tests for computed properties, observers, validation, and metadata
 */

import { SK8Object } from '../src/core/SK8Object';

describe('Computed Properties', () => {
  it('should compute property value from getter', () => {
    const obj = new SK8Object();
    obj.defineProperty('firstName', { value: 'John' });
    obj.defineProperty('lastName', { value: 'Doe' });
    obj.defineProperty('fullName', {
      computed: true,
      getter: function (this: SK8Object) {
        return `${this.get('firstName')} ${this.get('lastName')}`;
      },
    });

    expect(obj.get('fullName')).toBe('John Doe');
  });

  it('should cache computed property values', () => {
    const obj = new SK8Object();
    let callCount = 0;

    obj.defineProperty('value', { value: 42 });
    obj.defineProperty('computed', {
      computed: true,
      getter: function (this: SK8Object) {
        callCount++;
        return this.get('value') * 2;
      },
    });

    // First call should compute
    expect(obj.get('computed')).toBe(84);
    expect(callCount).toBe(1);

    // Second call should use cache
    expect(obj.get('computed')).toBe(84);
    expect(callCount).toBe(1);
  });

  it('should invalidate computed property cache when dependency changes', () => {
    const obj = new SK8Object();
    let callCount = 0;

    obj.defineProperty('value', { value: 10 });
    obj.defineProperty('doubled', {
      computed: true,
      dependencies: ['value'],
      getter: function (this: SK8Object) {
        callCount++;
        return this.get('value') * 2;
      },
    });

    // First computation
    expect(obj.get('doubled')).toBe(20);
    expect(callCount).toBe(1);

    // Change dependency
    obj.set('value', 20);

    // Should recompute
    expect(obj.get('doubled')).toBe(40);
    expect(callCount).toBe(2);
  });

  it('should handle multiple dependencies', () => {
    const obj = new SK8Object();
    obj.defineProperty('width', { value: 10 });
    obj.defineProperty('height', { value: 5 });
    obj.defineProperty('area', {
      computed: true,
      dependencies: ['width', 'height'],
      getter: function (this: SK8Object) {
        return this.get('width') * this.get('height');
      },
    });

    expect(obj.get('area')).toBe(50);

    obj.set('width', 20);
    expect(obj.get('area')).toBe(100);

    obj.set('height', 10);
    expect(obj.get('area')).toBe(200);
  });

  it('should detect circular dependencies in computed properties', () => {
    const obj = new SK8Object();
    obj.defineProperty('a', {
      computed: true,
      getter: function (this: SK8Object) {
        return this.get('b') + 1;
      },
    });
    obj.defineProperty('b', {
      computed: true,
      getter: function (this: SK8Object) {
        return this.get('a') + 1;
      },
    });

    expect(() => obj.get('a')).toThrow('Circular dependency detected');
  });

  it('should handle chained computed properties', () => {
    const obj = new SK8Object();
    obj.defineProperty('base', { value: 10 });
    obj.defineProperty('doubled', {
      computed: true,
      dependencies: ['base'],
      getter: function (this: SK8Object) {
        return this.get('base') * 2;
      },
    });
    obj.defineProperty('quadrupled', {
      computed: true,
      dependencies: ['doubled'],
      getter: function (this: SK8Object) {
        return this.get('doubled') * 2;
      },
    });

    expect(obj.get('quadrupled')).toBe(40);

    obj.set('base', 5);
    expect(obj.get('quadrupled')).toBe(20);
  });
});

describe('Property Observers', () => {
  it('should notify observer when property changes', () => {
    const obj = new SK8Object();
    const changes: Array<{ newValue: any; oldValue: any }> = [];

    obj.defineProperty('value', { value: 10 });
    obj.addPropertyObserver('value', (newValue, oldValue) => {
      changes.push({ newValue, oldValue });
    });

    obj.set('value', 20);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ newValue: 20, oldValue: 10 });
  });

  it('should support multiple observers for the same property', () => {
    const obj = new SK8Object();
    const observer1Calls: any[] = [];
    const observer2Calls: any[] = [];

    obj.defineProperty('value', { value: 1 });
    obj.addPropertyObserver('value', (newValue) => observer1Calls.push(newValue));
    obj.addPropertyObserver('value', (newValue) => observer2Calls.push(newValue));

    obj.set('value', 2);

    expect(observer1Calls).toEqual([2]);
    expect(observer2Calls).toEqual([2]);
  });

  it('should remove observer correctly', () => {
    const obj = new SK8Object();
    const calls: any[] = [];
    const observer = (newValue: any) => calls.push(newValue);

    obj.defineProperty('value', { value: 1 });
    obj.addPropertyObserver('value', observer);

    obj.set('value', 2);
    expect(calls).toEqual([2]);

    obj.removePropertyObserver('value', observer);
    obj.set('value', 3);
    expect(calls).toEqual([2]); // No new calls after removal
  });

  it('should notify observers when property is first set', () => {
    const obj = new SK8Object();
    const changes: any[] = [];

    obj.addPropertyObserver('newProp', (newValue, oldValue) => {
      changes.push({ newValue, oldValue });
    });

    obj.set('newProp', 'first value');

    expect(changes).toHaveLength(1);
    expect(changes[0].newValue).toBe('first value');
  });

  it('should handle multiple property observers independently', () => {
    const obj = new SK8Object();
    const prop1Changes: any[] = [];
    const prop2Changes: any[] = [];

    obj.defineProperty('prop1', { value: 'a' });
    obj.defineProperty('prop2', { value: 'b' });

    obj.addPropertyObserver('prop1', (newValue) => prop1Changes.push(newValue));
    obj.addPropertyObserver('prop2', (newValue) => prop2Changes.push(newValue));

    obj.set('prop1', 'A');
    obj.set('prop2', 'B');

    expect(prop1Changes).toEqual(['A']);
    expect(prop2Changes).toEqual(['B']);
  });
});

describe('Property Validation', () => {
  it('should validate property values on set', () => {
    const obj = new SK8Object();
    obj.defineProperty('age', {
      value: 25,
      validator: (value) => typeof value === 'number' && value >= 0,
    });

    // Valid value
    obj.set('age', 30);
    expect(obj.get('age')).toBe(30);

    // Invalid value
    expect(() => obj.set('age', -5)).toThrow('Validation failed');
  });

  it('should throw validation error with custom message', () => {
    const obj = new SK8Object();
    obj.defineProperty('email', {
      value: 'test@example.com',
      validator: (value) => {
        if (typeof value !== 'string') return 'Email must be a string';
        if (!value.includes('@')) return 'Email must contain @';
        return true;
      },
    });

    expect(() => obj.set('email', 'invalid')).toThrow('Email must contain @');
    expect(() => obj.set('email', 123)).toThrow('Email must be a string');
  });

  it('should validate with complex rules', () => {
    const obj = new SK8Object();
    obj.defineProperty('password', {
      value: 'SecurePass123',
      validator: (value) => {
        if (typeof value !== 'string') return 'Password must be a string';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain a number';
        return true;
      },
    });

    expect(() => obj.set('password', 'short')).toThrow('at least 8 characters');
    expect(() => obj.set('password', 'nouppercase123')).toThrow('uppercase letter');
    expect(() => obj.set('password', 'NoNumbers')).toThrow('contain a number');

    // Valid password
    obj.set('password', 'ValidPass123');
    expect(obj.get('password')).toBe('ValidPass123');
  });

  it('should validate null and undefined values', () => {
    const obj = new SK8Object();
    obj.defineProperty('optional', {
      value: 'default',
      validator: (value) => value === null || value === undefined || typeof value === 'string',
    });

    obj.set('optional', null);
    expect(obj.get('optional')).toBe(null);

    obj.set('optional', undefined);
    expect(obj.get('optional')).toBe(undefined);

    expect(() => obj.set('optional', 123)).toThrow('Validation failed');
  });

  it('should validate range constraints', () => {
    const obj = new SK8Object();
    obj.defineProperty('percentage', {
      value: 50,
      validator: (value) => {
        if (typeof value !== 'number') return 'Must be a number';
        if (value < 0 || value > 100) return 'Must be between 0 and 100';
        return true;
      },
    });

    obj.set('percentage', 0);
    expect(obj.get('percentage')).toBe(0);

    obj.set('percentage', 100);
    expect(obj.get('percentage')).toBe(100);

    expect(() => obj.set('percentage', -1)).toThrow('between 0 and 100');
    expect(() => obj.set('percentage', 101)).toThrow('between 0 and 100');
  });
});

describe('Property Metadata', () => {
  it('should store and retrieve property metadata', () => {
    const obj = new SK8Object();
    obj.defineProperty('name', {
      value: 'John',
      metadata: {
        type: 'string',
        description: 'User name',
        category: 'Personal',
      },
    });

    const metadata = obj.getPropertyMetadata('name');
    expect(metadata).toEqual({
      type: 'string',
      description: 'User name',
      category: 'Personal',
    });
  });

  it('should return undefined for property without metadata', () => {
    const obj = new SK8Object();
    obj.defineProperty('value', { value: 42 });

    expect(obj.getPropertyMetadata('value')).toBeUndefined();
  });

  it('should get all properties metadata', () => {
    const obj = new SK8Object();
    obj.defineProperty('name', {
      value: 'John',
      metadata: { type: 'string', category: 'Personal' },
    });
    obj.defineProperty('age', {
      value: 25,
      metadata: { type: 'number', category: 'Personal' },
    });
    obj.defineProperty('noMetadata', { value: 'test' });

    const allMetadata = obj.getAllPropertiesMetadata();
    expect(allMetadata).toEqual({
      name: { type: 'string', category: 'Personal' },
      age: { type: 'number', category: 'Personal' },
    });
    expect(allMetadata.noMetadata).toBeUndefined();
  });

  it('should support custom metadata fields', () => {
    const obj = new SK8Object();
    obj.defineProperty('score', {
      value: 0,
      metadata: {
        type: 'number',
        min: 0,
        max: 100,
        unit: 'points',
        editable: true,
      },
    });

    const metadata = obj.getPropertyMetadata('score');
    expect(metadata?.min).toBe(0);
    expect(metadata?.max).toBe(100);
    expect(metadata?.unit).toBe('points');
    expect(metadata?.editable).toBe(true);
  });

  it('should handle metadata with nested objects', () => {
    const obj = new SK8Object();
    obj.defineProperty('config', {
      value: {},
      metadata: {
        type: 'object',
        schema: {
          host: 'string',
          port: 'number',
        },
        validation: {
          required: true,
        },
      },
    });

    const metadata = obj.getPropertyMetadata('config');
    expect(metadata?.schema).toEqual({ host: 'string', port: 'number' });
    expect(metadata?.validation).toEqual({ required: true });
  });
});

describe('Integration Tests', () => {
  it('should combine computed properties, observers, and validation', () => {
    const obj = new SK8Object();
    const changes: any[] = [];

    obj.defineProperty('celsius', {
      value: 0,
      validator: (value) => typeof value === 'number',
      metadata: { type: 'number', unit: 'celsius' },
    });

    obj.defineProperty('fahrenheit', {
      computed: true,
      dependencies: ['celsius'],
      getter: function (this: SK8Object) {
        return (this.get('celsius') * 9) / 5 + 32;
      },
      metadata: { type: 'number', unit: 'fahrenheit' },
    });

    obj.addPropertyObserver('celsius', (newValue, oldValue) => {
      changes.push({ celsius: { newValue, oldValue } });
    });

    // Set celsius
    obj.set('celsius', 100);
    expect(obj.get('fahrenheit')).toBe(212); // Boiling point
    expect(changes).toHaveLength(1);

    // Validate metadata
    expect(obj.getPropertyMetadata('celsius')?.unit).toBe('celsius');
    expect(obj.getPropertyMetadata('fahrenheit')?.unit).toBe('fahrenheit');

    // Try invalid value
    expect(() => obj.set('celsius', 'hot')).toThrow('Validation failed');
  });

  it('should handle complex object with all features', () => {
    const obj = new SK8Object(null, 'Rectangle');

    // Define validated properties
    obj.defineProperty('width', {
      value: 10,
      validator: (value) => typeof value === 'number' && value > 0,
      metadata: { type: 'number', description: 'Rectangle width' },
    });

    obj.defineProperty('height', {
      value: 5,
      validator: (value) => typeof value === 'number' && value > 0,
      metadata: { type: 'number', description: 'Rectangle height' },
    });

    // Define computed property
    obj.defineProperty('area', {
      computed: true,
      dependencies: ['width', 'height'],
      getter: function (this: SK8Object) {
        return this.get('width') * this.get('height');
      },
      metadata: { type: 'number', description: 'Rectangle area' },
    });

    obj.defineProperty('perimeter', {
      computed: true,
      dependencies: ['width', 'height'],
      getter: function (this: SK8Object) {
        return 2 * (this.get('width') + this.get('height'));
      },
      metadata: { type: 'number', description: 'Rectangle perimeter' },
    });

    // Add observer
    let areaChanges = 0;
    obj.addPropertyObserver('width', () => areaChanges++);
    obj.addPropertyObserver('height', () => areaChanges++);

    // Test initial values
    expect(obj.get('area')).toBe(50);
    expect(obj.get('perimeter')).toBe(30);

    // Change dimensions
    obj.set('width', 20);
    expect(obj.get('area')).toBe(100);
    expect(obj.get('perimeter')).toBe(50);
    expect(areaChanges).toBe(1);

    // Test validation
    expect(() => obj.set('width', -5)).toThrow('Validation failed');
    expect(() => obj.set('height', 0)).toThrow('Validation failed');

    // Verify metadata
    const allMetadata = obj.getAllPropertiesMetadata();
    expect(Object.keys(allMetadata)).toHaveLength(4);
    expect(allMetadata.area?.description).toBe('Rectangle area');
  });

  it('should work with inheritance and all features', () => {
    const parent = new SK8Object(null, 'BaseShape');
    parent.defineProperty('x', { value: 0 });
    parent.defineProperty('y', { value: 0 });

    const child = new SK8Object(parent, 'Circle');
    child.defineProperty('radius', {
      value: 10,
      validator: (value) => typeof value === 'number' && value > 0,
    });
    child.defineProperty('area', {
      computed: true,
      dependencies: ['radius'],
      getter: function (this: SK8Object) {
        const r = this.get('radius');
        return Math.PI * r * r;
      },
    });

    // Access inherited properties
    expect(child.get('x')).toBe(0);
    expect(child.get('y')).toBe(0);

    // Use computed property
    expect(child.get('area')).toBeCloseTo(314.159, 2);

    // Change radius
    child.set('radius', 5);
    expect(child.get('area')).toBeCloseTo(78.539, 2);
  });
});
