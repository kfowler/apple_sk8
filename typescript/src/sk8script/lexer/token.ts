/**
 * SK8Script Lexer - Token System
 *
 * Defines token types and the Token class for SK8Script lexical analysis.
 * SK8Script is a natural-language style scripting language.
 */

/**
 * All token types in SK8Script
 */
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NULL = 'NULL',

  // Identifiers and keywords
  IDENTIFIER = 'IDENTIFIER',
  KEYWORD = 'KEYWORD',

  // Keywords
  THE = 'THE',
  OF = 'OF',
  SET = 'SET',
  TO = 'TO',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  END = 'END',
  REPEAT = 'REPEAT',
  WHILE = 'WHILE',
  WITH = 'WITH',
  ITEM = 'ITEM',
  NOT = 'NOT',
  AND = 'AND',
  OR = 'OR',

  // Operators
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  STAR = 'STAR', // *
  SLASH = 'SLASH', // /
  PERCENT = 'PERCENT', // %
  CARET = 'CARET', // ^ (power)
  AMPERSAND = 'AMPERSAND', // & (string concatenation)

  // Comparison
  EQUALS = 'EQUALS', // =
  NOT_EQUALS = 'NOT_EQUALS', // ≠ or !=
  LESS_THAN = 'LESS_THAN', // <
  GREATER_THAN = 'GREATER_THAN', // >
  LESS_EQUAL = 'LESS_EQUAL', // ≤ or <=
  GREATER_EQUAL = 'GREATER_EQUAL', // ≥ or >=

  // Delimiters
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .
  COLON = 'COLON', // :
  SEMICOLON = 'SEMICOLON', // ;

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
}

/**
 * Token class representing a lexical token
 */
export class Token {
  constructor(
    public type: TokenType,
    public value: string,
    public line: number,
    public column: number,
    public literal?: number | string | boolean | null
  ) {}

  /**
   * Returns a string representation of the token for debugging
   */
  toString(): string {
    if (this.literal !== undefined) {
      return `Token(${this.type}, '${this.value}', ${this.literal}, ${this.line}:${this.column})`;
    }
    return `Token(${this.type}, '${this.value}', ${this.line}:${this.column})`;
  }

  /**
   * Check if token is a keyword
   */
  isKeyword(): boolean {
    return (
      this.type === TokenType.THE ||
      this.type === TokenType.OF ||
      this.type === TokenType.SET ||
      this.type === TokenType.TO ||
      this.type === TokenType.IF ||
      this.type === TokenType.THEN ||
      this.type === TokenType.ELSE ||
      this.type === TokenType.END ||
      this.type === TokenType.REPEAT ||
      this.type === TokenType.WHILE ||
      this.type === TokenType.WITH ||
      this.type === TokenType.ITEM ||
      this.type === TokenType.NOT ||
      this.type === TokenType.AND ||
      this.type === TokenType.OR
    );
  }

  /**
   * Check if token is an operator
   */
  isOperator(): boolean {
    return (
      this.type === TokenType.PLUS ||
      this.type === TokenType.MINUS ||
      this.type === TokenType.STAR ||
      this.type === TokenType.SLASH ||
      this.type === TokenType.PERCENT ||
      this.type === TokenType.CARET ||
      this.type === TokenType.AMPERSAND ||
      this.type === TokenType.EQUALS ||
      this.type === TokenType.NOT_EQUALS ||
      this.type === TokenType.LESS_THAN ||
      this.type === TokenType.GREATER_THAN ||
      this.type === TokenType.LESS_EQUAL ||
      this.type === TokenType.GREATER_EQUAL
    );
  }

  /**
   * Check if token is a literal
   */
  isLiteral(): boolean {
    return (
      this.type === TokenType.NUMBER ||
      this.type === TokenType.STRING ||
      this.type === TokenType.TRUE ||
      this.type === TokenType.FALSE ||
      this.type === TokenType.NULL
    );
  }

  /**
   * Check if token is a comparison operator
   */
  isComparisonOp(): boolean {
    return (
      this.type === TokenType.EQUALS ||
      this.type === TokenType.NOT_EQUALS ||
      this.type === TokenType.LESS_THAN ||
      this.type === TokenType.GREATER_THAN ||
      this.type === TokenType.LESS_EQUAL ||
      this.type === TokenType.GREATER_EQUAL
    );
  }
}

/**
 * Keywords map for quick lookup
 */
export const KEYWORDS: Map<string, TokenType> = new Map([
  ['the', TokenType.THE],
  ['of', TokenType.OF],
  ['set', TokenType.SET],
  ['to', TokenType.TO],
  ['if', TokenType.IF],
  ['then', TokenType.THEN],
  ['else', TokenType.ELSE],
  ['end', TokenType.END],
  ['repeat', TokenType.REPEAT],
  ['while', TokenType.WHILE],
  ['with', TokenType.WITH],
  ['item', TokenType.ITEM],
  ['not', TokenType.NOT],
  ['and', TokenType.AND],
  ['or', TokenType.OR],
  ['true', TokenType.TRUE],
  ['false', TokenType.FALSE],
  ['null', TokenType.NULL],
]);

/**
 * Get operator precedence (higher number = higher precedence)
 */
export function getOperatorPrecedence(type: TokenType): number {
  switch (type) {
    case TokenType.OR:
      return 1;
    case TokenType.AND:
      return 2;
    case TokenType.EQUALS:
    case TokenType.NOT_EQUALS:
    case TokenType.LESS_THAN:
    case TokenType.GREATER_THAN:
    case TokenType.LESS_EQUAL:
    case TokenType.GREATER_EQUAL:
      return 3;
    case TokenType.AMPERSAND: // String concatenation
      return 4;
    case TokenType.PLUS:
    case TokenType.MINUS:
      return 5;
    case TokenType.STAR:
    case TokenType.SLASH:
    case TokenType.PERCENT:
      return 6;
    case TokenType.CARET: // Power
      return 7;
    default:
      return 0;
  }
}
