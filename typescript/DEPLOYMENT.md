# SK8 TypeScript Deployment Guide

Complete guide for building, testing, and deploying SK8 TypeScript projects.

## Table of Contents

- [Quick Start](#quick-start)
- [Building for Production](#building-for-production)
- [NPM Package Usage](#npm-package-usage)
- [Static Export](#static-export)
- [Development Server](#development-server)
- [Documentation Generation](#documentation-generation)
- [Release Process](#release-process)
- [CI/CD Setup](#cicd-setup)
- [Deployment Targets](#deployment-targets)
- [Bundle Analysis](#bundle-analysis)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Generate documentation
npm run docs
```

## Building for Production

### Standard Build

The standard build command runs a comprehensive build process:

```bash
npm run build
```

This command:
1. Cleans the `dist/` directory
2. Compiles TypeScript to JavaScript
3. Bundles with Rollup (ESM, CJS, UMD formats)
4. Minifies HTML demos
5. Copies assets
6. Generates source maps
7. Creates a build report

### Build Options

```bash
# Build with Rollup only (smaller bundles, library-focused)
npm run build:rollup

# Build with Webpack only (UMD bundle for browsers)
npm run build:webpack

# Build with TypeScript compiler only
npm run build:tsc

# Build with Rollup (skip tests)
node scripts/build.js --rollup --skip-tests

# Build without minifying demos
node scripts/build.js --no-minify-demos

# Build with verbose output
node scripts/build.js --verbose
```

### Build Output

After building, the `dist/` directory will contain:

```
dist/
├── sk8.js              # TypeScript compiled output
├── sk8.min.js          # Webpack UMD bundle (minified)
├── sk8.esm.js          # Rollup ESM bundle
├── sk8.cjs.js          # Rollup CommonJS bundle
├── sk8.umd.js          # Rollup UMD bundle
├── sk8.d.ts            # TypeScript declarations
├── *.map               # Source maps
├── demo/               # Minified demos
└── build-report.json   # Build statistics
```

## NPM Package Usage

### Installing SK8 from NPM

```bash
npm install sk8-ts
```

### Using in Your Project

#### ES Modules (Recommended)

```javascript
import { createStage, SK8Rectangle } from 'sk8-ts';

const stage = createStage('myCanvas');
const rect = new SK8Rectangle(stage, 100, 100, 200, 150);
rect.fillColor = { r: 255, g: 0, b: 0 };
```

#### CommonJS

```javascript
const { createStage, SK8Rectangle } = require('sk8-ts');

const stage = createStage('myCanvas');
// ... rest of code
```

#### Browser Script Tag

```html
<script src="node_modules/sk8-ts/dist/sk8.min.js"></script>
<script>
  const stage = SK8.createStage('myCanvas');
  const rect = new SK8.SK8Rectangle(stage, 100, 100, 200, 150);
</script>
```

### Package Exports

The package provides multiple entry points:

```json
{
  "main": "dist/sk8.cjs.js",      // Node.js (CommonJS)
  "module": "dist/sk8.esm.js",    // Bundlers (ESM)
  "types": "dist/sk8.d.ts"        // TypeScript
}
```

Modern bundlers will automatically pick the best format for your project.

## Static Export

Export standalone HTML files that work without a server:

```bash
# Export a project to standalone HTML
npm run export project.json output.html

# Export with external assets (smaller file)
npm run export project.json output.html --external-assets

# Export without minification
npm run export project.json output.html --no-minify

# Verbose output
npm run export project.json output.html --verbose
```

The exported HTML file:
- Contains all SK8 code inlined
- Embeds assets as base64 (or links to external files)
- Works by double-clicking (no server needed)
- Is fully minified and optimized

Example:

```bash
# Create a standalone demo
npm run export demos/example.json standalone-demo.html
```

## Development Server

Run a local development server with live reload:

```bash
# Start server on default port (8080)
npm run dev

# Custom port
PORT=3000 npm run dev

# Custom host
HOST=0.0.0.0 npm run dev
```

Features:
- Live reload on file changes
- WebSocket-based hot reload
- CORS headers for local development
- Serves from `typescript/` directory
- Watches `src/`, `demo/`, and `dist/` directories

Access your project at: `http://localhost:8080`

## Documentation Generation

Generate API documentation from TypeScript source:

```bash
# Generate full documentation
npm run docs

# With verbose output
npm run docs --verbose
```

Output location: `docs/api/index.html`

The documentation includes:
- JSDoc comments from source files
- Parameter descriptions
- Return types
- Examples
- Links to source code
- Organized by category

## Release Process

### Creating a Release

```bash
# Patch release (1.0.0 → 1.0.1)
npm run release patch

# Minor release (1.0.0 → 1.1.0)
npm run release minor

# Major release (1.0.0 → 2.0.0)
npm run release major

# Specific version
npm run release 2.5.3
```

### Release Options

```bash
# Dry run (see what would happen)
npm run release patch --dry-run

# Skip tests
npm run release patch --skip-tests

# Skip build
npm run release patch --skip-build

# Verbose output
npm run release patch --verbose
```

### Release Process Steps

The release script:
1. Checks git status (must be clean)
2. Runs tests (unless skipped)
3. Builds the project
4. Updates version in `package.json`
5. Updates `CHANGELOG.md`
6. Creates git commit
7. Creates git tag
8. Prompts to push to remote
9. Prompts to publish to npm

### Manual Release Steps

If you prefer manual control:

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Build
npm run build

# 3. Test
npm test

# 4. Publish
npm publish

# 5. Push git tags
git push --follow-tags
```

## CI/CD Setup

### GitHub Actions

The project includes a comprehensive CI/CD pipeline in `.github/workflows/ci.yml`.

#### Pipeline Jobs

1. **Lint and Format Check** - ESLint and Prettier
2. **Tests** - Matrix testing across Node 16, 18, 20
3. **Build** - Multiple bundlers (TypeScript, Webpack, Rollup)
4. **Bundle Size Check** - Ensures < 200KB gzipped
5. **Generate Docs** - API documentation
6. **Deploy to GitHub Pages** - Demos and docs (main branch only)
7. **Release** - Automated releases on version tags

#### Triggering Workflows

Workflows run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches
- Manual trigger via GitHub Actions UI

#### Setting Up Secrets

For full CI/CD functionality, configure these secrets in GitHub:

```bash
# Optional: For npm publishing
CODECOV_TOKEN  # For code coverage reporting
NPM_TOKEN      # For automated npm publishing
```

### Custom CI/CD

To use with other CI systems (GitLab, CircleCI, etc.), adapt these commands:

```bash
# CI Build Script
npm ci                    # Install dependencies
npm run typecheck         # Type checking
npm run lint              # Linting
npm run format:check      # Format checking
npm test                  # Tests
npm run build             # Build
```

## Deployment Targets

### GitHub Pages

Deploy demos and documentation to GitHub Pages:

```bash
# Deploy to gh-pages branch
npm run deploy-demo github-pages

# Deploy to custom branch
npm run deploy-demo github-pages --branch my-branch

# Dry run
npm run deploy-demo github-pages --dry-run
```

After deployment, your site will be available at:
`https://<username>.github.io/<repo>/`

### Netlify

Deploy to Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
npm run deploy-demo netlify
```

First-time setup:
1. Run `netlify login` to authenticate
2. Run `netlify init` to link your site
3. Deploy with `npm run deploy-demo netlify`

### Local Preview

Build demos locally without deploying:

```bash
npm run deploy-demo local

# Serve the built demos
npx serve dist-demo
```

### Custom Deployment

For custom deployments, build the demos and deploy the `dist-demo/` directory:

```bash
npm run deploy-demo local
# Then deploy dist-demo/ to your hosting service
```

## Bundle Analysis

### Build Report

After building, check `dist/build-report.json` for detailed statistics:

```bash
cat dist/build-report.json
```

Contains:
- File sizes (formatted and bytes)
- Total bundle size
- Timestamp
- Bundler used

### Bundle Size Checking

```bash
# Check all bundle sizes
ls -lh dist/sk8*.js

# Check gzipped size
gzip -c dist/sk8.min.js | wc -c

# Detailed analysis with source-map-explorer
npm install -g source-map-explorer
source-map-explorer dist/sk8.min.js
```

### Size Limits

The CI pipeline enforces:
- **Gzipped size**: < 200KB (hard limit)
- **Uncompressed size**: < 500KB (recommended)

If you exceed these limits:
1. Review dependencies
2. Use dynamic imports for large features
3. Enable tree-shaking
4. Remove unused code

## Troubleshooting

### Build Fails

**Problem**: TypeScript compilation errors

```bash
# Check for type errors
npm run typecheck

# See specific errors
npx tsc --noEmit
```

**Problem**: Webpack/Rollup errors

```bash
# Build with verbose output
npm run build -- --verbose

# Test individual bundlers
npm run build:tsc    # TypeScript only
npm run build:rollup # Rollup only
npm run build:webpack # Webpack only
```

### Bundle Too Large

**Solution 1**: Use Rollup instead of Webpack

```bash
npm run build:rollup
```

Rollup typically produces smaller bundles for libraries.

**Solution 2**: Check dependencies

```bash
# Analyze bundle composition
npm run build:webpack
npx webpack-bundle-analyzer dist/stats.json
```

**Solution 3**: Enable tree-shaking

Ensure your code uses ES modules and avoid:
- Side effects in module initialization
- Dynamic requires/imports where possible
- Circular dependencies

### Tests Fail

**Problem**: Build tools tests fail

```bash
# Run build tools tests specifically
npm test -- tests/build-tools.test.ts

# Run with coverage
npm run test:coverage
```

**Problem**: Tests can't find build output

```bash
# Build first, then test
npm run build
npm test
```

### Dev Server Issues

**Problem**: Port already in use

```bash
# Use different port
PORT=3001 npm run dev
```

**Problem**: Live reload not working

Check that:
1. WebSocket port (8080) is not blocked
2. Browser console for WebSocket errors
3. File watching is working (chokidar)

### Documentation Generation Fails

**Problem**: JSDoc parsing errors

```bash
# Generate with verbose output
npm run docs -- --verbose

# Check specific files
grep -r "@param" src/ | less
```

**Problem**: No documentation generated

Ensure your code has JSDoc comments:

```typescript
/**
 * Description of the function
 * @param name - Parameter description
 * @returns Return value description
 */
export function myFunction(name: string): string {
  return `Hello, ${name}!`;
}
```

### Release Issues

**Problem**: Git status not clean

```bash
# Stash changes
git stash

# Or commit changes
git add .
git commit -m "Prepare for release"
```

**Problem**: npm publish fails

```bash
# Check if logged in
npm whoami

# Login if needed
npm login

# Check package name availability
npm search sk8-ts
```

## Best Practices

### Development Workflow

1. **Make changes** - Edit source files in `src/`
2. **Test locally** - Run `npm run dev` for live preview
3. **Run tests** - `npm test` before committing
4. **Lint and format** - `npm run lint:fix && npm run format`
5. **Build** - `npm run build` to verify production build
6. **Commit** - Commit your changes
7. **CI checks** - Wait for CI to pass

### Before Releasing

Checklist:
- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Production build works (`npm run build`)
- [ ] Bundle size is acceptable
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version number follows semver

### Performance Optimization

1. **Code splitting** - Use dynamic imports for large features
2. **Tree shaking** - Use named exports, avoid default exports
3. **Minification** - Enabled by default in production
4. **Compression** - Enable gzip/brotli on your server
5. **Caching** - Use versioned file names for assets

### Security

1. **Audit dependencies** - Run `npm audit` regularly
2. **Update packages** - Keep dependencies up to date
3. **Review PRs** - Use CI checks on all pull requests
4. **Secrets management** - Never commit secrets to git
5. **HTTPS** - Always use HTTPS in production

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Webpack Documentation](https://webpack.js.org/)
- [Rollup Documentation](https://rollupjs.org/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/apple/sk8/issues
- Discussions: https://github.com/apple/sk8/discussions

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
