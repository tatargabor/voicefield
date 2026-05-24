# Contributing to Voicefield

## Dev Setup

```bash
git clone https://github.com/tatargabor/voicefield.git
cd voicefield
pnpm install
pnpm build
```

### Running the example app

```bash
cp apps/example/.env.local.example apps/example/.env.local
# Add your SONIOX_API_KEY (free at https://soniox.com)
cd apps/example && pnpm dev
```

### Testing with a real phone

Phones need HTTPS for microphone access. Use ngrok:

```bash
ngrok http 3000
```

Open the ngrok URL in your desktop browser. Scan the QR with your phone.

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm build` | Build all packages (turbo, dependency order) |
| `pnpm test` | Run unit tests (vitest) |
| `pnpm lint` | Run eslint |
| `pnpm format` | Format with prettier |
| `pnpm format:check` | Check formatting |
| `pnpm dev` | Dev mode for all packages |

### Per-package

```bash
cd packages/core && pnpm build    # build one package
cd packages/core && pnpm test     # test one package
cd packages/core && pnpm lint     # lint one package
```

### E2E tests

```bash
cd apps/example && npx playwright test
```

## Branching & PRs

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes. Run checks:
   ```bash
   pnpm build && pnpm lint && pnpm test
   ```

3. Commit with a descriptive message:
   ```bash
   git commit -m "feat: add X to solve Y"
   ```

4. Push and open a PR against `main`. CI runs build + lint + test automatically.

### Commit message format

Use conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `chore:` — tooling, deps, CI
- `refactor:` — code change that doesn't fix a bug or add a feature

## Code Style

- **TypeScript strict mode** — no `@ts-ignore`, avoid `as any`
- **No semicolons**, double quotes, 2-space indent (enforced by prettier)
- **kebab-case** filenames, **camelCase** variables, **PascalCase** types/components
- **Use `type` imports** for type-only imports
- **No comments** unless the WHY is non-obvious
- **Empty catch blocks are OK** for fire-and-forget (network calls, stream cleanup)

Run `pnpm format` before committing — CI will reject unformatted code.

## Package Structure

```
packages/core    — shared types and utilities (zero deps)
packages/react   — React hook, QR popup, phone page (depends on core)
packages/server  — Next.js API handler, session management (depends on core)
apps/web         — voicefield.dev landing page (Vite SPA)
apps/example     — Next.js demo app
```

Build order matters: **core** must build before react/server. `pnpm build` handles this via turbo.

## Publishing

Packages publish to npm under `@voicefield` org. Order: core → react → server.

```bash
cd packages/core && pnpm publish --access public
cd packages/react && pnpm publish --access public
cd packages/server && pnpm publish --access public
```

Always use `pnpm publish` (not `npm`) — it resolves `workspace:^` dependencies.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the system design. Key principles:

- Audio never leaves the phone
- Server is a relay (text only, in-memory, no persistence)
- Sessions are ephemeral (30-min TTL, 24h hard max)

## Questions?

Open an issue at https://github.com/tatargabor/voicefield/issues.
