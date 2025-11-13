/**
 * SK8Script Standard Library - Math Functions
 *
 * Mathematical operations, trigonometry, random numbers, and constants.
 */

import { requireArgs, requireType, typeValidators, StdLibError } from './stdlib.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Math constants
 */
export const PI = Math.PI;
export const E = Math.E;

/**
 * Absolute value
 */
export const abs: BuiltInFunction = (...args: any[]) => {
  requireArgs('abs', args, 1, 1);
  requireType('abs', args[0], 'number', typeValidators.isNumber);
  return Math.abs(args[0]);
};

/**
 * Round to nearest integer
 */
export const round: BuiltInFunction = (...args: any[]) => {
  requireArgs('round', args, 1, 1);
  requireType('round', args[0], 'number', typeValidators.isNumber);
  return Math.round(args[0]);
};

/**
 * Round down (floor)
 */
export const floor: BuiltInFunction = (...args: any[]) => {
  requireArgs('floor', args, 1, 1);
  requireType('floor', args[0], 'number', typeValidators.isNumber);
  return Math.floor(args[0]);
};

/**
 * Round up (ceiling)
 */
export const ceiling: BuiltInFunction = (...args: any[]) => {
  requireArgs('ceiling', args, 1, 1);
  requireType('ceiling', args[0], 'number', typeValidators.isNumber);
  return Math.ceil(args[0]);
};

/**
 * Square root
 */
export const sqrt: BuiltInFunction = (...args: any[]) => {
  requireArgs('sqrt', args, 1, 1);
  requireType('sqrt', args[0], 'number', typeValidators.isNumber);
  if (args[0] < 0) {
    throw new StdLibError('Cannot take square root of negative number', 'sqrt');
  }
  return Math.sqrt(args[0]);
};

/**
 * Power (x^y)
 */
export const power: BuiltInFunction = (...args: any[]) => {
  requireArgs('power', args, 2, 2);
  requireType('power', args[0], 'number', typeValidators.isNumber);
  requireType('power', args[1], 'number', typeValidators.isNumber);
  return Math.pow(args[0], args[1]);
};

/**
 * Minimum of numbers
 */
export const min: BuiltInFunction = (...args: any[]) => {
  requireArgs('min', args, 1);
  for (const arg of args) {
    requireType('min', arg, 'number', typeValidators.isNumber);
  }
  return Math.min(...args);
};

/**
 * Maximum of numbers
 */
export const max: BuiltInFunction = (...args: any[]) => {
  requireArgs('max', args, 1);
  for (const arg of args) {
    requireType('max', arg, 'number', typeValidators.isNumber);
  }
  return Math.max(...args);
};

/**
 * Sign of number (-1, 0, or 1)
 */
export const sign: BuiltInFunction = (...args: any[]) => {
  requireArgs('sign', args, 1, 1);
  requireType('sign', args[0], 'number', typeValidators.isNumber);
  return Math.sign(args[0]);
};

/**
 * Truncate (remove decimal part)
 */
export const trunc: BuiltInFunction = (...args: any[]) => {
  requireArgs('trunc', args, 1, 1);
  requireType('trunc', args[0], 'number', typeValidators.isNumber);
  return Math.trunc(args[0]);
};

// Trigonometric functions (radians)

/**
 * Sine (radians)
 */
export const sin: BuiltInFunction = (...args: any[]) => {
  requireArgs('sin', args, 1, 1);
  requireType('sin', args[0], 'number', typeValidators.isNumber);
  return Math.sin(args[0]);
};

/**
 * Cosine (radians)
 */
export const cos: BuiltInFunction = (...args: any[]) => {
  requireArgs('cos', args, 1, 1);
  requireType('cos', args[0], 'number', typeValidators.isNumber);
  return Math.cos(args[0]);
};

/**
 * Tangent (radians)
 */
export const tan: BuiltInFunction = (...args: any[]) => {
  requireArgs('tan', args, 1, 1);
  requireType('tan', args[0], 'number', typeValidators.isNumber);
  return Math.tan(args[0]);
};

/**
 * Arc sine (returns radians)
 */
export const asin: BuiltInFunction = (...args: any[]) => {
  requireArgs('asin', args, 1, 1);
  requireType('asin', args[0], 'number', typeValidators.isNumber);
  if (args[0] < -1 || args[0] > 1) {
    throw new StdLibError('asin argument must be between -1 and 1', 'asin');
  }
  return Math.asin(args[0]);
};

