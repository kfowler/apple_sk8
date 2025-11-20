#!/usr/bin/env node

/**
 * Static Export Tool for SK8 Projects
 *
 * Exports an SK8 project to a standalone HTML file that:
 * - Inlines all JS and CSS
 * - Embeds assets as base64 (or external files)
 * - Creates a minified single HTML file
 * - Requires no server to run
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { minify: minifyHTML } = require('html-minifier');

// Configuration
const config = {
  inputProject: process.argv[2],
  outputFile: process.argv[3] || 'sk8-export.html',
  embedAssets: !process.argv.includes('--external-assets'),
  minify: !process.argv.includes('--no-minify'),
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

function readFile(filePath, encoding = 'utf-8') {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    log.error(`Failed to read ${filePath}: ${error.message}`);
    throw error;
  }
}

function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    log.error(`Failed to write ${filePath}: ${error.message}`);
    throw error;
  }
}

function getFileBase64(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (error) {
    log.warn(`Failed to read asset: ${filePath}`);
    return null;
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function embedAsset(filePath, basePath) {
  if (!config.embedAssets) {
    return path.relative(basePath, filePath);
  }

  const base64 = getFileBase64(filePath);
  if (!base64) return null;

  const mimeType = getMimeType(filePath);
  return `data:${mimeType};base64,${base64}`;
}

function generateStandaloneHTML(projectData) {
  log.step('Generating standalone HTML...');

  // Get SK8 library code
  const distPath = path.resolve(__dirname, '../dist');
  let sk8Code = '';

  // Try to use minified bundle first, fall back to compiled code
  const bundlePath = path.join(distPath, 'sk8.min.js');
  if (fs.existsSync(bundlePath)) {
    sk8Code = readFile(bundlePath);
    if (config.verbose) log.info('Using minified bundle');
  } else {
    // Concatenate compiled files
    const sk8Path = path.join(distPath, 'sk8.js');
    if (fs.existsSync(sk8Path)) {
      sk8Code = readFile(sk8Path);
      if (config.verbose) log.info('Using compiled code');
    } else {
      throw new Error('SK8 bundle not found. Run build first.');
    }
  }

  // Create HTML template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="SK8 Static Export Tool">
  <title>${projectData.title || 'SK8 Project'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    #sk8-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    canvas {
      display: block;
    }

    .sk8-error {
      color: #d32f2f;
      padding: 20px;
      background: #ffebee;
      border-radius: 4px;
      margin: 20px;
    }

    .sk8-loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div id="sk8-container">
    <div class="sk8-loading">Loading SK8 Project...</div>
  </div>

  <script>
    // SK8 Library
    ${sk8Code}
  </script>

  <script>
    // Project Data
    const PROJECT_DATA = ${JSON.stringify(projectData, null, 2)};

    // Initialize SK8
    (function() {
      try {
        const container = document.getElementById('sk8-container');
        container.innerHTML = '<canvas id="sk8-canvas"></canvas>';

        const canvas = document.getElementById('sk8-canvas');
        const stage = SK8.createStage(canvas);

        // Set canvas size
        if (PROJECT_DATA.width && PROJECT_DATA.height) {
          canvas.width = PROJECT_DATA.width;
          canvas.height = PROJECT_DATA.height;
        } else {
          canvas.width = 800;
          canvas.height = 600;
        }

        // Load project
        if (PROJECT_DATA.actors) {
          PROJECT_DATA.actors.forEach(actor => {
            // Create and add actors based on project data
            // This is a simplified loader - full implementation would handle all actor types
            console.log('Loading actor:', actor);
          });
        }

        // Run initialization code
        if (PROJECT_DATA.init) {
          eval(PROJECT_DATA.init);
        }

        console.log('SK8 project loaded successfully');
      } catch (error) {
        console.error('Failed to load SK8 project:', error);
        document.getElementById('sk8-container').innerHTML =
          '<div class="sk8-error"><strong>Error:</strong> ' + error.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;

  return html;
}

async function exportProject() {
  console.log(chalk.bold.cyan('\n📦 SK8 Static Export Tool\n'));

  if (!config.inputProject) {
    log.error('No input project specified');
    console.log('\nUsage: npm run export <project.json> [output.html] [options]');
    console.log('\nOptions:');
    console.log('  --external-assets  Keep assets as external files');
    console.log('  --no-minify        Skip HTML minification');
    console.log('  --verbose          Show detailed output');
    process.exit(1);
  }

  try {
    log.step('Loading project...');

    // Load project data
    const projectPath = path.resolve(config.inputProject);
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project file not found: ${projectPath}`);
    }

    let projectData;
    if (projectPath.endsWith('.json')) {
      const content = readFile(projectPath);
      projectData = JSON.parse(content);
    } else {
      throw new Error('Only JSON project files are supported');
    }

    log.success('Project loaded');

    // Process assets
    if (projectData.assets && config.embedAssets) {
      log.step('Embedding assets...');
      const basePath = path.dirname(projectPath);

      for (const [key, assetPath] of Object.entries(projectData.assets)) {
        const fullPath = path.resolve(basePath, assetPath);
        if (fs.existsSync(fullPath)) {
          const embedded = embedAsset(fullPath, basePath);
          if (embedded) {
            projectData.assets[key] = embedded;
            if (config.verbose) log.info(`Embedded: ${key}`);
          }
        } else {
          log.warn(`Asset not found: ${assetPath}`);
        }
      }

      log.success('Assets embedded');
    }

    // Generate HTML
    let html = generateStandaloneHTML(projectData);

    // Minify
    if (config.minify) {
      log.step('Minifying HTML...');
      const originalSize = Buffer.byteLength(html);

      html = minifyHTML(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
      });

      const minifiedSize = Buffer.byteLength(html);
      const savings = Math.round((1 - minifiedSize / originalSize) * 100);
      log.success(`Minified (${savings}% smaller)`);
    }

    // Write output
    const outputPath = path.resolve(config.outputFile);
    writeFile(outputPath, html);

    const fileSize = Buffer.byteLength(html);
    log.success(`Exported to ${outputPath} (${Math.round(fileSize / 1024)} KB)`);

    console.log(chalk.bold.green('\n✨ Export completed successfully!\n'));
  } catch (error) {
    log.error(error.message);
    if (config.verbose) console.error(error);
    console.log(chalk.bold.red('\n❌ Export failed\n'));
    process.exit(1);
  }
}

// Run export
exportProject();
