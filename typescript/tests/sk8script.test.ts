/**
 * SK8Script Tests
 *
 * Comprehensive tests for lexer, parser, and evaluator.
 */

import { tokenize } from '../src/sk8script/lexer/lexer.js';
import { TokenType } from '../src/sk8script/lexer/token.js';
import { parse } from '../src/sk8script/parser/parser.js';
import { evaluate, Evaluator } from '../src/sk8script/evaluator/evaluator.js';
import type { EvaluationContext } from '../src/sk8script/evaluator/evaluator.js';
import {
  isLiteral,
  isBinaryOp,
  isUnaryOp,
  isIdentifier,
  isPropertyAccess,
  isIndexAccess,
} from '../src/sk8script/parser/ast.js';

// ========================================
// LEXER TESTS (25+ tests)
// ========================================

describe('SK8Script Lexer', () => {
  describe('Numbers', () => {
    it('should tokenize integers', () => {
      const tokens = tokenize('42');
      expect(tokens).toHaveLength(2); // number + EOF
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(42);
    });

    it('should tokenize floats', () => {
      const tokens = tokenize('3.14');
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(3.14);
    });

    it('should tokenize scientific notation', () => {
      const tokens = tokenize('1.5e10');
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(1.5e10);
    });

    it('should tokenize negative scientific notation', () => {
      const tokens = tokenize('2.5e-3');
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(2.5e-3);
    });
  });

  describe('Strings', () => {
    it('should tokenize double-quoted strings', () => {
      const tokens = tokenize('"hello"');
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('hello');
    });

    it('should tokenize single-quoted strings', () => {
      const tokens = tokenize("'world'");
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('world');
    });

    it('should handle escape sequences in strings', () => {
      const tokens = tokenize('"hello\\nworld\\t!"');
      expect(tokens[0].literal).toBe('hello\nworld\t!');
    });

    it('should handle escaped quotes', () => {
      const tokens = tokenize('"say \\"hello\\""');
      expect(tokens[0].literal).toBe('say "hello"');
    });
  });

  describe('Identifiers and Keywords', () => {
    it('should tokenize identifiers', () => {
      const tokens = tokenize('myVariable');
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe('myVariable');
    });

    it('should tokenize keywords', () => {
      const tokens = tokenize('the of set to');
      expect(tokens[0].type).toBe(TokenType.THE);
      expect(tokens[1].type).toBe(TokenType.OF);
      expect(tokens[2].type).toBe(TokenType.SET);
      expect(tokens[3].type).toBe(TokenType.TO);
    });

    it('should be case-insensitive for keywords', () => {
      const tokens = tokenize('THE The the');
      expect(tokens[0].type).toBe(TokenType.THE);
      expect(tokens[1].type).toBe(TokenType.THE);
      expect(tokens[2].type).toBe(TokenType.THE);
    });

    it('should tokenize boolean literals', () => {
      const tokens = tokenize('true false');
      expect(tokens[0].type).toBe(TokenType.TRUE);
      expect(tokens[0].literal).toBe(true);
      expect(tokens[1].type).toBe(TokenType.FALSE);
      expect(tokens[1].literal).toBe(false);
    });

    it('should tokenize null', () => {
      const tokens = tokenize('null');
      expect(tokens[0].type).toBe(TokenType.NULL);
      expect(tokens[0].literal).toBe(null);
    });
  });

  describe('Operators', () => {
    it('should tokenize arithmetic operators', () => {
      const tokens = tokenize('+ - * / % ^');
      expect(tokens[0].type).toBe(TokenType.PLUS);
      expect(tokens[1].type).toBe(TokenType.MINUS);
      expect(tokens[2].type).toBe(TokenType.STAR);
      expect(tokens[3].type).toBe(TokenType.SLASH);
      expect(tokens[4].type).toBe(TokenType.PERCENT);
      expect(tokens[5].type).toBe(TokenType.CARET);
    });

    it('should tokenize comparison operators', () => {
      const tokens = tokenize('= != < > <= >=');
      expect(tokens[0].type).toBe(TokenType.EQUALS);
      expect(tokens[1].type).toBe(TokenType.NOT_EQUALS);
      expect(tokens[2].type).toBe(TokenType.LESS_THAN);
      expect(tokens[3].type).toBe(TokenType.GREATER_THAN);
      expect(tokens[4].type).toBe(TokenType.LESS_EQUAL);
      expect(tokens[5].type).toBe(TokenType.GREATER_EQUAL);
    });

    it('should tokenize logical operators', () => {
      const tokens = tokenize('and or not');
      expect(tokens[0].type).toBe(TokenType.AND);
      expect(tokens[1].type).toBe(TokenType.OR);
      expect(tokens[2].type).toBe(TokenType.NOT);
    });

    it('should tokenize string concatenation operator', () => {
      const tokens = tokenize('&');
      expect(tokens[0].type).toBe(TokenType.AMPERSAND);
    });
  });

  describe('Delimiters', () => {
    it('should tokenize parentheses', () => {
      const tokens = tokenize('( )');
      expect(tokens[0].type).toBe(TokenType.LPAREN);
      expect(tokens[1].type).toBe(TokenType.RPAREN);
    });

    it('should tokenize brackets', () => {
      const tokens = tokenize('[ ]');
      expect(tokens[0].type).toBe(TokenType.LBRACKET);
      expect(tokens[1].type).toBe(TokenType.RBRACKET);
    });

    it('should tokenize braces', () => {
      const tokens = tokenize('{ }');
      expect(tokens[0].type).toBe(TokenType.LBRACE);
      expect(tokens[1].type).toBe(TokenType.RBRACE);
    });

    it('should tokenize comma and semicolon', () => {
      const tokens = tokenize(', ;');
      expect(tokens[0].type).toBe(TokenType.COMMA);
      expect(tokens[1].type).toBe(TokenType.SEMICOLON);
    });
  });

  describe('Comments and Whitespace', () => {
    it('should skip whitespace', () => {
      const tokens = tokenize('   42   ');
      expect(tokens).toHaveLength(2); // number + EOF
    });

    it('should skip comments', () => {
      const tokens = tokenize('42 -- this is a comment');
      expect(tokens).toHaveLength(2); // number + EOF
    });

    it('should handle newlines', () => {
      // Newlines are filtered in parser, but lexer should generate them
      // For now, we just test that tokenizing works with newlines
      const tokens = tokenize('42\n43');
      expect(tokens.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Expressions', () => {
    it('should tokenize arithmetic expression', () => {
      const tokens = tokenize('5 + 3 * 2');
      expect(tokens).toHaveLength(6); // 5, +, 3, *, 2, EOF
    });

    it('should tokenize property access', () => {
      const tokens = tokenize('the left of myActor');
      expect(tokens[0].type).toBe(TokenType.THE);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].type).toBe(TokenType.OF);
      expect(tokens[3].type).toBe(TokenType.IDENTIFIER);
    });
  });
});

// ========================================
// PARSER TESTS (25+ tests)
// ========================================

describe('SK8Script Parser', () => {
  describe('Literals', () => {
    it('should parse number literals', () => {
      const tokens = tokenize('42');
      const ast = parse(tokens);
      expect(isLiteral(ast)).toBe(true);
      if (isLiteral(ast)) {
        expect(ast.value).toBe(42);
      }
    });

    it('should parse string literals', () => {
      const tokens = tokenize('"hello"');
      const ast = parse(tokens);
      expect(isLiteral(ast)).toBe(true);
      if (isLiteral(ast)) {
        expect(ast.value).toBe('hello');
      }
    });

    it('should parse boolean literals', () => {
      const tokens = tokenize('true');
      const ast = parse(tokens);
      expect(isLiteral(ast)).toBe(true);
      if (isLiteral(ast)) {
        expect(ast.value).toBe(true);
      }
    });

    it('should parse null literal', () => {
      const tokens = tokenize('null');
      const ast = parse(tokens);
      expect(isLiteral(ast)).toBe(true);
      if (isLiteral(ast)) {
        expect(ast.value).toBe(null);
      }
    });
  });

  describe('Identifiers', () => {
    it('should parse identifiers', () => {
      const tokens = tokenize('myVariable');
      const ast = parse(tokens);
      expect(isIdentifier(ast)).toBe(true);
      if (isIdentifier(ast)) {
        expect(ast.name).toBe('myVariable');
      }
    });
  });

  describe('Binary Operations', () => {
    it('should parse addition', () => {
      const tokens = tokenize('5 + 3');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.PLUS);
      }
    });

    it('should parse subtraction', () => {
      const tokens = tokenize('10 - 7');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.MINUS);
      }
    });

    it('should parse multiplication', () => {
      const tokens = tokenize('4 * 6');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.STAR);
      }
    });

    it('should parse division', () => {
      const tokens = tokenize('20 / 4');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.SLASH);
      }
    });

    it('should respect operator precedence (* before +)', () => {
      const tokens = tokenize('5 + 3 * 2');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.PLUS);
        expect(isBinaryOp(ast.right)).toBe(true);
        if (isBinaryOp(ast.right)) {
          expect(ast.right.operator).toBe(TokenType.STAR);
        }
      }
    });

    it('should respect operator precedence (/ before -)', () => {
      const tokens = tokenize('10 - 6 / 2');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.MINUS);
        expect(isBinaryOp(ast.right)).toBe(true);
      }
    });

    it('should parse comparison operators', () => {
      const tokens = tokenize('5 < 10');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.LESS_THAN);
      }
    });

    it('should parse logical operators', () => {
      const tokens = tokenize('true and false');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.AND);
      }
    });
  });

  describe('Unary Operations', () => {
    it('should parse unary minus', () => {
      const tokens = tokenize('-5');
      const ast = parse(tokens);
      expect(isUnaryOp(ast)).toBe(true);
      if (isUnaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.MINUS);
      }
    });

    it('should parse not operator', () => {
      const tokens = tokenize('not true');
      const ast = parse(tokens);
      expect(isUnaryOp(ast)).toBe(true);
      if (isUnaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.NOT);
      }
    });
  });

  describe('Grouping', () => {
    it('should parse parenthesized expressions', () => {
      const tokens = tokenize('(5 + 3) * 2');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
      if (isBinaryOp(ast)) {
        expect(ast.operator).toBe(TokenType.STAR);
      }
    });

    it('should handle nested parentheses', () => {
      const tokens = tokenize('((5))');
      const ast = parse(tokens);
      // Should eventually resolve to the literal 5
      expect(ast).toBeDefined();
    });
  });

  describe('Property Access', () => {
    it('should parse "the X of Y" syntax', () => {
      const tokens = tokenize('the left of myActor');
      const ast = parse(tokens);
      expect(isPropertyAccess(ast)).toBe(true);
      if (isPropertyAccess(ast)) {
        expect(ast.property).toBe('left');
        expect(isIdentifier(ast.object)).toBe(true);
      }
    });

    it('should parse dot notation', () => {
      const tokens = tokenize('myActor.left');
      const ast = parse(tokens);
      expect(isPropertyAccess(ast)).toBe(true);
      if (isPropertyAccess(ast)) {
        expect(ast.property).toBe('left');
      }
    });
  });

  describe('Index Access', () => {
    it('should parse "item N of X" syntax', () => {
      const tokens = tokenize('item 1 of myList');
      const ast = parse(tokens);
      expect(isIndexAccess(ast)).toBe(true);
      if (isIndexAccess(ast)) {
        expect(isLiteral(ast.index)).toBe(true);
      }
    });

    it('should parse bracket notation', () => {
      const tokens = tokenize('myList[0]');
      const ast = parse(tokens);
      expect(isIndexAccess(ast)).toBe(true);
    });
  });

  describe('Complex Expressions', () => {
    it('should parse complex arithmetic', () => {
      const tokens = tokenize('(5 + 3) * 2 - 4 / 2');
      const ast = parse(tokens);
      expect(isBinaryOp(ast)).toBe(true);
    });

    it('should parse chained property access', () => {
      const tokens = tokenize('myActor.container.width');
      const ast = parse(tokens);
      expect(isPropertyAccess(ast)).toBe(true);
    });
  });
});

