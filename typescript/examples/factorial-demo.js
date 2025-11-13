/**
 * SK8Script Factorial Demo
 *
 * Demonstrates the working factorial function implementation
 * with recursion and closures.
 */

const { Lexer } = require('../dist/sk8script/lexer/lexer');
const { Parser } = require('../dist/sk8script/parser/parser');
const { Evaluator } = require('../dist/sk8script/evaluator/evaluator');

function execute(code, evaluator) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return evaluator.evaluate(ast);
}

// Create evaluator
const evaluator = new Evaluator();

console.log('=== SK8Script Functions Demo ===\n');

// Define factorial function
console.log('Defining factorial function:');
const factorialCode = `
to factorial n
  if n <= 1 then
    return 1
  else
    return n * factorial(n - 1)
  end
end
`;
console.log(factorialCode);
execute(factorialCode, evaluator);

// Test factorial
console.log('Testing factorial function:\n');
for (let i = 0; i <= 10; i++) {
  const result = execute(`factorial(${i})`, evaluator);
  console.log(`factorial(${i}) = ${result}`);
}

// Test other function features
console.log('\n=== Other Function Features ===\n');

// Closure example
console.log('Closure example:');
execute('set multiplier to 10', evaluator);
execute('to scale x\nreturn x * multiplier\nend', evaluator);
const scaleResult = execute('scale(5)', evaluator);
console.log(`scale(5) with multiplier=10: ${scaleResult}`);

// Lambda example
console.log('\nLambda function example:');
execute('set double to function(x) { return x * 2 }', evaluator);
const lambda = evaluator.getVariable('double');
console.log(`Created lambda function: ${lambda.name}`);

// Power function
console.log('\nPower function (recursive):');
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
console.log(`power(2, 8) = ${execute('power(2, 8)', evaluator)}`);
console.log(`power(3, 4) = ${execute('power(3, 4)', evaluator)}`);

// GCD function
console.log('\nGCD function (recursive):');
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
console.log(`gcd(48, 18) = ${execute('gcd(48, 18)', evaluator)}`);
console.log(`gcd(100, 25) = ${execute('gcd(100, 25)', evaluator)}`);

console.log('\n=== Demo Complete ===');
