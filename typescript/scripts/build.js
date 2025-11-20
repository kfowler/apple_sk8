#!/usr/bin/env node

/**
 * Comprehensive Build Script for SK8 TypeScript
 *
 * Features:
 * - Clean dist directory
 * - TypeScript compilation
 * - Bundle with webpack or rollup
 * - Minify HTML demos
 * - Copy assets
 * - Generate source maps
 * - Build report (sizes, dependencies)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { minify: minifyHTML } = require('html-minifier');

// Configuration
const config = {
  bundler: process.argv.includes('--rollup') ? 'rollup' : 'webpack',
  skipTests: process.argv.includes('--skip-tests'),
  minifyDemos: !process.argv.includes('--no-minify-demos'),
  verbose: process.argv.includes('--verbose'),
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.error(chalk.red('✗'), msg),
  warn: (msg) => console.warn(chalk.yellow('⚠'), msg),
  step: (msg) => console.log(chalk.cyan('▶'), chalk.bold(msg)),
};

function exec(command, options = {}) {
  const startTime = Date.now();
  try {
    if (config.verbose) {
      log.info(`Executing: ${command}`);
    }
    const output = execSync(command, {
      stdio: config.verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8',
      ...options,
    });
    const duration = Date.now() - startTime;
    if (config.verbose) {
      log.info(`Completed in ${duration}ms`);
    }
    return output;
  } catch (error) {
    log.error(`Command failed: ${command}`);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// Build steps
async function cleanDist() {
  log.step('Cleaning dist directory...');
  const distPath = path.resolve(__dirname, '../dist');

  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  fs.mkdirSync(distPath, { recursive: true });
  log.success('Dist directory cleaned');
}

async function compileTypeScript() {
  log.step('Compiling TypeScript...');
  const startTime = Date.now();

  try {
    exec('npx tsc --project tsconfig.json', { cwd: path.resolve(__dirname, '..') });
    const duration = Date.now() - startTime;
    log.success(`TypeScript compiled in ${duration}ms`);
  } catch (error) {
    log.error('TypeScript compilation failed');
    throw error;
  }
}

async function bundleWithWebpack() {
  log.step('Bundling with Webpack...');
  const startTime = Date.now();

  try {
    exec('npx webpack --mode production', { cwd: path.resolve(__dirname, '..') });
    const duration = Date.now() - startTime;
    log.success(`Webpack bundle created in ${duration}ms`);
  } catch (error) {
    log.error('Webpack bundling failed');
    throw error;
  }
}

async function bundleWithRollup() {
  log.step('Bundling with Rollup...');
  const startTime = Date.now();

  try {
    exec('npx rollup -c', { cwd: path.resolve(__dirname, '..') });
    const duration = Date.now() - startTime;
    log.success(`Rollup bundles created in ${duration}ms`);
  } catch (error) {
    log.error('Rollup bundling failed');
    throw error;
  }
}

async function minifyDemos() {
  if (!config.minifyDemos) {
    log.info('Skipping demo minification');
    return;
  }

  log.step('Minifying HTML demos...');
  const demoPath = path.resolve(__dirname, '../demo');
  const distDemoPath = path.resolve(__dirname, '../dist/demo');

  if (!fs.existsSync(demoPath)) {
    log.warn('Demo directory not found');
    return;
  }

  fs.mkdirSync(distDemoPath, { recursive: true });

  const htmlFiles = fs.readdirSync(demoPath).filter(f => f.endsWith('.html'));

  for (const file of htmlFiles) {
    const srcPath = path.join(demoPath, file);
    const destPath = path.join(distDemoPath, file);
    const content = fs.readFileSync(srcPath, 'utf-8');

    try {
      const minified = minifyHTML(content, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      });

      fs.writeFileSync(destPath, minified);
      const originalSize = Buffer.byteLength(content);
      const minifiedSize = Buffer.byteLength(minified);
      const savings = Math.round((1 - minifiedSize / originalSize) * 100);

      if (config.verbose) {
        log.info(`${file}: ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savings}% reduction)`);
      }
    } catch (error) {
      log.warn(`Failed to minify ${file}, copying original`);
      copyFile(srcPath, destPath);
    }
  }

  log.success(`Minified ${htmlFiles.length} HTML demo(s)`);
}

async function copyAssets() {
  log.step('Copying assets...');
  const rootDir = path.resolve(__dirname, '..');

  // Copy package.json metadata
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const distPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    main: packageJson.main,
    module: packageJson.module,
    types: packageJson.types,
    exports: packageJson.exports,
    keywords: packageJson.keywords,
    author: packageJson.author,
    license: packageJson.license,
    repository: packageJson.repository,
    bugs: packageJson.bugs,
    homepage: packageJson.homepage,
  };

  fs.writeFileSync(
    path.join(rootDir, 'dist', 'package.json'),
    JSON.stringify(distPackageJson, null, 2)
  );

  // Copy README if exists
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    copyFile(readmePath, path.join(rootDir, 'dist', 'README.md'));
  }

  log.success('Assets copied');
}

async function generateBuildReport() {
  log.step('Generating build report...');
  const distPath = path.resolve(__dirname, '../dist');

  const report = {
    timestamp: new Date().toISOString(),
    bundler: config.bundler,
    files: {},
    totalSize: 0,
  };

  // Collect file sizes
  const files = [
    'sk8.min.js',
    'sk8.min.js.map',
    'sk8.esm.js',
    'sk8.esm.js.map',
    'sk8.cjs.js',
    'sk8.cjs.js.map',
    'sk8.umd.js',
    'sk8.umd.js.map',
    'sk8.d.ts',
  ];

  for (const file of files) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      const size = getFileSize(filePath);
      report.files[file] = {
        size,
        sizeFormatted: formatBytes(size),
      };
      report.totalSize += size;
    }
  }

  report.totalSizeFormatted = formatBytes(report.totalSize);

  // Write report
  fs.writeFileSync(
    path.join(distPath, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Display summary
  console.log('\n' + chalk.bold('Build Report:'));
  console.log(chalk.gray('─'.repeat(50)));

  Object.entries(report.files).forEach(([file, info]) => {
    console.log(`  ${file.padEnd(30)} ${chalk.cyan(info.sizeFormatted)}`);
  });

  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.bold('Total:'.padEnd(30))} ${chalk.cyan(chalk.bold(report.totalSizeFormatted))}`);
  console.log();

  log.success('Build report generated');
}

async function runTests() {
  if (config.skipTests) {
    log.info('Skipping tests');
    return;
  }

  log.step('Running tests...');
  try {
    exec('npm test', { cwd: path.resolve(__dirname, '..') });
    log.success('All tests passed');
  } catch (error) {
    log.error('Tests failed');
    throw error;
  }
}

// Main build process
async function build() {
  const startTime = Date.now();

  console.log(chalk.bold.cyan('\n🚀 SK8 Build Process\n'));
  console.log(chalk.gray(`Bundler: ${config.bundler}`));
  console.log(chalk.gray(`Options: ${JSON.stringify(config, null, 2)}\n`));

  try {
    await cleanDist();
    await compileTypeScript();

    if (config.bundler === 'webpack') {
      await bundleWithWebpack();
    } else {
      await bundleWithRollup();
    }

    await minifyDemos();
    await copyAssets();
    await generateBuildReport();

    if (!config.skipTests) {
      await runTests();
    }

    const duration = Date.now() - startTime;
    console.log(chalk.bold.green(`\n✨ Build completed successfully in ${duration}ms!\n`));
  } catch (error) {
    console.log(chalk.bold.red('\n❌ Build failed\n'));
    process.exit(1);
  }
}

// Run build
build();
