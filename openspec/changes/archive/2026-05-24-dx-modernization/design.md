## Context

Voicefield is a pnpm + Turborepo monorepo with 3 packages (core, react, server) and 3 apps (web, example, phone). TypeScript strict mode, ES2022 target, no test/lint/format tooling exists. CI only deploys apps/web to Cloudflare Pages on push to main. Packages publish to npm under @voicefield org.

## Goals / Non-Goals

**Goals:**
- Zero-friction DX: `pnpm test`, `pnpm lint`, `pnpm format` work from root
- PR gating: no merge without passing build+lint+typecheck+test
- Claude Code is productive out of the box with clear rules and permissions
- Existing code passes all checks without modifications (warn-level for current violations)

**Non-Goals:**
- Achieving 100% test coverage (start with core utilities + server session lifecycle)
- Changing existing code style (Prettier config matches current conventions)
- Adding pre-commit hooks (keep the workflow fast and non-blocking for now)
- Modifying the existing deploy workflow

## Decisions

### Decision 1: Vitest over Jest
Vitest is the standard for ESM + TypeScript projects in 2026. Native ESM support, no transform config, shares vite ecosystem. Jest would require extensive transform configuration for this ESM-first codebase.

### Decision 2: ESLint flat config
Flat config (eslint.config.js) is the only supported format since ESLint v9. Using typescript-eslint v8+ with type-aware rules. Set `no-explicit-any` to warn since the codebase has some `any` usage that's acceptable in a v1.

### Decision 3: Prettier matches existing style
Analyzed the codebase: double quotes, no semicolons, 2-space indent. Prettier config will codify these so formatting is automated, not debated.

### Decision 4: Playwright for e2e over Cypress
Playwright is faster, lighter, better CI support, and the default for Next.js projects. E2e tests live in apps/example since that's the full-stack integration point (Next.js app with @voicefield/server routes).

### Decision 5: Separate CI workflow for PRs
Keep the existing deploy.yml untouched. New ci.yml triggers on PRs to main only. Steps: install → build → lint → typecheck → test. E2e tests excluded from CI initially (need Soniox API key for full flow).

### Decision 6: Claude Code permissions are conservative
Allow read-only commands (ls, find, grep, git status/log/diff) and build commands (pnpm build/test/lint/dev) by default. Destructive operations require user confirmation.

## Risks / Trade-offs

- [Prettier reformats] → Mitigated by matching existing style; may still touch trailing whitespace/newlines in some files. Run format once and commit the result.
- [ESLint warn-level for any] → Accept warnings for now; tighten to error when codebase is clean.
- [E2e tests need running server] → Playwright webServer config handles this; tests that need Soniox key are skipped in CI via env check.
