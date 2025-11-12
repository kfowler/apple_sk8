/**
 * SK8Object - Core object system
 *
 * Implements SK8's prototype-based inheritance and property system.
 * Similar to the original Macframes II object system.
 */

export type PropertyValue = any;

export type HandlerFunction = (...args: any[]) => any;

export type PropertyValidator = (value: PropertyValue) => boolean | string;
export type PropertyObserver = (newValue: PropertyValue, oldValue: PropertyValue) => void;

export interface PropertyMetadata {
  type?: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

export interface PropertyDescriptor {
  value?: PropertyValue;
  getter?: () => PropertyValue;
  setter?: (value: PropertyValue) => void;
  propagate?: boolean;
  computed?: boolean;
  dependencies?: string[];
  validator?: PropertyValidator;
  metadata?: PropertyMetadata;
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
  private observers = new Map<string, Set<PropertyObserver>>();
  private computedCache = new Map<string, PropertyValue>();
  private isComputingProperty = new Set<string>();
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
      // Handle computed properties
      if (descriptor.computed && descriptor.getter) {
        // Check for circular dependencies
        if (this.isComputingProperty.has(propertyName)) {
          throw new Error(`Circular dependency detected in computed property '${propertyName}'`);
        }

        // Check if we have a cached value
        if (this.computedCache.has(propertyName)) {
          return this.computedCache.get(propertyName);
        }

        // Compute the value
        this.isComputingProperty.add(propertyName);
        try {
          const value = descriptor.getter.call(this);
          this.computedCache.set(propertyName, value);
          return value;
        } finally {
          this.isComputingProperty.delete(propertyName);
        }
      }

      // If it has a getter, call it
      if (descriptor.getter) {
        return descriptor.getter.call(this);
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

    // Validate the value if a validator is defined
    if (descriptor?.validator) {
      const result = descriptor.validator(value);
      if (result === false) {
        throw new Error(`Validation failed for property '${propertyName}'`);
      }
      if (typeof result === 'string') {
        throw new Error(`Validation failed for property '${propertyName}': ${result}`);
      }
    }

    // Get old value for observers
    const oldValue = this.get(propertyName);

    if (descriptor?.setter) {
      // Use custom setter if defined
      descriptor.setter.call(this, value);
    } else {
      // Store the value
      this.properties.set(propertyName, {
        ...descriptor,
        value,
        propagate,
      });
    }

    // Invalidate computed properties that depend on this property
    this.invalidateDependentProperties(propertyName);

    // Notify observers
    this.notifyObservers(propertyName, value, oldValue);

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
   * Add a property observer
   */
  addPropertyObserver(propertyName: string, observer: PropertyObserver): void {
    if (!this.observers.has(propertyName)) {
      this.observers.set(propertyName, new Set());
    }
    this.observers.get(propertyName)!.add(observer);
  }

  /**
   * Remove a property observer
   */
  removePropertyObserver(propertyName: string, observer: PropertyObserver): void {
    const propertyObservers = this.observers.get(propertyName);
    if (propertyObservers) {
      propertyObservers.delete(observer);
      if (propertyObservers.size === 0) {
        this.observers.delete(propertyName);
      }
    }
  }

  /**
   * Notify observers of a property change
   */
  private notifyObservers(
    propertyName: string,
    newValue: PropertyValue,
    oldValue: PropertyValue
  ): void {
    const propertyObservers = this.observers.get(propertyName);
    if (propertyObservers) {
      propertyObservers.forEach((observer) => {
        observer(newValue, oldValue);
      });
    }
  }

  /**
   * Invalidate computed properties that depend on the given property
   */
  private invalidateDependentProperties(propertyName: string): void {
    // Find all computed properties that depend on this property
    const toInvalidate: string[] = [];

    for (const [key, descriptor] of this.properties.entries()) {
      if (descriptor.computed && descriptor.dependencies?.includes(propertyName)) {
        // Clear the cache for this computed property
        if (this.computedCache.has(key)) {
          this.computedCache.delete(key);
          toInvalidate.push(key);
        }
      }
    }

    // Recursively invalidate properties that depend on the properties we just invalidated
    for (const key of toInvalidate) {
      this.invalidateDependentProperties(key);
    }
  }

  /**
   * Get metadata for a property
   */
  getPropertyMetadata(propertyName: string): PropertyMetadata | undefined {
    const descriptor = this.properties.get(propertyName);
    return descriptor?.metadata;
  }

  /**
   * Get metadata for all properties
   */
  getAllPropertiesMetadata(): Record<string, PropertyMetadata> {
    const result: Record<string, PropertyMetadata> = {};
    for (const [key, descriptor] of this.properties.entries()) {
      if (descriptor.metadata) {
        result[key] = descriptor.metadata;
      }
    }
    return result;
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
