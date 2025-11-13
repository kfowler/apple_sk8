/**
 * SK8Script Functions Tests
 *
 * Comprehensive test suite for SK8Script function declarations, calls, and closures.
 */

import { Lexer } from '../src/sk8script/lexer/lexer';
import { Parser } from '../src/sk8script/parser/parser';
import { Evaluator } from '../src/sk8script/evaluator/evaluator';

/**
 * Helper function to execute SK8Script code
 */
function execute(code: string, evaluator?: Evaluator): any {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  if (!evaluator) {
    evaluator = new Evaluator();
  }

  return evaluator.evaluate(ast);
}

describe('SK8Script Functions - Declarations', () => {
  test('should declare a simple handler with "on"', () => {
    const evaluator = new Evaluator();
    execute('on greet\nreturn "Hello!"\nend', evaluator);

    // Function should be registered
    expect(evaluator.getFunction('greet')).toBeDefined();
  });

  test('should declare a function with "to"', () => {
    const evaluator = new Evaluator();
    execute('to square x\nreturn x * x\nend', evaluator);

    expect(evaluator.getFunction('square')).toBeDefined();
  });

  test('should declare function with multiple parameters', () => {
    const evaluator = new Evaluator();
    execute('to add x, y\nreturn x + y\nend', evaluator);

    expect(evaluator.getFunction('add')).toBeDefined();
  });

  test('should declare function with no parameters', () => {
    const evaluator = new Evaluator();
    execute('to getAnswer\nreturn 42\nend', evaluator);

    expect(evaluator.getFunction('getAnswer')).toBeDefined();
  });

  test('should support function with default parameter values', () => {
    const evaluator = new Evaluator();
    execute('to greet name = "World"\nreturn "Hello, " & name\nend', evaluator);

    expect(evaluator.getFunction('greet')).toBeDefined();
  });

  test('should handle multiple function declarations', () => {
    const evaluator = new Evaluator();
    execute('to double x\nreturn x * 2\nend', evaluator);
    execute('to triple x\nreturn x * 3\nend', evaluator);

    expect(evaluator.getFunction('double')).toBeDefined();
    expect(evaluator.getFunction('triple')).toBeDefined();
  });

  test('should handle function with multiple statements', () => {
    const evaluator = new Evaluator();
    execute(
      `to calculate x
      set result to x * 2
      set result to result + 10
      return result
      end`,
      evaluator
    );

    expect(evaluator.getFunction('calculate')).toBeDefined();
  });
});

describe('SK8Script Functions - Calls with Parentheses', () => {
  test('should call function with no arguments', () => {
    const evaluator = new Evaluator();
    execute('to getAnswer\nreturn 42\nend', evaluator);
    const result = execute('getAnswer()', evaluator);

    expect(result).toBe(42);
  });

  test('should call function with single argument', () => {
    const evaluator = new Evaluator();
    execute('to square x\nreturn x * x\nend', evaluator);
    const result = execute('square(5)', evaluator);

    expect(result).toBe(25);
  });

  test('should call function with multiple arguments', () => {
    const evaluator = new Evaluator();
    execute('to add x, y\nreturn x + y\nend', evaluator);
    const result = execute('add(3, 7)', evaluator);

    expect(result).toBe(10);
  });

  test('should call function with expression arguments', () => {
    const evaluator = new Evaluator();
    execute('to multiply x, y\nreturn x * y\nend', evaluator);
    const result = execute('multiply(2 + 3, 4)', evaluator);

    expect(result).toBe(20);
  });

  test('should handle nested function calls', () => {
    const evaluator = new Evaluator();
    execute('to double x\nreturn x * 2\nend', evaluator);
    execute('to square x\nreturn x * x\nend', evaluator);
    const result = execute('double(square(3))', evaluator);

    expect(result).toBe(18);
  });
});

describe('SK8Script Functions - Call Syntax Variants', () => {
  test('should call function with "call...with" syntax', () => {
    const evaluator = new Evaluator();
    execute('to add x, y\nreturn x + y\nend', evaluator);
    const result = execute('call add with 5, 10', evaluator);

    expect(result).toBe(15);
  });

  test('should call function with "call...with" and no arguments', () => {
    const evaluator = new Evaluator();
    execute('to getAnswer\nreturn 42\nend', evaluator);
    const result = execute('call getAnswer', evaluator);

    expect(result).toBe(42);
  });

  test('should call function with "call...with" and multiple arguments', () => {
    const evaluator = new Evaluator();
    execute('to sum a, b, c\nreturn a + b + c\nend', evaluator);
    const result = execute('call sum with 1, 2, 3', evaluator);

    expect(result).toBe(6);
  });
});

