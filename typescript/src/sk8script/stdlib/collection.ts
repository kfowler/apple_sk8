/**
 * SK8Script Standard Library - Collection Functions
 *
 * Array/list and table (object) manipulation operations.
 */

import { requireArgs, requireType, typeValidators, StdLibError } from './stdlib.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Get first element of list
 */
export const first: BuiltInFunction = (...args: any[]) => {
  requireArgs('first', args, 1, 1);
  requireType('first', args[0], 'list', typeValidators.isList);

  if (args[0].length === 0) {
    throw new StdLibError('Cannot get first element of empty list', 'first');
  }
  return args[0][0];
};

/**
 * Get last element of list
 */
export const last: BuiltInFunction = (...args: any[]) => {
  requireArgs('last', args, 1, 1);
  requireType('last', args[0], 'list', typeValidators.isList);

  if (args[0].length === 0) {
    throw new StdLibError('Cannot get last element of empty list', 'last');
  }
  return args[0][args[0].length - 1];
};

/**
 * Get all elements except the first (rest)
 */
export const rest: BuiltInFunction = (...args: any[]) => {
  requireArgs('rest', args, 1, 1);
  requireType('rest', args[0], 'list', typeValidators.isList);

  if (args[0].length === 0) {
    return [];
  }
  return args[0].slice(1);
};

/**
 * Get all elements except the last
 */
export const butLast: BuiltInFunction = (...args: any[]) => {
  requireArgs('butLast', args, 1, 1);
  requireType('butLast', args[0], 'list', typeValidators.isList);

  if (args[0].length === 0) {
    return [];
  }
  return args[0].slice(0, -1);
};

/**
 * Add element to end of list (returns new list)
 */
export const append: BuiltInFunction = (...args: any[]) => {
  requireArgs('append', args, 2, 2);
  requireType('append', args[0], 'list', typeValidators.isList);

  return [...args[0], args[1]];
};

/**
 * Add element to start of list (returns new list)
 */
export const prepend: BuiltInFunction = (...args: any[]) => {
  requireArgs('prepend', args, 2, 2);
  requireType('prepend', args[0], 'list', typeValidators.isList);

  return [args[1], ...args[0]];
};

/**
 * Remove element at index (1-based, returns new list)
 */
export const removeAt: BuiltInFunction = (...args: any[]) => {
  requireArgs('removeAt', args, 2, 2);
  requireType('removeAt', args[0], 'list', typeValidators.isList);
  requireType('removeAt', args[1], 'number', typeValidators.isNumber);

  const index = args[1] - 1; // Convert to 0-based
  if (index < 0 || index >= args[0].length) {
    throw new StdLibError('Index out of bounds', 'removeAt');
  }

  return [...args[0].slice(0, index), ...args[0].slice(index + 1)];
};

/**
 * Insert element at index (1-based, returns new list)
 */
export const insertAt: BuiltInFunction = (...args: any[]) => {
  requireArgs('insertAt', args, 3, 3);
  requireType('insertAt', args[0], 'list', typeValidators.isList);
  requireType('insertAt', args[1], 'number', typeValidators.isNumber);

  const index = args[1] - 1; // Convert to 0-based
  if (index < 0 || index > args[0].length) {
    throw new StdLibError('Index out of bounds', 'insertAt');
  }

  return [...args[0].slice(0, index), args[2], ...args[0].slice(index)];
};

/**
 * Check if list contains element
 */
export const listContains: BuiltInFunction = (...args: any[]) => {
  requireArgs('listContains', args, 2, 2);
  requireType('listContains', args[0], 'list', typeValidators.isList);

  return args[0].includes(args[1]);
};

/**
 * Reverse a list (returns new list)
 */
export const reverse: BuiltInFunction = (...args: any[]) => {
  requireArgs('reverse', args, 1, 1);
  requireType('reverse', args[0], 'list', typeValidators.isList);

  return [...args[0]].reverse();
};

/**
 * Sort a list (returns new list)
 */
export const sort: BuiltInFunction = (...args: any[]) => {
  requireArgs('sort', args, 1, 1);
  requireType('sort', args[0], 'list', typeValidators.isList);

  return [...args[0]].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b));
  });
};

/**
 * Map function over list elements
 * Note: In SK8Script, you'd pass a handler name, but here we accept a function
 */
export const map: BuiltInFunction = (...args: any[]) => {
  requireArgs('map', args, 2, 2);
  requireType('map', args[0], 'list', typeValidators.isList);
  requireType('map', args[1], 'function', typeValidators.isFunction);

  return args[0].map(args[1]);
};

/**
 * Filter list by predicate function
 */
export const filter: BuiltInFunction = (...args: any[]) => {
  requireArgs('filter', args, 2, 2);
  requireType('filter', args[0], 'list', typeValidators.isList);
  requireType('filter', args[1], 'function', typeValidators.isFunction);

  return args[0].filter(args[1]);
};

/**
 * Reduce list to single value
 */
