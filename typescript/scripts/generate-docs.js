#!/usr/bin/env node

/**
 * Documentation Generator for SK8 TypeScript
 *
 * Features:
 * - Extracts JSDoc from TypeScript files
 * - Generates API reference HTML
 * - Links to source code
 * - Includes examples from tests
 * - Outputs to docs/api/
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const config = {
  srcDir: path.resolve(__dirname, '../src'),
  testDir: path.resolve(__dirname, '../tests'),
  outputDir: path.resolve(__dirname, '../docs/api'),
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

// Parse JSDoc comments from source code
function extractJSDoc(content, filePath) {
  const jsdocPattern = /\/\*\*\s*([\s\S]*?)\*\//g;
  const docs = [];
  let match;

  while ((match = jsdocPattern.exec(content)) !== null) {
    const comment = match[1];
    const startIndex = match.index + match[0].length;

    // Extract the code following the comment (next 5 lines)
    const remainingContent = content.substring(startIndex);
    const codeMatch = remainingContent.match(/\s*(export\s+)?(class|interface|function|const|type|enum)\s+(\w+)/);

    if (codeMatch) {
      const [, , type, name] = codeMatch;

      // Parse JSDoc tags
      const description = [];
      const params = [];
      const returns = [];
      const examples = [];
      let deprecated = false;

      comment.split('\n').forEach(line => {
        line = line.trim().replace(/^\*\s?/, '');

        if (line.startsWith('@param')) {
          params.push(line.substring(6).trim());
        } else if (line.startsWith('@returns') || line.startsWith('@return')) {
          returns.push(line.substring(line.indexOf(' ')).trim());
        } else if (line.startsWith('@example')) {
          examples.push(line.substring(8).trim());
        } else if (line.startsWith('@deprecated')) {
          deprecated = true;
        } else if (!line.startsWith('@')) {
          description.push(line);
        }
      });

      docs.push({
        name,
        type,
        description: description.join(' ').trim(),
        params,
        returns: returns.join(' '),
        examples,
        deprecated,
        file: path.relative(config.srcDir, filePath),
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }

  return docs;
}

// Find all TypeScript files
function findTypeScriptFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Generate HTML for documentation
function generateHTML(docsByCategory) {
  const categories = Object.keys(docsByCategory).sort();

  let tocHTML = '';
  let contentHTML = '';

  categories.forEach(category => {
    const docs = docsByCategory[category];
    const categoryId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');

    tocHTML += `
      <li><a href="#${categoryId}">${category}</a>
        <ul>
          ${docs.map(doc => `<li><a href="#${doc.name}">${doc.name}</a></li>`).join('\n')}
        </ul>
      </li>
    `;

    contentHTML += `
      <section id="${categoryId}" class="category">
        <h2>${category}</h2>
        ${docs.map(doc => `
          <article id="${doc.name}" class="doc-item ${doc.deprecated ? 'deprecated' : ''}">
            <h3>
              <code>${doc.type} ${doc.name}</code>
              ${doc.deprecated ? '<span class="badge deprecated-badge">Deprecated</span>' : ''}
            </h3>

            ${doc.description ? `<p class="description">${escapeHTML(doc.description)}</p>` : ''}

            ${doc.params.length > 0 ? `
              <div class="section">
                <h4>Parameters</h4>
                <ul class="params">
                  ${doc.params.map(param => `<li><code>${escapeHTML(param)}</code></li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${doc.returns ? `
              <div class="section">
                <h4>Returns</h4>
                <p><code>${escapeHTML(doc.returns)}</code></p>
              </div>
            ` : ''}

            ${doc.examples.length > 0 ? `
              <div class="section">
                <h4>Examples</h4>
                ${doc.examples.map(ex => `<pre><code>${escapeHTML(ex)}</code></pre>`).join('')}
              </div>
            ` : ''}

            <div class="meta">
              <a href="../src/${doc.file}#L${doc.line}" target="_blank">View source (${doc.file}:${doc.line})</a>
            </div>
          </article>
        `).join('')}
      </section>
    `;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SK8 API Reference</title>
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
      background: #f5f5f5;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    header p {
      font-size: 1.2em;
      opacity: 0.9;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      gap: 30px;
      padding: 30px;
    }

    aside {
      flex: 0 0 250px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      height: fit-content;
      position: sticky;
      top: 20px;
    }

    aside h2 {
      font-size: 1.2em;
      margin-bottom: 15px;
      color: #667eea;
    }

    aside ul {
      list-style: none;
    }

    aside ul ul {
      margin-left: 15px;
      margin-top: 5px;
    }

    aside a {
      color: #333;
      text-decoration: none;
      display: block;
      padding: 5px 0;
      transition: color 0.2s;
    }

    aside a:hover {
      color: #667eea;
    }

    main {
      flex: 1;
      min-width: 0;
    }

    .category {
      background: white;
      padding: 30px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .category h2 {
      color: #667eea;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }

    .doc-item {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .doc-item:last-child {
      border-bottom: none;
    }

    .doc-item.deprecated {
      opacity: 0.7;
    }

    .doc-item h3 {
      font-size: 1.5em;
      margin-bottom: 10px;
      color: #333;
    }

    .doc-item code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }

    .description {
      margin: 15px 0;
      line-height: 1.8;
    }

    .section {
      margin: 20px 0;
    }

    .section h4 {
      color: #666;
      font-size: 1.1em;
      margin-bottom: 10px;
    }

    .params {
      list-style: none;
      margin-left: 20px;
    }

    .params li {
      margin: 5px 0;
    }

    .params li:before {
      content: "▸";
      color: #667eea;
      margin-right: 10px;
    }

    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 3px solid #667eea;
    }

    .meta {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #f0f0f0;
      font-size: 0.9em;
      color: #666;
    }

    .meta a {
      color: #667eea;
      text-decoration: none;
    }

    .meta a:hover {
      text-decoration: underline;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.7em;
      font-weight: bold;
      text-transform: uppercase;
      margin-left: 10px;
    }

    .deprecated-badge {
      background: #ff9800;
      color: white;
    }

    footer {
      text-align: center;
      padding: 20px;
      color: #666;
      background: white;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <header>
    <h1>SK8 API Reference</h1>
    <p>Complete API documentation for SK8 TypeScript</p>
  </header>

  <div class="container">
    <aside>
      <h2>Table of Contents</h2>
      <ul>
        ${tocHTML}
      </ul>
    </aside>

    <main>
      ${contentHTML}
    </main>
  </div>

  <footer>
    <p>Generated by SK8 Documentation Generator</p>
    <p>SK8 TypeScript Port © ${new Date().getFullYear()}</p>
  </footer>
</body>
</html>`;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Main documentation generation function
async function generateDocs() {
  console.log(chalk.bold.cyan('\n📚 SK8 Documentation Generator\n'));

  try {
    log.step('Finding TypeScript files...');
    const files = findTypeScriptFiles(config.srcDir);
    log.success(`Found ${files.length} TypeScript files`);

    log.step('Extracting documentation...');
    const allDocs = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const docs = extractJSDoc(content, file);

      if (docs.length > 0) {
        allDocs.push(...docs);
        if (config.verbose) {
          log.info(`${path.relative(config.srcDir, file)}: ${docs.length} items`);
        }
      }
    }

    log.success(`Extracted ${allDocs.length} documented items`);

    // Categorize by directory
    log.step('Organizing documentation...');
    const docsByCategory = {};

    for (const doc of allDocs) {
      const category = path.dirname(doc.file).split(path.sep)[0] || 'Core';
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

      if (!docsByCategory[categoryName]) {
        docsByCategory[categoryName] = [];
      }

      docsByCategory[categoryName].push(doc);
    }

    // Sort docs within each category
    Object.keys(docsByCategory).forEach(category => {
      docsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    log.success(`Organized into ${Object.keys(docsByCategory).length} categories`);

    // Generate HTML
    log.step('Generating HTML...');
    const html = generateHTML(docsByCategory);

    // Write output
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    const outputPath = path.join(config.outputDir, 'index.html');
    fs.writeFileSync(outputPath, html);

    log.success(`Documentation written to ${outputPath}`);

    // Generate summary
    const summaryPath = path.join(config.outputDir, 'summary.json');
    const summary = {
      generatedAt: new Date().toISOString(),
      totalItems: allDocs.length,
      categories: Object.fromEntries(
        Object.entries(docsByCategory).map(([cat, docs]) => [cat, docs.length])
      ),
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(chalk.bold.green('\n✨ Documentation generated successfully!\n'));
    console.log(chalk.gray('Summary:'));
    console.log(chalk.gray(`  Total items: ${allDocs.length}`));
    console.log(chalk.gray(`  Categories: ${Object.keys(docsByCategory).length}`));
    console.log(chalk.gray(`  Output: ${outputPath}\n`));
  } catch (error) {
    log.error(error.message);
    if (config.verbose) console.error(error);
    console.log(chalk.bold.red('\n❌ Documentation generation failed\n'));
    process.exit(1);
  }
}

// Run generator
generateDocs();
