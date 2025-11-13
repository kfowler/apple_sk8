/**
 * SK8Script Standard Library Infrastructure
 *
 * Provides function registration, type validation, and error handling
 * for all built-in standard library functions.
 */

import type { BuiltInFunction } from '../evaluator/evaluator.js';

/**
 * Function metadata for documentation and validation
 */
export interface FunctionMetadata {
  name: string;
  description: string;
  params: Array<{
    name: string;
    type: string;
    optional?: boolean;
    description?: string;
  }>;
  returns: string;
  examples?: string[];
}

/**
 * Standard library error class
 */
export class StdLibError extends Error {
  constructor(
    message: string,
    public functionName?: string
  ) {
    super(functionName ? `${functionName}: ${message}` : message);
    this.name = 'StdLibError';
  }
}

/**
 * Type validation helpers
 */
export const typeValidators = {
  isNumber: (value: any): value is number => typeof value === 'number' && !isNaN(value),

  isString: (value: any): value is string => typeof value === 'string',

  isBoolean: (value: any): value is boolean => typeof value === 'boolean',

  isList: (value: any): value is any[] => Array.isArray(value),

  isTable: (value: any): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !Array.isArray(value),

  isFunction: (value: any): value is Function => typeof value === 'function',

  isObject: (value: any): boolean =>
    value !== null && typeof value === 'object',

  isNull: (value: any): value is null => value === null,

  isUndefined: (value: any): value is undefined => value === undefined,
};

/**
 * Argument validation helpers
 */
export function requireArgs(
  funcName: string,
  args: any[],
  min: number,
  max?: number
): void {
  if (args.length < min) {
    throw new StdLibError(
      `Expected at least ${min} argument(s), got ${args.length}`,
      funcName
    );
  }
  if (max !== undefined && args.length > max) {
    throw new StdLibError(
      `Expected at most ${max} argument(s), got ${args.length}`,
      funcName
    );
  }
}

/**
 * Type validation with automatic error throwing
 */
export function requireType(
  funcName: string,
  value: any,
  typeName: string,
  validator: (value: any) => boolean
): void {
  if (!validator(value)) {
    throw new StdLibError(
      `Expected ${typeName}, got ${typeof value}`,
      funcName
    );
  }
}

/**
 * Registry for all standard library functions
 */
export class StdLibRegistry {
  private functions: Map<string, BuiltInFunction> = new Map();
  private metadata: Map<string, FunctionMetadata> = new Map();

  /**
   * Register a function with optional metadata
   */
  register(name: string, func: BuiltInFunction, meta?: FunctionMetadata): void {
    this.functions.set(name, func);
    if (meta) {
      this.metadata.set(name, meta);
    }
  }

  /**
   * Register multiple functions at once
   */
  registerAll(functions: Record<string, BuiltInFunction>): void {
    for (const [name, func] of Object.entries(functions)) {
      this.register(name, func);
    }
  }

  /**
   * Get a function by name
   */
  get(name: string): BuiltInFunction | undefined {
    return this.functions.get(name);
  }

  /**
   * Get metadata for a function
   */
  getMeta(name: string): FunctionMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Get all registered function names
   */
  getFunctionNames(): string[] {
    return Array.from(this.functions.keys()).sort();
  }

  /**
   * Get all functions as an object
   */
  getAllFunctions(): Record<string, BuiltInFunction> {
    const result: Record<string, BuiltInFunction> = {};
    for (const [name, func] of this.functions.entries()) {
      result[name] = func;
    }
    return result;
  }

  /**
   * Check if a function exists
   */
  has(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * Get help text for a function
   */
  getHelp(name: string): string {
    const meta = this.metadata.get(name);
    if (!meta) {
      return `No help available for function: ${name}`;
    }

    const params = meta.params
      .map((p) => (p.optional ? `[${p.name}]` : p.name))
      .join(', ');

    let help = `${meta.name}(${params})\n\n`;
    help += `${meta.description}\n\n`;
    help += `Returns: ${meta.returns}\n`;

    if (meta.params.length > 0) {
      help += '\nParameters:\n';
      for (const param of meta.params) {
        const optStr = param.optional ? ' (optional)' : '';
        const descStr = param.description ? ` - ${param.description}` : '';
        help += `  ${param.name}: ${param.type}${optStr}${descStr}\n`;
      }
    }

    if (meta.examples && meta.examples.length > 0) {
      help += '\nExamples:\n';
      for (const example of meta.examples) {
        help += `  ${example}\n`;
      }
    }

    return help;
  }
}

/**
 * Global standard library registry
 */
export const stdlib = new StdLibRegistry();
