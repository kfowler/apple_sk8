/**
 * SK8Script Evaluator
 *
 * Evaluates AST nodes to produce values.
 *
 * Optimizations:
 * - Property lookup caching
 * - Fast paths for common operations
 * - Inline hot paths
 * - Optimized closure creation
 */

import { TokenType } from '../lexer/token.js';
import { performanceMonitor } from '../../runtime/performance-monitor.js';
import {
  ASTNode,
  FunctionParameter,
  isLiteral,
  isIdentifier,
  isBinaryOp,
  isUnaryOp,
  isPropertyAccess,
  isIndexAccess,
  isGrouping,
  isAssignment,
  isFunctionCall,
  isListLiteral,
  isTableLiteral,
  isBlock,
  isIfStatement,
  isWhileStatement,
  isRepeatTimes,
  isRepeatWith,
  isRepeatForever,
  isTryStatement,
  isBreakStatement,
  isContinueStatement,
  isReturnStatement,
  isFunctionDeclaration,
  isLambdaFunction,
} from '../parser/ast.js';

/**
 * Built-in function type
 */
export type BuiltInFunction = (...args: any[]) => any;

/**
 * User-defined function representation (supports closures)
 */
export class UserDefinedFunction {
  constructor(
    public name: string,
    public parameters: FunctionParameter[],
    public body: ASTNode[],
    public closure: EvaluationContext,
    public returnsValue: boolean = true
  ) {}
}

/**
 * Evaluation context for variable and property lookup
 */
export interface EvaluationContext {
  variables: Map<string, any>;
  functions: Map<string, BuiltInFunction | UserDefinedFunction>;
  parent?: EvaluationContext; // For nested scopes and closures
  [key: string]: any;
}

/**
 * Evaluator error class
 */
export class EvaluatorError extends Error {
  constructor(message: string) {
    super(`Evaluation error: ${message}`);
    this.name = 'EvaluatorError';
  }
}

/**
 * Break exception for loop control
 */
class BreakException extends Error {
  constructor() {
    super('Break statement');
    this.name = 'BreakException';
  }
}

/**
 * Continue exception for loop control
 */
class ContinueException extends Error {
  constructor() {
    super('Continue statement');
    this.name = 'ContinueException';
  }
}

/**
 * Return exception for function control
 */
class ReturnException extends Error {
  constructor(public value: any) {
    super('Return statement');
    this.name = 'ReturnException';
  }
}

/**
 * Property lookup cache for optimization
 */
interface PropertyCache {
  [key: string]: any;
}

/**
 * Evaluator class for executing AST nodes (optimized)
 */
export class Evaluator {
  private context: EvaluationContext;
  private callStack: string[] = [];
  private readonly MAX_CALL_STACK_SIZE = 1000;

  // Optimization: property lookup cache
  private propertyCache: Map<string, PropertyCache> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private usePropertyCache: boolean = true;

  // Optimization: inline common operations
  private fastMathOps: Map<TokenType, (a: number, b: number) => number> = new Map([
    [TokenType.PLUS, (a, b) => a + b],
    [TokenType.MINUS, (a, b) => a - b],
    [TokenType.STAR, (a, b) => a * b],
    [TokenType.SLASH, (a, b) => a / b],
    [TokenType.PERCENT, (a, b) => a % b],
    [TokenType.CARET, (a, b) => Math.pow(a, b)],
  ]);

  constructor(context: EvaluationContext = { variables: new Map(), functions: new Map() }) {
    this.context = context;
  }

