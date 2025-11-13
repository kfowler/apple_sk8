/**
 * SK8Script Standard Library - String Functions
 *
 * String manipulation, searching, and formatting operations.
 */

import { requireArgs, requireType, typeValidators, StdLibError } from './stdlib.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Get string length
 */
export const length: BuiltInFunction = (...args: any[]) => {
  requireArgs('length', args, 1, 1);
  if (typeValidators.isString(args[0])) {
    return args[0].length;
  }
  if (typeValidators.isList(args[0])) {
    return args[0].length;
  }
  throw new StdLibError('Expected string or list', 'length');
};

/**
 * Extract substring
 */
export const substring: BuiltInFunction = (...args: any[]) => {
  requireArgs('substring', args, 2, 3);
  requireType('substring', args[0], 'string', typeValidators.isString);
  requireType('substring', args[1], 'number', typeValidators.isNumber);

  const str = args[0];
  const start = Math.max(0, args[1] - 1); // SK8 uses 1-based indexing

  if (args.length === 3) {
    requireType('substring', args[2], 'number', typeValidators.isNumber);
    const end = args[2];
    return str.substring(start, end);
  }

  return str.substring(start);
};

/**
 * Find index of substring (returns 1-based index, 0 if not found)
 */
export const indexOf: BuiltInFunction = (...args: any[]) => {
  requireArgs('indexOf', args, 2, 2);
  requireType('indexOf', args[0], 'string', typeValidators.isString);
  requireType('indexOf', args[1], 'string', typeValidators.isString);

  const index = args[0].indexOf(args[1]);
  return index === -1 ? 0 : index + 1; // SK8 uses 1-based indexing
};

/**
 * Find last index of substring (returns 1-based index, 0 if not found)
 */
export const lastIndexOf: BuiltInFunction = (...args: any[]) => {
  requireArgs('lastIndexOf', args, 2, 2);
  requireType('lastIndexOf', args[0], 'string', typeValidators.isString);
  requireType('lastIndexOf', args[1], 'string', typeValidators.isString);

  const index = args[0].lastIndexOf(args[1]);
  return index === -1 ? 0 : index + 1;
};

/**
 * Convert to lowercase
 */
export const toLowerCase: BuiltInFunction = (...args: any[]) => {
  requireArgs('toLowerCase', args, 1, 1);
  requireType('toLowerCase', args[0], 'string', typeValidators.isString);
  return args[0].toLowerCase();
};

/**
 * Convert to uppercase
 */
export const toUpperCase: BuiltInFunction = (...args: any[]) => {
  requireArgs('toUpperCase', args, 1, 1);
  requireType('toUpperCase', args[0], 'string', typeValidators.isString);
  return args[0].toUpperCase();
};

/**
 * Split string by delimiter
 */
export const split: BuiltInFunction = (...args: any[]) => {
  requireArgs('split', args, 2, 2);
  requireType('split', args[0], 'string', typeValidators.isString);
  requireType('split', args[1], 'string', typeValidators.isString);
  return args[0].split(args[1]);
};

/**
 * Join array elements into string
 */
export const join: BuiltInFunction = (...args: any[]) => {
  requireArgs('join', args, 2, 2);
  requireType('join', args[0], 'list', typeValidators.isList);
  requireType('join', args[1], 'string', typeValidators.isString);
  return args[0].join(args[1]);
};

/**
 * Trim whitespace from both ends
 */
export const trim: BuiltInFunction = (...args: any[]) => {
  requireArgs('trim', args, 1, 1);
  requireType('trim', args[0], 'string', typeValidators.isString);
  return args[0].trim();
};

/**
 * Trim whitespace from start
 */
export const trimStart: BuiltInFunction = (...args: any[]) => {
  requireArgs('trimStart', args, 1, 1);
  requireType('trimStart', args[0], 'string', typeValidators.isString);
  return args[0].trimStart();
};

/**
 * Trim whitespace from end
 */
export const trimEnd: BuiltInFunction = (...args: any[]) => {
  requireArgs('trimEnd', args, 1, 1);
  requireType('trimEnd', args[0], 'string', typeValidators.isString);
  return args[0].trimEnd();
};

/**
 * Replace first occurrence
 */
export const replace: BuiltInFunction = (...args: any[]) => {
  requireArgs('replace', args, 3, 3);
  requireType('replace', args[0], 'string', typeValidators.isString);
  requireType('replace', args[1], 'string', typeValidators.isString);
  requireType('replace', args[2], 'string', typeValidators.isString);
  return args[0].replace(args[1], args[2]);
};

/**
 * Replace all occurrences
 */
