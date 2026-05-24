## Context

Voicefield has 4 docs (architecture, deployment, security, troubleshooting), 4 package READMEs, and a root README with quick start. Missing: contributor guide, how-to recipes, and API error reference. The DX modernization added testing/linting but the docs don't reflect this yet.

## Goals / Non-Goals

**Goals:**
- A new contributor can set up dev, run tests, and submit a PR by reading CONTRIBUTING.md
- Users can find task-oriented guides for common integration patterns
- API errors are documented with exact shapes and status codes

**Non-Goals:**
- Rewriting existing docs (they're good)
- Video tutorials or interactive guides
- Translating docs to other languages

## Decisions

### Decision 1: CONTRIBUTING.md at root, not in docs/
Standard location that GitHub recognizes and links from "New Issue" and PR templates.

### Decision 2: docs/howto/ as flat files, not a docs site
Keep it simple — markdown files in a directory. No docusaurus/vitepress overhead for a project this size. Each howto is a standalone recipe: problem → solution → code.

### Decision 3: API reference as a single file
All endpoints in one file with request/response examples and error codes. Not auto-generated from OpenAPI (the openapi.yaml exists but the docs should be human-readable).
