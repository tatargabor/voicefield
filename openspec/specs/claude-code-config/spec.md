# claude-code-config Specification

## Purpose
TBD - created by archiving change dx-modernization. Update Purpose after archive.
## Requirements
### Requirement: Claude Code settings.json
The project SHALL have a `.claude/settings.json` with allowed tool permissions for common read-only and build operations.

#### Scenario: Common commands allowed
- **WHEN** Claude Code runs pnpm build, pnpm test, pnpm lint, or git status
- **THEN** these execute without permission prompts

### Requirement: CLAUDE.md coding conventions
The CLAUDE.md SHALL include coding conventions covering: TypeScript strict mode, naming conventions (kebab-case files, camelCase variables), import style, error handling approach, and security guidelines.

#### Scenario: New contributor reads CLAUDE.md
- **WHEN** a developer (or Claude Code) reads CLAUDE.md
- **THEN** they find clear guidance on code style, conventions, test commands, and security rules

### Requirement: CLAUDE.md test and lint commands
The CLAUDE.md SHALL document how to run tests (`pnpm test`), linting (`pnpm lint`), and formatting (`pnpm format`).

#### Scenario: Developer wants to run tests
- **WHEN** a developer checks CLAUDE.md for test commands
- **THEN** they find `pnpm test`, `pnpm lint`, `pnpm format`, and `pnpm e2e` with descriptions

