/**
 * SK8Script Evaluator
 *
 * Evaluates AST nodes to produce values.
 */

import { TokenType } from '../lexer/token.js';
import {
  ASTNode,
  isLiteral,
  isIdentifier,
  isBinaryOp,
  isUnaryOp,
  isPropertyAccess,
  isIndexAccess,
  isGrouping,
  isAssignment,
} from '../parser/ast.js';

/**
 * Evaluation context for variable and property lookup
 */
export interface EvaluationContext {
  variables: Map<string, any>;
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
 * Evaluator class for executing AST nodes
 */
export class Evaluator {
  private context: EvaluationContext;

  constructor(context: EvaluationContext = { variables: new Map() }) {
    this.context = context;
  }

  /**
   * Evaluate an AST node
   */
  evaluate(node: ASTNode): any {
    // Literal
    if (isLiteral(node)) {
      return node.value;
    }

    // Identifier (variable lookup)
    if (isIdentifier(node)) {
      const value = this.context.variables.get(node.name);
      if (value === undefined) {
        throw new EvaluatorError(`Undefined variable: ${node.name}`);
      }
      return value;
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

    throw new EvaluatorError(`Unknown node type: ${node.kind}`);
  }

  /**
   * Evaluate a binary operation
   */
  private evaluateBinaryOp(node: any): any {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);

    switch (node.operator) {
      // Arithmetic
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
          if (right === 0) {
            throw new EvaluatorError('Division by zero');
          }
          return left / right;
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
   * Evaluate property access
   */
  private evaluatePropertyAccess(node: any): any {
    const object = this.evaluate(node.object);

    if (object === null || object === undefined) {
      throw new EvaluatorError(`Cannot access property '${node.property}' of ${object}`);
    }

    // Check if object is an SK8Object with getProperty method
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
}

/**
 * Convenience function to evaluate an AST node
 */
export function evaluate(node: ASTNode, context?: EvaluationContext): any {
  const evaluator = new Evaluator(context);
  return evaluator.evaluate(node);
}
