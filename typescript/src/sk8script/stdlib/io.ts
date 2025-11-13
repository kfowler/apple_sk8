/**
 * SK8Script Standard Library - I/O and Debugging Functions
 *
 * Console output, browser dialogs, and debugging utilities.
 */

import { requireArgs, typeValidators } from './stdlib.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Print to console (console.log)
 */
export const print: BuiltInFunction = (...args: any[]) => {
  console.log(...args);
  return args.length === 1 ? args[0] : args;
};

/**
 * Log to console (console.log) - alias for print
 */
export const log: BuiltInFunction = (...args: any[]) => {
  console.log(...args);
  return args.length === 1 ? args[0] : args;
};

/**
 * Warning message (console.warn)
 */
export const warn: BuiltInFunction = (...args: any[]) => {
  console.warn(...args);
  return args.length === 1 ? args[0] : args;
};

/**
 * Error message (console.error)
 */
export const error: BuiltInFunction = (...args: any[]) => {
  console.error(...args);
  return args.length === 1 ? args[0] : args;
};

/**
 * Info message (console.info)
 */
export const info: BuiltInFunction = (...args: any[]) => {
  console.info(...args);
  return args.length === 1 ? args[0] : args;
};

/**
 * Debug message (console.debug)
 */
export const debug: BuiltInFunction = (...args: any[]) => {
  console.debug(...args);
  return args.length === 1 ? args[0] : args;
};

/**
 * Clear console (console.clear)
 */
export const clearConsole: BuiltInFunction = (...args: any[]) => {
  requireArgs('clearConsole', args, 0, 0);
  console.clear();
  return null;
};

/**
 * Pretty-print inspect an object
 */
export const inspect: BuiltInFunction = (...args: any[]) => {
  requireArgs('inspect', args, 1, 2);

  const value = args[0];
  const depth = args.length === 2 ? args[1] : 2;

  if (!typeValidators.isNumber(depth)) {
    console.error('inspect: depth must be a number');
    return value;
  }

  // Custom inspect function for better formatting
  const inspectValue = (val: any, currentDepth: number = 0): string => {
    if (currentDepth >= depth) {
      return '[Object]';
    }

    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeValidators.isString(val)) return `"${val}"`;
    if (typeValidators.isNumber(val)) return String(val);
    if (typeValidators.isBoolean(val)) return String(val);
    if (typeValidators.isFunction(val)) return `[Function: ${val.name || 'anonymous'}]`;

    if (typeValidators.isList(val)) {
      if (val.length === 0) return '[]';
      const items = val.map((item: any) => inspectValue(item, currentDepth + 1));
      return `[\n${'  '.repeat(currentDepth + 1)}${items.join(`,\n${'  '.repeat(currentDepth + 1)}`)}\n${'  '.repeat(currentDepth)}]`;
    }

    if (typeValidators.isTable(val)) {
      const entries = Object.entries(val);
      if (entries.length === 0) return '{}';
      const items = entries.map(
        ([key, value]) => `${key}: ${inspectValue(value, currentDepth + 1)}`
      );
      return `{\n${'  '.repeat(currentDepth + 1)}${items.join(`,\n${'  '.repeat(currentDepth + 1)}`)}\n${'  '.repeat(currentDepth)}}`;
    }

    return String(val);
  };

  const result = inspectValue(value);
  console.log(result);
  return value;
};

/**
 * Start a timer (console.time)
 */
export const startTimer: BuiltInFunction = (...args: any[]) => {
  requireArgs('startTimer', args, 0, 1);
  const label = args.length === 1 ? String(args[0]) : 'default';
  console.time(label);
  return null;
};

/**
 * End a timer and log elapsed time (console.timeEnd)
 */
export const endTimer: BuiltInFunction = (...args: any[]) => {
  requireArgs('endTimer', args, 0, 1);
  const label = args.length === 1 ? String(args[0]) : 'default';
  console.timeEnd(label);
  return null;
};

/**
 * Create a group in console (console.group)
 */
export const group: BuiltInFunction = (...args: any[]) => {
  const label = args.length > 0 ? args.join(' ') : 'Group';
  console.group(label);
  return null;
};

/**
 * End console group (console.groupEnd)
 */
export const groupEnd: BuiltInFunction = (...args: any[]) => {
  requireArgs('groupEnd', args, 0, 0);
  console.groupEnd();
  return null;
};

/**
 * Show an alert dialog (browser only)
 */
export const alert: BuiltInFunction = (...args: any[]) => {
  requireArgs('alert', args, 1, 1);
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(String(args[0]));
  } else {
    console.log(`[ALERT] ${args[0]}`);
  }
  return null;
};

/**
 * Show a confirm dialog (browser only)
 */
export const confirm: BuiltInFunction = (...args: any[]) => {
  requireArgs('confirm', args, 1, 1);
  if (typeof window !== 'undefined' && window.confirm) {
    return window.confirm(String(args[0]));
  } else {
    console.log(`[CONFIRM] ${args[0]} (auto-returning true in non-browser environment)`);
    return true;
  }
};

/**
 * Show a prompt dialog (browser only)
 */
export const prompt: BuiltInFunction = (...args: any[]) => {
  requireArgs('prompt', args, 1, 2);
  const message = String(args[0]);
  const defaultValue = args.length === 2 ? String(args[1]) : '';

  if (typeof window !== 'undefined' && window.prompt) {
    return window.prompt(message, defaultValue);
  } else {
    console.log(`[PROMPT] ${message} (default: ${defaultValue}) (auto-returning default in non-browser environment)`);
    return defaultValue;
  }
};

/**
 * Assert a condition (throws error if false)
 */
export const assert: BuiltInFunction = (...args: any[]) => {
  requireArgs('assert', args, 1, 2);
  const condition = args[0];
  const message = args.length === 2 ? String(args[1]) : 'Assertion failed';

  if (!condition) {
    throw new Error(message);
  }

  return true;
};

/**
 * Trace function calls (console.trace)
 */
export const trace: BuiltInFunction = (...args: any[]) => {
  const label = args.length > 0 ? args.join(' ') : 'Trace';
  console.trace(label);
  return null;
};

/**
 * All I/O and debugging functions
 */
export const ioFunctions: Record<string, BuiltInFunction> = {
  print,
  log,
  warn,
  error,
  info,
  debug,
  clearConsole,
  inspect,
  startTimer,
  endTimer,
  group,
  groupEnd,
  alert,
  confirm,
  prompt,
  assert,
  trace,
};
