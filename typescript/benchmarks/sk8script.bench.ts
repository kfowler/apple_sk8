/**
 * SK8Script Performance Benchmarks
 *
 * Tests SK8Script execution performance
 */

import { Lexer } from '../src/sk8script/lexer/lexer.js';
import { Parser } from '../src/sk8script/parser/parser.js';
import { Evaluator } from '../src/sk8script/evaluator/evaluator.js';
import { performanceMonitor } from '../src/runtime/performance-monitor.js';

interface SK8ScriptBenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  cacheStats?: any;
}

/**
 * Benchmark script parsing
 */
function benchmarkParsing(script: string, iterations: number): SK8ScriptBenchmarkResult {
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const lexer = new Lexer(script);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    parser.parse();
  }

  const totalTime = performance.now() - startTime;

  return {
    name: 'Script Parsing',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
  };
}

/**
 * Benchmark script evaluation
 */
function benchmarkEvaluation(script: string, iterations: number): SK8ScriptBenchmarkResult {
  // Parse once
  const lexer = new Lexer(script);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  // Reset counters
  performanceMonitor.reset();

  const evaluator = new Evaluator();
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    evaluator.evaluate(ast);
  }

  const totalTime = performance.now() - startTime;
  const cacheStats = evaluator.getCacheStats();

  return {
    name: 'Script Evaluation',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    cacheStats,
  };
}

/**
 * Benchmark arithmetic operations
 */
function benchmarkArithmetic(iterations: number): SK8ScriptBenchmarkResult {
  const script = '(1 + 2) * 3 - 4 / 2 + 10 % 3';
  return benchmarkEvaluation(script, iterations);
}

/**
 * Benchmark property access
 */
function benchmarkPropertyAccess(iterations: number): SK8ScriptBenchmarkResult {
  const script = `
    set x to 42
    set y to x + 10
    set z to y * 2
    z
  `;
  return benchmarkEvaluation(script, iterations);
}

/**
 * Benchmark function calls
 */
function benchmarkFunctionCalls(iterations: number): SK8ScriptBenchmarkResult {
  const script = `
    on square (x)
      return x * x
    end

    square(5) + square(10)
  `;
  return benchmarkEvaluation(script, iterations);
}

/**
 * Run all SK8Script benchmarks
 */
export function runSK8ScriptBenchmarks(): SK8ScriptBenchmarkResult[] {
  console.log('=== SK8Script Benchmarks ===\n');

  const results: SK8ScriptBenchmarkResult[] = [];

  // Parsing benchmark
  console.log('Testing parsing...');
  const parsingResult = benchmarkParsing('set x to 42\nset y to x + 10', 1000);
  results.push(parsingResult);
  console.log(`  Average: ${parsingResult.averageTime.toFixed(4)}ms`);

  // Arithmetic benchmark
  console.log('Testing arithmetic operations...');
  const arithmeticResult = benchmarkArithmetic(10000);
  results.push(arithmeticResult);
  console.log(`  Average: ${arithmeticResult.averageTime.toFixed(4)}ms`);

  // Property access benchmark
  console.log('Testing property access...');
  const propertyResult = benchmarkPropertyAccess(5000);
  results.push(propertyResult);
  console.log(`  Average: ${propertyResult.averageTime.toFixed(4)}ms`);
  if (propertyResult.cacheStats) {
    console.log(`  Cache hit rate: ${(propertyResult.cacheStats.hitRate * 100).toFixed(2)}%`);
  }

  // Function calls benchmark
  console.log('Testing function calls...');
  const functionResult = benchmarkFunctionCalls(1000);
  results.push(functionResult);
  console.log(`  Average: ${functionResult.averageTime.toFixed(4)}ms`);

  console.log('');

  return results;
}

/**
 * Print benchmark results
 */
export function printResults(results: SK8ScriptBenchmarkResult[]): void {
  console.log('\n=== SK8Script Benchmark Results ===\n');
  console.log('Test Name              | Iterations | Total Time | Avg Time  | Cache Hit Rate');
  console.log('----------------------------------------------------------------------------');

  for (const result of results) {
    const cacheInfo = result.cacheStats
      ? `${(result.cacheStats.hitRate * 100).toFixed(2)}%`
      : 'N/A';

    console.log(
      `${result.name.padEnd(22)} | ` +
        `${result.iterations.toString().padEnd(10)} | ` +
        `${result.totalTime.toFixed(2).padEnd(10)} | ` +
        `${result.averageTime.toFixed(4).padEnd(9)} | ` +
        cacheInfo
    );
  }

  console.log('');
}
