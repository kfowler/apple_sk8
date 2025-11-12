/**
 * SK8Object - Core object system
 *
 * Implements SK8's prototype-based inheritance and property system.
 * Similar to the original Macframes II object system.
 */

export type PropertyValue = any;

export type HandlerFunction = (...args: any[]) => any;

export interface PropertyDescriptor {
  value?: PropertyValue;
  getter?: () => PropertyValue;
  setter?: (value: PropertyValue) => void;
  propagate?: boolean;
}

/**
 * SK8Object is the root of all SK8 objects.
 *
 * Features:
 * - Prototype-based inheritance (like JavaScript, but explicit)
 * - Property system with getters/setters
 * - Property propagation up the prototype chain
 * - Handler (method) system
 */
export class SK8Object {
  private parent: SK8Object | null = null;
  private properties = new Map<string, PropertyDescriptor>();
  private handlers = new Map<string, HandlerFunction>();
  protected objectName: string;

  constructor(parent?: SK8Object | null, name?: string) {
    this.parent = parent || null;
    this.objectName = name || this.constructor.name;
  }

  /**
   * Get the parent object in the prototype chain
   */
  getParent(): SK8Object | null {
    return this.parent;
  }

  /**
   * Set the parent object (change prototype)
   */
  setParent(parent: SK8Object | null): void {
    this.parent = parent;
  }

  /**
   * Get a property value, walking up the prototype chain if needed
   */
  get(propertyName: string): PropertyValue {
    const descriptor = this.properties.get(propertyName);

    if (descriptor) {
      // If it has a getter, call it
      if (descriptor.getter) {
        return descriptor.getter();
      }
      // Otherwise return the value
      return descriptor.value;
    }

    // Walk up the prototype chain
    if (this.parent) {
      return this.parent.get(propertyName);
    }

    // Property not found
    return undefined;
  }

  /**
   * Set a property value
   */
  set(propertyName: string, value: PropertyValue, propagate: boolean = false): void {
    const descriptor = this.properties.get(propertyName);

    if (descriptor?.setter) {
      // Use custom setter if defined
      descriptor.setter(value);
    } else {
      // Store the value
      this.properties.set(propertyName, {
        value,
        propagate,
      });
    }

    // Propagate to children if requested
    if (propagate) {
      // In a full implementation, we'd track children
      // For now, this is a placeholder
    }
  }

  /**
   * Check if this object has a property (locally, not inherited)
   */
  hasOwnProperty(propertyName: string): boolean {
    return this.properties.has(propertyName);
  }

  /**
   * Check if this object has a property (including inherited)
   */
  hasProperty(propertyName: string): boolean {
    if (this.properties.has(propertyName)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasProperty(propertyName);
    }
    return false;
  }

  /**
   * Define a property with a getter/setter
   */
  defineProperty(propertyName: string, descriptor: PropertyDescriptor): void {
    this.properties.set(propertyName, descriptor);
  }

  /**
   * Get all own property names (not inherited)
   */
  getOwnPropertyNames(): string[] {
    return Array.from(this.properties.keys());
  }

  /**
   * Get all property names (including inherited)
   */
  getPropertyNames(): string[] {
    const names = new Set<string>(this.getOwnPropertyNames());

    if (this.parent) {
      this.parent.getPropertyNames().forEach((name) => names.add(name));
    }

    return Array.from(names);
  }

  /**
   * Add a handler (method)
   */
  addHandler(name: string, handler: HandlerFunction): void {
    this.handlers.set(name, handler);
  }

  /**
   * Call a handler, walking up the prototype chain if needed
   */
  callHandler(name: string, ...args: any[]): any {
    const handler = this.handlers.get(name);

    if (handler) {
      return handler.apply(this, args);
    }

    // Walk up the prototype chain
    if (this.parent) {
      return this.parent.callHandler(name, ...args);
    }

    throw new Error(`Handler '${name}' not found on ${this.objectName}`);
  }

  /**
   * Check if a handler exists
   */
  hasHandler(name: string): boolean {
    if (this.handlers.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasHandler(name);
    }
    return false;
  }

  /**
   * Clone this object (create a new object with this as parent)
   */
  clone(name?: string): SK8Object {
    return new SK8Object(this, name);
  }

  /**
   * Get the object name
   */
  getName(): string {
    return this.objectName;
  }

  /**
   * Set the object name
   */
  setName(name: string): void {
    this.objectName = name;
  }

  /**
   * String representation
   */
  toString(): string {
    return `<${this.objectName}>`;
  }

  /**
   * Inspect the object (for debugging)
   */
  inspect(): object {
    return {
      name: this.objectName,
      parent: this.parent?.getName(),
      properties: Object.fromEntries(
        Array.from(this.properties.entries()).map(([k, v]) => [k, v.value ?? '<computed>'])
      ),
      handlers: Array.from(this.handlers.keys()),
    };
  }
}

/**
 * Helper function to create a new SK8 object
 */
export function newSK8Object(parent?: SK8Object, name?: string): SK8Object {
  return new SK8Object(parent, name);
}
