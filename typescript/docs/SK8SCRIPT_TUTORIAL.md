# SK8Script Tutorial

Complete guide to the SK8Script programming language - a natural-language-inspired scripting language designed for multimedia applications.

## Table of Contents

- [Introduction](#introduction)
- [Basic Syntax](#basic-syntax)
- [Natural Language Features](#natural-language-features)
- [Control Flow](#control-flow)
- [Functions](#functions)
- [Working with Objects](#working-with-objects)
- [Collections](#collections)
- [Standard Library](#standard-library)
- [Complete Examples](#complete-examples)

---

## Introduction

SK8Script is a scripting language designed to feel natural and readable, inspired by HyperTalk and AppleScript. It's perfect for beginners while being powerful enough for complex applications.

### Philosophy

**"Code should read like English"**

Compare SK8Script to JavaScript:

```javascript
// JavaScript
rect.left = rect.left + 50;

-- SK8Script
set the left of rect to the left of rect + 50
```

SK8Script emphasizes clarity over brevity, making it easy to understand what code does at a glance.

### Your First SK8Script

```sk8script
-- This is a comment (starts with --)

-- Create a variable
set message to "Hello, SK8!"

-- Print it
print(message)

-- Output: Hello, SK8!
```

---

## Basic Syntax

### Comments

Comments help explain your code:

```sk8script
-- This is a single-line comment

-- Comments start with two hyphens
-- They extend to the end of the line

-- You can use them to explain what your code does
set x to 42  -- You can also add comments at the end of lines
```

**Best practice:** Use comments to explain *why*, not *what*:

```sk8script
-- Good: Explains why
set timeout to 5000  -- Wait 5 seconds for animation to complete

-- Less useful: Just repeats the code
set timeout to 5000  -- Set timeout to 5000
```

### Variables and Data Types

SK8Script has several built-in data types:

#### Numbers

```sk8script
-- Integers
set count to 42
set lives to 3

-- Floating point
set temperature to 98.6
set pi to 3.14159

-- Negative numbers
set debt to -1000
set belowZero to -273.15

-- Scientific notation
set bigNumber to 1.5e10  -- 15,000,000,000
set tiny to 3.2e-5       -- 0.000032
```

#### Strings

```sk8script
-- Double quotes
set name to "Alice"
set greeting to "Hello, world!"

-- Single quotes work too
set message to 'Welcome to SK8'

-- Empty string
set empty to ""

-- Strings with special characters
set path to "C:\Users\Documents"
set quote to "He said, \"Hello!\""
```

#### Booleans

```sk8script
-- Boolean values
set isAlive to true
set gameOver to false

-- Result of comparisons
set isAdult to age >= 18
set isEmpty to length(text) = 0
```

#### Null

```sk8script
-- Represents "no value"
set result to null

-- Check for null
if result is null then
    print("No result yet")
end if
```

#### Lists (Arrays)

```sk8script
-- Create a list
set numbers to [1, 2, 3, 4, 5]
set fruits to ["apple", "banana", "orange"]
set mixed to [1, "two", 3.0, true]
set empty to []

-- Lists are 1-indexed (first item is 1, not 0)
set firstFruit to item 1 of fruits  -- "apple"
```

#### Tables (Objects/Dictionaries)

```sk8script
-- Create a table (key-value pairs)
set person to {name: "Alice", age: 30, city: "Seattle"}
set config to {width: 800, height: 600, fullscreen: false}
set emptyTable to {}

-- Access values
set personName to the name of person  -- "Alice"
```

### Expressions and Operators

#### Arithmetic Operators

```sk8script
-- Basic math
set sum to 10 + 5      -- 15
set diff to 10 - 5     -- 5
set product to 10 * 5  -- 50
set quotient to 10 / 5 -- 2
set remainder to 10 mod 3  -- 1 (modulo)
set power to 2 ^ 8     -- 256 (exponent)

-- Operator precedence (like math class)
set result to 2 + 3 * 4  -- 14 (multiplication first)
set result to (2 + 3) * 4  -- 20 (parentheses first)

-- Unary minus
set negative to -42
set opposite to -someValue
```

#### Comparison Operators

```sk8script
-- Equality
set isEqual to x = y
set notEqual to x ≠ y  -- or x <> y

-- Relational
set isLess to x < y
set isGreater to x > y
set isLessOrEqual to x ≤ y  -- or x <= y
set isGreaterOrEqual to x ≥ y  -- or x >= y

-- Examples
set isAdult to age >= 18
set isCold to temp < 32
set isEmpty to count = 0
```

#### Logical Operators

```sk8script
-- AND (both must be true)
set canVote to age >= 18 and isCitizen

-- OR (at least one must be true)
set needsCoat to isCold or isRaining

-- NOT (negation)
set isNotEmpty to not isEmpty
set isNotReady to not isReady

-- Combining operators
set needsUmbrella to (isRaining or isSnowing) and not isIndoors
```

#### String Operators

```sk8script
-- Concatenation with &
set fullName to firstName & " " & lastName
set greeting to "Hello, " & name & "!"

-- String comparison
set isSame to text1 = text2
set comesFirst to name1 < name2  -- Alphabetical comparison
```

### Assignment

```sk8script
-- Basic assignment
set x to 10
set name to "Alice"

-- Multiple assignments
set x to 0
set y to 0
set z to 0

-- Assigning results of expressions
set area to width * height
set isValid to length(password) >= 8
set total to sum(prices)
```

---

## Natural Language Features

SK8Script's signature feature is its natural language syntax.

### The "the X of Y" Syntax

Access properties using natural language:

```sk8script
-- Instead of JavaScript: rect.left
set x to the left of rect

-- Instead of: rect.width
set w to the width of rect

-- Instead of: rect.fillColor
set color to the fillColor of rect

-- Chain property access
set containerWidth to the width of the container of myButton
```

**Why this syntax?**
- Reads like natural English
- Makes code self-documenting
- Reduces cognitive load for beginners
- Mirrors how you'd describe things verbally

### The "set the X of Y to Z" Syntax

Modify properties naturally:

```sk8script
-- Instead of JavaScript: rect.left = 100
set the left of rect to 100

-- Instead of: rect.fillColor = "red"
set the fillColor of rect to "red"

-- Computed values
set the width of rect to the width of rect * 2
set the top of rect to the top of rect + 10

-- Using expressions
set the opacity of rect to 0.5
set the visible of rect to false
```

### Item Access

Access list items naturally:

```sk8script
set fruits to ["apple", "banana", "orange"]

-- Get first item (1-indexed!)
set first to item 1 of fruits  -- "apple"

-- Get last item
set last to the last item of fruits  -- "orange"

-- Get middle item
set middle to item 2 of fruits  -- "banana"

-- Set an item
set item 2 of fruits to "grape"  -- fruits is now ["apple", "grape", "orange"]
```

### Property Chains

Chain multiple property accesses:

```sk8script
-- Deep property access
set buttonX to the left of the container of the button
set stageName to the name of the stage of myActor

-- In assignment
set the fillColor of the background of the stage to "white"
```

### Natural Comparisons

```sk8script
-- Use "is" for equality
if name is "Alice" then
    print("Hello Alice!")
end if

-- Use "is not" for inequality
if status is not "ready" then
    print("Please wait...")
end if

-- Null checks read naturally
if result is null then
    print("No result")
end if

if value is not null then
    print("We have a value!")
end if
```

---

## Control Flow

### If Statements

```sk8script
-- Simple if
if score > 100 then
    print("You win!")
end if

-- If-else
if temperature > 80 then
    print("It's hot!")
else
    print("It's not hot.")
end if

-- If-else if-else
if grade >= 90 then
    print("A")
else if grade >= 80 then
    print("B")
else if grade >= 70 then
    print("C")
else if grade >= 60 then
    print("D")
else
    print("F")
end if

-- Nested if statements
if isLoggedIn then
    if isAdmin then
        print("Admin panel")
    else
        print("User panel")
    end if
else
    print("Please log in")
end if
```

### While Loops

```sk8script
-- Basic while loop
set count to 1
while count <= 10 do
    print(count)
    set count to count + 1
end while

-- While with complex condition
while not gameOver and lives > 0 do
    playTurn()
    updateScore()
end while

-- Infinite loop (use with caution!)
while true do
    processEvents()
    -- Make sure you have a way to break out!
end while
```

### Repeat Loops

SK8Script has several types of repeat loops:

#### Repeat N Times

```sk8script
-- Repeat exactly 10 times
repeat 10 times
    print("Hello!")
end repeat

-- Using a variable
set count to 5
repeat count times
    blink()
end repeat
```

#### Repeat With (For Loop)

```sk8script
-- Count from 1 to 10
repeat with i from 1 to 10
    print(i)
end repeat
-- Output: 1 2 3 4 5 6 7 8 9 10

-- Count from 0 to 100 by 10s
repeat with i from 0 to 100 by 10
    print(i)
end repeat
-- Output: 0 10 20 30 40 50 60 70 80 90 100

-- Count backwards
repeat with i from 10 down to 1
    print(i)
end repeat
print("Liftoff!")
-- Output: 10 9 8 7 6 5 4 3 2 1 Liftoff!

-- Use the loop variable
repeat with i from 1 to 5
    set y to i * 50
    drawCircle(100, y, 20)
end repeat
```

#### Repeat While

```sk8script
-- Repeat while condition is true
set x to 0
repeat while x < 100
    set x to x + 10
    print(x)
end repeat

-- More complex conditions
repeat while not gameOver and time > 0
    updateGame()
end repeat
```

#### Repeat Until

```sk8script
-- Repeat until condition becomes true
set password to ""
repeat until length(password) >= 8
    set password to prompt("Enter password (8+ chars):")
end repeat

-- Process items until done
repeat until items is empty
    set item to first(items)
    processItem(item)
    removeItem(item)
end repeat
```

### Break and Continue

```sk8script
-- Break: exit loop early
repeat with i from 1 to 100
    if i * i > 1000 then
        break  -- Stop loop when square exceeds 1000
    end if
    print(i)
end repeat

-- Continue: skip to next iteration
repeat with i from 1 to 20
    if i mod 2 = 0 then
        continue  -- Skip even numbers
    end if
    print(i)  -- Only prints odd numbers
end repeat

-- Finding an item
set found to false
repeat with i from 1 to length(list)
    if item i of list = searchValue then
        set found to true
        set foundIndex to i
        break  -- Stop searching once found
    end if
end repeat
```

---

## Functions

Functions let you organize and reuse code.

### Defining Functions

```sk8script
-- Simple function
on sayHello()
    print("Hello, world!")
end sayHello

-- Call it
sayHello()  -- Output: Hello, world!

-- Function with parameters
on greet(name)
    print("Hello, " & name & "!")
end greet

greet("Alice")  -- Output: Hello, Alice!
greet("Bob")    -- Output: Hello, Bob!

-- Multiple parameters
on add(a, b)
    return a + b
end add

set sum to add(5, 3)  -- sum is 8
```

### Return Values

```sk8script
-- Return a single value
on square(n)
    return n * n
end square

set result to square(5)  -- result is 25

-- Return early
on absoluteValue(n)
    if n < 0 then
        return -n
    end if
    return n
end absoluteValue

-- Return nothing (undefined/null)
on printMessage(text)
    print(text)
    -- No return statement, implicitly returns null
end printMessage
```

### Parameters and Arguments

```sk8script
-- Named parameters make code clear
on createRectangle(x, y, width, height, color)
    set rect to new SK8Rectangle()
    set the left of rect to x
    set the top of rect to y
    set the width of rect to width
    set the height of rect to height
    set the fillColor of rect to color
    return rect
end createRectangle

-- Call with clear arguments
set myRect to createRectangle(100, 50, 200, 100, "blue")

-- Optional parameters (check for null)
on greet(name, greeting)
    if greeting is null then
        set greeting to "Hello"
    end if
    print(greeting & ", " & name & "!")
end greet

greet("Alice", "Welcome")  -- Output: Welcome, Alice!
greet("Bob", null)         -- Output: Hello, Bob!
```

### Closures and Scope

Functions can access variables from their surrounding scope:

```sk8script
-- Outer scope
set counter to 0

-- Function uses outer variable
on increment()
    set counter to counter + 1
    return counter
end increment

print(increment())  -- 1
print(increment())  -- 2
print(increment())  -- 3
```

```sk8script
-- Function factory creating closures
on makeCounter(start)
    set value to start

    on count()
        set value to value + 1
        return value
    end count

    return count
end makeCounter

set counter1 to makeCounter(0)
set counter2 to makeCounter(100)

print(counter1())  -- 1
print(counter1())  -- 2
print(counter2())  -- 101
print(counter2())  -- 102
```

### Recursive Functions

Functions can call themselves:

```sk8script
-- Calculate factorial recursively
on factorial(n)
    if n <= 1 then
        return 1
    else
        return n * factorial(n - 1)
    end if
end factorial

print(factorial(5))  -- 120 (5 * 4 * 3 * 2 * 1)

-- Fibonacci sequence
on fibonacci(n)
    if n <= 1 then
        return n
    else
        return fibonacci(n - 1) + fibonacci(n - 2)
    end if
end fibonacci

print(fibonacci(10))  -- 55
```

---

## Working with Objects

SK8Script is designed to work with SK8's object system.

### Getting Properties

```sk8script
-- Get a property value
set x to the left of myActor
set color to the fillColor of myActor
set isVisible to the visible of myActor

-- Nested properties
set containerWidth to the width of the container of myButton
```

### Setting Properties

```sk8script
-- Set a property
set the left of myActor to 100
set the top of myActor to 50
set the fillColor of myActor to "red"
set the visible of myActor to true

-- Using expressions
set the left of myActor to the left of myActor + 10
set the width of myActor to the width of stage / 2
```

### Calling Handlers (Methods)

```sk8script
-- Call a handler on an object
call moveTo(100, 200) on myActor
call setLabel("Click Me") on myButton
call render() on stage

-- Alternative syntax
myActor.moveTo(100, 200)
myButton.setLabel("Click Me")
stage.render()

-- With the result
set actorAtPoint to call actorAtPoint(150, 150) on stage
```

### Creating Objects

```sk8script
-- Create a new actor
set rect to new SK8Rectangle()

-- Set its properties
set the left of rect to 50
set the top of rect to 50
set the width of rect to 200
set the height of rect to 100
set the fillColor of rect to "blue"

-- Add it to the stage
call addActor(rect) on stage
```

### Object Inspection

```sk8script
-- Check object type
if typeOf(obj) is "SK8Rectangle" then
    print("It's a rectangle!")
end if

-- Check if property exists
if hasProperty(obj, "fillColor") then
    set color to the fillColor of obj
end if

-- Get all properties
set props to propertiesOf(obj)
print("Properties: " & join(props, ", "))

-- Get all handlers
set handlers to handlersOf(obj)
print("Handlers: " & join(handlers, ", "))
```

---

## Collections

Work with lists and tables (dictionaries).

### Lists

#### Creating and Accessing

```sk8script
-- Create lists
set numbers to [1, 2, 3, 4, 5]
set names to ["Alice", "Bob", "Charlie"]
set mixed to [42, "hello", true, null]
set empty to []

-- Access items (1-indexed!)
set first to item 1 of numbers  -- 1
set second to item 2 of names   -- "Bob"
set last to the last item of numbers  -- 5

-- Modify items
set item 2 of names to "Robert"  -- names is now ["Alice", "Robert", "Charlie"]
```

#### List Operations

```sk8script
-- Get length
set count to length(numbers)  -- 5

-- Add items
set numbers to append(numbers, 6)  -- [1, 2, 3, 4, 5, 6]
set numbers to prepend(0, numbers)  -- [0, 1, 2, 3, 4, 5, 6]

-- Remove items
set numbers to removeAt(numbers, 3)  -- Removes item at index 3

-- Check if item exists
if contains(names, "Alice") then
    print("Alice is in the list")
end if

-- Get first and last
set firstNum to first(numbers)
set lastNum to last(numbers)

-- Get all but first/last
set tail to rest(numbers)  -- All except first
set initial to butLast(numbers)  -- All except last

-- Concatenate lists
set combined to concat([1, 2, 3], [4, 5, 6])  -- [1, 2, 3, 4, 5, 6]

-- Reverse a list
set backwards to reverse(numbers)

-- Sort a list
set sorted to sort(numbers)

-- Get unique items
set unique to unique([1, 2, 2, 3, 3, 3, 4])  -- [1, 2, 3, 4]
```

#### Functional Operations

```sk8script
-- Map: transform each item
on double(x)
    return x * 2
end double

set numbers to [1, 2, 3, 4, 5]
set doubled to map(numbers, double)  -- [2, 4, 6, 8, 10]

-- Filter: keep items that match condition
on isEven(x)
    return x mod 2 = 0
end isEven

set evens to filter(numbers, isEven)  -- [2, 4]

-- Reduce: combine all items
on sum(acc, x)
    return acc + x
end sum

set total to reduce(numbers, sum, 0)  -- 15

-- With inline functions
set squares to map(numbers, (x) => x * x)  -- [1, 4, 9, 16, 25]
set odds to filter(numbers, (x) => x mod 2 = 1)  -- [1, 3, 5]
```

#### List Examples

```sk8script
-- Find maximum value
on findMax(list)
    set max to item 1 of list
    repeat with i from 2 to length(list)
        set current to item i of list
        if current > max then
            set max to current
        end if
    end repeat
    return max
end findMax

-- Average of numbers
on average(numbers)
    set total to reduce(numbers, (acc, n) => acc + n, 0)
    return total / length(numbers)
end average

-- Remove duplicates
on removeDuplicates(list)
    return unique(list)
end removeDuplicates
```

### Tables (Dictionaries)

#### Creating and Accessing

```sk8script
-- Create tables
set person to {name: "Alice", age: 30, city: "Seattle"}
set config to {width: 800, height: 600, fullscreen: false}
set empty to {}

-- Access values
set personName to the name of person  -- "Alice"
set age to the age of person  -- 30

-- Modify values
set the age of person to 31
set the city of person to "Portland"

-- Add new keys
set the email of person to "alice@example.com"
```

#### Table Operations

```sk8script
-- Get keys
set keyList to keys(person)  -- ["name", "age", "city"]

-- Get values
set valueList to values(person)  -- ["Alice", 30, "Seattle"]

-- Get entries (key-value pairs)
set entryList to entries(person)  -- [["name", "Alice"], ["age", 30], ...]

-- Check if key exists
if hasKey(person, "email") then
    print("Email: " & the email of person)
end if

-- Merge tables
set defaults to {fontSize: 12, color: "black"}
set options to {fontSize: 14}
set finalOptions to merge(defaults, options)  -- {fontSize: 14, color: "black"}

-- Size of table
set count to length(person)  -- 3
```

#### Iteration

```sk8script
-- Iterate over keys
set person to {name: "Alice", age: 30, city: "Seattle"}
set keyList to keys(person)

repeat with i from 1 to length(keyList)
    set key to item i of keyList
    set value to getProperty(person, key)
    print(key & ": " & value)
end repeat

-- Using forEach (if available)
forEach(person, (value, key) => {
    print(key & ": " & value)
})
```

---

## Standard Library

SK8Script includes a comprehensive standard library with 128+ built-in functions.

### Math Functions

```sk8script
-- Constants
print(pi)  -- 3.14159...
print(e)   -- 2.71828...

-- Basic math
set absValue to abs(-42)  -- 42
set rounded to round(3.7)  -- 4
set floored to floor(3.7)  -- 3
set ceiled to ceiling(3.2)  -- 4
set squareRoot to sqrt(16)  -- 4
set powered to power(2, 8)  -- 256

-- Min/Max
set smallest to min(5, 3, 8, 1)  -- 1
set largest to max(5, 3, 8, 1)  -- 8

-- Trigonometry
set sine to sin(radians)
set cosine to cos(radians)
set tangent to tan(radians)

-- Random
set rand to random()  -- Random number 0.0 to 1.0
set randInt to randomInt(1, 100)  -- Random integer 1 to 100
set randBetween to randomBetween(5.0, 10.0)  -- Random float

-- Logarithms
set natural to ln(10)  -- Natural log
set base10 to log10(100)  -- Base-10 log (2.0)
set exponential to exp(2)  -- e^2
```

### String Functions

```sk8script
-- Length
set len to length("Hello")  -- 5

-- Case conversion
set upper to toUpperCase("hello")  -- "HELLO"
set lower to toLowerCase("WORLD")  -- "world"

-- Substring
set sub to substring("Hello, world!", 1, 5)  -- "Hello"

-- Split and join
set words to split("apple,banana,orange", ",")  -- ["apple", "banana", "orange"]
set joined to join(words, " and ")  -- "apple and banana and orange"

-- Search
set index to indexOf("Hello, world!", "world")  -- 8
set hasSubstring to contains("Hello", "ell")  -- true
set startsWith to startsWith("Hello", "He")  -- true
set endsWith to endsWith("Hello", "lo")  -- true

-- Replace
set replaced to replace("Hello, world!", "world", "SK8")  -- "Hello, SK8!"
set allReplaced to replaceAll("aaa", "a", "b")  -- "bbb"

-- Trim whitespace
set trimmed to trim("  hello  ")  -- "hello"
set leftTrimmed to trimStart("  hello  ")  -- "hello  "
set rightTrimmed to trimEnd("  hello  ")  -- "  hello"

-- Repeat
set repeated to repeatString("ha", 3)  -- "hahaha"

-- Padding
set padded to padStart("42", 5, "0")  -- "00042"
set paddedEnd to padEnd("42", 5, "0")  -- "42000"

-- Character access
set char to charAt("Hello", 1)  -- "H" (1-indexed)
set code to charCodeAt("A", 1)  -- 65
set fromCode to fromCharCode(65)  -- "A"
```

### Collection Functions

```sk8script
-- List access
set firstItem to first([1, 2, 3])  -- 1
set lastItem to last([1, 2, 3])  -- 3
set tail to rest([1, 2, 3])  -- [2, 3]
set init to butLast([1, 2, 3])  -- [1, 2]

-- List modification
set appended to append([1, 2], 3)  -- [1, 2, 3]
set prepended to prepend(0, [1, 2, 3])  -- [0, 1, 2, 3]
set inserted to insertAt([1, 3], 2, 2)  -- [1, 2, 3]
set removed to removeAt([1, 2, 3], 2)  -- [1, 3]

-- List operations
set reversed to reverse([1, 2, 3])  -- [3, 2, 1]
set sorted to sort([3, 1, 2])  -- [1, 2, 3]
set hasItem to listContains([1, 2, 3], 2)  -- true
set uniq to unique([1, 2, 2, 3, 3])  -- [1, 2, 3]
set joined to concat([1, 2], [3, 4])  -- [1, 2, 3, 4]
set sliced to slice([1, 2, 3, 4, 5], 2, 4)  -- [2, 3, 4]

-- Functional programming
set doubled to map([1, 2, 3], (x) => x * 2)  -- [2, 4, 6]
set evens to filter([1, 2, 3, 4], (x) => x mod 2 = 0)  -- [2, 4]
set sum to reduce([1, 2, 3, 4], (acc, x) => acc + x, 0)  -- 10

-- List creation
set range1 to range(1, 5)  -- [1, 2, 3, 4, 5]
set range2 to range(0, 10, 2)  -- [0, 2, 4, 6, 8, 10]
set flattened to flatten([[1, 2], [3, 4]])  -- [1, 2, 3, 4]

-- Table operations
set keyList to keys({a: 1, b: 2})  -- ["a", "b"]
set valueList to values({a: 1, b: 2})  -- [1, 2]
set entries to entries({a: 1, b: 2})  -- [["a", 1], ["b", 2]]
set merged to merge({a: 1}, {b: 2})  -- {a: 1, b: 2}
set has to hasKey({a: 1}, "a")  -- true
```

### Type and Conversion Functions

```sk8script
-- Type checking
if isNumber(value) then print("It's a number")
if isString(value) then print("It's a string")
if isBoolean(value) then print("It's a boolean")
if isList(value) then print("It's a list")
if isTable(value) then print("It's a table")
if isObject(value) then print("It's an object")
if isNull(value) then print("It's null")
if isFunction(value) then print("It's a function")

-- Get type name
set typeName to typeOf(value)

-- Conversions
set str to toString(42)  -- "42"
set num to toNumber("42")  -- 42
set bool to toBoolean(1)  -- true

-- Parsing
set integer to parseInt("42")  -- 42
set float to parseFloat("3.14")  -- 3.14

-- JSON
set jsonString to toJSON({name: "Alice", age: 30})
set object to parseJSON('{"name":"Alice","age":30}')
```

### I/O and Debugging

```sk8script
-- Console output
print("Hello")  -- Standard output
log("Debug info")  -- Debug log
warn("Warning message")  -- Warning
error("Error occurred")  -- Error

-- Detailed inspection
inspect(myObject)  -- Pretty-print object details

-- Timing
startTimer("operation")
-- ... do work ...
endTimer("operation")  -- Prints elapsed time

-- Assertions
assert(x > 0, "x must be positive")

-- Browser dialogs
alert("Hello, user!")  -- Show alert
set confirmed to confirm("Are you sure?")  -- true/false
set input to prompt("Enter your name:", "Default")  -- Get user input
```

### Object Functions

```sk8script
-- Create objects
set obj to newObject()  -- Create empty SK8Object

-- Clone objects
set copy to clone(originalObject)  -- Shallow clone
set deepCopy to deepClone(originalObject)  -- Deep clone

-- Properties
set value to getProperty(obj, "propertyName")
call setProperty(obj, "propertyName", value)
set props to propertiesOf(obj)  -- Get all property names
set hasProp to hasProperty(obj, "propertyName")  -- Check if exists
call deleteProperty(obj, "propertyName")  -- Remove property

-- Hierarchy
set parent to parentOf(obj)  -- Get parent object

-- Handlers
set handlers to handlersOf(obj)  -- Get all handler names
set result to callHandler(obj, "handlerName", arg1, arg2)
call addHandler(obj, "handlerName", myFunction)
call removeHandler(obj, "handlerName")

-- Protection
call freeze(obj)  -- Make immutable
set frozen to isFrozen(obj)
call seal(obj)  -- Prevent adding/removing properties
set sealed to isSealed(obj)
```

---

## Complete Examples

Let's put it all together with complete, working programs.

### Example 1: Simple Counter

```sk8script
-- Create a counter with buttons

-- State
set count to 0

-- Update display
on updateDisplay()
    set the label of counterText to toString(count)
end updateDisplay

-- Handlers
on incrementClick()
    set count to count + 1
    updateDisplay()
end incrementClick

on decrementClick()
    set count to count - 1
    updateDisplay()
end decrementClick

on resetClick()
    set count to 0
    updateDisplay()
end resetClick

-- Setup UI
set counterText to new SK8Text()
set the text of counterText to "0"
set the fontSize of counterText to 48
call moveTo(300, 100) on counterText

set incrementBtn to new SK8Button()
set the label of incrementBtn to "+"
call moveTo(250, 200) on incrementBtn
call addHandler(incrementBtn, "click", incrementClick)

set decrementBtn to new SK8Button()
set the label of decrementBtn to "-"
call moveTo(200, 200) on decrementBtn
call addHandler(decrementBtn, "click", decrementClick)

set resetBtn to new SK8Button()
set the label of resetBtn to "Reset"
call moveTo(300, 200) on resetBtn
call addHandler(resetBtn, "click", resetClick)
```

### Example 2: Temperature Converter

```sk8script
-- Convert between Fahrenheit and Celsius

on celsiusToFahrenheit(c)
    return c * 9 / 5 + 32
end celsiusToFahrenheit

on fahrenheitToCelsius(f)
    return (f - 32) * 5 / 9
end fahrenheitToCelsius

on convertTemperature()
    set input to the text of inputField
    set temp to parseFloat(input)

    if isNaN(temp) then
        set the text of resultText to "Invalid number"
        return
    end if

    set mode to the selectedValue of modeSelector

    if mode is "CtoF" then
        set result to celsiusToFahrenheit(temp)
        set resultText to toString(round(result * 100) / 100) & "°F"
    else
        set result to fahrenheitToCelsius(temp)
        set resultText to toString(round(result * 100) / 100) & "°C"
    end if

    set the text of resultLabel to resultText
end convertTemperature

-- Setup UI (assumed to exist)
call addHandler(convertButton, "click", convertTemperature)
```

### Example 3: Bouncing Ball

```sk8script
-- Physics simulation

-- State
set ballX to 300
set ballY to 100
set velocityX to 5
set velocityY to 0
set gravity to 0.5
set bounce to 0.8

-- Update function (called each frame)
on updateBall()
    -- Apply gravity
    set velocityY to velocityY + gravity

    -- Update position
    set ballX to ballX + velocityX
    set ballY to ballY + velocityY

    -- Bounce off walls
    if ballX < 0 or ballX > 600 then
        set velocityX to -velocityX * bounce
        if ballX < 0 then
            set ballX to 0
        else
            set ballX to 600
        end if
    end if

    -- Bounce off floor
    if ballY > 400 then
        set ballY to 400
        set velocityY to -velocityY * bounce

        -- Stop if moving very slowly
        if abs(velocityY) < 1 then
            set velocityY to 0
        end if
    end if

    -- Update ball actor
    set the left of ball to ballX - 10
    set the top of ball to ballY - 10

    call render() on stage
end updateBall

-- Start animation loop
repeat forever
    updateBall()
    wait(16)  -- ~60 FPS
end repeat
```

### Example 4: Todo List

```sk8script
-- Simple todo list application

-- State
set todos to []

-- Add a new todo
on addTodo()
    set text to the text of inputField

    if length(trim(text)) = 0 then
        alert("Please enter a todo item")
        return
    end if

    set todo to {
        id: length(todos) + 1,
        text: text,
        completed: false
    }

    set todos to append(todos, todo)
    set the text of inputField to ""

    renderTodos()
end addTodo

-- Toggle todo completion
on toggleTodo(id)
    repeat with i from 1 to length(todos)
        set todo to item i of todos
        if the id of todo = id then
            set the completed of todo to not the completed of todo
        end if
    end repeat

    renderTodos()
end toggleTodo

-- Delete a todo
on deleteTodo(id)
    set newTodos to []
    repeat with i from 1 to length(todos)
        set todo to item i of todos
        if the id of todo ≠ id then
            set newTodos to append(newTodos, todo)
        end if
    end repeat

    set todos to newTodos
    renderTodos()
end deleteTodo

-- Render the todo list
on renderTodos()
    -- Clear existing todos
    call clearActors() on todoContainer

    -- Render each todo
    set y to 10
    repeat with i from 1 to length(todos)
        set todo to item i of todos

        -- Create checkbox
        set checkbox to new SK8CheckBox()
        set the checked of checkbox to the completed of todo
        call moveTo(10, y) on checkbox

        -- Create text label
        set label to new SK8Text()
        set the text of label to the text of todo
        call moveTo(40, y) on label

        -- Strike through if completed
        if the completed of todo then
            set the textStyle of label to "line-through"
            set the opacity of label to 0.5
        end if

        -- Create delete button
        set deleteBtn to new SK8Button()
        set the label of deleteBtn to "Delete"
        call moveTo(400, y) on deleteBtn

        -- Add to container
        call addActor(checkbox) on todoContainer
        call addActor(label) on todoContainer
        call addActor(deleteBtn) on todoContainer

        set y to y + 40
    end repeat

    -- Update count
    set the text of countLabel to toString(length(todos)) & " items"
end renderTodos
```

### Example 5: Color Mixer

```sk8script
-- Interactive RGB color mixer

-- State
set red to 128
set green to 128
set blue to 128

-- Update color display
on updateColor()
    set color to {r: red, g: green, b: blue, a: 1.0}
    set the fillColor of colorPreview to color

    set hexColor to rgbToHex(red, green, blue)
    set the text of hexLabel to hexColor

    call render() on stage
end updateColor

-- Convert RGB to hex
on rgbToHex(r, g, b)
    on toHexByte(n)
        set hex to "0123456789ABCDEF"
        set high to floor(n / 16)
        set low to n mod 16
        return charAt(hex, high + 1) & charAt(hex, low + 1)
    end toHexByte

    return "#" & toHexByte(r) & toHexByte(g) & toHexByte(b)
end rgbToHex

-- Slider handlers
on redChanged(value)
    set red to value
    updateColor()
end redChanged

on greenChanged(value)
    set green to value
    updateColor()
end greenChanged

on blueChanged(value)
    set blue to value
    updateColor()
end blueChanged

-- Setup sliders
set redSlider to new SK8Slider()
set the minimum of redSlider to 0
set the maximum of redSlider to 255
set the value of redSlider to red
call addHandler(redSlider, "valueChanged", redChanged)

set greenSlider to new SK8Slider()
set the minimum of greenSlider to 0
set the maximum of greenSlider to 255
set the value of greenSlider to green
call addHandler(greenSlider, "valueChanged", greenChanged)

set blueSlider to new SK8Slider()
set the minimum of blueSlider to 0
set the maximum of blueSlider to 255
set the value of blueSlider to blue
call addHandler(blueSlider, "valueChanged", blueChanged)

-- Initial update
updateColor()
```

### Example 6: Simple Calculator

```sk8script
-- Basic calculator

-- State
set display to "0"
set currentValue to 0
set operation to null
set waitingForOperand to false

-- Update display
on updateDisplay()
    set the text of displayLabel to display
end updateDisplay

-- Number button clicked
on numberClick(digit)
    if waitingForOperand then
        set display to toString(digit)
        set waitingForOperand to false
    else
        if display is "0" then
            set display to toString(digit)
        else
            set display to display & toString(digit)
        end if
    end if

    updateDisplay()
end numberClick

-- Operation button clicked
on operationClick(op)
    set value to parseFloat(display)

    if operation is not null then
        set result to calculate(currentValue, value, operation)
        set display to toString(result)
        set currentValue to result
    else
        set currentValue to value
    end if

    set operation to op
    set waitingForOperand to true
    updateDisplay()
end operationClick

-- Equals button clicked
on equalsClick()
    if operation is null then
        return
    end if

    set value to parseFloat(display)
    set result to calculate(currentValue, value, operation)

    set display to toString(result)
    set currentValue to 0
    set operation to null
    set waitingForOperand to false

    updateDisplay()
end equalsClick

-- Clear button
on clearClick()
    set display to "0"
    set currentValue to 0
    set operation to null
    set waitingForOperand to false
    updateDisplay()
end clearClick

-- Perform calculation
on calculate(a, b, op)
    if op is "+" then
        return a + b
    else if op is "-" then
        return a - b
    else if op is "*" then
        return a * b
    else if op is "/" then
        if b = 0 then
            alert("Cannot divide by zero")
            return 0
        end if
        return a / b
    end if
    return 0
end calculate
```

### Example 7: Animation Sequencer

```sk8script
-- Create a sequence of animations

-- List of actors to animate
set actors to [circle1, circle2, circle3, circle4, circle5]

-- Animate actors in sequence
on animateSequence()
    set delay to 0

    repeat with i from 1 to length(actors)
        set actor to item i of actors
        set targetX to i * 100

        -- Animate with delay
        call wait(delay) then
            call animate(actor, "left", targetX, 500) with Easing.easeOutBounce
            call animate(actor, "top", 300, 500) with Easing.easeOutBounce
        end

        set delay to delay + 200  -- Stagger by 200ms
    end repeat
end animateSequence

-- Animate actors in parallel
on animateParallel()
    repeat with i from 1 to length(actors)
        set actor to item i of actors
        set targetY to randomInt(50, 400)

        call animate(actor, "top", targetY, 1000) with Easing.easeInOutCubic
    end repeat
end animateParallel

-- Wave animation
on animateWave()
    repeat with i from 1 to length(actors)
        set actor to item i of actors
        set delay to i * 100

        call wait(delay) then
            -- Up
            call animate(actor, "top", 100, 300) with Easing.easeOutQuad
                then
                -- Down
                call animate(actor, "top", 300, 300) with Easing.easeInQuad
            end
        end
    end repeat
end animateWave
```

### Example 8: Data Visualization

```sk8script
-- Simple bar chart

-- Data
set data to [
    {label: "Jan", value: 45},
    {label: "Feb", value: 67},
    {label: "Mar", value: 52},
    {label: "Apr", value: 89},
    {label: "May", value: 73}
]

-- Chart settings
set chartX to 50
set chartY to 50
set chartWidth to 500
set chartHeight to 300
set barWidth to 60
set barSpacing to 20

-- Find maximum value
on findMax(data)
    set max to 0
    repeat with i from 1 to length(data)
        set item to item i of data
        if the value of item > max then
            set max to the value of item
        end if
    end repeat
    return max
end findMax

-- Draw chart
on drawChart()
    set maxValue to findMax(data)
    set x to chartX

    repeat with i from 1 to length(data)
        set item to item i of data
        set value to the value of item
        set label to the label of item

        -- Calculate bar height
        set barHeight to (value / maxValue) * chartHeight
        set barY to chartY + chartHeight - barHeight

        -- Create bar
        set bar to new SK8Rectangle()
        set the left of bar to x
        set the top of bar to barY
        set the width of bar to barWidth
        set the height of bar to barHeight
        set the fillColor of bar to "steelblue"
        set the frameColor of bar to "navy"

        call addActor(bar) on stage

        -- Create label
        set labelText to new SK8Text()
        set the text of labelText to label
        set the left of labelText to x + barWidth / 2
        set the top of labelText to chartY + chartHeight + 10
        set the textAlign of labelText to "center"

        call addActor(labelText) on stage

        -- Create value label
        set valueText to new SK8Text()
        set the text of valueText to toString(value)
        set the left of valueText to x + barWidth / 2
        set the top of valueText to barY - 20
        set the textAlign of valueText to "center"

        call addActor(valueText) on stage

        -- Animate bar growing
        call animate(bar, "height", barHeight, 1000) with Easing.easeOutBounce

        -- Next bar position
        set x to x + barWidth + barSpacing
    end repeat
end drawChart

drawChart()
```

### Example 9: Game: Click the Circles

```sk8script
-- Simple clicking game

-- State
set score to 0
set timeLeft to 30
set gameActive to false
set circles to []

-- Create a random circle
on createCircle()
    set circle to new SK8Circle()

    set x to randomInt(50, 550)
    set y to randomInt(50, 350)
    set radius to randomInt(20, 50)

    set the left of circle to x - radius
    set the top of circle to y - radius
    set the width of circle to radius * 2
    set the height of circle to radius * 2

    set colors to ["red", "blue", "green", "yellow", "purple", "orange"]
    set color to item randomInt(1, length(colors)) of colors
    set the fillColor of circle to color

    -- Add click handler
    call addHandler(circle, "click", on circleClick()
        if gameActive then
            set score to score + 1
            updateScore()

            -- Remove this circle
            call removeActor(circle) on stage
            set circles to filter(circles, (c) => c ≠ circle)

            -- Create new circle
            createCircle()
        end
    end)

    call addActor(circle) on stage
    set circles to append(circles, circle)
end createCircle

-- Update score display
on updateScore()
    set the text of scoreLabel to "Score: " & toString(score)
end updateScore

-- Update timer display
on updateTimer()
    set the text of timerLabel to "Time: " & toString(timeLeft)
end updateTimer

-- Game loop
on gameLoop()
    if not gameActive then
        return
    end if

    set timeLeft to timeLeft - 1
    updateTimer()

    if timeLeft <= 0 then
        endGame()
        return
    end if

    -- Schedule next tick
    call setTimeout(gameLoop, 1000)
end gameLoop

-- Start game
on startGame()
    set score to 0
    set timeLeft to 30
    set gameActive to true

    updateScore()
    updateTimer()

    -- Clear existing circles
    repeat with i from 1 to length(circles)
        call removeActor(item i of circles) on stage
    end repeat
    set circles to []

    -- Create initial circles
    repeat 5 times
        createCircle()
    end repeat

    -- Start game loop
    gameLoop()
end startGame

-- End game
on endGame()
    set gameActive to false

    alert("Game Over! Your score: " & toString(score))

    set the label of startButton to "Play Again"
end endGame

-- Setup
call addHandler(startButton, "click", startGame)
```

### Example 10: Form Validation

```sk8script
-- Form validation and submission

-- Validate email format
on isValidEmail(email)
    -- Simple email validation
    if not contains(email, "@") then
        return false
    end if

    set parts to split(email, "@")
    if length(parts) ≠ 2 then
        return false
    end if

    set localPart to item 1 of parts
    set domain to item 2 of parts

    if length(localPart) = 0 or length(domain) = 0 then
        return false
    end if

    if not contains(domain, ".") then
        return false
    end if

    return true
end isValidEmail

-- Validate form
on validateForm()
    set errors to []

    -- Validate name
    set name to trim(the text of nameField)
    if length(name) = 0 then
        set errors to append(errors, "Name is required")
    end if

    -- Validate email
    set email to trim(the text of emailField)
    if length(email) = 0 then
        set errors to append(errors, "Email is required")
    else if not isValidEmail(email) then
        set errors to append(errors, "Email is invalid")
    end if

    -- Validate password
    set password to the text of passwordField
    if length(password) < 8 then
        set errors to append(errors, "Password must be at least 8 characters")
    end if

    -- Validate password confirmation
    set confirmPassword to the text of confirmPasswordField
    if password ≠ confirmPassword then
        set errors to append(errors, "Passwords do not match")
    end if

    -- Validate age
    set age to parseInt(the text of ageField)
    if isNaN(age) or age < 18 or age > 120 then
        set errors to append(errors, "Age must be between 18 and 120")
    end if

    -- Check agreement checkbox
    if not the checked of agreeCheckbox then
        set errors to append(errors, "You must agree to the terms")
    end if

    return errors
end validateForm

-- Submit form
on submitForm()
    set errors to validateForm()

    if length(errors) > 0 then
        -- Show errors
        set errorMessage to join(errors, "\n")
        alert("Please fix the following errors:\n\n" & errorMessage)
        return
    end if

    -- Form is valid, submit
    set formData to {
        name: trim(the text of nameField),
        email: trim(the text of emailField),
        age: parseInt(the text of ageField)
    }

    log("Form submitted:", formData)
    alert("Form submitted successfully!")

    -- Clear form
    clearForm()
end submitForm

-- Clear form
on clearForm()
    set the text of nameField to ""
    set the text of emailField to ""
    set the text of passwordField to ""
    set the text of confirmPasswordField to ""
    set the text of ageField to ""
    set the checked of agreeCheckbox to false
end clearForm

-- Setup event handlers
call addHandler(submitButton, "click", submitForm)
call addHandler(clearButton, "click", clearForm)
```

---

## Next Steps

Now that you've learned SK8Script, explore:

- **[Animation Tutorial](ANIMATION_TUTORIAL.md)** - Advanced animation techniques
- **[UI Components Guide](UI_COMPONENTS.md)** - Build complex interfaces
- **[Recipe Book](RECIPES.md)** - More complete examples
- **[Standard Library Reference](../SK8SCRIPT_STDLIB_SUMMARY.md)** - All 128+ built-in functions

Happy scripting!
