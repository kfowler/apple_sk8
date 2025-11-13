/**
 * SK8Script Parser
 *
 * Parses tokens into an Abstract Syntax Tree (AST).
 */

import { Token, TokenType, getOperatorPrecedence } from '../lexer/token.js';
import {
  ASTNode,
  FunctionParameter,
  createLiteral,
  createIdentifier,
  createBinaryOp,
  createUnaryOp,
  createPropertyAccess,
  createIndexAccess,
  createGrouping,
  createAssignment,
  createFunctionCall,
  createListLiteral,
  createTableLiteral,
  createBlock,
  createIfStatement,
  createWhileStatement,
  createRepeatTimes,
  createRepeatWith,
  createRepeatForever,
  createTryStatement,
  createBreakStatement,
  createContinueStatement,
  createReturnStatement,
  createFunctionDeclaration,
  createLambdaFunction,
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
    return this.parseStatement();
  }

  /**
   * Parse a statement (control flow or expression)
   */
  private parseStatement(): ASTNode {
    // Function declarations
    if (this.check(TokenType.ON) || this.check(TokenType.TO)) {
      return this.parseFunctionDeclaration();
    }

    // Control flow statements
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }

    if (this.check(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }

    if (this.check(TokenType.REPEAT)) {
      return this.parseRepeatStatement();
    }

    if (this.check(TokenType.TRY)) {
      return this.parseTryStatement();
    }

    if (this.check(TokenType.BREAK)) {
      this.advance();
      return createBreakStatement();
    }

    if (this.check(TokenType.CONTINUE)) {
      this.advance();
      return createContinueStatement();
    }

    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    // Otherwise parse as expression
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
   * Parse postfix expression (property access, index access, function calls)
   */
  private parsePostfixExpression(): ASTNode {
    let expr = this.parsePrimary();

    while (!this.isAtEnd()) {
      // Function call: expr(args)
      if (this.check(TokenType.LPAREN)) {
        // Only treat as function call if expr is an identifier
        if (expr.kind === 'Identifier') {
          this.advance(); // Consume '('
          const args: ASTNode[] = [];

          if (!this.check(TokenType.RPAREN)) {
            do {
              args.push(this.parseExpression());
            } while (this.check(TokenType.COMMA) && this.advance());
          }

          this.consume(TokenType.RPAREN, "Expected ')' after function arguments");
          expr = createFunctionCall((expr as any).name, args);
          continue;
        }
        break;
      }

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

    // List literal: [1, 2, 3]
    if (this.check(TokenType.LBRACKET)) {
      return this.parseListLiteral();
    }

    // Table literal: {key: value}
    if (this.check(TokenType.LBRACE)) {
      return this.parseTableLiteral();
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

    // Function call: "call <name> with <args>"
    if (this.check(TokenType.CALL)) {
      return this.parseFunctionCallWithSyntax();
    }

    // Lambda function: "function(params) { body }"
    if (this.check(TokenType.FUNCTION)) {
      return this.parseLambdaFunction();
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
   * Parse list literal: [1, 2, 3]
   */
  private parseListLiteral(): ASTNode {
    this.consume(TokenType.LBRACKET, "Expected '['");
    const elements: ASTNode[] = [];

    if (!this.check(TokenType.RBRACKET)) {
      do {
        elements.push(this.parseExpression());
      } while (this.check(TokenType.COMMA) && this.advance());
    }

    this.consume(TokenType.RBRACKET, "Expected ']' after list elements");
    return createListLiteral(elements);
  }

  /**
   * Parse table literal: {key: value, key2: value2}
   */
  private parseTableLiteral(): ASTNode {
    this.consume(TokenType.LBRACE, "Expected '{'");
    const entries: Array<{ key: string; value: ASTNode }> = [];

    if (!this.check(TokenType.RBRACE)) {
      do {
        const keyToken = this.consume(TokenType.IDENTIFIER, 'Expected key name');
        this.consume(TokenType.COLON, "Expected ':' after key");
        const value = this.parseExpression();
        entries.push({ key: keyToken.value, value });
      } while (this.check(TokenType.COMMA) && this.advance());
    }

    this.consume(TokenType.RBRACE, "Expected '}' after table entries");
    return createTableLiteral(entries);
  }

  /**
   * Parse function call with "call ... with ..." syntax
   * Example: "call myFunc with arg1, arg2"
   */
  private parseFunctionCallWithSyntax(): ASTNode {
    this.consume(TokenType.CALL, "Expected 'call'");
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected function name after "call"');
    const name = nameToken.value;

    const args: ASTNode[] = [];

    // Check for "with" keyword
    if (this.check(TokenType.WITH)) {
      this.advance(); // Consume 'with'

      // Parse comma-separated arguments
      do {
        args.push(this.parseExpression());
      } while (this.check(TokenType.COMMA) && this.advance());
    }

    return createFunctionCall(name, args);
  }

  /**
   * Parse lambda/anonymous function
   * Example: "function(x, y) { return x + y }"
   */
  private parseLambdaFunction(): ASTNode {
    this.consume(TokenType.FUNCTION, "Expected 'function'");

    // Parse parameters
    const parameters: FunctionParameter[] = [];
    this.consume(TokenType.LPAREN, "Expected '(' after 'function'");

    if (!this.check(TokenType.RPAREN)) {
      do {
        const paramToken = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');

        // Check for default value
        let defaultValue: ASTNode | undefined = undefined;
        if (this.check(TokenType.EQUALS)) {
          this.advance(); // Consume '='
          defaultValue = this.parsePrimary();
        }

        parameters.push({
          name: paramToken.value,
          defaultValue,
        });
      } while (this.check(TokenType.COMMA) && this.advance());
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameters");

    // Parse body - can be either a block { ... } or a single expression
    const body: ASTNode[] = [];

    if (this.check(TokenType.LBRACE)) {
      this.advance(); // Consume '{'

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        body.push(this.parseStatement());
      }

      this.consume(TokenType.RBRACE, "Expected '}' after lambda body");
    } else {
      // Single expression body (implicit return)
      const expr = this.parseExpression();
      body.push(createReturnStatement(expr));
    }

    return createLambdaFunction(parameters, body);
  }

  /**
   * Parse if statement: "if <condition> then <block> [else <block>] end"
   */
  private parseIfStatement(): ASTNode {
    this.consume(TokenType.IF, "Expected 'if'");
    const condition = this.parseExpression();
    this.consume(TokenType.THEN, "Expected 'then' after if condition");

    // Parse then branch
    const thenBranch = this.parseBlock();

    // Check for else or else if
    let elseBranch: ASTNode | undefined;
    if (this.check(TokenType.ELSE)) {
      this.advance(); // Consume 'else'

      // Check for "else if"
      if (this.check(TokenType.IF)) {
        elseBranch = this.parseIfStatement();
      } else {
        elseBranch = this.parseBlock();
        this.consume(TokenType.END, "Expected 'end' after else block");
      }
    } else {
      this.consume(TokenType.END, "Expected 'end' after if statement");
    }

    return createIfStatement(condition, thenBranch, elseBranch);
  }

  /**
   * Parse while statement: "while <condition> <block> end"
   */
  private parseWhileStatement(): ASTNode {
    this.consume(TokenType.WHILE, "Expected 'while'");
    const condition = this.parseExpression();
    const body = this.parseBlock();
    this.consume(TokenType.END, "Expected 'end' after while loop");
    return createWhileStatement(condition, body);
  }

  /**
   * Parse repeat statement (multiple forms)
   */
  private parseRepeatStatement(): ASTNode {
    this.consume(TokenType.REPEAT, "Expected 'repeat'");

    // "repeat forever"
    if (this.check(TokenType.FOREVER)) {
      this.advance();
      const body = this.parseBlock();
      this.consume(TokenType.END, "Expected 'end' after repeat forever");
      return createRepeatForever(body);
    }

    // "repeat with <var> from <start> to <end>"
    if (this.check(TokenType.WITH)) {
      this.advance(); // Consume 'with'
      const varToken = this.consume(TokenType.IDENTIFIER, 'Expected variable name after "with"');
      this.consume(TokenType.FROM, "Expected 'from' after variable name");
      const start = this.parseExpression();
      this.consume(TokenType.TO, "Expected 'to' after start value");
      const end = this.parseExpression();
      const body = this.parseBlock();
      this.consume(TokenType.END, "Expected 'end' after repeat with loop");
      return createRepeatWith(varToken.value, start, end, body);
    }

    // "repeat <count> times"
    const count = this.parseExpression();
    this.consume(TokenType.TIMES, "Expected 'times' after repeat count");
    const body = this.parseBlock();
    this.consume(TokenType.END, "Expected 'end' after repeat times loop");
    return createRepeatTimes(count, body);
  }

  /**
   * Parse try/catch statement: "try <block> catch [<var>] <block> end"
   */
  private parseTryStatement(): ASTNode {
    this.consume(TokenType.TRY, "Expected 'try'");
    const tryBranch = this.parseBlock();
    this.consume(TokenType.CATCH, "Expected 'catch' after try block");

    // Optional catch variable
    let catchVariable: string | undefined;
    if (this.check(TokenType.IDENTIFIER)) {
      catchVariable = this.advance().value;
    }

    const catchBranch = this.parseBlock();
    this.consume(TokenType.END, "Expected 'end' after catch block");
    return createTryStatement(tryBranch, catchBranch, catchVariable);
  }

  /**
   * Parse return statement: "return [<expr>]"
   */
  private parseReturnStatement(): ASTNode {
    this.consume(TokenType.RETURN, "Expected 'return'");

    // Check if there's a value to return
    if (this.check(TokenType.END) || this.isAtEnd()) {
      return createReturnStatement();
    }

    const value = this.parseExpression();
    return createReturnStatement(value);
  }

  /**
   * Parse function declaration: "on <name> [params] ... end" or "to <name> [params] ... end"
   */
  private parseFunctionDeclaration(): ASTNode {
    // Check if it's 'on' (handler) or 'to' (function with return value)
    const returnsValue = this.check(TokenType.TO);
    this.advance(); // Consume 'on' or 'to'

    // Parse function name
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected function name');
    const name = nameToken.value;

    // Parse parameters
    const parameters: FunctionParameter[] = [];

    // Check if there are parameters (not immediately 'end' or newline)
    if (!this.check(TokenType.END) && !this.isAtEnd()) {
      // Try to parse parameters - they can be comma-separated or just space-separated
      while (!this.check(TokenType.END) && !this.isAtEnd()) {
        // Check if this looks like the start of the body
        if (
          this.check(TokenType.IF) ||
          this.check(TokenType.WHILE) ||
          this.check(TokenType.REPEAT) ||
          this.check(TokenType.SET) ||
          this.check(TokenType.RETURN)
        ) {
          break;
        }

        // Parse parameter name
        const paramToken = this.peek();
        if (paramToken.type !== TokenType.IDENTIFIER) {
          break;
        }
        this.advance();

        // Check for default value (e.g., "param = value")
        let defaultValue: ASTNode | undefined = undefined;
        if (this.check(TokenType.EQUALS)) {
          this.advance(); // Consume '='
          defaultValue = this.parsePrimary();
        }

        parameters.push({
          name: paramToken.value,
          defaultValue,
        });

        // Check for comma separator
        if (this.check(TokenType.COMMA)) {
          this.advance();
        } else {
          // No comma, stop parsing parameters
          break;
        }
      }
    }

    // Parse function body
    const body: ASTNode[] = [];
    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    // Consume 'end'
    this.consume(TokenType.END, "Expected 'end' after function body");

    return createFunctionDeclaration(name, parameters, body, returnsValue);
  }

  /**
   * Parse a block of statements (until 'end', 'else', 'catch', etc.)
   */
  private parseBlock(): ASTNode {
    const statements: ASTNode[] = [];

    while (
      !this.isAtEnd() &&
      !this.check(TokenType.END) &&
      !this.check(TokenType.ELSE) &&
      !this.check(TokenType.CATCH)
    ) {
      statements.push(this.parseStatement());
    }

    if (statements.length === 0) {
      return createBlock([]);
    }

    if (statements.length === 1) {
      return statements[0];
    }

    return createBlock(statements);
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
