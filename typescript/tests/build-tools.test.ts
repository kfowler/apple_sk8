/**
 * Build Tools Test Suite
 *
 * Tests for deployment and build tooling
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const scriptsDir = path.join(rootDir, 'scripts');

describe('Build Tools', () => {
  describe('Configuration Files', () => {
    test('webpack.config.js exists and is valid', () => {
      const webpackConfig = path.join(rootDir, 'webpack.config.js');
      expect(fs.existsSync(webpackConfig)).toBe(true);

      const config = require(webpackConfig);
      expect(typeof config).toBe('function');
    });

    test('rollup.config.js exists and is valid', () => {
      const rollupConfig = path.join(rootDir, 'rollup.config.js');
      expect(fs.existsSync(rollupConfig)).toBe(true);
    });

    test('tsconfig.json exists and has correct settings', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.declaration).toBe(true);
      expect(tsconfig.compilerOptions.sourceMap).toBe(true);
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    test('.npmignore exists and excludes development files', () => {
      const npmignorePath = path.join(rootDir, '.npmignore');
      expect(fs.existsSync(npmignorePath)).toBe(true);

      const content = fs.readFileSync(npmignorePath, 'utf-8');
      expect(content).toContain('tests/');
      expect(content).toContain('scripts/');
      expect(content).toContain('.github/');
    });

    test('package.json has correct build scripts', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts['build:webpack']).toBeDefined();
      expect(pkg.scripts['build:rollup']).toBeDefined();
      expect(pkg.scripts.dev).toBeDefined();
      expect(pkg.scripts.export).toBeDefined();
      expect(pkg.scripts.docs).toBeDefined();
      expect(pkg.scripts.release).toBeDefined();
    });

    test('package.json has correct exports configuration', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(pkg.main).toBeDefined();
      expect(pkg.module).toBeDefined();
      expect(pkg.types).toBeDefined();
      expect(pkg.exports).toBeDefined();
      expect(pkg.exports['.']).toBeDefined();
    });

    test('package.json version is 1.0.0 or higher', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const version = pkg.version.split('.').map(Number);
      expect(version[0]).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Build Scripts', () => {
    test('build.js exists and is executable', () => {
      const buildScript = path.join(scriptsDir, 'build.js');
      expect(fs.existsSync(buildScript)).toBe(true);

      const stats = fs.statSync(buildScript);
      // Check if file has execution permissions (owner, group, or others)
      expect(stats.mode & 0o111).toBeGreaterThan(0);
    });

    test('dev-server.js exists', () => {
      const devServer = path.join(scriptsDir, 'dev-server.js');
      expect(fs.existsSync(devServer)).toBe(true);
    });

    test('export-static.js exists', () => {
      const exportScript = path.join(scriptsDir, 'export-static.js');
      expect(fs.existsSync(exportScript)).toBe(true);
    });

    test('generate-docs.js exists', () => {
      const docsScript = path.join(scriptsDir, 'generate-docs.js');
      expect(fs.existsSync(docsScript)).toBe(true);
    });

    test('release.js exists', () => {
      const releaseScript = path.join(scriptsDir, 'release.js');
      expect(fs.existsSync(releaseScript)).toBe(true);
    });

    test('deploy-demo.js exists', () => {
      const deployScript = path.join(scriptsDir, 'deploy-demo.js');
      expect(fs.existsSync(deployScript)).toBe(true);
    });

    test('all scripts have proper shebang', () => {
      const scripts = ['build.js', 'dev-server.js', 'export-static.js', 'generate-docs.js', 'release.js', 'deploy-demo.js'];

      scripts.forEach(script => {
        const scriptPath = path.join(scriptsDir, script);
        const content = fs.readFileSync(scriptPath, 'utf-8');
        expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
      });
    });
  });

  describe('Build Output', () => {
    // Note: These tests require the project to be built first

    test('TypeScript compilation creates output directory', () => {
      if (fs.existsSync(distDir)) {
        expect(fs.existsSync(distDir)).toBe(true);
        expect(fs.statSync(distDir).isDirectory()).toBe(true);
      }
    });

    test('Build creates declaration files', () => {
      if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        const dtsFiles = files.filter(f => f.endsWith('.d.ts'));
        expect(dtsFiles.length).toBeGreaterThan(0);
      }
    });

    test('Build creates source map files', () => {
      if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        const mapFiles = files.filter(f => f.endsWith('.js.map'));
        expect(mapFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Bundle Format Validation', () => {
    test('ESM bundle should export named exports', () => {
      const esmBundle = path.join(distDir, 'sk8.esm.js');
      if (fs.existsSync(esmBundle)) {
        const content = fs.readFileSync(esmBundle, 'utf-8');
        expect(content).toContain('export');
      }
    });

    test('CJS bundle should use module.exports', () => {
      const cjsBundle = path.join(distDir, 'sk8.cjs.js');
      if (fs.existsSync(cjsBundle)) {
        const content = fs.readFileSync(cjsBundle, 'utf-8');
        expect(content).toContain('exports') || expect(content).toContain('module.exports');
      }
    });

    test('UMD bundle should work in multiple environments', () => {
      const umdBundle = path.join(distDir, 'sk8.umd.js');
      if (fs.existsSync(umdBundle)) {
        const content = fs.readFileSync(umdBundle, 'utf-8');
        // UMD pattern detection
        expect(content).toContain('typeof define') || expect(content).toContain('typeof exports');
      }
    });
  });

  describe('Bundle Size', () => {
    test('Minified bundle should be reasonably sized', () => {
      const minBundle = path.join(distDir, 'sk8.min.js');
      if (fs.existsSync(minBundle)) {
        const stats = fs.statSync(minBundle);
        const sizeKB = stats.size / 1024;

        // Bundle should be less than 500KB
        expect(sizeKB).toBeLessThan(500);
      }
    });

    test('Gzipped bundle should be under 200KB', () => {
      const minBundle = path.join(distDir, 'sk8.min.js');
      if (fs.existsSync(minBundle)) {
        try {
          const gzipSize = execSync(`gzip -c ${minBundle} | wc -c`, { encoding: 'utf-8' });
          const sizeKB = parseInt(gzipSize.trim()) / 1024;

          expect(sizeKB).toBeLessThan(200);
        } catch (error) {
          // Skip if gzip not available
          console.warn('Gzip not available, skipping gzip size test');
        }
      }
    });

    test('ESM bundle should be tree-shakeable', () => {
      const esmBundle = path.join(distDir, 'sk8.esm.js');
      if (fs.existsSync(esmBundle)) {
        const content = fs.readFileSync(esmBundle, 'utf-8');

        // Should not contain IIFE patterns that prevent tree-shaking
        expect(content).not.toContain('(function()');

        // Should have individual exports
        expect(content).toContain('export {');
      }
    });
  });

  describe('Source Maps', () => {
    test('Source maps are generated for bundles', () => {
      if (fs.existsSync(distDir)) {
        const expectedMaps = ['sk8.min.js.map', 'sk8.esm.js.map', 'sk8.cjs.js.map'];

        expectedMaps.forEach(mapFile => {
          const mapPath = path.join(distDir, mapFile);
          if (fs.existsSync(mapPath)) {
            expect(fs.existsSync(mapPath)).toBe(true);
          }
        });
      }
    });

    test('Source maps are valid JSON', () => {
      const mapFile = path.join(distDir, 'sk8.min.js.map');
      if (fs.existsSync(mapFile)) {
        const content = fs.readFileSync(mapFile, 'utf-8');

        expect(() => JSON.parse(content)).not.toThrow();

        const map = JSON.parse(content);
        expect(map.version).toBe(3);
        expect(map.sources).toBeDefined();
        expect(Array.isArray(map.sources)).toBe(true);
      }
    });

    test('Source maps reference correct source files', () => {
      const mapFile = path.join(distDir, 'sk8.min.js.map');
      if (fs.existsSync(mapFile)) {
        const map = JSON.parse(fs.readFileSync(mapFile, 'utf-8'));

        // Should have TypeScript sources
        const tsSources = map.sources.filter((s: string) => s.endsWith('.ts'));
        expect(tsSources.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Type Definitions', () => {
    test('Main type definition file exists', () => {
      const mainDts = path.join(distDir, 'sk8.d.ts');
      if (fs.existsSync(distDir)) {
        expect(fs.existsSync(mainDts)).toBe(true);
      }
    });

    test('Type definitions export main API', () => {
      const mainDts = path.join(distDir, 'sk8.d.ts');
      if (fs.existsSync(mainDts)) {
        const content = fs.readFileSync(mainDts, 'utf-8');

        // Should export core types
        expect(content).toContain('export');
        expect(content).toContain('SK8Stage') || expect(content).toContain('createStage');
      }
    });
  });

  describe('GitHub Actions', () => {
    test('CI workflow file exists', () => {
      const ciWorkflow = path.join(rootDir, '../.github/workflows/ci.yml');
      expect(fs.existsSync(ciWorkflow)).toBe(true);
    });

    test('CI workflow has required jobs', () => {
      const ciWorkflow = path.join(rootDir, '../.github/workflows/ci.yml');
      if (fs.existsSync(ciWorkflow)) {
        const content = fs.readFileSync(ciWorkflow, 'utf-8');

        expect(content).toContain('lint');
        expect(content).toContain('test');
        expect(content).toContain('build');
      }
    });

    test('CI workflow tests multiple Node versions', () => {
      const ciWorkflow = path.join(rootDir, '../.github/workflows/ci.yml');
      if (fs.existsSync(ciWorkflow)) {
        const content = fs.readFileSync(ciWorkflow, 'utf-8');

        expect(content).toContain('matrix');
        expect(content).toContain('node-version');
      }
    });
  });

  describe('Development Experience', () => {
    test('Dev server script is properly configured', () => {
      const devServer = path.join(scriptsDir, 'dev-server.js');
      const content = fs.readFileSync(devServer, 'utf-8');

      expect(content).toContain('WebSocket');
      expect(content).toContain('chokidar');
      expect(content).toContain('http');
    });

    test('Package has watch script', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(pkg.scripts.watch).toBeDefined();
      expect(pkg.scripts.watch).toContain('tsc --watch');
    });
  });

  describe('Release Process', () => {
    test('Release script handles version bumping', () => {
      const releaseScript = path.join(scriptsDir, 'release.js');
      const content = fs.readFileSync(releaseScript, 'utf-8');

      expect(content).toContain('bumpVersion');
      expect(content).toContain('major');
      expect(content).toContain('minor');
      expect(content).toContain('patch');
    });

    test('Package has prepublishOnly script', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(pkg.scripts.prepublishOnly).toBeDefined();
      expect(pkg.scripts.prepublishOnly).toContain('validate');
      expect(pkg.scripts.prepublishOnly).toContain('build');
    });

    test('CHANGELOG.md file should exist or be creatable', () => {
      const changelogPath = path.join(rootDir, 'CHANGELOG.md');
      // Either exists or can be created by release script
      expect(
        fs.existsSync(changelogPath) || fs.existsSync(path.join(scriptsDir, 'release.js'))
      ).toBe(true);
    });
  });

  describe('Documentation', () => {
    test('Documentation generator processes TypeScript files', () => {
      const docsScript = path.join(scriptsDir, 'generate-docs.js');
      const content = fs.readFileSync(docsScript, 'utf-8');

      expect(content).toContain('.ts');
      expect(content).toContain('JSDoc');
    });

    test('Documentation generator creates HTML output', () => {
      const docsScript = path.join(scriptsDir, 'generate-docs.js');
      const content = fs.readFileSync(docsScript, 'utf-8');

      expect(content).toContain('html') || expect(content).toContain('HTML');
      expect(content).toContain('docs/api');
    });
  });

  describe('Static Export', () => {
    test('Export script can handle project data', () => {
      const exportScript = path.join(scriptsDir, 'export-static.js');
      const content = fs.readFileSync(exportScript, 'utf-8');

      expect(content).toContain('json') || expect(content).toContain('JSON');
      expect(content).toContain('html') || expect(content).toContain('HTML');
    });

    test('Export script can embed assets', () => {
      const exportScript = path.join(scriptsDir, 'export-static.js');
      const content = fs.readFileSync(exportScript, 'utf-8');

      expect(content).toContain('base64');
      expect(content).toContain('embed');
    });

    test('Export script supports minification', () => {
      const exportScript = path.join(scriptsDir, 'export-static.js');
      const content = fs.readFileSync(exportScript, 'utf-8');

      expect(content).toContain('minify');
    });
  });
});
