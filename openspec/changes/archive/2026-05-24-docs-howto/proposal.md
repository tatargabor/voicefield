## Why

The project has solid reference docs (architecture, deployment, security, troubleshooting) and package READMEs, but lacks contributor docs, recipe-style how-to guides, and an API error reference. New contributors don't know how to set up dev, run tests, or submit PRs. Users don't have task-oriented guides for common integration patterns.

## What Changes

- Add CONTRIBUTING.md with dev setup, branching, PR process, code style
- Add docs/howto/ directory with recipe guides for common tasks
- Add docs/api-reference.md with all endpoints, request/response shapes, and error codes
- Update root README.md with test/lint commands and contributing link
- Update apps/example/README.md with current file structure

## Capabilities

### New Capabilities
- `contributor-guide`: CONTRIBUTING.md with dev setup, workflow, and code conventions
- `howto-guides`: Recipe-style docs for common integration patterns
- `api-error-reference`: Complete API endpoint reference with error shapes

### Modified Capabilities
<!-- No spec-level behavior changes -->

## Impact

- Root: `CONTRIBUTING.md`, `README.md` (updated)
- `docs/`: `api-reference.md`, `howto/` directory with guides
- `apps/example/README.md` (updated)
