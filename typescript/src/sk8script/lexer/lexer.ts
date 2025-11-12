/**
 * SK8Script Lexer
 *
 * Tokenizes SK8Script source code into a stream of tokens.
 */

import { Token, TokenType, KEYWORDS } from './token.js';

/**
 * Lexer error class
 */
export class LexerError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`Lexer error at ${line}:${column}: ${message}`);
    this.name = 'LexerError';
  }
}

/**
 * Lexer class for tokenizing SK8Script source code
 */
export class Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the source code and return an array of tokens
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    // Add EOF token
    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.column));
    return this.tokens;
  }

  /**
   * Scan a single token
   */
  private scanToken(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.advance();

    // Whitespace (except newlines)
    if (char === ' ' || char === '\t' || char === '\r') {
      return; // Skip whitespace
    }

    // Newlines
    if (char === '\n') {
      this.tokens.push(new Token(TokenType.NEWLINE, '\\n', startLine, startColumn));
      return;
    }

    // Comments (-- style)
    if (char === '-' && this.peek() === '-') {
      this.skipComment();
      return;
    }

    // Numbers
    if (this.isDigit(char)) {
      this.scanNumber(start, startLine, startColumn);
      return;
    }

    // Strings
    if (char === '"' || char === "'") {
      this.scanString(char, startLine, startColumn);
      return;
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      this.scanIdentifier(start, startLine, startColumn);
      return;
    }

    // Operators and punctuation
    switch (char) {
      case '+':
        this.addToken(TokenType.PLUS, char, startLine, startColumn);
        break;
      case '-':
        this.addToken(TokenType.MINUS, char, startLine, startColumn);
        break;
      case '*':
        this.addToken(TokenType.STAR, char, startLine, startColumn);
        break;
      case '/':
        this.addToken(TokenType.SLASH, char, startLine, startColumn);
        break;
      case '%':
        this.addToken(TokenType.PERCENT, char, startLine, startColumn);
        break;
      case '^':
        this.addToken(TokenType.CARET, char, startLine, startColumn);
        break;
      case '&':
        this.addToken(TokenType.AMPERSAND, char, startLine, startColumn);
        break;
      case '(':
        this.addToken(TokenType.LPAREN, char, startLine, startColumn);
        break;
      case ')':
        this.addToken(TokenType.RPAREN, char, startLine, startColumn);
        break;
      case '[':
        this.addToken(TokenType.LBRACKET, char, startLine, startColumn);
        break;
      case ']':
        this.addToken(TokenType.RBRACKET, char, startLine, startColumn);
        break;
      case '{':
        this.addToken(TokenType.LBRACE, char, startLine, startColumn);
        break;
      case '}':
        this.addToken(TokenType.RBRACE, char, startLine, startColumn);
        break;
      case ',':
        this.addToken(TokenType.COMMA, char, startLine, startColumn);
        break;
      case '.':
        this.addToken(TokenType.DOT, char, startLine, startColumn);
        break;
      case ':':
        this.addToken(TokenType.COLON, char, startLine, startColumn);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON, char, startLine, startColumn);
        break;
      case '=':
        this.addToken(TokenType.EQUALS, char, startLine, startColumn);
        break;
      case '<':
        if (this.match('=')) {
          this.addToken(TokenType.LESS_EQUAL, '<=', startLine, startColumn);
        } else {
          this.addToken(TokenType.LESS_THAN, char, startLine, startColumn);
        }
        break;
      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.GREATER_EQUAL, '>=', startLine, startColumn);
        } else {
          this.addToken(TokenType.GREATER_THAN, char, startLine, startColumn);
        }
        break;
      case '!':
        if (this.match('=')) {
          this.addToken(TokenType.NOT_EQUALS, '!=', startLine, startColumn);
        } else {
          throw new LexerError(`Unexpected character: ${char}`, startLine, startColumn);
        }
        break;
      case '≠':
        this.addToken(TokenType.NOT_EQUALS, char, startLine, startColumn);
        break;
      case '≤':
        this.addToken(TokenType.LESS_EQUAL, char, startLine, startColumn);
        break;
      case '≥':
        this.addToken(TokenType.GREATER_EQUAL, char, startLine, startColumn);
        break;
      default:
        throw new LexerError(`Unexpected character: ${char}`, startLine, startColumn);
    }
  }

  /**
   * Scan a number (integer, float, or scientific notation)
   */
  private scanNumber(start: number, startLine: number, startColumn: number): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal point
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Consume the '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Look for scientific notation
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance(); // Consume the 'e' or 'E'
      if (this.peek() === '+' || this.peek() === '-') {
        this.advance(); // Consume the sign
      }
      if (!this.isDigit(this.peek())) {
        throw new LexerError('Invalid scientific notation', startLine, startColumn);
      }
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.position);
    const literal = parseFloat(value);
    this.tokens.push(new Token(TokenType.NUMBER, value, startLine, startColumn, literal));
  }

  /**
   * Scan a string literal
   */
  private scanString(quote: string, startLine: number, startColumn: number): void {
    const chars: string[] = [];

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\n') {
        throw new LexerError('Unterminated string', startLine, startColumn);
      }

      // Handle escape sequences
      if (this.peek() === '\\') {
        this.advance(); // Consume the backslash
        if (this.isAtEnd()) {
          throw new LexerError('Unterminated string', startLine, startColumn);
        }

        const escapeChar = this.advance();
        switch (escapeChar) {
          case 'n':
            chars.push('\n');
            break;
          case 't':
            chars.push('\t');
            break;
          case 'r':
            chars.push('\r');
            break;
          case '\\':
            chars.push('\\');
            break;
          case '"':
            chars.push('"');
            break;
          case "'":
            chars.push("'");
            break;
          default:
            throw new LexerError(`Invalid escape sequence: \\${escapeChar}`, this.line, this.column);
        }
      } else {
        chars.push(this.advance());
      }
    }

    if (this.isAtEnd()) {
      throw new LexerError('Unterminated string', startLine, startColumn);
    }

    // Consume closing quote
    this.advance();

    const value = chars.join('');
    this.tokens.push(new Token(TokenType.STRING, value, startLine, startColumn, value));
  }

  /**
   * Scan an identifier or keyword
   */
  private scanIdentifier(start: number, startLine: number, startColumn: number): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    const lowerValue = value.toLowerCase();

    // Check if it's a keyword
    const keywordType = KEYWORDS.get(lowerValue);
    if (keywordType) {
      // Handle boolean and null literals
      if (keywordType === TokenType.TRUE) {
        this.tokens.push(new Token(keywordType, value, startLine, startColumn, true));
      } else if (keywordType === TokenType.FALSE) {
        this.tokens.push(new Token(keywordType, value, startLine, startColumn, false));
      } else if (keywordType === TokenType.NULL) {
        this.tokens.push(new Token(keywordType, value, startLine, startColumn, null));
      } else {
        this.tokens.push(new Token(keywordType, value, startLine, startColumn));
      }
    } else {
      this.tokens.push(new Token(TokenType.IDENTIFIER, value, startLine, startColumn));
    }
  }

  /**
   * Skip a comment (from -- to end of line)
   */
  private skipComment(): void {
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }
  }

  /**
   * Add a token to the list
   */
  private addToken(type: TokenType, value: string, line: number, column: number): void {
    this.tokens.push(new Token(type, value, line, column));
  }

  /**
   * Advance to the next character
   */
  private advance(): string {
    const char = this.source.charAt(this.position);
    this.position++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  /**
   * Check if the next character matches the expected character
   */
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.position) !== expected) return false;
    this.advance();
    return true;
  }

  /**
   * Peek at the current character without advancing
   */
  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.position);
  }

  /**
   * Peek at the next character without advancing
   */
  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.position + 1);
  }

  /**
   * Check if we're at the end of the source
   */
  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  /**
   * Check if a character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Check if a character is alphabetic
   */
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  /**
   * Check if a character is alphanumeric
   */
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

/**
 * Convenience function to tokenize source code
 */
export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