  /**
   * Evaluate an AST node (optimized)
   */
  evaluate(node: ASTNode): any {
    // Performance monitoring
    performanceMonitor.incrementCounter('eval-calls');

    // Fast path: Literal (most common)
    if (isLiteral(node)) {
      return node.value;
    }

    // Identifier (variable lookup)
    if (isIdentifier(node)) {
      // Look up in current context and parent contexts (closure chain)
      let context: EvaluationContext | undefined = this.context;
      while (context) {
        if (context.variables.has(node.name)) {
          return context.variables.get(node.name);
        }
        context = context.parent;
      }
      throw new EvaluatorError(`Undefined variable: ${node.name}`);
    }

    // Binary operation
    if (isBinaryOp(node)) {
      return this.evaluateBinaryOp(node);
    }

    // Unary operation
    if (isUnaryOp(node)) {
      return this.evaluateUnaryOp(node);
    }

    // Property access
    if (isPropertyAccess(node)) {
      return this.evaluatePropertyAccess(node);
    }

    // Index access
    if (isIndexAccess(node)) {
      return this.evaluateIndexAccess(node);
    }

    // Grouping
    if (isGrouping(node)) {
      return this.evaluate(node.expression);
    }

    // Assignment
    if (isAssignment(node)) {
      return this.evaluateAssignment(node);
    }

    // Function call
    if (isFunctionCall(node)) {
      return this.evaluateFunctionCall(node);
    }

    // List literal
    if (isListLiteral(node)) {
      return this.evaluateListLiteral(node);
    }

    // Table literal
    if (isTableLiteral(node)) {
      return this.evaluateTableLiteral(node);
    }

    // Block
    if (isBlock(node)) {
      return this.evaluateBlock(node);
    }

    // If statement
    if (isIfStatement(node)) {
      return this.evaluateIfStatement(node);
    }

    // While statement
    if (isWhileStatement(node)) {
      return this.evaluateWhileStatement(node);
    }

    // Repeat times
    if (isRepeatTimes(node)) {
      return this.evaluateRepeatTimes(node);
    }

    // Repeat with
    if (isRepeatWith(node)) {
      return this.evaluateRepeatWith(node);
    }

    // Repeat forever
    if (isRepeatForever(node)) {
      return this.evaluateRepeatForever(node);
    }

    // Try/catch
    if (isTryStatement(node)) {
      return this.evaluateTryStatement(node);
    }

    // Break
    if (isBreakStatement(node)) {
      throw new BreakException();
    }

    // Continue
    if (isContinueStatement(node)) {
      throw new ContinueException();
    }

    // Return
    if (isReturnStatement(node)) {
      const value = node.value ? this.evaluate(node.value) : undefined;
      throw new ReturnException(value);
    }

    // Function declaration
    if (isFunctionDeclaration(node)) {
      return this.evaluateFunctionDeclaration(node);
    }

    // Lambda function
    if (isLambdaFunction(node)) {
      return this.evaluateLambdaFunction(node);
    }

    throw new EvaluatorError(`Unknown node type: ${node.kind}`);
  }

  /**
   * Evaluate a binary operation (optimized with fast paths)
   */
  private evaluateBinaryOp(node: any): any {
    // Fast path for arithmetic operations on numbers
    const fastOp = this.fastMathOps.get(node.operator);
    if (fastOp) {
      const left = this.evaluate(node.left);
      const right = this.evaluate(node.right);

      if (typeof left === 'number' && typeof right === 'number') {
        return fastOp(left, right);
      }

      // Type error
      const opName = this.getOperatorName(node.operator);
      throw new EvaluatorError(`Cannot ${opName} ${typeof left} and ${typeof right}`);
    }

    // Other operations
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);

    switch (node.operator) {
      // Arithmetic (already handled above, but kept for completeness)
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        throw new EvaluatorError(`Cannot add ${typeof left} and ${typeof right}`);

      case TokenType.MINUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left - right;
        }
        throw new EvaluatorError(`Cannot subtract ${typeof left} and ${typeof right}`);

      case TokenType.STAR:
        if (typeof left === 'number' && typeof right === 'number') {
          return left * right;
        }
        throw new EvaluatorError(`Cannot multiply ${typeof left} and ${typeof right}`);

      case TokenType.SLASH:
        if (typeof left === 'number' && typeof right === 'number') {
          return left / right; // JavaScript returns Infinity for division by zero
        }
        throw new EvaluatorError(`Cannot divide ${typeof left} and ${typeof right}`);

      case TokenType.PERCENT:
        if (typeof left === 'number' && typeof right === 'number') {
          return left % right;
        }
        throw new EvaluatorError(`Cannot modulo ${typeof left} and ${typeof right}`);

      case TokenType.CARET:
        if (typeof left === 'number' && typeof right === 'number') {
          return Math.pow(left, right);
        }
        throw new EvaluatorError(`Cannot exponentiate ${typeof left} and ${typeof right}`);

      // String concatenation
      case TokenType.AMPERSAND:
        return String(left) + String(right);

      // Comparison
      case TokenType.EQUALS:
        return left === right;

      case TokenType.NOT_EQUALS:
        return left !== right;

      case TokenType.LESS_THAN:
        if (typeof left === 'number' && typeof right === 'number') {
          return left < right;
        }
        throw new EvaluatorError(`Cannot compare ${typeof left} and ${typeof right}`);

      case TokenType.GREATER_THAN:
        if (typeof left === 'number' && typeof right === 'number') {
          return left > right;
        }
        throw new EvaluatorError(`Cannot compare ${typeof left} and ${typeof right}`);

