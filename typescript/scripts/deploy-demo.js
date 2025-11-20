#!/usr/bin/env node

/**
 * Demo Deployment Script for SK8 TypeScript
 *
 * Features:
 * - Build all demos
 * - Generate demo index page
 * - Deploy to GitHub Pages or Netlify
 * - Include all examples and docs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const config = {
  deployTarget: process.argv[2] || 'github-pages',
  branch: process.argv.includes('--branch') ? process.argv[process.argv.indexOf('--branch') + 1] : 'gh-pages',
  buildDir: path.resolve(__dirname, '../dist-demo'),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// Logging utilities
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.error(chalk.red('✗'), msg),
  warn: (msg) => console.warn(chalk.yellow('⚠'), msg),
  step: (msg) => console.log(chalk.cyan('▶'), chalk.bold(msg)),
};

function exec(command, options = {}) {
  try {
    if (config.verbose) {
      log.info(`Executing: ${command}`);
    }
    return execSync(command, {
      stdio: config.verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8',
      ...options,
    });
  } catch (error) {
    log.error(`Command failed: ${command}`);
    throw error;
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

function generateDemoIndex(demos) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SK8 TypeScript Demos</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      color: white;
      margin-bottom: 60px;
    }

    header h1 {
      font-size: 3em;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    header p {
      font-size: 1.3em;
      opacity: 0.9;
    }

    .section {
      margin-bottom: 40px;
    }

    .section h2 {
      color: white;
      font-size: 2em;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: #333;
      display: block;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.2);
    }

    .card h3 {
      color: #667eea;
      font-size: 1.5em;
      margin-bottom: 10px;
    }

    .card p {
      color: #666;
      line-height: 1.6;
    }

    .card .tag {
      display: inline-block;
      background: #f0f0f0;
      color: #666;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      margin-top: 10px;
      margin-right: 5px;
    }

    footer {
      text-align: center;
      color: white;
      margin-top: 60px;
      padding-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }

    footer p {
      opacity: 0.8;
    }

    footer a {
      color: white;
      text-decoration: none;
      border-bottom: 1px solid rgba(255,255,255,0.5);
    }

    footer a:hover {
      border-bottom-color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>SK8 TypeScript</h1>
      <p>Interactive Demos and Examples</p>
    </header>

    <div class="section">
      <h2>Demos</h2>
      <div class="grid">
        ${demos.map(demo => `
          <a href="${demo.path}" class="card">
            <h3>${demo.title}</h3>
            <p>${demo.description}</p>
            ${demo.tags ? demo.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </a>
        `).join('\n')}
      </div>
    </div>

    <div class="section">
      <h2>Documentation</h2>
      <div class="grid">
        <a href="docs/api/" class="card">
          <h3>API Reference</h3>
          <p>Complete API documentation for all SK8 classes and functions.</p>
          <span class="tag">Reference</span>
        </a>
        <a href="README.html" class="card">
          <h3>Getting Started</h3>
          <p>Learn how to use SK8 TypeScript in your projects.</p>
          <span class="tag">Tutorial</span>
        </a>
      </div>
    </div>

    <footer>
      <p>SK8 TypeScript Port © ${new Date().getFullYear()}</p>
      <p>Based on the original SK8 by Apple Computer, Inc.</p>
      <p><a href="https://github.com/apple/sk8" target="_blank">View on GitHub</a></p>
    </footer>
  </div>
</body>
</html>`;
}

async function buildDemos() {
  log.step('Building demos...');
  const rootDir = path.resolve(__dirname, '..');

  // Clean build directory
  if (fs.existsSync(config.buildDir)) {
    fs.rmSync(config.buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(config.buildDir, { recursive: true });

  // Copy dist directory
  const distPath = path.join(rootDir, 'dist');
  if (fs.existsSync(distPath)) {
    copyDirectory(distPath, path.join(config.buildDir, 'dist'));
    log.success('Copied dist files');
  } else {
    log.warn('dist directory not found, run build first');
  }

  // Copy demo directory
  const demoPath = path.join(rootDir, 'demo');
  if (fs.existsSync(demoPath)) {
    copyDirectory(demoPath, path.join(config.buildDir, 'demo'));
    log.success('Copied demo files');
  }

  // Copy docs if available
  const docsPath = path.join(rootDir, 'docs');
  if (fs.existsSync(docsPath)) {
    copyDirectory(docsPath, path.join(config.buildDir, 'docs'));
    log.success('Copied documentation');
  }

  // Find all demos
  const demos = [];
  if (fs.existsSync(demoPath)) {
    const demoFiles = fs.readdirSync(demoPath).filter(f => f.endsWith('.html'));

    for (const file of demoFiles) {
      const content = fs.readFileSync(path.join(demoPath, file), 'utf-8');
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : file.replace('.html', '');

      demos.push({
        path: `demo/${file}`,
        title,
        description: `Demo: ${title}`,
        tags: ['Interactive', 'Demo'],
      });
    }
  }

  // Generate index page
  const indexHTML = generateDemoIndex(demos);
  fs.writeFileSync(path.join(config.buildDir, 'index.html'), indexHTML);
  log.success('Generated demo index');

  // Copy README as HTML
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    const readmeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SK8 TypeScript - README</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
    }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <pre>${readme}</pre>
  <p><a href="index.html">← Back to demos</a></p>
</body>
</html>`;
    fs.writeFileSync(path.join(config.buildDir, 'README.html'), readmeHTML);
  }

  log.success(`Built ${demos.length} demos`);
}

async function deployToGitHubPages() {
  log.step('Deploying to GitHub Pages...');

  if (config.dryRun) {
    log.info('[DRY RUN] Would deploy to GitHub Pages');
    return;
  }

  try {
    const rootDir = path.resolve(__dirname, '..');

    // Initialize git in build directory
    exec('git init', { cwd: config.buildDir });
    exec('git add .', { cwd: config.buildDir });
    exec(`git commit -m "Deploy demos"`, { cwd: config.buildDir });

    // Get remote URL
    const remoteUrl = exec('git config --get remote.origin.url', { cwd: rootDir }).trim();

    if (!remoteUrl) {
      throw new Error('No git remote found');
    }

    // Push to gh-pages branch
    exec(`git push -f ${remoteUrl} HEAD:${config.branch}`, { cwd: config.buildDir });

    log.success('Deployed to GitHub Pages');
    log.info(`View at: https://<username>.github.io/<repo>/`);
  } catch (error) {
    log.error('Failed to deploy to GitHub Pages');
    throw error;
  }
}

async function deployToNetlify() {
  log.step('Deploying to Netlify...');

  if (config.dryRun) {
    log.info('[DRY RUN] Would deploy to Netlify');
    return;
  }

  try {
    // Check if netlify-cli is installed
    try {
      exec('npx netlify --version');
    } catch {
      log.error('netlify-cli not found. Install with: npm install -g netlify-cli');
      return;
    }

    // Deploy
    exec(`npx netlify deploy --prod --dir="${config.buildDir}"`, {
      cwd: path.resolve(__dirname, '..'),
    });

    log.success('Deployed to Netlify');
  } catch (error) {
    log.error('Failed to deploy to Netlify');
    throw error;
  }
}

async function deploy() {
  const startTime = Date.now();

  console.log(chalk.bold.cyan('\n🚀 SK8 Demo Deployment\n'));

  if (!['github-pages', 'netlify', 'local'].includes(config.deployTarget)) {
    log.error(`Invalid deploy target: ${config.deployTarget}`);
    console.log('\nUsage: npm run deploy-demo [github-pages|netlify|local] [options]');
    console.log('\nOptions:');
    console.log('  --branch <name>  GitHub Pages branch (default: gh-pages)');
    console.log('  --dry-run        Show what would be done without making changes');
    console.log('  --verbose        Show detailed output');
    process.exit(1);
  }

  if (config.dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  try {
    await buildDemos();

    if (config.deployTarget === 'github-pages') {
      await deployToGitHubPages();
    } else if (config.deployTarget === 'netlify') {
      await deployToNetlify();
    } else {
      log.info(`Demos built to: ${config.buildDir}`);
      log.info('Serve locally with: npx serve dist-demo');
    }

    const duration = Date.now() - startTime;
    console.log(chalk.bold.green(`\n✨ Deployment completed successfully in ${duration}ms!\n`));
  } catch (error) {
    log.error('Deployment failed');
    if (config.verbose) console.error(error);
    console.log(chalk.bold.red('\n❌ Deployment aborted\n'));
    process.exit(1);
  }
}

// Run deployment
deploy();
