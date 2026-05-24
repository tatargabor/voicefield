# @voicefield/core

Shared types and utilities for the Voicefield ecosystem. Zero runtime dependencies.

## Install

```bash
npm install @voicefield/core
```

## What's in the box

### Types

```typescript
import type {
  VoicefieldConfig,    // Hook configuration
  SessionState,        // "created" | "paired" | "active" | "expired"
  VoiceField,          // { id: string; label: string }
  TranscriptMessage,   // Incoming transcript from phone
  SessionCommand,      // Commands sent to phone (e.g., switch_field)
  PairingResponse,     // Pair endpoint response shape
  SessionCreateResponse,
  SSEEvent,            // Union of all SSE event types
  STTProvider,         // Interface for custom STT providers
  STTConfig,           // STT initialization config
} from "@voicefield/core"
```

### Utilities

```typescript
import {
  formatPairingCode,    // "123456" → "123 456"
  normalizePairingCode, // "123 456" → "123456"
  isValidPairingCode,   // validates 6-digit format
  buildQRUrl,           // builds the phone page URL with params
  parseQRUrl,           // extracts server/code/secret from URL
} from "@voicefield/core"
```

## Usage

This package is primarily consumed by `@voicefield/react` and `@voicefield/server`. You typically don't need to install it directly unless you're building a custom integration (e.g., non-React frontend or custom server framework).

### Building a custom QR URL

```typescript
import { buildQRUrl } from "@voicefield/core"

const url = buildQRUrl(
  "https://voicefield.dev",          // phone page base URL
  "https://myapp.com/api/voice",     // your server URL (phone calls this)
  "123456",                          // 6-digit pairing code
  "abc123...",                       // session secret
  "https://myapp.com"               // origin (for relative serverUrl resolution)
)
// → "https://voicefield.dev/mic?server=https%3A%2F%2Fmyapp.com%2Fapi%2Fvoice&code=123456&secret=abc123..."
```

### Validating pairing codes

```typescript
import { isValidPairingCode, normalizePairingCode } from "@voicefield/core"

const userInput = "123 456"
const code = normalizePairingCode(userInput) // "123456"
if (isValidPairingCode(code)) {
  // proceed with pairing
}
```

## License

MIT
