/**
 * SK8 Collection System
 *
 * Implements SK8's collection protocol:
 * - Lists (ordered collections)
 * - Tables (key-value associations)
 * - Collection protocol methods
 */

import { SK8Object } from '../core/SK8Object.js';

/**
 * Base Collection class implementing SK8's collection protocol
 */
export abstract class SK8Collection extends SK8Object {
  constructor(parent?: SK8Collection, name?: string) {
    super(parent, name || 'Collection');
  }

  // Collection protocol methods (must be implemented by subclasses)
  abstract length(): number;
  abstract item(index: number | string): any;
  abstract setItem(index: number | string, value: any): void;
  abstract contains(value: any): boolean;
  abstract clear(): void;

  // Iteration
  abstract forEach(callback: (value: any, index: number | string) => void): void;

  // Common collection operations
  isEmpty(): boolean {
    return this.length() === 0;
  }

  // Convert to array
  abstract toArray(): any[];
}

/**
 * SK8List - Ordered collection (like Array)
 */
export class SK8List extends SK8Collection {
  private items: any[] = [];

  constructor(parent?: SK8Collection, name?: string, initialItems?: any[]) {
    super(parent, name || 'List');

    if (initialItems) {
      this.items = [...initialItems];
    }

    // Define properties
    this.defineProperty('length', {
      getter: () => this.length(),
    });
  }

  // Collection protocol implementation
  length(): number {
    return this.items.length;
  }

  item(index: number): any {
    if (index < 0 || index >= this.items.length) {
      return undefined;
    }
    return this.items[index];
  }

  setItem(index: number, value: any): void {
    if (index < 0 || index >= this.items.length) {
      throw new Error(`Index ${index} out of bounds (length: ${this.items.length})`);
    }
    this.items[index] = value;
  }

  contains(value: any): boolean {
    return this.items.includes(value);
  }

  clear(): void {
    this.items = [];
  }

  forEach(callback: (value: any, index: number) => void): void {
    this.items.forEach(callback);
  }

  toArray(): any[] {
    return [...this.items];
  }

  // List-specific methods

  /**
   * Add item to end of list
   */
  add(value: any): void {
    this.items.push(value);
  }

  /**
   * Add item at specific index
   */
  addAt(index: number, value: any): void {
    if (index < 0 || index > this.items.length) {
      throw new Error(`Index ${index} out of bounds`);
    }
    this.items.splice(index, 0, value);
  }

  /**
   * Remove item by value
   */
  remove(value: any): boolean {
    const index = this.items.indexOf(value);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove item at index
   */
  removeAt(index: number): any {
    if (index < 0 || index >= this.items.length) {
      throw new Error(`Index ${index} out of bounds`);
    }
    return this.items.splice(index, 1)[0];
  }

  /**
   * Get first item
   */
  first(): any {
    return this.items[0];
  }

  /**
   * Get last item
   */
  last(): any {
    return this.items[this.items.length - 1];
  }

  /**
   * Find index of value
   */
  indexOf(value: any): number {
    return this.items.indexOf(value);
  }

  /**
   * Reverse the list
   */
  reverse(): void {
    this.items.reverse();
  }

  /**
   * Sort the list
   */
  sort(compareFn?: (a: any, b: any) => number): void {
    this.items.sort(compareFn);
  }

  /**
   * Get slice of list
   */
  slice(start: number, end?: number): SK8List {
    return new SK8List(this, undefined, this.items.slice(start, end));
  }

  /**
   * Map over list
   */
  map(callback: (value: any, index: number) => any): SK8List {
    return new SK8List(this, undefined, this.items.map(callback));
  }

  /**
   * Filter list
   */
  filter(callback: (value: any, index: number) => boolean): SK8List {
    return new SK8List(this, undefined, this.items.filter(callback));
  }

  /**
   * Reduce list
   */
  reduce(callback: (accumulator: any, value: any, index: number) => any, initialValue?: any): any {
    return this.items.reduce(callback, initialValue);
  }

  /**
   * Check if any item matches predicate
   */
  some(callback: (value: any, index: number) => boolean): boolean {
    return this.items.some(callback);
  }

  /**
   * Check if all items match predicate
   */
  every(callback: (value: any, index: number) => boolean): boolean {
    return this.items.every(callback);
  }

  /**
   * Find first item matching predicate
   */
  find(callback: (value: any, index: number) => boolean): any {
    return this.items.find(callback);
  }

  /**
   * Find index of first item matching predicate
   */
  findIndex(callback: (value: any, index: number) => boolean): number {
    return this.items.findIndex(callback);
  }
}

/**
 * SK8Table - Key-value collection (like Map)
 */
export class SK8Table extends SK8Collection {
  private _entries: Map<string, any> = new Map();

