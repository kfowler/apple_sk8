/**
 * SK8Script Control Flow Tests
 *
 * Comprehensive tests for if/then/else, loops, and try/catch.
 */

import { tokenize } from '../src/sk8script/lexer/lexer.js';
import { parse } from '../src/sk8script/parser/parser.js';
import { evaluate, Evaluator } from '../src/sk8script/evaluator/evaluator.js';
import {
  isIfStatement,
  isWhileStatement,
  isRepeatTimes,
  isRepeatWith,
  isRepeatForever,
  isTryStatement,
  isBreakStatement,
  isContinueStatement,
  isReturnStatement,
} from '../src/sk8script/parser/ast.js';

// ========================================
// IF/THEN/ELSE PARSING TESTS (12 tests)
// ========================================

describe('SK8Script If/Then/Else Parsing', () => {
  it('should parse simple if/then/end', () => {
    const source = 'if x > 5 then set y to 10 end';
    const ast = parse(tokenize(source));
    expect(isIfStatement(ast)).toBe(true);
    if (isIfStatement(ast)) {
      expect(ast.elseBranch).toBeUndefined();
    }
  });

  it('should parse if/then/else/end', () => {
    const source = 'if x > 5 then set y to 10 else set y to 20 end';
    const ast = parse(tokenize(source));
    expect(isIfStatement(ast)).toBe(true);
    if (isIfStatement(ast)) {
      expect(ast.elseBranch).toBeDefined();
    }
  });

  it('should parse else if chain', () => {
    const source = 'if x = 1 then set y to 10 else if x = 2 then set y to 20 else set y to 30 end';
    const ast = parse(tokenize(source));
    expect(isIfStatement(ast)).toBe(true);
    if (isIfStatement(ast) && ast.elseBranch) {
      expect(isIfStatement(ast.elseBranch)).toBe(true);
    }
  });

  it('should parse nested if statements', () => {
    const source = 'if x > 5 then if y > 10 then set z to 1 end end';
    const ast = parse(tokenize(source));
    expect(isIfStatement(ast)).toBe(true);
  });
});

// ========================================
// IF/THEN/ELSE EVALUATION TESTS (10 tests)
// ========================================

describe('SK8Script If/Then/Else Evaluation', () => {
  it('should execute then branch when condition is true', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 10);
    const source = 'if x > 5 then set y to 100 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('y')).toBe(100);
  });

  it('should skip then branch when condition is false', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 3);
    evaluator.setVariable('y', 0);
    const source = 'if x > 5 then set y to 100 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('y')).toBe(0);
  });

  it('should execute else branch when condition is false', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 3);
    const source = 'if x > 5 then set y to 100 else set y to 200 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('y')).toBe(200);
  });

  it('should handle else if chain', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 2);
    const source = 'if x = 1 then set y to 10 else if x = 2 then set y to 20 else set y to 30 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('y')).toBe(20);
  });

  it('should handle else if with final else', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 5);
    const source = 'if x = 1 then set y to 10 else if x = 2 then set y to 20 else set y to 30 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('y')).toBe(30);
  });

  it('should handle nested if statements', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 10);
    evaluator.setVariable('y', 15);
    const source = 'if x > 5 then if y > 10 then set z to 100 end end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('z')).toBe(100);
  });

  it('should handle boolean conditions', () => {
    const evaluator = new Evaluator();
    const source = 'if true then set x to 1 else set x to 2 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(1);
  });

  it('should handle complex conditions', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 10);
    evaluator.setVariable('y', 5);
    const source = 'if x > 5 and y < 10 then set z to 1 else set z to 0 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('z')).toBe(1);
  });

  it('should return value from then branch', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 10);
    const source = 'if x > 5 then 100 else 200 end';
    const result = evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(result).toBe(100);
  });

  it('should return value from else branch', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 3);
    const source = 'if x > 5 then 100 else 200 end';
    const result = evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(result).toBe(200);
  });
});

// ========================================
// LOOP PARSING TESTS (10 tests)
// ========================================

