#!/usr/bin/env node
/**
 * Performance Profiling Tool
 *
 * Profiles SK8 TypeScript performance and generates reports
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * Profile configuration
 */
const config = {
  duration: 10000, // 10 seconds
  outputFile: 'performance-report.html',
  generateFlamegraph: true,
};

/**
 * Profiling data
 */
const profileData = {
  rendering: [],
  animation: [],
  sk8script: [],
  events: [],
  timestamps: [],
};

/**
 * Start profiling
 */
function startProfiling() {
  console.log('Starting performance profiling...');
  console.log(`Duration: ${config.duration}ms`);
  console.log('');

  // Simulate profiling (in a real implementation, this would instrument the code)
  const startTime = performance.now();
  const interval = 100; // Sample every 100ms

  const timer = setInterval(() => {
    const elapsed = performance.now() - startTime;

    // Sample metrics (mock data for demonstration)
    profileData.rendering.push({
      time: elapsed,
      duration: 10 + Math.random() * 5,
      actorCount: Math.floor(100 + Math.random() * 50),
    });

    profileData.animation.push({
      time: elapsed,
      duration: 2 + Math.random() * 3,
      animationCount: Math.floor(20 + Math.random() * 10),
    });

    profileData.sk8script.push({
      time: elapsed,
      duration: 1 + Math.random() * 2,
      evaluations: Math.floor(50 + Math.random() * 30),
    });

    profileData.events.push({
      time: elapsed,
      duration: 0.5 + Math.random() * 1,
      eventCount: Math.floor(5 + Math.random() * 5),
    });

    profileData.timestamps.push(elapsed);

    if (elapsed >= config.duration) {
      clearInterval(timer);
      generateReport();
    }
  }, interval);
}

/**
 * Generate HTML report
 */
function generateReport() {
  console.log('Generating performance report...');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SK8 Performance Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 10px;
    }
    h2 {
      color: #666;
      margin-top: 30px;
    }
    .chart-container {
      position: relative;
      height: 400px;
      margin: 20px 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
      text-transform: uppercase;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #4CAF50;
    }
    .stat-card .label {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .summary {
      background: #e8f5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary h3 {
      margin-top: 0;
      color: #2e7d32;
    }
    .summary ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .summary li {
      margin: 5px 0;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>SK8 TypeScript Performance Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Profile Duration: ${config.duration}ms</p>

    <div class="summary">
      <h3>Summary</h3>
      <ul>
        <li>Total samples: ${profileData.timestamps.length}</li>
        <li>Average rendering time: ${average(profileData.rendering.map(d => d.duration)).toFixed(2)}ms</li>
        <li>Average animation time: ${average(profileData.animation.map(d => d.duration)).toFixed(2)}ms</li>
        <li>Average SK8Script time: ${average(profileData.sk8script.map(d => d.duration)).toFixed(2)}ms</li>
        <li>Average event handling time: ${average(profileData.events.map(d => d.duration)).toFixed(2)}ms</li>
      </ul>
    </div>

    <div class="stats">
      <div class="stat-card">
        <h3>Rendering</h3>
        <div class="value">${average(profileData.rendering.map(d => d.duration)).toFixed(2)}</div>
        <div class="label">Average time (ms)</div>
      </div>
      <div class="stat-card">
        <h3>Animation</h3>
        <div class="value">${average(profileData.animation.map(d => d.duration)).toFixed(2)}</div>
        <div class="label">Average time (ms)</div>
      </div>
      <div class="stat-card">
        <h3>SK8Script</h3>
        <div class="value">${average(profileData.sk8script.map(d => d.duration)).toFixed(2)}</div>
        <div class="label">Average time (ms)</div>
      </div>
      <div class="stat-card">
        <h3>Events</h3>
        <div class="value">${average(profileData.events.map(d => d.duration)).toFixed(2)}</div>
        <div class="label">Average time (ms)</div>
      </div>
    </div>

    <h2>Rendering Performance</h2>
    <div class="chart-container">
      <canvas id="renderingChart"></canvas>
    </div>

    <h2>Animation Performance</h2>
    <div class="chart-container">
      <canvas id="animationChart"></canvas>
    </div>

    <h2>SK8Script Performance</h2>
    <div class="chart-container">
      <canvas id="sk8scriptChart"></canvas>
    </div>

    <h2>Event Handling Performance</h2>
    <div class="chart-container">
      <canvas id="eventsChart"></canvas>
    </div>

    ${config.generateFlamegraph ? generateFlamegraphHTML() : ''}
  </div>

  <script>
    const timestamps = ${JSON.stringify(profileData.timestamps)};

    // Rendering chart
    new Chart(document.getElementById('renderingChart'), {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Render Time (ms)',
          data: ${JSON.stringify(profileData.rendering.map(d => d.duration))},
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        }, {
          label: 'Actor Count',
          data: ${JSON.stringify(profileData.rendering.map(d => d.actorCount))},
          borderColor: 'rgb(33, 150, 243)',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Time (ms)' }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: { display: true, text: 'Actor Count' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });

    // Animation chart
    new Chart(document.getElementById('animationChart'), {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Animation Time (ms)',
          data: ${JSON.stringify(profileData.animation.map(d => d.duration))},
          borderColor: 'rgb(255, 152, 0)',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });

    // SK8Script chart
    new Chart(document.getElementById('sk8scriptChart'), {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Evaluation Time (ms)',
          data: ${JSON.stringify(profileData.sk8script.map(d => d.duration))},
          borderColor: 'rgb(156, 39, 176)',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });

    // Events chart
    new Chart(document.getElementById('eventsChart'), {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Event Time (ms)',
          data: ${JSON.stringify(profileData.events.map(d => d.duration))},
          borderColor: 'rgb(233, 30, 99)',
          backgroundColor: 'rgba(233, 30, 99, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(config.outputFile, html);
  console.log(`Report generated: ${config.outputFile}`);
  console.log('Open the file in a browser to view the report.');
}

/**
 * Generate flamegraph HTML
 */
function generateFlamegraphHTML() {
  return `
    <h2>Flamegraph</h2>
    <p>Note: Flamegraph generation requires instrumentation at runtime.</p>
    <p>Use browser DevTools Performance profiler for detailed flamegraphs.</p>
  `;
}

/**
 * Calculate average
 */
function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Main
 */
if (require.main === module) {
  console.log('SK8 TypeScript Performance Profiler');
  console.log('====================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  args.forEach(arg => {
    if (arg.startsWith('--duration=')) {
      config.duration = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      config.outputFile = arg.split('=')[1];
    } else if (arg === '--no-flamegraph') {
      config.generateFlamegraph = false;
    }
  });

  startProfiling();
}

module.exports = { startProfiling, generateReport };