describe('SK8Script Functions - Parameters and Return Values', () => {
  test('should bind positional parameters correctly', () => {
    const evaluator = new Evaluator();
    execute('to greet name\nreturn "Hello, " & name & "!"\nend', evaluator);
    const result = execute('greet("Alice")', evaluator);

    expect(result).toBe('Hello, Alice!');
  });

  test('should use default parameter values', () => {
    const evaluator = new Evaluator();
    execute('to greet name = "World"\nreturn "Hello, " & name & "!"\nend', evaluator);
    const result = execute('greet()', evaluator);

    expect(result).toBe('Hello, World!');
  });

  test('should override default parameter values', () => {
    const evaluator = new Evaluator();
    execute('to greet name = "World"\nreturn "Hello, " & name & "!"\nend', evaluator);
    const result = execute('greet("Bob")', evaluator);

    expect(result).toBe('Hello, Bob!');
  });

  test('should return explicit values', () => {
    const evaluator = new Evaluator();
    execute('to getNumber\nreturn 123\nend', evaluator);
    const result = execute('getNumber()', evaluator);

    expect(result).toBe(123);
  });

  test('should return early from function', () => {
    const evaluator = new Evaluator();
    execute(
      `to checkValue x
      if x < 0 then
        return "negative"
      end
      return "positive"
      end`,
      evaluator
    );

    expect(execute('checkValue(-5)', evaluator)).toBe('negative');
    expect(execute('checkValue(5)', evaluator)).toBe('positive');
  });

  test('should handle functions with no return statement', () => {
    const evaluator = new Evaluator();
    execute('on doNothing\nset x to 1\nend', evaluator);
    const result = execute('doNothing()', evaluator);

    expect(result).toBeUndefined();
  });

  test('should throw error for missing required parameter', () => {
    const evaluator = new Evaluator();
    execute('to square x\nreturn x * x\nend', evaluator);

    expect(() => execute('square()', evaluator)).toThrow(/Missing required parameter/);
  });
});

describe('SK8Script Functions - Closures', () => {
  test('should capture variables from outer scope', () => {
    const evaluator = new Evaluator();
    execute('set multiplier to 10', evaluator);
    execute('to scale x\nreturn x * multiplier\nend', evaluator);
    const result = execute('scale(5)', evaluator);

    expect(result).toBe(50);
  });

  test('should maintain closure even when outer variable changes', () => {
    const evaluator = new Evaluator();
    execute('set count to 1', evaluator);
    execute('to getCount\nreturn count\nend', evaluator);

    // Call function
    expect(execute('getCount()', evaluator)).toBe(1);

    // Change outer variable
    execute('set count to 2', evaluator);

    // Function should see the new value
    expect(execute('getCount()', evaluator)).toBe(2);
  });

  test('should support nested function closures', () => {
    const evaluator = new Evaluator();
    execute('set outer to 10', evaluator);
    execute(
      `to makeAdder x
      to add y
        return x + y + outer
      end
      return add(5)
      end`,
      evaluator
    );

    const result = execute('makeAdder(3)', evaluator);
    expect(result).toBe(18); // 3 + 5 + 10
  });
});

describe('SK8Script Functions - Recursion', () => {
  test('should support recursive factorial function', () => {
    const evaluator = new Evaluator();
    execute(
      `to factorial n
      if n <= 1 then
        return 1
      else
        return n * factorial(n - 1)
      end
      end`,
      evaluator
    );

    expect(execute('factorial(0)', evaluator)).toBe(1);
    expect(execute('factorial(1)', evaluator)).toBe(1);
    expect(execute('factorial(5)', evaluator)).toBe(120);
    expect(execute('factorial(6)', evaluator)).toBe(720);
  });

  test('should support recursive fibonacci function', () => {
    const evaluator = new Evaluator();
    execute(
      `to fib n
      if n <= 1 then
        return n
      else
        return fib(n - 1) + fib(n - 2)
      end
      end`,
      evaluator
    );

    expect(execute('fib(0)', evaluator)).toBe(0);
    expect(execute('fib(1)', evaluator)).toBe(1);
    expect(execute('fib(5)', evaluator)).toBe(5);
    expect(execute('fib(10)', evaluator)).toBe(55);
  });

  test('should support recursive countdown', () => {
    const evaluator = new Evaluator();
    execute(
      `to countdown n
      if n <= 0 then
        return "Done!"
      else
        return countdown(n - 1)
      end
      end`,
      evaluator
    );

    const result = execute('countdown(5)', evaluator);
    expect(result).toBe('Done!');
  });

  test('should detect stack overflow', () => {
    const evaluator = new Evaluator();
    execute(
      `to infiniteRecursion
      return infiniteRecursion()
      end`,
      evaluator
    );

    expect(() => execute('infiniteRecursion()', evaluator)).toThrow(/Stack overflow/);
  });
});