describe('SK8Script Loop Parsing', () => {
  it('should parse repeat N times', () => {
    const source = 'repeat 5 times set x to x + 1 end';
    const ast = parse(tokenize(source));
    expect(isRepeatTimes(ast)).toBe(true);
  });

  it('should parse repeat with from/to', () => {
    const source = 'repeat with i from 1 to 10 set x to x + i end';
    const ast = parse(tokenize(source));
    expect(isRepeatWith(ast)).toBe(true);
    if (isRepeatWith(ast)) {
      expect(ast.variable).toBe('i');
    }
  });

  it('should parse while loop', () => {
    const source = 'while x < 100 set x to x + 1 end';
    const ast = parse(tokenize(source));
    expect(isWhileStatement(ast)).toBe(true);
  });

  it('should parse repeat forever', () => {
    const source = 'repeat forever set x to x + 1 end';
    const ast = parse(tokenize(source));
    expect(isRepeatForever(ast)).toBe(true);
  });

  it('should parse break statement', () => {
    const source = 'break';
    const ast = parse(tokenize(source));
    expect(isBreakStatement(ast)).toBe(true);
  });

  it('should parse continue statement', () => {
    const source = 'continue';
    const ast = parse(tokenize(source));
    expect(isContinueStatement(ast)).toBe(true);
  });

  it('should parse return statement without value', () => {
    const source = 'return';
    const ast = parse(tokenize(source));
    expect(isReturnStatement(ast)).toBe(true);
    if (isReturnStatement(ast)) {
      expect(ast.value).toBeUndefined();
    }
  });

  it('should parse return statement with value', () => {
    const source = 'return 42';
    const ast = parse(tokenize(source));
    expect(isReturnStatement(ast)).toBe(true);
    if (isReturnStatement(ast)) {
      expect(ast.value).toBeDefined();
    }
  });

  it('should parse nested loops', () => {
    const source = 'repeat 3 times repeat 2 times set x to x + 1 end end';
    const ast = parse(tokenize(source));
    expect(isRepeatTimes(ast)).toBe(true);
  });

  it('should parse loop with break', () => {
    const source = 'while true if x > 10 then break end end';
    const ast = parse(tokenize(source));
    expect(isWhileStatement(ast)).toBe(true);
  });
});

// ========================================
// REPEAT TIMES EVALUATION TESTS (5 tests)
// ========================================

describe('SK8Script Repeat Times Evaluation', () => {
  it('should repeat N times', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'repeat 5 times set x to x + 1 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(5);
  });

  it('should handle repeat 0 times', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'repeat 0 times set x to x + 1 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(0);
  });

  it('should handle nested repeat times', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'repeat 3 times repeat 2 times set x to x + 1 end end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(6);
  });

  it('should handle break in repeat times', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'repeat 10 times set x to x + 1 if x = 5 then break end end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(5);
  });

  it('should handle continue in repeat times', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('sum', 0);
    evaluator.setVariable('count', 0);
    const source = `
      repeat 5 times
        set count to count + 1
        if count = 3 then continue end
        set sum to sum + count
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(12); // 1 + 2 + 4 + 5 = 12 (skips 3)
  });
});

// ========================================
// REPEAT WITH EVALUATION TESTS (6 tests)
// ========================================

describe('SK8Script Repeat With Evaluation', () => {
  it('should repeat with variable from 1 to N', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('sum', 0);
    const source = 'repeat with i from 1 to 5 set sum to sum + i end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(15); // 1+2+3+4+5
  });

  it('should set loop variable correctly', () => {
    const evaluator = new Evaluator();
    const source = 'repeat with i from 1 to 5 set x to i end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('i')).toBe(5);
    expect(evaluator.getVariable('x')).toBe(5);
  });

  it('should handle from > to (no iterations)', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'repeat with i from 10 to 5 set x to x + 1 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(0);
  });

  it('should handle negative ranges', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('sum', 0);
    const source = 'repeat with i from -2 to 2 set sum to sum + i end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(0); // -2+-1+0+1+2
  });

  it('should handle break in repeat with', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('sum', 0);
    const source = 'repeat with i from 1 to 10 set sum to sum + i if i = 5 then break end end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(15); // 1+2+3+4+5
  });

  it('should handle continue in repeat with', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('sum', 0);
    const source = `
      repeat with i from 1 to 5
        if i = 3 then continue end
        set sum to sum + i
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(12); // 1+2+4+5 (skips 3)
  });
});

// ========================================
// WHILE LOOP EVALUATION TESTS (5 tests)
// ========================================

