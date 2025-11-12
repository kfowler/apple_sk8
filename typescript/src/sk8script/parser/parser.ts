/**
 * SK8Script Parser
 *
 * Parses tokens into an Abstract Syntax Tree (AST).
 */

import { Token, TokenType, getOperatorPrecedence } from '../lexer/token.js';
import {
  ASTNode,
  createLiteral,
  createIdentifier,
  createBinaryOp,
  createUnaryOp,
  createPropertyAccess,
  createIndexAccess,
  createGrouping,
  createAssignment,
} from './ast.js';

/**
 * Parser error class
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public token: Token
  ) {
    super(`Parser error at ${token.line}:${token.column}: ${message}`);
    this.name = 'ParserError';
  }
}

/**
 * Parser class for building AST from tokens
 */
export class Parser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    // Filter out newlines and comments for simpler parsing
    this.tokens = tokens.filter(
      (token) => token.type !== TokenType.NEWLINE && token.type !== TokenType.COMMENT
    );
  }

  /**
   * Parse tokens into an AST
   */
  parse(): ASTNode {
    return this.parseExpression();
  }

  /**
   * Parse an expression (top level)
   */
  private parseExpression(): ASTNode {
    // Check for assignment: "set X to Y"
    if (this.check(TokenType.SET)) {
      return this.parseAssignment();
    }

    return this.parseBinaryExpression(0);
  }

  /**
   * Parse assignment: "set X to Y"
   */
  private parseAssignment(): ASTNode {
    this.consume(TokenType.SET, "Expected 'set'");
    const target = this.parsePrimary();
    this.consume(TokenType.TO, "Expected 'to' after assignment target");
    const value = this.parseExpression();
    return createAssignment(target, value);
  }

  /**
   * Parse binary expression with precedence climbing
   */
  private parseBinaryExpression(minPrecedence: number): ASTNode {
    let left = this.parseUnaryExpression();

    while (!this.isAtEnd()) {
      const token = this.peek();
      const precedence = getOperatorPrecedence(token.type);

      if (precedence === 0 || precedence < minPrecedence) {
        break;
      }

      this.advance(); // Consume operator
      const right = this.parseBinaryExpression(precedence + 1);
      left = createBinaryOp(token.type, left, right);
    }

    return left;
  }

  /**
   * Parse unary expression (-, not)
   */
  private parseUnaryExpression(): ASTNode {
    if (this.check(TokenType.MINUS) || this.check(TokenType.NOT)) {
      const operator = this.advance();
      const operand = this.parseUnaryExpression();
      return createUnaryOp(operator.type, operand);
    }

    return this.parsePostfixExpression();
  }

  /**
   * Parse postfix expression (property access, index access)
   */
  private parsePostfixExpression(): ASTNode {
    let expr = this.parsePrimary();

    while (!this.isAtEnd()) {
      // Array/list indexing: expr[index]
      if (this.check(TokenType.LBRACKET)) {
        this.advance(); // Consume '['
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Expected ']' after index");
        expr = createIndexAccess(index, expr);
        continue;
      }

      // Property access with dot notation: expr.property
      if (this.check(TokenType.DOT)) {
        this.advance(); // Consume '.'
        const property = this.consume(TokenType.IDENTIFIER, 'Expected property name after "."');
        expr = createPropertyAccess(property.value, expr);
        continue;
      }

      break;
    }

    return expr;
  }

  /**
   * Parse primary expression
   */
  private parsePrimary(): ASTNode {
    // Literals
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return createLiteral(token.literal as number);
    }

    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return createLiteral(token.literal as string);
    }

    if (this.check(TokenType.TRUE)) {
      this.advance();
      return createLiteral(true);
    }

    if (this.check(TokenType.FALSE)) {
      this.advance();
      return createLiteral(false);
    }

    if (this.check(TokenType.NULL)) {
      this.advance();
      return createLiteral(null);
    }

    // Parenthesized expression
    if (this.check(TokenType.LPAREN)) {
      this.advance(); // Consume '('
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return createGrouping(expr);
    }

    // Property access: "the X of Y"
    if (this.check(TokenType.THE)) {
      return this.parsePropertyAccess();
    }

    // Index access: "item N of X"
    if (this.check(TokenType.ITEM)) {
      return this.parseItemAccess();
    }

    // Identifier
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.advance();
      return createIdentifier(token.value);
    }

    const token = this.peek();
    throw new ParserError(`Unexpected token: ${token.type}`, token);
  }

  /**
   * Parse property access: "the X of Y"
   */
  private parsePropertyAccess(): ASTNode {
    this.consume(TokenType.THE, "Expected 'the'");
    const property = this.consume(TokenType.IDENTIFIER, "Expected property name after 'the'");
    this.consume(TokenType.OF, "Expected 'of' after property name");
    const object = this.parsePrimary();
    return createPropertyAccess(property.value, object);
  }

  /**
   * Parse item access: "item N of X"
   */
  private parseItemAccess(): ASTNode {
    this.consume(TokenType.ITEM, "Expected 'item'");
    const index = this.parsePrimary();
    this.consume(TokenType.OF, "Expected 'of' after index");
    const object = this.parsePrimary();
    return createIndexAccess(index, object);
  }

  /**
   * Check if current token matches the expected type
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Consume a token of the expected type or throw an error
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw new ParserError(message, this.peek());
  }

  /**
   * Advance to the next token
   */
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.position++;
    }
    return this.previous();
  }

  /**
   * Get the current token without advancing
   */
  private peek(): Token {
    return this.tokens[this.position];
  }

  /**
   * Get the previous token
   */
  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  /**
   * Check if we're at the end of the token stream
   */
  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.peek().type === TokenType.EOF;
  }
}

/**
 * Convenience function to parse tokens into an AST
 */
export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  return parser.parse();
}
