# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
pnpm install          # install all workspace deps
pnpm build            # build all packages (turbo, respects dependency order)
pnpm dev              # run all packages in watch/dev mode

# Single package
cd packages/core && pnpm build
cd packages/react && pnpm build
cd packages/server && pnpm build

# Example app (Next.js)
cd apps/example && pnpm dev    # works without API key (Web Speech API fallback)

# Phone testing requires HTTPS — use ngrok:
ngrok http 3000                # then open the ngrok HTTPS URL on desktop

# Web/landing (Vite SPA, deployed to Cloudflare Pages)
cd apps/web && pnpm dev
```

## Testing

```bash
pnpm test             # run unit tests (vitest) across all packages
pnpm lint             # run eslint across all packages
pnpm format           # format code with prettier
pnpm format:check     # check formatting without writing

# E2E tests (requires apps/example with .env.local)
cd apps/example && npx playwright test
```

- Unit tests: Vitest, located in `packages/*/src/__tests__/*.test.ts`
- E2E tests: Playwright, located in `apps/example/e2e/*.spec.ts`
- Run `pnpm test` and `pnpm lint` before committing

## Publishing

```bash
./scripts/publish.sh patch   # bump + build + publish + tag + GitHub release
./scripts/publish.sh minor
./scripts/publish.sh major
./scripts/publish.sh --dry-run patch  # preview only
```

Lockstep versioning — all packages share the same version. Script handles order (core → react → server).
Packages publish to npm under `@voicefield` org.

## Running the Demo

To test with a real phone (mic requires HTTPS):

```bash
pnpm install && pnpm build
cd apps/example && pnpm dev          # Terminal 1: starts on http://localhost:3000
ngrok http 3000                      # Terminal 2: creates HTTPS tunnel
# Open the ngrok URL (https://xxx.ngrok-free.app) on DESKTOP browser
# Scan the QR code with your phone — speak — text appears in the field
```

Desktop-only testing (no phone, no ngrok needed):

```bash
cd apps/example && pnpm dev
# Open http://localhost:3000 — the mic button uses the desktop's own microphone
```

## Coding Conventions

- **TypeScript strict mode** — no `// @ts-ignore`, no `as any` unless truly unavoidable
- **ESM only** — all packages use `"type": "module"`
- **No semicolons**, double quotes, 2-space indent, 100 char print width (enforced by Prettier)
- **kebab-case** filenames (`use-voicefield.ts`, `phone-page.tsx`)
- **camelCase** variables and functions, **PascalCase** types/interfaces/components
- **Use `type` imports** for type-only imports (`import type { Foo } from ...`)
- **Functional style** — prefer functions over classes, no inheritance
- **No default exports** except for React pages/components that require them (Next.js pages)
- **Empty catch blocks are OK** for fire-and-forget operations (network calls, stream cleanup)
- **No comments** unless the WHY is non-obvious — no TODOs, no commented-out code

## Security Rules

- **Never log secrets** — session tokens, API keys, pairing secrets must never appear in logs
- **Never commit `.env` files** — use `.env.local` for local dev
- **Validate at boundaries** — all handler inputs are validated in `packages/server/src/handler.ts`
- **Audio never leaves the phone** — STT runs client-side, relay only sees text. Do not change this.
- **CORS is configurable** — never hardcode permissive CORS in the library packages

## Architecture

Voicefield turns a phone into a wireless microphone for any web form. The data flow:

1. **Desktop browser** (`@voicefield/react`) creates a session via the relay server, shows a QR code
2. **Phone browser** scans QR, pairs with session, runs STT client-side (Soniox SDK in browser)
3. **Phone** POSTs transcripts to the relay server (only text, no audio)
4. **Relay server** (`@voicefield/server`) pushes transcripts to desktop via SSE

### Monorepo layout (pnpm workspaces + Turborepo)

- `packages/core` — shared types and pairing utilities (zero deps, used by all other packages)
- `packages/react` — `useVoicefield` hook, `QRPopup` component, phone page (`/phone` export), field registry
- `packages/server` — Next.js API route handler (`createVoicefieldHandler`), in-memory session store
- `apps/web` — voicefield.dev static SPA (landing page + hosted phone page), Vite + React Router
- `apps/example` — Next.js demo app showing integration
- `apps/phone` — standalone phone page (older, mostly superseded by `apps/web`)

### Key design decisions

- **Audio never leaves the phone** — STT runs client-side, relay only sees text
- **Sessions are in-memory** — no database, 30-min sliding TTL, 24h hard max
- **Cryptographic pairing** — 256-bit secret in QR, 384-bit session token, single-use 6-digit code
- **Local dev without HTTPS** — desktop-only mic works via LAN IP auto-detection; phone mic requires HTTPS (use `ngrok http 3000`)
- **Production uses voicefield.dev** — phone page loads from static hosted SPA, API calls go to customer's server

### Server API routes (all under `[...voicefield]` catch-all)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/session` | none | Create session, returns pairingCode + secret |
| POST | `/pair` | code+secret | Phone pairs, gets sessionToken + STT key |
| POST | `/transcript` | Bearer token | Phone sends text/recording state |
| GET | `/transcript?sessionId=` | none | Desktop SSE stream |
| POST | `/session/end` | sessionId | End session |
| POST | `/command` | sessionId | Desktop sends commands to phone (e.g. switch_field) |
| POST | `/refresh-key` | Bearer token | Phone refreshes expired STT key |
| GET | `/status` | Bearer token | Phone polls session state |
| GET | `/network-info` | none | Returns LAN IPs for local QR generation |

### React package internals

- `useVoicefield` — main hook: manages session lifecycle, SSE subscription, field injection
- `FieldRegistry` — tracks registered input elements, handles partial/final text injection
- `QRPopup` — renders QR code with pairing URL
- `phone-page.tsx` — full phone UI exported as `@voicefield/react/phone`

## Deployment

- **CI (PRs)**: GitHub Actions on pull request → build + lint + typecheck + test
- **CD (deploy)**: GitHub Actions on push to main → builds all → deploys `apps/web/dist` to Cloudflare Pages via Wrangler
- **Node**: 22, **pnpm**: 9.15, **TypeScript**: ES2022 target, bundler moduleResolution
