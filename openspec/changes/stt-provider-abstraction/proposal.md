## Why

Voicefield is hardcoded to Soniox for speech-to-text. Users can't try the product without a Soniox account, and swapping STT providers requires rewriting the phone page. The `STTProvider` interface exists in `@voicefield/core` but is unused — the phone page directly imports `@soniox/client`. We need a pluggable provider system so users can choose their STT engine, starting with Web Speech API as a zero-config fallback.

## What Changes

- **BREAKING**: Rename `sonioxTempKey` to `sttKey` in `PairingResponse` and all API responses
- **BREAKING**: Rename `generateSTTKey` to `generateSttKey` in `VoicefieldServerConfig`
- Introduce `STTProviderFactory` pattern in `@voicefield/react` — providers are functions that create an STT session from config
- Ship two built-in providers: `soniox` (current behavior, requires `@soniox/client`) and `web-speech` (browser-native, zero deps)
- The phone page selects a provider based on pairing response (server tells phone which provider to use)
- Rework the unused `STTProvider`/`STTConfig` types in core to match the real needs
- Web Speech API becomes the default when no `generateSttKey` is configured on the server

## Capabilities

### New Capabilities
- `stt-providers`: STT provider abstraction — factory pattern, provider interface, built-in providers (soniox, web-speech), provider selection logic

### Modified Capabilities
- `phone-stt`: Phone page uses provider abstraction instead of direct Soniox import; provider is selected based on pairing response
- `server-api`: Rename `sonioxTempKey`→`sttKey` in API responses; `generateSTTKey`→`generateSttKey` in config; server indicates provider type in pair response; allow sessions without STT key (for web-speech)
- `pairing`: Pair response includes `sttProvider` field indicating which provider the phone should use

## Impact

- `packages/core/src/types.ts` — rework `STTProvider`, `STTConfig`, `PairingResponse` types
- `packages/react/src/phone-page.tsx` — refactor STT init to use provider factory
- `packages/react/src/providers/` — new directory with soniox + web-speech implementations
- `packages/server/src/handler.ts` — rename key fields, add provider indicator to pair response
- `apps/example/` — update API route to use new config name
- `apps/web/` — no changes (re-exports Mic)
- `docs/howto/custom-stt-provider.md` — update to reflect new provider API
