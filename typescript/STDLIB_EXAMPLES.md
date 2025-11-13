# SK8Script Standard Library Examples

This document demonstrates the usage of all 50+ standard library functions across 6 categories.

## Quick Start

```typescript
import { createEvaluator, evaluateScript } from './sk8.js';

// Option 1: Use the convenience function
const result = evaluateScript('abs(-5)');
console.log(result); // 5

// Option 2: Create an evaluator with all stdlib functions
const evaluator = createEvaluator();
const abs = evaluator.getFunction('abs');
console.log(abs(-5)); // 5
```

## Math Functions (28 functions)

### Basic Math Operations

```typescript
abs(-5)                 // 5
round(3.7)              // 4
floor(3.9)              // 3
ceiling(3.1)            // 4
sqrt(16)                // 4
power(2, 3)             // 8
min(5, 3, 8)            // 3
max(5, 3, 8)            // 8
sign(-5)                // -1
trunc(3.9)              // 3
```

### Trigonometry

```typescript
sin(0)                         // 0
cos(0)                         // 1
tan(0)                         // 0
asin(0)                        // 0
acos(1)                        // 0
atan(0)                        // 0
atan2(0, 1)                    // 0
radiansToDegrees(3.14159)      // 180
degreesToRadians(180)          // 3.14159
```

### Random Numbers

```typescript
random()                // Random 0.0-1.0
randomBetween(5, 10)    // Random 5-10
randomInt(1, 10)        // Random integer 1-10
```

### Logarithmic

```typescript
ln(2.71828)             // 1 (natural log)
log10(100)              // 2 (log base 10)
exp(1)                  // 2.71828 (e^x)
```

### Constants

```typescript
pi()                    // 3.14159...
e()                     // 2.71828...
```

## String Functions (23 functions)

### String Length and Access

```typescript
length("hello")              // 5
charAt("hello", 1)           // "h" (1-based)
charCodeAt("A", 1)           // 65
fromCharCode(65, 66, 67)     // "ABC"
```

### String Search

```typescript
indexOf("hello world", "world")        // 7 (1-based)
lastIndexOf("hello hello", "hello")    // 7
startsWith("hello world", "hello")     // true
endsWith("hello world", "world")       // true
contains("hello world", "lo wo")       // true
```

### String Manipulation

```typescript
substring("hello", 1, 3)           // "hel"
toLowerCase("HELLO")               // "hello"
toUpperCase("hello")               // "HELLO"
trim("  hello  ")                  // "hello"
trimStart("  hello")               // "hello"
trimEnd("hello  ")                 // "hello"
```

### String Transformation

```typescript
split("a,b,c", ",")                // ["a", "b", "c"]
join(["a", "b", "c"], ",")         // "a,b,c"
replace("hello hello", "hello", "hi")      // "hi hello"
replaceAll("hello hello", "hello", "hi")   // "hi hi"
repeatString("x", 5)               // "xxxxx"
padStart("5", 3, "0")              // "005"
padEnd("5", 3, "0")                // "500"
```

## Collection Functions (26 functions)

### List Access

```typescript
first([1, 2, 3])        // 1
last([1, 2, 3])         // 3
rest([1, 2, 3])         // [2, 3]
butLast([1, 2, 3])      // [1, 2]
```

### List Modification

```typescript
append([1, 2], 3)              // [1, 2, 3]
prepend([2, 3], 1)             // [1, 2, 3]
removeAt([1, 2, 3], 2)         // [1, 3]
insertAt([1, 3], 2, 2)         // [1, 2, 3]
```

### List Operations

```typescript
reverse([1, 2, 3])                     // [3, 2, 1]
sort([3, 1, 2])                        // [1, 2, 3]
listContains([1, 2, 3], 2)             // true
unique([1, 2, 2, 3])                   // [1, 2, 3]
concat([1, 2], [3, 4])                 // [1, 2, 3, 4]
slice([1, 2, 3, 4], 2, 4)              // [2, 3, 4]
```

### List Transformation

```typescript
// map, filter, reduce require function arguments
const square = (x) => x * x;
const isEven = (x) => x % 2 === 0;
const sum = (acc, x) => acc + x;

map([1, 2, 3], square)             // [1, 4, 9]
filter([1, 2, 3, 4], isEven)       // [2, 4]
reduce([1, 2, 3], sum, 0)          // 6
```

### List Creation

```typescript
range(5)                   // [1, 2, 3, 4, 5]
range(3, 7)                // [3, 4, 5, 6, 7]
range(0, 10, 2)            // [0, 2, 4, 6, 8, 10]
everyNth([1, 2, 3, 4, 5, 6], 2)    // [2, 4, 6]
```

