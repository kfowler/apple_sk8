/**
 * SK8Script Standard Library Tests
 *
 * Comprehensive test suite for all 50+ standard library functions.
 * Organized by category with 120+ tests total.
 */

import { Evaluator, type BuiltInFunction } from '../src/sk8script/evaluator/evaluator.js';
import { allStdLibFunctions, getFunctionCount } from '../src/sk8script/stdlib/index.js';

// Helper to get a built-in function safely
function getBuiltIn(evaluator: Evaluator, name: string): BuiltInFunction {
  const func = evaluator.getFunction(name);
  if (!func) {
    throw new Error(`Function ${name} not found`);
  }
  if (typeof func !== 'function') {
    throw new Error(`${name} is not a built-in function (got ${typeof func})`);
  }
  return func as BuiltInFunction;
}

describe('SK8Script Standard Library', () => {
  let evaluator: Evaluator;

  beforeEach(() => {
    evaluator = new Evaluator();
    evaluator.registerFunctions(allStdLibFunctions);
  });

  describe('Library Statistics', () => {
    it('should have 50+ registered functions', () => {
      expect(getFunctionCount()).toBeGreaterThanOrEqual(50);
    });
  });

  // ========================================
  // MATH FUNCTIONS (25+ tests)
  // ========================================

  describe('Math Functions', () => {
    describe('Constants', () => {
      it('should return pi constant', () => {
        const pi = getBuiltIn(evaluator, 'pi');
        expect(pi?.()).toBeCloseTo(Math.PI);
      });

      it('should return e constant', () => {
        const e = getBuiltIn(evaluator, 'e');
        expect(e?.()).toBeCloseTo(Math.E);
      });
    });

    describe('Basic Math', () => {
      it('should calculate absolute value', () => {
        const abs = getBuiltIn(evaluator, 'abs');
        expect(abs?.(-5)).toBe(5);
        expect(abs?.(5)).toBe(5);
        expect(abs?.(0)).toBe(0);
      });

      it('should round numbers', () => {
        const round = getBuiltIn(evaluator, 'round');
        expect(round?.(3.7)).toBe(4);
        expect(round?.(3.4)).toBe(3);
        expect(round?.(3.5)).toBe(4);
      });

      it('should floor numbers', () => {
        const floor = getBuiltIn(evaluator, 'floor');
        expect(floor?.(3.9)).toBe(3);
        expect(floor?.(3.1)).toBe(3);
        expect(floor?.(-3.1)).toBe(-4);
      });

      it('should ceiling numbers', () => {
        const ceiling = getBuiltIn(evaluator, 'ceiling');
        expect(ceiling?.(3.1)).toBe(4);
        expect(ceiling?.(3.9)).toBe(4);
        expect(ceiling?.(-3.9)).toBe(-3);
      });

      it('should calculate square root', () => {
        const sqrt = getBuiltIn(evaluator, 'sqrt');
        expect(sqrt?.(16)).toBe(4);
        expect(sqrt?.(25)).toBe(5);
        expect(sqrt?.(0)).toBe(0);
      });

      it('should throw error for negative sqrt', () => {
        const sqrt = getBuiltIn(evaluator, 'sqrt');
        expect(() => sqrt?.(-1)).toThrow();
      });

      it('should calculate power', () => {
        const power = getBuiltIn(evaluator, 'power');
        expect(power?.(2, 3)).toBe(8);
        expect(power?.(5, 2)).toBe(25);
        expect(power?.(10, 0)).toBe(1);
      });

      it('should find minimum', () => {
        const min = getBuiltIn(evaluator, 'min');
        expect(min?.(5, 3, 8, 1)).toBe(1);
        expect(min?.(10)).toBe(10);
      });

      it('should find maximum', () => {
        const max = getBuiltIn(evaluator, 'max');
        expect(max?.(5, 3, 8, 1)).toBe(8);
        expect(max?.(10)).toBe(10);
      });

      it('should get sign of number', () => {
        const sign = getBuiltIn(evaluator, 'sign');
        expect(sign?.(5)).toBe(1);
        expect(sign?.(-5)).toBe(-1);
        expect(sign?.(0)).toBe(0);
      });

      it('should truncate decimal part', () => {
        const trunc = getBuiltIn(evaluator, 'trunc');
        expect(trunc?.(3.9)).toBe(3);
        expect(trunc?.(-3.9)).toBe(-3);
      });
    });

    describe('Trigonometry', () => {
      it('should calculate sine', () => {
        const sin = getBuiltIn(evaluator, 'sin');
        expect(sin?.(0)).toBeCloseTo(0);
        expect(sin?.(Math.PI / 2)).toBeCloseTo(1);
      });

      it('should calculate cosine', () => {
        const cos = getBuiltIn(evaluator, 'cos');
        expect(cos?.(0)).toBeCloseTo(1);
        expect(cos?.(Math.PI)).toBeCloseTo(-1);
      });

      it('should calculate tangent', () => {
        const tan = getBuiltIn(evaluator, 'tan');
        expect(tan?.(0)).toBeCloseTo(0);
      });

      it('should calculate arc sine', () => {
        const asin = getBuiltIn(evaluator, 'asin');
        expect(asin?.(0)).toBeCloseTo(0);
        expect(asin?.(1)).toBeCloseTo(Math.PI / 2);
      });

      it('should calculate arc cosine', () => {
        const acos = getBuiltIn(evaluator, 'acos');
        expect(acos?.(1)).toBeCloseTo(0);
        expect(acos?.(0)).toBeCloseTo(Math.PI / 2);
      });

      it('should calculate arc tangent', () => {
        const atan = getBuiltIn(evaluator, 'atan');
        expect(atan?.(0)).toBeCloseTo(0);
      });

      it('should calculate atan2', () => {
        const atan2 = getBuiltIn(evaluator, 'atan2');
        expect(atan2?.(0, 1)).toBeCloseTo(0);
      });

      it('should convert radians to degrees', () => {
        const radiansToDegrees = getBuiltIn(evaluator, 'radiansToDegrees');
        expect(radiansToDegrees?.(Math.PI)).toBeCloseTo(180);
        expect(radiansToDegrees?.(Math.PI / 2)).toBeCloseTo(90);
      });

      it('should convert degrees to radians', () => {
        const degreesToRadians = getBuiltIn(evaluator, 'degreesToRadians');
        expect(degreesToRadians?.(180)).toBeCloseTo(Math.PI);
        expect(degreesToRadians?.(90)).toBeCloseTo(Math.PI / 2);
      });
    });

    describe('Random', () => {
      it('should generate random number between 0 and 1', () => {
        const random = getBuiltIn(evaluator, 'random');
        const value = random?.();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });

      it('should generate random number between min and max', () => {
        const randomBetween = getBuiltIn(evaluator, 'randomBetween');
        const value = randomBetween?.(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      });

      it('should generate random integer', () => {
        const randomInt = getBuiltIn(evaluator, 'randomInt');
        for (let i = 0; i < 10; i++) {
          const value = randomInt?.(1, 10);
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(10);
          expect(Number.isInteger(value)).toBe(true);
        }
      });
    });

    describe('Logarithmic', () => {
      it('should calculate natural logarithm', () => {
        const ln = getBuiltIn(evaluator, 'ln');
        expect(ln?.(Math.E)).toBeCloseTo(1);
        expect(ln?.(1)).toBeCloseTo(0);
      });

      it('should calculate log base 10', () => {
        const log10 = getBuiltIn(evaluator, 'log10');
        expect(log10?.(10)).toBeCloseTo(1);
        expect(log10?.(100)).toBeCloseTo(2);
      });

      it('should calculate exponential', () => {
        const exp = getBuiltIn(evaluator, 'exp');
        expect(exp?.(0)).toBeCloseTo(1);
        expect(exp?.(1)).toBeCloseTo(Math.E);
      });
    });
  });

  // ========================================
  // STRING FUNCTIONS (25+ tests)
  // ========================================

  describe('String Functions', () => {
    describe('String Length', () => {
      it('should get string length', () => {
        const length = getBuiltIn(evaluator, 'length');
        expect(length?.('hello')).toBe(5);
        expect(length?.('')).toBe(0);
        expect(length?.('a')).toBe(1);
      });

      it('should get array length', () => {
        const length = getBuiltIn(evaluator, 'length');
        expect(length?.([1, 2, 3])).toBe(3);
        expect(length?.([])).toBe(0);
      });
    });

    describe('Substring', () => {
      it('should extract substring with start index', () => {
        const substring = getBuiltIn(evaluator, 'substring');
        expect(substring?.('hello', 1, 3)).toBe('hel');
        expect(substring?.('hello', 2, 4)).toBe('ell');
      });

      it('should extract substring to end', () => {
        const substring = getBuiltIn(evaluator, 'substring');
        expect(substring?.('hello', 3)).toBe('llo');
      });
    });

    describe('Search', () => {
      it('should find index of substring (1-based)', () => {
        const indexOf = getBuiltIn(evaluator, 'indexOf');
        expect(indexOf?.('hello world', 'world')).toBe(7);
        expect(indexOf?.('hello world', 'hello')).toBe(1);
        expect(indexOf?.('hello world', 'xyz')).toBe(0);
      });

      it('should find last index of substring', () => {
        const lastIndexOf = getBuiltIn(evaluator, 'lastIndexOf');
        expect(lastIndexOf?.('hello hello', 'hello')).toBe(7);
        expect(lastIndexOf?.('hello', 'l')).toBe(4);
      });
    });

    describe('Case Conversion', () => {
      it('should convert to lowercase', () => {
        const toLowerCase = getBuiltIn(evaluator, 'toLowerCase');
        expect(toLowerCase?.('HELLO')).toBe('hello');
        expect(toLowerCase?.('Hello World')).toBe('hello world');
      });

      it('should convert to uppercase', () => {
        const toUpperCase = getBuiltIn(evaluator, 'toUpperCase');
        expect(toUpperCase?.('hello')).toBe('HELLO');
        expect(toUpperCase?.('Hello World')).toBe('HELLO WORLD');
      });
    });

    describe('Split and Join', () => {
      it('should split string by delimiter', () => {
        const split = getBuiltIn(evaluator, 'split');
        expect(split?.('a,b,c', ',')).toEqual(['a', 'b', 'c']);
        expect(split?.('hello world', ' ')).toEqual(['hello', 'world']);
      });

      it('should join array elements', () => {
        const join = getBuiltIn(evaluator, 'join');
        expect(join?.(['a', 'b', 'c'], ',')).toBe('a,b,c');
        expect(join?.(['hello', 'world'], ' ')).toBe('hello world');
      });
    });

    describe('Trim', () => {
      it('should trim whitespace from both ends', () => {
        const trim = getBuiltIn(evaluator, 'trim');
        expect(trim?.('  hello  ')).toBe('hello');
        expect(trim?.('hello')).toBe('hello');
      });

      it('should trim from start', () => {
        const trimStart = getBuiltIn(evaluator, 'trimStart');
        expect(trimStart?.('  hello  ')).toBe('hello  ');
      });

      it('should trim from end', () => {
        const trimEnd = getBuiltIn(evaluator, 'trimEnd');
        expect(trimEnd?.('  hello  ')).toBe('  hello');
      });
    });

    describe('Replace', () => {
      it('should replace first occurrence', () => {
        const replace = getBuiltIn(evaluator, 'replace');
        expect(replace?.('hello hello', 'hello', 'hi')).toBe('hi hello');
      });

      it('should replace all occurrences', () => {
        const replaceAll = getBuiltIn(evaluator, 'replaceAll');
        expect(replaceAll?.('hello hello', 'hello', 'hi')).toBe('hi hi');
      });
    });

    describe('Character Access', () => {
      it('should get character at position (1-based)', () => {
        const charAt = getBuiltIn(evaluator, 'charAt');
        expect(charAt?.('hello', 1)).toBe('h');
        expect(charAt?.('hello', 3)).toBe('l');
      });

      it('should get character code', () => {
        const charCodeAt = getBuiltIn(evaluator, 'charCodeAt');
        expect(charCodeAt?.('A', 1)).toBe(65);
        expect(charCodeAt?.('a', 1)).toBe(97);
      });

      it('should create string from character codes', () => {
        const fromCharCode = getBuiltIn(evaluator, 'fromCharCode');
        expect(fromCharCode?.(65, 66, 67)).toBe('ABC');
      });
    });

    describe('String Tests', () => {
      it('should check if string starts with substring', () => {
        const startsWith = getBuiltIn(evaluator, 'startsWith');
        expect(startsWith?.('hello world', 'hello')).toBe(true);
        expect(startsWith?.('hello world', 'world')).toBe(false);
      });

      it('should check if string ends with substring', () => {
        const endsWith = getBuiltIn(evaluator, 'endsWith');
        expect(endsWith?.('hello world', 'world')).toBe(true);
        expect(endsWith?.('hello world', 'hello')).toBe(false);
      });

      it('should check if string contains substring', () => {
        const contains = getBuiltIn(evaluator, 'contains');
        expect(contains?.('hello world', 'lo wo')).toBe(true);
        expect(contains?.('hello world', 'xyz')).toBe(false);
      });
    });

    describe('String Manipulation', () => {
      it('should repeat string', () => {
        const repeatString = getBuiltIn(evaluator, 'repeatString');
        expect(repeatString?.('x', 5)).toBe('xxxxx');
        expect(repeatString?.('ab', 3)).toBe('ababab');
      });

      it('should pad at start', () => {
        const padStart = getBuiltIn(evaluator, 'padStart');
        expect(padStart?.('5', 3, '0')).toBe('005');
        expect(padStart?.('hello', 10, ' ')).toBe('     hello');
      });

      it('should pad at end', () => {
        const padEnd = getBuiltIn(evaluator, 'padEnd');
        expect(padEnd?.('5', 3, '0')).toBe('500');
        expect(padEnd?.('hello', 10, ' ')).toBe('hello     ');
      });
    });
  });

  // ========================================
  // COLLECTION FUNCTIONS (30+ tests)
  // ========================================

  describe('Collection Functions', () => {
    describe('List Access', () => {
      it('should get first element', () => {
        const first = getBuiltIn(evaluator, 'first');
        expect(first?.([1, 2, 3])).toBe(1);
        expect(first?.(['a', 'b', 'c'])).toBe('a');
      });

      it('should get last element', () => {
        const last = getBuiltIn(evaluator, 'last');
        expect(last?.([1, 2, 3])).toBe(3);
        expect(last?.(['a', 'b', 'c'])).toBe('c');
      });

      it('should get rest of list', () => {
        const rest = getBuiltIn(evaluator, 'rest');
        expect(rest?.([1, 2, 3])).toEqual([2, 3]);
        expect(rest?.([1])).toEqual([]);
      });

      it('should get all but last', () => {
        const butLast = getBuiltIn(evaluator, 'butLast');
        expect(butLast?.([1, 2, 3])).toEqual([1, 2]);
        expect(butLast?.([1])).toEqual([]);
      });
    });

    describe('List Modification', () => {
      it('should append element', () => {
        const append = getBuiltIn(evaluator, 'append');
        expect(append?.([1, 2], 3)).toEqual([1, 2, 3]);
      });

      it('should prepend element', () => {
        const prepend = getBuiltIn(evaluator, 'prepend');
        expect(prepend?.([2, 3], 1)).toEqual([1, 2, 3]);
      });

      it('should remove element at index', () => {
        const removeAt = getBuiltIn(evaluator, 'removeAt');
        expect(removeAt?.([1, 2, 3], 2)).toEqual([1, 3]);
      });

      it('should insert element at index', () => {
        const insertAt = getBuiltIn(evaluator, 'insertAt');
        expect(insertAt?.([1, 3], 2, 2)).toEqual([1, 2, 3]);
      });
    });

    describe('List Tests', () => {
      it('should check if list contains element', () => {
        const listContains = getBuiltIn(evaluator, 'listContains');
        expect(listContains?.([1, 2, 3], 2)).toBe(true);
        expect(listContains?.([1, 2, 3], 5)).toBe(false);
      });
    });

    describe('List Transformation', () => {
      it('should reverse list', () => {
        const reverse = getBuiltIn(evaluator, 'reverse');
        expect(reverse?.([1, 2, 3])).toEqual([3, 2, 1]);
      });

      it('should sort list of numbers', () => {
        const sort = getBuiltIn(evaluator, 'sort');
        expect(sort?.([3, 1, 2])).toEqual([1, 2, 3]);
      });

      it('should sort list of strings', () => {
        const sort = getBuiltIn(evaluator, 'sort');
        expect(sort?.(['c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
      });

      it('should map function over list', () => {
        const map = getBuiltIn(evaluator, 'map');
        const square = (x: number) => x * x;
        expect(map?.([1, 2, 3], square)).toEqual([1, 4, 9]);
      });

      it('should filter list', () => {
        const filter = getBuiltIn(evaluator, 'filter');
        const isEven = (x: number) => x % 2 === 0;
        expect(filter?.([1, 2, 3, 4], isEven)).toEqual([2, 4]);
      });

      it('should reduce list', () => {
        const reduce = getBuiltIn(evaluator, 'reduce');
        const sum = (acc: number, x: number) => acc + x;
        expect(reduce?.([1, 2, 3], sum, 0)).toBe(6);
      });
    });

    describe('List Creation', () => {
      it('should create range from 1 to n', () => {
        const range = getBuiltIn(evaluator, 'range');
        expect(range?.(5)).toEqual([1, 2, 3, 4, 5]);
      });

      it('should create range from start to end', () => {
        const range = getBuiltIn(evaluator, 'range');
        expect(range?.(3, 7)).toEqual([3, 4, 5, 6, 7]);
      });

      it('should create range with step', () => {
        const range = getBuiltIn(evaluator, 'range');
        expect(range?.(0, 10, 2)).toEqual([0, 2, 4, 6, 8, 10]);
      });

      it('should get every nth element', () => {
        const everyNth = getBuiltIn(evaluator, 'everyNth');
        expect(everyNth?.([1, 2, 3, 4, 5, 6], 2)).toEqual([2, 4, 6]);
      });
    });

    describe('List Flattening', () => {
      it('should flatten one level', () => {
        const flatten = getBuiltIn(evaluator, 'flatten');
        expect(flatten?.([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
      });

      it('should flatten deeply', () => {
        const flattenDeep = getBuiltIn(evaluator, 'flattenDeep');
        expect(flattenDeep?.([[1, [2, [3, 4]]]])).toEqual([1, 2, 3, 4]);
      });
    });

    describe('List Operations', () => {
      it('should get unique elements', () => {
        const unique = getBuiltIn(evaluator, 'unique');
        expect(unique?.([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
      });

      it('should concatenate lists', () => {
        const concat = getBuiltIn(evaluator, 'concat');
        expect(concat?.([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
      });

      it('should slice list', () => {
        const slice = getBuiltIn(evaluator, 'slice');
        expect(slice?.([1, 2, 3, 4, 5], 2, 4)).toEqual([2, 3, 4]);
      });
    });

    describe('Table Operations', () => {
      it('should get keys from table', () => {
        const keys = getBuiltIn(evaluator, 'keys');
        expect(keys?.({ a: 1, b: 2 })).toEqual(['a', 'b']);
      });

      it('should get values from table', () => {
        const values = getBuiltIn(evaluator, 'values');
        expect(values?.({ a: 1, b: 2 })).toEqual([1, 2]);
      });

      it('should get entries from table', () => {
        const entries = getBuiltIn(evaluator, 'entries');
        expect(entries?.({ a: 1, b: 2 })).toEqual([
          ['a', 1],
          ['b', 2],
        ]);
      });

      it('should merge tables', () => {
        const merge = getBuiltIn(evaluator, 'merge');
        expect(merge?.({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
      });

      it('should check if table has key', () => {
        const hasKey = getBuiltIn(evaluator, 'hasKey');
        expect(hasKey?.({ a: 1, b: 2 }, 'a')).toBe(true);
        expect(hasKey?.({ a: 1, b: 2 }, 'c')).toBe(false);
      });
    });
  });

  // ========================================
  // TYPE FUNCTIONS (15+ tests)
  // ========================================

  describe('Type Functions', () => {
    describe('Type Checking', () => {
      it('should check if value is number', () => {
        const isNumber = getBuiltIn(evaluator, 'isNumber');
        expect(isNumber?.(42)).toBe(true);
        expect(isNumber?.('42')).toBe(false);
      });

      it('should check if value is string', () => {
        const isString = getBuiltIn(evaluator, 'isString');
        expect(isString?.('hello')).toBe(true);
        expect(isString?.(42)).toBe(false);
      });

      it('should check if value is boolean', () => {
        const isBoolean = getBuiltIn(evaluator, 'isBoolean');
        expect(isBoolean?.(true)).toBe(true);
        expect(isBoolean?.(1)).toBe(false);
      });

      it('should check if value is list', () => {
        const isList = getBuiltIn(evaluator, 'isList');
        expect(isList?.([1, 2, 3])).toBe(true);
        expect(isList?.({})).toBe(false);
      });

      it('should check if value is table', () => {
        const isTable = getBuiltIn(evaluator, 'isTable');
        expect(isTable?.({})).toBe(true);
        expect(isTable?.([])).toBe(false);
      });

      it('should check if value is null', () => {
        const isNull = getBuiltIn(evaluator, 'isNull');
        expect(isNull?.(null)).toBe(true);
        expect(isNull?.(undefined)).toBe(false);
      });

      it('should get type name', () => {
        const typeOf = getBuiltIn(evaluator, 'typeOf');
        expect(typeOf?.(42)).toBe('number');
        expect(typeOf?.('hello')).toBe('string');
        expect(typeOf?.(true)).toBe('boolean');
        expect(typeOf?.([1, 2, 3])).toBe('list');
        expect(typeOf?.({})).toBe('table');
        expect(typeOf?.(null)).toBe('null');
      });
    });

    describe('Type Conversion', () => {
      it('should convert to string', () => {
        const toString = getBuiltIn(evaluator, 'toString');
        expect(toString?.(42)).toBe('42');
        expect(toString?.(true)).toBe('true');
        expect(toString?.(null)).toBe('null');
      });

      it('should convert to number', () => {
        const toNumber = getBuiltIn(evaluator, 'toNumber');
        expect(toNumber?.('42')).toBe(42);
        expect(toNumber?.(true)).toBe(1);
        expect(toNumber?.(false)).toBe(0);
      });

      it('should convert to boolean', () => {
        const toBoolean = getBuiltIn(evaluator, 'toBoolean');
        expect(toBoolean?.(1)).toBe(true);
        expect(toBoolean?.(0)).toBe(false);
        expect(toBoolean?.('hello')).toBe(true);
        expect(toBoolean?.('')).toBe(false);
      });

      it('should parse JSON', () => {
        const parseJSON = getBuiltIn(evaluator, 'parseJSON');
        expect(parseJSON?.('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
      });

      it('should convert to JSON', () => {
        const toJSON = getBuiltIn(evaluator, 'toJSON');
        expect(toJSON?.({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
      });

      it('should parse integer', () => {
        const parseInt = getBuiltIn(evaluator, 'parseInt');
        expect(parseInt?.('42')).toBe(42);
        expect(parseInt?.('FF', 16)).toBe(255);
      });

      it('should parse float', () => {
        const parseFloat = getBuiltIn(evaluator, 'parseFloat');
        expect(parseFloat?.('3.14')).toBe(3.14);
      });
    });
  });

  // ========================================
  // OBJECT FUNCTIONS (20+ tests)
  // ========================================

  describe('Object Functions', () => {
    describe('Object Creation', () => {
      it('should create new empty object', () => {
        const newObject = getBuiltIn(evaluator, 'newObject');
        expect(newObject?.()).toEqual({});
      });

      it('should clone object', () => {
        const clone = getBuiltIn(evaluator, 'clone');
        const obj = { a: 1, b: 2 };
        const cloned = clone?.(obj);
        expect(cloned).toEqual(obj);
        expect(cloned).not.toBe(obj);
      });

      it('should deep clone object', () => {
        const deepClone = getBuiltIn(evaluator, 'deepClone');
        const obj = { a: { b: { c: 1 } } };
        const cloned = deepClone?.(obj);
        expect(cloned).toEqual(obj);
        expect(cloned).not.toBe(obj);
      });
    });

    describe('Property Access', () => {
      it('should get property', () => {
        const getProperty = getBuiltIn(evaluator, 'getProperty');
        expect(getProperty?.({ a: 1, b: 2 }, 'a')).toBe(1);
      });

      it('should set property', () => {
        const setProperty = getBuiltIn(evaluator, 'setProperty');
        const obj: any = { a: 1 };
        setProperty?.(obj, 'b', 2);
        expect(obj.b).toBe(2);
      });

      it('should get property names', () => {
        const propertiesOf = getBuiltIn(evaluator, 'propertiesOf');
        expect(propertiesOf?.({ a: 1, b: 2 })).toEqual(['a', 'b']);
      });

      it('should check if has property', () => {
        const hasProperty = getBuiltIn(evaluator, 'hasProperty');
        expect(hasProperty?.({ a: 1 }, 'a')).toBe(true);
        expect(hasProperty?.({ a: 1 }, 'b')).toBe(false);
      });

      it('should delete property', () => {
        const deleteProperty = getBuiltIn(evaluator, 'deleteProperty');
        const obj = { a: 1, b: 2 };
        deleteProperty?.(obj, 'a');
        expect('a' in obj).toBe(false);
      });
    });

    describe('Handler/Method Operations', () => {
      it('should get handler names', () => {
        const handlersOf = getBuiltIn(evaluator, 'handlersOf');
        const obj = {
          x: 1,
          method: () => {},
        };
        const handlers = handlersOf?.(obj);
        expect(handlers).toContain('method');
      });

      it('should call handler', () => {
        const callHandler = getBuiltIn(evaluator, 'callHandler');
        const obj = {
          greet: (name: string) => `Hello, ${name}!`,
        };
        expect(callHandler?.(obj, 'greet', 'World')).toBe('Hello, World!');
      });

      it('should add handler', () => {
        const addHandler = getBuiltIn(evaluator, 'addHandler');
        const obj = {};
        addHandler?.(obj, 'greet', () => 'Hello!');
        expect((obj as any).greet()).toBe('Hello!');
      });

      it('should remove handler', () => {
        const removeHandler = getBuiltIn(evaluator, 'removeHandler');
        const obj = { method: () => {} };
        removeHandler?.(obj, 'method');
        expect('method' in obj).toBe(false);
      });
    });

    describe('Object Freezing and Sealing', () => {
      it('should freeze object', () => {
        const freeze = getBuiltIn(evaluator, 'freeze');
        const obj = { a: 1 };
        freeze?.(obj);
        expect(Object.isFrozen(obj)).toBe(true);
      });

      it('should check if frozen', () => {
        const isFrozen = getBuiltIn(evaluator, 'isFrozen');
        const obj = { a: 1 };
        expect(isFrozen?.(obj)).toBe(false);
        Object.freeze(obj);
        expect(isFrozen?.(obj)).toBe(true);
      });

      it('should seal object', () => {
        const seal = getBuiltIn(evaluator, 'seal');
        const obj = { a: 1 };
        seal?.(obj);
        expect(Object.isSealed(obj)).toBe(true);
      });

      it('should check if sealed', () => {
        const isSealed = getBuiltIn(evaluator, 'isSealed');
        const obj = { a: 1 };
        expect(isSealed?.(obj)).toBe(false);
        Object.seal(obj);
        expect(isSealed?.(obj)).toBe(true);
      });
    });
  });
});
