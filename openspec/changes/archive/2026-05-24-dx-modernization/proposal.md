## Why

The voicefield codebase has solid architecture and working code, but zero developer tooling — no linter, no formatter, no test runner, no code review automation, and the CLAUDE.md lacks coding conventions. As the project matures and publishes to npm (@voicefield org), this gap will slow down contributions and make regressions harder to catch. Time to set up the 2026 baseline.

## What Changes

- Upgrade CLAUDE.md with coding conventions, security rules, and workflow guidance
- Add Claude Code `settings.json` with sensible permissions and hooks
- Configure Vitest for unit testing across packages
- Configure Playwright for e2e testing (QR → pair → transcript flow)
- Add ESLint flat config + Prettier for consistent code style
- Add a CI workflow for PRs (build + lint + typecheck + test)

## Capabilities

### New Capabilities
- `unit-testing`: Vitest runner for packages/core and packages/server with workspace config
- `e2e-testing`: Playwright tests for the full pairing flow via apps/example
- `code-linting`: ESLint flat config with TypeScript rules
- `code-formatting`: Prettier with consistent style enforcement
- `pr-ci`: GitHub Actions workflow that gates PRs on build+lint+typecheck+test
- `claude-code-config`: Permissions, hooks, and coding rules for Claude Code

### Modified Capabilities
<!-- No existing spec-level behavior changes — all new tooling capabilities -->

## Impact

- **Root config**: `package.json` (new scripts/devDeps), `eslint.config.js`, `.prettierrc`, `vitest.workspace.ts`
- **Claude Code**: `.claude/settings.json` (permissions, hooks), `CLAUDE.md` (expanded conventions)
- **CI**: `.github/workflows/ci.yml` (new PR-gating workflow)
- **Packages**: `packages/core/`, `packages/server/` get vitest configs + initial tests
- **E2E**: `apps/example/` gets playwright config + e2e tests
- **Publishing**: packages deploy to npm under `@voicefield` org (npmjs.com/settings/voicefield/packages), order: core → react/server