### List Flattening

```typescript
flatten([[1, 2], [3, 4]])          // [1, 2, 3, 4]
flattenDeep([[1, [2, [3]]]])       // [1, 2, 3]
```

### Table (Object) Operations

```typescript
keys({a: 1, b: 2})                 // ["a", "b"]
values({a: 1, b: 2})               // [1, 2]
entries({a: 1, b: 2})              // [["a", 1], ["b", 2]]
merge({a: 1}, {b: 2})              // {a: 1, b: 2}
hasKey({a: 1, b: 2}, "a")          // true
```

## Type Functions (17 functions)

### Type Checking

```typescript
isNumber(42)                // true
isString("hello")           // true
isBoolean(true)             // true
isList([1, 2, 3])           // true
isTable({a: 1})             // true
isNull(null)                // true
isUndefined(undefined)      // true
isFunction(() => {})        // true
typeOf(42)                  // "number"
```

### Type Conversion

```typescript
toString(42)                // "42"
toNumber("42")              // 42
toBoolean(1)                // true
parseJSON('{"a":1}')        // {a: 1}
toJSON({a: 1})              // '{"a":1}'
parseInt("42")              // 42
parseFloat("3.14")          // 3.14
```

## I/O and Debugging Functions (17 functions)

### Console Output

```typescript
print("Hello", "World")              // Logs to console
log("Info message")                  // Alias for print
warn("Warning message")              // Warning
error("Error message")               // Error
info("Info message")                 // Info
debug("Debug message")               // Debug
clearConsole()                       // Clear console
```

### Debugging

```typescript
inspect({a: 1, b: {c: 2}})          // Pretty-print object
startTimer("myTimer")                // Start timer
endTimer("myTimer")                  // End and log elapsed time
group("My Group")                    // Start console group
groupEnd()                           // End console group
assert(1 + 1 === 2, "Math works")    // Assert condition
trace("Checkpoint")                  // Stack trace
```

### Browser Dialogs

```typescript
alert("Hello!")                      // Alert dialog
confirm("Are you sure?")             // Confirm dialog (returns boolean)
prompt("Your name?", "Default")      // Prompt dialog (returns string)
```

## Object/Actor Functions (17 functions)

### Object Creation

```typescript
newObject()                          // {}
clone({a: 1, b: 2})                 // Shallow copy
deepClone({a: {b: 1}})              // Deep copy
```

### Property Access

```typescript
getProperty({a: 1}, "a")            // 1
setProperty({a: 1}, "b", 2)         // Sets property
propertiesOf({a: 1, b: 2})          // ["a", "b"]
hasProperty({a: 1}, "a")            // true
deleteProperty({a: 1, b: 2}, "a")   // Removes property
```

### Handler/Method Operations

```typescript
const obj = {
  greet: (name) => `Hello, ${name}!`
};

handlersOf(obj)                     // ["greet"]
callHandler(obj, "greet", "World")  // "Hello, World!"
addHandler(obj, "bye", () => "Goodbye!")
removeHandler(obj, "greet")
```

### Object Protection

```typescript
freeze({a: 1})                      // Make immutable
isFrozen({a: 1})                    // false
seal({a: 1})                        // Prevent add/remove props
isSealed({a: 1})                    // false
```

## Complete Example: Calculator

```typescript
import { evaluateScript } from './sk8.js';

// Math operations
console.log(evaluateScript('sqrt(power(3, 2) + power(4, 2))')); // 5

// String processing
const code = `
  toUpperCase(
    join(
      map(
        split("hello world", " "),
        (word) => substring(word, 1, 1)
      ),
      ""
    )
  )
`;
console.log(evaluateScript(code)); // "HW"

// Data transformation
const data = evaluateScript(`
  filter(
    map(range(1, 10), (x) => x * x),
    (x) => x > 25
  )
`);
console.log(data); // [36, 49, 64, 81, 100]
```

## Function Count by Category

- **Math Functions**: 28
- **String Functions**: 23
- **Collection Functions**: 26
- **Type Functions**: 17
- **I/O Functions**: 17
- **Object Functions**: 17

**Total: 128 functions**

## Getting Help

```typescript
import { printAllFunctions, getFunctionsByCategory } from './sk8.js';

// Print all available functions
printAllFunctions();

// Get functions by category
const categories = getFunctionsByCategory();
console.log(categories.math);    // All math functions
console.log(categories.string);  // All string functions
```