export const reduce: BuiltInFunction = (...args: any[]) => {
  requireArgs('reduce', args, 2, 3);
  requireType('reduce', args[0], 'list', typeValidators.isList);
  requireType('reduce', args[1], 'function', typeValidators.isFunction);

  if (args.length === 3) {
    return args[0].reduce(args[1], args[2]);
  }
  return args[0].reduce(args[1]);
};

/**
 * Get every nth element
 */
export const everyNth: BuiltInFunction = (...args: any[]) => {
  requireArgs('everyNth', args, 2, 2);
  requireType('everyNth', args[0], 'list', typeValidators.isList);
  requireType('everyNth', args[1], 'number', typeValidators.isNumber);

  const n = args[1];
  if (n <= 0) {
    throw new StdLibError('Step must be positive', 'everyNth');
  }

  return args[0].filter((_: any, i: number) => (i + 1) % n === 0);
};

/**
 * Create a range of numbers
 */
export const range: BuiltInFunction = (...args: any[]) => {
  requireArgs('range', args, 1, 3);

  let start = 1;
  let end = args[0];
  let step = 1;

  if (args.length === 2) {
    start = args[0];
    end = args[1];
  } else if (args.length === 3) {
    start = args[0];
    end = args[1];
    step = args[2];
  }

  requireType('range', start, 'number', typeValidators.isNumber);
  requireType('range', end, 'number', typeValidators.isNumber);
  requireType('range', step, 'number', typeValidators.isNumber);

  if (step === 0) {
    throw new StdLibError('Step cannot be zero', 'range');
  }

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i <= end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i >= end; i += step) {
      result.push(i);
    }
  }

  return result;
};

/**
 * Flatten nested lists by one level
 */
export const flatten: BuiltInFunction = (...args: any[]) => {
  requireArgs('flatten', args, 1, 1);
  requireType('flatten', args[0], 'list', typeValidators.isList);

  return args[0].flat(1);
};

/**
 * Flatten nested lists completely
 */
export const flattenDeep: BuiltInFunction = (...args: any[]) => {
  requireArgs('flattenDeep', args, 1, 1);
  requireType('flattenDeep', args[0], 'list', typeValidators.isList);

  return args[0].flat(Infinity);
};

/**
 * Get unique elements from list
 */
export const unique: BuiltInFunction = (...args: any[]) => {
  requireArgs('unique', args, 1, 1);
  requireType('unique', args[0], 'list', typeValidators.isList);

  return [...new Set(args[0])];
};

/**
 * Concatenate multiple lists
 */
export const concat: BuiltInFunction = (...args: any[]) => {
  requireArgs('concat', args, 1);
  for (const arg of args) {
    requireType('concat', arg, 'list', typeValidators.isList);
  }

  return args.flat(1);
};

/**
 * Get slice of list (1-based indexing)
 */
export const slice: BuiltInFunction = (...args: any[]) => {
  requireArgs('slice', args, 2, 3);
  requireType('slice', args[0], 'list', typeValidators.isList);
  requireType('slice', args[1], 'number', typeValidators.isNumber);

  const start = args[1] - 1; // Convert to 0-based

  if (args.length === 3) {
    requireType('slice', args[2], 'number', typeValidators.isNumber);
    const end = args[2];
    return args[0].slice(start, end);
  }

  return args[0].slice(start);
};

// Table (object) functions

/**
 * Get keys from table
 */
export const keys: BuiltInFunction = (...args: any[]) => {
  requireArgs('keys', args, 1, 1);
  requireType('keys', args[0], 'table', typeValidators.isTable);

  return Object.keys(args[0]);
};

/**
 * Get values from table
 */
export const values: BuiltInFunction = (...args: any[]) => {
  requireArgs('values', args, 1, 1);
  requireType('values', args[0], 'table', typeValidators.isTable);

  return Object.values(args[0]);
};

/**
 * Get entries from table (list of [key, value] pairs)
 */
export const entries: BuiltInFunction = (...args: any[]) => {
  requireArgs('entries', args, 1, 1);
  requireType('entries', args[0], 'table', typeValidators.isTable);

  return Object.entries(args[0]);
};

/**
 * Merge multiple tables (later tables override earlier ones)
 */
export const merge: BuiltInFunction = (...args: any[]) => {
  requireArgs('merge', args, 1);
  for (const arg of args) {
    requireType('merge', arg, 'table', typeValidators.isTable);
  }

  return Object.assign({}, ...args);
};

/**
 * Check if table has key
 */
export const hasKey: BuiltInFunction = (...args: any[]) => {
  requireArgs('hasKey', args, 2, 2);
  requireType('hasKey', args[0], 'table', typeValidators.isTable);
  requireType('hasKey', args[1], 'string', typeValidators.isString);

  return args[1] in args[0];
};

/**
 * All collection functions
 */
export const collectionFunctions: Record<string, BuiltInFunction> = {
  // List operations
  first,
  last,
  rest,
  butLast,
  append,
  prepend,
  removeAt,
  insertAt,
  listContains,
  reverse,
  sort,
  map,
  filter,
  reduce,
  everyNth,
  range,
  flatten,
  flattenDeep,
  unique,
  concat,
  slice,

  // Table operations
  keys,
  values,
  entries,
  merge,
  hasKey,
};
