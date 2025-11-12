/**
 * SK8Script Examples
 *
 * Demonstrates the SK8Script parser and evaluator with various expressions
 */

import { tokenize } from './dist/sk8script/lexer/lexer.js';
import { parse } from './dist/sk8script/parser/parser.js';
import { evaluate, Evaluator } from './dist/sk8script/evaluator/evaluator.js';
import { printAST } from './dist/sk8script/parser/ast.js';

console.log('='.repeat(60));
console.log('SK8Script Phase 2.1 - Parser Foundation Examples');
console.log('='.repeat(60));
console.log();

// Helper function to run and display an example
function runExample(title, expression, context = null) {
  console.log(`\n${title}`);
  console.log('-'.repeat(60));
  console.log(`Expression: ${expression}`);
  console.log();

  try {
    const tokens = tokenize(expression);
    const ast = parse(tokens);
    const result = context ? evaluate(ast, context) : evaluate(ast);

    console.log('AST:');
    console.log(printAST(ast));
    console.log();
    console.log(`Result: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// 1. Simple Arithmetic
runExample('1. Simple Addition', '5 + 3');

// 2. Operator Precedence
runExample('2. Operator Precedence', '5 + 3 * 2');

// 3. Parentheses
runExample('3. Parentheses for Grouping', '(5 + 3) * 2');

// 4. Complex Arithmetic
runExample('4. Complex Expression', '(10 + 5) * 2 - 4 / 2');

// 5. Unary Operators
runExample('5. Unary Minus', '-5 + 10');

// 6. Comparison
runExample('6. Comparison', '10 > 5');

// 7. Logical Operations
runExample('7. Logical AND', 'true and false');

// 8. String Concatenation
runExample('8. String Concatenation', '"hello" & " " & "world"');

// 9. Exponentiation
runExample('9. Exponentiation', '2 ^ 8');

// 10. Natural Language Property Access
const actorContext = {
  variables: new Map([
    ['myActor', { left: 100, top: 50, width: 200, height: 150 }]
  ])
};
runExample('10. Natural Language: "the X of Y"', 'the left of myActor', actorContext);

// 11. Dot Notation
runExample('11. Dot Notation Property Access', 'myActor.width', actorContext);

// 12. List Indexing (1-based)
const listContext = {
  variables: new Map([
    ['myList', [10, 20, 30, 40, 50]]
  ])
};
runExample('12. List Indexing (1-based)', 'item 1 of myList', listContext);

// 13. Bracket Notation
runExample('13. Bracket Notation', 'myList[3]', listContext);

// 14. Variables in Expressions
const varContext = {
  variables: new Map([
    ['x', 5],
    ['y', 3]
  ])
};
runExample('14. Variables in Expressions', 'x * 2 + y', varContext);

// 15. Assignment
console.log('\n15. Variable Assignment');
console.log('-'.repeat(60));
console.log('Expression: set z to 42');
console.log();

const evaluator = new Evaluator();
const ast15 = parse(tokenize('set z to 42'));
evaluate(ast15, evaluator.getContext());
console.log('AST:');
console.log(printAST(ast15));
console.log();
console.log(`Variable z is now: ${evaluator.getVariable('z')}`);

// Test using the assigned variable
const ast16 = parse(tokenize('z + 8'));
const result16 = evaluate(ast16, evaluator.getContext());
console.log(`z + 8 = ${result16}`);

console.log('\n' + '='.repeat(60));
console.log('All examples completed successfully!');
console.log('='.repeat(60));