// ========================================
// EVALUATOR TESTS (20+ tests)
// ========================================

describe('SK8Script Evaluator', () => {
  describe('Literals', () => {
    it('should evaluate number literals', () => {
      const tokens = tokenize('42');
      const ast = parse(tokens);
      const result = evaluate(ast);
      expect(result).toBe(42);
    });

    it('should evaluate string literals', () => {
      const tokens = tokenize('"hello"');
      const ast = parse(tokens);
      const result = evaluate(ast);
      expect(result).toBe('hello');
    });

    it('should evaluate boolean literals', () => {
      const tokens = tokenize('true');
      const ast = parse(tokens);
      const result = evaluate(ast);
      expect(result).toBe(true);
    });

    it('should evaluate null literal', () => {
      const tokens = tokenize('null');
      const ast = parse(tokens);
      const result = evaluate(ast);
      expect(result).toBe(null);
    });
  });

  describe('Arithmetic Operations', () => {
    it('should evaluate addition', () => {
      const result = evaluate(parse(tokenize('5 + 3')));
      expect(result).toBe(8);
    });

    it('should evaluate subtraction', () => {
      const result = evaluate(parse(tokenize('10 - 7')));
      expect(result).toBe(3);
    });

    it('should evaluate multiplication', () => {
      const result = evaluate(parse(tokenize('4 * 6')));
      expect(result).toBe(24);
    });

    it('should evaluate division', () => {
      const result = evaluate(parse(tokenize('20 / 4')));
      expect(result).toBe(5);
    });

    it('should evaluate modulo', () => {
      const result = evaluate(parse(tokenize('10 % 3')));
      expect(result).toBe(1);
    });

    it('should evaluate exponentiation', () => {
      const result = evaluate(parse(tokenize('2 ^ 3')));
      expect(result).toBe(8);
    });

    it('should respect operator precedence', () => {
      const result = evaluate(parse(tokenize('5 + 3 * 2')));
      expect(result).toBe(11); // 5 + 6, not 16
    });

    it('should handle parentheses', () => {
      const result = evaluate(parse(tokenize('(5 + 3) * 2')));
      expect(result).toBe(16); // (8) * 2
    });

    it('should handle complex expressions', () => {
      const result = evaluate(parse(tokenize('(5 + 3) * 2 - 4 / 2')));
      expect(result).toBe(14); // 16 - 2
    });
  });

  describe('Unary Operations', () => {
    it('should evaluate unary minus', () => {
      const result = evaluate(parse(tokenize('-5')));
      expect(result).toBe(-5);
    });

    it('should evaluate not operator', () => {
      const result = evaluate(parse(tokenize('not true')));
      expect(result).toBe(false);
    });

    it('should evaluate double negation', () => {
      const result = evaluate(parse(tokenize('not not true')));
      expect(result).toBe(true);
    });
  });

  describe('Comparison Operations', () => {
    it('should evaluate equality', () => {
      expect(evaluate(parse(tokenize('5 = 5')))).toBe(true);
      expect(evaluate(parse(tokenize('5 = 3')))).toBe(false);
    });

    it('should evaluate inequality', () => {
      expect(evaluate(parse(tokenize('5 != 3')))).toBe(true);
      expect(evaluate(parse(tokenize('5 != 5')))).toBe(false);
    });

    it('should evaluate less than', () => {
      expect(evaluate(parse(tokenize('3 < 5')))).toBe(true);
      expect(evaluate(parse(tokenize('5 < 3')))).toBe(false);
    });

    it('should evaluate greater than', () => {
      expect(evaluate(parse(tokenize('5 > 3')))).toBe(true);
      expect(evaluate(parse(tokenize('3 > 5')))).toBe(false);
    });

    it('should evaluate less than or equal', () => {
      expect(evaluate(parse(tokenize('3 <= 5')))).toBe(true);
      expect(evaluate(parse(tokenize('5 <= 5')))).toBe(true);
    });

    it('should evaluate greater than or equal', () => {
      expect(evaluate(parse(tokenize('5 >= 3')))).toBe(true);
      expect(evaluate(parse(tokenize('5 >= 5')))).toBe(true);
    });
  });

  describe('Logical Operations', () => {
    it('should evaluate AND', () => {
      expect(evaluate(parse(tokenize('true and true')))).toBe(true);
      expect(evaluate(parse(tokenize('true and false')))).toBe(false);
      expect(evaluate(parse(tokenize('false and false')))).toBe(false);
    });

    it('should evaluate OR', () => {
      expect(evaluate(parse(tokenize('true or false')))).toBe(true);
      expect(evaluate(parse(tokenize('false or true')))).toBe(true);
      expect(evaluate(parse(tokenize('false or false')))).toBe(false);
    });
  });

  describe('String Operations', () => {
    it('should concatenate strings', () => {
      const result = evaluate(parse(tokenize('"hello" & " " & "world"')));
      expect(result).toBe('hello world');
    });
  });

  describe('Variables', () => {
    it('should look up variables', () => {
      const context: EvaluationContext = {
        variables: new Map([['x', 42]]),
        functions: new Map(),
      };
      const result = evaluate(parse(tokenize('x')), context);
      expect(result).toBe(42);
    });

    it('should use variables in expressions', () => {
      const context: EvaluationContext = {
        variables: new Map([
          ['x', 5],
          ['y', 3],
        ]),
        functions: new Map(),
      };
      const result = evaluate(parse(tokenize('x + y * 2')), context);
      expect(result).toBe(11);
    });
  });

  describe('Property Access', () => {
    it('should access object properties', () => {
      const context: EvaluationContext = {
        variables: new Map([['obj', { left: 100, top: 50 }]]),
        functions: new Map(),
      };
      const result = evaluate(parse(tokenize('the left of obj')), context);
      expect(result).toBe(100);
    });

    it('should access properties with dot notation', () => {
      const context: EvaluationContext = {
        variables: new Map([['obj', { width: 200 }]]),
        functions: new Map(),
      };
      const result = evaluate(parse(tokenize('obj.width')), context);
      expect(result).toBe(200);
    });
  });

  describe('Index Access', () => {
    it('should access array elements (1-based)', () => {
      const context: EvaluationContext = {
        variables: new Map([['myList', [10, 20, 30]]]),
        functions: new Map(),
      };
      const result = evaluate(parse(tokenize('item 1 of myList')), context);
      expect(result).toBe(10);
    });

    it('should access array elements with bracket notation', () => {
      const context: EvaluationContext = {
        variables: new Map([['myList', [10, 20, 30]]]),
        functions: new Map(),
      };
      const result = evaluate(parse(tokenize('myList[2]')), context);
      expect(result).toBe(20); // SK8 uses 1-based indexing
    });
  });

  describe('Assignment', () => {
    it('should assign to variables', () => {
      const evaluator = new Evaluator();
      evaluate(parse(tokenize('set x to 42')), evaluator.getContext());
      expect(evaluator.getVariable('x')).toBe(42);
    });

    it('should assign and use variables', () => {
      const evaluator = new Evaluator();
      const ctx = evaluator.getContext();
      evaluate(parse(tokenize('set x to 5')), ctx);
      const result = evaluate(parse(tokenize('x + 3')), ctx);
      expect(result).toBe(8);
    });
  });
});

