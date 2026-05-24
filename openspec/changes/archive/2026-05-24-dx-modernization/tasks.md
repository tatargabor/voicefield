## 1. Code Formatting (Prettier)

- [x] 1.1 Install prettier as root devDependency
- [x] 1.2 Create .prettierrc with project style (double quotes, no semis, 2-space, 100 width)
- [x] 1.3 Create .prettierignore (dist, node_modules, .next, pnpm-lock.yaml)
- [x] 1.4 Add format and format:check scripts to root package.json
- [x] 1.5 Run prettier on entire codebase and commit the result

## 2. Code Linting (ESLint)

- [x] 2.1 Install eslint, typescript-eslint, eslint-config-prettier as root devDeps
- [x] 2.2 Create eslint.config.js with flat config, TypeScript rules, prettier compat
- [x] 2.3 Add lint script to root package.json (via turbo) and per-package
- [x] 2.4 Fix any lint errors (not warnings) in existing code
- [x] 2.5 Verify `pnpm lint` exits 0

## 3. Unit Testing (Vitest)

- [x] 3.1 Install vitest as root devDependency
- [x] 3.2 Create vitest.workspace.ts at monorepo root
- [x] 3.3 Add vitest.config.ts to packages/core
- [x] 3.4 Add vitest.config.ts to packages/server
- [x] 3.5 Write unit tests for packages/core pairing utilities
- [x] 3.6 Write unit tests for packages/server session lifecycle
- [x] 3.7 Add test scripts to root and per-package package.json
- [x] 3.8 Verify `pnpm test` passes

## 4. E2E Testing (Playwright)

- [x] 4.1 Install @playwright/test in apps/example
- [x] 4.2 Create playwright.config.ts in apps/example with webServer config
- [x] 4.3 Write e2e test for session creation and QR display
- [x] 4.4 Write e2e test for API-level pairing flow
- [x] 4.5 Write e2e test for transcript relay via SSE
- [x] 4.6 Add e2e script to apps/example package.json

## 5. PR CI Workflow

- [x] 5.1 Create .github/workflows/ci.yml with build+lint+typecheck+test on PRs
- [x] 5.2 Verify workflow syntax is valid

## 6. Claude Code Configuration

- [x] 6.1 Create .claude/settings.json with allowed permissions
- [x] 6.2 Update CLAUDE.md with coding conventions, test/lint commands, security rules
