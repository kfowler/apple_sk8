# CI/CD Pipeline Documentation

This document provides comprehensive information about the SK8 TypeScript project's CI/CD pipeline, including workflows, local development setup, and best practices.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
  - [CI Workflow](#ci-workflow)
  - [Release Workflow](#release-workflow)
  - [Nightly Workflow](#nightly-workflow)
  - [Pull Request Workflow](#pull-request-workflow)
  - [Documentation Workflow](#documentation-workflow)
  - [Dependencies Workflow](#dependencies-workflow)
- [Local Development](#local-development)
- [Git Hooks](#git-hooks)
- [Secrets and Configuration](#secrets-and-configuration)
- [Debugging Failed Builds](#debugging-failed-builds)
- [Release Process](#release-process)
- [Best Practices](#best-practices)

## Overview

The SK8 TypeScript project uses GitHub Actions for continuous integration and deployment. Our CI/CD pipeline ensures code quality, runs comprehensive tests, and automates the release process.

### Key Features

- **Fast Feedback**: Main CI completes in under 5 minutes for typical changes
- **Comprehensive Testing**: Cross-platform testing on Node 16, 18, and 20
- **Automated Releases**: Tag-based releases with automated npm publishing
- **Bundle Size Monitoring**: Automatic bundle size checks (max 200KB gzipped)
- **Nightly Builds**: Extended test suites and performance benchmarks
- **Automated Dependency Updates**: Weekly dependency updates via Dependabot
- **Local CI Scripts**: Run CI checks locally before pushing

## Workflows

### CI Workflow

**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to `main`, `master`, `develop`, or `claude/**` branches
- Pull requests to `main`, `master`, or `develop`
- Manual dispatch

**Jobs**:

1. **Lint** (5 min)
   - Runs ESLint on all TypeScript files
   - Fast-fail job to catch obvious issues early

2. **Format Check** (5 min)
   - Verifies code formatting with Prettier
   - Fast-fail job

3. **Type Check** (5 min)
   - Runs TypeScript compiler in check mode
   - Fast-fail job

4. **Test** (15 min)
   - Runs Jest test suite with coverage
   - Matrix strategy: Node 16, 18, 20 × Ubuntu, Windows, macOS
   - Uploads coverage artifacts

5. **Build** (10 min)
   - Builds with TypeScript, Rollup, and Webpack
   - Verifies production build succeeds
   - Uploads build artifacts

6. **Bundle Size** (5 min)
   - Checks gzipped bundle size
   - Fails if exceeds 200KB

7. **Coverage** (5 min)
   - Uploads coverage to Codecov
   - Generates coverage reports

**Total Runtime**: ~5 minutes (parallelized jobs)

### Release Workflow

**File**: `.github/workflows/release.yml`

**Triggers**:
- Push of tags matching `v*.*.*` pattern (e.g., v1.0.0)
- Manual dispatch with version input

**Jobs**:

1. **Validate** (20 min)
   - Runs full CI validation suite
   - Ensures all tests pass before release

2. **Build Artifacts** (15 min)
   - Builds production bundles
   - Creates distribution packages (.tar.gz, .zip)

3. **Generate Changelog** (5 min)
   - Generates changelog from git commits
   - Includes commit messages since last tag

4. **Create Release** (10 min)
   - Creates GitHub release
   - Attaches distribution artifacts
   - Uses generated changelog

5. **Publish npm** (10 min)
   - Publishes to npm registry (if NPM_TOKEN configured)
   - Skipped if token not available

6. **Deploy Docs** (15 min)
   - Generates API documentation
   - Deploys to GitHub Pages

**Total Runtime**: ~30-45 minutes

### Nightly Workflow

**File**: `.github/workflows/nightly.yml`

**Triggers**:
- Scheduled: Daily at 2 AM UTC
- Manual dispatch

**Jobs**:

1. **Stress Tests** (30 min)
   - Extended test scenarios
   - Memory allocation tests
   - Repeated operations tests

2. **Performance Regression** (30 min)
   - Bundle size benchmarks
   - Module load time tests
   - Saves results as artifacts

3. **Memory Profiling** (30 min)
   - Long-running memory tests
   - Memory leak detection

4. **Security Audit** (15 min)
   - npm audit for vulnerabilities
   - Dependency security scanning
   - Generates security report

5. **Update Dependencies** (20 min)
   - Checks for outdated packages
   - Lists available updates

**Total Runtime**: ~2 hours

### Pull Request Workflow

**File**: `.github/workflows/pr.yml`

**Triggers**:
- Pull request opened, synchronized, or reopened

**Jobs**:

1. **Size Impact** (15 min)
   - Compares bundle size with base branch
   - Comments on PR with size changes
   - Warns if significant increase

2. **Performance Impact** (15 min)
   - Runs performance tests
   - Comments results on PR

3. **Coverage Change** (15 min)
   - Calculates coverage difference
   - Comments on PR with coverage status

4. **Conventional Commits** (5 min)
   - Validates commit message format
   - Ensures conventional commits standard

**Total Runtime**: ~10-15 minutes (parallelized)

### Documentation Workflow

**File**: `.github/workflows/docs.yml`

**Triggers**:
- Push to `main`/`master` (docs/** or *.md changes)
- Manual dispatch

**Jobs**:

1. **Build Docs** (15 min)
   - Generates API documentation
   - Copies markdown files
   - Creates HTML index pages

2. **Deploy** (10 min)
   - Deploys to GitHub Pages
   - Updates documentation site

**Total Runtime**: ~15 minutes

### Dependencies Workflow

**File**: `.github/workflows/dependencies.yml`

**Triggers**:
- Scheduled: Weekly on Monday at 9 AM UTC
- Manual dispatch

**Jobs**:

1. **Update Deps** (20 min)
   - Checks for dependency updates
   - Runs npm update
   - Fixes security vulnerabilities
   - Runs tests with updated deps
   - Creates PR if tests pass

**Total Runtime**: ~20 minutes

## Local Development

### Running CI Locally

We provide scripts to run CI checks locally before pushing:

#### Pre-Commit Checks

Fast checks on staged files:

```bash
./scripts/ci/pre-commit.sh
```

Runs:
- ESLint on staged files
- Prettier format check
- TypeScript type check
- Tests for affected files

**Runtime**: ~30 seconds to 2 minutes

#### Pre-Push Checks

Comprehensive checks before push:

```bash
./scripts/ci/pre-push.sh
```

Runs:
- Full ESLint check
- Full format check
- TypeScript type check
- Complete test suite
- Production build verification
- Bundle size check

**Runtime**: ~3-5 minutes

#### Full Local CI

Replicates GitHub Actions CI locally:

```bash
./scripts/ci/local-ci.sh
```

Runs all CI jobs:
- Lint
- Format check
- Type check
- Tests with coverage
- All builds (TypeScript, Rollup, Webpack)
- Bundle size check

**Runtime**: ~5-10 minutes

### Running Specific Checks

```bash
# In the typescript directory
cd typescript

# Lint
npm run lint

# Format check
npm run format:check

# Type check
npm run typecheck

# Tests
npm run test

# Tests with coverage
npm run test:coverage

# Build
npm run build

# Full validation
npm run validate
```

## Git Hooks

Git hooks are managed by Husky and automatically installed when you run `npm install`.

### Pre-Commit Hook

**Location**: `typescript/.husky/pre-commit`

Runs `lint-staged` which:
- Lints staged TypeScript files with ESLint (auto-fixes)
- Formats staged files with Prettier
- Runs tests for affected files

**When**: Before each commit

### Pre-Push Hook

**Location**: `typescript/.husky/pre-push`

Runs full validation:
- Type check
- Lint
- Format check
- Complete test suite

**When**: Before each push

### Commit Message Hook

**Location**: `typescript/.husky/commit-msg`

Validates commit messages follow conventional commits format:

```
<type>(<scope>): <subject>
```

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Examples**:
- `feat: add new shape rendering`
- `fix(canvas): resolve rendering issue`
- `docs: update API documentation`

**When**: During commit message creation

### Bypassing Hooks

**Not recommended**, but you can bypass hooks:

```bash
# Bypass pre-commit
git commit --no-verify

# Bypass pre-push
git push --no-verify
```

## Secrets and Configuration

### Required Secrets

Configure these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

#### NPM_TOKEN (Optional)
- **Purpose**: Publish packages to npm registry
- **How to get**: Generate at npmjs.com → Access Tokens
- **Scope**: Automation token with publish permission
- **Used in**: `release.yml`

#### CODECOV_TOKEN (Optional)
- **Purpose**: Upload coverage reports to Codecov
- **How to get**: Enable repository at codecov.io
- **Used in**: `ci.yml`

### Environment Variables

No custom environment variables required. All workflows use standard GitHub environment variables.

### Branch Protection

Recommended branch protection rules for `main`/`master`:

1. **Require status checks**:
   - CI Success
   - Lint
   - Format Check
   - Type Check
   - Test (all matrix jobs)

2. **Require pull request reviews**:
   - At least 1 approval

3. **Require linear history**: Enabled

4. **Require signed commits**: Optional but recommended

5. **Do not allow bypassing the above settings**: Enabled

Configure at: Repository Settings → Branches → Branch protection rules

## Debugging Failed Builds

### CI Failures

1. **Check the workflow run**:
   - Go to Actions tab in GitHub
   - Click on the failed workflow
   - Review failed job logs

2. **Reproduce locally**:
   ```bash
   # Run full CI suite
   ./scripts/ci/local-ci.sh

   # Or run specific check
   cd typescript
   npm run lint
   npm run test
   ```

3. **Common issues**:

   **Lint errors**:
   ```bash
   npm run lint:fix
   ```

   **Format errors**:
   ```bash
   npm run format
   ```

   **Type errors**:
   - Review TypeScript compiler output
   - Fix type errors in source code

   **Test failures**:
   - Review test output
   - Run tests locally: `npm run test`
   - Debug specific test: `npm run test -- test-name`

   **Build failures**:
   - Check build output
   - Ensure all dependencies installed: `npm ci`
   - Clear build cache: `npm run clean && npm run build`

### Bundle Size Failures

If bundle size exceeds 200KB gzipped:

1. **Analyze bundle**:
   ```bash
   cd typescript
   npx webpack --mode production --json > stats.json
   npx webpack-bundle-analyzer stats.json
   ```

2. **Common solutions**:
   - Remove unused dependencies
   - Use dynamic imports for large modules
   - Enable tree-shaking
   - Compress assets

3. **Update threshold**:
   - If size increase is justified, update threshold in `.github/workflows/ci.yml`

## Release Process

### Creating a Release

1. **Ensure main branch is stable**:
   ```bash
   git checkout main
   git pull origin main
   ./scripts/ci/local-ci.sh
   ```

2. **Update version in package.json**:
   ```bash
   cd typescript
   # Update version in package.json manually or use npm version
   npm version patch  # or minor, or major
   ```

3. **Create and push tag**:
   ```bash
   git add typescript/package.json
   git commit -m "chore: bump version to v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   ```

4. **Monitor release workflow**:
   - Go to Actions tab
   - Watch the Release workflow
   - Verify all jobs complete successfully

5. **Verify release**:
   - Check GitHub Releases page
   - Verify npm package (if published)
   - Check documentation deployment

### Release Types

**Patch Release** (v1.0.X):
- Bug fixes
- Documentation updates
- Minor improvements

**Minor Release** (v1.X.0):
- New features (backward compatible)
- Deprecations
- Significant improvements

**Major Release** (vX.0.0):
- Breaking changes
- Major new features
- API redesigns

### Pre-releases

For alpha/beta/rc versions:

```bash
npm version prerelease --preid=alpha
# Creates v1.0.0-alpha.0

git push origin main --tags
```

Pre-releases are marked as "pre-release" on GitHub.

## Best Practices

### Code Quality

1. **Always run local checks before pushing**:
   ```bash
   ./scripts/ci/pre-push.sh
   ```

2. **Write tests for new features**:
   - Aim for >80% coverage
   - Include unit and integration tests

3. **Follow conventional commits**:
   - Use proper commit message format
   - Include scope when applicable

4. **Keep bundle size in check**:
   - Monitor bundle size impact
   - Avoid unnecessary dependencies

### Pull Requests

1. **Keep PRs focused**:
   - One feature/fix per PR
   - Keep changes manageable

2. **Update documentation**:
   - Update README if needed
   - Add JSDoc comments

3. **Review CI feedback**:
   - Check bundle size impact
   - Review coverage changes
   - Address performance regressions

### Continuous Integration

1. **Fix broken builds immediately**:
   - Don't let CI stay red
   - Priority over new features

2. **Monitor nightly builds**:
   - Review performance trends
   - Address security vulnerabilities

3. **Keep dependencies updated**:
   - Review Dependabot PRs weekly
   - Test dependency updates locally

### Security

1. **Never commit secrets**:
   - Use GitHub secrets for tokens
   - Don't hardcode credentials

2. **Review security audits**:
   - Check nightly security reports
   - Update vulnerable dependencies

3. **Sign commits (optional)**:
   ```bash
   git config --global commit.gpgsign true
   ```

## Performance Metrics

### Target Metrics

- **CI Runtime**: < 5 minutes (typical PR)
- **Full Test Suite**: < 15 minutes
- **Bundle Size**: < 200KB gzipped
- **Test Coverage**: > 80%
- **Build Time**: < 2 minutes

### Monitoring

- **GitHub Actions**: View workflow runs in Actions tab
- **Codecov**: View coverage trends at codecov.io
- **npm**: View package stats at npmjs.com

## Troubleshooting

### Workflow Not Triggering

1. Check workflow file syntax: `yamllint .github/workflows/`
2. Verify trigger conditions match your branch/event
3. Check Actions permissions in repository settings

### Secrets Not Available

1. Verify secret name matches exactly (case-sensitive)
2. Check secret scope (repository/organization)
3. Ensure workflow has necessary permissions

### Hooks Not Running

1. Reinstall Husky:
   ```bash
   cd typescript
   npm install
   ```

2. Verify hook files are executable:
   ```bash
   chmod +x .husky/*
   ```

3. Check Git hooks are enabled:
   ```bash
   git config core.hooksPath
   ```

## Contributing to CI/CD

### Adding New Workflows

1. Create workflow file in `.github/workflows/`
2. Follow existing workflow patterns
3. Add documentation to this file
4. Test locally if possible

### Modifying Existing Workflows

1. Test changes in a feature branch
2. Create PR with CI changes
3. Monitor workflow runs
4. Update documentation

### Questions?

- Open an issue on GitHub
- Check Actions logs for errors
- Review workflow documentation

---

Last updated: 2025-11-20