export const replaceAll: BuiltInFunction = (...args: any[]) => {
  requireArgs('replaceAll', args, 3, 3);
  requireType('replaceAll', args[0], 'string', typeValidators.isString);
  requireType('replaceAll', args[1], 'string', typeValidators.isString);
  requireType('replaceAll', args[2], 'string', typeValidators.isString);
  return args[0].replaceAll(args[1], args[2]);
};

/**
 * Get character at position (1-based)
 */
export const charAt: BuiltInFunction = (...args: any[]) => {
  requireArgs('charAt', args, 2, 2);
  requireType('charAt', args[0], 'string', typeValidators.isString);
  requireType('charAt', args[1], 'number', typeValidators.isNumber);

  const index = args[1] - 1; // Convert to 0-based
  if (index < 0 || index >= args[0].length) {
    throw new StdLibError('Index out of bounds', 'charAt');
  }
  return args[0].charAt(index);
};

/**
 * Get character code at position (1-based)
 */
export const charCodeAt: BuiltInFunction = (...args: any[]) => {
  requireArgs('charCodeAt', args, 2, 2);
  requireType('charCodeAt', args[0], 'string', typeValidators.isString);
  requireType('charCodeAt', args[1], 'number', typeValidators.isNumber);

  const index = args[1] - 1; // Convert to 0-based
  if (index < 0 || index >= args[0].length) {
    throw new StdLibError('Index out of bounds', 'charCodeAt');
  }
  return args[0].charCodeAt(index);
};

/**
 * Create string from character code
 */
export const fromCharCode: BuiltInFunction = (...args: any[]) => {
  requireArgs('fromCharCode', args, 1);
  for (const arg of args) {
    requireType('fromCharCode', arg, 'number', typeValidators.isNumber);
  }
  return String.fromCharCode(...args);
};

/**
 * Check if string starts with substring
 */
export const startsWith: BuiltInFunction = (...args: any[]) => {
  requireArgs('startsWith', args, 2, 2);
  requireType('startsWith', args[0], 'string', typeValidators.isString);
  requireType('startsWith', args[1], 'string', typeValidators.isString);
  return args[0].startsWith(args[1]);
};

/**
 * Check if string ends with substring
 */
export const endsWith: BuiltInFunction = (...args: any[]) => {
  requireArgs('endsWith', args, 2, 2);
  requireType('endsWith', args[0], 'string', typeValidators.isString);
  requireType('endsWith', args[1], 'string', typeValidators.isString);
  return args[0].endsWith(args[1]);
};

/**
 * Check if string contains substring
 */
export const contains: BuiltInFunction = (...args: any[]) => {
  requireArgs('contains', args, 2, 2);
  requireType('contains', args[0], 'string', typeValidators.isString);
  requireType('contains', args[1], 'string', typeValidators.isString);
  return args[0].includes(args[1]);
};

/**
 * Repeat string n times
 */
export const repeatString: BuiltInFunction = (...args: any[]) => {
  requireArgs('repeatString', args, 2, 2);
  requireType('repeatString', args[0], 'string', typeValidators.isString);
  requireType('repeatString', args[1], 'number', typeValidators.isNumber);

  if (args[1] < 0) {
    throw new StdLibError('Repeat count must be non-negative', 'repeatString');
  }
  return args[0].repeat(args[1]);
};

/**
 * Pad string at start
 */
export const padStart: BuiltInFunction = (...args: any[]) => {
  requireArgs('padStart', args, 2, 3);
  requireType('padStart', args[0], 'string', typeValidators.isString);
  requireType('padStart', args[1], 'number', typeValidators.isNumber);

  const fillString = args.length === 3 ? args[2] : ' ';
  requireType('padStart', fillString, 'string', typeValidators.isString);

  return args[0].padStart(args[1], fillString);
};

/**
 * Pad string at end
 */
export const padEnd: BuiltInFunction = (...args: any[]) => {
  requireArgs('padEnd', args, 2, 3);
  requireType('padEnd', args[0], 'string', typeValidators.isString);
  requireType('padEnd', args[1], 'number', typeValidators.isNumber);

  const fillString = args.length === 3 ? args[2] : ' ';
  requireType('padEnd', fillString, 'string', typeValidators.isString);

  return args[0].padEnd(args[1], fillString);
};

/**
 * All string functions
 */
export const stringFunctions: Record<string, BuiltInFunction> = {
  length,
  substring,
  indexOf,
  lastIndexOf,
  toLowerCase,
  toUpperCase,
  split,
  join,
  trim,
  trimStart,
  trimEnd,
  replace,
  replaceAll,
  charAt,
  charCodeAt,
  fromCharCode,
  startsWith,
  endsWith,
  contains,
  repeatString,
  padStart,
  padEnd,
};
