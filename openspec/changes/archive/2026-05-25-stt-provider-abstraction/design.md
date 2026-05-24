## Context

The phone page (`phone-page.tsx`) directly imports and uses `@soniox/client` for STT. The core package has `STTProvider` and `STTConfig` interfaces that are never used. The server hardcodes `sonioxTempKey` in API responses. To support multiple STT engines, we need a provider abstraction that the phone page delegates to.

Current Soniox coupling points:
- `PairingResponse.sonioxTempKey` (core types)
- `phone-page.tsx` lines 13-14: `sonioxKey` state, direct `@soniox/client` import
- `handler.ts`: `generateSTTKey` config, `sonioxTempKey` in pair/refresh responses

## Goals / Non-Goals

**Goals:**
- Pluggable STT provider system — swap providers without rewriting phone page
- Ship `soniox` and `web-speech` as built-in providers
- Web Speech API works with zero server config (no API key needed)
- Provider selected per-session based on server configuration
- Clean up unused `STTProvider`/`STTConfig` types to match actual usage

**Non-Goals:**
- Server-side STT (Whisper etc.) — different data flow, future phase
- Runtime provider switching mid-session
- Provider-specific UI customization
- Exposing provider selection to end users (phone page)

## Decisions

### 1. Provider as factory function, not class

```typescript
type STTProviderFactory = (config: STTProviderConfig) => STTProviderInstance

interface STTProviderInstance {
  start(): Promise<void>
  stop(): Promise<void>
}

interface STTProviderConfig {
  sttKey: string | null
  language: string | string[]
  onPartial: (text: string) => void
  onFinal: (text: string) => void
  onError: (error: Error) => void
}
```

**Why factory over class**: Matches the functional style of the codebase (no classes except FieldRegistry). The factory receives callbacks at creation time rather than requiring `.on()` registration. Each `start()` call is self-contained.

**Alternative considered**: Event-emitter pattern (like current `STTProvider` interface in core). Rejected because it forces callers to manage subscription lifecycle and is more ceremony for no benefit.

### 2. Server tells phone which provider to use

The pair response includes `sttProvider: "soniox" | "web-speech"` (extensible string). The phone page maps this to a provider factory.

**Why server-driven**: The server knows whether it has STT keys configured. If `generateSttKey` is not provided, the server returns `sttProvider: "web-speech"` and `sttKey: null`. This way the phone page doesn't need to know about server config.

**Alternative considered**: Phone auto-detects (try Soniox, fall back to Web Speech). Rejected because it's fragile and delays startup.

### 3. Rename `sonioxTempKey` → `sttKey` everywhere (BREAKING)

API fields: `sonioxTempKey` → `sttKey`, `sonioxKeyExpiresAt` → `sttKeyExpiresAt`.
Config: `generateSTTKey` → `generateSttKey`.

**Why rename**: Provider-neutral naming. The old name leaks the implementation. This is a breaking change but we're pre-1.0 (0.1.x) so acceptable.

### 4. Provider implementations live in `packages/react/src/providers/`

```
packages/react/src/providers/
  index.ts          — registry + getProvider()
  soniox.ts         — SonioxProvider factory (dynamic import of @soniox/client)
  web-speech.ts     — WebSpeechProvider factory (uses webkitSpeechRecognition)
```

**Why in react package**: Providers run on the phone (browser), and the phone page lives in `@voicefield/react`. The core package stays dependency-free.

### 5. Web Speech API as default fallback

When the server has no `generateSttKey` configured, it:
- Still allows session creation (no 503)
- Returns `sttProvider: "web-speech"` and `sttKey: null` on pair
- Phone uses `webkitSpeechRecognition` — no external service needed

**Why default**: Makes voicefield instantly demoable without any API key. Currently you get a 503 if Soniox isn't configured.

### 6. Soniox provider uses dynamic import

`await import("@soniox/client")` — same as current code. This keeps `@soniox/client` as an optional peer dependency that's only loaded when the soniox provider is selected.

## Risks / Trade-offs

**Web Speech API quality varies by browser** → Document browser compatibility. Chrome has best support. Safari/Firefox may not support continuous mode well. This is a known limitation, not a blocker — it's a fallback, not the primary provider.

**Breaking API change (`sonioxTempKey` → `sttKey`)** → Pre-1.0, acceptable. Update docs, example app, and howto guide in same PR.

**`webkitSpeechRecognition` is not standard** → It's a de facto standard in Chrome/Edge/Safari. Fall back gracefully with a clear error if unavailable.

**Provider interface may need extension for future providers** → Keep the interface minimal now. `sttKey` + `language` covers Soniox and Web Speech. Future cloud providers (Deepgram, AssemblyAI) will likely need the same. Server-side STT is a different mode entirely (future phase).
