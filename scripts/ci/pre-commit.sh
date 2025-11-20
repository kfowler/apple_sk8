#!/usr/bin/env bash

# Pre-commit hook script
# Runs fast checks on staged files before allowing commit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running pre-commit checks...${NC}\n"

# Change to typescript directory
cd "$(dirname "$0")/../../typescript" || exit 1

# Get staged TypeScript files
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' | grep -v 'node_modules' || true)

if [ -z "$STAGED_TS_FILES" ]; then
  echo -e "${GREEN}No TypeScript files staged, skipping checks${NC}"
  exit 0
fi

echo -e "${YELLOW}Checking staged files:${NC}"
echo "$STAGED_TS_FILES" | sed 's/^/  - /'
echo ""

# Function to check if npm modules are installed
check_deps() {
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
  fi
}

# Check dependencies
check_deps

# 1. Lint staged files
echo -e "${YELLOW}1. Running ESLint on staged files...${NC}"
for file in $STAGED_TS_FILES; do
  if [ -f "$file" ]; then
    npx eslint "$file" || {
      echo -e "${RED}✗ Linting failed for $file${NC}"
      echo -e "${YELLOW}Run 'npm run lint:fix' to automatically fix issues${NC}"
      exit 1
    }
  fi
done
echo -e "${GREEN}✓ Linting passed${NC}\n"

# 2. Format check staged files
echo -e "${YELLOW}2. Checking code formatting...${NC}"
for file in $STAGED_TS_FILES; do
  if [ -f "$file" ]; then
    npx prettier --check "$file" || {
      echo -e "${RED}✗ Formatting check failed for $file${NC}"
      echo -e "${YELLOW}Run 'npm run format' to automatically format files${NC}"
      exit 1
    }
  fi
done
echo -e "${GREEN}✓ Formatting check passed${NC}\n"

# 3. Type check
echo -e "${YELLOW}3. Running TypeScript type check...${NC}"
npm run typecheck || {
  echo -e "${RED}✗ Type checking failed${NC}"
  echo -e "${YELLOW}Fix type errors before committing${NC}"
  exit 1
}
echo -e "${GREEN}✓ Type checking passed${NC}\n"

# 4. Run tests for affected files (quick test)
echo -e "${YELLOW}4. Running tests for affected files...${NC}"
npm run test -- --bail --findRelatedTests $STAGED_TS_FILES || {
  echo -e "${RED}✗ Tests failed${NC}"
  echo -e "${YELLOW}Fix failing tests before committing${NC}"
  exit 1
}
echo -e "${GREEN}✓ Tests passed${NC}\n"

echo -e "${GREEN}✓ All pre-commit checks passed!${NC}"
exit 0
