# code-formatting Specification

## Purpose
TBD - created by archiving change dx-modernization. Update Purpose after archive.
## Requirements
### Requirement: Prettier configuration
The project SHALL use Prettier for code formatting with a config at the monorepo root.

#### Scenario: Format check
- **WHEN** developer runs `pnpm format:check` from the monorepo root
- **THEN** Prettier checks all source files and reports unformatted ones

#### Scenario: Format fix
- **WHEN** developer runs `pnpm format` from the monorepo root
- **THEN** Prettier formats all source files in place

### Requirement: Style settings
The Prettier config SHALL use double quotes, no semicolons, 2-space indentation, and 100 char print width to match the existing codebase conventions.

#### Scenario: Consistent style
- **WHEN** a new .ts or .tsx file is formatted by Prettier
- **THEN** it uses double quotes, no semicolons, 2-space indent, and wraps at 100 characters