// ========================================
// INTEGRATION TESTS
// ========================================

describe('SK8Script Integration', () => {
  it('should handle complete workflow: lex -> parse -> evaluate', () => {
    const source = '(5 + 3) * 2';
    const tokens = tokenize(source);
    const ast = parse(tokens);
    const result = evaluate(ast);
    expect(result).toBe(16);
  });

  it('should handle natural language expressions', () => {
    const context: EvaluationContext = {
      variables: new Map([
        [
          'myActor',
          {
            left: 100,
            top: 50,
            width: 200,
            height: 150,
          },
        ],
      ]),
      functions: new Map(),
    };

    const result = evaluate(parse(tokenize('the left of myActor')), context);
    expect(result).toBe(100);
  });

  it('should handle list operations', () => {
    const context: EvaluationContext = {
      variables: new Map([['myList', [10, 20, 30, 40, 50]]]),
      functions: new Map(),
    };

    const result = evaluate(parse(tokenize('item 3 of myList')), context);
    expect(result).toBe(30);
  });

  it('should handle complex nested expressions', () => {
    const context: EvaluationContext = {
      variables: new Map([
        ['a', 10],
        ['b', 5],
        ['c', 2],
      ]),
      functions: new Map(),
    };

    const result = evaluate(parse(tokenize('(a + b) * c - 3')), context);
    expect(result).toBe(27); // (10 + 5) * 2 - 3 = 30 - 3 = 27
  });
});