/**
 * Arc cosine (returns radians)
 */
export const acos: BuiltInFunction = (...args: any[]) => {
  requireArgs('acos', args, 1, 1);
  requireType('acos', args[0], 'number', typeValidators.isNumber);
  if (args[0] < -1 || args[0] > 1) {
    throw new StdLibError('acos argument must be between -1 and 1', 'acos');
  }
  return Math.acos(args[0]);
};

/**
 * Arc tangent (returns radians)
 */
export const atan: BuiltInFunction = (...args: any[]) => {
  requireArgs('atan', args, 1, 1);
  requireType('atan', args[0], 'number', typeValidators.isNumber);
  return Math.atan(args[0]);
};

/**
 * Arc tangent of y/x (returns radians)
 */
export const atan2: BuiltInFunction = (...args: any[]) => {
  requireArgs('atan2', args, 2, 2);
  requireType('atan2', args[0], 'number', typeValidators.isNumber);
  requireType('atan2', args[1], 'number', typeValidators.isNumber);
  return Math.atan2(args[0], args[1]);
};

// Degree conversions

/**
 * Convert radians to degrees
 */
export const radiansToDegrees: BuiltInFunction = (...args: any[]) => {
  requireArgs('radiansToDegrees', args, 1, 1);
  requireType('radiansToDegrees', args[0], 'number', typeValidators.isNumber);
  return (args[0] * 180) / Math.PI;
};

/**
 * Convert degrees to radians
 */
export const degreesToRadians: BuiltInFunction = (...args: any[]) => {
  requireArgs('degreesToRadians', args, 1, 1);
  requireType('degreesToRadians', args[0], 'number', typeValidators.isNumber);
  return (args[0] * Math.PI) / 180;
};

// Random functions

/**
 * Random number between 0 (inclusive) and 1 (exclusive)
 */
export const random: BuiltInFunction = (...args: any[]) => {
  requireArgs('random', args, 0, 0);
  return Math.random();
};

/**
 * Random number between min and max (inclusive)
 */
export const randomBetween: BuiltInFunction = (...args: any[]) => {
  requireArgs('randomBetween', args, 2, 2);
  requireType('randomBetween', args[0], 'number', typeValidators.isNumber);
  requireType('randomBetween', args[1], 'number', typeValidators.isNumber);
  const min = args[0];
  const max = args[1];
  return Math.random() * (max - min) + min;
};

/**
 * Random integer between min and max (inclusive)
 */
export const randomInt: BuiltInFunction = (...args: any[]) => {
  requireArgs('randomInt', args, 2, 2);
  requireType('randomInt', args[0], 'number', typeValidators.isNumber);
  requireType('randomInt', args[1], 'number', typeValidators.isNumber);
  const min = Math.ceil(args[0]);
  const max = Math.floor(args[1]);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Logarithmic and exponential

/**
 * Natural logarithm (base e)
 */
export const ln: BuiltInFunction = (...args: any[]) => {
  requireArgs('ln', args, 1, 1);
  requireType('ln', args[0], 'number', typeValidators.isNumber);
  if (args[0] <= 0) {
    throw new StdLibError('ln argument must be positive', 'ln');
  }
  return Math.log(args[0]);
};

/**
 * Logarithm base 10
 */
export const log10: BuiltInFunction = (...args: any[]) => {
  requireArgs('log10', args, 1, 1);
  requireType('log10', args[0], 'number', typeValidators.isNumber);
  if (args[0] <= 0) {
    throw new StdLibError('log10 argument must be positive', 'log10');
  }
  return Math.log10(args[0]);
};

/**
 * Exponential (e^x)
 */
export const exp: BuiltInFunction = (...args: any[]) => {
  requireArgs('exp', args, 1, 1);
  requireType('exp', args[0], 'number', typeValidators.isNumber);
  return Math.exp(args[0]);
};

/**
 * All math functions
 */
export const mathFunctions: Record<string, BuiltInFunction> = {
  // Constants (wrapped as functions)
  pi: () => PI,
  e: () => E,

  // Basic math
  abs,
  round,
  floor,
  ceiling,
  sqrt,
  power,
  min,
  max,
  sign,
  trunc,

  // Trigonometry
  sin,
  cos,
  tan,
  asin,
  acos,
  atan,
  atan2,

  // Degree conversion
  radiansToDegrees,
  degreesToRadians,

  // Random
  random,
  randomBetween,
  randomInt,

  // Logarithmic
  ln,
  log10,
  exp,
};
