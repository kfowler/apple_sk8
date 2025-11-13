/**
 * SK8Script Standard Library - Object/Actor Functions
 *
 * Object creation, manipulation, and introspection for SK8Objects.
 */

import { requireArgs, requireType, typeValidators, StdLibError } from './stdlib.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Create a new empty object (table)
 */
export const newObject: BuiltInFunction = (...args: any[]) => {
  requireArgs('newObject', args, 0, 1);

  if (args.length === 0) {
    return {};
  }

  // If passed a prototype object, create a new object with that prototype
  requireType('newObject', args[0], 'table', typeValidators.isTable);
  return Object.create(args[0]);
};

/**
 * Clone an object (shallow copy)
 */
export const clone: BuiltInFunction = (...args: any[]) => {
  requireArgs('clone', args, 1, 1);

  const value = args[0];

  if (typeValidators.isList(value)) {
    return [...value];
  }

  if (typeValidators.isTable(value)) {
    return { ...value };
  }

  // Primitive values are immutable, so just return them
  return value;
};

/**
 * Deep clone an object
 */
export const deepClone: BuiltInFunction = (...args: any[]) => {
  requireArgs('deepClone', args, 1, 1);

  const deepCopy = (val: any): any => {
    if (val === null || val === undefined) return val;
    if (typeValidators.isNumber(val)) return val;
    if (typeValidators.isString(val)) return val;
    if (typeValidators.isBoolean(val)) return val;
    if (typeValidators.isFunction(val)) return val;

    if (typeValidators.isList(val)) {
      return val.map((item: any) => deepCopy(item));
    }

    if (typeValidators.isTable(val)) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(val)) {
        result[key] = deepCopy(value);
      }
      return result;
    }

    return val;
  };

  return deepCopy(args[0]);
};

/**
 * Get property value from object
 */
export const getProperty: BuiltInFunction = (...args: any[]) => {
  requireArgs('getProperty', args, 2, 2);
  requireType('getProperty', args[1], 'string', typeValidators.isString);

  const obj = args[0];
  const propertyName = args[1];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'getProperty');
  }

  // Check if it's an SK8Object with getProperty method
  if (typeof obj.getProperty === 'function') {
    return obj.getProperty(propertyName);
  }

  return obj[propertyName];
};

/**
 * Set property value on object
 */
export const setProperty: BuiltInFunction = (...args: any[]) => {
  requireArgs('setProperty', args, 3, 3);
  requireType('setProperty', args[1], 'string', typeValidators.isString);

  const obj = args[0];
  const propertyName = args[1];
  const value = args[2];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'setProperty');
  }

  // Check if it's an SK8Object with setProperty method
  if (typeof obj.setProperty === 'function') {
    obj.setProperty(propertyName, value);
  } else {
    obj[propertyName] = value;
  }

  return value;
};

/**
 * Get all property names of an object
 */
export const propertiesOf: BuiltInFunction = (...args: any[]) => {
  requireArgs('propertiesOf', args, 1, 1);

  const obj = args[0];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'propertiesOf');
  }

  // Check if it's an SK8Object with getPropertyNames method
  if (typeof obj.getPropertyNames === 'function') {
    return obj.getPropertyNames();
  }

  return Object.keys(obj);
};

/**
 * Check if object has property
 */
export const hasProperty: BuiltInFunction = (...args: any[]) => {
  requireArgs('hasProperty', args, 2, 2);
  requireType('hasProperty', args[1], 'string', typeValidators.isString);

  const obj = args[0];
  const propertyName = args[1];

  if (!typeValidators.isObject(obj)) {
    return false;
  }

  // Check if it's an SK8Object with hasProperty method
  if (typeof obj.hasProperty === 'function') {
    return obj.hasProperty(propertyName);
  }

  return propertyName in obj;
};

/**
 * Delete property from object
 */
export const deleteProperty: BuiltInFunction = (...args: any[]) => {
  requireArgs('deleteProperty', args, 2, 2);
  requireType('deleteProperty', args[1], 'string', typeValidators.isString);

  const obj = args[0];
  const propertyName = args[1];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'deleteProperty');
  }

  // Check if it's an SK8Object
  if (typeof obj.removeProperty === 'function') {
    obj.removeProperty(propertyName);
  } else {
    delete obj[propertyName];
  }

  return null;
};

/**
 * Get parent/prototype of object
 */
