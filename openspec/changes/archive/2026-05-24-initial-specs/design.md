## Overview

This is a bootstrap change — no new code, just formalizing existing behavior into specs. The design captures the current architecture as-is.

## Architecture

Voicefield is a 3-tier system:

1. **Desktop browser** — React app using `useVoicefield` hook, renders QR, subscribes to SSE
2. **Phone browser** — Standalone SPA (`Mic` component), runs client-side STT via Soniox, POSTs text
3. **Relay server** — Next.js API route handler, in-memory session store, bridges phone→desktop via SSE

Data flow: Phone captures audio → Soniox STT (client-side) → transcript text → HTTP POST to relay → SSE push to desktop → inject into form field.

Audio never leaves the phone. Only text traverses the network.

## Component Mapping

| Capability | Package | Key Files |
|-----------|---------|-----------|
| session-management | `@voicefield/server` | `session.ts` |
| pairing | `@voicefield/core` + `server` | `pairing.ts`, `handler.ts` (POST /pair) |
| transcript-relay | `@voicefield/server` | `handler.ts` (POST/GET /transcript) |
| phone-stt | `@voicefield/react` | `phone-page.tsx` |
| field-registry | `@voicefield/react` | `field-registry.ts` |
| desktop-hook | `@voicefield/react` | `use-voicefield.ts`, `qr-popup.tsx` |
| server-api | `@voicefield/server` | `handler.ts` |

## Decisions

- **Spec granularity**: 7 capabilities matching the natural module boundaries. `server-api` overlaps with others but captures the HTTP contract specifically (routes, status codes, auth).
- **No tasks needed**: This is a spec-only change — no implementation work.
- **Spec style**: Requirements use RFC 2119 keywords (SHALL, SHOULD, MAY). Scenarios use GIVEN/WHEN/THEN format.
