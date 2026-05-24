# How to: Use a Custom STT Provider

Voicefield ships with two built-in STT providers:

- **`soniox`** — High-quality cloud STT via Soniox WebSocket streaming (requires API key)
- **`web-speech`** — Browser-native Web Speech API (zero config, no API key needed)

The provider is selected automatically based on server configuration. You can also create your own provider.

## Built-in provider selection

If `generateSttKey` is configured, the server tells the phone to use `"soniox"`. Otherwise, it falls back to `"web-speech"` automatically:

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from "@voicefield/server"

// With Soniox (cloud STT)
const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSttKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 1800,
    })
    return { temporaryApiKey: result.api_key, expiresAt: Date.now() + 1800_000 }
  },
})

// Without — uses Web Speech API, no key needed
const { GET, POST, OPTIONS } = createVoicefieldHandler({})

export { GET, POST, OPTIONS }
```

## Creating a custom provider

A provider is a factory function that receives config and returns `start()`/`stop()` methods:

```typescript
import type { STTProviderConfig, STTProviderInstance } from "@voicefield/core"

export function createMyProvider(config: STTProviderConfig): STTProviderInstance {
  return {
    async start() {
      // 1. Request microphone access
      // 2. Connect to your STT service using config.sttKey
      // 3. On partial results: call config.onPartial(text)
      // 4. On final results: call config.onFinal(text)
      // 5. On errors: call config.onError(error)
    },
    async stop() {
      // Clean up: close connections, release mic
    },
  }
}
```

The `config` object includes:
- `sttKey: string | null` — API key from the server (null for keyless providers)
- `language: string | string[]` — BCP 47 language codes
- `onPartial(text)` — Call with interim recognition results
- `onFinal(text)` — Call with finalized text
- `onError(error)` — Call when something goes wrong

## What you keep from Voicefield

Even with a custom provider, you still get:
- Session management (pairing, expiry, cleanup)
- QR code / manual code pairing
- Field registration and switching
- SSE transcript relay to desktop
- Desktop hook (`useVoicefield`)

You only replace the STT provider — everything else stays the same.
