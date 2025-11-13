/**
 * SK8Script Standard Library
 *
 * Main entry point for all standard library functions.
 * Exports 50+ built-in functions across 7 categories.
 */

import { stdlib, StdLibRegistry } from './stdlib.js';
import { mathFunctions } from './math.js';
import { stringFunctions } from './string.js';
import { collectionFunctions } from './collection.js';
import { typeFunctions } from './types.js';
import { ioFunctions } from './io.js';
import { objectFunctions } from './object.js';
import type { BuiltInFunction } from '../evaluator/evaluator.js';

// Export infrastructure
export { stdlib, StdLibRegistry, StdLibError, typeValidators } from './stdlib.js';
export type { FunctionMetadata } from './stdlib.js';

// Export individual function modules
export * from './math.js';
export * from './string.js';
export * from './collection.js';
export * from './types.js';
export * from './io.js';
export * from './object.js';

/**
 * All standard library functions combined
 */
export const allStdLibFunctions: Record<string, BuiltInFunction> = {
  ...mathFunctions,
  ...stringFunctions,
  ...collectionFunctions,
  ...typeFunctions,
  ...ioFunctions,
  ...objectFunctions,
};

/**
 * Register all standard library functions
 */
export function registerAllStdLib(registry: StdLibRegistry = stdlib): void {
  // Register all functions
  registry.registerAll(allStdLibFunctions);
}

/**
 * Get all function names organized by category
 */
export function getFunctionsByCategory(): Record<string, string[]> {
  return {
    math: Object.keys(mathFunctions).sort(),
    string: Object.keys(stringFunctions).sort(),
    collection: Object.keys(collectionFunctions).sort(),
    types: Object.keys(typeFunctions).sort(),
    io: Object.keys(ioFunctions).sort(),
    object: Object.keys(objectFunctions).sort(),
  };
}

/**
 * Get total function count
 */
export function getFunctionCount(): number {
  return Object.keys(allStdLibFunctions).length;
}

/**
 * Print all available functions
 */
export function printAllFunctions(): void {
  const categories = getFunctionsByCategory();

  console.log('SK8Script Standard Library Functions');
  console.log('=====================================\n');

  for (const [category, functions] of Object.entries(categories)) {
    console.log(`${category.toUpperCase()} (${functions.length} functions):`);
    console.log(functions.map((f) => `  - ${f}`).join('\n'));
    console.log();
  }

  console.log(`Total: ${getFunctionCount()} functions`);
}

// Auto-register all functions in the global registry
registerAllStdLib();