describe('SK8Script While Loop Evaluation', () => {
  it('should execute while condition is true', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'while x < 5 set x to x + 1 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(5);
  });

  it('should not execute if condition is false initially', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 10);
    const source = 'while x < 5 set x to x + 1 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(10);
  });

  it('should handle break in while loop', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = 'while true set x to x + 1 if x = 5 then break end end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(5);
  });

  it('should handle continue in while loop', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    evaluator.setVariable('sum', 0);
    const source = `
      while x < 5
        set x to x + 1
        if x = 3 then continue end
        set sum to sum + x
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(12); // 1+2+4+5 (skips 3)
  });

  it('should handle complex condition', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    evaluator.setVariable('y', 0);
    const source = 'while x < 5 and y < 10 set x to x + 1 set y to y + 3 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(4);
    expect(evaluator.getVariable('y')).toBe(12);
  });
});

// ========================================
// TRY/CATCH PARSING TESTS (3 tests)
// ========================================

describe('SK8Script Try/Catch Parsing', () => {
  it('should parse try/catch/end', () => {
    const source = 'try set x to 1 catch set x to 0 end';
    const ast = parse(tokenize(source));
    expect(isTryStatement(ast)).toBe(true);
  });

  it('should parse try/catch with error variable', () => {
    const source = 'try set x to 1 catch e set y to e end';
    const ast = parse(tokenize(source));
    expect(isTryStatement(ast)).toBe(true);
    if (isTryStatement(ast)) {
      expect(ast.catchVariable).toBe('e');
    }
  });

  it('should parse try/catch without error variable', () => {
    const source = 'try set x to 1 catch set y to 0 end';
    const ast = parse(tokenize(source));
    expect(isTryStatement(ast)).toBe(true);
    if (isTryStatement(ast)) {
      expect(ast.catchVariable).toBeUndefined();
    }
  });
});

// ========================================
// TRY/CATCH EVALUATION TESTS (7 tests)
// ========================================

describe('SK8Script Try/Catch Evaluation', () => {
  it('should execute try block when no error', () => {
    const evaluator = new Evaluator();
    const source = 'try set x to 100 catch set x to 0 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(100);
  });

  it('should execute catch block on error', () => {
    const evaluator = new Evaluator();
    const source = 'try set x to y catch set x to 0 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(0);
  });

  it('should capture error message in variable', () => {
    const evaluator = new Evaluator();
    const source = 'try set x to y catch e set msg to e end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    const msg = evaluator.getVariable('msg');
    expect(msg).toContain('Undefined variable');
  });

  it('should not catch break exception', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    const source = `
      repeat 10 times
        try
          set x to x + 1
          if x = 5 then break end
        catch
          set y to 1
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(5);
    expect(evaluator.getVariable('y')).toBeUndefined();
  });

  it('should not catch continue exception', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 0);
    evaluator.setVariable('sum', 0);
    const source = `
      repeat 5 times
        set x to x + 1
        try
          if x = 3 then continue end
          set sum to sum + x
        catch
          set y to 1
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(12);
    expect(evaluator.getVariable('y')).toBeUndefined();
  });

  it('should catch errors in expressions', () => {
    const evaluator = new Evaluator();
    const source = 'try set x to undefined_var catch set x to -1 end';
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(-1);
  });

  it('should allow nested try/catch', () => {
    const evaluator = new Evaluator();
    const source = `
      try
        try
          set x to y
        catch
          set x to 10
        end
      catch
        set x to 0
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('x')).toBe(10);
  });
});

// ========================================
// INTEGRATION TESTS (7+ tests)
// ========================================

describe('SK8Script Control Flow Integration', () => {
  it('should handle if inside loop', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('sum', 0);
    const source = `
      repeat with i from 1 to 10
        if i % 2 = 0 then
          set sum to sum + i
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(30); // 2+4+6+8+10
  });

  it('should handle loop inside if', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('x', 10);
    evaluator.setVariable('sum', 0);
    const source = `
      if x > 5 then
        repeat 3 times
          set sum to sum + 1
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('sum')).toBe(3);
  });

  it('should handle try/catch inside loop', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('success', 0);
    evaluator.setVariable('errors', 0);
    const source = `
      repeat 3 times
        try
          set x to y
          set success to success + 1
        catch
          set errors to errors + 1
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('success')).toBe(0);
    expect(evaluator.getVariable('errors')).toBe(3);
  });

  it('should handle complex nested control flow', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('result', 0);
    const source = `
      repeat with i from 1 to 5
        if i < 3 then
          set result to result + i
        else
          if i = 4 then
            set result to result + 10
          end
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('result')).toBe(13); // 1+2+10
  });

  it('should handle FizzBuzz logic', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('output', '');
    const source = `
      repeat with i from 1 to 15
        if i % 15 = 0 then
          set output to output & "FizzBuzz,"
        else if i % 3 = 0 then
          set output to output & "Fizz,"
        else if i % 5 = 0 then
          set output to output & "Buzz,"
        else
          set temp to i
          set output to output & temp & ","
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    const output = evaluator.getVariable('output');
    expect(output).toContain('Fizz');
    expect(output).toContain('Buzz');
    expect(output).toContain('FizzBuzz');
  });

  it('should calculate factorial with while loop', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('n', 5);
    evaluator.setVariable('result', 1);
    const source = `
      while n > 0
        set result to result * n
        set n to n - 1
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('result')).toBe(120); // 5!
  });

  it('should calculate fibonacci with loop', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('a', 0);
    evaluator.setVariable('b', 1);
    const source = `
      repeat 8 times
        set temp to a + b
        set a to b
        set b to temp
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('b')).toBe(34); // 8th fibonacci number
  });

  it('should find prime numbers', () => {
    const evaluator = new Evaluator();
    evaluator.setVariable('count', 0);
    const source = `
      repeat with num from 2 to 20
        set isPrime to true
        repeat with i from 2 to num - 1
          if num % i = 0 then
            set isPrime to false
            break
          end
        end
        if isPrime then
          set count to count + 1
        end
      end
    `;
    evaluate(parse(tokenize(source)), evaluator.getContext());
    expect(evaluator.getVariable('count')).toBe(8); // Primes: 2,3,5,7,11,13,17,19
  });
});