  constructor(parent?: SK8Collection, name?: string, initialEntries?: [string, any][]) {
    super(parent, name || 'Table');

    if (initialEntries) {
      initialEntries.forEach(([key, value]) => {
        this._entries.set(key, value);
      });
    }

    // Define properties
    this.defineProperty('length', {
      getter: () => this.length(),
    });
  }

  // Collection protocol implementation
  length(): number {
    return this._entries.size;
  }

  item(key: string): any {
    return this._entries.get(key);
  }

  setItem(key: string, value: any): void {
    this._entries.set(key, value);
  }

  contains(value: any): boolean {
    for (const v of this._entries.values()) {
      if (v === value) return true;
    }
    return false;
  }

  clear(): void {
    this._entries.clear();
  }

  forEach(callback: (value: any, key: string) => void): void {
    this._entries.forEach(callback);
  }

  toArray(): [string, any][] {
    return Array.from(this._entries.entries());
  }

  // Table-specific methods

  /**
   * Check if key exists
   */
  hasKey(key: string): boolean {
    return this._entries.has(key);
  }

  /**
   * Remove entry by key
   */
  remove(key: string): boolean {
    return this._entries.delete(key);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this._entries.keys());
  }

  /**
   * Get all values
   */
  values(): any[] {
    return Array.from(this._entries.values());
  }

  /**
   * Get all entries as list of [key, value] pairs
   */
  entries(): [string, any][] {
    return Array.from(this._entries.entries());
  }

  /**
   * Map over entries
   */
  map(callback: (value: any, key: string) => any): SK8Table {
    const result = new SK8Table(this);
    this._entries.forEach((value, key) => {
      result.setItem(key, callback(value, key));
    });
    return result;
  }

  /**
   * Filter entries
   */
  filter(callback: (value: any, key: string) => boolean): SK8Table {
    const result = new SK8Table(this);
    this._entries.forEach((value, key) => {
      if (callback(value, key)) {
        result.setItem(key, value);
      }
    });
    return result;
  }

  /**
   * Find value matching predicate
   */
  find(callback: (value: any, key: string) => boolean): any {
    for (const [key, value] of this._entries.entries()) {
      if (callback(value, key)) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Find key for value matching predicate
   */
  findKey(callback: (value: any, key: string) => boolean): string | undefined {
    for (const [key, value] of this._entries.entries()) {
      if (callback(value, key)) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Merge with another table
   */
  merge(other: SK8Table): void {
    other.forEach((value, key) => {
      this.setItem(key, value);
    });
  }

  /**
   * Create a copy
   */
  clone(): SK8Table {
    return new SK8Table(this, undefined, this.toArray());
  }
}

/**
 * Helper functions for creating collections
 */
export function newList(...items: any[]): SK8List {
  return new SK8List(undefined, undefined, items);
}

export function newTable(entries?: Record<string, any>): SK8Table {
  if (entries) {
    return new SK8Table(undefined, undefined, Object.entries(entries));
  }
  return new SK8Table();
}

/**
 * Collection utilities
 */
export class CollectionUtils {
  /**
   * Create a list from an iterable
   */
  static fromIterable(iterable: Iterable<any>): SK8List {
    return new SK8List(undefined, undefined, Array.from(iterable));
  }

  /**
   * Create a table from an object
   */
  static fromObject(obj: Record<string, any>): SK8Table {
    return new SK8Table(undefined, undefined, Object.entries(obj));
  }

  /**
   * Create a range of numbers as a list
   */
  static range(start: number, end: number, step: number = 1): SK8List {
    const items: number[] = [];
    for (let i = start; i < end; i += step) {
      items.push(i);
    }
    return new SK8List(undefined, undefined, items);
  }

  /**
   * Repeat a value n times as a list
   */
  static repeat(value: any, count: number): SK8List {
    return new SK8List(undefined, undefined, Array(count).fill(value));
  }
}
