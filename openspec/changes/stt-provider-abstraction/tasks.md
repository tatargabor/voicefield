## Tasks

### 1. Update core types

**Files**: `packages/core/src/types.ts`, `packages/core/src/index.ts`

- Rework `STTProvider` → `STTProviderInstance` with `start()` and `stop()` only
- Add `STTProviderConfig` (sttKey, language, onPartial, onFinal, onError)
- Add `STTProviderFactory` type: `(config: STTProviderConfig) => STTProviderInstance`
- Rename `PairingResponse.sonioxTempKey` → `sttKey`
- Add `PairingResponse.sttProvider` field (string)
- Add `PairingResponse.sttKeyExpiresAt` field (number | null)
- Remove old `STTConfig` interface
- Update exports in `index.ts`

### 2. Create provider implementations

**Files**: `packages/react/src/providers/index.ts`, `packages/react/src/providers/soniox.ts`, `packages/react/src/providers/web-speech.ts`

- `soniox.ts`: Extract current Soniox logic from phone-page.tsx into a factory function. Dynamic import of `@soniox/client`. Maps Soniox result events to onPartial/onFinal callbacks.
- `web-speech.ts`: Implement Web Speech API provider. Uses `SpeechRecognition` / `webkitSpeechRecognition`. Sets `continuous: true`, `interimResults: true`. Maps `onresult` events to onPartial/onFinal. Handles browser compatibility error.
- `index.ts`: Provider registry — `getProvider(name: string): STTProviderFactory`. Built-in: `"soniox"`, `"web-speech"`.

### 3. Refactor phone page to use providers

**Files**: `packages/react/src/phone-page.tsx`

- Remove direct `@soniox/client` import and all Soniox-specific logic
- Store `sttProvider` name from pair response
- Rename `sonioxKey`/`sonioxKeyExpiresAt` state → `sttKey`/`sttKeyExpiresAt`
- In `startRecording()`: look up provider via `getProvider(providerName)`, create instance with config, call `start()`
- Skip key refresh when `sttKey` is null
- Microphone access: move into provider (provider handles getUserMedia)
- Update exports if needed

### 4. Update server handler

**Files**: `packages/server/src/handler.ts`

- Rename config `generateSTTKey` → `generateSttKey`
- In POST /pair: if `generateSttKey` exists, call it and return `sttProvider: "soniox"`, `sttKey`, `sttKeyExpiresAt`. If not, return `sttProvider: "web-speech"`, `sttKey: null`, `sttKeyExpiresAt: null`.
- Remove 503 on POST /session when no STT is configured (allow sessionless STT)
- In POST /refresh-key: rename `sonioxTempKey` → `sttKey` in response
- Keep backward compat note: none needed (pre-1.0)

### 5. Update example app

**Files**: `apps/example/app/api/voice/[...voicefield]/route.ts`

- Rename `generateSTTKey` → `generateSttKey` in handler config

### 6. Update docs

**Files**: `docs/howto/custom-stt-provider.md`, `docs/api-reference.md`

- Update custom-stt-provider howto to describe new provider factory pattern
- Update API reference: `sonioxTempKey` → `sttKey`, add `sttProvider` field to pair response

### 7. Add tests

**Files**: `packages/react/src/__tests__/providers.test.ts`, `packages/server/src/__tests__/handler.test.ts`

- Unit test: web-speech provider (mock SpeechRecognition)
- Unit test: soniox provider (mock @soniox/client import)
- Unit test: provider registry (getProvider returns correct factory, throws on unknown)
- Update existing server handler tests for renamed fields
