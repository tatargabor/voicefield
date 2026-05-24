## Tasks

### 1. Update core types

- [x] Rework `STTProvider` → `STTProviderInstance` with `start()` and `stop()` only
- [x] Add `STTProviderConfig` (sttKey, language, onPartial, onFinal, onError)
- [x] Add `STTProviderFactory` type
- [x] Rename `PairingResponse.sonioxTempKey` → `sttKey`
- [x] Add `PairingResponse.sttProvider` and `sttKeyExpiresAt` fields
- [x] Remove old `STTConfig` interface
- [x] Update exports in `index.ts`

### 2. Create provider implementations

- [x] `soniox.ts`: Factory function with dynamic `@soniox/client` import
- [x] `web-speech.ts`: Web Speech API provider with continuous/interim support
- [x] `index.ts`: Provider registry with `getProvider(name)`

### 3. Refactor phone page to use providers

- [x] Remove direct `@soniox/client` import and all Soniox-specific logic
- [x] Store `sttProvider` name from pair response
- [x] Rename `sonioxKey`/`sonioxKeyExpiresAt` state → `sttKey`/`sttKeyExpiresAt`
- [x] `startRecording()` uses `getProvider()` + factory pattern
- [x] Skip key refresh when `sttKey` is null

### 4. Update server handler

- [x] Rename config `generateSTTKey` → `generateSttKey`
- [x] Pair returns `sttProvider: "soniox"` or `"web-speech"` based on config
- [x] Remove 503 on POST /session when no STT configured
- [x] Rename `sonioxTempKey` → `sttKey` in refresh-key response

### 5. Update example app

- [x] Rename `generateSTTKey` → `generateSttKey` in handler config
- [x] Pass `undefined` when Soniox not configured (falls back to web-speech)

### 6. Update docs

- [x] Rewrite custom-stt-provider howto for new provider factory pattern
- [x] Update API reference: `sonioxTempKey` → `sttKey`, add `sttProvider` field

### 7. Add tests

- [x] Provider registry tests (getProvider returns factories, throws on unknown)
- [x] Web Speech provider tests (config, start, partial/final events, stop, browser compat error)
- [x] Added vitest to react package + workspace config
