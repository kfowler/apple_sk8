/**
 * SK8Script Standard Library - Type and Conversion Functions
 *
 * Type checking and value conversion operations.
 */

import { requireArgs, typeValidators, StdLibError } from './stdlib.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Check if value is a number
 */
export const isNumber: BuiltInFunction = (...args: any[]) => {
  requireArgs('isNumber', args, 1, 1);
  return typeValidators.isNumber(args[0]);
};

/**
 * Check if value is a string
 */
export const isString: BuiltInFunction = (...args: any[]) => {
  requireArgs('isString', args, 1, 1);
  return typeValidators.isString(args[0]);
};

/**
 * Check if value is a boolean
 */
export const isBoolean: BuiltInFunction = (...args: any[]) => {
  requireArgs('isBoolean', args, 1, 1);
  return typeValidators.isBoolean(args[0]);
};

/**
 * Check if value is a list (array)
 */
export const isList: BuiltInFunction = (...args: any[]) => {
  requireArgs('isList', args, 1, 1);
  return typeValidators.isList(args[0]);
};

/**
 * Check if value is a table (object)
 */
export const isTable: BuiltInFunction = (...args: any[]) => {
  requireArgs('isTable', args, 1, 1);
  return typeValidators.isTable(args[0]);
};

/**
 * Check if value is an object (table or SK8Object)
 */
export const isObject: BuiltInFunction = (...args: any[]) => {
  requireArgs('isObject', args, 1, 1);
  return typeValidators.isObject(args[0]);
};

/**
 * Check if value is null
 */
export const isNull: BuiltInFunction = (...args: any[]) => {
  requireArgs('isNull', args, 1, 1);
  return typeValidators.isNull(args[0]);
};

/**
 * Check if value is undefined
 */
export const isUndefined: BuiltInFunction = (...args: any[]) => {
  requireArgs('isUndefined', args, 1, 1);
  return typeValidators.isUndefined(args[0]);
};

/**
 * Check if value is a function
 */
export const isFunction: BuiltInFunction = (...args: any[]) => {
  requireArgs('isFunction', args, 1, 1);
  return typeValidators.isFunction(args[0]);
};

/**
 * Get the type name of a value
 */
export const typeOf: BuiltInFunction = (...args: any[]) => {
  requireArgs('typeOf', args, 1, 1);
  const value = args[0];

  if (typeValidators.isNull(value)) return 'null';
  if (typeValidators.isUndefined(value)) return 'undefined';
  if (typeValidators.isNumber(value)) return 'number';
  if (typeValidators.isString(value)) return 'string';
  if (typeValidators.isBoolean(value)) return 'boolean';
  if (typeValidators.isList(value)) return 'list';
  if (typeValidators.isFunction(value)) return 'function';
  if (typeValidators.isTable(value)) return 'table';

  return 'object';
};

/**
 * Convert value to string
 */
export const toString: BuiltInFunction = (...args: any[]) => {
  requireArgs('toString', args, 1, 1);
  const value = args[0];

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeValidators.isString(value)) return value;
  if (typeValidators.isNumber(value)) return String(value);
  if (typeValidators.isBoolean(value)) return value ? 'true' : 'false';
  if (typeValidators.isList(value)) return JSON.stringify(value);
  if (typeValidators.isTable(value)) return JSON.stringify(value);

  return String(value);
};

/**
 * Convert value to number
 */
export const toNumber: BuiltInFunction = (...args: any[]) => {
  requireArgs('toNumber', args, 1, 1);
  const value = args[0];

  if (typeValidators.isNumber(value)) return value;
  if (typeValidators.isString(value)) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new StdLibError(`Cannot convert "${value}" to number`, 'toNumber');
    }
    return num;
  }
  if (typeValidators.isBoolean(value)) return value ? 1 : 0;
  if (value === null) return 0;

  throw new StdLibError(`Cannot convert ${typeof value} to number`, 'toNumber');
};

/**
 * Convert value to boolean
 */
export const toBoolean: BuiltInFunction = (...args: any[]) => {
  requireArgs('toBoolean', args, 1, 1);
  const value = args[0];

  if (typeValidators.isBoolean(value)) return value;
  if (value === null || value === undefined) return false;
  if (typeValidators.isNumber(value)) return value !== 0;
  if (typeValidators.isString(value)) return value.length > 0;
  if (typeValidators.isList(value)) return value.length > 0;

  return true;
};

/**
 * Parse JSON string
 */
export const parseJSON: BuiltInFunction = (...args: any[]) => {
  requireArgs('parseJSON', args, 1, 1);
  if (!typeValidators.isString(args[0])) {
    throw new StdLibError('Expected string', 'parseJSON');
  }

  try {
    return JSON.parse(args[0]);
  } catch (error) {
    throw new StdLibError(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      'parseJSON'
    );
  }
};

/**
 * Convert value to JSON string
 */
export const toJSON: BuiltInFunction = (...args: any[]) => {
  requireArgs('toJSON', args, 1, 2);

  const value = args[0];
  const indent = args.length === 2 ? args[1] : undefined;

  if (indent !== undefined && !typeValidators.isNumber(indent)) {
    throw new StdLibError('Indent must be a number', 'toJSON');
  }

  try {
    return JSON.stringify(value, null, indent);
  } catch (error) {
    throw new StdLibError(
      `Cannot convert to JSON: ${error instanceof Error ? error.message : String(error)}`,
      'toJSON'
    );
  }
};

/**
 * Parse integer from string
 */
export const parseInt: BuiltInFunction = (...args: any[]) => {
  requireArgs('parseInt', args, 1, 2);
  if (!typeValidators.isString(args[0]) && !typeValidators.isNumber(args[0])) {
    throw new StdLibError('Expected string or number', 'parseInt');
  }

  const radix = args.length === 2 ? args[1] : 10;
  if (!typeValidators.isNumber(radix)) {
    throw new StdLibError('Radix must be a number', 'parseInt');
  }

  const result = Number.parseInt(String(args[0]), radix);
  if (isNaN(result)) {
    throw new StdLibError(`Cannot parse "${args[0]}" as integer`, 'parseInt');
  }

  return result;
};

/**
 * Parse float from string
 */
export const parseFloat: BuiltInFunction = (...args: any[]) => {
  requireArgs('parseFloat', args, 1, 1);
  if (!typeValidators.isString(args[0]) && !typeValidators.isNumber(args[0])) {
    throw new StdLibError('Expected string or number', 'parseFloat');
  }

  const result = Number.parseFloat(String(args[0]));
  if (isNaN(result)) {
    throw new StdLibError(`Cannot parse "${args[0]}" as float`, 'parseFloat');
  }

  return result;
};

/**
 * All type and conversion functions
 */
export const typeFunctions: Record<string, BuiltInFunction> = {
  // Type checking
  isNumber,
  isString,
  isBoolean,
  isList,
  isTable,
  isObject,
  isNull,
  isUndefined,
  isFunction,
  typeOf,

  // Type conversion
  toString,
  toNumber,
  toBoolean,
  parseJSON,
  toJSON,
  parseInt,
  parseFloat,
};
