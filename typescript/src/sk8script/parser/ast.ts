/**
 * SK8Script AST Node Types
 *
 * Defines the Abstract Syntax Tree node types for SK8Script expressions.
 */

import { TokenType } from '../lexer/token.js';

/**
 * Base AST Node interface
 */
export interface ASTNode {
  kind: string;
}

/**
 * Literal node (numbers, strings, booleans, null)
 */
export interface LiteralNode extends ASTNode {
  kind: 'Literal';
  value: number | string | boolean | null;
}

/**
 * Identifier node (variable names)
 */
export interface IdentifierNode extends ASTNode {
  kind: 'Identifier';
  name: string;
}

/**
 * Binary operation node (e.g., a + b, x * y)
 */
export interface BinaryOpNode extends ASTNode {
  kind: 'BinaryOp';
  operator: TokenType;
  left: ASTNode;
  right: ASTNode;
}

/**
 * Unary operation node (e.g., -x, not x)
 */
export interface UnaryOpNode extends ASTNode {
  kind: 'UnaryOp';
  operator: TokenType;
  operand: ASTNode;
}

/**
 * Property access node (e.g., "the left of myActor")
 */
export interface PropertyAccessNode extends ASTNode {
  kind: 'PropertyAccess';
  property: string;
  object: ASTNode;
}

/**
 * Index access node (e.g., "item 1 of myList", "myList[0]")
 */
export interface IndexAccessNode extends ASTNode {
  kind: 'IndexAccess';
  index: ASTNode;
  object: ASTNode;
}

/**
 * Grouping node (parenthesized expression)
 */
export interface GroupingNode extends ASTNode {
  kind: 'Grouping';
  expression: ASTNode;
}

/**
 * Assignment node (e.g., "set x to 5")
 */
export interface AssignmentNode extends ASTNode {
  kind: 'Assignment';
  target: ASTNode;
  value: ASTNode;
}

/**
 * Type guards for AST nodes
 */

export function isLiteral(node: ASTNode): node is LiteralNode {
  return node.kind === 'Literal';
}

export function isIdentifier(node: ASTNode): node is IdentifierNode {
  return node.kind === 'Identifier';
}

export function isBinaryOp(node: ASTNode): node is BinaryOpNode {
  return node.kind === 'BinaryOp';
}

export function isUnaryOp(node: ASTNode): node is UnaryOpNode {
  return node.kind === 'UnaryOp';
}

export function isPropertyAccess(node: ASTNode): node is PropertyAccessNode {
  return node.kind === 'PropertyAccess';
}

export function isIndexAccess(node: ASTNode): node is IndexAccessNode {
  return node.kind === 'IndexAccess';
}

export function isGrouping(node: ASTNode): node is GroupingNode {
  return node.kind === 'Grouping';
}

export function isAssignment(node: ASTNode): node is AssignmentNode {
  return node.kind === 'Assignment';
}

/**
 * Helper functions to create AST nodes
 */

export function createLiteral(value: number | string | boolean | null): LiteralNode {
  return { kind: 'Literal', value };
}

export function createIdentifier(name: string): IdentifierNode {
  return { kind: 'Identifier', name };
}

export function createBinaryOp(operator: TokenType, left: ASTNode, right: ASTNode): BinaryOpNode {
  return { kind: 'BinaryOp', operator, left, right };
}

export function createUnaryOp(operator: TokenType, operand: ASTNode): UnaryOpNode {
  return { kind: 'UnaryOp', operator, operand };
}

export function createPropertyAccess(property: string, object: ASTNode): PropertyAccessNode {
  return { kind: 'PropertyAccess', property, object };
}

export function createIndexAccess(index: ASTNode, object: ASTNode): IndexAccessNode {
  return { kind: 'IndexAccess', index, object };
}

export function createGrouping(expression: ASTNode): GroupingNode {
  return { kind: 'Grouping', expression };
}

export function createAssignment(target: ASTNode, value: ASTNode): AssignmentNode {
  return { kind: 'Assignment', target, value };
}

/**
 * Pretty print an AST node for debugging
 */
export function printAST(node: ASTNode, indent: number = 0): string {
  const spaces = ' '.repeat(indent);

  if (isLiteral(node)) {
    return `${spaces}Literal(${JSON.stringify(node.value)})`;
  }

  if (isIdentifier(node)) {
    return `${spaces}Identifier(${node.name})`;
  }

  if (isBinaryOp(node)) {
    return (
      `${spaces}BinaryOp(${node.operator})\n` +
      printAST(node.left, indent + 2) +
      '\n' +
      printAST(node.right, indent + 2)
    );
  }

  if (isUnaryOp(node)) {
    return `${spaces}UnaryOp(${node.operator})\n` + printAST(node.operand, indent + 2);
  }

  if (isPropertyAccess(node)) {
    return `${spaces}PropertyAccess(${node.property})\n` + printAST(node.object, indent + 2);
  }

  if (isIndexAccess(node)) {
    return (
      `${spaces}IndexAccess\n` +
      `${spaces}  index:\n` +
      printAST(node.index, indent + 4) +
      '\n' +
      `${spaces}  object:\n` +
      printAST(node.object, indent + 4)
    );
  }

  if (isGrouping(node)) {
    return `${spaces}Grouping\n` + printAST(node.expression, indent + 2);
  }

  if (isAssignment(node)) {
    return (
      `${spaces}Assignment\n` +
      `${spaces}  target:\n` +
      printAST(node.target, indent + 4) +
      '\n' +
      `${spaces}  value:\n` +
      printAST(node.value, indent + 4)
    );
  }

  return `${spaces}Unknown(${node.kind})`;
}
