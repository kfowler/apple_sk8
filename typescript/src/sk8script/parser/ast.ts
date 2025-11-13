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
 * Function call node (e.g., "sqrt(16)", "length('hello')")
 */
export interface FunctionCallNode extends ASTNode {
  kind: 'FunctionCall';
  name: string;
  args: ASTNode[];
}

/**
 * List literal node (e.g., "[1, 2, 3]")
 */
export interface ListLiteralNode extends ASTNode {
  kind: 'ListLiteral';
  elements: ASTNode[];
}

/**
 * Table literal node (e.g., "{key: value, foo: bar}")
 */
export interface TableLiteralNode extends ASTNode {
  kind: 'TableLiteral';
  entries: Array<{ key: string; value: ASTNode }>;
}

/**
 * Block node (sequence of statements)
 */
export interface BlockNode extends ASTNode {
  kind: 'Block';
  statements: ASTNode[];
}

/**
 * If statement node
 */
export interface IfStatementNode extends ASTNode {
  kind: 'IfStatement';
  condition: ASTNode;
  thenBranch: ASTNode;
  elseBranch?: ASTNode;
}

/**
 * While loop node
 */
export interface WhileStatementNode extends ASTNode {
  kind: 'WhileStatement';
  condition: ASTNode;
  body: ASTNode;
}

/**
 * Repeat N times loop node
 */
export interface RepeatTimesNode extends ASTNode {
  kind: 'RepeatTimes';
  count: ASTNode;
  body: ASTNode;
}

/**
 * Repeat with variable from/to loop node
 */
export interface RepeatWithNode extends ASTNode {
  kind: 'RepeatWith';
  variable: string;
  start: ASTNode;
  end: ASTNode;
  body: ASTNode;
}

/**
 * Repeat forever loop node
 */
export interface RepeatForeverNode extends ASTNode {
  kind: 'RepeatForever';
  body: ASTNode;
}

/**
 * Try/catch statement node
 */
export interface TryStatementNode extends ASTNode {
  kind: 'TryStatement';
  tryBranch: ASTNode;
  catchVariable?: string;
  catchBranch: ASTNode;
}

/**
 * Break statement node
 */
export interface BreakStatementNode extends ASTNode {
  kind: 'BreakStatement';
}

/**
 * Continue statement node
 */
export interface ContinueStatementNode extends ASTNode {
  kind: 'ContinueStatement';
}

/**
 * Return statement node
 */
export interface ReturnStatementNode extends ASTNode {
  kind: 'ReturnStatement';
  value?: ASTNode;
}

/**
 * Function parameter with optional default value
 */
export interface FunctionParameter {
  name: string;
  defaultValue?: ASTNode;
}

/**
 * Function declaration node (e.g., "on myHandler x, y ... end", "to square x ... end")
 */
export interface FunctionDeclarationNode extends ASTNode {
  kind: 'FunctionDeclaration';
  name: string;
  parameters: FunctionParameter[];
  body: ASTNode[];
  returnsValue: boolean; // true for "to", false for "on"
}

/**
 * Lambda/anonymous function node (e.g., "function(x) { x * 2 }")
 */
