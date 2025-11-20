#!/usr/bin/env bash

# Pre-push hook script
# Runs comprehensive checks before allowing push

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Running Pre-Push CI Checks         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}\n"

# Change to typescript directory
cd "$(dirname "$0")/../../typescript" || exit 1

# Track start time
START_TIME=$(date +%s)

# Function to check if npm modules are installed
check_deps() {
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
  fi
}

# Function to print step
print_step() {
  echo -e "\n${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check dependencies
check_deps

# 1. Full lint
print_step "Step 1/5: Running full ESLint check"
npm run lint || {
  print_error "Linting failed"
  echo -e "${YELLOW}Run 'npm run lint:fix' to fix automatically${NC}"
  exit 1
}
print_success "Linting passed"

# 2. Format check
print_step "Step 2/5: Checking code formatting"
npm run format:check || {
  print_error "Formatting check failed"
  echo -e "${YELLOW}Run 'npm run format' to format code${NC}"
  exit 1
}
print_success "Formatting check passed"

# 3. Type check
print_step "Step 3/5: Running TypeScript type check"
npm run typecheck || {
  print_error "Type checking failed"
  exit 1
}
print_success "Type checking passed"

# 4. Full test suite
print_step "Step 4/5: Running full test suite"
npm run test || {
  print_error "Tests failed"
  exit 1
}
print_success "All tests passed"

# 5. Build verification
print_step "Step 5/5: Verifying production build"
npm run build || {
  print_error "Build failed"
  exit 1
}
print_success "Build successful"

# 6. Bundle size check
print_step "Bonus: Checking bundle size"
npx webpack --mode production > /dev/null 2>&1 || {
  print_error "Production build failed"
  exit 1
}

if [ -f "dist/sk8.min.js" ]; then
  BUNDLE_SIZE=$(wc -c < dist/sk8.min.js)
  BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))
  GZIP_SIZE=$(gzip -c dist/sk8.min.js | wc -c)
  GZIP_SIZE_KB=$((GZIP_SIZE / 1024))

  echo -e "  Bundle size: ${BUNDLE_SIZE_KB}KB"
  echo -e "  Gzipped: ${GZIP_SIZE_KB}KB"

  MAX_SIZE=$((200 * 1024))
  if [ $GZIP_SIZE -gt $MAX_SIZE ]; then
    print_error "Bundle size (${GZIP_SIZE_KB}KB) exceeds maximum (200KB)"
    exit 1
  fi
  print_success "Bundle size OK"
fi

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   All Pre-Push Checks Passed! ✓      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo -e "${GREEN}Time elapsed: ${ELAPSED}s${NC}\n"

exit 0
