#!/usr/bin/env bash

# Local CI script
# Runs the same checks as GitHub Actions CI locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   SK8 Local CI Suite                                      ║
║   Replicating GitHub Actions CI Locally                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Change to typescript directory
cd "$(dirname "$0")/../../typescript" || exit 1

# Track start time
START_TIME=$(date +%s)
FAILED_JOBS=()

# Function to print section
print_section() {
  echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN} $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"
}

# Function to print job
print_job() {
  echo -e "${BLUE}▶ JOB: $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
  FAILED_JOBS+=("$1")
}

# Function to check if npm modules are installed
check_deps() {
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
  fi
}

# Check dependencies
check_deps

# Job 1: Lint
print_section "Job 1: Lint"
print_job "Running ESLint on all TypeScript files"
if npm run lint; then
  print_success "Lint job passed"
else
  print_error "Lint job failed"
fi

# Job 2: Format Check
print_section "Job 2: Format Check"
print_job "Checking code formatting with Prettier"
if npm run format:check; then
  print_success "Format check job passed"
else
  print_error "Format check job failed"
fi

# Job 3: Type Check
print_section "Job 3: Type Check"
print_job "Running TypeScript compiler in check mode"
if npm run typecheck; then
  print_success "Type check job passed"
else
  print_error "Type check job failed"
fi

# Job 4: Test
print_section "Job 4: Test"
print_job "Running Jest test suite with coverage"
if npm run test:coverage; then
  print_success "Test job passed"

  # Show coverage summary
  if [ -f "coverage/coverage-summary.json" ]; then
    echo -e "\n${CYAN}Coverage Summary:${NC}"
    cat coverage/coverage-summary.json | jq -r '.total | "  Lines: \(.lines.pct)%\n  Statements: \(.statements.pct)%\n  Functions: \(.functions.pct)%\n  Branches: \(.branches.pct)%"'
  fi
else
  print_error "Test job failed"
fi

# Job 5: Build
print_section "Job 5: Build"
print_job "Building with TypeScript compiler"
if npm run build; then
  print_success "TypeScript build passed"
else
  print_error "TypeScript build failed"
fi

print_job "Building with Rollup"
if npx rollup -c; then
  print_success "Rollup build passed"
else
  print_error "Rollup build failed"
fi

print_job "Building with Webpack (production)"
if npx webpack --mode production; then
  print_success "Webpack build passed"
else
  print_error "Webpack build failed"
fi

# Job 6: Bundle Size Check
print_section "Job 6: Bundle Size Check"
print_job "Checking production bundle size"

if [ -f "dist/sk8.min.js" ]; then
  BUNDLE_SIZE=$(wc -c < dist/sk8.min.js)
  BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))
  GZIP_SIZE=$(gzip -c dist/sk8.min.js | wc -c)
  GZIP_SIZE_KB=$((GZIP_SIZE / 1024))

  echo -e "  ${CYAN}Bundle size:${NC} ${BUNDLE_SIZE_KB}KB"
  echo -e "  ${CYAN}Gzipped:${NC} ${GZIP_SIZE_KB}KB"

  MAX_SIZE=$((200 * 1024))
  if [ $GZIP_SIZE -gt $MAX_SIZE ]; then
    print_error "Bundle size check failed (${GZIP_SIZE_KB}KB > 200KB)"
  else
    print_success "Bundle size check passed"
  fi
else
  print_error "Bundle file not found"
fi

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED / 60))
SECONDS=$((ELAPSED % 60))

# Print summary
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} CI SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"

if [ ${#FAILED_JOBS[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ All CI jobs passed!${NC}"
  echo -e "${GREEN}Time elapsed: ${MINUTES}m ${SECONDS}s${NC}\n"
  exit 0
else
  echo -e "${RED}✗ ${#FAILED_JOBS[@]} job(s) failed:${NC}"
  for job in "${FAILED_JOBS[@]}"; do
    echo -e "${RED}  - $job${NC}"
  done
  echo -e "${YELLOW}Time elapsed: ${MINUTES}m ${SECONDS}s${NC}\n"
  exit 1
fi
