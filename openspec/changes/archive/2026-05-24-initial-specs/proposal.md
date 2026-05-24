## Why

Voicefield has been built without formal specifications. As the project matures and gains contributors, we need a canonical spec baseline that captures all existing capabilities — session lifecycle, cryptographic pairing, relay protocol, phone STT client, desktop React integration, and field management. This enables structured changes going forward via OpenSpec.

## What Changes

- No code changes — this is a documentation-only change
- Creates initial spec files for every major capability in the system
- Establishes the spec structure for future feature work

## Capabilities

### New Capabilities
- `session-management`: In-memory session store — lifecycle states, TTLs, creation, expiry, cleanup
- `pairing`: Cryptographic pairing flow — QR code generation, 6-digit codes, secret validation, token issuance
- `transcript-relay`: Real-time transcript delivery — phone POST, SSE to desktop, event buffering, reconnect
- `phone-stt`: Phone-side speech-to-text — Soniox client-side STT, recording controls, silence detection, key refresh
- `field-registry`: Multi-field management — registration, active field tracking, text injection (partial/final), field switching
- `desktop-hook`: React hook for desktop integration — session lifecycle, SSE subscription, QR display, LAN auto-detection
- `server-api`: HTTP API surface — all route handlers, CORS, auth, error responses

### Modified Capabilities
(none — no existing specs)

## Impact

- No code impact — spec-only change
- Creates `openspec/specs/` directory structure with 7 capability specs
- Future changes will reference and modify these specs
