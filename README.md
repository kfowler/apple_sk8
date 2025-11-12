# SK8 - Modern Common Lisp Build

This repository contains SK8, Apple Research Labs' multimedia authoring environment from the 1990s, with a modern build system for Clozure CL and SBCL.

## Original SK8

SK8 was originally designed for Macintosh Common Lisp (MCL) and had extensive dependencies on:
- Mac Toolbox APIs (QuickDraw, Resource Manager, etc.)
- MCL-specific features and packages
- Mac OS Classic environment

## Modern Build System

This branch includes a compatibility layer that allows the SK8 package structure to be loaded on modern Common Lisp implementations, specifically:
- **Clozure CL** (CCL)
- **SBCL** (Steel Bank Common Lisp)

### What's Included

1. **ASDF System Definition** (`apple-sk8.asd`)
   - Modern build system using ASDF
   - Defines system dependencies and load order

2. **Compatibility Layer** (`compat/`)
   - `package.lisp` - Defines the CCL package for MCL compatibility
   - `mcl-compat.lisp` - Stubs for MCL-specific functions and variables
   - `toolbox-stubs.lisp` - Stubs for Mac Toolbox API calls

3. **Package Definitions** (`Sources/packages.lisp`)
   - Defines SK8, SK8Script, UI, Graphics-System, and other packages
   - Compatible with modern Common Lisp

### Limitations

This is a **minimal build** that:
- ✅ Loads the package structure successfully
- ✅ Provides compatibility stubs for Mac Toolbox calls
- ✅ Allows the code to be parsed and loaded
- ❌ Does NOT provide functional Mac Toolbox implementations
- ❌ Does NOT include GUI functionality (requires Mac OS)
- ❌ Does NOT compile or run the full SK8 system

The vast majority of SK8's functionality depends on Mac Toolbox APIs that don't exist outside of Mac OS Classic. This build system allows the code to be studied, analyzed, and potentially ported, but SK8 cannot run as originally designed without the Mac OS environment.

## Building

### Prerequisites

Install either Clozure CL or SBCL:

**Clozure CL:**
```bash
# Linux
sudo apt-get install ccl
# Or download from https://ccl.clozure.com/
```

**SBCL:**
```bash
# Linux
sudo apt-get install sbcl
# Or download from http://www.sbcl.org/
```

### Loading the System

#### With Clozure CL:
```bash
ccl --load apple-sk8.asd --eval "(asdf:load-system :apple-sk8)" --eval "(quit)"
```

Or interactively:
```bash
ccl
```
```lisp
(load "apple-sk8.asd")
(asdf:load-system :apple-sk8)
```

**Note:** Clozure CL already has a CCL package, so the compatibility layer is designed to work seamlessly with it. The system should load without issues on Clozure CL.

#### With SBCL:
```bash
sbcl --eval "(require :asdf)" --load apple-sk8.asd --eval "(asdf:load-system :apple-sk8)" --eval "(quit)"
```

Or interactively:
```bash
sbcl
```
```lisp
(require :asdf)
(load "apple-sk8.asd")
(asdf:load-system :apple-sk8)
```

**Successfully Tested:** This build system has been verified to work on SBCL 2.2.9.

### Just the Compatibility Layer

To load only the compatibility layer:

```lisp
(asdf:load-system :apple-sk8/compat)
```

## Original Build Instructions

The original build procedure for MCL is documented in `Sources/SK8's Build Procedure`. This is preserved for historical reference but requires:
- Macintosh Common Lisp (MCL) 3.1 or 4.0
- Mac OS Classic (System 7 through Mac OS 9)
- Mac OS hardware (68K or PowerPC)

## Project Structure

```
apple_sk8/
├── apple-sk8.asd              # ASDF system definition
├── README.md                  # This file
├── compat/                    # Compatibility layer
│   ├── package.lisp           # CCL package definition
│   ├── mcl-compat.lisp        # MCL compatibility
│   └── toolbox-stubs.lisp     # Mac Toolbox stubs
└── Sources/                   # Original SK8 source code
    ├── packages.lisp          # SK8 package definitions
    ├── Build Part 1/          # MCL build preparation
    ├── SK8/                   # Core SK8 source
    └── SourceServer Source/   # SourceServer integration
```

## Development

This build system is intended for:
- **Code archaeology** - studying historic Apple software
- **Educational purposes** - learning about 1990s application frameworks
- **Preservation** - ensuring the code remains loadable
- **Porting efforts** - foundation for modernization attempts

## License

SK8 is licensed under the SK8 License. See `sk8_license.pdf` for details.

## Historical Context

SK8 was developed at Apple's Advanced Technology Group in the 1990s as a multimedia authoring environment. It featured:
- Object-oriented programming in SK8Script
- Visual development tools
- Multimedia capabilities (graphics, sound, video)
- Integration with QuickTime

This repository preserves this important piece of computing history.

## Acknowledgments

- Original SK8 team at Apple Computer, Inc.
- Apple Research Laboratories
- The Common Lisp community for maintaining compatibility standards