export const parentOf: BuiltInFunction = (...args: any[]) => {
  requireArgs('parentOf', args, 1, 1);

  const obj = args[0];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'parentOf');
  }

  // Check if it's an SK8Object with parent property
  if ('parent' in obj && obj.parent !== undefined) {
    return obj.parent;
  }

  // Return JavaScript prototype
  return Object.getPrototypeOf(obj);
};

/**
 * Get all handler/method names of an object
 */
export const handlersOf: BuiltInFunction = (...args: any[]) => {
  requireArgs('handlersOf', args, 1, 1);

  const obj = args[0];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'handlersOf');
  }

  // Check if it's an SK8Object with getHandlers method
  if (typeof obj.getHandlers === 'function') {
    return obj.getHandlers();
  }

  // Return all function properties
  const handlers: string[] = [];
  for (const key in obj) {
    if (typeValidators.isFunction(obj[key])) {
      handlers.push(key);
    }
  }

  return handlers;
};

/**
 * Call a handler/method on an object
 */
export const callHandler: BuiltInFunction = (...args: any[]) => {
  requireArgs('callHandler', args, 2);

  const obj = args[0];
  const handlerName = args[1];
  const handlerArgs = args.slice(2);

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'callHandler');
  }

  requireType('callHandler', handlerName, 'string', typeValidators.isString);

  // Check if it's an SK8Object with callHandler method
  if (typeof obj.callHandler === 'function') {
    return obj.callHandler(handlerName, ...handlerArgs);
  }

  // Call the method directly
  const handler = obj[handlerName];
  if (!typeValidators.isFunction(handler)) {
    throw new StdLibError(`Handler "${handlerName}" is not a function`, 'callHandler');
  }

  return handler.apply(obj, handlerArgs);
};

/**
 * Add a handler/method to an object
 */
export const addHandler: BuiltInFunction = (...args: any[]) => {
  requireArgs('addHandler', args, 3, 3);

  const obj = args[0];
  const handlerName = args[1];
  const handler = args[2];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'addHandler');
  }

  requireType('addHandler', handlerName, 'string', typeValidators.isString);
  requireType('addHandler', handler, 'function', typeValidators.isFunction);

  // Check if it's an SK8Object with addHandler method
  if (typeof obj.addHandler === 'function') {
    obj.addHandler(handlerName, handler);
  } else {
    obj[handlerName] = handler;
  }

  return null;
};

/**
 * Remove a handler/method from an object
 */
export const removeHandler: BuiltInFunction = (...args: any[]) => {
  requireArgs('removeHandler', args, 2, 2);

  const obj = args[0];
  const handlerName = args[1];

  if (!typeValidators.isObject(obj)) {
    throw new StdLibError('Expected object', 'removeHandler');
  }

  requireType('removeHandler', handlerName, 'string', typeValidators.isString);

  // Check if it's an SK8Object with removeHandler method
  if (typeof obj.removeHandler === 'function') {
    obj.removeHandler(handlerName);
  } else {
    delete obj[handlerName];
  }

  return null;
};

/**
 * Freeze an object (make it immutable)
 */
export const freeze: BuiltInFunction = (...args: any[]) => {
  requireArgs('freeze', args, 1, 1);

  if (!typeValidators.isObject(args[0])) {
    throw new StdLibError('Expected object', 'freeze');
  }

  return Object.freeze(args[0]);
};

/**
 * Check if object is frozen
 */
export const isFrozen: BuiltInFunction = (...args: any[]) => {
  requireArgs('isFrozen', args, 1, 1);

  if (!typeValidators.isObject(args[0])) {
    return true; // Primitives are immutable
  }

  return Object.isFrozen(args[0]);
};

/**
 * Seal an object (prevent adding/removing properties)
 */
export const seal: BuiltInFunction = (...args: any[]) => {
  requireArgs('seal', args, 1, 1);

  if (!typeValidators.isObject(args[0])) {
    throw new StdLibError('Expected object', 'seal');
  }

  return Object.seal(args[0]);
};

/**
 * Check if object is sealed
 */
export const isSealed: BuiltInFunction = (...args: any[]) => {
  requireArgs('isSealed', args, 1, 1);

  if (!typeValidators.isObject(args[0])) {
    return true;
  }

  return Object.isSealed(args[0]);
};

/**
 * All object/actor functions
 */
export const objectFunctions: Record<string, BuiltInFunction> = {
  newObject,
  clone,
  deepClone,
  getProperty,
  setProperty,
  propertiesOf,
  hasProperty,
  deleteProperty,
  parentOf,
  handlersOf,
  callHandler,
  addHandler,
  removeHandler,
  freeze,
  isFrozen,
  seal,
  isSealed,
};