export interface LambdaFunctionNode extends ASTNode {
  kind: 'LambdaFunction';
  parameters: FunctionParameter[];
  body: ASTNode[];
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

export function isFunctionCall(node: ASTNode): node is FunctionCallNode {
  return node.kind === 'FunctionCall';
}

export function isListLiteral(node: ASTNode): node is ListLiteralNode {
  return node.kind === 'ListLiteral';
}

export function isTableLiteral(node: ASTNode): node is TableLiteralNode {
  return node.kind === 'TableLiteral';
}

export function isBlock(node: ASTNode): node is BlockNode {
  return node.kind === 'Block';
}

export function isIfStatement(node: ASTNode): node is IfStatementNode {
  return node.kind === 'IfStatement';
}

export function isWhileStatement(node: ASTNode): node is WhileStatementNode {
  return node.kind === 'WhileStatement';
}

export function isRepeatTimes(node: ASTNode): node is RepeatTimesNode {
  return node.kind === 'RepeatTimes';
}

export function isRepeatWith(node: ASTNode): node is RepeatWithNode {
  return node.kind === 'RepeatWith';
}

export function isRepeatForever(node: ASTNode): node is RepeatForeverNode {
  return node.kind === 'RepeatForever';
}

export function isTryStatement(node: ASTNode): node is TryStatementNode {
  return node.kind === 'TryStatement';
}

export function isBreakStatement(node: ASTNode): node is BreakStatementNode {
  return node.kind === 'BreakStatement';
}

export function isContinueStatement(node: ASTNode): node is ContinueStatementNode {
  return node.kind === 'ContinueStatement';
}

export function isReturnStatement(node: ASTNode): node is ReturnStatementNode {
  return node.kind === 'ReturnStatement';
}

export function isFunctionDeclaration(node: ASTNode): node is FunctionDeclarationNode {
  return node.kind === 'FunctionDeclaration';
}

export function isLambdaFunction(node: ASTNode): node is LambdaFunctionNode {
  return node.kind === 'LambdaFunction';
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

export function createFunctionCall(name: string, args: ASTNode[]): FunctionCallNode {
  return { kind: 'FunctionCall', name, args };
}

export function createListLiteral(elements: ASTNode[]): ListLiteralNode {
  return { kind: 'ListLiteral', elements };
}

export function createTableLiteral(entries: Array<{ key: string; value: ASTNode }>): TableLiteralNode {
  return { kind: 'TableLiteral', entries };
}

export function createBlock(statements: ASTNode[]): BlockNode {
  return { kind: 'Block', statements };
}

export function createIfStatement(
  condition: ASTNode,
  thenBranch: ASTNode,
  elseBranch?: ASTNode
): IfStatementNode {
  return { kind: 'IfStatement', condition, thenBranch, elseBranch };
}

export function createWhileStatement(condition: ASTNode, body: ASTNode): WhileStatementNode {
  return { kind: 'WhileStatement', condition, body };
}

export function createRepeatTimes(count: ASTNode, body: ASTNode): RepeatTimesNode {
  return { kind: 'RepeatTimes', count, body };
}

export function createRepeatWith(
  variable: string,
  start: ASTNode,
  end: ASTNode,
  body: ASTNode
): RepeatWithNode {
  return { kind: 'RepeatWith', variable, start, end, body };
}

export function createRepeatForever(body: ASTNode): RepeatForeverNode {
  return { kind: 'RepeatForever', body };
}

export function createTryStatement(
  tryBranch: ASTNode,
  catchBranch: ASTNode,
  catchVariable?: string
): TryStatementNode {
  return { kind: 'TryStatement', tryBranch, catchVariable, catchBranch };
}

export function createBreakStatement(): BreakStatementNode {
  return { kind: 'BreakStatement' };
}

export function createContinueStatement(): ContinueStatementNode {
  return { kind: 'ContinueStatement' };
}

export function createReturnStatement(value?: ASTNode): ReturnStatementNode {
  return { kind: 'ReturnStatement', value };
}

export function createFunctionDeclaration(
  name: string,
  parameters: FunctionParameter[],
  body: ASTNode[],
  returnsValue: boolean = false
): FunctionDeclarationNode {
  return { kind: 'FunctionDeclaration', name, parameters, body, returnsValue };
}

export function createLambdaFunction(parameters: FunctionParameter[], body: ASTNode[]): LambdaFunctionNode {
  return { kind: 'LambdaFunction', parameters, body };
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

  if (isFunctionCall(node)) {
    const argsStr = node.args.map((arg) => printAST(arg, indent + 2)).join('\n');
    return `${spaces}FunctionCall(${node.name})\n${argsStr}`;
  }

  if (isListLiteral(node)) {
    const elemsStr = node.elements.map((el) => printAST(el, indent + 2)).join('\n');
    return `${spaces}ListLiteral\n${elemsStr}`;
  }

  if (isTableLiteral(node)) {
    const entriesStr = node.entries
      .map((e) => `${spaces}  ${e.key}:\n${printAST(e.value, indent + 4)}`)
      .join('\n');
    return `${spaces}TableLiteral\n${entriesStr}`;
  }

  if (isBlock(node)) {
    const stmtsStr = node.statements.map((stmt) => printAST(stmt, indent + 2)).join('\n');
    return `${spaces}Block\n${stmtsStr}`;
  }

  if (isIfStatement(node)) {
    let result =
      `${spaces}IfStatement\n` +
      `${spaces}  condition:\n` +
      printAST(node.condition, indent + 4) +
      '\n' +
      `${spaces}  then:\n` +
      printAST(node.thenBranch, indent + 4);
    if (node.elseBranch) {
      result += '\n' + `${spaces}  else:\n` + printAST(node.elseBranch, indent + 4);
    }
    return result;
  }

  if (isWhileStatement(node)) {
    return (
      `${spaces}WhileStatement\n` +
      `${spaces}  condition:\n` +
      printAST(node.condition, indent + 4) +
      '\n' +
      `${spaces}  body:\n` +
      printAST(node.body, indent + 4)
    );
  }

  if (isRepeatTimes(node)) {
    return (
      `${spaces}RepeatTimes\n` +
      `${spaces}  count:\n` +
      printAST(node.count, indent + 4) +
      '\n' +
      `${spaces}  body:\n` +
      printAST(node.body, indent + 4)
    );
  }

  if (isRepeatWith(node)) {
    return (
      `${spaces}RepeatWith(${node.variable})\n` +
      `${spaces}  start:\n` +
      printAST(node.start, indent + 4) +
      '\n' +
      `${spaces}  end:\n` +
      printAST(node.end, indent + 4) +
      '\n' +
      `${spaces}  body:\n` +
      printAST(node.body, indent + 4)
    );
  }

  if (isRepeatForever(node)) {
    return `${spaces}RepeatForever\n` + `${spaces}  body:\n` + printAST(node.body, indent + 4);
  }

  if (isTryStatement(node)) {
    let result =
      `${spaces}TryStatement\n` +
      `${spaces}  try:\n` +
      printAST(node.tryBranch, indent + 4) +
      '\n' +
      `${spaces}  catch${node.catchVariable ? `(${node.catchVariable})` : ''}:\n` +
      printAST(node.catchBranch, indent + 4);
    return result;
  }

  if (isBreakStatement(node)) {
    return `${spaces}BreakStatement`;
  }

  if (isContinueStatement(node)) {
    return `${spaces}ContinueStatement`;
  }

  if (isReturnStatement(node)) {
    if (node.value) {
      return `${spaces}ReturnStatement\n` + printAST(node.value, indent + 2);
    }
    return `${spaces}ReturnStatement`;
  }

  if (isFunctionDeclaration(node)) {
    const paramsStr = node.parameters.map((p) => p.name).join(', ');
    const bodyStr = node.body.map((stmt) => printAST(stmt, indent + 2)).join('\n');
    const funcType = node.returnsValue ? 'to' : 'on';
    return `${spaces}FunctionDeclaration(${funcType} ${node.name}(${paramsStr}))\n${bodyStr}`;
  }

  if (isLambdaFunction(node)) {
    const paramsStr = node.parameters.map((p) => p.name).join(', ');
    const bodyStr = node.body.map((stmt) => printAST(stmt, indent + 2)).join('\n');
    return `${spaces}LambdaFunction(${paramsStr})\n${bodyStr}`;
  }

  return `${spaces}Unknown(${node.kind})`;
}