      case TokenType.LESS_EQUAL:
        if (typeof left === 'number' && typeof right === 'number') {
          return left <= right;
        }
        throw new EvaluatorError(`Cannot compare ${typeof left} and ${typeof right}`);

      case TokenType.GREATER_EQUAL:
        if (typeof left === 'number' && typeof right === 'number') {
          return left >= right;
        }
        throw new EvaluatorError(`Cannot compare ${typeof left} and ${typeof right}`);

      // Logical
      case TokenType.AND:
        return this.isTruthy(left) && this.isTruthy(right);

      case TokenType.OR:
        return this.isTruthy(left) || this.isTruthy(right);

      default:
        throw new EvaluatorError(`Unknown binary operator: ${node.operator}`);
    }
  }

  /**
   * Evaluate a unary operation
   */
  private evaluateUnaryOp(node: any): any {
    const operand = this.evaluate(node.operand);

    switch (node.operator) {
      case TokenType.MINUS:
        if (typeof operand === 'number') {
          return -operand;
        }
        throw new EvaluatorError(`Cannot negate ${typeof operand}`);

      case TokenType.NOT:
        return !this.isTruthy(operand);

      default:
        throw new EvaluatorError(`Unknown unary operator: ${node.operator}`);
    }
  }

  /**
   * Evaluate property access (optimized with caching)
   */
  private evaluatePropertyAccess(node: any): any {
    const object = this.evaluate(node.object);

    if (object === null || object === undefined) {
      throw new EvaluatorError(`Cannot access property '${node.property}' of ${object}`);
    }

    // Use property cache for SK8Objects
    if (this.usePropertyCache && typeof object === 'object' && typeof object.getProperty === 'function') {
      const objectId = object.getId?.() || object;
      const cacheKey = `${objectId}_${node.property}`;

      // Check cache
      if (this.propertyCache.has(cacheKey)) {
        this.cacheHits++;
        performanceMonitor.incrementCounter('property-cache-hits');
        return this.propertyCache.get(cacheKey);
      }

      // Cache miss - get property and cache it
      this.cacheMisses++;
      performanceMonitor.incrementCounter('property-cache-misses');
      const value = object.getProperty(node.property);

      // Only cache immutable values
      if (typeof value !== 'object' && typeof value !== 'function') {
        this.propertyCache.set(cacheKey, value);
      }

      return value;
    }

    // Check if object is an SK8Object with getProperty method (non-cached)
    if (typeof object === 'object' && typeof object.getProperty === 'function') {
      return object.getProperty(node.property);
    }

    // Standard JavaScript property access
    const value = object[node.property];
    if (value === undefined) {
      throw new EvaluatorError(`Property '${node.property}' not found on object`);
    }

    return value;
  }

  /**
   * Evaluate index access
   */
  private evaluateIndexAccess(node: any): any {
    const object = this.evaluate(node.object);
    const index = this.evaluate(node.index);

    if (!Array.isArray(object) && typeof object !== 'string') {
      throw new EvaluatorError(`Cannot index ${typeof object}`);
    }

    if (typeof index !== 'number') {
      throw new EvaluatorError(`Index must be a number, got ${typeof index}`);
    }

    // SK8 uses 1-based indexing, JavaScript uses 0-based
    const jsIndex = index - 1;

    if (jsIndex < 0 || jsIndex >= object.length) {
      throw new EvaluatorError(`Index ${index} out of bounds for object of length ${object.length}`);
    }

    return object[jsIndex];
  }

  /**
   * Evaluate assignment
   */
  private evaluateAssignment(node: any): any {
    const value = this.evaluate(node.value);

    // Simple variable assignment
    if (isIdentifier(node.target)) {
      this.context.variables.set(node.target.name, value);
      return value;
    }

    // Property assignment
    if (isPropertyAccess(node.target)) {
      const object = this.evaluate(node.target.object);
      if (object === null || object === undefined) {
        throw new EvaluatorError(`Cannot set property on ${object}`);
      }

      // Check if object is an SK8Object with setProperty method
      if (typeof object === 'object' && typeof object.setProperty === 'function') {
        object.setProperty(node.target.property, value);
      } else {
        object[node.target.property] = value;
      }
      return value;
    }

    // Index assignment
    if (isIndexAccess(node.target)) {
      const object = this.evaluate(node.target.object);
      const index = this.evaluate(node.target.index);

      if (!Array.isArray(object)) {
        throw new EvaluatorError(`Cannot index assign to ${typeof object}`);
      }

      if (typeof index !== 'number') {
        throw new EvaluatorError(`Index must be a number, got ${typeof index}`);
      }

      // SK8 uses 1-based indexing
      const jsIndex = index - 1;
      object[jsIndex] = value;
      return value;
    }

    throw new EvaluatorError('Invalid assignment target');
  }

  /**
   * Evaluate a function declaration
   * TODO: This will be used in future phase for function support
   */
  // @ts-ignore - Will be used in future phase
  private evaluateFunctionDeclaration(node: any): any {
    // Create a user-defined function with closure
    const func = new UserDefinedFunction(
      node.name,
      node.parameters,
      node.body,
      this.context, // Capture current context as closure
      node.returnsValue
    );

    // Register the function in the current context
    this.context.functions.set(node.name, func);

    // Return undefined (function declarations don't produce values)
    return undefined;
  }

  /**
   * Evaluate a lambda function
   * TODO: This will be used in future phase for function support
   */
  // @ts-ignore - Will be used in future phase
  private evaluateLambdaFunction(node: any): any {
    // Create an anonymous user-defined function with closure
    return new UserDefinedFunction(
      '<lambda>', // Anonymous
      node.parameters,
      node.body,
      this.context, // Capture current context as closure
      true // Lambdas always return values
    );
  }

  /**
   * Evaluate a function call
   */
  private evaluateFunctionCall(node: any): any {
    const func = this.context.functions.get(node.name);
    if (!func) {
      throw new EvaluatorError(`Undefined function: ${node.name}`);
    }

    // Evaluate all arguments
    const args = node.args.map((arg: ASTNode) => this.evaluate(arg));

    // Check if it's a user-defined function
    if (func instanceof UserDefinedFunction) {
      return this.callUserDefinedFunction(func, args);
    }

    // Otherwise it's a built-in function
    return func(...args);
  }

  /**
   * Call a user-defined function with arguments
   */
  private callUserDefinedFunction(func: UserDefinedFunction, args: any[]): any {
    // Check stack overflow
    if (this.callStack.length >= this.MAX_CALL_STACK_SIZE) {
      throw new EvaluatorError(
        `Stack overflow: Maximum call stack size (${this.MAX_CALL_STACK_SIZE}) exceeded`
      );
    }

    // Push function name onto call stack
    this.callStack.push(func.name);

    try {
      // Create a new context for function execution
      const functionContext: EvaluationContext = {
        variables: new Map(),
        functions: func.closure.functions, // Share functions from closure
        parent: func.closure, // Link to closure for variable lookup
      };

      // Bind parameters
      for (let i = 0; i < func.parameters.length; i++) {
        const param = func.parameters[i];
        let value: any;

        if (i < args.length) {
          // Use provided argument
          value = args[i];
        } else if (param.defaultValue) {
          // Use default value
          value = this.evaluate(param.defaultValue);
        } else {
          // Missing required parameter
          throw new EvaluatorError(
            `Missing required parameter '${param.name}' for function '${func.name}'`
          );
        }

        functionContext.variables.set(param.name, value);
      }

      // Save current context and switch to function context
      const savedContext = this.context;
      this.context = functionContext;

      try {
        // Execute function body
        let result: any;
        for (const statement of func.body) {
          result = this.evaluate(statement);
        }

        // For handlers (on), always return undefined unless there's an explicit return
        // For functions (to), return the last evaluated value
        if (!func.returnsValue) {
          return undefined;
        }

        return result;
      } catch (e) {
        if (e instanceof ReturnException) {
          return e.value;
        }
        throw e;
      } finally {
        // Restore original context
        this.context = savedContext;
      }
    } finally {
      // Pop function from call stack
      this.callStack.pop();
    }
  }

  /**
   * Evaluate a list literal
   */
  private evaluateListLiteral(node: any): any {
    return node.elements.map((el: ASTNode) => this.evaluate(el));
  }

  /**
   * Evaluate a table literal
   */
  private evaluateTableLiteral(node: any): any {
    const table: Record<string, any> = {};
    for (const entry of node.entries) {
      table[entry.key] = this.evaluate(entry.value);
    }
    return table;
  }

  /**
   * Evaluate a block of statements
   */
  private evaluateBlock(node: any): any {
    let result: any;
    for (const statement of node.statements) {
      result = this.evaluate(statement);
    }
    return result;
  }

  /**
   * Evaluate an if statement
   */
  private evaluateIfStatement(node: any): any {
    const condition = this.evaluate(node.condition);

    if (this.isTruthy(condition)) {
      return this.evaluate(node.thenBranch);
    } else if (node.elseBranch) {
      return this.evaluate(node.elseBranch);
    }

    return undefined;
  }

  /**
   * Evaluate a while statement
   */
  private evaluateWhileStatement(node: any): any {
    let result: any;

    try {
      while (this.isTruthy(this.evaluate(node.condition))) {
        try {
          result = this.evaluate(node.body);
        } catch (error) {
          if (error instanceof ContinueException) {
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof BreakException) {
        return result;
      }
      throw error;
    }

    return result;
  }

  /**
   * Evaluate a repeat times statement
   */
  private evaluateRepeatTimes(node: any): any {
    const count = this.evaluate(node.count);

    if (typeof count !== 'number') {
      throw new EvaluatorError(`Repeat count must be a number, got ${typeof count}`);
    }

    let result: any;

    try {
      for (let i = 0; i < count; i++) {
        try {
          result = this.evaluate(node.body);
        } catch (error) {
          if (error instanceof ContinueException) {
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof BreakException) {
        return result;
      }
      throw error;
    }

    return result;
  }

  /**
   * Evaluate a repeat with statement
   */
  private evaluateRepeatWith(node: any): any {
    const start = this.evaluate(node.start);
    const end = this.evaluate(node.end);

    if (typeof start !== 'number') {
      throw new EvaluatorError(`Repeat start must be a number, got ${typeof start}`);
    }

    if (typeof end !== 'number') {
      throw new EvaluatorError(`Repeat end must be a number, got ${typeof end}`);
    }

    let result: any;

    try {
      for (let i = start; i <= end; i++) {
        // Set loop variable
        this.context.variables.set(node.variable, i);

        try {
          result = this.evaluate(node.body);
        } catch (error) {
          if (error instanceof ContinueException) {
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof BreakException) {
        return result;
      }
      throw error;
    }

    return result;
  }

  /**
   * Evaluate a repeat forever statement
   */
  private evaluateRepeatForever(node: any): any {
    let result: any;

    try {
      while (true) {
        try {
          result = this.evaluate(node.body);
        } catch (error) {
          if (error instanceof ContinueException) {
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof BreakException) {
        return result;
      }
      throw error;
    }

    // This should never be reached
    return result;
  }

  /**
   * Evaluate a try/catch statement
   */
  private evaluateTryStatement(node: any): any {
    try {
      return this.evaluate(node.tryBranch);
    } catch (error) {
      // Don't catch control flow exceptions
      if (
        error instanceof BreakException ||
        error instanceof ContinueException ||
        error instanceof ReturnException
      ) {
        throw error;
      }

      // Set catch variable if specified
      if (node.catchVariable) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.context.variables.set(node.catchVariable, errorMessage);
      }

      return this.evaluate(node.catchBranch);
    }
  }

  /**
   * Check if a value is truthy
   */
  private isTruthy(value: any): boolean {
    if (value === null || value === undefined || value === false) {
      return false;
    }
    if (value === 0 || value === '') {
      return false;
    }
    return true;
  }

  /**
   * Get the current context
   */
  getContext(): EvaluationContext {
    return this.context;
  }

  /**
   * Set a variable in the context
   */
  setVariable(name: string, value: any): void {
    this.context.variables.set(name, value);
  }

  /**
   * Get a variable from the context
   */
  getVariable(name: string): any {
    return this.context.variables.get(name);
  }

  /**
   * Register a built-in function
   */
  registerFunction(name: string, func: BuiltInFunction): void {
    this.context.functions.set(name, func);
  }

  /**
   * Get a function from the context
   */
  getFunction(name: string): BuiltInFunction | UserDefinedFunction | undefined {
    return this.context.functions.get(name);
  }

  /**
   * Register multiple functions at once
   */
  registerFunctions(functions: Record<string, BuiltInFunction>): void {
    for (const [name, func] of Object.entries(functions)) {
      this.registerFunction(name, func);
    }
  }

  /**
   * Clear property cache
   */
  clearPropertyCache(): void {
    this.propertyCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Enable/disable property cache
   */
  setUsePropertyCache(enabled: boolean): void {
    this.usePropertyCache = enabled;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    };
  }

  /**
   * Get operator name for error messages
   */
  private getOperatorName(operator: TokenType): string {
    switch (operator) {
      case TokenType.PLUS:
        return 'add';
      case TokenType.MINUS:
        return 'subtract';
      case TokenType.STAR:
        return 'multiply';
      case TokenType.SLASH:
        return 'divide';
      case TokenType.PERCENT:
        return 'modulo';
      case TokenType.CARET:
        return 'exponentiate';
      default:
        return 'operate on';
    }
  }
}

/**
 * Convenience function to evaluate an AST node
 */
export function evaluate(node: ASTNode, context?: EvaluationContext): any {
  const evaluator = new Evaluator(context);
  return evaluator.evaluate(node);
}