describe('SK8Script Functions - Lambda Functions', () => {
  test('should create lambda function', () => {
    const evaluator = new Evaluator();
    const result = execute('function(x) { return x * 2 }', evaluator);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  test('should assign lambda to variable', () => {
    const evaluator = new Evaluator();
    execute('set double to function(x) { return x * 2 }', evaluator);
    const lambda = evaluator.getVariable('double');

    expect(lambda).toBeDefined();
  });

  test('should create lambda with multiple parameters', () => {
    const evaluator = new Evaluator();
    execute('set add to function(x, y) { return x + y }', evaluator);
    const lambda = evaluator.getVariable('add');

    expect(lambda).toBeDefined();
  });

  test('should create lambda with single expression (implicit return)', () => {
    const evaluator = new Evaluator();
    const result = execute('function(x) x * 3', evaluator);

    expect(result).toBeDefined();
  });

  test('should support lambda with default parameters', () => {
    const evaluator = new Evaluator();
    execute('set greet to function(name = "World") { return "Hello, " & name }', evaluator);

    expect(evaluator.getVariable('greet')).toBeDefined();
  });
});

describe('SK8Script Functions - Built-in Functions', () => {
  test('should register and call built-in function', () => {
    const evaluator = new Evaluator();
    evaluator.registerFunction('sqrt', (x: number) => Math.sqrt(x));

    const result = execute('sqrt(16)', evaluator);
    expect(result).toBe(4);
  });

  test('should register built-in with multiple parameters', () => {
    const evaluator = new Evaluator();
    evaluator.registerFunction('max', (a: number, b: number) => Math.max(a, b));

    const result = execute('max(5, 10)', evaluator);
    expect(result).toBe(10);
  });

  test('should call built-in and user-defined functions together', () => {
    const evaluator = new Evaluator();
    evaluator.registerFunction('abs', (x: number) => Math.abs(x));
    execute('to double x\nreturn x * 2\nend', evaluator);

    const result = execute('double(abs(-5))', evaluator);
    expect(result).toBe(10);
  });
});

describe('SK8Script Functions - Complex Examples', () => {
  test('should handle function composition', () => {
    const evaluator = new Evaluator();
    execute('to double x\nreturn x * 2\nend', evaluator);
    execute('to addTen x\nreturn x + 10\nend', evaluator);

    const result = execute('addTen(double(5))', evaluator);
    expect(result).toBe(20);
  });

  test('should handle multiple nested calls', () => {
    const evaluator = new Evaluator();
    execute('to add x, y\nreturn x + y\nend', evaluator);
    execute('to mult x, y\nreturn x * y\nend', evaluator);

    const result = execute('mult(add(2, 3), add(4, 1))', evaluator);
    expect(result).toBe(25);
  });

  test('should handle conditional returns', () => {
    const evaluator = new Evaluator();
    execute(
      `to abs x
      if x < 0 then
        return -x
      else
        return x
      end
      end`,
      evaluator
    );

    expect(execute('abs(-5)', evaluator)).toBe(5);
    expect(execute('abs(5)', evaluator)).toBe(5);
  });

  test('should handle functions with loops', () => {
    const evaluator = new Evaluator();
    execute(
      `to sumUpTo n
      set total to 0
      set i to 1
      while i <= n
        set total to total + i
        set i to i + 1
      end
      return total
      end`,
      evaluator
    );

    expect(execute('sumUpTo(5)', evaluator)).toBe(15); // 1+2+3+4+5
    expect(execute('sumUpTo(10)', evaluator)).toBe(55);
  });

  test('should handle power function using recursion', () => {
    const evaluator = new Evaluator();
    execute(
      `to power base, exp
      if exp = 0 then
        return 1
      else
        return base * power(base, exp - 1)
      end
      end`,
      evaluator
    );

    expect(execute('power(2, 0)', evaluator)).toBe(1);
    expect(execute('power(2, 3)', evaluator)).toBe(8);
    expect(execute('power(3, 4)', evaluator)).toBe(81);
  });

  test('should handle greatest common divisor (GCD)', () => {
    const evaluator = new Evaluator();
    execute(
      `to gcd a, b
      if b = 0 then
        return a
      else
        return gcd(b, a % b)
      end
      end`,
      evaluator
    );

    expect(execute('gcd(48, 18)', evaluator)).toBe(6);
    expect(execute('gcd(100, 25)', evaluator)).toBe(25);
  });

  test('should handle string concatenation in functions', () => {
    const evaluator = new Evaluator();
    execute(
      `to makeGreeting firstName, lastName
      return "Hello, " & firstName & " " & lastName & "!"
      end`,
      evaluator
    );

    const result = execute('makeGreeting("John", "Doe")', evaluator);
    expect(result).toBe('Hello, John Doe!');
  });
});

describe('SK8Script Functions - Error Handling', () => {
  test('should throw error for undefined function', () => {
    const evaluator = new Evaluator();

    expect(() => execute('undefinedFunc()', evaluator)).toThrow(/Undefined function/);
  });

  test('should throw error for wrong number of arguments', () => {
    const evaluator = new Evaluator();
    execute('to needsTwo a, b\nreturn a + b\nend', evaluator);

    expect(() => execute('needsTwo(1)', evaluator)).toThrow(/Missing required parameter/);
  });

  test('should handle errors in function body', () => {
    const evaluator = new Evaluator();
    execute(
      `to divideByZero
      return 10 / 0
      end`,
      evaluator
    );

    // Should not throw, just return Infinity (JavaScript behavior)
    const result = execute('divideByZero()', evaluator);
    expect(result).toBe(Infinity);
  });
});
