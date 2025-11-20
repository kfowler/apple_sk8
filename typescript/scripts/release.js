#!/usr/bin/env node

/**
 * Release Script for SK8 TypeScript
 *
 * Features:
 * - Version bump (major/minor/patch)
 * - Update CHANGELOG.md
 * - Git tag creation
 * - Build and test
 * - Prompt for npm publish
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');

// Configuration
const config = {
  bumpType: process.argv[2] || 'patch',
  skipTests: process.argv.includes('--skip-tests'),
  skipBuild: process.argv.includes('--skip-build'),
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

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
    default:
      // Assume it's a specific version
      return type;
  }

  return parts.join('.');
}

function checkGitStatus() {
  log.step('Checking git status...');

  try {
    const status = exec('git status --porcelain');
    if (status.trim() && !config.dryRun) {
      log.error('Working directory is not clean. Commit or stash changes first.');
      process.exit(1);
    }

    // Check if on a branch
    const branch = exec('git rev-parse --abbrev-ref HEAD').trim();
    log.info(`Current branch: ${branch}`);

    // Check if up to date with remote
    exec('git fetch');
    const behind = exec('git rev-list HEAD..@{u} --count').trim();
    const ahead = exec('git rev-list @{u}..HEAD --count').trim();

    if (behind !== '0') {
      log.warn(`Branch is ${behind} commit(s) behind remote`);
    }
    if (ahead !== '0') {
      log.info(`Branch is ${ahead} commit(s) ahead of remote`);
    }

    log.success('Git status checked');
  } catch (error) {
    log.warn('Could not verify git status');
  }
}

function updateVersion(newVersion) {
  log.step('Updating version...');

  const packagePath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const oldVersion = packageJson.version;

  packageJson.version = newVersion;

  if (!config.dryRun) {
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  log.success(`Version updated: ${oldVersion} → ${newVersion}`);
  return oldVersion;
}

function updateChangelog(newVersion, oldVersion) {
  log.step('Updating CHANGELOG...');

  const changelogPath = path.resolve(__dirname, '../CHANGELOG.md');
  let changelog = '';

  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, 'utf-8');
  } else {
    changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }

  const date = new Date().toISOString().split('T')[0];
  const newEntry = `## [${newVersion}] - ${date}

### Added
-

### Changed
-

### Fixed
-

`;

  // Insert new entry after the header
  const lines = changelog.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## [')) || 3;

  lines.splice(insertIndex, 0, newEntry);
  const updatedChangelog = lines.join('\n');

  if (!config.dryRun) {
    fs.writeFileSync(changelogPath, updatedChangelog);
  }

  log.success('CHANGELOG updated (please edit manually before committing)');
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

async function buildProject() {
  if (config.skipBuild) {
    log.info('Skipping build');
    return;
  }

  log.step('Building project...');
  try {
    exec('npm run build', { cwd: path.resolve(__dirname, '..') });
    log.success('Build completed');
  } catch (error) {
    log.error('Build failed');
    throw error;
  }
}

async function createGitTag(version) {
  log.step('Creating git commit and tag...');

  if (config.dryRun) {
    log.info('[DRY RUN] Would create commit and tag v' + version);
    return;
  }

  try {
    exec('git add package.json CHANGELOG.md');
    exec(`git commit -m "Release v${version}"`);
    exec(`git tag -a v${version} -m "Release v${version}"`);
    log.success(`Created commit and tag v${version}`);
  } catch (error) {
    log.error('Failed to create git commit/tag');
    throw error;
  }
}

async function pushToRemote() {
  log.step('Pushing to remote...');

  if (config.dryRun) {
    log.info('[DRY RUN] Would push commits and tags to remote');
    return;
  }

  const answer = await prompt(chalk.yellow('Push to remote? (y/N): '));

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    try {
      exec('git push');
      exec('git push --tags');
      log.success('Pushed to remote');
    } catch (error) {
      log.error('Failed to push to remote');
      throw error;
    }
  } else {
    log.info('Skipped push to remote');
  }
}

async function publishToNpm() {
  log.step('Publishing to npm...');

  if (config.dryRun) {
    log.info('[DRY RUN] Would publish to npm');
    return;
  }

  const answer = await prompt(chalk.yellow('Publish to npm? (y/N): '));

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    try {
      // Check npm login
      try {
        exec('npm whoami');
      } catch {
        log.error('Not logged in to npm. Run: npm login');
        return;
      }

      // Publish
      exec('npm publish', { cwd: path.resolve(__dirname, '..') });
      log.success('Published to npm');
    } catch (error) {
      log.error('Failed to publish to npm');
      throw error;
    }
  } else {
    log.info('Skipped npm publish');
  }
}

async function release() {
  const startTime = Date.now();

  console.log(chalk.bold.cyan('\n🚀 SK8 Release Script\n'));

  if (!['major', 'minor', 'patch'].includes(config.bumpType) && !config.bumpType.match(/^\d+\.\d+\.\d+$/)) {
    log.error(`Invalid version bump type: ${config.bumpType}`);
    console.log('\nUsage: npm run release [major|minor|patch|x.y.z] [options]');
    console.log('\nOptions:');
    console.log('  --skip-tests   Skip running tests');
    console.log('  --skip-build   Skip building the project');
    console.log('  --dry-run      Show what would be done without making changes');
    console.log('  --verbose      Show detailed output');
    console.log('\nExamples:');
    console.log('  npm run release patch');
    console.log('  npm run release minor');
    console.log('  npm run release 1.2.3');
    console.log('  npm run release patch --dry-run');
    process.exit(1);
  }

  if (config.dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  try {
    checkGitStatus();

    // Get current version
    const packagePath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const currentVersion = packageJson.version;
    const newVersion = bumpVersion(currentVersion, config.bumpType);

    console.log(chalk.bold(`\nVersion: ${chalk.cyan(currentVersion)} → ${chalk.green(newVersion)}\n`));

    const confirmAnswer = await prompt(chalk.yellow('Continue with release? (y/N): '));
    if (confirmAnswer.toLowerCase() !== 'y' && confirmAnswer.toLowerCase() !== 'yes') {
      log.info('Release cancelled');
      process.exit(0);
    }

    await runTests();
    await buildProject();

    const oldVersion = updateVersion(newVersion);
    updateChangelog(newVersion, oldVersion);

    await createGitTag(newVersion);
    await pushToRemote();
    await publishToNpm();

    const duration = Date.now() - startTime;
    console.log(chalk.bold.green(`\n✨ Release completed successfully in ${duration}ms!\n`));

    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. Edit CHANGELOG.md with release details'));
    console.log(chalk.gray('  2. Create a GitHub release from the tag'));
    console.log(chalk.gray('  3. Announce the release\n'));
  } catch (error) {
    log.error('Release failed');
    if (config.verbose) console.error(error);
    console.log(chalk.bold.red('\n❌ Release aborted\n'));
    process.exit(1);
  }
}

// Run release
release();
