#!/usr/bin/env node

/**
 * Development Server for SK8 TypeScript
 *
 * Features:
 * - Hot reload with WebSocket
 * - Serves from typescript directory
 * - CORS headers for local development
 * - Live reload on file changes
 * - Configurable port
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const chokidar = require('chokidar');
const chalk = require('chalk');

// Configuration
const PORT = parseInt(process.env.PORT) || 8080;
const HOST = process.env.HOST || 'localhost';
const WATCH_DIRS = ['src', 'demo', 'dist'];

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ts': 'application/typescript',
};

// Logging utilities
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.error(chalk.red('✗'), msg),
  warn: (msg) => console.warn(chalk.yellow('⚠'), msg),
  request: (method, path, status) => {
    const color = status >= 200 && status < 300 ? chalk.green : status >= 400 ? chalk.red : chalk.yellow;
    console.log(`  ${chalk.gray(method.padEnd(6))} ${path.padEnd(40)} ${color(status)}`);
  },
};

// WebSocket clients for hot reload
const wsClients = new Set();

// Inject live reload script into HTML
const LIVE_RELOAD_SCRIPT = `
<script>
  (function() {
    const ws = new WebSocket('ws://${HOST}:${PORT}/__ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        console.log('[SK8 Dev Server] Reloading due to file change:', data.path);
        location.reload();
      }
    };
    ws.onclose = () => {
      console.log('[SK8 Dev Server] Connection lost, attempting to reconnect...');
      setTimeout(() => location.reload(), 1000);
    };
    console.log('[SK8 Dev Server] Live reload enabled');
  })();
</script>
`;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function injectLiveReload(html) {
  // Inject before closing body tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`);
  }
  return html + LIVE_RELOAD_SCRIPT;
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const mimeType = getMimeType(filePath);
    let content = data;

    // Inject live reload into HTML files
    if (mimeType === 'text/html') {
      content = injectLiveReload(data.toString('utf-8'));
    }

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(content);
  });
}

function findFile(urlPath, rootDir) {
  // Remove query string
  const cleanPath = urlPath.split('?')[0];

  // Try exact path
  let filePath = path.join(rootDir, cleanPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  // Try with index.html
  if (cleanPath === '/' || cleanPath === '') {
    const indexPath = path.join(rootDir, 'demo', 'index.html');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  // Try in demo directory
  filePath = path.join(rootDir, 'demo', cleanPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  // Try in dist directory
  filePath = path.join(rootDir, 'dist', cleanPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  return null;
}

function createServer(rootDir) {
  const server = http.createServer((req, res) => {
    const urlPath = req.url;

    // Handle WebSocket upgrade separately
    if (urlPath === '/__ws') {
      return;
    }

    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    // Find and serve file
    const filePath = findFile(urlPath, rootDir);

    if (filePath) {
      serveFile(filePath, res);
      log.request(req.method, urlPath, 200);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 Not Found</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .error {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 { color: #d32f2f; margin: 0; }
            p { color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>404 Not Found</h1>
            <p>The requested file was not found: ${urlPath}</p>
            <p><a href="/">Go to home</a></p>
          </div>
        </body>
        </html>
      `);
      log.request(req.method, urlPath, 404);
    }
  });

  return server;
}

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/__ws' });

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    log.info(`WebSocket client connected (${wsClients.size} total)`);

    ws.on('close', () => {
      wsClients.delete(ws);
      log.info(`WebSocket client disconnected (${wsClients.size} remaining)`);
    });
  });

  return wss;
}

function broadcastReload(changedPath) {
  const message = JSON.stringify({
    type: 'reload',
    path: changedPath,
    timestamp: Date.now(),
  });

  wsClients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });

  if (wsClients.size > 0) {
    log.info(`Broadcasted reload to ${wsClients.size} client(s)`);
  }
}

function setupFileWatcher(rootDir) {
  const watchPaths = WATCH_DIRS.map(dir => path.join(rootDir, dir)).filter(p => fs.existsSync(p));

  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(rootDir, filePath);
    log.info(`File changed: ${relativePath}`);
    broadcastReload(relativePath);
  });

  watcher.on('add', (filePath) => {
    const relativePath = path.relative(rootDir, filePath);
    log.info(`File added: ${relativePath}`);
    broadcastReload(relativePath);
  });

  return watcher;
}

async function startServer() {
  const rootDir = path.resolve(__dirname, '..');

  console.log(chalk.bold.cyan('\n🚀 SK8 Development Server\n'));

  const server = createServer(rootDir);
  const wss = setupWebSocket(server);
  const watcher = setupFileWatcher(rootDir);

  server.listen(PORT, HOST, () => {
    console.log(chalk.bold.green(`Server running at http://${HOST}:${PORT}/\n`));
    console.log(chalk.gray('Watching directories:'));
    WATCH_DIRS.forEach(dir => {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        console.log(chalk.gray(`  ✓ ${dir}/`));
      }
    });
    console.log();
    log.success('Live reload enabled');
    log.info('Press Ctrl+C to stop\n');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down gracefully...\n'));
    watcher.close();
    wss.close();
    server.close(() => {
      log.success('Server stopped');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((error) => {
  log.error('Failed to start server:');
  console.error(error);
  process.exit(1);
});
