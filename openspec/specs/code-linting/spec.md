# code-linting Specification

## Purpose
TBD - created by archiving change dx-modernization. Update Purpose after archive.
## Requirements
### Requirement: ESLint flat config
The project SHALL use ESLint with flat config format (eslint.config.js) at the monorepo root, covering all TypeScript files in packages/ and apps/.

#### Scenario: Lint execution
- **WHEN** developer runs `pnpm lint` from the monorepo root
- **THEN** ESLint checks all .ts and .tsx files across the workspace

#### Scenario: TypeScript-aware rules
- **WHEN** ESLint runs
- **THEN** typescript-eslint rules are applied including no-unused-vars, no-explicit-any (warn), and consistent-type-imports

### Requirement: Lint passes on current codebase
The ESLint config SHALL be tuned so the existing codebase passes lint without changes (use warn level for rules the codebase currently violates).

#### Scenario: Clean lint on existing code
- **WHEN** `pnpm lint` is run on the current codebase without modifications
- **THEN** the lint exits with code 0 (no errors, warnings are acceptable)

