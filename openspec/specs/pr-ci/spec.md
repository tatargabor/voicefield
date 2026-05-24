# pr-ci Specification

## Purpose
TBD - created by archiving change dx-modernization. Update Purpose after archive.
## Requirements
### Requirement: PR gating workflow
A GitHub Actions workflow SHALL run on pull requests to main, executing build, lint, typecheck, and unit tests.

#### Scenario: PR opened
- **WHEN** a pull request is opened or updated targeting main
- **THEN** the CI workflow runs build, lint, typecheck, and test steps

#### Scenario: All checks pass
- **WHEN** all CI steps succeed
- **THEN** the PR is marked as passing checks

#### Scenario: Any check fails
- **WHEN** any CI step (build, lint, typecheck, or test) fails
- **THEN** the PR is blocked from merging with a visible failure

### Requirement: CI environment
The CI workflow SHALL use Node 22, pnpm 9, and Ubuntu latest, matching the existing deploy workflow.

#### Scenario: Consistent environment
- **WHEN** the CI workflow runs
- **THEN** it uses the same Node and pnpm versions as the deploy workflow

